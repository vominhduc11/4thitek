enum ImportedSerialStatus {
  available,
  reserved,
  assigned,
  warranty,
  inspecting,
  defective,
  returned,
  scrapped,
  unknown,
}

ImportedSerialStatus parseImportedSerialStatus(String? raw) {
  switch ((raw ?? '').trim().toUpperCase()) {
    case 'AVAILABLE':
      return ImportedSerialStatus.available;
    case 'RESERVED':
      return ImportedSerialStatus.reserved;
    case 'ASSIGNED':
      return ImportedSerialStatus.assigned;
    case 'WARRANTY':
      return ImportedSerialStatus.warranty;
    case 'INSPECTING':
      return ImportedSerialStatus.inspecting;
    case 'DEFECTIVE':
      return ImportedSerialStatus.defective;
    case 'RETURNED':
      return ImportedSerialStatus.returned;
    case 'SCRAPPED':
      return ImportedSerialStatus.scrapped;
    default:
      return ImportedSerialStatus.unknown;
  }
}

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
    this.warrantyEnd,
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
  final DateTime? warrantyEnd;

  DateTime get startsAt => purchaseDate;

  // Mirrors Java LocalDate.plusMonths(): clamps day to last day of target month
  // instead of overflowing into the next month (e.g. Jan 31 + 1 = Feb 28, not Mar 3).
  DateTime get expiresAt {
    if (warrantyEnd != null) {
      return DateTime(
        warrantyEnd!.year,
        warrantyEnd!.month,
        warrantyEnd!.day,
      );
    }
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
    this.status = ImportedSerialStatus.assigned,
    this.warehouseId = 'main',
    this.warehouseName = 'Kho',
  });

  final String serial;
  final String orderId;
  final String productId;
  final String productName;
  final String productSku;
  final DateTime importedAt;
  final ImportedSerialStatus status;
  final String warehouseId;
  final String warehouseName;

  ImportedSerialRecord copyWith({
    String? serial,
    String? orderId,
    String? productId,
    String? productName,
    String? productSku,
    DateTime? importedAt,
    ImportedSerialStatus? status,
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
      status: status ?? this.status,
      warehouseId: warehouseId ?? this.warehouseId,
      warehouseName: warehouseName ?? this.warehouseName,
    );
  }
}
