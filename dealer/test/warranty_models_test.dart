import 'package:dealer_hub/warranty_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test(
    'WarrantyActivationRecord keeps activation time separate from purchase date',
    () {
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
    },
  );

  group(
    'expiresAt clamps day to end of month (mirrors Java LocalDate.plusMonths)',
    () {
      WarrantyActivationRecord record({
        required DateTime purchaseDate,
        required int warrantyMonths,
      }) {
        return WarrantyActivationRecord(
          orderId: 'O1',
          productId: 'P1',
          productName: 'Speaker',
          productSku: 'SKU-1',
          serial: 'SN-1',
          customerName: 'Test',
          customerEmail: 'test@test.com',
          customerPhone: '0123456789',
          customerAddress: 'Addr',
          warrantyMonths: warrantyMonths,
          activatedAt: purchaseDate,
          purchaseDate: purchaseDate,
        );
      }

      test('Jan 31 + 1 month = Feb 28 (non-leap year)', () {
        expect(
          record(
            purchaseDate: DateTime(2026, 1, 31),
            warrantyMonths: 1,
          ).expiresAt,
          DateTime(2026, 2, 28),
        );
      });

      test('Jan 31 + 1 month = Feb 29 (leap year)', () {
        expect(
          record(
            purchaseDate: DateTime(2028, 1, 31),
            warrantyMonths: 1,
          ).expiresAt,
          DateTime(2028, 2, 29),
        );
      });

      test('Mar 31 + 1 month = Apr 30', () {
        expect(
          record(
            purchaseDate: DateTime(2026, 3, 31),
            warrantyMonths: 1,
          ).expiresAt,
          DateTime(2026, 4, 30),
        );
      });

      test('Dec 31 + 12 months = Dec 31 (no clamping needed)', () {
        expect(
          record(
            purchaseDate: DateTime(2026, 12, 31),
            warrantyMonths: 12,
          ).expiresAt,
          DateTime(2027, 12, 31),
        );
      });

      test('Mar 1 + 12 months = Mar 1 (no clamping needed)', () {
        expect(
          record(
            purchaseDate: DateTime(2026, 3, 1),
            warrantyMonths: 12,
          ).expiresAt,
          DateTime(2027, 3, 1),
        );
      });
    },
  );
}
