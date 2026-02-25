import 'package:flutter/material.dart';

import 'models.dart';

class CartController extends ChangeNotifier {
  static const Duration _cartApiLatency = Duration(milliseconds: 700);
  static const int vatPercent = 10;
  final Map<String, CartItem> _items = {};

  List<CartItem> get items {
    final list = _items.values.toList();
    list.sort((a, b) => a.product.name.compareTo(b.product.name));
    return list;
  }

  bool get isEmpty => _items.isEmpty;

  int get totalItems {
    return _items.values.fold<int>(0, (total, item) => total + item.quantity);
  }

  int get subtotal {
    return _items.values.fold<int>(
      0,
      (total, item) => total + item.quantity * item.product.price,
    );
  }

  int get discountPercent => bulkDiscountPercentForItems(totalItems);

  int get discountAmount =>
      bulkDiscountAmount(subtotal: subtotal, discountPercent: discountPercent);

  int get totalAfterDiscount => subtotal - discountAmount;

  int get vatAmount => (totalAfterDiscount * vatPercent / 100).round();

  int get total => totalAfterDiscount + vatAmount;

  int quantityFor(String productId) {
    return _items[productId]?.quantity ?? 0;
  }

  int remainingStockFor(Product product) {
    final remaining = product.stock - quantityFor(product.id);
    if (remaining <= 0) {
      return 0;
    }
    return remaining;
  }

  int suggestedAddQuantity(Product product) {
    if (!product.isOrderable || product.stock <= 0) {
      return 0;
    }
    final remaining = remainingStockFor(product);
    if (remaining <= 0) {
      return 0;
    }
    final step = product.effectiveOrderStep;
    return remaining < step ? remaining : step;
  }

  bool canAdd(Product product, {int? quantity}) {
    final requested = quantity ?? suggestedAddQuantity(product);
    if (!product.isOrderable || requested <= 0 || product.stock <= 0) {
      return false;
    }
    return remainingStockFor(product) >= requested;
  }

  bool add(Product product, {int? quantity}) {
    final requested = quantity ?? suggestedAddQuantity(product);
    if (!canAdd(product, quantity: requested)) {
      return false;
    }

    final current = _items[product.id];
    if (current == null) {
      _items[product.id] = CartItem(product: product, quantity: requested);
    } else {
      _items[product.id] = current.copyWith(
        quantity: current.quantity + requested,
      );
    }
    notifyListeners();
    return true;
  }

  Future<bool> addWithApiSimulation(Product product, {int? quantity}) async {
    await Future.delayed(_cartApiLatency);
    return add(product, quantity: quantity);
  }

  bool increase(String productId) {
    final current = _items[productId];
    if (current == null) {
      return false;
    }
    final addQuantity = suggestedAddQuantity(current.product);
    if (addQuantity <= 0) {
      return false;
    }
    _items[productId] = current.copyWith(
      quantity: current.quantity + addQuantity,
    );
    notifyListeners();
    return true;
  }

  void decrease(String productId) {
    final current = _items[productId];
    if (current == null) {
      return;
    }
    final nextQty = current.quantity - 1;
    if (nextQty <= 0) {
      _items.remove(productId);
    } else {
      _items[productId] = current.copyWith(quantity: nextQty);
    }
    notifyListeners();
  }

  void remove(String productId) {
    _items.remove(productId);
    notifyListeners();
  }

  bool setQuantity(Product product, int quantity) {
    if (!product.isOrderable) {
      return false;
    }
    if (quantity <= 0) {
      _items.remove(product.id);
      notifyListeners();
      return true;
    }

    final maxQty = product.stock;
    final minQty = product.effectiveMinOrderQty;
    var next = quantity;
    if (next > maxQty) next = maxQty;
    if (next < minQty) next = minQty;

    _items[product.id] = CartItem(product: product, quantity: next);
    notifyListeners();
    return true;
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}

class CartScope extends InheritedNotifier<CartController> {
  const CartScope({
    super.key,
    required CartController controller,
    required super.child,
  }) : super(notifier: controller);

  static CartController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<CartScope>();
    assert(scope != null, 'CartScope not found in widget tree.');
    return scope!.notifier!;
  }
}
