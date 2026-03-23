import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/dashboard_screen.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/warranty_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const cases = <({String name, Size size})>[
    (name: 'mobile_320x760', size: Size(320, 760)),
    (name: 'mobile_360x800', size: Size(360, 800)),
    (name: 'mobile_390x844', size: Size(390, 844)),
    (name: 'tablet_768x1024', size: Size(768, 1024)),
    (name: 'tablet_834x1112', size: Size(834, 1112)),
    (name: 'tablet_1024x768', size: Size(1024, 768)),
  ];

  for (final c in cases) {
    testWidgets('Dashboard renders without layout exceptions on ${c.name}', (
      tester,
    ) async {
      final view = tester.view;
      view.devicePixelRatio = 1.0;
      view.physicalSize = c.size;
      addTearDown(() {
        view.resetPhysicalSize();
        view.resetDevicePixelRatio();
      });

      final settingsController = AppSettingsController();
      final orderController = _FakeOrderController();
      final warrantyController = _FakeWarrantyController();

      await tester.pumpWidget(
        AppSettingsScope(
          controller: settingsController,
          child: MaterialApp(
            home: WarrantyScope(
              controller: warrantyController,
              child: OrderScope(
                controller: orderController,
                child: const DashboardScreen(),
              ),
            ),
          ),
        ),
      );

      // Wait for initial loading and section entrance animations.
      await tester.pump(const Duration(milliseconds: 900));
      await tester.pumpAndSettle();

      final exceptions = <Object>[];
      Object? error;
      while ((error = tester.takeException()) != null) {
        exceptions.add(error!);
      }

      expect(
        exceptions,
        isEmpty,
        reason: 'Layout exception on ${c.name}: ${exceptions.join('\n')}',
      );

      expect(find.byType(Scaffold), findsOneWidget);
      expect(find.byType(RefreshIndicator), findsOneWidget);
      expect(
        find.byWidgetPredicate(
          (widget) => widget is ListView && widget.scrollDirection == Axis.vertical,
        ),
        findsOneWidget,
      );
    });
  }
}

class _FakeOrderController extends OrderController {
  @override
  Future<void> refresh() async {}
}

class _FakeWarrantyController extends WarrantyController {
  @override
  Future<void> load({bool forceRefresh = false}) async {}
}
