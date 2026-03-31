import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/l10n/app_localizations.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/order_detail_screen.dart';
import 'package:dealer_hub/order_success_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'Order success screen redirects to detail when payment becomes paid',
    (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final controller = _FakeOrderController(order: _sampleOrder);

      await tester.pumpWidget(await _buildApp(controller));
      await tester.pumpAndSettle();

      expect(find.byType(OrderSuccessScreen), findsOneWidget);

      controller.setOrder(
        _sampleOrder.copyWith(
          paymentStatus: OrderPaymentStatus.paid,
          paidAmount: _sampleOrder.total,
        ),
      );

      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.byType(OrderDetailScreen), findsOneWidget);
    },
  );

  testWidgets(
    'Order success screen redirects immediately when order is already paid',
    (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final controller = _FakeOrderController(
        order: _sampleOrder.copyWith(
          paymentStatus: OrderPaymentStatus.paid,
          paidAmount: _sampleOrder.total,
        ),
      );

      await tester.pumpWidget(await _buildApp(controller));
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.byType(OrderDetailScreen), findsOneWidget);
    },
  );
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
  paidAmount: 0,
);

Future<Widget> _buildApp(OrderController orderController) async {
  final settingsController = AppSettingsController();
  await settingsController.load();

  return AppSettingsScope(
    controller: settingsController,
    child: CartScope(
      controller: _FakeCartController(),
      child: OrderScope(
        controller: orderController,
        child: MaterialApp(
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          builder: (context, child) {
            final mediaQuery = MediaQuery.of(context);
            return MediaQuery(
              data: mediaQuery.copyWith(disableAnimations: true),
              child: child!,
            );
          },
          home: const OrderSuccessScreen(
            orderId: 'DH-001',
            itemCount: 1,
            totalPrice: 1000000,
          ),
        ),
      ),
    ),
  );
}

class _FakeCartController extends CartController {}

class _FakeOrderController extends OrderController {
  _FakeOrderController({required Order order}) : _order = order;

  Order _order;

  void setOrder(Order order) {
    _order = order;
    notifyListeners();
  }

  @override
  Order? findById(String id) {
    return id == _order.id ? _order : null;
  }
}
