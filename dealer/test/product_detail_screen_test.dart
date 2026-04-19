import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/dealer_routes.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/product_detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
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
            home: ProductDetailScreen(product: _product),
          ),
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
    await settings.setLocale(const Locale('vi'));

    final cart = CartController(productLookup: (productId) => _product);
    addTearDown(cart.dispose);

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settings,
        child: CartScope(
          controller: cart,
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
            home: ProductDetailScreen(product: _product),
          ),
        ),
      ),
    );

    await tester.pump(const Duration(milliseconds: 450));
    await tester.pumpAndSettle();

    expect(find.text('Giá đại lý'), findsOneWidget);
    expect(find.text('Chưa gồm VAT'), findsWidgets);
    expect(find.text('Thông tin nhanh'), findsOneWidget);
    expect(find.text('Mô tả chi tiết'), findsOneWidget);
    expect(find.text('Video sản phẩm'), findsOneWidget);
    expect(find.text('Thông số kỹ thuật'), findsOneWidget);
    expect(find.text('Thêm vào giỏ'), findsOneWidget);
    expect(find.text('Mua ngay'), findsOneWidget);
  });

  testWidgets('Product detail screen root fallback goes to home', (
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
          child: MaterialApp.router(
            routerConfig: GoRouter(
              initialLocation: DealerRoutePath.productDetail(_product.id),
              routes: <RouteBase>[
                GoRoute(
                  path: DealerRoutePath.home,
                  builder: (context, state) =>
                      const Scaffold(body: Text('Home landing')),
                ),
                GoRoute(
                  path: '${DealerRoutePath.products}/:productId',
                  builder: (context, state) => ProductDetailScreen(
                    product: _product,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    await tester.pump(const Duration(milliseconds: 450));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.byIcon(Icons.home_outlined).first);
    await tester.tap(find.byIcon(Icons.home_outlined).first);
    await tester.pumpAndSettle();

    expect(find.text('Home landing'), findsOneWidget);
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

