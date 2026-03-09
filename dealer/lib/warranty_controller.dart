import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'models.dart';

class WarrantyActivationRecord {
  const WarrantyActivationRecord({
    required this.orderId,
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.serial,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddress,
    required this.warrantyMonths,
    required this.activatedAt,
  });

  final String orderId;
  final String productId;
  final String productName;
  final String productSku;
  final String serial;
  final String customerName;
  final String customerPhone;
  final String customerAddress;
  final int warrantyMonths;
  final DateTime activatedAt;

  DateTime get startsAt => activatedAt;

  DateTime get expiresAt => DateTime(
    activatedAt.year,
    activatedAt.month + warrantyMonths,
    activatedAt.day,
    activatedAt.hour,
    activatedAt.minute,
    activatedAt.second,
  );
}

class ImportedSerialRecord {
  const ImportedSerialRecord({
    required this.serial,
    required this.orderId,
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.importedAt,
    this.warehouseId = 'main',
    this.warehouseName = 'Kho',
  });

  final String serial;
  final String orderId;
  final String productId;
  final String productName;
  final String productSku;
  final DateTime importedAt;
  final String warehouseId;
  final String warehouseName;

  ImportedSerialRecord copyWith({
    String? serial,
    String? orderId,
    String? productId,
    String? productName,
    String? productSku,
    DateTime? importedAt,
    String? warehouseId,
    String? warehouseName,
  }) {
    return ImportedSerialRecord(
      serial: serial ?? this.serial,
      orderId: orderId ?? this.orderId,
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      productSku: productSku ?? this.productSku,
      importedAt: importedAt ?? this.importedAt,
      warehouseId: warehouseId ?? this.warehouseId,
      warehouseName: warehouseName ?? this.warehouseName,
    );
  }
}

class WarrantySerialImportResult {
  const WarrantySerialImportResult({
    required this.addedCount,
    required this.duplicateCount,
    required this.invalidCount,
    required this.overLimitCount,
    this.errorMessage,
  });

  final int addedCount;
  final int duplicateCount;
  final int invalidCount;
  final int overLimitCount;
  final String? errorMessage;

  bool get hasError => errorMessage != null && errorMessage!.trim().isNotEmpty;
}

class WarrantyController extends ChangeNotifier {
  static const String _activationsStorageKey = 'dealer_warranty_activations_v1';
  static const String _serialsStorageKey = 'dealer_warranty_serials_v1';
  static const String _defectiveStorageKey = 'dealer_warranty_defective_v1';

  WarrantyController({
    AuthStorage? authStorage,
    http.Client? client,
    String? Function(int remoteOrderId)? orderCodeForRemoteId,
    int? Function(String orderCode)? remoteOrderIdForOrderCode,
    Order? Function(String orderCode)? orderLookup,
    Product? Function(String productId)? productLookup,
  }) : _activations = <WarrantyActivationRecord>[],
       _importedSerials = <ImportedSerialRecord>[],
       _defectiveSerials = <String>{},
       _orderCodeForRemoteId = orderCodeForRemoteId,
       _remoteOrderIdForOrderCode = remoteOrderIdForOrderCode,
       _orderLookup = orderLookup,
       _productLookup = productLookup {
    _authStorage = authStorage ?? AuthStorage();
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: client ?? http.Client(),
    );
    _sanitizeState();
  }

  final List<WarrantyActivationRecord> _activations;
  final List<ImportedSerialRecord> _importedSerials;
  final Set<String> _defectiveSerials;
  late final AuthStorage _authStorage;
  late final http.Client _client;
  final String? Function(int remoteOrderId)? _orderCodeForRemoteId;
  final int? Function(String orderCode)? _remoteOrderIdForOrderCode;
  final Order? Function(String orderCode)? _orderLookup;
  final Product? Function(String productId)? _productLookup;
  final Map<String, int> _remoteSerialIds = <String, int>{};
  final Map<String, int> _remoteWarrantyIds = <String, int>{};

  Future<void> load({bool forceRefresh = false}) async {
    final loadedLocal = await _loadLocalState();
    final loadedRemote = await _loadRemoteState();
    if (!loadedRemote && !loadedLocal && forceRefresh) {
      _resetToEmptyState();
    }
    _sanitizeState();
    notifyListeners();
  }

  Future<void> clearSessionData() async {
    _resetToEmptyState();
    _remoteSerialIds.clear();
    _remoteWarrantyIds.clear();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_activationsStorageKey);
    await prefs.remove(_serialsStorageKey);
    await prefs.remove(_defectiveStorageKey);
    notifyListeners();
  }

  bool isDefectiveSerial(String serial) {
    return _defectiveSerials.contains(_normalizeSerial(serial));
  }

  Set<String> defectiveSerialSetForProduct(String productId) {
    final serials = <String>{};
    for (final record in _importedSerials) {
      if (record.productId != productId) {
        continue;
      }
      final normalized = _normalizeSerial(record.serial);
      if (_defectiveSerials.contains(normalized)) {
        serials.add(normalized);
      }
    }
    return serials;
  }

  void markSerialDefective({required String serial, required bool defective}) {
    final normalized = _normalizeSerial(serial);
    if (_findImportedSerialIndex(normalized) < 0) {
      return;
    }
    if (_activatedSerialSet().contains(normalized)) {
      return;
    }
    final changed = _applyLocalDefectiveState(
      normalizedSerial: normalized,
      defective: defective,
    );
    if (changed) {
      unawaited(_persist());
      notifyListeners();
    }
  }

  Future<String?> setSerialDefective({
    required String serial,
    required bool defective,
  }) async {
    final normalized = _normalizeSerial(serial);
    if (normalized.isEmpty) {
      return 'Serial khong hop le.';
    }
    if (_findImportedSerialIndex(normalized) < 0) {
      return 'Serial $normalized chua duoc nhap kho.';
    }
    if (_activatedSerialSet().contains(normalized)) {
      return 'Serial $normalized da duoc kich hoat, khong the danh dau loi.';
    }

    final alreadyDefective = _defectiveSerials.contains(normalized);
    if (alreadyDefective == defective) {
      return null;
    }

    if (await _canUseRemoteApi()) {
      var remoteSerialId = _remoteSerialIds[normalized];
      if (remoteSerialId == null || remoteSerialId <= 0) {
        final reloaded = await _loadRemoteState();
        if (!reloaded) {
          return 'Khong the dong bo serial.';
        }
        remoteSerialId = _remoteSerialIds[normalized];
        if (remoteSerialId == null || remoteSerialId <= 0) {
          return 'Khong tim thay serial tren he thong.';
        }
      }

      try {
        final response = await _client.patch(
          Uri.parse(
            DealerApiConfig.resolveUrl(
              '/api/dealer/serials/$remoteSerialId/status',
            ),
          ),
          headers: await _authorizedJsonHeaders(),
          body: jsonEncode(<String, dynamic>{
            'status': defective ? 'DEFECTIVE' : 'AVAILABLE',
          }),
        );
        final payload = _decodeBody(response.body);
        if (response.statusCode >= 400) {
          return _extractErrorMessage(
            payload,
            fallback: 'Khong the dong bo serial.',
          );
        }

        final data = payload['data'];
        if (data is Map<String, dynamic>) {
          final importedBySerial = <String, ImportedSerialRecord>{
            for (final record in _importedSerials)
              _normalizeSerial(record.serial): record,
          };
          final nextRemoteSerialIds = <String, int>{..._remoteSerialIds};
          final updatedRecord = _mapRemoteSerial(
            data,
            importedBySerial,
            nextRemoteSerialIds,
          );
          if (updatedRecord != null) {
            _upsertImportedSerials(<ImportedSerialRecord>[updatedRecord]);
            _remoteSerialIds
              ..clear()
              ..addAll(nextRemoteSerialIds);
          }
        }

        _applyRemoteDefectiveState(
          normalizedSerial: normalized,
          defective: defective,
        );
        _sanitizeState();
        await _persist();
        notifyListeners();
        return null;
      } catch (error) {
        return _describeError(error, fallback: 'Khong the dong bo serial.');
      }
    }

    return 'Khong the dong bo serial.';
  }

  List<ImportedSerialRecord> importedSerialsForProduct(String productId) {
    final list = _importedSerials
        .where((record) => record.productId == productId)
        .toList(growable: false);
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  List<WarrantyActivationRecord> get activations {
    final list = List<WarrantyActivationRecord>.from(_activations);
    list.sort((a, b) => b.activatedAt.compareTo(a.activatedAt));
    return list;
  }

  List<WarrantyActivationRecord> recentActivations({int limit = 20}) {
    final list = activations;
    if (list.length <= limit) {
      return list;
    }
    return list.take(limit).toList(growable: false);
  }

  List<WarrantyActivationRecord> activationsForOrder(String orderId) {
    final list = _activations
        .where((activation) => activation.orderId == orderId)
        .toList(growable: false);
    list.sort((a, b) => b.activatedAt.compareTo(a.activatedAt));
    return list;
  }

  List<WarrantyActivationRecord> activationsForItem(
    String orderId,
    String productId,
  ) {
    final list = _activations
        .where(
          (activation) =>
              activation.orderId == orderId &&
              activation.productId == productId,
        )
        .toList(growable: false);
    list.sort((a, b) => a.activatedAt.compareTo(b.activatedAt));
    return list;
  }

  List<ImportedSerialRecord> get importedSerials {
    final list = List<ImportedSerialRecord>.from(_importedSerials);
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  List<ImportedSerialRecord> recentImportedSerials({int limit = 50}) {
    final list = importedSerials;
    if (list.length <= limit) {
      return list;
    }
    return list.take(limit).toList(growable: false);
  }

  int get importedSerialCount => _importedSerials.length;

  int get activatedImportedSerialCount {
    final activated = _activatedSerialSet();
    return _importedSerials
        .where((record) => activated.contains(_normalizeSerial(record.serial)))
        .length;
  }

  int get defectiveImportedSerialCount => _defectiveSerials.length;

  int get availableImportedSerialCount {
    final activated = _activatedSerialSet();
    return _importedSerials.where((record) {
      final normalized = _normalizeSerial(record.serial);
      return !activated.contains(normalized) &&
          !_defectiveSerials.contains(normalized);
    }).length;
  }

  List<ImportedSerialRecord> importedSerialsForOrder(String orderId) {
    final list = _importedSerials
        .where((record) => record.orderId == orderId)
        .toList(growable: false);
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  List<ImportedSerialRecord> importedSerialsForOrderItem(
    String orderId,
    String productId,
  ) {
    final list = _importedSerials
        .where(
          (record) =>
              record.orderId == orderId && record.productId == productId,
        )
        .toList(growable: false);
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  int importedSerialCountForOrderItem(String orderId, String productId) {
    return _importedSerials.where((record) {
      return record.orderId == orderId && record.productId == productId;
    }).length;
  }

  List<ImportedSerialRecord> availableImportedSerialsForOrderItem(
    String orderId,
    String productId,
  ) {
    final activated = _activatedSerialSet();
    final list = _importedSerials.where((record) {
      if (record.orderId != orderId || record.productId != productId) {
        return false;
      }
      final normalized = _normalizeSerial(record.serial);
      return !activated.contains(normalized) &&
          !_defectiveSerials.contains(normalized);
    }).toList();
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  int availableImportedSerialCountForOrderItem(
    String orderId,
    String productId,
  ) {
    return availableImportedSerialsForOrderItem(orderId, productId).length;
  }

  ImportedSerialRecord? findImportedSerial(String serial) {
    final normalized = _normalizeSerial(serial);
    for (final record in _importedSerials) {
      if (_normalizeSerial(record.serial) == normalized) {
        return record;
      }
    }
    return null;
  }

  bool serialExists(String serial) {
    final normalized = _normalizeSerial(serial);
    return _activations.any(
      (activation) => _normalizeSerial(activation.serial) == normalized,
    );
  }

  String? validateSerialForActivation({
    required String serial,
    required String productId,
    required String productName,
    required String orderId,
  }) {
    final normalized = _normalizeSerial(serial);
    if (normalized.isEmpty) {
      return 'Serial khong hop le.';
    }

    final imported = findImportedSerial(normalized);
    if (imported == null) {
      return 'Serial $normalized chua duoc nhap kho.';
    }
    if (imported.productId != productId) {
      return 'Serial $normalized khong thuoc san pham $productName.';
    }

    if (imported.orderId != orderId) {
      return 'Serial $normalized thuoc don ${imported.orderId}, khong thuoc don $orderId.';
    }

    if (_defectiveSerials.contains(normalized)) {
      return 'Serial $normalized dang o trang thai loi, khong the kich hoat.';
    }

    if (serialExists(normalized)) {
      return 'Serial $normalized da duoc kich hoat truoc do.';
    }

    return null;
  }

  Future<WarrantySerialImportResult> importSerials({
    required String orderId,
    required String productId,
    required String productName,
    required String productSku,
    required Iterable<String> serials,
    int? maxToAdd,
    String warehouseId = 'main',
    String warehouseName = 'Kho',
  }) async {
    final prepared = _prepareSerialImport(
      serials: serials,
      maxToAdd: maxToAdd,
      alreadyImported: (normalizedSerial) =>
          _findImportedSerialIndex(normalizedSerial) >= 0,
    );
    if (prepared.acceptedSerials.isEmpty) {
      return WarrantySerialImportResult(
        addedCount: 0,
        duplicateCount: prepared.duplicateCount,
        invalidCount: prepared.invalidCount,
        overLimitCount: prepared.overLimitCount,
      );
    }

    final safeWarehouseId = warehouseId.trim().isEmpty
        ? 'main'
        : warehouseId.trim();
    final safeWarehouseName = warehouseName.trim().isEmpty
        ? 'Kho'
        : warehouseName.trim();

    if (await _canUseRemoteApi()) {
      final remoteProductId = _parseInt(productId);
      if (remoteProductId <= 0) {
        return WarrantySerialImportResult(
          addedCount: 0,
          duplicateCount: prepared.duplicateCount,
          invalidCount: prepared.invalidCount,
          overLimitCount: prepared.overLimitCount,
          errorMessage: 'Khong the xac dinh san pham de dong bo serial.',
        );
      }

      final remoteOrderId = _remoteOrderIdForOrderCode?.call(orderId);
      if (orderId.trim().isNotEmpty && remoteOrderId == null) {
        return WarrantySerialImportResult(
          addedCount: 0,
          duplicateCount: prepared.duplicateCount,
          invalidCount: prepared.invalidCount,
          overLimitCount: prepared.overLimitCount,
          errorMessage: 'Khong the xac dinh don hang de dong bo serial.',
        );
      }

      try {
        final response = await _client.post(
          Uri.parse(DealerApiConfig.resolveUrl('/api/dealer/serials/import')),
          headers: await _authorizedJsonHeaders(),
          body: jsonEncode(<String, dynamic>{
            'productId': remoteProductId,
            ...?remoteOrderId == null
                ? null
                : <String, dynamic>{'orderId': remoteOrderId},
            'status': 'AVAILABLE',
            'warehouseId': safeWarehouseId,
            'warehouseName': safeWarehouseName,
            'serials': prepared.acceptedSerials,
          }),
        );
        final payload = _decodeBody(response.body);
        if (response.statusCode >= 400) {
          return WarrantySerialImportResult(
            addedCount: 0,
            duplicateCount: prepared.duplicateCount,
            invalidCount: prepared.invalidCount,
            overLimitCount: prepared.overLimitCount,
            errorMessage: _extractErrorMessage(
              payload,
              fallback: 'Khong the dong bo serial.',
            ),
          );
        }

        final data = payload['data'];
        if (data is! List) {
          return WarrantySerialImportResult(
            addedCount: 0,
            duplicateCount: prepared.duplicateCount,
            invalidCount: prepared.invalidCount,
            overLimitCount: prepared.overLimitCount,
            errorMessage: 'Phan hoi serial khong hop le.',
          );
        }

        final importedBySerial = <String, ImportedSerialRecord>{
          for (final record in _importedSerials)
            _normalizeSerial(record.serial): record,
        };
        final nextRemoteSerialIds = <String, int>{..._remoteSerialIds};
        final nextImportedRecords = <ImportedSerialRecord>[];
        for (final entry in data.whereType<Map<String, dynamic>>()) {
          final record = _mapRemoteSerial(
            entry,
            importedBySerial,
            nextRemoteSerialIds,
          );
          if (record == null) {
            continue;
          }
          final normalized = _normalizeSerial(record.serial);
          importedBySerial[normalized] = record;
          nextImportedRecords.add(record);
        }

        _remoteSerialIds
          ..clear()
          ..addAll(nextRemoteSerialIds);
        _upsertImportedSerials(nextImportedRecords);
        _sanitizeState();
        await _persist();
        notifyListeners();

        return WarrantySerialImportResult(
          addedCount: nextImportedRecords.length,
          duplicateCount: prepared.duplicateCount,
          invalidCount: prepared.invalidCount,
          overLimitCount: prepared.overLimitCount,
        );
      } catch (error) {
        return WarrantySerialImportResult(
          addedCount: 0,
          duplicateCount: prepared.duplicateCount,
          invalidCount: prepared.invalidCount,
          overLimitCount: prepared.overLimitCount,
          errorMessage: _describeError(
            error,
            fallback: 'Khong the dong bo serial.',
          ),
        );
      }
    }

    return WarrantySerialImportResult(
      addedCount: 0,
      duplicateCount: prepared.duplicateCount,
      invalidCount: prepared.invalidCount,
      overLimitCount: prepared.overLimitCount,
      errorMessage: 'Khong the dong bo serial.',
    );
  }

  Future<bool> addActivations(
    List<WarrantyActivationRecord> newActivations,
  ) async {
    if (newActivations.isEmpty) {
      return true;
    }

    if (await _canUseRemoteApi()) {
      final successful = <WarrantyActivationRecord>[];
      for (final record in newActivations) {
        try {
          await _createRemoteActivation(record);
          successful.add(record);
        } catch (_) {
          if (successful.isNotEmpty) {
            _upsertActivations(successful);
            await _persist();
          }
          await _loadRemoteState();
          _sanitizeState();
          notifyListeners();
          return false;
        }
      }
      _upsertActivations(successful);
      await _persist();
      await _loadRemoteState();
      _sanitizeState();
      notifyListeners();
      return true;
    }

    return false;
  }

  String normalizeSerial(String serial) {
    return _normalizeSerial(serial);
  }

  Future<bool> _loadLocalState() async {
    final prefs = await SharedPreferences.getInstance();
    _activations.clear();
    _importedSerials.clear();
    _defectiveSerials.clear();
    await prefs.remove(_activationsStorageKey);
    await prefs.remove(_serialsStorageKey);
    await prefs.remove(_defectiveStorageKey);
    _sanitizeState();
    return false;
  }

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
      for (final record in _importedSerials)
        _normalizeSerial(record.serial): record,
    };

    try {
      final serialResponse = await _client.get(
        Uri.parse(DealerApiConfig.resolveUrl('/api/dealer/serials')),
        headers: _authorizedHeaders(token),
      );
      final serialPayload = _decodeBody(serialResponse.body);
      if (serialResponse.statusCode >= 400) {
        throw Exception(_extractErrorMessage(serialPayload));
      }
      final serialData = serialPayload['data'];
      if (serialData is! List) {
        throw Exception('Invalid serial payload');
      }

      final nextImportedSerials = <ImportedSerialRecord>[];
      final nextRemoteSerialIds = <String, int>{};
      final nextDefectiveSerials = <String>{};
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
        if (_isRemoteDefectiveStatus(entry['status'])) {
          nextDefectiveSerials.add(normalized);
        }
        nextImportedSerials.add(record);
        importedBySerial[normalized] = record;
      }

      final warrantyResponse = await _client.get(
        Uri.parse(DealerApiConfig.resolveUrl('/api/dealer/warranties')),
        headers: _authorizedHeaders(token),
      );
      final warrantyPayload = _decodeBody(warrantyResponse.body);
      if (warrantyResponse.statusCode >= 400) {
        throw Exception(_extractErrorMessage(warrantyPayload));
      }
      final warrantyData = warrantyPayload['data'];
      if (warrantyData is! List) {
        throw Exception('Invalid warranty payload');
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

      _importedSerials
        ..clear()
        ..addAll(nextImportedSerials);
      _activations
        ..clear()
        ..addAll(nextActivations);
      _defectiveSerials
        ..clear()
        ..addAll(nextDefectiveSerials);
      _remoteSerialIds
        ..clear()
        ..addAll(nextRemoteSerialIds);
      _remoteWarrantyIds
        ..clear()
        ..addAll(nextRemoteWarrantyIds);
      _sanitizeState();
      await _persist();
      return true;
    } catch (_) {
      return false;
    }
  }

  ImportedSerialRecord? _mapRemoteSerial(
    Map<String, dynamic> json,
    Map<String, ImportedSerialRecord> cachedImportedBySerial,
    Map<String, int> nextRemoteSerialIds,
  ) {
    final serial = _normalizeSerial(_normalizeString(json['serial']) ?? '');
    if (serial.isEmpty) {
      return null;
    }
    final remoteId = _parseInt(json['id']);
    if (remoteId > 0) {
      nextRemoteSerialIds[serial] = remoteId;
    }

    final cached = cachedImportedBySerial[serial];
    final productId = _parseInt(json['productId']) > 0
        ? _parseInt(json['productId']).toString()
        : (cached?.productId ?? '');
    final remoteOrderId = _parseInt(json['orderId']);
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
          _normalizeString(json['productName']) ??
          cached?.productName ??
          product?.name ??
          'Product',
      productSku:
          _normalizeString(json['productSku']) ??
          cached?.productSku ??
          product?.sku ??
          productId,
      importedAt:
          DateTime.tryParse(json['importedAt']?.toString() ?? '') ??
          cached?.importedAt ??
          DateTime.now(),
      warehouseId:
          _normalizeString(json['warehouseId']) ??
          cached?.warehouseId ??
          'main',
      warehouseName:
          _normalizeString(json['warehouseName']) ??
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
    final serial = _normalizeSerial(_normalizeString(json['serial']) ?? '');
    if (serial.isEmpty) {
      return null;
    }

    final remoteId = _parseInt(json['id']);
    if (remoteId > 0) {
      nextRemoteWarrantyIds[serial] = remoteId;
    }

    final cached = cachedActivationsBySerial[serial];
    final imported = importedBySerial[serial];
    final remoteOrderId = _parseInt(json['orderId']);
    final orderCode = remoteOrderId > 0
        ? (_orderCodeForRemoteId?.call(remoteOrderId) ??
              imported?.orderId ??
              cached?.orderId ??
              remoteOrderId.toString())
        : (imported?.orderId ?? cached?.orderId ?? '');
    final order = orderCode.isEmpty ? null : _orderLookup?.call(orderCode);
    final productId = imported?.productId ?? cached?.productId ?? '';
    final product = productId.isEmpty ? null : _productLookup?.call(productId);
    final activatedAt =
        DateTime.tryParse(json['warrantyStart']?.toString() ?? '') ??
        DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
        cached?.activatedAt ??
        DateTime.now();
    final warrantyEnd = DateTime.tryParse(
      json['warrantyEnd']?.toString() ?? '',
    );

    return WarrantyActivationRecord(
      orderId: orderCode,
      productId: productId,
      productName:
          imported?.productName ??
          cached?.productName ??
          product?.name ??
          'Product',
      productSku:
          imported?.productSku ??
          cached?.productSku ??
          product?.sku ??
          productId,
      serial: serial,
      customerName: _resolveCustomerField(
        cached?.customerName,
        order?.receiverName,
      ),
      customerPhone: _resolveCustomerField(
        cached?.customerPhone,
        order?.receiverPhone,
      ),
      customerAddress: _resolveCustomerField(
        cached?.customerAddress,
        order?.receiverAddress,
      ),
      warrantyMonths:
          cached?.warrantyMonths ??
          product?.warrantyMonths ??
          _resolveWarrantyMonths(activatedAt, warrantyEnd),
      activatedAt: activatedAt,
    );
  }

  Future<void> _createRemoteActivation(WarrantyActivationRecord record) async {
    var remoteSerialId = _remoteSerialIds[_normalizeSerial(record.serial)];
    if (remoteSerialId == null || remoteSerialId <= 0) {
      final reloaded = await _loadRemoteState();
      if (!reloaded) {
        throw Exception('Serial sync failed');
      }
      remoteSerialId = _remoteSerialIds[_normalizeSerial(record.serial)];
      if (remoteSerialId == null || remoteSerialId <= 0) {
        throw Exception('Remote serial not found');
      }
    }

    final remoteOrderId = _remoteOrderIdForOrderCode?.call(record.orderId);
    final response = await _client.post(
      Uri.parse(DealerApiConfig.resolveUrl('/api/dealer/warranties')),
      headers: await _authorizedJsonHeaders(),
      body: jsonEncode(<String, dynamic>{
        'productSerialId': remoteSerialId,
        ...?remoteOrderId == null
            ? null
            : <String, dynamic>{'orderId': remoteOrderId},
        'warrantyStart': record.activatedAt.toUtc().toIso8601String(),
        'warrantyEnd': record.expiresAt.toUtc().toIso8601String(),
        'status': 'ACTIVE',
      }),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw Exception(_extractErrorMessage(payload));
    }

    final data = payload['data'];
    if (data is Map<String, dynamic>) {
      final remoteWarrantyId = _parseInt(data['id']);
      if (remoteWarrantyId > 0) {
        _remoteWarrantyIds[_normalizeSerial(record.serial)] = remoteWarrantyId;
      }
    }
  }

  void _upsertActivations(List<WarrantyActivationRecord> records) {
    final bySerial = <String, WarrantyActivationRecord>{
      for (final activation in _activations)
        _normalizeSerial(activation.serial): activation,
    };
    for (final record in records) {
      bySerial[_normalizeSerial(record.serial)] = record;
      _defectiveSerials.remove(_normalizeSerial(record.serial));
    }
    _activations
      ..clear()
      ..addAll(bySerial.values);
    _ensureImportedSerialsForActivations(records);
  }

  void _upsertImportedSerials(List<ImportedSerialRecord> records) {
    if (records.isEmpty) {
      return;
    }
    final bySerial = <String, ImportedSerialRecord>{
      for (final record in _importedSerials)
        _normalizeSerial(record.serial): record,
    };
    for (final record in records) {
      bySerial[_normalizeSerial(record.serial)] = record;
    }
    _importedSerials
      ..clear()
      ..addAll(bySerial.values);
  }

  bool _applyLocalDefectiveState({
    required String normalizedSerial,
    required bool defective,
  }) {
    return defective
        ? _defectiveSerials.add(normalizedSerial)
        : _defectiveSerials.remove(normalizedSerial);
  }

  void _applyRemoteDefectiveState({
    required String normalizedSerial,
    required bool defective,
  }) {
    if (defective) {
      _defectiveSerials.add(normalizedSerial);
      return;
    }
    _defectiveSerials.remove(normalizedSerial);
  }

  void _resetToEmptyState() {
    _activations.clear();
    _importedSerials.clear();
    _defectiveSerials.clear();
    _sanitizeState();
  }

  void _sanitizeState() {
    _ensureImportedSerialsForActivations(_activations);
    _defectiveSerials.removeWhere(
      (serial) => _findImportedSerialIndex(serial) < 0,
    );
    _defectiveSerials.removeWhere(
      (serial) => _activatedSerialSet().contains(serial),
    );
  }

  int _findImportedSerialIndex(String normalizedSerial) {
    for (var i = 0; i < _importedSerials.length; i++) {
      if (_normalizeSerial(_importedSerials[i].serial) == normalizedSerial) {
        return i;
      }
    }
    return -1;
  }

  Set<String> _activatedSerialSet() {
    return _activations
        .map((activation) => _normalizeSerial(activation.serial))
        .toSet();
  }

  void _ensureImportedSerialsForActivations(
    Iterable<WarrantyActivationRecord> source,
  ) {
    for (final activation in source) {
      final normalized = _normalizeSerial(activation.serial);
      final currentIndex = _findImportedSerialIndex(normalized);
      if (currentIndex < 0) {
        _importedSerials.add(
          ImportedSerialRecord(
            serial: normalized,
            orderId: activation.orderId,
            productId: activation.productId,
            productName: activation.productName,
            productSku: activation.productSku,
            importedAt: activation.activatedAt,
          ),
        );
      }
    }
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _activationsStorageKey,
      jsonEncode(_activations.map(_activationToJson).toList(growable: false)),
    );
    await prefs.setString(
      _serialsStorageKey,
      jsonEncode(_importedSerials.map(_serialToJson).toList(growable: false)),
    );
    await prefs.setString(
      _defectiveStorageKey,
      jsonEncode(_defectiveSerials.toList(growable: false)),
    );
  }

  Future<String?> _readAccessToken() async {
    if (!DealerApiConfig.isConfigured) {
      return null;
    }
    final token = await _authStorage.readAccessToken();
    if (token == null || token.trim().isEmpty) {
      return null;
    }
    return token.trim();
  }

  Future<bool> _canUseRemoteApi() async {
    return await _readAccessToken() != null;
  }

  Map<String, String> _authorizedHeaders(String token) {
    return <String, String>{
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, String>> _authorizedJsonHeaders() async {
    final token = await _readAccessToken();
    if (token == null) {
      throw StateError('Unauthenticated request');
    }
    return <String, String>{
      ..._authorizedHeaders(token),
      'Content-Type': 'application/json',
    };
  }

  Map<String, dynamic> _decodeBody(String body) {
    if (body.trim().isEmpty) {
      return const <String, dynamic>{};
    }
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    return const <String, dynamic>{};
  }

  String _extractErrorMessage(
    Map<String, dynamic> payload, {
    String fallback = 'Khong the dong bo du lieu.',
  }) {
    final error = payload['error']?.toString();
    if (error != null && error.trim().isNotEmpty) {
      return error.trim();
    }
    return fallback;
  }

  String _describeError(Object error, {required String fallback}) {
    final text = error.toString().trim();
    if (text.isEmpty) {
      return fallback;
    }
    const exceptionPrefix = 'Exception: ';
    if (text.startsWith(exceptionPrefix)) {
      final trimmed = text.substring(exceptionPrefix.length).trim();
      return trimmed.isEmpty ? fallback : trimmed;
    }
    return text;
  }

  int _parseInt(Object? value, {int fallback = 0}) {
    if (value is int) {
      return value;
    }
    if (value is double) {
      return value.round();
    }
    return int.tryParse(value?.toString() ?? '') ?? fallback;
  }

  String? _normalizeString(Object? value) {
    final text = value?.toString().trim() ?? '';
    return text.isEmpty ? null : text;
  }

  bool _isRemoteDefectiveStatus(Object? value) {
    final status = value?.toString().trim().toUpperCase() ?? '';
    return status == 'DEFECTIVE';
  }

  String _resolveCustomerField(String? primary, String? fallback) {
    final normalizedPrimary = _normalizeString(primary);
    if (normalizedPrimary != null) {
      return normalizedPrimary;
    }
    return _normalizeString(fallback) ?? '';
  }

  int _resolveWarrantyMonths(DateTime activatedAt, DateTime? warrantyEnd) {
    if (warrantyEnd == null || !warrantyEnd.isAfter(activatedAt)) {
      return 12;
    }
    final days = warrantyEnd.difference(activatedAt).inDays;
    final months = (days / 30).round();
    return months <= 0 ? 12 : months;
  }

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }
}

class _PreparedSerialImport {
  const _PreparedSerialImport({
    required this.acceptedSerials,
    required this.duplicateCount,
    required this.invalidCount,
    required this.overLimitCount,
  });

  final List<String> acceptedSerials;
  final int duplicateCount;
  final int invalidCount;
  final int overLimitCount;
}

_PreparedSerialImport _prepareSerialImport({
  required Iterable<String> serials,
  required int? maxToAdd,
  required bool Function(String normalizedSerial) alreadyImported,
}) {
  final accepted = <String>[];
  final seenInBatch = <String>{};
  var duplicates = 0;
  var invalid = 0;
  var overLimit = 0;

  for (final raw in serials) {
    final normalized = _normalizeSerial(raw);
    if (normalized.isEmpty) {
      invalid++;
      continue;
    }
    if (!seenInBatch.add(normalized)) {
      duplicates++;
      continue;
    }
    if (alreadyImported(normalized)) {
      duplicates++;
      continue;
    }
    if (maxToAdd != null && accepted.length >= maxToAdd) {
      overLimit++;
      continue;
    }
    accepted.add(normalized);
  }

  return _PreparedSerialImport(
    acceptedSerials: accepted,
    duplicateCount: duplicates,
    invalidCount: invalid,
    overLimitCount: overLimit,
  );
}

class WarrantyScope extends InheritedNotifier<WarrantyController> {
  const WarrantyScope({
    super.key,
    required WarrantyController controller,
    required super.child,
  }) : super(notifier: controller);

  static WarrantyController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<WarrantyScope>();
    assert(scope != null, 'WarrantyScope not found in widget tree.');
    return scope!.notifier!;
  }
}

String _normalizeSerial(String serial) {
  return serial.trim().toUpperCase();
}

Map<String, dynamic> _activationToJson(WarrantyActivationRecord record) {
  return <String, dynamic>{
    'orderId': record.orderId,
    'productId': record.productId,
    'productName': record.productName,
    'productSku': record.productSku,
    'serial': record.serial,
    'customerName': record.customerName,
    'customerPhone': record.customerPhone,
    'customerAddress': record.customerAddress,
    'warrantyMonths': record.warrantyMonths,
    'activatedAt': record.activatedAt.toIso8601String(),
  };
}

Map<String, dynamic> _serialToJson(ImportedSerialRecord record) {
  return <String, dynamic>{
    'serial': record.serial,
    'orderId': record.orderId,
    'productId': record.productId,
    'productName': record.productName,
    'productSku': record.productSku,
    'importedAt': record.importedAt.toIso8601String(),
    'warehouseId': record.warehouseId,
    'warehouseName': record.warehouseName,
  };
}

