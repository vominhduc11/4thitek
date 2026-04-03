import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/cart_screen.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/widgets/brand_identity.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Cart screen keeps header, list items and checkout CTA on mobile', (
    tester,
  ) async {
    final view = tester.view;
    view.devicePixelRatio = 1.0;
    view.physicalSize = const Size(390, 844);
    addTearDown(() {
      view.resetPhysicalSize();
      view.resetDevicePixelRatio();
    });

    final settingsController = AppSettingsController();
    await settingsController.setLocale(const Locale('vi'));

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settingsController,
        child: CartScope(
          controller: _FakeCartController(),
          child: MaterialApp(
            theme: ThemeData(useMaterial3: true),
            home: const CartScreen(),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.byType(AppBar), findsOneWidget);
    expect(find.byType(BrandAppBarTitle), findsOneWidget);
    expect(
      find.widgetWithIcon(FilledButton, Icons.arrow_forward_outlined),
      findsOneWidget,
    );

    final exceptions = <Object>[];
    Object? error;
    while ((error = tester.takeException()) != null) {
      exceptions.add(error!);
    }

    expect(exceptions, isEmpty, reason: exceptions.join('\n'));
  });
}

class _FakeCartController extends CartController {
  _FakeCartController();

  final List<CartItem> _seedItems = const <CartItem>[
    CartItem(product: _productOne, quantity: 1),
    CartItem(product: _productTwo, quantity: 1),
  ];

  @override
  List<CartItem> get items => _seedItems;

  @override
  bool get isEmpty => _seedItems.isEmpty;

  @override
  bool get isSyncing => false;

  @override
  int get totalItems => _seedItems.fold<int>(
    0,
    (sum, item) => sum + item.quantity,
  );

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

  @override
  int suggestedAddQuantity(Product product) => product.stock > 0 ? 1 : 0;

  @override
  Future<bool> remove(String productId) async => true;

  @override
  Future<bool> setQuantity(Product product, int quantity) async => true;
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
