import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

export 'warranty_models.dart';
export 'warranty_scope.dart';

import 'api_client_helpers.dart';
import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'models.dart';
import 'utils.dart';
import 'warranty_models.dart';

part 'warranty_controller_messages.dart';
part 'warranty_controller_remote.dart';

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
    await _clearLegacyPersistedState();
    _lastLocalStateLoadedAt = null;
    final loadedRemote = await _loadRemoteState();
    _usingLocalFallback = false;
    if (!loadedRemote && forceRefresh) {
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
    await _clearLegacyPersistedState();
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
  String? validateSerialForExport(String serial, {required bool isEnglish}) {
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

    final results =
        await Future.wait<
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
    await _loadRemoteState();
    _sanitizeState();
    notifyListeners();
    return true;
  }

  String normalizeSerial(String serial) {
    return _normalizeSerial(serial);
  }

  Future<void> _clearLegacyPersistedState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_activationsStorageKey);
    await prefs.remove(_serialsStorageKey);
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

  Future<Map<String, String>> _authorizedJsonHeaders() async {
    final token = await _readAccessToken();
    if (token == null) {
      throw WarrantySyncException(
        warrantySyncMessageToken(WarrantySyncMessageCode.unauthenticated),
      );
    }
    return <String, String>{
      ...buildAuthorizedHeaders(token),
      'Content-Type': 'application/json',
    };
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
    final normalizedPrimary = normalizeString(primary);
    if (normalizedPrimary != null) {
      return normalizedPrimary;
    }
    return normalizeString(fallback) ?? '';
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
