class WarrantyActivationRecord {
  const WarrantyActivationRecord({
    required this.orderId,
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.serial,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    required this.customerAddress,
    required this.warrantyMonths,
    required this.activatedAt,
    required this.purchaseDate,
  });

  final String orderId;
  final String productId;
  final String productName;
  final String productSku;
  final String serial;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String customerAddress;
  final int warrantyMonths;
  final DateTime activatedAt;
  final DateTime purchaseDate;

  DateTime get startsAt => purchaseDate;

  // Mirrors Java LocalDate.plusMonths(): clamps day to last day of target month
  // instead of overflowing into the next month (e.g. Jan 31 + 1 = Feb 28, not Mar 3).
  DateTime get expiresAt {
    final target = DateTime(
      purchaseDate.year,
      purchaseDate.month + warrantyMonths,
      1,
    );
    final lastDay = DateTime(target.year, target.month + 1, 0).day;
    return DateTime(
      target.year,
      target.month,
      purchaseDate.day.clamp(1, lastDay),
    );
  }
}

class ImportedSerialRecord {
  const ImportedSerialRecord({
    required this.serial,
    required this.orderId,
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.importedAt,
    this.warehouseId = 'main',
    this.warehouseName = 'Kho',
  });

  final String serial;
  final String orderId;
  final String productId;
  final String productName;
  final String productSku;
  final DateTime importedAt;
  final String warehouseId;
  final String warehouseName;

  ImportedSerialRecord copyWith({
    String? serial,
    String? orderId,
    String? productId,
    String? productName,
    String? productSku,
    DateTime? importedAt,
    String? warehouseId,
    String? warehouseName,
  }) {
    return ImportedSerialRecord(
      serial: serial ?? this.serial,
      orderId: orderId ?? this.orderId,
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      productSku: productSku ?? this.productSku,
      importedAt: importedAt ?? this.importedAt,
      warehouseId: warehouseId ?? this.warehouseId,
      warehouseName: warehouseName ?? this.warehouseName,
    );
  }
}

