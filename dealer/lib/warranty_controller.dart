import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

export 'warranty_models.dart';
export 'warranty_scope.dart';

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'models.dart';
import 'warranty_models.dart';

class WarrantyController extends ChangeNotifier {
  static const String _activationsStorageKey = 'dealer_warranty_activations_v1';
  static const String _serialsStorageKey = 'dealer_warranty_serials_v1';

  WarrantyController({
    AuthStorage? authStorage,
    http.Client? client,
    String? Function(int remoteOrderId)? orderCodeForRemoteId,
    int? Function(String orderCode)? remoteOrderIdForOrderCode,
    Order? Function(String orderCode)? orderLookup,
    Product? Function(String productId)? productLookup,
  }) : _activations = <WarrantyActivationRecord>[],
       _importedSerials = <ImportedSerialRecord>[],
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
  late final AuthStorage _authStorage;
  late final http.Client _client;
  final String? Function(int remoteOrderId)? _orderCodeForRemoteId;
  final int? Function(String orderCode)? _remoteOrderIdForOrderCode;
  final Order? Function(String orderCode)? _orderLookup;
  final Product? Function(String productId)? _productLookup;
  final Map<String, int> _remoteSerialIds = <String, int>{};
  final Map<String, int> _remoteWarrantyIds = <String, int>{};
  final Map<String, ImportedSerialRecord> _importedSerialsByNormalized =
      <String, ImportedSerialRecord>{};
  List<WarrantyActivationRecord> _sortedActivationsCache =
      const <WarrantyActivationRecord>[];
  List<ImportedSerialRecord> _sortedImportedSerialsCache =
      const <ImportedSerialRecord>[];
  Set<String>? _activatedSerialSetCache;
  Map<String, int>? _activationCountByOrderCache;
  bool _activationsCacheDirty = true;
  bool _importedSerialsCacheDirty = true;
  bool _activationDerivedDirty = true;

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
    notifyListeners();
  }

  List<ImportedSerialRecord> importedSerialsForProduct(String productId) {
    final list = _importedSerials
        .where((record) => record.productId == productId)
        .toList(growable: false);
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  List<WarrantyActivationRecord> get activations {
    if (_activationsCacheDirty) {
      final list = List<WarrantyActivationRecord>.from(_activations)
        ..sort((a, b) => b.activatedAt.compareTo(a.activatedAt));
      _sortedActivationsCache = List<WarrantyActivationRecord>.unmodifiable(
        list,
      );
      _activationsCacheDirty = false;
    }
    return _sortedActivationsCache;
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
    if (_importedSerialsCacheDirty) {
      final list = List<ImportedSerialRecord>.from(_importedSerials)
        ..sort((a, b) => b.importedAt.compareTo(a.importedAt));
      _sortedImportedSerialsCache = List<ImportedSerialRecord>.unmodifiable(
        list,
      );
      _importedSerialsCacheDirty = false;
    }
    return _sortedImportedSerialsCache;
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

  int get availableImportedSerialCount {
    final activated = _activatedSerialSet();
    return _importedSerials.where((record) {
      final normalized = _normalizeSerial(record.serial);
      return !activated.contains(normalized);
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
      return !activated.contains(normalized);
    }).toList();
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  int availableImportedSerialCountForOrderItem(
    String orderId,
    String productId,
  ) {
    final activated = _activatedSerialSet();
    return _importedSerials.where((record) {
      if (record.orderId != orderId || record.productId != productId) {
        return false;
      }
      final normalized = _normalizeSerial(record.serial);
      return !activated.contains(normalized);
    }).length;
  }

  ImportedSerialRecord? findImportedSerial(String serial) {
    final normalized = _normalizeSerial(serial);
    return _importedSerialsByNormalized[normalized];
  }

  bool isSerialActivated(String serial) {
    final normalized = _normalizeSerial(serial);
    return _activatedSerialSet().contains(normalized);
  }

  int activationCountForOrder(String orderId) {
    _ensureActivationDerivedCache();
    return _activationCountByOrderCache![orderId] ?? 0;
  }

  String? validateSerialForActivation({
    required String serial,
    required String productId,
    required String productName,
    required String orderId,
  }) {
    final normalized = _normalizeSerial(serial);
    if (normalized.isEmpty) {
      return 'Serial không hợp lệ.';
    }

    final imported = findImportedSerial(normalized);
    if (imported == null) {
      return 'Serial $normalized chưa được nhập kho.';
    }
    if (imported.productId != productId) {
      return 'Serial $normalized không thuộc sản phẩm $productName.';
    }

    if (imported.orderId != orderId) {
      return 'Serial $normalized thuộc đơn ${imported.orderId}, không thuộc đơn $orderId.';
    }

    if (isSerialActivated(normalized)) {
      return 'Serial $normalized đã được kích hoạt trước đó.';
    }

    return null;
  }

  Future<bool> addActivations(
    List<WarrantyActivationRecord> newActivations,
  ) async {
    if (newActivations.isEmpty) {
      return true;
    }

    if (await _canUseRemoteApi()) {
      final requiresRemoteSync = newActivations.any((record) {
        final remoteSerialId =
            _remoteSerialIds[_normalizeSerial(record.serial)];
        return remoteSerialId == null || remoteSerialId <= 0;
      });
      if (requiresRemoteSync && !await _loadRemoteState()) {
        return false;
      }

      final results = await Future.wait<WarrantyActivationRecord?>(
        newActivations.map((record) async {
          try {
            await _createRemoteActivation(record);
            return record;
          } catch (_) {
            return null;
          }
        }),
      );
      final successful = results.whereType<WarrantyActivationRecord>().toList(
        growable: false,
      );
      final hasFailures = successful.length != newActivations.length;
      if (hasFailures && successful.isNotEmpty) {
        _upsertActivations(successful);
        await _persist();
      }
      if (hasFailures) {
        await _loadRemoteState();
        _sanitizeState();
        notifyListeners();
        return false;
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
    final hasStoredState =
        prefs.containsKey(_activationsStorageKey) ||
        prefs.containsKey(_serialsStorageKey);
    if (!hasStoredState) {
      return false;
    }

    try {
      final activationData = _decodeStoredList(
        prefs.getString(_activationsStorageKey),
      );
      final serialData = _decodeStoredList(prefs.getString(_serialsStorageKey));

      _replaceActivations(
        activationData
            .whereType<Map<String, dynamic>>()
            .map(_activationFromJson)
            .whereType<WarrantyActivationRecord>(),
      );
      _replaceImportedSerials(
        serialData
            .whereType<Map<String, dynamic>>()
            .map(_serialFromJson)
            .whereType<ImportedSerialRecord>(),
      );
      _sanitizeState();
      return true;
    } catch (_) {
      _resetToEmptyState();
      return false;
    }
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
      ..._importedSerialsByNormalized,
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

      _replaceImportedSerials(nextImportedSerials);
      _replaceActivations(nextActivations);
      _syncMapContents(_remoteSerialIds, nextRemoteSerialIds);
      _syncMapContents(_remoteWarrantyIds, nextRemoteWarrantyIds);
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
          _parseDateTimeValue(json['importedAt']) ??
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
    final warrantyEnd = _parseDateTimeValue(json['warrantyEnd']);

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
        _normalizeString(json['customerName']) ?? cached?.customerName,
        order?.receiverName,
      ),
      customerEmail: _resolveCustomerField(
        _normalizeString(json['customerEmail']) ?? cached?.customerEmail,
        '',
      ),
      customerPhone: _resolveCustomerField(
        _normalizeString(json['customerPhone']) ?? cached?.customerPhone,
        order?.receiverPhone,
      ),
      customerAddress: _resolveCustomerField(
        _normalizeString(json['customerAddress']) ?? cached?.customerAddress,
        order?.receiverAddress,
      ),
      warrantyMonths:
          cached?.warrantyMonths ??
          product?.warrantyMonths ??
          _resolveWarrantyMonths(purchaseDate, warrantyEnd),
      activatedAt: activatedAt,
      purchaseDate: purchaseDate,
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

    final response = await _client.post(
      Uri.parse(DealerApiConfig.resolveUrl('/api/warranty-activation')),
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
    }
    _replaceActivations(bySerial.values);
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
    _replaceImportedSerials(bySerial.values);
  }

  void _resetToEmptyState() {
    _replaceActivations(const <WarrantyActivationRecord>[]);
    _replaceImportedSerials(const <ImportedSerialRecord>[]);
    _sanitizeState();
  }

  void _sanitizeState() {
    _ensureImportedSerialsForActivations(_activations);
  }

  Set<String> _activatedSerialSet() {
    _ensureActivationDerivedCache();
    return _activatedSerialSetCache!;
  }

  void _ensureImportedSerialsForActivations(
    Iterable<WarrantyActivationRecord> source,
  ) {
    for (final activation in source) {
      final normalized = _normalizeSerial(activation.serial);
      if (!_containsImportedSerial(normalized)) {
        _importedSerials.add(
          ImportedSerialRecord(
            serial: normalized,
            orderId: activation.orderId,
            productId: activation.productId,
            productName: activation.productName,
            productSku: activation.productSku,
            importedAt: activation.purchaseDate,
          ),
        );
        _importedSerialsByNormalized[normalized] = _importedSerials.last;
        _markImportedSerialsDirty();
      }
    }
  }

  void _replaceActivations(Iterable<WarrantyActivationRecord> activations) {
    _activations
      ..clear()
      ..addAll(activations);
    _markActivationsDirty();
  }

  void _replaceImportedSerials(Iterable<ImportedSerialRecord> serials) {
    _importedSerials
      ..clear()
      ..addAll(serials);
    _rebuildImportedSerialLookup();
    _markImportedSerialsDirty();
  }

  void _rebuildImportedSerialLookup() {
    _importedSerialsByNormalized
      ..clear()
      ..addEntries(
        _importedSerials.map(
          (record) => MapEntry<String, ImportedSerialRecord>(
            _normalizeSerial(record.serial),
            record,
          ),
        ),
      );
  }

  void _markActivationsDirty() {
    _activationsCacheDirty = true;
    _activationDerivedDirty = true;
  }

  void _markImportedSerialsDirty() {
    _importedSerialsCacheDirty = true;
  }

  void _ensureActivationDerivedCache() {
    if (!_activationDerivedDirty &&
        _activatedSerialSetCache != null &&
        _activationCountByOrderCache != null) {
      return;
    }

    final activatedSerials = <String>{};
    final countsByOrder = <String, int>{};
    for (final activation in _activations) {
      final normalized = _normalizeSerial(activation.serial);
      activatedSerials.add(normalized);
      countsByOrder.update(
        activation.orderId,
        (count) => count + 1,
        ifAbsent: () => 1,
      );
    }

    _activatedSerialSetCache = activatedSerials;
    _activationCountByOrderCache = countsByOrder;
    _activationDerivedDirty = false;
  }

  bool _containsImportedSerial(String normalizedSerial) {
    return _importedSerialsByNormalized.containsKey(normalizedSerial);
  }

  void _syncMapContents<K, V>(Map<K, V> target, Map<K, V> next) {
    target.removeWhere((key, _) => !next.containsKey(key));
    target.addAll(next);
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
  }

  List<dynamic> _decodeStoredList(String? raw) {
    if (raw == null || raw.trim().isEmpty) {
      return const <dynamic>[];
    }
    final decoded = jsonDecode(raw);
    if (decoded is List) {
      return decoded;
    }
    return const <dynamic>[];
  }

  WarrantyActivationRecord? _activationFromJson(Map<String, dynamic> json) {
    final serial = _normalizeSerial(_normalizeString(json['serial']) ?? '');
    if (serial.isEmpty) {
      return null;
    }
    final purchaseDate = _normalizeLocalDate(
      _parseDateTimeValue(json['purchaseDate']) ??
          _parseDateTimeValue(json['activatedAt']) ??
          DateTime.now(),
    );
    final activatedAt =
        _parseDateTimeValue(json['activatedAt']) ?? purchaseDate;
    return WarrantyActivationRecord(
      orderId: _normalizeString(json['orderId']) ?? '',
      productId: _normalizeString(json['productId']) ?? '',
      productName: _normalizeString(json['productName']) ?? 'Product',
      productSku: _normalizeString(json['productSku']) ?? '',
      serial: serial,
      customerName: _normalizeString(json['customerName']) ?? '',
      customerEmail: _normalizeString(json['customerEmail']) ?? '',
      customerPhone: _normalizeString(json['customerPhone']) ?? '',
      customerAddress: _normalizeString(json['customerAddress']) ?? '',
      warrantyMonths: _parseInt(json['warrantyMonths'], fallback: 12),
      activatedAt: activatedAt,
      purchaseDate: purchaseDate,
    );
  }

  ImportedSerialRecord? _serialFromJson(Map<String, dynamic> json) {
    final serial = _normalizeSerial(_normalizeString(json['serial']) ?? '');
    if (serial.isEmpty) {
      return null;
    }
    return ImportedSerialRecord(
      serial: serial,
      orderId: _normalizeString(json['orderId']) ?? '',
      productId: _normalizeString(json['productId']) ?? '',
      productName: _normalizeString(json['productName']) ?? 'Product',
      productSku: _normalizeString(json['productSku']) ?? '',
      importedAt: _parseDateTimeValue(json['importedAt']) ?? DateTime.now(),
      warehouseId: _normalizeString(json['warehouseId']) ?? 'main',
      warehouseName: _normalizeString(json['warehouseName']) ?? 'Kho',
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
    String fallback = 'Không thể đồng bộ dữ liệu.',
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

  DateTime _normalizeLocalDate(DateTime value) {
    return DateTime(value.year, value.month, value.day);
  }

  DateTime? _parseDateTimeValue(Object? value) {
    final raw = value?.toString().trim() ?? '';
    if (raw.isEmpty) {
      return null;
    }
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) {
      return null;
    }
    return parsed.isUtc ? parsed.toLocal() : parsed;
  }

  String _toIsoDate(DateTime value) {
    final normalized = _normalizeLocalDate(value);
    final month = normalized.month.toString().padLeft(2, '0');
    final day = normalized.day.toString().padLeft(2, '0');
    return '${normalized.year}-$month-$day';
  }

  String _resolveCustomerField(String? primary, String? fallback) {
    final normalizedPrimary = _normalizeString(primary);
    if (normalizedPrimary != null) {
      return normalizedPrimary;
    }
    return _normalizeString(fallback) ?? '';
  }

  int _resolveWarrantyMonths(DateTime purchaseDate, DateTime? warrantyEnd) {
    if (warrantyEnd == null || !warrantyEnd.isAfter(purchaseDate)) {
      return 12;
    }
    int months = (warrantyEnd.year - purchaseDate.year) * 12 +
        (warrantyEnd.month - purchaseDate.month);
    if (warrantyEnd.day < purchaseDate.day) months--;
    return months <= 0 ? 12 : months;
  }

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }
}

String _normalizeSerial(String serial) {
  return serial.trim().toUpperCase();
}

Map<String, dynamic> _activationToJson(WarrantyActivationRecord record) {
  final purchaseDate = DateTime(
    record.purchaseDate.year,
    record.purchaseDate.month,
    record.purchaseDate.day,
  );
  return <String, dynamic>{
    'orderId': record.orderId,
    'productId': record.productId,
    'productName': record.productName,
    'productSku': record.productSku,
    'serial': record.serial,
    'customerName': record.customerName,
    'customerEmail': record.customerEmail,
    'customerPhone': record.customerPhone,
    'customerAddress': record.customerAddress,
    'warrantyMonths': record.warrantyMonths,
    'activatedAt': record.activatedAt.toIso8601String(),
    'purchaseDate':
        '${purchaseDate.year}-${purchaseDate.month.toString().padLeft(2, '0')}-${purchaseDate.day.toString().padLeft(2, '0')}',
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
