import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String rememberMeKey = 'remember_me';
const String loggedInKey = 'logged_in';
const String rememberEmailKey = 'remember_email';
const String authTokenKey = 'auth_token';

class RememberedLogin {
  const RememberedLogin({required this.rememberMe, required this.email});

  final bool rememberMe;
  final String email;
}

class AuthStorage {
  AuthStorage({FlutterSecureStorage? secureStorage})
    : _secureStorage = secureStorage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _secureStorage;

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

    final token = await _readToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> persistLogin({
    required bool rememberMe,
    required String email,
    required String token,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    if (rememberMe) {
      await prefs.setBool(rememberMeKey, true);
      await prefs.setBool(loggedInKey, true);
      await prefs.setString(rememberEmailKey, email);
      await _writeToken(token);
      return;
    }

    await clearSession();
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(rememberMeKey, false);
    await prefs.setBool(loggedInKey, false);
    await prefs.remove(rememberEmailKey);
    await _deleteToken();
  }

  Future<void> _writeToken(String token) async {
    try {
      await _secureStorage.write(key: authTokenKey, value: token);
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(authTokenKey);
    } on MissingPluginException {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(authTokenKey, token);
    } on PlatformException {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(authTokenKey, token);
    }
  }

  Future<String?> _readToken() async {
    try {
      return await _secureStorage.read(key: authTokenKey);
    } on MissingPluginException {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(authTokenKey);
    } on PlatformException {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(authTokenKey);
    }
  }

  Future<void> _deleteToken() async {
    try {
      await _secureStorage.delete(key: authTokenKey);
    } on MissingPluginException {
      // Fallback to shared preferences below.
    } on PlatformException {
      // Fallback to shared preferences below.
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(authTokenKey);
  }
}
