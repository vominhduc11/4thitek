import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/product_detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Product detail screen renders English copy', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final settings = AppSettingsController();
    await settings.setLocale(const Locale('en'));

    final cart = CartController(productLookup: (productId) => _product);
    addTearDown(cart.dispose);

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settings,
        child: CartScope(
          controller: cart,
          child: MaterialApp(home: ProductDetailScreen(product: _product)),
        ),
      ),
    );

    await tester.pump(const Duration(milliseconds: 450));
    await tester.pumpAndSettle();

    expect(find.text('Dealer price'), findsOneWidget);
    expect(find.text('Excludes VAT'), findsWidgets);
    expect(find.text('Quick information'), findsOneWidget);
    expect(find.text('Detailed description'), findsOneWidget);
    expect(find.text('Product videos'), findsOneWidget);
    expect(find.text('Technical specifications'), findsOneWidget);
    expect(find.text('Add to cart'), findsOneWidget);
    expect(find.text('Buy now'), findsOneWidget);
  });

  testWidgets('Product detail screen renders Vietnamese copy by default', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final settings = AppSettingsController();

    final cart = CartController(productLookup: (productId) => _product);
    addTearDown(cart.dispose);

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settings,
        child: CartScope(
          controller: cart,
          child: MaterialApp(home: ProductDetailScreen(product: _product)),
        ),
      ),
    );

    await tester.pump(const Duration(milliseconds: 450));
    await tester.pumpAndSettle();

    expect(find.text('Gia dai ly'), findsOneWidget);
    expect(find.text('Chua gom VAT'), findsWidgets);
    expect(find.text('Thong tin nhanh'), findsOneWidget);
    expect(find.text('Mo ta chi tiet'), findsOneWidget);
    expect(find.text('Video san pham'), findsOneWidget);
    expect(find.text('Thong so ky thuat'), findsOneWidget);
    expect(find.text('Them vao gio'), findsOneWidget);
    expect(find.text('Mua ngay'), findsOneWidget);
  });
}

const Product _product = Product(
  id: 'prod-1',
  name: 'Camera 4T',
  sku: 'CAM-4T',
  shortDescription: 'Smart security camera for dealer demo.',
  price: 1250000,
  stock: 24,
  warrantyMonths: 24,
  descriptions: <ProductDescriptionItem>[
    ProductDescriptionItem(
      type: ProductDescriptionType.description,
      text: '<p>Camera detail content</p>',
    ),
  ],
  videos: <ProductVideoItem>[
    ProductVideoItem(
      title: '',
      url: 'https://example.com/demo.mp4',
      description: 'Installation walkthrough',
    ),
  ],
  specifications: <ProductSpecification>[
    ProductSpecification(label: 'Resolution', value: '4MP'),
  ],
);
