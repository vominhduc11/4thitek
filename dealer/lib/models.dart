import 'package:flutter/widgets.dart';

import 'l10n/app_localizations.dart';

class ProductSpecification {
  const ProductSpecification({required this.label, required this.value});

  final String label;
  final String value;
}

enum ProductDescriptionType { title, description, image, gallery, video }

class ProductDescriptionItem {
  const ProductDescriptionItem({
    required this.type,
    this.text,
    this.url,
    this.caption,
    this.gallery = const <String>[],
  });

  final ProductDescriptionType type;
  final String? text;
  final String? url;
  final String? caption;
  final List<String> gallery;
}

class ProductVideoItem {
  const ProductVideoItem({
    required this.title,
    required this.url,
    this.description,
    this.type = 'tutorial',
  });

  final String title;
  final String url;
  final String? description;
  final String type;
}

final Expando<String> _productDescriptionCache = Expando<String>(
  'productDescription',
);
final Expando<List<ProductDescriptionItem>> _productEffectiveDescriptionsCache =
    Expando<List<ProductDescriptionItem>>('productEffectiveDescriptions');

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.sku,
    required this.shortDescription,
    required this.price,
    required this.stock,
    required this.warrantyMonths,
    this.imageUrl,
    this.descriptions = const <ProductDescriptionItem>[],
    this.videos = const <ProductVideoItem>[],
    this.specifications = const <ProductSpecification>[],
  });

  final String id;
  final String name;
  final String sku;
  final String shortDescription;
  final int price;
  final int stock;
  final int warrantyMonths;
  final String? imageUrl;
  final List<ProductDescriptionItem> descriptions;
  final List<ProductVideoItem> videos;
  final List<ProductSpecification> specifications;

  String get description {
    final cached = _productDescriptionCache[this];
    if (cached != null) {
      return cached;
    }
    final textBlock = descriptions.firstWhere(
      (item) =>
          item.type == ProductDescriptionType.description &&
          item.text != null &&
          item.text!.trim().isNotEmpty,
      orElse: () => ProductDescriptionItem(
        type: ProductDescriptionType.description,
        text: shortDescription,
      ),
    );
    final resolved = textBlock.text?.trim().isNotEmpty == true
        ? textBlock.text!.trim()
        : shortDescription;
    _productDescriptionCache[this] = resolved;
    return resolved;
  }

  List<ProductDescriptionItem> get effectiveDescriptions {
    final cached = _productEffectiveDescriptionsCache[this];
    if (cached != null) {
      return cached;
    }
    final resolved = descriptions.isNotEmpty
        ? descriptions
        : <ProductDescriptionItem>[
            ProductDescriptionItem(
              type: ProductDescriptionType.description,
              text: shortDescription,
            ),
          ];
    _productEffectiveDescriptionsCache[this] = resolved;
    return resolved;
  }

  List<ProductVideoItem> get effectiveVideos => videos;
}

class CartItem {
  const CartItem({required this.product, required this.quantity});

  final Product product;
  final int quantity;

  CartItem copyWith({int? quantity}) {
    return CartItem(product: product, quantity: quantity ?? this.quantity);
  }
}

class BulkDiscountRule {
  const BulkDiscountRule({
    required this.fromQuantity,
    required this.percent,
    this.toQuantity,
    this.rangeLabel,
  });

  final int fromQuantity;
  final int? toQuantity;
  final int percent;
  final String? rangeLabel;

  bool appliesToCart(Iterable<CartItem> items) {
    final totalQuantity = _totalCartQuantity(items);
    return _matchesBulkDiscountRule(this, totalQuantity);
  }
}

class BulkDiscountTarget {
  const BulkDiscountTarget({
    required this.targetQuantity,
    required this.percent,
    this.rangeLabel,
  });

  final int targetQuantity;
  final int percent;
  final String? rangeLabel;
}

enum OrderStatus { pending, confirmed, shipping, completed, cancelled }

extension OrderStatusLabel on OrderStatus {
  String get label {
    switch (this) {
      case OrderStatus.pending:
        return 'Ch\u1EDD x\u1EED l\u00FD';
      case OrderStatus.confirmed:
        return '\u0110\u00E3 x\u00E1c nh\u1EADn';
      case OrderStatus.shipping:
        return '\u0110ang giao';
      case OrderStatus.completed:
        return 'Ho\u00E0n th\u00E0nh';
      case OrderStatus.cancelled:
        return '\u0110\u00E3 h\u1EE7y';
    }
  }
}

enum OrderPaymentMethod { bankTransfer }

extension OrderPaymentMethodLabel on OrderPaymentMethod {
  String localizedLabel(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    switch (this) {
      case OrderPaymentMethod.bankTransfer:
        return l10n.paymentMethodBankTransfer;
    }
  }
}

enum OrderPaymentStatus { pending, paid, cancelled }

extension OrderPaymentStatusLabel on OrderPaymentStatus {
  String get label {
    switch (this) {
      case OrderPaymentStatus.cancelled:
        return '\u0110\u00E3 h\u1EE7y';
      case OrderPaymentStatus.pending:
        return 'Ch\u01B0a thanh to\u00E1n';
      case OrderPaymentStatus.paid:
        return '\u0110\u00E3 thanh to\u00E1n';
    }
  }
}

int bulkDiscountPercentForCart({
  required Iterable<CartItem> items,
  required List<BulkDiscountRule> rules,
}) {
  return _resolveBulkDiscountPricing(
    items: items,
    rules: rules,
  ).discountPercent;
}

BulkDiscountTarget? nextBulkDiscountTargetForCart({
  required Iterable<CartItem> items,
  required List<BulkDiscountRule> rules,
}) {
  final totalQuantity = _totalCartQuantity(items);
  if (totalQuantity <= 0 || rules.isEmpty) {
    return null;
  }

  final orderedRules = _sortedBulkDiscountRules(rules);
  final nextRule = orderedRules.cast<BulkDiscountRule?>().firstWhere(
    (rule) => rule != null && rule.fromQuantity > totalQuantity,
    orElse: () => null,
  );

  if (nextRule == null) {
    return null;
  }

  return BulkDiscountTarget(
    targetQuantity: nextRule.fromQuantity,
    percent: nextRule.percent,
    rangeLabel: nextRule.rangeLabel,
  );
}

int currentQuantityForBulkDiscountTarget({
  required BulkDiscountTarget target,
  required Iterable<CartItem> items,
}) {
  return _totalCartQuantity(items);
}

int remainingQuantityForBulkDiscountTarget({
  required BulkDiscountTarget target,
  required Iterable<CartItem> items,
}) {
  final remaining =
      target.targetQuantity -
      currentQuantityForBulkDiscountTarget(target: target, items: items);
  if (remaining <= 0) {
    return 0;
  }
  return remaining;
}

int bulkDiscountAmount({required int subtotal, required int discountPercent}) {
  if (subtotal <= 0 || discountPercent <= 0) {
    return 0;
  }
  return (subtotal * discountPercent / 100).round();
}

int bulkDiscountAmountForCart({
  required Iterable<CartItem> items,
  required List<BulkDiscountRule> rules,
}) {
  return _resolveBulkDiscountPricing(items: items, rules: rules).discountAmount;
}

// Backend cart/order responses are authoritative. This value is only used when
// the dealer app cannot fetch a pricing summary yet and needs a local estimate.
const int kVatPercent = 10;

/// Shared low-stock threshold for product list filters and dashboard panels.
const int kLowStockThreshold = 10;

class OrderLineItem {
  const OrderLineItem({required this.product, required this.quantity});

  final Product product;
  final int quantity;

  int get total => product.price * quantity;
}

class Order {
  const Order({
    required this.id,
    required this.createdAt,
    required this.status,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.receiverName,
    required this.receiverAddress,
    required this.receiverPhone,
    required this.items,
    this.paidAmount = 0,
    this.completedAt,
    this.note,
    this.subtotalOverride,
    this.discountPercentOverride,
    this.discountAmountOverride,
    this.vatPercentOverride,
    this.vatAmountOverride,
    this.totalAmountOverride,
  });

  final String id;
  final DateTime createdAt;
  final OrderStatus status;
  final OrderPaymentMethod paymentMethod;
  final OrderPaymentStatus paymentStatus;
  final String receiverName;
  final String receiverAddress;
  final String receiverPhone;
  final List<OrderLineItem> items;
  final int paidAmount;
  final DateTime? completedAt;
  final String? note;
  final int? subtotalOverride;
  final int? discountPercentOverride;
  final int? discountAmountOverride;
  final int? vatPercentOverride;
  final int? vatAmountOverride;
  final int? totalAmountOverride;

  int get totalItems {
    return items.fold<int>(0, (sum, item) => sum + item.quantity);
  }

  int get subtotal {
    if (subtotalOverride != null) {
      return subtotalOverride!;
    }
    return items.fold<int>(0, (sum, item) => sum + item.total);
  }

  int get discountPercent => discountPercentOverride ?? 0;

  int get discountAmount =>
      discountAmountOverride ??
      bulkDiscountAmount(subtotal: subtotal, discountPercent: discountPercent);

  int get totalAfterDiscount => subtotal - discountAmount;

  int get vatPercent => vatPercentOverride ?? kVatPercent;

  int get vatAmount =>
      vatAmountOverride ?? (totalAfterDiscount * vatPercent / 100).round();

  int get total => totalAmountOverride ?? (totalAfterDiscount + vatAmount);

  int get outstandingAmount {
    final outstanding = total - paidAmount;
    if (outstanding <= 0) {
      return 0;
    }
    return outstanding;
  }

  Order copyWith({
    OrderStatus? status,
    OrderPaymentMethod? paymentMethod,
    OrderPaymentStatus? paymentStatus,
    String? receiverName,
    String? receiverAddress,
    String? receiverPhone,
    List<OrderLineItem>? items,
    int? paidAmount,
    DateTime? completedAt,
    String? note,
    int? subtotalOverride,
    int? discountPercentOverride,
    int? discountAmountOverride,
    int? vatPercentOverride,
    int? vatAmountOverride,
    int? totalAmountOverride,
  }) {
    return Order(
      id: id,
      createdAt: createdAt,
      status: status ?? this.status,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      receiverName: receiverName ?? this.receiverName,
      receiverAddress: receiverAddress ?? this.receiverAddress,
      receiverPhone: receiverPhone ?? this.receiverPhone,
      items: items ?? this.items,
      paidAmount: paidAmount ?? this.paidAmount,
      completedAt: completedAt ?? this.completedAt,
      note: note ?? this.note,
      subtotalOverride: subtotalOverride ?? this.subtotalOverride,
      discountPercentOverride:
          discountPercentOverride ?? this.discountPercentOverride,
      discountAmountOverride:
          discountAmountOverride ?? this.discountAmountOverride,
      vatPercentOverride: vatPercentOverride ?? this.vatPercentOverride,
      vatAmountOverride: vatAmountOverride ?? this.vatAmountOverride,
      totalAmountOverride: totalAmountOverride ?? this.totalAmountOverride,
    );
  }
}

class OrderPaymentRecord {
  const OrderPaymentRecord({
    required this.id,
    required this.orderId,
    required this.amount,
    required this.paidAt,
    required this.channel,
    this.note,
    this.proofFileName,
  });

  final String id;
  final String orderId;
  final int amount;
  final DateTime paidAt;
  final String channel;
  final String? note;
  final String? proofFileName;
}

enum NoticeType { system, promotion, order, warranty }

class DistributorNotice {
  const DistributorNotice({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.createdAt,
    this.link,
    this.deepLink,
  });

  final String id;
  final NoticeType type;
  final String title;
  final String message;
  final DateTime createdAt;
  final String? link;
  final String? deepLink;
}

class _BulkDiscountPricing {
  const _BulkDiscountPricing({
    required this.discountPercent,
    required this.discountAmount,
  });

  final int discountPercent;
  final int discountAmount;
}

_BulkDiscountPricing _resolveBulkDiscountPricing({
  required Iterable<CartItem> items,
  required List<BulkDiscountRule> rules,
}) {
  final itemList = items.toList(growable: false);
  final totalQuantity = _totalCartQuantity(itemList);
  if (totalQuantity <= 0 || rules.isEmpty) {
    return const _BulkDiscountPricing(discountPercent: 0, discountAmount: 0);
  }

  final matchedRule = _selectMatchingRule(rules, quantity: totalQuantity);
  final discountPercent = matchedRule?.percent ?? 0;

  var subtotal = 0;
  for (final item in itemList) {
    final safeQuantity = item.quantity < 0 ? 0 : item.quantity;
    if (safeQuantity <= 0) {
      continue;
    }
    subtotal += item.product.price * safeQuantity;
  }
  final discountAmount = bulkDiscountAmount(
    subtotal: subtotal,
    discountPercent: discountPercent,
  );

  return _BulkDiscountPricing(
    discountPercent: discountPercent,
    discountAmount: discountAmount,
  );
}

int _totalCartQuantity(Iterable<CartItem> items) {
  return items.fold<int>(
    0,
    (total, item) => total + (item.quantity < 0 ? 0 : item.quantity),
  );
}

bool _matchesBulkDiscountRule(BulkDiscountRule rule, int quantity) {
  if (quantity <= 0) {
    return false;
  }
  if (quantity < rule.fromQuantity) {
    return false;
  }
  if (rule.toQuantity != null && quantity > rule.toQuantity!) {
    return false;
  }
  return true;
}

BulkDiscountRule? _selectMatchingRule(
  List<BulkDiscountRule> rules, {
  required int quantity,
}) {
  for (final rule in _sortedBulkDiscountRules(rules)) {
    if (_matchesBulkDiscountRule(rule, quantity)) {
      return rule;
    }
  }
  return null;
}

List<BulkDiscountRule> _sortedBulkDiscountRules(List<BulkDiscountRule> rules) {
  final sorted = rules.toList(growable: false);
  sorted.sort((left, right) {
    final fromCompare = left.fromQuantity.compareTo(right.fromQuantity);
    if (fromCompare != 0) {
      return fromCompare;
    }
    final leftTo = left.toQuantity ?? 1 << 30;
    final rightTo = right.toQuantity ?? 1 << 30;
    return leftTo.compareTo(rightTo);
  });
  return sorted;
}
