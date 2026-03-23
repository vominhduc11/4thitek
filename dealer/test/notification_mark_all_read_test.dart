import 'dart:convert';

import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/notification_controller.dart';
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

  test('markAllAsRead syncs successfully without requiring per-notice remote ids', () async {
    final storage = AuthStorage();
    await storage.persistLogin(
      rememberMe: true,
      email: 'dealer@example.com',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    );

    final client = _FakeNotificationClient();
    final controller = NotificationController(
      authStorage: storage,
      client: client,
    );

    controller.seedNoticesForTesting(<DistributorNotice>[
      DistributorNotice(
        id: 'n-1',
        type: NoticeType.system,
        title: 'Thong bao 1',
        message: 'Noi dung 1',
        createdAt: DateTime(2026, 3, 23, 12),
      ),
      DistributorNotice(
        id: 'n-2',
        type: NoticeType.order,
        title: 'Thong bao 2',
        message: 'Noi dung 2',
        createdAt: DateTime(2026, 3, 23, 12, 5),
      ),
    ]);

    final error = await controller.markAllAsRead();

    expect(error, isNull);
    expect(controller.unreadCount, 0);
    expect(client.markAllReadCalls, 1);
  });
}

class _FakeNotificationClient extends http.BaseClient {
  int markAllReadCalls = 0;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    if (request.method == 'PATCH' &&
        request.url.path.endsWith('/api/v1/dealer/notifications/read-all')) {
      markAllReadCalls += 1;
      return _jsonResponse(
        request,
        200,
        <String, Object>{
          'success': true,
          'data': <String, Object>{'status': 'updated', 'updatedCount': 2},
        },
      );
    }

    return _jsonResponse(
      request,
      404,
      <String, Object>{'success': false, 'error': 'Not found'},
    );
  }

  http.StreamedResponse _jsonResponse(
    http.BaseRequest request,
    int statusCode,
    Map<String, Object> payload,
  ) {
    return http.StreamedResponse(
      Stream<List<int>>.value(utf8.encode(jsonEncode(payload))),
      statusCode,
      request: request,
      headers: const <String, String>{'content-type': 'application/json'},
    );
  }
}
