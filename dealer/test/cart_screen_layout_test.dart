import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/cart_screen.dart';
import 'package:dealer_hub/dealer_routes.dart';
import 'package:dealer_hub/models.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Empty cart continue shopping routes to home from root', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    final settingsController = AppSettingsController();
    await settingsController.setLocale(const Locale('en'));

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settingsController,
        child: CartScope(
          controller: _EmptyCartController(),
          child: MaterialApp.router(
            theme: ThemeData(useMaterial3: true),
            routerConfig: GoRouter(
              initialLocation: DealerRoutePath.cart,
              routes: <RouteBase>[
                GoRoute(
                  path: DealerRoutePath.cart,
                  builder: (context, state) => const CartScreen(),
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
    );

    await tester.pumpAndSettle();
    await tester.tap(find.text('Continue shopping'));
    await tester.pumpAndSettle();

    expect(find.text('Home landing'), findsOneWidget);
  });
}

class _EmptyCartController extends CartController {
  @override
  List<CartItem> get items => const <CartItem>[];

  @override
  bool get isEmpty => true;

  @override
  bool get isSyncing => false;

  @override
  int get totalItems => 0;

  @override
  int get subtotal => 0;

  @override
  int get discountPercent => 0;

  @override
  int get discountAmount => 0;

  @override
  int get totalAfterDiscount => 0;

  @override
  int get vatPercent => 10;

  @override
  int get vatAmount => 0;

  @override
  int get total => 0;

  @override
  BulkDiscountTarget? get nextDiscountTarget => null;

  @override
  bool isSyncingProduct(String productId) => false;

  @override
  int suggestedAddQuantity(Product product) => product.stock > 0 ? 1 : 0;

  @override
  Future<bool> remove(String productId) async => true;

  @override
  Future<bool> setQuantity(Product product, int quantity) async => true;
}
