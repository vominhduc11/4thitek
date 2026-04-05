import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/l10n/app_localizations.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/notification_controller.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/orders_screen.dart';
import 'package:dealer_hub/warranty_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:infinite_scroll_pagination/infinite_scroll_pagination.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Orders overview collapses on mobile scroll like product list', (
    tester,
  ) async {
    final view = tester.view;
    view.devicePixelRatio = 1.0;
    view.physicalSize = const Size(390, 844);
    addTearDown(() {
      view.resetPhysicalSize();
      view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(
      AppSettingsScope(
        controller: AppSettingsController(),
        child: NotificationScope(
          controller: NotificationController(),
          child: WarrantyScope(
            controller: _FakeWarrantyController(),
            child: OrderScope(
              controller: _FakeOrderController(),
              child: MaterialApp(
                supportedLocales: AppLocalizations.supportedLocales,
                localizationsDelegates: AppLocalizations.localizationsDelegates,
                home: const OrdersScreen(),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pump();
    await tester.pumpAndSettle();

    final overviewFinder = find.byKey(
      const ValueKey<String>('orders-overview-shell'),
    );
    final initialHeight = tester.getSize(overviewFinder).height;

    await tester.drag(
      find.byWidgetPredicate((widget) => widget is PagedListView<int, Order>),
      const Offset(0, -640),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 220));

    final collapsedHeight = tester.getSize(overviewFinder).height;

    expect(collapsedHeight, lessThan(initialHeight));
  });
}

const Product _sampleProduct = Product(
  id: 'router-ax',
  name: 'Router AX',
  sku: 'AX-1',
  shortDescription: 'Router',
  price: 1000000,
  stock: 20,
  warrantyMonths: 12,
);

final List<Order> _sampleOrders = List<Order>.generate(6, (index) {
  return Order(
    id: 'DH-00${index + 1}',
    createdAt: DateTime(2026, 3, 20 - index, 10, 30),
    status: OrderStatus.pending,
    paymentMethod: OrderPaymentMethod.bankTransfer,
    paymentStatus: OrderPaymentStatus.pending,
    receiverName: 'Nguyen Van ${String.fromCharCode(65 + index)}',
    receiverAddress: '123 Duong ${index + 1}',
    receiverPhone: '09012345${index}7',
    items: const <OrderLineItem>[
      OrderLineItem(product: _sampleProduct, quantity: 3),
    ],
  );
});

class _FakeOrderController extends OrderController {
  @override
  List<Order> get orders => _sampleOrders;

  @override
  Order? findById(String id) {
    for (final order in _sampleOrders) {
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
  @override
  Future<void> load({bool forceRefresh = false}) async {}
}
