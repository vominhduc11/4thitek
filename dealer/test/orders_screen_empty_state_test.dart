import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/notification_controller.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/orders_screen.dart';
import 'package:dealer_hub/warranty_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'Orders screen shows a static empty state when there are no orders',
    (tester) async {
      final view = tester.view;
      view.devicePixelRatio = 1.0;
      view.physicalSize = const Size(390, 844);
      addTearDown(() {
        view.resetPhysicalSize();
        view.resetDevicePixelRatio();
      });

      await tester.pumpWidget(
        AppSettingsScope(
          controller: AppSettingsController(),
          child: NotificationScope(
            controller: NotificationController(),
            child: WarrantyScope(
              controller: _FakeWarrantyController(),
              child: OrderScope(
                controller: _FakeOrderController(),
                child: const MaterialApp(home: OrdersScreen()),
              ),
            ),
          ),
        ),
      );

      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.text('Chưa có đơn hàng'), findsOneWidget);
      expect(find.byType(RefreshIndicator), findsNothing);
    },
  );
}

class _FakeOrderController extends OrderController {
  @override
  Future<void> refresh() async {}
}

class _FakeWarrantyController extends WarrantyController {
  @override
  Future<void> load({bool forceRefresh = false}) async {}
}
