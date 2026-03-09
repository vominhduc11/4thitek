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
    return textBlock.text?.trim().isNotEmpty == true
        ? textBlock.text!.trim()
        : shortDescription;
  }

  List<ProductDescriptionItem> get effectiveDescriptions {
    if (descriptions.isNotEmpty) {
      return descriptions;
    }
    return <ProductDescriptionItem>[
      ProductDescriptionItem(
        type: ProductDescriptionType.description,
        text: shortDescription,
      ),
    ];
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

int bulkDiscountPercentForItems(int totalItems) {
  if (totalItems >= 20) {
    return 20;
  }
  if (totalItems >= 10) {
    return 10;
  }
  return 0;
}

int bulkDiscountAmount({required int subtotal, required int discountPercent}) {
  if (subtotal <= 0 || discountPercent <= 0) {
    return 0;
  }
  return (subtotal * discountPercent / 100).round();
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
    required this.shippingFee,
    required this.items,
    this.paidAmount = 0,
    this.note,
  });

  final String id;
  final DateTime createdAt;
  final OrderStatus status;
  final OrderPaymentMethod paymentMethod;
  final OrderPaymentStatus paymentStatus;
  final String receiverName;
  final String receiverAddress;
  final String receiverPhone;
  final int shippingFee;
  final List<OrderLineItem> items;
  final int paidAmount;
  final String? note;

  int get totalItems {
    return items.fold<int>(0, (sum, item) => sum + item.quantity);
  }

  int get subtotal {
    return items.fold<int>(0, (sum, item) => sum + item.total);
  }

  int get discountPercent => bulkDiscountPercentForItems(totalItems);

  int get discountAmount =>
      bulkDiscountAmount(subtotal: subtotal, discountPercent: discountPercent);

  int get totalAfterDiscount => subtotal - discountAmount;

  int get vatPercent => kVatPercent;

  int get vatAmount => (totalAfterDiscount * vatPercent / 100).round();

  int get totalBeforeShipping => totalAfterDiscount + vatAmount;

  int get total => totalBeforeShipping + shippingFee;

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
    int? shippingFee,
    List<OrderLineItem>? items,
    int? paidAmount,
    String? note,
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
      shippingFee: shippingFee ?? this.shippingFee,
      items: items ?? this.items,
      paidAmount: paidAmount ?? this.paidAmount,
      note: note ?? this.note,
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
  });

  final String id;
  final NoticeType type;
  final String title;
  final String message;
  final DateTime createdAt;
}
