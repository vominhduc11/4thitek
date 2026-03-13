import 'package:dealer_hub/warranty_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('WarrantyActivationRecord keeps activation time separate from purchase date', () {
    final laterActivation = WarrantyActivationRecord(
      orderId: 'ORDER-1',
      productId: 'PRODUCT-1',
      productName: 'Speaker',
      productSku: 'SPK-1',
      serial: 'SERIAL-1',
      customerName: 'Customer A',
      customerEmail: 'a@example.com',
      customerPhone: '0123456789',
      customerAddress: '123 Test Street',
      warrantyMonths: 12,
      activatedAt: DateTime(2026, 3, 13, 15, 30),
      purchaseDate: DateTime(2026, 3, 1),
    );
    final earlierActivation = WarrantyActivationRecord(
      orderId: 'ORDER-2',
      productId: 'PRODUCT-2',
      productName: 'Speaker',
      productSku: 'SPK-2',
      serial: 'SERIAL-2',
      customerName: 'Customer B',
      customerEmail: 'b@example.com',
      customerPhone: '0987654321',
      customerAddress: '456 Test Street',
      warrantyMonths: 12,
      activatedAt: DateTime(2026, 3, 12, 9, 0),
      purchaseDate: DateTime(2026, 3, 5),
    );

    final sorted = <WarrantyActivationRecord>[
      earlierActivation,
      laterActivation,
    ]..sort((a, b) => b.activatedAt.compareTo(a.activatedAt));

    expect(sorted.first.serial, 'SERIAL-1');
    expect(laterActivation.purchaseDate, DateTime(2026, 3, 1));
    expect(laterActivation.expiresAt, DateTime(2027, 3, 1));
  });
}
