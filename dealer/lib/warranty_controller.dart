import 'package:flutter/material.dart';

class WarrantyActivationRecord {
  const WarrantyActivationRecord({
    required this.orderId,
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.serial,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddress,
    required this.warrantyMonths,
    required this.activatedAt,
  });

  final String orderId;
  final String productId;
  final String productName;
  final String productSku;
  final String serial;
  final String customerName;
  final String customerPhone;
  final String customerAddress;
  final int warrantyMonths;
  final DateTime activatedAt;

  DateTime get startsAt => activatedAt;

  DateTime get expiresAt => DateTime(
    activatedAt.year,
    activatedAt.month + warrantyMonths,
    activatedAt.day,
    activatedAt.hour,
    activatedAt.minute,
    activatedAt.second,
  );
}

class WarrantyController extends ChangeNotifier {
  WarrantyController({List<WarrantyActivationRecord>? seedActivations})
      : _activations = List<WarrantyActivationRecord>.from(
          seedActivations ?? _defaultSeedActivations,
        );

  final List<WarrantyActivationRecord> _activations;

  List<WarrantyActivationRecord> get activations {
    final list = List<WarrantyActivationRecord>.from(_activations);
    list.sort((a, b) => b.activatedAt.compareTo(a.activatedAt));
    return list;
  }

  List<WarrantyActivationRecord> recentActivations({int limit = 20}) {
    final list = activations;
    if (list.length <= limit) {
      return list;
    }
    return list.take(limit).toList(growable: false);
  }

  List<WarrantyActivationRecord> activationsForOrder(String orderId) {
    final list = _activations
        .where((activation) => activation.orderId == orderId)
        .toList(growable: false);
    list.sort((a, b) => b.activatedAt.compareTo(a.activatedAt));
    return list;
  }

  List<WarrantyActivationRecord> activationsForItem(
    String orderId,
    String productId,
  ) {
    final list = _activations
        .where(
          (activation) =>
              activation.orderId == orderId &&
              activation.productId == productId,
        )
        .toList(growable: false);
    list.sort((a, b) => a.activatedAt.compareTo(b.activatedAt));
    return list;
  }

  bool serialExists(String serial) {
    final normalized = _normalizeSerial(serial);
    return _activations.any(
      (activation) => _normalizeSerial(activation.serial) == normalized,
    );
  }

  void addActivations(List<WarrantyActivationRecord> newActivations) {
    if (newActivations.isEmpty) {
      return;
    }
    _activations.addAll(newActivations);
    notifyListeners();
  }

  String normalizeSerial(String serial) {
    return _normalizeSerial(serial);
  }
}

class WarrantyScope extends InheritedNotifier<WarrantyController> {
  const WarrantyScope({
    super.key,
    required WarrantyController controller,
    required super.child,
  }) : super(notifier: controller);

  static WarrantyController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<WarrantyScope>();
    assert(scope != null, 'WarrantyScope not found in widget tree.');
    return scope!.notifier!;
  }
}

String _normalizeSerial(String serial) {
  return serial.trim().toUpperCase();
}

final List<WarrantyActivationRecord> _defaultSeedActivations = [
  WarrantyActivationRecord(
    serial: 'SN-9A12-BBX1',
    orderId: 'SCS-239902',
    productId: '11',
    productName: 'SCS RGB Key Lite',
    productSku: 'SCS-RGB-KEY-LITE',
    customerName: 'Nguyen Van A',
    customerPhone: '0909 123 456',
    customerAddress: 'Cau Giay, Ha Noi',
    warrantyMonths: 12,
    activatedAt: DateTime(2026, 2, 10, 9, 30),
  ),
  WarrantyActivationRecord(
    serial: 'SN-7C82-ZK11',
    orderId: 'SCS-239118',
    productId: '13',
    productName: 'SCS Control Mouse X1 Wireless',
    productSku: 'SCS-CONTROL-MOUSE-X1-WL',
    customerName: 'Tran Thi B',
    customerPhone: '0908 000 111',
    customerAddress: 'Thanh Xuan, Ha Noi',
    warrantyMonths: 12,
    activatedAt: DateTime(2026, 2, 5, 14, 20),
  ),
];
