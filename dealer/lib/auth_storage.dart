import 'package:flutter/foundation.dart';
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
  static String? _sessionAccessToken;
  static String? _sessionRefreshToken;
  static final ValueNotifier<int> _sessionEventVersion = ValueNotifier<int>(0);
  static AuthSessionEventType _lastSessionEvent = AuthSessionEventType.none;
  static String? _lastSessionEventMessage;

  ValueListenable<int> get sessionEvents => _sessionEventVersion;

  AuthSessionEventType get lastSessionEvent => _lastSessionEvent;

  String? get lastSessionEventMessage => _lastSessionEventMessage;

  int get sessionEventVersion => _sessionEventVersion.value;

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

    final token =
        prefs.getString(authAccessTokenKey) ?? prefs.getString('auth_token');
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
      await prefs.remove(authAccessTokenKey);
      await prefs.remove(authRefreshTokenKey);
      await prefs.remove('auth_token');
      _emitSessionEvent(AuthSessionEventType.signedIn);
      return;
    }

    await prefs.setBool(rememberMeKey, true);
    await prefs.setBool(loggedInKey, true);
    await prefs.setString(rememberEmailKey, email);
    await prefs.setString(authAccessTokenKey, accessToken);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await prefs.setString(authRefreshTokenKey, refreshToken);
    } else {
      await prefs.remove(authRefreshTokenKey);
    }
    _emitSessionEvent(AuthSessionEventType.signedIn);
  }

  Future<String?> readAccessToken() async {
    if (_sessionAccessToken != null && _sessionAccessToken!.isNotEmpty) {
      return _sessionAccessToken;
    }
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(authAccessTokenKey) ?? prefs.getString('auth_token');
  }

  Future<String?> readRefreshToken() async {
    if (_sessionRefreshToken != null && _sessionRefreshToken!.isNotEmpty) {
      return _sessionRefreshToken;
    }
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(authRefreshTokenKey);
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

    await prefs.setString(authAccessTokenKey, normalizedAccessToken);
    await prefs.setString('auth_token', normalizedAccessToken);
    if (refreshToken != null && refreshToken.trim().isNotEmpty) {
      await prefs.setString(authRefreshTokenKey, refreshToken.trim());
    }
  }

  Future<void> expireSession({String? message}) async {
    _sessionAccessToken = null;
    _sessionRefreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(loggedInKey, false);
    await prefs.remove(authAccessTokenKey);
    await prefs.remove(authRefreshTokenKey);
    await prefs.remove('auth_token');
    _emitSessionEvent(AuthSessionEventType.expired, message: message);
  }

  Future<void> clearSession() async {
    _sessionAccessToken = null;
    _sessionRefreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(rememberMeKey, false);
    await prefs.setBool(loggedInKey, false);
    await prefs.remove(rememberEmailKey);
    await prefs.remove(authAccessTokenKey);
    await prefs.remove(authRefreshTokenKey);
    await prefs.remove('auth_token');
    _emitSessionEvent(AuthSessionEventType.loggedOut);
  }

  void _emitSessionEvent(AuthSessionEventType eventType, {String? message}) {
    _lastSessionEvent = eventType;
    _lastSessionEventMessage = message?.trim().isEmpty ?? true
        ? null
        : message?.trim();
    _sessionEventVersion.value = _sessionEventVersion.value + 1;
  }
}
