import 'dart:async';
import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'dealer_routes.dart';
import 'firebase_app_options_provider.dart';

@pragma('vm:entry-point')
Future<void> dealerFirebaseMessagingBackgroundHandler(
  RemoteMessage message,
) async {
  final initialized = await DealerFirebaseOptionsProvider.ensureInitialized();
  if (!initialized) {
    return;
  }
}

class PushMessagingController extends ChangeNotifier {
  PushMessagingController({
    AuthStorage? authStorage,
    http.Client? client,
    Future<void> Function()? onNotificationSignal,
    Future<void> Function()? onOrderSignal,
    bool enabled = true,
  }) : _authStorage = authStorage ?? AuthStorage(),
       _client = DealerAuthClient(
         authStorage: authStorage ?? AuthStorage(),
         inner: client ?? http.Client(),
       ),
       _onNotificationSignal = onNotificationSignal,
       _onOrderSignal = onOrderSignal,
       _enabled = enabled;

  final AuthStorage _authStorage;
  final http.Client _client;
  final Future<void> Function()? _onNotificationSignal;
  final Future<void> Function()? _onOrderSignal;
  final bool _enabled;
  final ValueNotifier<int> _openMessageEvents = ValueNotifier<int>(0);

  StreamSubscription<String>? _tokenRefreshSubscription;
  StreamSubscription<RemoteMessage>? _foregroundMessageSubscription;
  StreamSubscription<RemoteMessage>? _openedMessageSubscription;

  bool _initialized = false;
  bool _available = false;
  bool _initializing = false;
  int _handledSessionEventVersion = 0;
  String? _registeredToken;
  String? _pendingRoute;
  String? _lastSyncError;
  PackageInfo? _packageInfo;

  ValueListenable<int> get openMessageEvents => _openMessageEvents;

  int get openMessageEventVersion => _openMessageEvents.value;

  bool get isAvailable => _available;

  String? get lastSyncError => _lastSyncError;

  String? consumePendingRoute() {
    final route = _pendingRoute;
    _pendingRoute = null;
    return route;
  }

  Future<void> initialize() async {
    if (!_enabled) {
      _available = false;
      _initialized = true;
      notifyListeners();
      return;
    }
    if (_initialized || _initializing) {
      return;
    }
    _initializing = true;
    try {
      final initialized =
          await DealerFirebaseOptionsProvider.ensureInitialized();
      if (!initialized) {
        _available = false;
        return;
      }
      FirebaseMessaging.onBackgroundMessage(
        dealerFirebaseMessagingBackgroundHandler,
      );

      final messaging = FirebaseMessaging.instance;
      await messaging.setAutoInitEnabled(true);
      await messaging.requestPermission(alert: true, badge: true, sound: true);
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      _foregroundMessageSubscription = FirebaseMessaging.onMessage.listen(
        (message) => unawaited(_handleForegroundMessage(message)),
      );
      _openedMessageSubscription = FirebaseMessaging.onMessageOpenedApp.listen(
        (message) => unawaited(_handleOpenedMessage(message)),
      );
      _tokenRefreshSubscription = messaging.onTokenRefresh.listen(
        (token) => unawaited(_registerToken(token)),
      );

      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        await _handleOpenedMessage(initialMessage);
      }

      _authStorage.sessionEvents.addListener(_handleSessionEvent);
      _available = true;
      _initialized = true;
      _packageInfo = await PackageInfo.fromPlatform();
      await refreshRegistration();
    } catch (e) {
      debugPrint('Push messaging init failed: $e');
      _available = false;
    } finally {
      _initializing = false;
      notifyListeners();
    }
  }

  Future<void> refreshRegistration() async {
    if (!_enabled || !_available) {
      return;
    }
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null || token.trim().isEmpty) {
        return;
      }
      await _registerToken(token.trim());
    } catch (error) {
      _lastSyncError = error.toString();
      notifyListeners();
    }
  }

  Future<void> unregisterCurrentToken() async {
    if (!_enabled || !_available) {
      return;
    }
    final token =
        _registeredToken ?? await FirebaseMessaging.instance.getToken();
    if (token == null || token.trim().isEmpty) {
      return;
    }
    final accessToken = await _authStorage.readAccessToken();
    if (accessToken == null ||
        accessToken.isEmpty ||
        !DealerApiConfig.isConfigured) {
      _registeredToken = null;
      return;
    }

    try {
      final uri = Uri.parse(
        DealerApiConfig.resolveApiUrl('/dealer/push-tokens'),
      ).replace(queryParameters: <String, String>{'token': token.trim()});
      await _client.delete(
        uri,
        headers: <String, String>{
          'Accept': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
      );
      _registeredToken = null;
      _lastSyncError = null;
    } catch (error) {
      _lastSyncError = error.toString();
    } finally {
      notifyListeners();
    }
  }

  Future<void> _registerToken(String token) async {
    if (!DealerApiConfig.isConfigured) {
      return;
    }
    final accessToken = await _authStorage.readAccessToken();
    if (accessToken == null || accessToken.isEmpty) {
      _registeredToken = token;
      return;
    }
    final packageInfo = _packageInfo ?? await PackageInfo.fromPlatform();
    _packageInfo = packageInfo;
    final payload = <String, String>{
      'token': token,
      'platform': _platformValue(),
      'appVersion': _resolveAppVersion(packageInfo),
      'deviceName': defaultTargetPlatform.name,
      'languageCode':
          WidgetsBinding.instance.platformDispatcher.locale.languageCode,
    };

    try {
      final response = await _client.post(
        DealerApiConfig.resolveApiUri('/dealer/push-tokens'),
        headers: <String, String>{
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode(payload),
      );
      if (response.statusCode >= 400) {
        _lastSyncError = 'push.register.failed';
      } else {
        _registeredToken = token;
        _lastSyncError = null;
      }
    } catch (error) {
      _lastSyncError = error.toString();
    } finally {
      notifyListeners();
    }
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    await _syncLocalStateFromPush(message);
  }

  Future<void> _handleOpenedMessage(RemoteMessage message) async {
    await _syncLocalStateFromPush(message);
    final route = _resolveRouteFromMessage(message);
    if (route == null) {
      return;
    }
    _pendingRoute = route;
    _openMessageEvents.value = _openMessageEvents.value + 1;
  }

  Future<void> _syncLocalStateFromPush(RemoteMessage message) async {
    await _onNotificationSignal?.call();
    final type = (message.data['type'] ?? '').trim().toUpperCase();
    final route = _resolveRouteFromMessage(message);
    if (type == 'ORDER' ||
        (route?.startsWith(DealerRoutePath.orders) ?? false)) {
      await _onOrderSignal?.call();
    }
  }

  String? _resolveRouteFromMessage(RemoteMessage message) {
    return normalizeDealerInternalRoute(
      message.data['deepLink'] ?? message.data['link'],
    );
  }

  void _handleSessionEvent() {
    final currentVersion = _authStorage.sessionEventVersion;
    if (currentVersion == _handledSessionEventVersion) {
      return;
    }
    _handledSessionEventVersion = currentVersion;
    switch (_authStorage.lastSessionEvent) {
      case AuthSessionEventType.signedIn:
        unawaited(refreshRegistration());
        break;
      case AuthSessionEventType.loggedOut:
      case AuthSessionEventType.expired:
        _registeredToken = null;
        notifyListeners();
        break;
      case AuthSessionEventType.none:
        break;
    }
  }

  String _platformValue() {
    switch (defaultTargetPlatform) {
      case TargetPlatform.iOS:
        return 'IOS';
      default:
        return 'ANDROID';
    }
  }

  String _resolveAppVersion(PackageInfo packageInfo) {
    final version = packageInfo.version.trim();
    final buildNumber = packageInfo.buildNumber.trim();
    return buildNumber.isEmpty ? version : '$version+$buildNumber';
  }

  @override
  void dispose() {
    _authStorage.sessionEvents.removeListener(_handleSessionEvent);
    _tokenRefreshSubscription?.cancel();
    _foregroundMessageSubscription?.cancel();
    _openedMessageSubscription?.cancel();
    _openMessageEvents.dispose();
    super.dispose();
  }
}

class PushMessagingScope extends InheritedNotifier<PushMessagingController> {
  const PushMessagingScope({
    super.key,
    required PushMessagingController controller,
    required super.child,
  }) : super(notifier: controller);

  static PushMessagingController of(BuildContext context) {
    final scope = context
        .dependOnInheritedWidgetOfExactType<PushMessagingScope>();
    assert(scope != null, 'PushMessagingScope not found in widget tree.');
    return scope!.notifier!;
  }

  static PushMessagingController? maybeOf(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<PushMessagingScope>()
        ?.notifier;
  }
}
