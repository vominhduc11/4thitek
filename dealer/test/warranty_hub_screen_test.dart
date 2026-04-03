import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/notification_controller.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/warranty_controller.dart';
import 'package:dealer_hub/warranty_hub_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Warranty hub renders wide product-ready layout without overflow', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    tester.view.physicalSize = const Size(1280, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    final settingsController = AppSettingsController();
    await settingsController.setLocale(const Locale('vi'));

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settingsController,
        child: MaterialApp(
          theme: ThemeData(
            useMaterial3: true,
            splashFactory: NoSplash.splashFactory,
          ),
          home: NotificationScope(
            controller: NotificationController(),
            child: OrderScope(
              controller: OrderController(),
              child: WarrantyScope(
                controller: WarrantyController(),
                child: const WarrantyHubScreen(),
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Vận hành bảo hành'), findsOneWidget);
    expect(find.text('Kho serial'), findsOneWidget);
    expect(find.text('Gần đây'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
