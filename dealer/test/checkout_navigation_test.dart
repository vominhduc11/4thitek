import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/checkout_screen.dart';
import 'package:dealer_hub/dealer_routes.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Checkout screen root fallback routes to home', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final settings = AppSettingsController();
    await settings.setLocale(const Locale('en'));

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settings,
        child: CartScope(
          controller: CartController(),
          child: OrderScope(
            controller: OrderController(),
            child: MaterialApp.router(
              routerConfig: GoRouter(
                initialLocation: DealerRoutePath.checkout,
                routes: <RouteBase>[
                  GoRoute(
                    path: DealerRoutePath.checkout,
                    builder: (context, state) => const CheckoutScreen(),
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
        ),
      ),
    );

    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.home_outlined).first);
    await tester.pumpAndSettle();

    expect(find.text('Home landing'), findsOneWidget);
  });
}
