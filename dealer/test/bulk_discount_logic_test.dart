import 'package:dealer_hub/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const product = Product(
    id: '1',
    name: 'Tiered Product',
    sku: 'SKU-1',
    shortDescription: 'Tiered product',
    price: 100000,
    stock: 100,
    warrantyMonths: 12,
  );
  const bundleProduct = Product(
    id: '2',
    name: 'Bundle Product',
    sku: 'SKU-2',
    shortDescription: 'Bundle product',
    price: 200000,
    stock: 100,
    warrantyMonths: 12,
  );

  const rules = <BulkDiscountRule>[
    BulkDiscountRule(
      fromQuantity: 1,
      toQuantity: 10,
      percent: 10,
      rangeLabel: '1 - 10',
    ),
    BulkDiscountRule(
      fromQuantity: 11,
      toQuantity: 20,
      percent: 20,
      rangeLabel: '11 - 20',
    ),
    BulkDiscountRule(
      fromQuantity: 21,
      toQuantity: 50,
      percent: 30,
      rangeLabel: '21 - 50',
    ),
    BulkDiscountRule(
      fromQuantity: 51,
      toQuantity: null,
      percent: 40,
      rangeLabel: '51+',
    ),
  ];

  List<CartItem> cartWithQuantity(int quantity) => <CartItem>[
        CartItem(product: product, quantity: quantity),
      ];

  List<CartItem> mixedCart(int firstQuantity, int secondQuantity) => <CartItem>[
        CartItem(product: product, quantity: firstQuantity),
        CartItem(product: bundleProduct, quantity: secondQuantity),
      ];

  group('bulk discount fallback pricing', () {
    test('matches 1 and 10 to tier 1-10', () {
      expect(
        bulkDiscountPercentForCart(items: cartWithQuantity(1), rules: rules),
        10,
      );
      expect(
        bulkDiscountPercentForCart(items: cartWithQuantity(10), rules: rules),
        10,
      );
    });

    test('matches 11 and 20 to tier 11-20', () {
      expect(
        bulkDiscountPercentForCart(items: cartWithQuantity(11), rules: rules),
        20,
      );
      expect(
        bulkDiscountPercentForCart(items: cartWithQuantity(20), rules: rules),
        20,
      );
    });

    test('matches 21 and 51 to the expected upper tiers', () {
      expect(
        bulkDiscountPercentForCart(items: cartWithQuantity(21), rules: rules),
        30,
      );
      expect(
        bulkDiscountPercentForCart(items: cartWithQuantity(51), rules: rules),
        40,
      );
    });

    test('calculates discount amount from total cart quantity tiers', () {
      expect(
        bulkDiscountAmountForCart(items: cartWithQuantity(10), rules: rules),
        100000,
      );
      expect(
        bulkDiscountAmountForCart(items: cartWithQuantity(20), rules: rules),
        400000,
      );
      expect(
        bulkDiscountAmountForCart(items: cartWithQuantity(51), rules: rules),
        2040000,
      );
    });

    test('uses total cart quantity across multiple lines and matches backend summary math', () {
      final items = mixedCart(5, 6);
      final subtotal = items.fold<int>(
        0,
        (sum, item) => sum + (item.product.price * item.quantity),
      );
      final discountPercent = bulkDiscountPercentForCart(items: items, rules: rules);
      final discountAmount = bulkDiscountAmountForCart(items: items, rules: rules);

      expect(discountPercent, 20);
      expect(subtotal, 1700000);
      expect(discountAmount, 340000);
      expect(subtotal - discountAmount, 1360000);
    });

    test('next target points to the next quantity tier only', () {
      final targetAt10 = nextBulkDiscountTargetForCart(
        items: cartWithQuantity(10),
        rules: rules,
      );
      expect(targetAt10, isNotNull);
      expect(targetAt10!.targetQuantity, 11);
      expect(targetAt10.percent, 20);
      expect(
        remainingQuantityForBulkDiscountTarget(
          target: targetAt10,
          items: cartWithQuantity(10),
        ),
        1,
      );

      final targetAt20 = nextBulkDiscountTargetForCart(
        items: cartWithQuantity(20),
        rules: rules,
      );
      expect(targetAt20, isNotNull);
      expect(targetAt20!.targetQuantity, 21);
      expect(targetAt20.percent, 30);

      final targetAt51 = nextBulkDiscountTargetForCart(
        items: cartWithQuantity(51),
        rules: rules,
      );
      expect(targetAt51, isNull);
    });

    test('local matching does not depend on rangeLabel text', () {
      final mismatchedLabelRules = <BulkDiscountRule>[
        const BulkDiscountRule(
          fromQuantity: 1,
          toQuantity: 10,
          percent: 10,
          rangeLabel: 'legacy text',
        ),
        const BulkDiscountRule(
          fromQuantity: 11,
          toQuantity: null,
          percent: 20,
          rangeLabel: 'wrong label',
        ),
      ];

      expect(
        bulkDiscountPercentForCart(
          items: cartWithQuantity(10),
          rules: mismatchedLabelRules,
        ),
        10,
      );
      expect(
        bulkDiscountPercentForCart(
          items: cartWithQuantity(11),
          rules: mismatchedLabelRules,
        ),
        20,
      );
    });
  });
}
