import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/dashboard_screen.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/warranty_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  for (final size in const <Size>[Size(320, 760), Size(390, 844)]) {
    testWidgets('Dashboard renders data-rich mobile layout at $size', (
      tester,
    ) async {
      final view = tester.view;
      view.devicePixelRatio = 1.0;
      view.physicalSize = size;
      addTearDown(() {
        view.resetPhysicalSize();
        view.resetDevicePixelRatio();
      });

      final settingsController = AppSettingsController();
      final orderController = _DataRichOrderController();
      final warrantyController = _DataRichWarrantyController();

      await tester.pumpWidget(
        AppSettingsScope(
          controller: settingsController,
          child: MaterialApp(
            home: WarrantyScope(
              controller: warrantyController,
              child: OrderScope(
                controller: orderController,
                child: const DashboardScreen(),
              ),
            ),
          ),
        ),
      );

      await tester.pump(const Duration(milliseconds: 1200));
      await tester.pumpAndSettle();

      final exceptions = <Object>[];
      Object? error;
      while ((error = tester.takeException()) != null) {
        exceptions.add(error!);
      }

      expect(exceptions, isEmpty, reason: exceptions.join('\n'));
      expect(find.byType(Scaffold), findsOneWidget);
    });
  }
}

class _DataRichOrderController extends OrderController {
  static final Product _amp = Product(
    id: 'amp-1',
    name: 'DSP Amplifier 8CH',
    sku: 'AMP-8CH',
    shortDescription: 'Dealer amplifier',
    price: 4200000,
    stock: 24,
    warrantyMonths: 24,
  );

  static final Product _speaker = Product(
    id: 'spk-1',
    name: 'Component Speaker 2-Way',
    sku: 'SPK-2WAY',
    shortDescription: 'Dealer speaker',
    price: 1680000,
    stock: 14,
    warrantyMonths: 18,
  );

  static final DateTime _now = DateTime(2026, 3, 28, 10, 0);

  static Order _order({
    required String id,
    required DateTime createdAt,
    required OrderStatus status,
    required OrderPaymentMethod paymentMethod,
    required OrderPaymentStatus paymentStatus,
    required List<OrderLineItem> items,
    int paidAmount = 0,
  }) {
    return Order(
      id: id,
      createdAt: createdAt,
      status: status,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      receiverName: 'TuneZone Dealer',
      receiverAddress: 'HCMC',
      receiverPhone: '0900000000',
      items: items,
      paidAmount: paidAmount,
      completedAt: status == OrderStatus.completed ? createdAt : null,
    );
  }

  final List<Order> _seedOrders = <Order>[
    _order(
      id: 'DZ-1001',
      createdAt: _now.subtract(const Duration(days: 4)),
      status: OrderStatus.completed,
      paymentMethod: OrderPaymentMethod.bankTransfer,
      paymentStatus: OrderPaymentStatus.paid,
      paidAmount: 10000000,
      items: <OrderLineItem>[
        OrderLineItem(product: _amp, quantity: 2),
        OrderLineItem(product: _speaker, quantity: 1),
      ],
    ),
    _order(
      id: 'DZ-1002',
      createdAt: _now.subtract(const Duration(days: 12)),
      status: OrderStatus.shipping,
      paymentMethod: OrderPaymentMethod.bankTransfer,
      paymentStatus: OrderPaymentStatus.pending,
      paidAmount: 1500000,
      items: <OrderLineItem>[OrderLineItem(product: _speaker, quantity: 3)],
    ),
    _order(
      id: 'DZ-1003',
      createdAt: _now.subtract(const Duration(days: 18)),
      status: OrderStatus.completed,
      paymentMethod: OrderPaymentMethod.bankTransfer,
      paymentStatus: OrderPaymentStatus.pending,
      paidAmount: 2000000,
      items: <OrderLineItem>[OrderLineItem(product: _amp, quantity: 1)],
    ),
    _order(
      id: 'DZ-1004',
      createdAt: _now.subtract(const Duration(days: 36)),
      status: OrderStatus.confirmed,
      paymentMethod: OrderPaymentMethod.bankTransfer,
      paymentStatus: OrderPaymentStatus.pending,
      items: <OrderLineItem>[OrderLineItem(product: _speaker, quantity: 2)],
    ),
  ];

  @override
  List<Order> get orders => List<Order>.unmodifiable(_seedOrders);

  @override
  DateTime? get lastRemoteSyncAt => _now;

  @override
  Future<void> refresh() async {}
}

class _DataRichWarrantyController extends WarrantyController {
  static final DateTime _now = DateTime(2026, 3, 28, 10, 0);

  final List<WarrantyActivationRecord> _seedActivations =
      <WarrantyActivationRecord>[
        for (var i = 0; i < 12; i++)
          WarrantyActivationRecord(
            orderId: i.isEven ? 'DZ-1001' : 'DZ-1003',
            productId: i.isEven ? 'amp-1' : 'spk-1',
            productName: i.isEven
                ? 'DSP Amplifier 8CH'
                : 'Component Speaker 2-Way',
            productSku: i.isEven ? 'AMP-8CH' : 'SPK-2WAY',
            serial: 'SN-$i',
            customerName: 'Customer $i',
            customerEmail: 'c$i@example.com',
            customerPhone: '09000000$i',
            customerAddress: 'HCMC',
            warrantyMonths: 18,
            activatedAt: _now.subtract(Duration(days: i * 3)),
            purchaseDate: _now.subtract(Duration(days: i * 3 + 1)),
          ),
      ];

  @override
  List<WarrantyActivationRecord> get activations =>
      List<WarrantyActivationRecord>.unmodifiable(_seedActivations);

  @override
  List<ImportedSerialRecord> get importedSerials =>
      const <ImportedSerialRecord>[];

  @override
  DateTime? get lastRemoteSyncAt => _now;

  @override
  String? get lastSyncMessage => null;

  @override
  Future<void> load({bool forceRefresh = false}) async {}
}
