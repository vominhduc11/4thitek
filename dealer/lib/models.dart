class ProductSpecification {
  const ProductSpecification({required this.label, required this.value});

  final String label;
  final String value;
}

enum ProductCategory {
  headset,
  keyboard,
  mouse,
  speaker,
  webcam,
  accessory,
}

extension ProductCategoryLabel on ProductCategory {
  String get label {
    switch (this) {
      case ProductCategory.headset:
        return 'Tai nghe';
      case ProductCategory.keyboard:
        return 'Ban phim';
      case ProductCategory.mouse:
        return 'Chuot';
      case ProductCategory.speaker:
        return 'Loa';
      case ProductCategory.webcam:
        return 'Webcam';
      case ProductCategory.accessory:
        return 'Phu kien';
    }
  }
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
    required this.category,
    required this.sku,
    required this.shortDescription,
    required this.dealerPrice,
    required this.stock,
    required this.warrantyMonths,
    this.listPrice,
    this.imageUrl,
    this.descriptions = const <ProductDescriptionItem>[],
    this.videos = const <ProductVideoItem>[],
    this.specifications = const <ProductSpecification>[],
    this.minOrderQty = 1,
    this.orderStep = 1,
    this.isOrderable = true,
  });

  final String id;
  final String name;
  final ProductCategory category;
  final String sku;
  final String shortDescription;
  final int dealerPrice;
  final int? listPrice;
  final int stock;
  final int warrantyMonths;
  final String? imageUrl;
  final List<ProductDescriptionItem> descriptions;
  final List<ProductVideoItem> videos;
  final List<ProductSpecification> specifications;
  final int minOrderQty;
  final int orderStep;
  final bool isOrderable;

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

  int get price => dealerPrice;

  int get effectiveMinOrderQty {
    final normalized = minOrderQty <= 0 ? 1 : minOrderQty;
    if (stock <= 0) {
      return normalized;
    }
    return normalized > stock ? stock : normalized;
  }

  int get effectiveOrderStep => orderStep <= 0 ? 1 : orderStep;

  bool get hasDiscount => listPrice != null && listPrice! > dealerPrice;
}

class CartItem {
  const CartItem({required this.product, required this.quantity});

  final Product product;
  final int quantity;

  CartItem copyWith({int? quantity}) {
    return CartItem(product: product, quantity: quantity ?? this.quantity);
  }
}

enum OrderStatus { pendingApproval, approved, shipping, completed }

extension OrderStatusLabel on OrderStatus {
  String get label {
    switch (this) {
      case OrderStatus.pendingApproval:
        return 'Cho duyet';
      case OrderStatus.approved:
        return 'Da duyet';
      case OrderStatus.shipping:
        return 'Dang giao';
      case OrderStatus.completed:
        return 'Hoan thanh';
    }
  }
}

enum OrderPaymentMethod { cod, bankTransfer, debt }

extension OrderPaymentMethodLabel on OrderPaymentMethod {
  String get label {
    switch (this) {
      case OrderPaymentMethod.cod:
        return 'Thanh toan khi nhan hang (COD)';
      case OrderPaymentMethod.bankTransfer:
        return 'Chuyen khoan ngan hang';
      case OrderPaymentMethod.debt:
        return 'Ghi nhan cong no';
    }
  }
}

enum OrderPaymentStatus { unpaid, paid, debtRecorded }

extension OrderPaymentStatusLabel on OrderPaymentStatus {
  String get label {
    switch (this) {
      case OrderPaymentStatus.unpaid:
        return 'Chua thanh toan';
      case OrderPaymentStatus.paid:
        return 'Da thanh toan';
      case OrderPaymentStatus.debtRecorded:
        return 'Ghi nhan cong no';
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

int bulkDiscountAmount({
  required int subtotal,
  required int discountPercent,
}) {
  if (subtotal <= 0 || discountPercent <= 0) {
    return 0;
  }
  return (subtotal * discountPercent / 100).round();
}

const int kVatPercent = 10;

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
