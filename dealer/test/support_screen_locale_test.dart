import 'dart:typed_data';
import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/dealer_routes.dart';
import 'package:dealer_hub/notification_controller.dart';
import 'package:dealer_hub/support_screen.dart';
import 'package:dealer_hub/support_service.dart';
import 'package:dealer_hub/upload_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
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

    await tester.tap(
      find.byKey(const ValueKey<String>('support-open-create-button')),
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
    await tester.enterText(_textFieldByLabel('Subject'), 'Need help soon');
    await tester.enterText(
      _textFieldByLabel('Description'),
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

    await tester.tap(
      find.byKey(const ValueKey<String>('support-open-create-button')),
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
    await tester.enterText(_textFieldByLabel('Tiêu đề'), 'Cần hỗ trợ gấp');
    await tester.enterText(
      _textFieldByLabel('Nội dung'),
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

  testWidgets('Support screen uses dealer-friendly Vietnamese wording', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final ticket = DealerSupportTicketRecord(
      id: 1,
      ticketCode: 'SUP-001',
      category: 'payment',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      subject: 'Cần kiểm tra thanh toán',
      message: 'Đã chuyển khoản nhưng đơn chưa cập nhật.',
      messages: <SupportTicketMessageRecord>[
        SupportTicketMessageRecord(
          id: 1,
          authorRole: 'dealer',
          authorName: 'Dealer A',
          internalNote: false,
          message: 'Đã chuyển khoản nhưng đơn chưa cập nhật.',
          createdAt: DateTime(2026, 1, 1, 8),
        ),
        SupportTicketMessageRecord(
          id: 2,
          authorRole: 'admin',
          authorName: '4T HITEK',
          internalNote: false,
          message: 'Đội hỗ trợ đã tiếp nhận và đang kiểm tra.',
          createdAt: DateTime(2026, 1, 1, 9),
        ),
      ],
      createdAt: DateTime(2026, 1, 1, 8),
      updatedAt: DateTime(2026, 1, 1, 9),
    );

    await tester.pumpWidget(
      await _buildApp(
        const Locale('vi'),
        supportService: _FakeSupportService(
          latestTicket: ticket,
          historyItems: <DealerSupportTicketRecord>[ticket],
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.textContaining('Yêu cầu đang xem'), findsWidgets);
    expect(find.textContaining('Mã yêu cầu'), findsWidgets);
    expect(find.textContaining('Phản hồi dự kiến'), findsWidgets);
    expect(
      find.byKey(const ValueKey<String>('support-submit-button')),
      findsNothing,
    );
    expect(find.text('Chọn ảnh từ thư viện'), findsNothing);
    expect(find.text('Cập nhật mới nhất từ đội hỗ trợ'), findsNothing);
    expect(find.text('Danh sách ticket'), findsNothing);
    expect(find.text('Admin vừa phản hồi'), findsNothing);
    expect(find.textContaining('SLA phản hồi'), findsNothing);
    expect(find.text('Gợi ý trước khi gửi'), findsNothing);

    expect(
      find.byKey(const ValueKey<String>('support-open-create-button')),
      findsOneWidget,
    );
  });

  testWidgets(
    'Support deep-link ticketId fetches by id and selects ticket outside first page',
    (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final linkedTicket = DealerSupportTicketRecord(
        id: 77,
        ticketCode: 'TK-77',
        category: 'returnOrder',
        priority: 'NORMAL',
        status: 'OPEN',
        subject: 'Linked return support',
        message: 'Need return support',
        createdAt: DateTime(2026, 1, 2, 8),
        updatedAt: DateTime(2026, 1, 2, 8),
      );
      final supportService = _FakeSupportService(
        historyItems: <DealerSupportTicketRecord>[
          DealerSupportTicketRecord(
            id: 1,
            ticketCode: 'TK-1',
            category: 'order',
            priority: 'NORMAL',
            status: 'OPEN',
            subject: 'History ticket',
            message: 'History message',
            createdAt: DateTime(2026, 1, 1, 8),
            updatedAt: DateTime(2026, 1, 1, 8),
          ),
        ],
        ticketById: <int, DealerSupportTicketRecord>{77: linkedTicket},
      );

      await tester.pumpWidget(
        await _buildApp(
          const Locale('en'),
          supportService: supportService,
          initialTicketId: 77,
        ),
      );
      await tester.pumpAndSettle();

      expect(supportService.fetchedTicketIds, contains(77));
      expect(find.text('TK-77'), findsWidgets);
    },
  );

  testWidgets(
    'Support deep-link shows safe warning and keeps history when ticket cannot be fetched',
    (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final supportService = _FakeSupportService(
        historyItems: <DealerSupportTicketRecord>[
          DealerSupportTicketRecord(
            id: 1,
            ticketCode: 'TK-1',
            category: 'order',
            priority: 'NORMAL',
            status: 'OPEN',
            subject: 'History ticket',
            message: 'History message',
            createdAt: DateTime(2026, 1, 1, 8),
            updatedAt: DateTime(2026, 1, 1, 8),
          ),
        ],
        fetchTicketError: const SupportException('Support ticket not found'),
      );

      await tester.pumpWidget(
        await _buildApp(
          const Locale('en'),
          supportService: supportService,
          initialTicketId: 88,
        ),
      );
      await tester.pumpAndSettle();

      expect(
        find.text(
          'The requested support ticket is unavailable or you do not have access.',
        ),
        findsOneWidget,
      );
      expect(
        find.text('Choose a request to view the full conversation'),
        findsOneWidget,
      );
      expect(find.text('TK-1'), findsOneWidget);
    },
  );

  testWidgets('Support detail shows linked return card and opens return detail', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final linkedTicket = DealerSupportTicketRecord(
      id: 55,
      ticketCode: 'TK-55',
      category: 'returnOrder',
      priority: 'NORMAL',
      status: 'OPEN',
      subject: 'Return support',
      message: 'Please review return',
      contextData: const SupportTicketContextRecord(
        returnRequestId: 901,
        returnRequestCode: 'RET-901',
        returnStatus: 'UNDER_REVIEW',
        orderCode: 'ORD-901',
      ),
      createdAt: DateTime(2026, 1, 3, 8),
      updatedAt: DateTime(2026, 1, 3, 8),
    );
    final supportService = _FakeSupportService(
      latestTicket: linkedTicket,
      historyItems: <DealerSupportTicketRecord>[linkedTicket],
    );
    final settingsController = AppSettingsController();
    await settingsController.setLocale(const Locale('en'));
    final notificationController = NotificationController();

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settingsController,
        child: NotificationScope(
          controller: notificationController,
          child: MaterialApp.router(
            locale: const Locale('en'),
            supportedLocales: const <Locale>[Locale('vi'), Locale('en')],
            localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            routerConfig: GoRouter(
              initialLocation: DealerRoutePath.support,
              routes: <RouteBase>[
                GoRoute(
                  path: DealerRoutePath.support,
                  builder: (context, state) =>
                      SupportScreen(supportService: supportService),
                ),
                GoRoute(
                  path: '${DealerRoutePath.returns}/:requestId',
                  builder: (context, state) => Scaffold(
                    body: Text(
                      'Return detail ${state.pathParameters['requestId']}',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Related return request'), findsOneWidget);
    await tester.tap(find.widgetWithText(OutlinedButton, 'Open return detail'));
    await tester.pumpAndSettle();

    expect(find.text('Return detail 901'), findsOneWidget);
  });

  testWidgets('Support screen root fallback goes to home', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(
      await _buildRouterApp(
        const Locale('en'),
        supportService: _FakeSupportService(),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.home_outlined).first);
    await tester.pumpAndSettle();

    expect(find.text('Home landing'), findsOneWidget);
  });

  testWidgets('Support draft attachment remove deletes the uploaded media asset', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final uploadService = _FakeUploadService(
      uploadResult: const UploadedSupportMediaRef(
        mediaAssetId: 777,
        url: 'https://api.example.com/api/v1/media/777/download',
        fileName: 'support-proof.pdf',
        accessUrl:
            'https://api.example.com/api/v1/media/777/download?token=abc',
        mediaType: 'document',
        contentType: 'application/pdf',
        sizeBytes: 123,
      ),
    );

    await tester.pumpWidget(
      await _buildApp(
        const Locale('en'),
        supportService: _FakeSupportService(),
        uploadServiceFactory: () => uploadService,
        attachmentPicker: () async => XFile.fromData(
          Uint8List.fromList(<int>[1, 2, 3, 4]),
          name: 'support-proof.pdf',
          mimeType: 'application/pdf',
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const ValueKey<String>('support-open-create-button')));
    await tester.pumpAndSettle();
    final addAttachmentButton = find.widgetWithText(OutlinedButton, 'Add attachment');
    await tester.scrollUntilVisible(
      addAttachmentButton,
      300,
      scrollable: find
          .descendant(
            of: find.byKey(const ValueKey<String>('support-scroll-view')),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    final addAttachment = tester.widget<OutlinedButton>(addAttachmentButton);
    addAttachment.onPressed!.call();
    await tester.pumpAndSettle();

    expect(find.text('support-proof.pdf'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.close_rounded));
    await tester.pumpAndSettle();

    expect(uploadService.deletedMediaAssetIds, <int>[777]);
    expect(find.text('support-proof.pdf'), findsNothing);
  });
}

Future<Widget> _buildApp(
  Locale locale, {
  required SupportService supportService,
  UploadService Function()? uploadServiceFactory,
  Future<XFile?> Function()? attachmentPicker,
  int? initialTicketId,
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
        home: SupportScreen(
          supportService: supportService,
          uploadServiceFactory: uploadServiceFactory,
          attachmentPicker: attachmentPicker,
          initialTicketId: initialTicketId,
        ),
      ),
    ),
  );
}

Future<Widget> _buildRouterApp(
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
      child: MaterialApp.router(
        locale: locale,
        supportedLocales: const <Locale>[Locale('vi'), Locale('en')],
        localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        routerConfig: GoRouter(
          initialLocation: DealerRoutePath.support,
          routes: <RouteBase>[
            GoRoute(
              path: DealerRoutePath.support,
              builder: (context, state) =>
                  SupportScreen(supportService: supportService),
            ),
            GoRoute(
              path: DealerRoutePath.home,
              builder: (context, state) =>
                  const Scaffold(body: Text('Home landing')),
            ),
          ],
        ),
      ),
    ),
  );
}

class _FakeSupportService extends SupportService {
  _FakeSupportService({
    this.submitError,
    this.fetchTicketError,
    this.latestTicket,
    this.historyItems = const <DealerSupportTicketRecord>[],
    this.ticketById,
  }) : super();

  final SupportException? submitError;
  final SupportException? fetchTicketError;
  final DealerSupportTicketRecord? latestTicket;
  final List<DealerSupportTicketRecord> historyItems;
  final Map<int, DealerSupportTicketRecord>? ticketById;
  final List<int> fetchedTicketIds = <int>[];

  @override
  Future<DealerSupportTicketRecord?> fetchLatestTicket() async => latestTicket;

  @override
  Future<DealerSupportTicketPage> fetchTicketsPage({
    int page = 0,
    int size = 10,
  }) async {
    return DealerSupportTicketPage(
      items: historyItems,
      page: 0,
      size: 6,
      totalPages: historyItems.isEmpty ? 0 : 1,
      totalElements: historyItems.length,
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

class _FakeUploadService extends UploadService {
  _FakeUploadService({
    required this.uploadResult,
  }) : super();

  final UploadedSupportMediaRef uploadResult;
  final List<int> deletedMediaAssetIds = <int>[];
  final List<String> deletedUrls = <String>[];

  @override
  Future<UploadedSupportMediaRef> uploadSupportMediaFile({
    required XFile file,
    void Function(double progress)? onProgress,
  }) async {
    onProgress?.call(100);
    return uploadResult;
  }

  @override
  Future<DealerSupportTicketRecord> fetchTicket(int ticketId) async {
    fetchedTicketIds.add(ticketId);
    if (fetchTicketError != null) {
      throw fetchTicketError!;
    }
    final mapped = ticketById?[ticketId];
    if (mapped != null) {
      return mapped;
    }
    throw const SupportException('Support ticket not found');
  }

  @override
  Future<void> deleteMediaAsset(int mediaAssetId) async {
    deletedMediaAssetIds.add(mediaAssetId);
  }

  @override
  Future<void> deleteUrl(String url) async {
    deletedUrls.add(url);
  }

  @override
  void close() {}
}

Finder _textFieldByLabel(String label) => find.byWidgetPredicate(
  (widget) =>
      widget is TextField &&
      widget.decoration != null &&
      widget.decoration!.labelText == label,
);
