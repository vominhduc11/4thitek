import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/dealer_routes.dart';
import 'package:dealer_hub/inventory_screen.dart';
import 'package:dealer_hub/inventory_service.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/notification_controller.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/warranty_controller.dart';
import 'package:dealer_hub/warranty_hub_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Empty inventory import action opens the warranty hub', (
    tester,
  ) async {
    _setSurfaceSize(tester, const Size(390, 844));

    await _pumpInventoryScreen(
      tester,
      orderController: _FakeOrderController(const <Order>[]),
      warrantyController: _FakeWarrantyController(),
    );

    await tester.tap(
      find.byKey(const ValueKey<String>('inventory-import-action')),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(WarrantyHubScreen), findsOneWidget);
  });

  testWidgets('Inventory controls stay accessible while the list scrolls', (
    tester,
  ) async {
    _setSurfaceSize(tester, const Size(390, 844));
    final products = List<Product>.generate(18, _buildProduct);

    await _pumpInventoryScreen(
      tester,
      orderController: _FakeOrderController(_buildOrders(products)),
      warrantyController: _FakeWarrantyController(
        importedSerials: _buildImportedSerials(products),
        lastRemoteSyncAt: DateTime(2026, 4, 5, 9, 30),
      ),
    );

    final controlsFinder = find.byKey(
      const ValueKey<String>('inventory-controls-panel'),
    );
    final scrollableFinder = find.descendant(
      of: find.byKey(const ValueKey<String>('inventory-scroll-view')),
      matching: find.byType(Scrollable),
    );
    final initialTop = tester.getTopLeft(controlsFinder).dy;

    await tester.scrollUntilVisible(
      find.text('Inventory Item 18'),
      320,
      scrollable: scrollableFinder,
    );
    await tester.pump(const Duration(milliseconds: 400));

    final scrolledTop = tester.getTopLeft(controlsFinder).dy;

    expect((scrolledTop - initialTop).abs(), lessThan(1));
    expect(find.text('Inventory Item 18'), findsOneWidget);
  });

  testWidgets('Wide layouts render inventory in multiple columns', (
    tester,
  ) async {
    _setSurfaceSize(tester, const Size(1180, 900));
    final products = List<Product>.generate(6, _buildProduct);

    await _pumpInventoryScreen(
      tester,
      orderController: _FakeOrderController(_buildOrders(products)),
      warrantyController: _FakeWarrantyController(
        importedSerials: _buildImportedSerials(products),
        lastRemoteSyncAt: DateTime(2026, 4, 5, 9, 30),
      ),
    );

    await tester.drag(
      find.byKey(const ValueKey<String>('inventory-scroll-view')),
      const Offset(0, -320),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    final firstTile = find.text('Inventory Item 1');
    final secondTile = find.text('Inventory Item 2');
    final firstOffset = tester.getTopLeft(firstTile);
    final secondOffset = tester.getTopLeft(secondTile);

    expect((firstOffset.dy - secondOffset.dy).abs(), lessThan(1));
    expect(firstOffset.dx, lessThan(secondOffset.dx));
  });
}

Future<void> _pumpInventoryScreen(
  WidgetTester tester, {
  required OrderController orderController,
  required WarrantyController warrantyController,
}) async {
  final importedSerials = warrantyController.importedSerials;
  await tester.pumpWidget(
    AppSettingsScope(
      controller: AppSettingsController(),
      child: NotificationScope(
        controller: NotificationController(),
        child: WarrantyScope(
          controller: warrantyController,
          child: OrderScope(
            controller: orderController,
            child: MaterialApp.router(
              routerConfig: GoRouter(
                initialLocation: DealerRoutePath.inventory,
                routes: <RouteBase>[
                  GoRoute(
                    path: DealerRoutePath.inventory,
                    builder: (context, state) => InventoryScreen(
                      inventoryService: _FakeInventoryService(
                        items: _buildSummaryRecords(importedSerials),
                      ),
                    ),
                  ),
                  GoRoute(
                    path: DealerRoutePath.warranty,
                    builder: (context, state) => const WarrantyHubScreen(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );

  await tester.pump();
  await tester.pump(const Duration(milliseconds: 500));
}

List<DealerInventoryProductRecord> _buildSummaryRecords(
  List<ImportedSerialRecord> serials,
) {
  final buckets = <String, List<ImportedSerialRecord>>{};
  for (final serial in serials) {
    buckets
        .putIfAbsent(serial.productId, () => <ImportedSerialRecord>[])
        .add(serial);
  }

  return buckets.entries
      .map((entry) {
        final productSerials = entry.value;
        final first = productSerials.first;
        final readyCount = productSerials
            .where((item) => item.status == ImportedSerialStatus.available)
            .length;
        final warrantyCount = productSerials
            .where((item) => item.status == ImportedSerialStatus.warranty)
            .length;
        final issueCount = productSerials
            .where((item) => item.status == ImportedSerialStatus.defective)
            .length;

        return DealerInventoryProductRecord(
          product: Product(
            id: first.productId,
            name: first.productName,
            sku: first.productSku,
            shortDescription: 'Inventory ${first.productSku}',
            price: 1000000,
            stock: 200,
            warrantyMonths: 12,
          ),
          totalSerials: productSerials.length,
          readySerials: readyCount,
          warrantySerials: warrantyCount,
          issueSerials: issueCount,
          latestImportedAt: productSerials
              .map((item) => item.importedAt)
              .reduce((left, right) => left.isAfter(right) ? left : right),
          orderCodes: productSerials.map((item) => item.orderId).toList(),
        );
      })
      .toList(growable: false);
}

void _setSurfaceSize(WidgetTester tester, Size size) {
  final view = tester.view;
  view.devicePixelRatio = 1.0;
  view.physicalSize = size;
  addTearDown(() {
    view.resetPhysicalSize();
    view.resetDevicePixelRatio();
  });
}

Product _buildProduct(int index) {
  return Product(
    id: 'inventory-product-${index + 1}',
    name: 'Inventory Item ${index + 1}',
    sku: 'SKU-${index + 1}',
    shortDescription: 'Warehouse SKU ${index + 1}',
    price: 1000000 + (index * 50000),
    stock: 200,
    warrantyMonths: 12,
  );
}

List<Order> _buildOrders(List<Product> products) {
  return List<Order>.generate(products.length, (index) {
    final product = products[index];
    return Order(
      id: 'DH-${index + 1}',
      createdAt: DateTime(2026, 4, 5).subtract(Duration(days: index)),
      status: OrderStatus.completed,
      paymentMethod: OrderPaymentMethod.bankTransfer,
      paymentStatus: OrderPaymentStatus.pending,
      receiverName: 'Warehouse Receiver ${index + 1}',
      receiverAddress: '123 Inventory Street ${index + 1}',
      receiverPhone: '0900000${(index + 10).toString().padLeft(2, '0')}',
      items: <OrderLineItem>[OrderLineItem(product: product, quantity: 1)],
    );
  });
}

List<ImportedSerialRecord> _buildImportedSerials(List<Product> products) {
  return List<ImportedSerialRecord>.generate(products.length, (index) {
    final product = products[index];
    return ImportedSerialRecord(
      serial: 'SN-${index + 1}',
      orderId: 'DH-${index + 1}',
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      importedAt: DateTime(2026, 4, 5).subtract(Duration(days: index)),
      status: switch (index % 6) {
        4 => ImportedSerialStatus.warranty,
        5 => ImportedSerialStatus.defective,
        _ => ImportedSerialStatus.available,
      },
    );
  });
}

class _FakeOrderController extends OrderController {
  _FakeOrderController(this._orders);

  final List<Order> _orders;

  @override
  List<Order> get orders => _orders;

  @override
  Order? findById(String id) {
    for (final order in _orders) {
      if (order.id == id) {
        return order;
      }
    }
    return null;
  }

  @override
  Future<void> refresh() async {}
}

class _FakeWarrantyController extends WarrantyController {
  _FakeWarrantyController({
    List<ImportedSerialRecord> importedSerials = const <ImportedSerialRecord>[],
    DateTime? lastRemoteSyncAt,
  }) : _importedSerials = List<ImportedSerialRecord>.unmodifiable(
         importedSerials,
       ),
       _lastRemoteSyncAt = lastRemoteSyncAt;

  final List<ImportedSerialRecord> _importedSerials;
  final DateTime? _lastRemoteSyncAt;

  @override
  List<ImportedSerialRecord> get importedSerials => _importedSerials;

  @override
  DateTime? get lastRemoteSyncAt => _lastRemoteSyncAt;

}

class _FakeInventoryService extends InventoryService {
  _FakeInventoryService({required this.items}) : super();

  final List<DealerInventoryProductRecord> items;

  @override
  Future<DealerInventorySummaryRecord> fetchSummary() async {
    var readySerials = 0;
    var warrantySerials = 0;
    var issueSerials = 0;
    for (final item in items) {
      readySerials += item.readySerials;
      warrantySerials += item.warrantySerials;
      issueSerials += item.issueSerials;
    }
    return DealerInventorySummaryRecord(
      totalProducts: items.length,
      totalSerials: readySerials + warrantySerials + issueSerials,
      readySerials: readySerials,
      warrantySerials: warrantySerials,
      issueSerials: issueSerials,
      items: items,
    );
  }

  @override
  void close() {}
}
