import 'dart:convert';

import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/l10n/app_localizations.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/notification_controller.dart';
import 'package:dealer_hub/notifications_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'Notifications screen exposes a single mark-all-read action when unread exists',
    (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final settingsController = AppSettingsController();
      await settingsController.setLocale(const Locale('en'));
      final controller = NotificationController(
        authStorage: AuthStorage(),
        client: _NoopNotificationClient(),
      );
      addTearDown(controller.dispose);

      controller.seedNoticesForTesting(<DistributorNotice>[
        DistributorNotice(
          id: 'notice-1',
          type: NoticeType.order,
          title: 'Order update',
          message: 'Order is processing',
          createdAt: DateTime(2026, 4, 14, 10, 30),
        ),
      ]);

      await tester.pumpWidget(
        AppSettingsScope(
          controller: settingsController,
          child: MaterialApp(
            locale: const Locale('en'),
            supportedLocales: AppLocalizations.supportedLocales,
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            home: NotificationScope(
              controller: controller,
              child: const NotificationsScreen(),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byIcon(Icons.done_all_outlined), findsOneWidget);
    },
  );
}

class _NoopNotificationClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final payload = jsonEncode(<String, Object>{'success': true});
    return http.StreamedResponse(
      Stream<List<int>>.value(utf8.encode(payload)),
      200,
      request: request,
      headers: const <String, String>{'content-type': 'application/json'},
    );
  }
}
