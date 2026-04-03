import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/notification_controller.dart';
import 'package:dealer_hub/product_catalog_controller.dart';
import 'package:dealer_hub/product_list_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Product list renders mobile utility grid without overflow', (
    tester,
  ) async {
    final view = tester.view;
    view.devicePixelRatio = 1.0;
    view.physicalSize = const Size(320, 760);
    addTearDown(() {
      view.resetPhysicalSize();
      view.resetDevicePixelRatio();
    });

    final settingsController = AppSettingsController();
    final catalogController = _FakeProductCatalogController();
    final cartController = CartController();
    final notificationController = NotificationController();

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settingsController,
        child: NotificationScope(
          controller: notificationController,
          child: ProductCatalogScope(
            controller: catalogController,
            child: CartScope(
              controller: cartController,
              child: const MaterialApp(home: ProductListScreen()),
            ),
          ),
        ),
      ),
    );

    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();

    final exceptions = <Object>[];
    Object? error;
    while ((error = tester.takeException()) != null) {
      exceptions.add(error!);
    }

    expect(exceptions, isEmpty, reason: exceptions.join('\n'));
    expect(find.byType(ProductListScreen), findsOneWidget);
  });

  testWidgets('Desktop width packs products into a denser grid row', (
    tester,
  ) async {
    final view = tester.view;
    view.devicePixelRatio = 1.0;
    view.physicalSize = const Size(1280, 900);
    addTearDown(() {
      view.resetPhysicalSize();
      view.resetDevicePixelRatio();
    });

    final settingsController = AppSettingsController();
    final catalogController = _FakeProductCatalogController();
    final cartController = CartController();
    final notificationController = NotificationController();

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settingsController,
        child: NotificationScope(
          controller: notificationController,
          child: ProductCatalogScope(
            controller: catalogController,
            child: CartScope(
              controller: cartController,
              child: const MaterialApp(home: ProductListScreen()),
            ),
          ),
        ),
      ),
    );

    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();

    final ampPosition = tester.getTopLeft(find.text('AMP-8CH'));
    final speakerPosition = tester.getTopLeft(find.text('SPK-2WAY'));
    final subwooferPosition = tester.getTopLeft(find.text('SUB-ACT'));

    expect((ampPosition.dy - speakerPosition.dy).abs(), lessThan(1));
    expect((speakerPosition.dy - subwooferPosition.dy).abs(), lessThan(1));

    final exceptions = <Object>[];
    Object? error;
    while ((error = tester.takeException()) != null) {
      exceptions.add(error!);
    }

    expect(exceptions, isEmpty, reason: exceptions.join('\n'));
  });

  testWidgets('Search empty state can clear filters and recover results', (
    tester,
  ) async {
    final view = tester.view;
    view.devicePixelRatio = 1.0;
    view.physicalSize = const Size(320, 760);
    addTearDown(() {
      view.resetPhysicalSize();
      view.resetDevicePixelRatio();
    });

    final settingsController = AppSettingsController();
    final catalogController = _FakeProductCatalogController();
    final cartController = CartController();
    final notificationController = NotificationController();

    await tester.pumpWidget(
      AppSettingsScope(
        controller: settingsController,
        child: NotificationScope(
          controller: notificationController,
          child: ProductCatalogScope(
            controller: catalogController,
            child: CartScope(
              controller: cartController,
              child: const MaterialApp(home: ProductListScreen()),
            ),
          ),
        ),
      ),
    );

    await tester.pump(const Duration(milliseconds: 500));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'no-match-product');
    await tester.pump(const Duration(milliseconds: 350));
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.search_off_rounded), findsOneWidget);
    final clearButtons = find.widgetWithIcon(
      OutlinedButton,
      Icons.restart_alt_rounded,
    );
    expect(clearButtons, findsWidgets);

    final clearButton = tester.widgetList<OutlinedButton>(clearButtons).first;
    clearButton.onPressed!();
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.inventory_2_outlined), findsNothing);

    final exceptions = <Object>[];
    Object? error;
    while ((error = tester.takeException()) != null) {
      exceptions.add(error!);
    }

    expect(exceptions, isEmpty, reason: exceptions.join('\n'));
  });
}

class _FakeProductCatalogController extends ProductCatalogController {
  static const List<Product> _seedProducts = <Product>[
    Product(
      id: 'amp-1',
      name: 'DSP Amplifier 8CH Ultra',
      sku: 'AMP-8CH',
      shortDescription: 'Amplifier',
      price: 4200000,
      stock: 24,
      warrantyMonths: 24,
    ),
    Product(
      id: 'spk-1',
      name: 'Component Speaker 2-Way',
      sku: 'SPK-2WAY',
      shortDescription: 'Speaker',
      price: 1680000,
      stock: 6,
      warrantyMonths: 18,
    ),
    Product(
      id: 'sub-1',
      name: 'Subwoofer Compact Active',
      sku: 'SUB-ACT',
      shortDescription: 'Subwoofer',
      price: 2350000,
      stock: 0,
      warrantyMonths: 12,
    ),
  ];

  @override
  List<Product> get products => _seedProducts;

  @override
  bool get isLoading => false;

  @override
  String? get errorMessage => null;

  @override
  Product? findById(String productId) {
    for (final product in _seedProducts) {
      if (product.id == productId) {
        return product;
      }
    }
    return null;
  }

  @override
  Future<void> load({bool forceRefresh = false}) async {}

  @override
  Future<({List<Product> items, bool isLast})> fetchPage(
    int pageIndex,
    int pageSize,
  ) async {
    final start = pageIndex * pageSize;
    if (start >= _seedProducts.length) {
      return (items: const <Product>[], isLast: true);
    }
    final end = (start + pageSize) > _seedProducts.length
        ? _seedProducts.length
        : start + pageSize;
    return (
      items: _seedProducts.sublist(start, end),
      isLast: end >= _seedProducts.length,
    );
  }
}
