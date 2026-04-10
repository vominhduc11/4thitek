import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/checkout_screen.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'Checkout screen keeps mobile layout stable at larger text scales',
    (tester) async {
      SharedPreferences.setMockInitialValues(<String, Object>{
        'dealer_profile_business_name': 'TuneZone Dealer',
        'dealer_profile_contact_name': 'Alex Tran',
        'dealer_profile_email': 'dealer@example.com',
        'dealer_profile_phone': '0900000000',
        'dealer_profile_address_line': '123 Nguyen Hue',
        'dealer_profile_ward': 'Ben Nghe',
        'dealer_profile_district': 'District 1',
        'dealer_profile_city': 'Ho Chi Minh City',
        'dealer_profile_country': 'Vietnam',
      });

      final view = tester.view;
      view.devicePixelRatio = 1.0;
      view.physicalSize = const Size(390, 844);
      addTearDown(() {
        view.resetPhysicalSize();
        view.resetDevicePixelRatio();
      });

      final settingsController = AppSettingsController();
      await settingsController.setLocale(const Locale('en'));

      await tester.pumpWidget(
        AppSettingsScope(
          controller: settingsController,
          child: CartScope(
            controller: _FakeCartController(),
            child: OrderScope(
              controller: _FakeOrderController(),
              child: MaterialApp(
                builder: (context, child) {
                  final mediaQuery = MediaQuery.of(context);
                  return MediaQuery(
                    data: mediaQuery.copyWith(
                      textScaler: const TextScaler.linear(1.6),
                    ),
                    child: child!,
                  );
                },
                home: const CheckoutScreen(),
              ),
            ),
          ),
        ),
      );

      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.byType(CheckoutScreen), findsOneWidget);
      expect(find.text('Shipping information'), findsOneWidget);

      final exceptions = <Object>[];
      Object? error;
      while ((error = tester.takeException()) != null) {
        exceptions.add(error!);
      }

      expect(exceptions, isEmpty, reason: exceptions.join('\n'));
    },
  );
}

class _FakeCartController extends CartController {
  _FakeCartController();

  final List<CartItem> _seedItems = const <CartItem>[
    CartItem(product: _productOne, quantity: 2),
    CartItem(product: _productTwo, quantity: 1),
  ];

  @override
  List<CartItem> get items => _seedItems;

  @override
  bool get isEmpty => _seedItems.isEmpty;

  @override
  bool get isSyncing => false;

  @override
  int get subtotal => _seedItems.fold<int>(
    0,
    (sum, item) => sum + (item.product.price * item.quantity),
  );

  @override
  int get discountPercent => 0;

  @override
  int get discountAmount => 0;

  @override
  int get totalAfterDiscount => subtotal;

  @override
  int get vatPercent => 10;

  @override
  int get vatAmount => (totalAfterDiscount * vatPercent / 100).round();

  @override
  int get total => totalAfterDiscount + vatAmount;

  @override
  BulkDiscountTarget? get nextDiscountTarget => null;

  @override
  bool isSyncingProduct(String productId) => false;
}

class _FakeOrderController extends OrderController {
  @override
  Future<void> refresh() async {}
}

const Product _productOne = Product(
  id: 'helmet-kit',
  name: 'SCS Rider Intercom Kit',
  sku: 'SCS-RIDER-01',
  shortDescription: 'Intercom headset kit',
  price: 20000,
  stock: 8,
  warrantyMonths: 12,
);

const Product _productTwo = Product(
  id: 'helmet-mic',
  name: 'SCS Touring Mic',
  sku: 'SCS-MIC-02',
  shortDescription: 'Microphone accessory',
  price: 20000,
  stock: 12,
  warrantyMonths: 12,
);
