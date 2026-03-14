import 'package:dealer_hub/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const discountedProduct = Product(
    id: '1',
    name: 'Discounted',
    sku: 'SKU-1',
    shortDescription: 'Discounted product',
    price: 100000,
    stock: 10,
    warrantyMonths: 12,
  );
  const regularProduct = Product(
    id: '2',
    name: 'Regular',
    sku: 'SKU-2',
    shortDescription: 'Regular product',
    price: 50000,
    stock: 10,
    warrantyMonths: 12,
  );

  test('mixed cart applies product-specific rule per matching line', () {
    final items = <CartItem>[
      const CartItem(product: discountedProduct, quantity: 1),
      const CartItem(product: regularProduct, quantity: 1),
    ];
    final rules = <BulkDiscountRule>[
      const BulkDiscountRule(productId: '1', minQuantity: 1, percent: 20),
      const BulkDiscountRule(minQuantity: 2, percent: 10),
    ];

    expect(bulkDiscountAmountForCart(items: items, rules: rules), 25000);
    expect(bulkDiscountPercentForCart(items: items, rules: rules), 17);
  });

  test(
    'product-specific rule applies in mixed cart for matching product quantity',
    () {
      final items = <CartItem>[
        const CartItem(product: discountedProduct, quantity: 2),
        const CartItem(product: regularProduct, quantity: 1),
      ];

      expect(
        const BulkDiscountRule(
          productId: '1',
          minQuantity: 2,
          percent: 20,
        ).appliesToCart(items),
        isTrue,
      );
    },
  );

  test(
    'next target prefers the closest product-specific tier in mixed cart',
    () {
      final items = <CartItem>[
        const CartItem(product: discountedProduct, quantity: 2),
        const CartItem(product: regularProduct, quantity: 8),
      ];
      final rules = <BulkDiscountRule>[
        const BulkDiscountRule(productId: '1', minQuantity: 3, percent: 20),
        const BulkDiscountRule(minQuantity: 12, percent: 15),
      ];

      final target = nextBulkDiscountTargetForCart(items: items, rules: rules);

      expect(target, isNotNull);
      expect(target!.productId, '1');
      expect(target.targetQuantity, 3);
      expect(target.percent, 20);
      expect(
        remainingQuantityForBulkDiscountTarget(target: target, items: items),
        1,
      );
    },
  );

  test(
    'next target ignores product-specific rules for products not in cart',
    () {
      final items = <CartItem>[
        const CartItem(product: regularProduct, quantity: 2),
      ];
      final rules = <BulkDiscountRule>[
        const BulkDiscountRule(productId: '1', minQuantity: 1, percent: 20),
        const BulkDiscountRule(minQuantity: 5, percent: 10),
      ];

      final target = nextBulkDiscountTargetForCart(items: items, rules: rules);

      expect(target, isNotNull);
      expect(target!.productId, isNull);
      expect(target.targetQuantity, 5);
      expect(target.percent, 10);
    },
  );
}
