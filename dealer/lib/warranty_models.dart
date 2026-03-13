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

  DateTime get expiresAt => DateTime(
    purchaseDate.year,
    purchaseDate.month + warrantyMonths,
    purchaseDate.day,
  );
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

class WarrantySerialImportResult {
  const WarrantySerialImportResult({
    required this.addedCount,
    required this.duplicateCount,
    required this.invalidCount,
    required this.overLimitCount,
    this.errorMessage,
  });

  final int addedCount;
  final int duplicateCount;
  final int invalidCount;
  final int overLimitCount;
  final String? errorMessage;

  bool get hasError => errorMessage != null && errorMessage!.trim().isNotEmpty;
}
