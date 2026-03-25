import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:meta/meta.dart';
import 'package:stomp_dart_client/stomp_dart_client.dart';

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'models.dart';
import 'utils.dart';

const String _notificationSyncUnavailableMarker =
    'notification.sync.unavailable';

String notificationSyncErrorMessage(String error, {required bool isEnglish}) {
  if (error == _notificationSyncUnavailableMarker) {
    return isEnglish
        ? 'Unable to sync notifications.'
        : 'Khong the dong bo thong bao.';
  }
  return error;
}

class NotificationController extends ChangeNotifier {
  NotificationController({
    AuthStorage? authStorage,
    http.Client? client,
    Future<void> Function()? onOrderSignal,
    void Function(String, String, String, {int? paidAmount})?
    onOrderStatusEvent,
  }) : _notices = <DistributorNotice>[] {
    _authStorage = authStorage ?? AuthStorage();
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: client ?? http.Client(),
    );
    _onOrderSignal = onOrderSignal;
    _onOrderStatusEvent = onOrderStatusEvent;
    _authStorage.sessionEvents.addListener(_handleSessionEvent);
  }

  static const Duration _reconnectDelay = Duration(seconds: 5);
  static const Duration _fallbackRefreshInterval = Duration(seconds: 45);

  late final AuthStorage _authStorage;
  late final http.Client _client;
  late final Future<void> Function()? _onOrderSignal;
  late final void Function(
    String orderCode,
    String status,
    String paymentStatus, {
    int? paidAmount,
  })?
  _onOrderStatusEvent;
  final ValueNotifier<int> _incomingNoticeEventVersion = ValueNotifier<int>(0);
  final ValueNotifier<int> _incomingSupportEventVersion = ValueNotifier<int>(0);
  final List<DistributorNotice> _notices;
  final Set<String> _readIds = <String>{};
  final Map<String, int> _remoteNoticeIds = <String, int>{};
  StompClient? _stompClient;
  Timer? _reconnectTimer;
  Timer? _fallbackRefreshTimer;
  int _socketGeneration = 0;
  int _handledSessionEventVersion = 0;
  bool _maintainRealtimeConnection = false;
  bool _realtimeConnecting = false;
  bool _fallbackRefreshInFlight = false;
  bool _disposed = false;
  String? _realtimeToken;
  DistributorNotice? _latestIncomingNotice;
  Future<void>? _orderSignalInFlight;

  Future<void> load({bool forceRefresh = false}) async {
    final loadedRemote = await _loadRemoteNotifications();
    if (!loadedRemote && forceRefresh) {
      _notices.clear();
      _readIds.clear();
      _remoteNoticeIds.clear();
      notifyListeners();
    }

    await _syncRealtimeConnection();
  }

  List<DistributorNotice> get notices =>
      List<DistributorNotice>.unmodifiable(_notices);

  ValueListenable<int> get incomingNoticeEvents => _incomingNoticeEventVersion;

  int get incomingNoticeEventVersion => _incomingNoticeEventVersion.value;

  ValueListenable<int> get incomingSupportEvents =>
      _incomingSupportEventVersion;

  int get incomingSupportEventVersion => _incomingSupportEventVersion.value;

  DistributorNotice? get latestIncomingNotice => _latestIncomingNotice;

  int get unreadCount => _notices.where((notice) => !isRead(notice.id)).length;

  bool isRead(String id) {
    return _readIds.contains(id);
  }

  Future<String?> markRead(String id) async {
    if (!_containsNotice(id) || isRead(id)) {
      return null;
    }

    final remoteId = _remoteNoticeIds[id];
    if (remoteId == null || !await _canUseRemoteApi()) {
      return _notificationSyncUnavailableMarker;
    }

    final error = await _markRemoteRead(remoteId);
    if (error != null) {
      return error;
    }

    _readIds.add(id);
    notifyListeners();
    return null;
  }

  Future<String?> markUnread(String id) async {
    if (!_containsNotice(id) || !isRead(id)) {
      return null;
    }

    final remoteId = _remoteNoticeIds[id];
    if (remoteId == null || !await _canUseRemoteApi()) {
      return _notificationSyncUnavailableMarker;
    }

    final error = await _markRemoteUnread(remoteId);
    if (error != null) {
      return error;
    }

    _readIds.remove(id);
    notifyListeners();
    return null;
  }

  Future<String?> markAllAsRead() async {
    if (_notices.isEmpty && _readIds.isEmpty) {
      return null;
    }

    if (!await _canUseRemoteApi()) {
      return _notificationSyncUnavailableMarker;
    }

    final error = await _markAllRemoteRead();
    if (error != null) {
      return error;
    }

    _readIds
      ..clear()
      ..addAll(_notices.map((notice) => notice.id));
    notifyListeners();
    return null;
  }

  @visibleForTesting
  void seedNoticesForTesting(
    Iterable<DistributorNotice> notices, {
    Iterable<String> readIds = const <String>[],
  }) {
    _notices
      ..clear()
      ..addAll(notices);
    _readIds
      ..clear()
      ..addAll(readIds);
  }

  Future<void> refresh() async {
    final loadedRemote = await _loadRemoteNotifications();
    if (!loadedRemote) {
      await Future<void>.delayed(const Duration(milliseconds: 300));
      notifyListeners();
    }
    await _syncRealtimeConnection();
  }

  Future<void> clearSessionData() async {
    _stopRealtimeConnection();
    _notices.clear();
    _readIds.clear();
    _remoteNoticeIds.clear();
    notifyListeners();
  }

  Future<bool> _loadRemoteNotifications() async {
    final token = await _readAccessToken();
    if (token == null) {
      return false;
    }

    try {
      final response = await _client.get(
        DealerApiConfig.resolveApiUri('/dealer/notifications'),
        headers: _authorizedHeaders(token),
      );
      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        throw Exception(_extractErrorMessage(payload));
      }

      final data = payload['data'];
      if (data is! List) {
        throw Exception('Invalid notifications payload');
      }

      final remoteNotices = <DistributorNotice>[];
      final remoteReadIds = <String>{};
      _remoteNoticeIds.clear();
      for (final entry in data.whereType<Map<String, dynamic>>()) {
        final remoteId = _parseInt(entry['id']);
        final noticeId = remoteId.toString();
        _remoteNoticeIds[noticeId] = remoteId;
        remoteNotices.add(
          DistributorNotice(
            id: noticeId,
            type: _mapRemoteType(entry['type']?.toString()),
            title: _normalizeString(entry['title']) ?? 'ThĂ´ng bĂ¡o',
            message: _normalizeString(entry['body']) ?? '',
            createdAt: parseApiDateTime(entry['createdAt']) ?? DateTime.now(),
            link: _normalizeString(entry['link']),
            deepLink: _normalizeString(entry['deepLink']),
          ),
        );
        if (_parseBool(entry['isRead'])) {
          remoteReadIds.add(noticeId);
        }
      }

      _notices
        ..clear()
        ..addAll(remoteNotices);
      _readIds
        ..clear()
        ..addAll(remoteReadIds);
      _trimReadIdsToKnownNotices();
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<String?> _markRemoteRead(int remoteId) async {
    try {
      final response = await _client.patch(
        DealerApiConfig.resolveApiUri('/dealer/notifications/$remoteId/read'),
        headers: await _authorizedJsonHeaders(),
      );
      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        return _extractErrorMessage(payload);
      }
      return null;
    } catch (_) {
      return _notificationSyncUnavailableMarker;
    }
  }

  Future<String?> _markRemoteUnread(int remoteId) async {
    try {
      final response = await _client.patch(
        DealerApiConfig.resolveApiUri('/dealer/notifications/$remoteId/unread'),
        headers: await _authorizedJsonHeaders(),
      );
      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        return _extractErrorMessage(payload);
      }
      return null;
    } catch (_) {
      return _notificationSyncUnavailableMarker;
    }
  }

  Future<String?> _markAllRemoteRead() async {
    try {
      final response = await _client.patch(
        DealerApiConfig.resolveApiUri('/dealer/notifications/read-all'),
        headers: await _authorizedJsonHeaders(),
      );
      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        return _extractErrorMessage(payload);
      }
      return null;
    } catch (_) {
      return _notificationSyncUnavailableMarker;
    }
  }

  void _trimReadIdsToKnownNotices() {
    final knownIds = _notices.map((notice) => notice.id).toSet();
    _readIds.removeWhere((id) => !knownIds.contains(id));
  }

  bool _containsNotice(String id) {
    return _notices.any((notice) => notice.id == id);
  }

  void _handleSessionEvent() {
    final currentVersion = _authStorage.sessionEventVersion;
    if (currentVersion == _handledSessionEventVersion) {
      return;
    }
    _handledSessionEventVersion = currentVersion;

    switch (_authStorage.lastSessionEvent) {
      case AuthSessionEventType.signedIn:
        unawaited(_reloadAndReconnect());
        break;
      case AuthSessionEventType.loggedOut:
      case AuthSessionEventType.expired:
        unawaited(clearSessionData());
        break;
      case AuthSessionEventType.none:
        break;
    }
  }

  Future<void> _reloadAndReconnect() async {
    await _loadRemoteNotifications();
    await _emitOrderSignal();
    await _syncRealtimeConnection(forceReconnect: true);
  }

  Future<void> _syncRealtimeConnection({bool forceReconnect = false}) async {
    if (_disposed || !DealerApiConfig.isConfigured) {
      _stopRealtimeConnection();
      return;
    }

    final token = await _readAccessToken();
    if (token == null) {
      _stopRealtimeConnection();
      return;
    }

    _maintainRealtimeConnection = true;
    _ensureFallbackRefresh();
    if (!forceReconnect &&
        _stompClient != null &&
        _stompClient!.isActive &&
        (_stompClient!.connected || _realtimeConnecting) &&
        _realtimeToken == token) {
      return;
    }

    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _realtimeConnecting = true;
    _realtimeToken = token;

    final previousClient = _stompClient;
    final connectionId = ++_socketGeneration;
    _stompClient = null;
    previousClient?.deactivate();

    late final StompClient nextClient;
    nextClient = StompClient(
      config: StompConfig.sockJS(
        url: DealerApiConfig.webSocketEndpointUrl,
        reconnectDelay: Duration.zero,
        connectionTimeout: const Duration(seconds: 10),
        heartbeatIncoming: const Duration(seconds: 15),
        heartbeatOutgoing: const Duration(seconds: 15),
        stompConnectHeaders: <String, String>{'Authorization': 'Bearer $token'},
        webSocketConnectHeaders: <String, dynamic>{
          'Authorization': 'Bearer $token',
        },
        onConnect: (_) {
          if (_disposed || connectionId != _socketGeneration) {
            nextClient.deactivate();
            return;
          }
          _realtimeConnecting = false;
          _stompClient = nextClient;
          nextClient.subscribe(
            destination: '/user/queue/notifications',
            callback: (frame) => _handleRealtimeFrame(connectionId, frame),
          );
          nextClient.subscribe(
            destination: '/user/queue/order-status',
            callback: (frame) => _handleOrderStatusFrame(connectionId, frame),
          );
        },
        onDisconnect: (_) => _handleRealtimeDisconnect(connectionId),
        onStompError: (_) => _handleRealtimeDisconnect(connectionId),
        onWebSocketError: (_) => _handleRealtimeDisconnect(connectionId),
        onWebSocketDone: () => _handleRealtimeDisconnect(connectionId),
      ),
    );

    _stompClient = nextClient;
    try {
      nextClient.activate();
    } catch (e) {
      debugPrint('NotificationController: STOMP activate error: $e');
      _handleRealtimeDisconnect(connectionId);
    }
  }

  void _handleRealtimeDisconnect(int connectionId) {
    if (_disposed || connectionId != _socketGeneration) {
      return;
    }

    _realtimeConnecting = false;
    _stompClient = null;
    if (!_maintainRealtimeConnection) {
      return;
    }

    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(_reconnectDelay, () {
      _reconnectTimer = null;
      if (_disposed || !_maintainRealtimeConnection) {
        return;
      }
      _reloadAndReconnect().catchError((Object e) {
        debugPrint('NotificationController: reconnect error: $e');
      });
    });
  }

  void _ensureFallbackRefresh() {
    if (_fallbackRefreshTimer != null) {
      return;
    }
    _fallbackRefreshTimer = Timer.periodic(_fallbackRefreshInterval, (_) {
      unawaited(_runFallbackRefresh());
    });
  }

  Future<void> _runFallbackRefresh() async {
    if (_disposed || !_maintainRealtimeConnection || _fallbackRefreshInFlight) {
      return;
    }
    _fallbackRefreshInFlight = true;
    try {
      await _loadRemoteNotifications();
      await _emitOrderSignal();
    } finally {
      _fallbackRefreshInFlight = false;
    }
  }

  void _handleRealtimeFrame(int connectionId, StompFrame frame) {
    if (_disposed || connectionId != _socketGeneration) {
      return;
    }

    final payload = _decodeBody(frame.body ?? '');
    final remoteId = _parseInt(payload['id'], fallback: -1);
    if (remoteId <= 0) {
      unawaited(_loadRemoteNotifications());
      return;
    }

    final notice = DistributorNotice(
      id: remoteId.toString(),
      type: _mapRemoteType(payload['type']?.toString()),
      title: _normalizeString(payload['title']) ?? 'ThĂ´ng bĂ¡o',
      message: _normalizeString(payload['body']) ?? '',
      createdAt: parseApiDateTime(payload['createdAt']) ?? DateTime.now(),
      link: _normalizeString(payload['link']),
      deepLink: _normalizeString(payload['deepLink']),
    );

    final existingIndex = _notices.indexWhere((entry) => entry.id == notice.id);
    if (existingIndex >= 0) {
      _notices[existingIndex] = notice;
      // Re-sort only if the timestamp changed (existing entry updated).
      _notices.sort((left, right) => right.createdAt.compareTo(left.createdAt));
    } else {
      // Insert in sorted position (descending by createdAt) to avoid full sort.
      int insertAt = _notices.length;
      for (int i = 0; i < _notices.length; i++) {
        if (_notices[i].createdAt.compareTo(notice.createdAt) <= 0) {
          insertAt = i;
          break;
        }
      }
      _notices.insert(insertAt, notice);
    }
    _remoteNoticeIds[notice.id] = remoteId;
    if (_parseBool(payload['isRead'])) {
      _readIds.add(notice.id);
    } else {
      _readIds.remove(notice.id);
    }
    _trimReadIdsToKnownNotices();
    notifyListeners();
    _emitIncomingNotice(notice);
    if (notice.type == NoticeType.order) {
      unawaited(_emitOrderSignal());
    }
    final noticeTarget = (notice.deepLink ?? notice.link)?.trim() ?? '';
    if (noticeTarget.startsWith('/support')) {
      _incomingSupportEventVersion.value =
          _incomingSupportEventVersion.value + 1;
    }
  }

  void _handleOrderStatusFrame(int connectionId, StompFrame frame) {
    if (_disposed || connectionId != _socketGeneration) {
      return;
    }

    final payload = _decodeBody(frame.body ?? '');
    final orderCode = payload['orderCode']?.toString();
    final status = payload['status']?.toString();
    final paymentStatus = payload['paymentStatus']?.toString();

    if (orderCode != null &&
        orderCode.isNotEmpty &&
        status != null &&
        status.isNotEmpty &&
        _onOrderStatusEvent != null) {
      final paidAmount = _parseAmount(payload['paidAmount']);
      _onOrderStatusEvent(
        orderCode,
        status,
        paymentStatus ?? '',
        paidAmount: paidAmount,
      );
      return;
    }

    unawaited(_emitOrderSignal());
  }

  int? _parseAmount(Object? value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.round();
    final parsed = double.tryParse(value.toString());
    return parsed?.round();
  }

  void _stopRealtimeConnection() {
    _maintainRealtimeConnection = false;
    _realtimeConnecting = false;
    _realtimeToken = null;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _fallbackRefreshTimer?.cancel();
    _fallbackRefreshTimer = null;
    _socketGeneration += 1;

    final activeClient = _stompClient;
    _stompClient = null;
    activeClient?.deactivate();
  }

  Future<void> _emitOrderSignal() async {
    final handler = _onOrderSignal;
    if (handler == null) {
      return;
    }

    final existing = _orderSignalInFlight;
    if (existing != null) {
      return existing;
    }

    final inFlight = handler();
    _orderSignalInFlight = inFlight;
    try {
      await inFlight;
    } catch (_) {
      // Ignore realtime sync failures; manual refresh remains available.
    } finally {
      if (identical(_orderSignalInFlight, inFlight)) {
        _orderSignalInFlight = null;
      }
    }
  }

  void _emitIncomingNotice(DistributorNotice notice) {
    _latestIncomingNotice = notice;
    _incomingNoticeEventVersion.value = _incomingNoticeEventVersion.value + 1;
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

  String _extractErrorMessage(Map<String, dynamic> payload) {
    final error = payload['error']?.toString();
    if (error != null && error.trim().isNotEmpty) {
      return error.trim();
    }
    return _notificationSyncUnavailableMarker;
  }

  NoticeType _mapRemoteType(String? raw) {
    switch ((raw ?? '').trim().toUpperCase()) {
      case 'ORDER':
        return NoticeType.order;
      case 'PROMOTION':
        return NoticeType.promotion;
      case 'WARRANTY':
        return NoticeType.warranty;
      case 'SYSTEM':
      default:
        return NoticeType.system;
    }
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

  bool _parseBool(Object? value) {
    if (value is bool) {
      return value;
    }
    return value?.toString().toLowerCase() == 'true';
  }

  String? _normalizeString(Object? value) {
    final text = value?.toString().trim() ?? '';
    return text.isEmpty ? null : text;
  }

  @override
  void dispose() {
    _disposed = true;
    _authStorage.sessionEvents.removeListener(_handleSessionEvent);
    _stopRealtimeConnection();
    _incomingNoticeEventVersion.dispose();
    _incomingSupportEventVersion.dispose();
    _client.close();
    super.dispose();
  }
}

class NotificationScope extends InheritedNotifier<NotificationController> {
  const NotificationScope({
    super.key,
    required NotificationController controller,
    required super.child,
  }) : super(notifier: controller);

  static NotificationController of(BuildContext context) {
    final scope = context
        .dependOnInheritedWidgetOfExactType<NotificationScope>();
    assert(scope != null, 'NotificationScope not found in widget tree');
    return scope!.notifier!;
  }
}
