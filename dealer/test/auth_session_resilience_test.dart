import 'dart:convert';

import 'package:dealer_hub/api_config.dart';
import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/dealer_auth_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final storage = AuthStorage();
    await storage.clearSession();
  });

  test('shouldAutoLogin returns false when refresh token is missing', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      rememberMeKey: true,
      loggedInKey: true,
      rememberEmailKey: 'dealer@example.com',
      authAccessTokenKey: 'legacy-access-token',
    });

    final storage = AuthStorage();

    final shouldAutoLogin = await storage.shouldAutoLogin();
    final prefs = await SharedPreferences.getInstance();

    expect(shouldAutoLogin, isFalse);
    expect(prefs.getBool(loggedInKey), isFalse);
    expect(await storage.readAccessToken(), isNull);
    expect(await storage.readRefreshToken(), isNull);
  });

  test('dealer auth client expires session when protected api returns 401 and refresh token is missing', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      rememberMeKey: true,
      loggedInKey: true,
      rememberEmailKey: 'dealer@example.com',
      authAccessTokenKey: 'legacy-access-token',
    });

    final storage = AuthStorage();
    final client = DealerAuthClient(
      authStorage: storage,
      inner: _FakeAuthFailureClient(),
    );

    final response = await client.get(
      DealerApiConfig.resolveApiUri('/dealer/profile'),
      headers: const <String, String>{'Accept': 'application/json'},
    );

    expect(response.statusCode, 401);
    expect(storage.lastSessionEvent, AuthSessionEventType.expired);
    expect(await storage.readAccessToken(), isNull);
    expect(await storage.readRefreshToken(), isNull);
  });
}

class _FakeAuthFailureClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final body = jsonEncode(<String, Object>{
      'success': false,
      'error': 'Invalid or expired token',
    });
    return http.StreamedResponse(
      Stream<List<int>>.value(utf8.encode(body)),
      401,
      request: request,
      headers: const <String, String>{'content-type': 'application/json'},
    );
  }
}
