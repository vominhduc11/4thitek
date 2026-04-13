import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/notification_controller.dart';
import 'package:dealer_hub/support_screen.dart';
import 'package:dealer_hub/support_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Support screen localizes service error in English', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(
      await _buildApp(
        const Locale('en'),
        supportService: _FakeSupportService(
          submitError: SupportException(
            supportServiceMessageToken(SupportMessageCode.syncFailed),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final submitButton = find.byKey(
      const ValueKey<String>('support-submit-button'),
    );
    await tester.scrollUntilVisible(
      submitButton,
      300,
      scrollable: find
          .descendant(
            of: find.byKey(const ValueKey<String>('support-scroll-view')),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).at(0), 'Need help soon');
    await tester.enterText(
      find.byType(TextField).at(1),
      'Order status has been stuck for two days and needs support.',
    );
    await tester.ensureVisible(submitButton);
    tester.widget<ElevatedButton>(submitButton).onPressed!.call();
    await tester.pumpAndSettle();
    await tester.tap(
      find.byKey(const ValueKey<String>('support-confirm-submit-button')),
    );
    await tester.pumpAndSettle();

    expect(find.text('Unable to sync support request.'), findsOneWidget);
  });

  testWidgets('Support screen localizes service error in Vietnamese', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(
      await _buildApp(
        const Locale('vi'),
        supportService: _FakeSupportService(
          submitError: SupportException(
            supportServiceMessageToken(SupportMessageCode.syncFailed),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final submitButton = find.byKey(
      const ValueKey<String>('support-submit-button'),
    );
    await tester.scrollUntilVisible(
      submitButton,
      300,
      scrollable: find
          .descendant(
            of: find.byKey(const ValueKey<String>('support-scroll-view')),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).at(0), 'Cần hỗ trợ gấp');
    await tester.enterText(
      find.byType(TextField).at(1),
      'Đơn hàng bị trễ quá lâu và cần được kiểm tra ngay hôm nay.',
    );
    await tester.ensureVisible(submitButton);
    tester.widget<ElevatedButton>(submitButton).onPressed!.call();
    await tester.pumpAndSettle();
    await tester.tap(
      find.byKey(const ValueKey<String>('support-confirm-submit-button')),
    );
    await tester.pumpAndSettle();

    expect(find.text('Không thể đồng bộ yêu cầu hỗ trợ.'), findsOneWidget);
  });
}

Future<Widget> _buildApp(
  Locale locale, {
  required SupportService supportService,
}) async {
  final settingsController = AppSettingsController();
  await settingsController.setLocale(locale);
  final notificationController = NotificationController();

  return AppSettingsScope(
    controller: settingsController,
    child: NotificationScope(
      controller: notificationController,
      child: MaterialApp(
        locale: locale,
        supportedLocales: const <Locale>[Locale('vi'), Locale('en')],
        localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: SupportScreen(supportService: supportService),
      ),
    ),
  );
}

class _FakeSupportService extends SupportService {
  _FakeSupportService({this.submitError}) : super();

  final SupportException? submitError;

  @override
  Future<DealerSupportTicketRecord?> fetchLatestTicket() async => null;

  @override
  Future<DealerSupportTicketPage> fetchTicketsPage({
    int page = 0,
    int size = 10,
  }) async {
    return const DealerSupportTicketPage(
      items: <DealerSupportTicketRecord>[],
      page: 0,
      size: 6,
      totalPages: 0,
      totalElements: 0,
    );
  }

  @override
  Future<DealerSupportTicketRecord> submitTicket({
    List<SupportTicketAttachmentRecord> attachments =
        const <SupportTicketAttachmentRecord>[],
    required String category,
    SupportTicketContextRecord? contextData,
    required String priority,
    required String subject,
    required String message,
  }) async {
    if (submitError != null) {
      throw submitError!;
    }
    return DealerSupportTicketRecord(
      id: 1,
      ticketCode: 'TCK-1',
      category: category,
      priority: priority,
      status: 'OPEN',
      subject: subject,
      message: message,
      createdAt: DateTime(2026, 1, 1),
      updatedAt: DateTime(2026, 1, 1),
    );
  }

  @override
  void close() {}
}
