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
    required this.percent,
    this.productId,
    this.minQuantity,
    this.maxQuantity,
    this.rangeLabel,
  });

  final int percent;
  final String? productId;
  final int? minQuantity;
  final int? maxQuantity;
  final String? rangeLabel;

  bool appliesToCart(Iterable<CartItem> items) {
    final stats = _buildBulkDiscountStats(
      items.map(
        (item) => (productId: item.product.id, quantity: item.quantity),
      ),
    );
    return _matchesBulkDiscountRule(this, stats);
  }
}

class BulkDiscountTarget {
  const BulkDiscountTarget({
    required this.targetQuantity,
    required this.percent,
    this.productId,
    this.rangeLabel,
  });

  final int targetQuantity;
  final int percent;
  final String? productId;
  final String? rangeLabel;
}

enum OrderStatus { pendingApproval, approved, shipping, completed, cancelled }

extension OrderStatusLabel on OrderStatus {
  String get label {
    switch (this) {
      case OrderStatus.pendingApproval:
        return 'Ch\u1EDD duy\u1EC7t';
      case OrderStatus.approved:
        return '\u0110\u00E3 duy\u1EC7t';
      case OrderStatus.shipping:
        return '\u0110ang giao';
      case OrderStatus.completed:
        return 'Ho\u00E0n th\u00E0nh';
      case OrderStatus.cancelled:
        return '\u0110\u00E3 h\u1EE7y';
    }
  }
}

enum OrderPaymentMethod { bankTransfer, debt }

extension OrderPaymentMethodLabel on OrderPaymentMethod {
  String get label {
    switch (this) {
      case OrderPaymentMethod.bankTransfer:
        return 'Chuy\u1EC3n kho\u1EA3n ng\u00E2n h\u00E0ng';
      case OrderPaymentMethod.debt:
        return 'Ghi nh\u1EADn c\u00F4ng n\u1EE3';
    }
  }
}

enum OrderPaymentStatus { unpaid, paid, debtRecorded, cancelled, failed }

extension OrderPaymentStatusLabel on OrderPaymentStatus {
  String get label {
    switch (this) {
      case OrderPaymentStatus.cancelled:
        return '\u0110\u00E3 h\u1EE7y';
      case OrderPaymentStatus.failed:
        return 'Th\u1EA5t b\u1EA1i';
      case OrderPaymentStatus.unpaid:
        return 'Ch\u01B0a thanh to\u00E1n';
      case OrderPaymentStatus.paid:
        return '\u0110\u00E3 thanh to\u00E1n';
      case OrderPaymentStatus.debtRecorded:
        return 'Ghi nh\u1EADn c\u00F4ng n\u1EE3';
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
  final stats = _buildBulkDiscountStats(
    items.map((item) => (productId: item.product.id, quantity: item.quantity)),
  );
  if (stats.totalItems <= 0 || rules.isEmpty) {
    return null;
  }

  BulkDiscountRule? nextRule;
  int? nextAdditionalQuantity;
  for (final rule in rules) {
    final minQuantity = rule.minQuantity;
    if (minQuantity == null) {
      continue;
    }
    if (rule.productId != null &&
        !stats.productQuantities.containsKey(rule.productId)) {
      continue;
    }

    final currentQuantity = _quantityForRule(rule, stats);
    if (currentQuantity <= 0 || minQuantity <= currentQuantity) {
      continue;
    }

    final additionalQuantity = minQuantity - currentQuantity;
    if (nextRule == null ||
        _isBetterNextDiscountTarget(
          candidate: rule,
          best: nextRule,
          candidateAdditionalQuantity: additionalQuantity,
          bestAdditionalQuantity: nextAdditionalQuantity!,
        )) {
      nextRule = rule;
      nextAdditionalQuantity = additionalQuantity;
    }
  }

  if (nextRule == null) {
    return null;
  }

  return BulkDiscountTarget(
    targetQuantity: nextRule.minQuantity ?? stats.totalItems,
    percent: nextRule.percent,
    productId: nextRule.productId,
    rangeLabel: nextRule.rangeLabel,
  );
}

int currentQuantityForBulkDiscountTarget({
  required BulkDiscountTarget target,
  required Iterable<CartItem> items,
}) {
  final stats = _buildBulkDiscountStats(
    items.map((item) => (productId: item.product.id, quantity: item.quantity)),
  );
  if (target.productId == null) {
    return stats.totalItems;
  }
  return stats.productQuantities[target.productId] ?? 0;
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

class DebtPaymentRecord {
  const DebtPaymentRecord({
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

enum NoticeType { system, promotion, order }

class DistributorNotice {
  const DistributorNotice({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.createdAt,
    this.link,
  });

  final String id;
  final NoticeType type;
  final String title;
  final String message;
  final DateTime createdAt;
  final String? link;
}

typedef _BulkDiscountLine = ({String productId, int quantity});

class _BulkDiscountStats {
  const _BulkDiscountStats({
    required this.totalItems,
    required this.productQuantities,
    required this.singleProductId,
  });

  final int totalItems;
  final Map<String, int> productQuantities;
  final String? singleProductId;
}

_BulkDiscountStats _buildBulkDiscountStats(Iterable<_BulkDiscountLine> lines) {
  final productIds = <String>{};
  final productQuantities = <String, int>{};
  var totalItems = 0;
  for (final line in lines) {
    final safeQuantity = line.quantity < 0 ? 0 : line.quantity;
    totalItems += safeQuantity;
    if (line.productId.trim().isNotEmpty && safeQuantity > 0) {
      productIds.add(line.productId);
      productQuantities.update(
        line.productId,
        (quantity) => quantity + safeQuantity,
        ifAbsent: () => safeQuantity,
      );
    }
  }
  return _BulkDiscountStats(
    totalItems: totalItems,
    productQuantities: Map<String, int>.unmodifiable(productQuantities),
    singleProductId: productIds.length == 1 ? productIds.first : null,
  );
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
  final stats = _buildBulkDiscountStats(
    itemList.map(
      (item) => (productId: item.product.id, quantity: item.quantity),
    ),
  );
  if (stats.totalItems <= 0 || rules.isEmpty) {
    return const _BulkDiscountPricing(discountPercent: 0, discountAmount: 0);
  }

  final globalRule = _selectBestMatchingRule(
    rules.where((rule) => rule.productId == null),
    quantity: stats.totalItems,
  );
  final productRules = <String, BulkDiscountRule>{};
  for (final entry in stats.productQuantities.entries) {
    final matchedRule = _selectBestMatchingRule(
      rules.where((rule) => rule.productId == entry.key),
      quantity: entry.value,
    );
    if (matchedRule != null) {
      productRules[entry.key] = matchedRule;
    }
  }

  var subtotal = 0;
  var discountAmount = 0;
  for (final item in itemList) {
    final safeQuantity = item.quantity < 0 ? 0 : item.quantity;
    if (safeQuantity <= 0) {
      continue;
    }
    final lineSubtotal = item.product.price * safeQuantity;
    subtotal += lineSubtotal;
    final matchedRule = productRules[item.product.id] ?? globalRule;
    if (matchedRule == null) {
      continue;
    }
    discountAmount += bulkDiscountAmount(
      subtotal: lineSubtotal,
      discountPercent: matchedRule.percent,
    );
  }

  return _BulkDiscountPricing(
    discountPercent: _resolveBulkDiscountPercentForSubtotal(
      subtotal: subtotal,
      discountAmount: discountAmount,
    ),
    discountAmount: discountAmount,
  );
}

int _resolveBulkDiscountPercentForSubtotal({
  required int subtotal,
  required int discountAmount,
}) {
  if (subtotal <= 0 || discountAmount <= 0) {
    return 0;
  }
  return (discountAmount * 100 / subtotal).round();
}

bool _matchesBulkDiscountRule(BulkDiscountRule rule, _BulkDiscountStats stats) {
  final quantity = _quantityForRule(rule, stats);
  if (quantity <= 0) {
    return false;
  }
  if (rule.minQuantity != null && quantity < rule.minQuantity!) {
    return false;
  }
  if (rule.maxQuantity != null && quantity > rule.maxQuantity!) {
    return false;
  }
  return true;
}

int _quantityForRule(BulkDiscountRule rule, _BulkDiscountStats stats) {
  if (rule.productId == null) {
    return stats.totalItems;
  }
  return stats.productQuantities[rule.productId] ?? 0;
}

BulkDiscountRule? _selectBestMatchingRule(
  Iterable<BulkDiscountRule> rules, {
  required int quantity,
}) {
  BulkDiscountRule? bestRule;
  for (final rule in rules) {
    if (!_matchesQuantity(rule, quantity)) {
      continue;
    }
    if (bestRule == null || _compareDiscountRulePriority(rule, bestRule) < 0) {
      bestRule = rule;
    }
  }
  return bestRule;
}

bool _matchesQuantity(BulkDiscountRule rule, int quantity) {
  if (quantity <= 0) {
    return false;
  }
  if (rule.minQuantity != null && quantity < rule.minQuantity!) {
    return false;
  }
  if (rule.maxQuantity != null && quantity > rule.maxQuantity!) {
    return false;
  }
  return true;
}

int _compareDiscountRulePriority(BulkDiscountRule a, BulkDiscountRule b) {
  final minCompare = (b.minQuantity ?? 0).compareTo(a.minQuantity ?? 0);
  if (minCompare != 0) {
    return minCompare;
  }
  final percentCompare = b.percent.compareTo(a.percent);
  if (percentCompare != 0) {
    return percentCompare;
  }
  final maxA = a.maxQuantity ?? 1 << 30;
  final maxB = b.maxQuantity ?? 1 << 30;
  return maxA.compareTo(maxB);
}

bool _isBetterNextDiscountTarget({
  required BulkDiscountRule candidate,
  required BulkDiscountRule best,
  required int candidateAdditionalQuantity,
  required int bestAdditionalQuantity,
}) {
  final additionalCompare = candidateAdditionalQuantity.compareTo(
    bestAdditionalQuantity,
  );
  if (additionalCompare != 0) {
    return additionalCompare < 0;
  }

  final percentCompare = candidate.percent.compareTo(best.percent);
  if (percentCompare != 0) {
    return percentCompare > 0;
  }

  if (candidate.productId != null && best.productId == null) {
    return true;
  }
  if (candidate.productId == null && best.productId != null) {
    return false;
  }

  return _compareDiscountRulePriority(candidate, best) < 0;
}
