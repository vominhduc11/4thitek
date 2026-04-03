import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/l10n/app_localizations.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/order_detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Order detail localizes status update error in English', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(
      await _buildApp(
        const Locale('en'),
        orderController: _FakeOrderController(
          actionMessage: orderControllerMessageToken(
            OrderMessageCode.unauthenticated,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Cancel order').first);
    await tester.pumpAndSettle();
    await tester.tap(find.byType(FilledButton).last);
    await tester.pumpAndSettle();

    expect(
      find.text('You need to sign in before managing orders.'),
      findsOneWidget,
    );
  });

  testWidgets('Order detail does not expose dealer confirm-received action', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(
      await _buildApp(
        const Locale('en'),
        orderController: _FakeOrderController(
          actionMessage: null,
          order: _sampleOrder.copyWith(status: OrderStatus.shipping),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Confirm received'), findsNothing);
    expect(find.text('Confirm delivery received'), findsNothing);
  });
}

const Product _sampleProduct = Product(
  id: '1',
  name: 'Router AX',
  sku: 'AX-1',
  shortDescription: 'Router',
  price: 1000000,
  stock: 5,
  warrantyMonths: 12,
);

final Order _sampleOrder = Order(
  id: 'DH-001',
  createdAt: DateTime(2026, 1, 10),
  status: OrderStatus.pending,
  paymentMethod: OrderPaymentMethod.bankTransfer,
  paymentStatus: OrderPaymentStatus.pending,
  receiverName: 'Nguyen Van A',
  receiverAddress: '123 Duong A',
  receiverPhone: '0901234567',
  items: <OrderLineItem>[OrderLineItem(product: _sampleProduct, quantity: 1)],
);

Future<Widget> _buildApp(
  Locale locale, {
  required OrderController orderController,
}) async {
  final settingsController = AppSettingsController();
  await settingsController.setLocale(locale);

  return AppSettingsScope(
    controller: settingsController,
    child: MaterialApp(
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      theme: ThemeData(
        useMaterial3: true,
        splashFactory: NoSplash.splashFactory,
      ),
      home: CartScope(
        controller: _FakeCartController(),
        child: OrderScope(
          controller: orderController,
          child: const OrderDetailScreen(orderId: 'DH-001'),
        ),
      ),
    ),
  );
}

class _FakeCartController extends CartController {}

class _FakeOrderController extends OrderController {
  _FakeOrderController({required this.actionMessage, Order? order})
    : order = order ?? _sampleOrder;

  final String? actionMessage;
  final Order order;

  @override
  String? get lastActionMessage => actionMessage;

  @override
  Order? findById(String id) {
    return id == order.id ? order : null;
  }

  @override
  Future<bool> updateOrderStatus(String orderId, OrderStatus status) async {
    return false;
  }
}
