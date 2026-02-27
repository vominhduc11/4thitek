import 'package:flutter/material.dart';

import 'mock_data.dart';
import 'models.dart';

class OrderController extends ChangeNotifier {
  OrderController({
    List<Order>? seedOrders,
    List<DebtPaymentRecord>? seedPayments,
  }) : _orders = List<Order>.from(seedOrders ?? _defaultSeedOrders()),
       _paymentHistory = List<DebtPaymentRecord>.from(
         seedPayments ?? _defaultSeedDebtPayments(),
       );

  final List<Order> _orders;
  final List<DebtPaymentRecord> _paymentHistory;

  List<Order> get orders {
    final list = List<Order>.from(_orders);
    list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return list;
  }

  List<Order> get debtOrders {
    final list = orders.where((order) => order.outstandingAmount > 0).toList();
    list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return list;
  }

  int get totalOutstandingDebt {
    return _orders.fold<int>(0, (sum, order) => sum + order.outstandingAmount);
  }

  List<DebtPaymentRecord> get paymentHistory {
    final list = List<DebtPaymentRecord>.from(_paymentHistory);
    list.sort((a, b) => b.paidAt.compareTo(a.paidAt));
    return list;
  }

  bool containsId(String id) {
    return _orders.any((order) => order.id == id);
  }

  Order? findById(String id) {
    for (final order in _orders) {
      if (order.id == id) {
        return order;
      }
    }
    return null;
  }

  void addOrder(Order order) {
    _orders.insert(0, order);
    notifyListeners();
  }

  bool updateOrderStatus(String orderId, OrderStatus status) {
    final index = _orders.indexWhere((order) => order.id == orderId);
    if (index < 0) {
      return false;
    }
    _orders[index] = _orders[index].copyWith(status: status);
    notifyListeners();
    return true;
  }

  bool recordPayment({
    required String orderId,
    required int amount,
    required String channel,
    String? note,
    String? proofFileName,
  }) {
    final index = _orders.indexWhere((order) => order.id == orderId);
    if (index < 0) {
      return false;
    }

    final current = _orders[index];
    final outstanding = current.outstandingAmount;
    if (outstanding <= 0) {
      return false;
    }

    final safeAmount = amount <= 0
        ? 0
        : (amount > outstanding ? outstanding : amount);
    if (safeAmount <= 0) {
      return false;
    }

    final newPaidAmount = current.paidAmount + safeAmount;
    final newOutstanding = current.total - newPaidAmount;
    final nextPaymentStatus = newOutstanding <= 0
        ? OrderPaymentStatus.paid
        : (current.paymentMethod == OrderPaymentMethod.debt
              ? OrderPaymentStatus.debtRecorded
              : OrderPaymentStatus.unpaid);

    _orders[index] = current.copyWith(
      paymentStatus: nextPaymentStatus,
      paidAmount: newPaidAmount,
    );

    _paymentHistory.add(
      DebtPaymentRecord(
        id: _buildPaymentId(orderId),
        orderId: orderId,
        amount: safeAmount,
        paidAt: DateTime.now(),
        channel: channel,
        note: note,
        proofFileName: proofFileName,
      ),
    );
    notifyListeners();
    return true;
  }

  String _buildPaymentId(String orderId) {
    final millis = DateTime.now().millisecondsSinceEpoch;
    return 'PAY-$orderId-$millis';
  }
}

class OrderScope extends InheritedNotifier<OrderController> {
  const OrderScope({
    super.key,
    required OrderController controller,
    required super.child,
  }) : super(notifier: controller);

  static OrderController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<OrderScope>();
    assert(scope != null, 'OrderScope not found in widget tree.');
    return scope!.notifier!;
  }
}

List<Order> _defaultSeedOrders() {
  final sxWireless = _productById('2');
  final proStudio = _productById('3');
  final bassTitan = _productById('7');
  final rgbKeyLite = _productById('11');
  final webcamFlow4k = _productById('18');
  final mouseX1Wireless = _productById('13');
  final phantomX60 = _productById('19');
  final cyclone71 = _productById('20');
  final echoLite2 = _productById('21');
  final vanguardMax = _productById('22');
  final pulseAnc = _productById('23');
  final titanWirelessX = _productById('24');
  final aero50 = _productById('25');
  final quantumStudio = _productById('26');
  final orbitChatPro = _productById('27');

  final order1 = Order(
    id: 'SCS-240315',
    createdAt: DateTime(2026, 2, 15, 10, 42),
    status: OrderStatus.shipping,
    paymentMethod: OrderPaymentMethod.bankTransfer,
    paymentStatus: OrderPaymentStatus.unpaid,
    receiverName: 'Dai ly SCS Ha Noi',
    receiverAddress: 'Số 12, Trần Duy Hưng, Cầu Giấy, Hà Nội',
    receiverPhone: '0909 123 456',
    shippingFee: 0,
    items: [
      OrderLineItem(product: sxWireless, quantity: 6),
      OrderLineItem(product: proStudio, quantity: 2),
      OrderLineItem(product: bassTitan, quantity: 2),
    ],
    paidAmount: 0,
  );

  final order2Base = Order(
    id: 'SCS-239902',
    createdAt: DateTime(2026, 2, 12, 15, 10),
    status: OrderStatus.completed,
    paymentMethod: OrderPaymentMethod.cod,
    paymentStatus: OrderPaymentStatus.paid,
    receiverName: 'Dai ly SCS Ha Noi',
    receiverAddress: 'Số 12, Trần Duy Hưng, Cầu Giấy, Hà Nội',
    receiverPhone: '0909 123 456',
    shippingFee: 0,
    items: [
      OrderLineItem(product: rgbKeyLite, quantity: 2),
      OrderLineItem(product: webcamFlow4k, quantity: 2),
    ],
    paidAmount: 0,
  );
  final order2 = order2Base.copyWith(paidAmount: order2Base.total);

  final order3 = Order(
    id: 'SCS-239118',
    createdAt: DateTime(2026, 2, 7, 9, 25),
    status: OrderStatus.completed,
    paymentMethod: OrderPaymentMethod.debt,
    paymentStatus: OrderPaymentStatus.debtRecorded,
    receiverName: 'Dai ly SCS Ha Noi',
    receiverAddress: 'Số 12, Trần Duy Hưng, Cầu Giấy, Hà Nội',
    receiverPhone: '0909 123 456',
    shippingFee: 0,
    items: [
      OrderLineItem(product: sxWireless, quantity: 3),
      OrderLineItem(product: mouseX1Wireless, quantity: 5),
    ],
    paidAmount: 3000000,
  );

  final order4 = Order(
    id: 'SCS-240401',
    createdAt: DateTime(2026, 2, 16, 8, 40),
    status: OrderStatus.pendingApproval,
    paymentMethod: OrderPaymentMethod.debt,
    paymentStatus: OrderPaymentStatus.debtRecorded,
    receiverName: 'Dai ly SCS Ha Noi',
    receiverAddress: 'Số 12, Trần Duy Hưng, Cầu Giấy, Hà Nội',
    receiverPhone: '0909 123 456',
    shippingFee: 0,
    items: [
      OrderLineItem(product: webcamFlow4k, quantity: 1),
      OrderLineItem(product: rgbKeyLite, quantity: 5),
    ],
    paidAmount: 0,
  );

  final order5Base = Order(
    id: 'SCS-240221',
    createdAt: DateTime(2026, 2, 21, 14, 20),
    status: OrderStatus.completed,
    paymentMethod: OrderPaymentMethod.cod,
    paymentStatus: OrderPaymentStatus.paid,
    receiverName: 'Dai ly SCS Ha Noi',
    receiverAddress: 'Số 12, Trần Duy Hưng, Cầu Giấy, Hà Nội',
    receiverPhone: '0909 123 456',
    shippingFee: 0,
    items: [
      OrderLineItem(product: phantomX60, quantity: 2),
      OrderLineItem(product: cyclone71, quantity: 3),
      OrderLineItem(product: echoLite2, quantity: 4),
      OrderLineItem(product: vanguardMax, quantity: 2),
      OrderLineItem(product: pulseAnc, quantity: 3),
      OrderLineItem(product: titanWirelessX, quantity: 2),
      OrderLineItem(product: aero50, quantity: 5),
      OrderLineItem(product: quantumStudio, quantity: 2),
      OrderLineItem(product: orbitChatPro, quantity: 4),
    ],
    paidAmount: 0,
  );
  final order5 = order5Base.copyWith(paidAmount: order5Base.total);

  return [order1, order2, order3, order4, order5];
}

List<DebtPaymentRecord> _defaultSeedDebtPayments() {
  return [
    DebtPaymentRecord(
      id: 'PAY-SCS-239118-1',
      orderId: 'SCS-239118',
      amount: 3000000,
      paidAt: DateTime(2026, 2, 8, 10, 15),
      channel: 'Chuyen khoan',
      note: 'Thanh toan dot 1',
      proofFileName: 'bien-lai-dot-1.pdf',
    ),
  ];
}

Product _productById(String id) {
  return mockProducts.firstWhere(
    (product) => product.id == id,
    orElse: () => mockProducts.first,
  );
}
