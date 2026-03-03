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

    final token = prefs.getString(authTokenKey);
    return token != null && token.isNotEmpty;
  }

  Future<void> persistLogin({
    required bool rememberMe,
    required String email,
    required String token,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    if (!rememberMe) {
      await clearSession();
      return;
    }

    await prefs.setBool(rememberMeKey, true);
    await prefs.setBool(loggedInKey, true);
    await prefs.setString(rememberEmailKey, email);
    await prefs.setString(authTokenKey, token);
  }

  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(rememberMeKey, false);
    await prefs.setBool(loggedInKey, false);
    await prefs.remove(rememberEmailKey);
    await prefs.remove(authTokenKey);
  }
}
