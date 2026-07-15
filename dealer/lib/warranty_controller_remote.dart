part of 'warranty_controller.dart';

extension _WarrantyControllerRemote on WarrantyController {
  Future<bool> _loadRemoteState() async {
    final token = await _readAccessToken();
    if (token == null) {
      return false;
    }

    final cachedActivationsBySerial = <String, WarrantyActivationRecord>{
      for (final activation in _activations)
        _normalizeSerial(activation.serial): activation,
    };
    final cachedImportedBySerial = <String, ImportedSerialRecord>{
      ..._importedSerialsByNormalized,
    };

    try {
      final serialResponse = await _client.get(
        DealerApiConfig.resolveApiUri('/dealer/serials'),
        headers: buildAuthorizedHeaders(token),
      );
      final serialPayload = decodeJsonBody(serialResponse.body);
      if (serialResponse.statusCode >= 400) {
        throw WarrantySyncException(
          _extractErrorMessage(
            serialPayload,
            fallback: warrantySyncMessageToken(
              WarrantySyncMessageCode.serialSyncFailed,
            ),
          ),
        );
      }
      final serialData = serialPayload['data'];
      if (serialData is! List) {
        throw WarrantySyncException(
          warrantySyncMessageToken(
            WarrantySyncMessageCode.invalidSerialPayload,
          ),
        );
      }

      final nextImportedSerials = <ImportedSerialRecord>[];
      final nextRemoteSerialIds = <String, int>{};
      final importedBySerial = <String, ImportedSerialRecord>{};
      for (final entry in serialData.whereType<Map<String, dynamic>>()) {
        final record = _mapRemoteSerial(
          entry,
          cachedImportedBySerial,
          nextRemoteSerialIds,
        );
        if (record == null) {
          continue;
        }
        final normalized = _normalizeSerial(record.serial);
        nextImportedSerials.add(record);
        importedBySerial[normalized] = record;
      }

      final warrantyResponse = await _client.get(
        DealerApiConfig.resolveApiUri('/dealer/warranties'),
        headers: buildAuthorizedHeaders(token),
      );
      final warrantyPayload = decodeJsonBody(warrantyResponse.body);
      if (warrantyResponse.statusCode >= 400) {
        throw WarrantySyncException(
          _extractErrorMessage(
            warrantyPayload,
            fallback: warrantySyncMessageToken(
              WarrantySyncMessageCode.syncFailed,
            ),
          ),
        );
      }
      final warrantyData = warrantyPayload['data'];
      if (warrantyData is! List) {
        throw WarrantySyncException(
          warrantySyncMessageToken(
            WarrantySyncMessageCode.invalidWarrantyPayload,
          ),
        );
      }

      final nextActivations = <WarrantyActivationRecord>[];
      final nextRemoteWarrantyIds = <String, int>{};
      for (final entry in warrantyData.whereType<Map<String, dynamic>>()) {
        final activation = _mapRemoteActivation(
          entry,
          importedBySerial,
          cachedActivationsBySerial,
          nextRemoteWarrantyIds,
        );
        if (activation != null) {
          nextActivations.add(activation);
        }
      }

      _replaceImportedSerials(nextImportedSerials);
      _replaceActivations(nextActivations);
      _syncMapContents(_remoteSerialIds, nextRemoteSerialIds);
      _syncMapContents(_remoteWarrantyIds, nextRemoteWarrantyIds);
      _sanitizeState();
      _lastSyncMessage = null;
      _lastRemoteSyncAt = DateTime.now();
      _usingLocalFallback = false;
      return true;
    } catch (error) {
      _lastSyncMessage = _normalizeWarrantySyncFailure(
        error,
        fallbackCode: WarrantySyncMessageCode.syncFailed,
      );
      return false;
    }
  }

  ImportedSerialRecord? _mapRemoteSerial(
    Map<String, dynamic> json,
    Map<String, ImportedSerialRecord> cachedImportedBySerial,
    Map<String, int> nextRemoteSerialIds,
  ) {
    final serial = _normalizeSerial(normalizeString(json['serial']) ?? '');
    if (serial.isEmpty) {
      return null;
    }
    final remoteId = parseInt(json['id']);
    if (remoteId > 0) {
      nextRemoteSerialIds[serial] = remoteId;
    }

    final cached = cachedImportedBySerial[serial];
    final productId = parseInt(json['productId']) > 0
        ? parseInt(json['productId']).toString()
        : (cached?.productId ?? '');
    final remoteOrderId = parseInt(json['orderId']);
    final orderCode = remoteOrderId > 0
        ? (_orderCodeForRemoteId?.call(remoteOrderId) ??
              cached?.orderId ??
              remoteOrderId.toString())
        : (cached?.orderId ?? '');
    final product = productId.isEmpty ? null : _productLookup?.call(productId);

    return ImportedSerialRecord(
      serial: serial,
      orderId: orderCode,
      productId: productId,
      productName:
          normalizeString(json['productName']) ??
          cached?.productName ??
          product?.name ??
          'Product',
      productSku:
          normalizeString(json['productSku']) ??
          cached?.productSku ??
          product?.sku ??
          productId,
      importedAt:
          _parseDateTimeValue(json['importedAt']) ??
          cached?.importedAt ??
          DateTime.now(),
      status: parseImportedSerialStatus(
        normalizeString(json['status']) ?? cached?.status.name,
      ),
      warehouseId:
          normalizeString(json['warehouseId']) ?? cached?.warehouseId ?? 'main',
      warehouseName:
          normalizeString(json['warehouseName']) ??
          cached?.warehouseName ??
          'Kho',
    );
  }

  WarrantyActivationRecord? _mapRemoteActivation(
    Map<String, dynamic> json,
    Map<String, ImportedSerialRecord> importedBySerial,
    Map<String, WarrantyActivationRecord> cachedActivationsBySerial,
    Map<String, int> nextRemoteWarrantyIds,
  ) {
    final serial = _normalizeSerial(normalizeString(json['serial']) ?? '');
    if (serial.isEmpty) {
      return null;
    }

    final remoteId = parseInt(json['id']);
    if (remoteId > 0) {
      nextRemoteWarrantyIds[serial] = remoteId;
    }

    final cached = cachedActivationsBySerial[serial];
    final imported = importedBySerial[serial];
    final remoteOrderId = parseInt(json['orderId']);
    final directOrderCode = normalizeString(json['orderCode']);
    final orderCode =
        directOrderCode ??
        (remoteOrderId > 0
            ? (_orderCodeForRemoteId?.call(remoteOrderId) ??
                  imported?.orderId ??
                  cached?.orderId ??
                  remoteOrderId.toString())
            : (imported?.orderId ?? cached?.orderId ?? ''));
    final order = orderCode.isEmpty ? null : _orderLookup?.call(orderCode);
    final productId =
        normalizeString(json['productId']) ??
        imported?.productId ??
        cached?.productId ??
        '';
    final product = productId.isEmpty ? null : _productLookup?.call(productId);
    final purchaseDate = _normalizeLocalDate(
      _parseDateTimeValue(json['purchaseDate']) ??
          _parseDateTimeValue(json['warrantyStart']) ??
          cached?.purchaseDate ??
          DateTime.now(),
    );
    final activatedAt =
        _parseDateTimeValue(json['createdAt']) ??
        cached?.activatedAt ??
        purchaseDate;
    final rawWarrantyEnd = _parseDateTimeValue(json['warrantyEnd']);
    final warrantyEnd = rawWarrantyEnd == null
        ? null
        : _normalizeLocalDate(rawWarrantyEnd);

    return WarrantyActivationRecord(
      orderId: orderCode,
      productId: productId,
      productName:
          normalizeString(json['productName']) ??
          imported?.productName ??
          cached?.productName ??
          product?.name ??
          'Product',
      productSku:
          normalizeString(json['productSku']) ??
          imported?.productSku ??
          cached?.productSku ??
          product?.sku ??
          productId,
      serial: serial,
      customerName: _resolveCustomerField(
        normalizeString(json['customerName']) ?? cached?.customerName,
        order?.receiverName,
      ),
      customerEmail: _resolveCustomerField(
        normalizeString(json['customerEmail']) ?? cached?.customerEmail,
        '',
      ),
      customerPhone: _resolveCustomerField(
        normalizeString(json['customerPhone']) ?? cached?.customerPhone,
        order?.receiverPhone,
      ),
      customerAddress: _resolveCustomerField(
        normalizeString(json['customerAddress']) ?? cached?.customerAddress,
        order?.receiverAddress,
      ),
      warrantyMonths: warrantyEnd != null
          ? _resolveWarrantyMonths(purchaseDate, warrantyEnd)
          : (cached?.warrantyMonths ??
                product?.warrantyMonths ??
                _resolveWarrantyMonths(purchaseDate, warrantyEnd)),
      activatedAt: activatedAt,
      purchaseDate: purchaseDate,
      warrantyEnd: warrantyEnd,
    );
  }

  Future<void> _createRemoteActivation(WarrantyActivationRecord record) async {
    var remoteSerialId = _remoteSerialIds[_normalizeSerial(record.serial)];
    if (remoteSerialId == null || remoteSerialId <= 0) {
      final reloaded = await _loadRemoteState();
      if (!reloaded) {
        throw WarrantySyncException(
          _lastSyncMessage ??
              warrantySyncMessageToken(
                WarrantySyncMessageCode.serialSyncFailed,
              ),
        );
      }
      remoteSerialId = _remoteSerialIds[_normalizeSerial(record.serial)];
      if (remoteSerialId == null || remoteSerialId <= 0) {
        throw WarrantySyncException(
          warrantySyncMessageToken(
            WarrantySyncMessageCode.remoteSerialNotFound,
          ),
        );
      }
    }

    final response = await _client.post(
      DealerApiConfig.resolveApiUri('/warranty-activation'),
      headers: await _authorizedJsonHeaders(),
      body: jsonEncode(<String, dynamic>{
        'productSerialId': remoteSerialId,
        'customerName': record.customerName,
        'customerEmail': record.customerEmail,
        'customerPhone': record.customerPhone,
        'customerAddress': record.customerAddress,
        'purchaseDate': _toIsoDate(record.purchaseDate),
      }),
    );
    final payload = decodeJsonBody(response.body);
    if (response.statusCode >= 400) {
      throw WarrantySyncException(
        _extractErrorMessage(
          payload,
          fallback: warrantySyncMessageToken(
            WarrantySyncMessageCode.activationFailed,
          ),
        ),
      );
    }

    final data = payload['data'];
    if (data is Map<String, dynamic>) {
      final remoteWarrantyId = parseInt(data['id']);
      if (remoteWarrantyId > 0) {
        _remoteWarrantyIds[_normalizeSerial(record.serial)] = remoteWarrantyId;
      }
    }
  }
}

String _normalizeSerial(String serial) {
  return serial.trim().toUpperCase();
}
