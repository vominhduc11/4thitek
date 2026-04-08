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

enum WarrantySerialValidationErrorCode {
  invalidSerial,
  notImported,
  wrongProduct,
  wrongOrder,
  alreadyActivated,
  invalidOrderState,
}

String warrantySerialValidationMessage(
  WarrantySerialValidationErrorCode code, {
  required bool isEnglish,
  required String serial,
  String? productName,
  String? actualOrderId,
  String? expectedOrderId,
}) {
  switch (code) {
    case WarrantySerialValidationErrorCode.invalidSerial:
      return isEnglish ? 'Serial is invalid.' : 'Serial không hợp lệ.';
    case WarrantySerialValidationErrorCode.notImported:
      return isEnglish
          ? 'Serial $serial is not available in inventory.'
          : 'Serial $serial chưa được nhập kho.';
    case WarrantySerialValidationErrorCode.wrongProduct:
      return isEnglish
          ? 'Serial $serial does not belong to product $productName.'
          : 'Serial $serial không thuộc sản phẩm $productName.';
    case WarrantySerialValidationErrorCode.wrongOrder:
      return isEnglish
          ? 'Serial $serial belongs to order $actualOrderId, not order $expectedOrderId.'
          : 'Serial $serial thuộc đơn $actualOrderId, không thuộc đơn $expectedOrderId.';
    case WarrantySerialValidationErrorCode.alreadyActivated:
      return isEnglish
          ? 'Serial $serial was already activated.'
          : 'Serial $serial đã được kích hoạt trước đó.';
    case WarrantySerialValidationErrorCode.invalidOrderState:
      return isEnglish
          ? 'Serial $serial is not linked to a completed order yet.'
          : 'Serial $serial chưa thuộc đơn đã hoàn thành.';
  }
}

enum WarrantySyncMessageCode {
  apiNotConfigured,
  unauthenticated,
  invalidSerialPayload,
  invalidWarrantyPayload,
  serialSyncFailed,
  remoteSerialNotFound,
  activationFailed,
  syncFailed,
}

const String _warrantySyncMessageTokenPrefix = 'warranty.sync.message.';

String warrantySyncMessageToken(WarrantySyncMessageCode code) =>
    '$_warrantySyncMessageTokenPrefix${code.name}';

String resolveWarrantySyncMessage(String? message, {required bool isEnglish}) {
  final normalized = message?.trim();
  if (normalized == null || normalized.isEmpty) {
    return isEnglish
        ? 'Unable to sync warranty data.'
        : 'Không thể đồng bộ dữ liệu bảo hành.';
  }

  switch (normalized) {
    case 'warranty.sync.message.apiNotConfigured':
      return isEnglish
          ? 'Warranty API is not configured.'
          : 'API bảo hành chưa được cấu hình.';
    case 'warranty.sync.message.unauthenticated':
      return isEnglish
          ? 'You need to sign in before activating warranty.'
          : 'Bạn cần đăng nhập trước khi kích hoạt bảo hành.';
    case 'warranty.sync.message.invalidSerialPayload':
      return isEnglish
          ? 'Serial inventory data is invalid.'
          : 'Dữ liệu serial tồn kho không hợp lệ.';
    case 'warranty.sync.message.invalidWarrantyPayload':
      return isEnglish
          ? 'Warranty activation data is invalid.'
          : 'Dữ liệu kích hoạt bảo hành không hợp lệ.';
    case 'warranty.sync.message.serialSyncFailed':
      return isEnglish
          ? 'Unable to sync serial inventory.'
          : 'Không thể đồng bộ serial tồn kho.';
    case 'warranty.sync.message.remoteSerialNotFound':
      return isEnglish
          ? 'The selected serial is not available for warranty activation.'
          : 'Serial đã chọn không sẵn sàng để kích hoạt bảo hành.';
    case 'warranty.sync.message.activationFailed':
      return isEnglish
          ? 'Unable to activate warranty. Please try again.'
          : 'Không thể kích hoạt bảo hành. Vui lòng thử lại.';
    case 'warranty.sync.message.syncFailed':
      return isEnglish
          ? 'Unable to sync warranty data.'
          : 'Không thể đồng bộ dữ liệu bảo hành.';
    default:
      return normalized;
  }
}

String warrantySyncErrorMessage(
  Object? error, {
  required bool isEnglish,
}) {
  final message = switch (error) {
    WarrantySyncException() => error.message,
    String() => error,
    _ => error?.toString(),
  };
  return resolveWarrantySyncMessage(message, isEnglish: isEnglish);
}

class WarrantySyncException implements Exception {
  const WarrantySyncException(this.message);

  final String message;

  @override
  String toString() => message;
}

class WarrantyController extends ChangeNotifier {
  static const String _activationsStorageKey = 'dealer_warranty_activations_v1';
  static const String _serialsStorageKey = 'dealer_warranty_serials_v1';

  WarrantyController({
    AuthStorage? authStorage,
    http.Client? client,
    String? Function(int remoteOrderId)? orderCodeForRemoteId,
    Order? Function(String orderCode)? orderLookup,
    Product? Function(String productId)? productLookup,
  }) : _activations = <WarrantyActivationRecord>[],
       _importedSerials = <ImportedSerialRecord>[],
       _orderCodeForRemoteId = orderCodeForRemoteId,
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
  String? _lastSyncMessage;
  DateTime? _lastLocalStateLoadedAt;
  DateTime? _lastRemoteSyncAt;
  bool _usingLocalFallback = false;

  String? get lastSyncMessage => _lastSyncMessage;
  DateTime? get lastLocalStateLoadedAt => _lastLocalStateLoadedAt;
  DateTime? get lastRemoteSyncAt => _lastRemoteSyncAt;
  bool get isUsingLocalFallback => _usingLocalFallback;

  Future<void> load({bool forceRefresh = false}) async {
    _lastSyncMessage = null;
    final loadedLocal = await _loadLocalState();
    final loadedRemote = await _loadRemoteState();
    _usingLocalFallback = loadedLocal && !loadedRemote;
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
    _lastSyncMessage = null;
    _lastLocalStateLoadedAt = null;
    _lastRemoteSyncAt = null;
    _usingLocalFallback = false;

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
    required bool isEnglish,
  }) {
    final normalized = _normalizeSerial(serial);
    if (normalized.isEmpty) {
      return warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.invalidSerial,
        isEnglish: isEnglish,
        serial: normalized,
      );
    }

    final imported = findImportedSerial(normalized);
    if (imported == null) {
      return warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.notImported,
        isEnglish: isEnglish,
        serial: normalized,
      );
    }
    if (imported.productId != productId) {
      return warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.wrongProduct,
        isEnglish: isEnglish,
        serial: normalized,
        productName: productName,
      );
    }

    if (imported.orderId != orderId) {
      return warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.wrongOrder,
        isEnglish: isEnglish,
        serial: normalized,
        actualOrderId: imported.orderId,
        expectedOrderId: orderId,
      );
    }

    if (isSerialActivated(normalized)) {
      return warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.alreadyActivated,
        isEnglish: isEnglish,
        serial: normalized,
      );
    }


    final order = _orderLookup?.call(orderId);
    if (order == null || order.status != OrderStatus.completed) {
      return warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.invalidOrderState,
        isEnglish: isEnglish,
        serial: normalized,
      );
    }
    return null;
  }

  /// Validates a serial for the serial-first export flow (no orderId constraint).
  String? validateSerialForExport(
    String serial, {
    required bool isEnglish,
  }) {
    final normalized = _normalizeSerial(serial);
    if (normalized.isEmpty) {
      return warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.invalidSerial,
        isEnglish: isEnglish,
        serial: normalized,
      );
    }
    final imported = findImportedSerial(normalized);
    if (imported == null) {
      return warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.notImported,
        isEnglish: isEnglish,
        serial: normalized,
      );
    }
    if (isSerialActivated(normalized)) {
      return warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.alreadyActivated,
        isEnglish: isEnglish,
        serial: normalized,
      );
    }
    final order = _orderLookup?.call(imported.orderId);
    if (order == null || order.status != OrderStatus.completed) {
      return warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.invalidOrderState,
        isEnglish: isEnglish,
        serial: normalized,
      );
    }
    return null;
  }

  Future<bool> addActivations(
    List<WarrantyActivationRecord> newActivations,
  ) async {
    _lastSyncMessage = null;
    if (newActivations.isEmpty) {
      return true;
    }

    if (!DealerApiConfig.isConfigured) {
      _lastSyncMessage = warrantySyncMessageToken(
        WarrantySyncMessageCode.apiNotConfigured,
      );
      return false;
    }

    if (!await _canUseRemoteApi()) {
      _lastSyncMessage = warrantySyncMessageToken(
        WarrantySyncMessageCode.unauthenticated,
      );
      return false;
    }

    final requiresRemoteSync = newActivations.any((record) {
      final remoteSerialId = _remoteSerialIds[_normalizeSerial(record.serial)];
      return remoteSerialId == null || remoteSerialId <= 0;
    });
    if (requiresRemoteSync && !await _loadRemoteState()) {
      _lastSyncMessage ??= warrantySyncMessageToken(
        WarrantySyncMessageCode.serialSyncFailed,
      );
      return false;
    }

    final results = await Future.wait<
      ({WarrantyActivationRecord? record, String? errorMessage})
    >(
      newActivations.map((record) async {
        try {
          await _createRemoteActivation(record);
          return (record: record, errorMessage: null);
        } catch (error) {
          return (
            record: null,
            errorMessage: _normalizeWarrantySyncFailure(
              error,
              fallbackCode: WarrantySyncMessageCode.activationFailed,
            ),
          );
        }
      }),
    );
    final successful = results
        .where((result) => result.record != null)
        .map((result) => result.record!)
        .toList(growable: false);
    String? firstErrorMessage;
    for (final result in results) {
      if (result.errorMessage != null) {
        firstErrorMessage = result.errorMessage;
        break;
      }
    }

    final hasFailures = successful.length != newActivations.length;
    if (hasFailures && successful.isNotEmpty) {
      _upsertActivations(successful);
      await _persist();
    }
    if (hasFailures) {
      final failureMessage =
          firstErrorMessage ??
          warrantySyncMessageToken(WarrantySyncMessageCode.syncFailed);
      await _loadRemoteState();
      _lastSyncMessage = failureMessage;
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
      _lastLocalStateLoadedAt = DateTime.now();
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
        DealerApiConfig.resolveApiUri('/dealer/serials'),
        headers: _authorizedHeaders(token),
      );
      final serialPayload = _decodeBody(serialResponse.body);
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
        headers: _authorizedHeaders(token),
      );
      final warrantyPayload = _decodeBody(warrantyResponse.body);
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
      await _persist();
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
      status: parseImportedSerialStatus(
        _normalizeString(json['status']) ?? cached?.status.name,
      ),
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
    final directOrderCode = _normalizeString(json['orderCode']);
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
        _normalizeString(json['productId']) ??
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
    final warrantyEnd =
        rawWarrantyEnd == null ? null : _normalizeLocalDate(rawWarrantyEnd);

    return WarrantyActivationRecord(
      orderId: orderCode,
      productId: productId,
      productName:
          _normalizeString(json['productName']) ??
          imported?.productName ??
          cached?.productName ??
          product?.name ??
          'Product',
      productSku:
          _normalizeString(json['productSku']) ??
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
          warrantyEnd != null
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
    final payload = _decodeBody(response.body);
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
            status: ImportedSerialStatus.warranty,
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
    final rawWarrantyEnd = _parseDateTimeValue(json['warrantyEnd']);
    final warrantyEnd =
        rawWarrantyEnd == null ? null : _normalizeLocalDate(rawWarrantyEnd);
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
      warrantyEnd: warrantyEnd,
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
      status: parseImportedSerialStatus(_normalizeString(json['status'])),
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
      throw WarrantySyncException(
        warrantySyncMessageToken(WarrantySyncMessageCode.unauthenticated),
      );
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

  String _normalizeWarrantySyncFailure(
    Object error, {
    required WarrantySyncMessageCode fallbackCode,
  }) {
    final message = switch (error) {
      WarrantySyncException() => error.message,
      String() => error,
      _ => error.toString(),
    };
    final normalized = message
        .replaceFirst(RegExp(r'^Exception:\s*'), '')
        .trim();
    if (normalized.isEmpty) {
      return warrantySyncMessageToken(fallbackCode);
    }
    if (normalized.contains('Unauthenticated request')) {
      return warrantySyncMessageToken(WarrantySyncMessageCode.unauthenticated);
    }
    return normalized;
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
    if (value == null) return null;
    // Numeric epoch seconds (Jackson default when write-dates-as-timestamps=true)
    if (value is num) {
      return DateTime.fromMillisecondsSinceEpoch(
        (value * 1000).round(),
        isUtc: true,
      ).toLocal();
    }
    final raw = value.toString().trim();
    if (raw.isEmpty) return null;
    final numeric = num.tryParse(raw);
    if (numeric != null) {
      return DateTime.fromMillisecondsSinceEpoch(
        (numeric * 1000).round(),
        isUtc: true,
      ).toLocal();
    }
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return null;
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
    int months =
        (warrantyEnd.year - purchaseDate.year) * 12 +
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
    'warrantyEnd': record.warrantyEnd?.toIso8601String(),
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
    'status': record.status.name.toUpperCase(),
    'warehouseId': record.warehouseId,
    'warehouseName': record.warehouseName,
  };
}
