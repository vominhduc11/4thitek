import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/dealer_routes.dart';
import 'package:dealer_hub/return_detail_screen.dart';
import 'package:dealer_hub/return_request_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Return detail falls back to returns when opened standalone', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final settingsController = AppSettingsController();
    await settingsController.setLocale(const Locale('en'));

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settingsController,
        child: MaterialApp.router(
          routerConfig: GoRouter(
            initialLocation: DealerRoutePath.returnDetail(101),
            routes: <RouteBase>[
              GoRoute(
                path: DealerRoutePath.returns,
                builder: (context, state) =>
                    const Scaffold(body: Text('Returns landing')),
              ),
              GoRoute(
                path: '${DealerRoutePath.returns}/:requestId',
                builder: (context, state) => DealerReturnDetailScreen(
                  requestId:
                      int.tryParse(state.pathParameters['requestId'] ?? '') ??
                      101,
                  returnRequestService: _FailingReturnRequestService(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.arrow_back_rounded).first);
    await tester.pumpAndSettle();

    expect(find.text('Returns landing'), findsOneWidget);
  });

  testWidgets('Return detail opens linked support ticket deep-link', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final settingsController = AppSettingsController();
    await settingsController.setLocale(const Locale('en'));

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settingsController,
        child: MaterialApp.router(
          routerConfig: GoRouter(
            initialLocation: DealerRoutePath.returnDetail(101),
            routes: <RouteBase>[
              GoRoute(
                path: DealerRoutePath.support,
                builder: (context, state) =>
                    Scaffold(body: Text('Support ${state.uri.queryParameters['ticketId']}')),
              ),
              GoRoute(
                path: '${DealerRoutePath.returns}/:requestId',
                builder: (context, state) => DealerReturnDetailScreen(
                  requestId:
                      int.tryParse(state.pathParameters['requestId'] ?? '') ??
                      101,
                  returnRequestService: _LinkedReturnRequestService(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.textContaining('Linked support ticket #7'));
    await tester.pumpAndSettle();

    expect(find.text('Support 7'), findsOneWidget);
  });
}

class _FailingReturnRequestService extends ReturnRequestService {
  @override
  Future<DealerReturnRequestDetailRecord> fetchDetail(int requestId) async {
    throw const ReturnRequestException('returns.message.syncFailed');
  }

  @override
  void close() {}
}

class _LinkedReturnRequestService extends ReturnRequestService {
  @override
  Future<DealerReturnRequestDetailRecord> fetchDetail(int requestId) async {
    return DealerReturnRequestDetailRecord(
      id: requestId,
      requestCode: 'RET-$requestId',
      orderId: 10,
      orderCode: 'ORD-10',
      type: DealerReturnRequestType.defectiveReturn,
      status: DealerReturnRequestStatus.submitted,
      requestedResolution: DealerReturnRequestResolution.replace,
      reasonCode: 'DEFECT',
      reasonDetail: 'Need support',
      supportTicketId: 7,
      requestedAt: DateTime(2026, 1, 1),
      reviewedAt: null,
      receivedAt: null,
      completedAt: null,
      items: const <DealerReturnRequestItemRecord>[],
      attachments: const <DealerReturnRequestAttachmentRecord>[],
      events: const <DealerReturnRequestEventRecord>[],
    );
  }

  @override
  void close() {}
}
