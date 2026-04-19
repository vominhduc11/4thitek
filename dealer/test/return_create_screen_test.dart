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
    await tester.pumpWidget(await _buildApp(
      orderController: _FakeOrderController(
        remoteOrderId: 101,
      ),
      returnService: _FakeReturnRequestService(
        eligibilityFuture: eligibilityCompleter.future,
      ),
    ));
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
    await tester.pumpWidget(await _buildApp(
      orderController: _FakeOrderController(
        remoteOrderId: 101,
      ),
      returnService: _FakeReturnRequestService(
        eligibilityFuture: Completer<List<DealerReturnEligibilityRecord>>().future,
      ),
    ));

    await tester.pump(const Duration(seconds: 16));
    await tester.pumpAndSettle();

    expect(find.text('Unable to load return eligibility'), findsOneWidget);
    expect(
      find.text('Loading return eligibility timed out. Please retry.'),
      findsOneWidget,
    );
    expect(find.text('Retry'), findsOneWidget);
  });

}

Future<Widget> _buildApp({
  required OrderController orderController,
  required ReturnRequestService returnService,
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
            returnRequestService: returnService,
          ),
        ),
      ),
    ),
  );
}

class _FakeOrderController extends OrderController {
  _FakeOrderController({
    required this.remoteOrderId,
  }) : super(authStorage: _FakeAuthStorage(), client: _NoopClient());

  final int remoteOrderId;

  @override
  Future<void> refreshSingleOrder(String orderId) async {
    return;
  }

  @override
  int? remoteOrderIdForOrderCode(String orderCode) => remoteOrderId;
}

class _FakeReturnRequestService extends ReturnRequestService {
  _FakeReturnRequestService({
    this.eligibilityFuture,
  }) : super(authStorage: _FakeAuthStorage(), client: _NoopClient());

  final Future<List<DealerReturnEligibilityRecord>>? eligibilityFuture;

  @override
  Future<List<DealerReturnEligibilityRecord>> fetchOrderEligibleSerials(
    int orderId,
  ) {
    if (eligibilityFuture != null) {
      return eligibilityFuture!;
    }
    return Future<List<DealerReturnEligibilityRecord>>.value(
      const <DealerReturnEligibilityRecord>[],
    );
  }

  @override
  Future<DealerReturnRequestDetailRecord> fetchDetail(int requestId) {
    throw UnimplementedError();
  }
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
