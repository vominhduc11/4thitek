import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String rememberMeKey = 'remember_me';
const String loggedInKey = 'logged_in';
const String rememberEmailKey = 'remember_email';
const String authAccessTokenKey = 'auth_access_token';
const String authRefreshTokenKey = 'auth_refresh_token';

enum AuthSessionEventType { none, signedIn, loggedOut, expired }

class RememberedLogin {
  const RememberedLogin({required this.rememberMe, required this.email});

  final bool rememberMe;
  final String email;
}

class AuthStorage {
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();
  static String? _sessionAccessToken;
  static String? _sessionRefreshToken;
  static final ValueNotifier<int> _sessionEventVersion = ValueNotifier<int>(0);
  static AuthSessionEventType _lastSessionEvent = AuthSessionEventType.none;
  static String? _lastSessionEventMessage;

  ValueListenable<int> get sessionEvents => _sessionEventVersion;

  AuthSessionEventType get lastSessionEvent => _lastSessionEvent;

  String? get lastSessionEventMessage => _lastSessionEventMessage;

  int get sessionEventVersion => _sessionEventVersion.value;

  static String? get currentAccessToken => _sessionAccessToken;

  Future<RememberedLogin> readRememberedLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final rememberMe = prefs.getBool(rememberMeKey) ?? false;
    final email = prefs.getString(rememberEmailKey) ?? '';
    return RememberedLogin(rememberMe: rememberMe, email: email);
  }

  Future<bool> shouldAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final rememberMe = prefs.getBool(rememberMeKey) ?? false;
    final loggedIn = prefs.getBool(loggedInKey) ?? false;
    if (!rememberMe || !loggedIn) {
      return false;
    }

    final token = await _readPersistedAccessToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> persistLogin({
    required bool rememberMe,
    required String email,
    required String accessToken,
    String? refreshToken,
  }) async {
    _sessionAccessToken = accessToken;
    _sessionRefreshToken = refreshToken;
    final prefs = await SharedPreferences.getInstance();
    if (!rememberMe) {
      await prefs.setBool(rememberMeKey, false);
      await prefs.setBool(loggedInKey, false);
      await prefs.remove(rememberEmailKey);
      await _deletePersistedTokens(prefs);
      _emitSessionEvent(AuthSessionEventType.signedIn);
      return;
    }

    await prefs.setBool(rememberMeKey, true);
    await prefs.setBool(loggedInKey, true);
    await prefs.setString(rememberEmailKey, email);
    final storedAccessToken = await _writeSecureValue(
      authAccessTokenKey,
      accessToken,
    );
    if (refreshToken != null && refreshToken.isNotEmpty) {
      final storedRefreshToken = await _writeSecureValue(
        authRefreshTokenKey,
        refreshToken,
      );
      if (!storedRefreshToken) {
        await prefs.setString(authRefreshTokenKey, refreshToken);
      }
    } else {
      await _deleteSecureValue(authRefreshTokenKey);
      await prefs.remove(authRefreshTokenKey);
    }
    if (storedAccessToken) {
      await prefs.remove(authAccessTokenKey);
      await prefs.remove('auth_token');
    } else {
      await prefs.setString(authAccessTokenKey, accessToken);
    }
    _emitSessionEvent(AuthSessionEventType.signedIn);
  }

  Future<String?> readAccessToken() async {
    if (_sessionAccessToken != null && _sessionAccessToken!.isNotEmpty) {
      return _sessionAccessToken;
    }
    final storedToken = await _readPersistedAccessToken();
    if (storedToken != null && storedToken.isNotEmpty) {
      _sessionAccessToken = storedToken;
    }
    return storedToken;
  }

  Future<String?> readRefreshToken() async {
    if (_sessionRefreshToken != null && _sessionRefreshToken!.isNotEmpty) {
      return _sessionRefreshToken;
    }
    final storedToken = await _readPersistedRefreshToken();
    if (storedToken != null && storedToken.isNotEmpty) {
      _sessionRefreshToken = storedToken;
    }
    return storedToken;
  }

  Future<void> updateTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    final normalizedAccessToken = accessToken.trim();
    if (normalizedAccessToken.isEmpty) {
      return;
    }

    _sessionAccessToken = normalizedAccessToken;
    if (refreshToken != null && refreshToken.trim().isNotEmpty) {
      _sessionRefreshToken = refreshToken.trim();
    }

    final prefs = await SharedPreferences.getInstance();
    final rememberMe = prefs.getBool(rememberMeKey) ?? false;
    final loggedIn = prefs.getBool(loggedInKey) ?? false;
    if (!rememberMe || !loggedIn) {
      return;
    }

    final storedAccessToken = await _writeSecureValue(
      authAccessTokenKey,
      normalizedAccessToken,
    );
    if (refreshToken != null && refreshToken.trim().isNotEmpty) {
      final storedRefreshToken = await _writeSecureValue(
        authRefreshTokenKey,
        refreshToken.trim(),
      );
      if (!storedRefreshToken) {
        await prefs.setString(authRefreshTokenKey, refreshToken.trim());
      }
    } else {
      await prefs.remove(authRefreshTokenKey);
    }
    if (storedAccessToken) {
      await prefs.remove(authAccessTokenKey);
      await prefs.remove('auth_token');
    } else {
      await prefs.setString(authAccessTokenKey, normalizedAccessToken);
    }
  }

  Future<void> expireSession({String? message}) async {
    _sessionAccessToken = null;
    _sessionRefreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(loggedInKey, false);
    await _deletePersistedTokens(prefs);
    _emitSessionEvent(AuthSessionEventType.expired, message: message);
  }

  Future<void> clearSession() async {
    _sessionAccessToken = null;
    _sessionRefreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(rememberMeKey, false);
    await prefs.setBool(loggedInKey, false);
    await prefs.remove(rememberEmailKey);
    await _deletePersistedTokens(prefs);
    _emitSessionEvent(AuthSessionEventType.loggedOut);
  }

  Future<String?> _readPersistedAccessToken() async {
    final secureToken = await _readSecureValue(authAccessTokenKey);
    if (secureToken != null && secureToken.isNotEmpty) {
      return secureToken;
    }

    final prefs = await SharedPreferences.getInstance();
    final legacyToken =
        prefs.getString(authAccessTokenKey) ?? prefs.getString('auth_token');
    if (legacyToken != null && legacyToken.isNotEmpty) {
      final storedSecurely = await _writeSecureValue(
        authAccessTokenKey,
        legacyToken,
      );
      if (storedSecurely) {
        await prefs.remove(authAccessTokenKey);
        await prefs.remove('auth_token');
      }
    }
    return legacyToken;
  }

  Future<String?> _readPersistedRefreshToken() async {
    final secureToken = await _readSecureValue(authRefreshTokenKey);
    if (secureToken != null && secureToken.isNotEmpty) {
      return secureToken;
    }

    final prefs = await SharedPreferences.getInstance();
    final legacyToken = prefs.getString(authRefreshTokenKey);
    if (legacyToken != null && legacyToken.isNotEmpty) {
      final storedSecurely = await _writeSecureValue(
        authRefreshTokenKey,
        legacyToken,
      );
      if (storedSecurely) {
        await prefs.remove(authRefreshTokenKey);
      }
    }
    return legacyToken;
  }

  Future<void> _deletePersistedTokens(SharedPreferences prefs) async {
    await _deleteSecureValue(authAccessTokenKey);
    await _deleteSecureValue(authRefreshTokenKey);
    await prefs.remove(authAccessTokenKey);
    await prefs.remove(authRefreshTokenKey);
    await prefs.remove('auth_token');
  }

  Future<String?> _readSecureValue(String key) async {
    try {
      return await _secureStorage.read(key: key);
    } on MissingPluginException {
      return null;
    } on PlatformException {
      return null;
    } on FlutterError {
      return null;
    } on AssertionError {
      return null;
    }
  }

  Future<bool> _writeSecureValue(String key, String value) async {
    try {
      await _secureStorage.write(key: key, value: value);
      return true;
    } on MissingPluginException {
      return false;
    } on PlatformException {
      return false;
    } on FlutterError {
      return false;
    } on AssertionError {
      return false;
    }
  }

  Future<void> _deleteSecureValue(String key) async {
    try {
      await _secureStorage.delete(key: key);
    } on MissingPluginException {
      return;
    } on PlatformException {
      return;
    } on FlutterError {
      return;
    } on AssertionError {
      return;
    }
  }

  void _emitSessionEvent(AuthSessionEventType eventType, {String? message}) {
    _lastSessionEvent = eventType;
    _lastSessionEventMessage = message?.trim().isEmpty ?? true
        ? null
        : message?.trim();
    _sessionEventVersion.value = _sessionEventVersion.value + 1;
  }
}
