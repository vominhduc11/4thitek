import 'dart:async';
import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/return_create_screen.dart';
import 'package:dealer_hub/return_request_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('shows loading copy while eligibility is being checked', (
    WidgetTester tester,
  ) async {
    final eligibilityCompleter =
        Completer<List<DealerReturnEligibilityRecord>>();
    await tester.pumpWidget(
      await _buildApp(
        orderController: _FakeOrderController(remoteOrderId: 101),
        returnService: _FakeReturnRequestService(
          eligibilityFuture: eligibilityCompleter.future,
        ),
      ),
    );
    await tester.pump();

    expect(
      find.text('Checking eligible serials for this return request...'),
      findsOneWidget,
    );
    eligibilityCompleter.complete(const <DealerReturnEligibilityRecord>[]);
    await tester.pumpAndSettle();
  });

  testWidgets('shows retryable timeout error when eligibility load stalls', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      await _buildApp(
        orderController: _FakeOrderController(remoteOrderId: 101),
        returnService: _FakeReturnRequestService(
          eligibilityFuture:
              Completer<List<DealerReturnEligibilityRecord>>().future,
        ),
      ),
    );

    await tester.pump(const Duration(seconds: 16));
    await tester.pumpAndSettle();

    expect(find.text('Unable to load return eligibility'), findsOneWidget);
    expect(
      find.text('Loading return eligibility timed out. Please retry.'),
      findsOneWidget,
    );
    expect(find.text('Retry'), findsOneWidget);
  });

  testWidgets('prefilledSerialId selects matching eligible serial', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      await _buildApp(
        orderController: _FakeOrderController(remoteOrderId: 101),
        prefilledSerialId: 9,
        returnService: _FakeReturnRequestService(
          eligibilityFuture: Future<List<DealerReturnEligibilityRecord>>.value(
            <DealerReturnEligibilityRecord>[_eligibility(serialId: 9)],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await _scrollToSerialSection(tester);

    final checkbox = tester.widget<Checkbox>(find.byType(Checkbox));
    expect(checkbox.value, isTrue);
  });

  testWidgets('initialRequestType is used for first eligibility request', (
    WidgetTester tester,
  ) async {
    final returnService = _FakeReturnRequestService(
      eligibilityFuture: Future<List<DealerReturnEligibilityRecord>>.value(
        <DealerReturnEligibilityRecord>[_eligibility(serialId: 9)],
      ),
    );
    await tester.pumpWidget(
      await _buildApp(
        orderController: _FakeOrderController(remoteOrderId: 101),
        initialRequestType: DealerReturnRequestType.warrantyRma,
        returnService: returnService,
      ),
    );
    await tester.pumpAndSettle();

    expect(returnService.requestedTypes, <DealerReturnRequestType?>[
      DealerReturnRequestType.warrantyRma,
    ]);
  });

  testWidgets('attachment upload stays enabled when no serial is eligible', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      await _buildApp(
        orderController: _FakeOrderController(remoteOrderId: 101),
        returnService: _FakeReturnRequestService(
          eligibilityFuture: Future<List<DealerReturnEligibilityRecord>>.value(
            <DealerReturnEligibilityRecord>[
              _eligibility(serialId: 9, eligible: false),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await _scrollToAttachmentSection(tester);

    final button = tester.widget<OutlinedButton>(
      find.widgetWithText(OutlinedButton, 'Upload attachment'),
    );
    expect(button.onPressed, isNotNull);
  });

  testWidgets('shows support-style picker options for attachments', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      await _buildApp(
        orderController: _FakeOrderController(remoteOrderId: 101),
        returnService: _FakeReturnRequestService(
          eligibilityFuture: Future<List<DealerReturnEligibilityRecord>>.value(
            <DealerReturnEligibilityRecord>[_eligibility(serialId: 9)],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await _scrollToAttachmentSection(tester);

    await tester.tap(find.widgetWithText(OutlinedButton, 'Upload attachment'));
    await tester.pumpAndSettle();

    expect(find.text('Choose image from gallery'), findsOneWidget);
    expect(find.text('Choose video from gallery'), findsOneWidget);
    expect(find.text('Choose PDF document'), findsOneWidget);
  });

  testWidgets(
    'active request status lookup does not block eligibility render',
    (WidgetTester tester) async {
      final detailCompleter = Completer<DealerReturnRequestDetailRecord>();
      await tester.pumpWidget(
        await _buildApp(
          orderController: _FakeOrderController(remoteOrderId: 101),
          returnService: _FakeReturnRequestService(
            eligibilityFuture:
                Future<List<DealerReturnEligibilityRecord>>.value(
                  <DealerReturnEligibilityRecord>[
                    _eligibility(
                      serialId: 9,
                      eligible: false,
                      reasonCode: 'ACTIVE_RETURN_REQUEST_EXISTS',
                      activeRequestId: 55,
                    ),
                  ],
                ),
            detailFuture: detailCompleter.future,
          ),
        ),
      );
      await tester.pumpAndSettle();
      await _scrollToSerialSection(tester);

      expect(find.text('SER-0009'), findsOneWidget);
      expect(find.text('Open active request'), findsOneWidget);
      detailCompleter.complete(_returnDetail());
      await tester.pumpAndSettle();
    },
  );
}

Future<void> _scrollToSerialSection(WidgetTester tester) async {
  await tester.drag(find.byType(ListView), const Offset(0, -520));
  await tester.pumpAndSettle();
}

Future<void> _scrollToAttachmentSection(WidgetTester tester) async {
  await tester.dragUntilVisible(
    find.widgetWithText(OutlinedButton, 'Upload attachment'),
    find.byType(ListView),
    const Offset(0, -300),
  );
  await tester.pumpAndSettle();
}

Future<Widget> _buildApp({
  required OrderController orderController,
  required ReturnRequestService returnService,
  int? prefilledSerialId,
  DealerReturnRequestType? initialRequestType,
}) async {
  SharedPreferences.setMockInitialValues(<String, Object>{});
  final settingsController = AppSettingsController();
  await settingsController.setLocale(const Locale('en'));
  return AppSettingsScope(
    controller: settingsController,
    child: MediaQuery(
      data: const MediaQueryData(disableAnimations: true),
      child: MaterialApp(
        home: OrderScope(
          controller: orderController,
          child: DealerReturnCreateScreen(
            orderId: 'DH-001',
            prefilledSerialId: prefilledSerialId,
            initialRequestType: initialRequestType,
            returnRequestService: returnService,
          ),
        ),
      ),
    ),
  );
}

class _FakeOrderController extends OrderController {
  _FakeOrderController({required this.remoteOrderId})
    : super(authStorage: _FakeAuthStorage(), client: _NoopClient());

  final int remoteOrderId;

  @override
  Future<void> refreshSingleOrder(String orderId) async {
    return;
  }

  @override
  int? remoteOrderIdForOrderCode(String orderCode) => remoteOrderId;
}

class _FakeReturnRequestService extends ReturnRequestService {
  _FakeReturnRequestService({this.eligibilityFuture, this.detailFuture})
    : super(authStorage: _FakeAuthStorage(), client: _NoopClient());

  final Future<List<DealerReturnEligibilityRecord>>? eligibilityFuture;
  final Future<DealerReturnRequestDetailRecord>? detailFuture;
  final List<DealerReturnRequestType?> requestedTypes =
      <DealerReturnRequestType?>[];

  @override
  Future<List<DealerReturnEligibilityRecord>> fetchOrderEligibleSerials(
    int orderId, {
    DealerReturnRequestType? type,
  }) {
    requestedTypes.add(type);
    if (eligibilityFuture != null) {
      return eligibilityFuture!;
    }
    return Future<List<DealerReturnEligibilityRecord>>.value(
      const <DealerReturnEligibilityRecord>[],
    );
  }

  @override
  Future<DealerReturnRequestDetailRecord> fetchDetail(int requestId) {
    if (detailFuture != null) {
      return detailFuture!;
    }
    return Future<DealerReturnRequestDetailRecord>.value(_returnDetail());
  }
}

DealerReturnEligibilityRecord _eligibility({
  required int serialId,
  bool eligible = true,
  String reasonCode = 'ELIGIBLE',
  int? activeRequestId,
}) {
  final serial = 'SER-${serialId.toString().padLeft(4, '0')}';
  return DealerReturnEligibilityRecord(
    serialId: serialId,
    serial: serial,
    orderId: 101,
    orderCode: 'DH-001',
    productId: 501,
    productName: 'Router AX',
    productSku: 'AX-1',
    eligible: eligible,
    reasonCode: reasonCode,
    reasonMessage: reasonCode == 'ELIGIBLE'
        ? 'Serial is eligible for return request'
        : 'Serial already has an active return request',
    activeRequestId: activeRequestId,
    activeRequestCode: activeRequestId == null ? null : 'RET-$activeRequestId',
  );
}

DealerReturnRequestDetailRecord _returnDetail({
  int id = 55,
  DealerReturnRequestStatus status = DealerReturnRequestStatus.submitted,
}) {
  return DealerReturnRequestDetailRecord(
    id: id,
    requestCode: 'RET-$id',
    orderId: 101,
    orderCode: 'DH-001',
    type: DealerReturnRequestType.defectiveReturn,
    status: status,
    requestedResolution: DealerReturnRequestResolution.replace,
    reasonCode: null,
    reasonDetail: null,
    supportTicketId: null,
    requestedAt: null,
    reviewedAt: null,
    receivedAt: null,
    completedAt: null,
    items: const <DealerReturnRequestItemRecord>[],
    attachments: const <DealerReturnRequestAttachmentRecord>[],
    events: const <DealerReturnRequestEventRecord>[],
  );
}

class _FakeAuthStorage extends AuthStorage {
  @override
  Future<String?> readAccessToken() async => 'token';

  @override
  Future<String?> readRefreshToken() async => null;
}

class _NoopClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw StateError('Unexpected network call during widget test.');
  }
}
