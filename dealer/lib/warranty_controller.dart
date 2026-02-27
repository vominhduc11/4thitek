import 'package:flutter/material.dart';

class WarrantyActivationRecord {
  const WarrantyActivationRecord({
    required this.orderId,
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.serial,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddress,
    required this.warrantyMonths,
    required this.activatedAt,
  });

  final String orderId;
  final String productId;
  final String productName;
  final String productSku;
  final String serial;
  final String customerName;
  final String customerPhone;
  final String customerAddress;
  final int warrantyMonths;
  final DateTime activatedAt;

  DateTime get startsAt => activatedAt;

  DateTime get expiresAt => DateTime(
    activatedAt.year,
    activatedAt.month + warrantyMonths,
    activatedAt.day,
    activatedAt.hour,
    activatedAt.minute,
    activatedAt.second,
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
  });

  final int addedCount;
  final int duplicateCount;
  final int invalidCount;
  final int overLimitCount;
}

class WarrantyController extends ChangeNotifier {
  WarrantyController({
    List<WarrantyActivationRecord>? seedActivations,
    List<ImportedSerialRecord>? seedImportedSerials,
    Iterable<String>? seedDefectiveSerials,
  }) : _activations = List<WarrantyActivationRecord>.from(
         seedActivations ?? _defaultSeedActivations,
       ),
       _importedSerials = List<ImportedSerialRecord>.from(
         seedImportedSerials ?? _defaultSeedImportedSerials,
       ),
       _defectiveSerials =
           seedDefectiveSerials?.map(_normalizeSerial).toSet() ?? <String>{} {
    _defectiveSerials.removeWhere((serial) {
      return _findImportedSerialIndex(serial) < 0;
    });
    _defectiveSerials.removeWhere((serial) {
      return _activatedSerialSet().contains(serial);
    });
    _ensureImportedSerialsForActivations(_activations);
  }

  final List<WarrantyActivationRecord> _activations;
  final List<ImportedSerialRecord> _importedSerials;
  final Set<String> _defectiveSerials;

  bool isDefectiveSerial(String serial) {
    return _defectiveSerials.contains(_normalizeSerial(serial));
  }

  Set<String> defectiveSerialSetForProduct(String productId) {
    final serials = <String>{};
    for (final record in _importedSerials) {
      if (record.productId != productId) {
        continue;
      }
      final normalized = _normalizeSerial(record.serial);
      if (_defectiveSerials.contains(normalized)) {
        serials.add(normalized);
      }
    }
    return serials;
  }

  void markSerialDefective({required String serial, required bool defective}) {
    final normalized = _normalizeSerial(serial);
    if (_findImportedSerialIndex(normalized) < 0) {
      return;
    }
    if (_activatedSerialSet().contains(normalized)) {
      return;
    }
    final changed = defective
        ? _defectiveSerials.add(normalized)
        : _defectiveSerials.remove(normalized);
    if (changed) {
      notifyListeners();
    }
  }

  List<ImportedSerialRecord> importedSerialsForProduct(String productId) {
    final list = _importedSerials
        .where((record) => record.productId == productId)
        .toList(growable: false);
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  List<WarrantyActivationRecord> get activations {
    final list = List<WarrantyActivationRecord>.from(_activations);
    list.sort((a, b) => b.activatedAt.compareTo(a.activatedAt));
    return list;
  }

  List<WarrantyActivationRecord> recentActivations({int limit = 20}) {
    final list = activations;
    if (list.length <= limit) {
      return list;
    }
    return list.take(limit).toList(growable: false);
  }

  List<WarrantyActivationRecord> activationsForOrder(String orderId) {
    final list = _activations
        .where((activation) => activation.orderId == orderId)
        .toList(growable: false);
    list.sort((a, b) => b.activatedAt.compareTo(a.activatedAt));
    return list;
  }

  List<WarrantyActivationRecord> activationsForItem(
    String orderId,
    String productId,
  ) {
    final list = _activations
        .where(
          (activation) =>
              activation.orderId == orderId &&
              activation.productId == productId,
        )
        .toList(growable: false);
    list.sort((a, b) => a.activatedAt.compareTo(b.activatedAt));
    return list;
  }

  List<ImportedSerialRecord> get importedSerials {
    final list = List<ImportedSerialRecord>.from(_importedSerials);
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  List<ImportedSerialRecord> recentImportedSerials({int limit = 50}) {
    final list = importedSerials;
    if (list.length <= limit) {
      return list;
    }
    return list.take(limit).toList(growable: false);
  }

  int get importedSerialCount => _importedSerials.length;

  int get activatedImportedSerialCount {
    final activated = _activatedSerialSet();
    return _importedSerials
        .where((record) => activated.contains(_normalizeSerial(record.serial)))
        .length;
  }

  int get defectiveImportedSerialCount => _defectiveSerials.length;

  int get availableImportedSerialCount {
    final activated = _activatedSerialSet();
    return _importedSerials.where((record) {
      final normalized = _normalizeSerial(record.serial);
      return !activated.contains(normalized) &&
          !_defectiveSerials.contains(normalized);
    }).length;
  }

  List<ImportedSerialRecord> importedSerialsForOrder(String orderId) {
    final list = _importedSerials
        .where((record) => record.orderId == orderId)
        .toList(growable: false);
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  List<ImportedSerialRecord> importedSerialsForOrderItem(
    String orderId,
    String productId,
  ) {
    final list = _importedSerials
        .where(
          (record) =>
              record.orderId == orderId && record.productId == productId,
        )
        .toList(growable: false);
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  int importedSerialCountForOrderItem(String orderId, String productId) {
    return _importedSerials.where((record) {
      return record.orderId == orderId && record.productId == productId;
    }).length;
  }

  List<ImportedSerialRecord> availableImportedSerialsForOrderItem(
    String orderId,
    String productId,
  ) {
    final activated = _activatedSerialSet();
    final list = _importedSerials.where((record) {
      if (record.orderId != orderId || record.productId != productId) {
        return false;
      }
      final normalized = _normalizeSerial(record.serial);
      return !activated.contains(normalized) &&
          !_defectiveSerials.contains(normalized);
    }).toList();
    list.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    return list;
  }

  int availableImportedSerialCountForOrderItem(
    String orderId,
    String productId,
  ) {
    return availableImportedSerialsForOrderItem(orderId, productId).length;
  }

  ImportedSerialRecord? findImportedSerial(String serial) {
    final normalized = _normalizeSerial(serial);
    for (final record in _importedSerials) {
      if (_normalizeSerial(record.serial) == normalized) {
        return record;
      }
    }
    return null;
  }

  bool serialExists(String serial) {
    final normalized = _normalizeSerial(serial);
    return _activations.any(
      (activation) => _normalizeSerial(activation.serial) == normalized,
    );
  }

  String? validateSerialForActivation({
    required String serial,
    required String productId,
    required String productName,
    required String orderId,
  }) {
    final normalized = _normalizeSerial(serial);
    if (normalized.isEmpty) {
      return 'Serial khong hop le.';
    }

    final imported = findImportedSerial(normalized);
    if (imported == null) {
      return 'Serial $normalized chua duoc nhap kho.';
    }
    if (imported.productId != productId) {
      return 'Serial $normalized khong thuoc san pham $productName.';
    }

    if (imported.orderId != orderId) {
      return 'Serial $normalized thuoc don ${imported.orderId}, khong thuoc don $orderId.';
    }

    if (_defectiveSerials.contains(normalized)) {
      return 'Serial $normalized dang o trang thai loi, khong the kich hoat.';
    }

    if (serialExists(normalized)) {
      return 'Serial $normalized da duoc kich hoat truoc do.';
    }

    return null;
  }

  WarrantySerialImportResult importSerials({
    required String orderId,
    required String productId,
    required String productName,
    required String productSku,
    required Iterable<String> serials,
    int? maxToAdd,
    String warehouseId = 'main',
    String warehouseName = 'Kho',
  }) {
    final seenInBatch = <String>{};
    var added = 0;
    var duplicates = 0;
    var invalid = 0;
    var overLimit = 0;
    final now = DateTime.now();

    for (final raw in serials) {
      final normalized = _normalizeSerial(raw);
      if (normalized.isEmpty) {
        invalid++;
        continue;
      }
      if (seenInBatch.contains(normalized)) {
        duplicates++;
        continue;
      }
      seenInBatch.add(normalized);

      if (_findImportedSerialIndex(normalized) >= 0) {
        duplicates++;
        continue;
      }

      if (maxToAdd != null && added >= maxToAdd) {
        overLimit++;
        continue;
      }

      _importedSerials.add(
        ImportedSerialRecord(
          serial: normalized,
          orderId: orderId,
          productId: productId,
          productName: productName,
          productSku: productSku,
          importedAt: now,
          warehouseId: warehouseId,
          warehouseName: warehouseName,
        ),
      );
      added++;
    }

    if (added > 0) {
      notifyListeners();
    }
    return WarrantySerialImportResult(
      addedCount: added,
      duplicateCount: duplicates,
      invalidCount: invalid,
      overLimitCount: overLimit,
    );
  }

  void addActivations(List<WarrantyActivationRecord> newActivations) {
    if (newActivations.isEmpty) {
      return;
    }
    _activations.addAll(newActivations);
    _ensureImportedSerialsForActivations(newActivations);
    for (final activation in newActivations) {
      _defectiveSerials.remove(_normalizeSerial(activation.serial));
    }
    notifyListeners();
  }

  String normalizeSerial(String serial) {
    return _normalizeSerial(serial);
  }

  int _findImportedSerialIndex(String normalizedSerial) {
    for (var i = 0; i < _importedSerials.length; i++) {
      if (_normalizeSerial(_importedSerials[i].serial) == normalizedSerial) {
        return i;
      }
    }
    return -1;
  }

  Set<String> _activatedSerialSet() {
    return _activations
        .map((activation) => _normalizeSerial(activation.serial))
        .toSet();
  }

  void _ensureImportedSerialsForActivations(
    Iterable<WarrantyActivationRecord> source,
  ) {
    for (final activation in source) {
      final normalized = _normalizeSerial(activation.serial);
      final currentIndex = _findImportedSerialIndex(normalized);
      if (currentIndex < 0) {
        _importedSerials.add(
          ImportedSerialRecord(
            serial: normalized,
            orderId: activation.orderId,
            productId: activation.productId,
            productName: activation.productName,
            productSku: activation.productSku,
            importedAt: activation.activatedAt,
          ),
        );
        continue;
      }

      final current = _importedSerials[currentIndex];
      final isSameOrder = current.orderId == activation.orderId;
      final isSameProduct = current.productId == activation.productId;
      if (isSameOrder && isSameProduct) {
        continue;
      }
      _importedSerials[currentIndex] = current.copyWith(
        orderId: activation.orderId,
        productId: activation.productId,
        productName: activation.productName,
        productSku: activation.productSku,
      );
    }
  }
}

class WarrantyScope extends InheritedNotifier<WarrantyController> {
  const WarrantyScope({
    super.key,
    required WarrantyController controller,
    required super.child,
  }) : super(notifier: controller);

  static WarrantyController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<WarrantyScope>();
    assert(scope != null, 'WarrantyScope not found in widget tree.');
    return scope!.notifier!;
  }
}

String _normalizeSerial(String serial) {
  return serial.trim().toUpperCase();
}

final List<WarrantyActivationRecord> _defaultSeedActivations = [
  WarrantyActivationRecord(
    serial: 'SN-9A12-BBX1',
    orderId: 'SCS-239902',
    productId: '11',
    productName: 'SCS RGB Key Lite',
    productSku: 'SCS-RGB-KEY-LITE',
    customerName: 'Nguyen Van A',
    customerPhone: '0909 123 456',
    customerAddress: 'Cau Giay, Ha Noi',
    warrantyMonths: 12,
    activatedAt: DateTime(2026, 2, 10, 9, 30),
  ),
  WarrantyActivationRecord(
    serial: 'SN-7C82-ZK11',
    orderId: 'SCS-239118',
    productId: '13',
    productName: 'SCS Control Mouse X1 Wireless',
    productSku: 'SCS-CONTROL-MOUSE-X1-WL',
    customerName: 'Tran Thi B',
    customerPhone: '0908 000 111',
    customerAddress: 'Thanh Xuan, Ha Noi',
    warrantyMonths: 12,
    activatedAt: DateTime(2026, 2, 5, 14, 20),
  ),
];

final List<ImportedSerialRecord> _defaultSeedImportedSerials = [
  ImportedSerialRecord(
    serial: 'SN-9A12-BBX1',
    orderId: 'SCS-239902',
    productId: '11',
    productName: 'SCS RGB Key Lite',
    productSku: 'SCS-RGB-KEY-LITE',
    importedAt: DateTime(2026, 1, 29, 9, 0),
  ),
  ImportedSerialRecord(
    serial: 'SN-9A12-BBX2',
    orderId: 'SCS-239902',
    productId: '11',
    productName: 'SCS RGB Key Lite',
    productSku: 'SCS-RGB-KEY-LITE',
    importedAt: DateTime(2026, 1, 29, 9, 1),
  ),
  ImportedSerialRecord(
    serial: 'SN-W4K-7781',
    orderId: 'SCS-239902',
    productId: '18',
    productName: 'SCS Webcam Flow 4K',
    productSku: 'SCS-WEBCAM-FLOW-4K',
    importedAt: DateTime(2026, 1, 31, 8, 0),
  ),
  ImportedSerialRecord(
    serial: 'SN-W4K-7782',
    orderId: 'SCS-239902',
    productId: '18',
    productName: 'SCS Webcam Flow 4K',
    productSku: 'SCS-WEBCAM-FLOW-4K',
    importedAt: DateTime(2026, 1, 31, 8, 1),
  ),
  ImportedSerialRecord(
    serial: 'SN-SXW-3101',
    orderId: 'SCS-239118',
    productId: '2',
    productName: 'SCS SX Wireless Pro',
    productSku: 'SCS-SX-WIRELESS-PRO',
    importedAt: DateTime(2026, 1, 28, 14, 0),
  ),
  ImportedSerialRecord(
    serial: 'SN-SXW-3102',
    orderId: 'SCS-239118',
    productId: '2',
    productName: 'SCS SX Wireless Pro',
    productSku: 'SCS-SX-WIRELESS-PRO',
    importedAt: DateTime(2026, 1, 28, 14, 1),
  ),
  ImportedSerialRecord(
    serial: 'SN-SXW-3103',
    orderId: 'SCS-239118',
    productId: '2',
    productName: 'SCS SX Wireless Pro',
    productSku: 'SCS-SX-WIRELESS-PRO',
    importedAt: DateTime(2026, 1, 28, 14, 2),
  ),
  ImportedSerialRecord(
    serial: 'SN-7C82-ZK11',
    orderId: 'SCS-239118',
    productId: '13',
    productName: 'SCS Control Mouse X1 Wireless',
    productSku: 'SCS-CONTROL-MOUSE-X1-WL',
    importedAt: DateTime(2026, 1, 30, 10, 20),
  ),
  ImportedSerialRecord(
    serial: 'SN-X1W-5502',
    orderId: 'SCS-239118',
    productId: '13',
    productName: 'SCS Control Mouse X1 Wireless',
    productSku: 'SCS-CONTROL-MOUSE-X1-WL',
    importedAt: DateTime(2026, 1, 30, 10, 21),
  ),
  ImportedSerialRecord(
    serial: 'SN-X1W-5503',
    orderId: 'SCS-239118',
    productId: '13',
    productName: 'SCS Control Mouse X1 Wireless',
    productSku: 'SCS-CONTROL-MOUSE-X1-WL',
    importedAt: DateTime(2026, 1, 30, 10, 22),
  ),
  ImportedSerialRecord(
    serial: 'SN-X1W-5504',
    orderId: 'SCS-239118',
    productId: '13',
    productName: 'SCS Control Mouse X1 Wireless',
    productSku: 'SCS-CONTROL-MOUSE-X1-WL',
    importedAt: DateTime(2026, 1, 30, 10, 23),
  ),
  ImportedSerialRecord(
    serial: 'SN-X1W-5505',
    orderId: 'SCS-239118',
    productId: '13',
    productName: 'SCS Control Mouse X1 Wireless',
    productSku: 'SCS-CONTROL-MOUSE-X1-WL',
    importedAt: DateTime(2026, 1, 30, 10, 24),
  ),
  ImportedSerialRecord(
    serial: 'SN-PX60-0001',
    orderId: 'SCS-240221',
    productId: '19',
    productName: 'SCS Phantom X60',
    productSku: 'SCS-PHANTOM-X60',
    importedAt: DateTime(2026, 2, 21, 14, 21),
  ),
  ImportedSerialRecord(
    serial: 'SN-PX60-0002',
    orderId: 'SCS-240221',
    productId: '19',
    productName: 'SCS Phantom X60',
    productSku: 'SCS-PHANTOM-X60',
    importedAt: DateTime(2026, 2, 21, 14, 22),
  ),
  ImportedSerialRecord(
    serial: 'SN-C71-0001',
    orderId: 'SCS-240221',
    productId: '20',
    productName: 'SCS Cyclone 7.1',
    productSku: 'SCS-CYCLONE-7-1',
    importedAt: DateTime(2026, 2, 21, 14, 23),
  ),
  ImportedSerialRecord(
    serial: 'SN-C71-0002',
    orderId: 'SCS-240221',
    productId: '20',
    productName: 'SCS Cyclone 7.1',
    productSku: 'SCS-CYCLONE-7-1',
    importedAt: DateTime(2026, 2, 21, 14, 24),
  ),
  ImportedSerialRecord(
    serial: 'SN-C71-0003',
    orderId: 'SCS-240221',
    productId: '20',
    productName: 'SCS Cyclone 7.1',
    productSku: 'SCS-CYCLONE-7-1',
    importedAt: DateTime(2026, 2, 21, 14, 25),
  ),
  ImportedSerialRecord(
    serial: 'SN-EL2-0001',
    orderId: 'SCS-240221',
    productId: '21',
    productName: 'SCS Echo Lite 2',
    productSku: 'SCS-ECHO-LITE-2',
    importedAt: DateTime(2026, 2, 21, 14, 26),
  ),
  ImportedSerialRecord(
    serial: 'SN-EL2-0002',
    orderId: 'SCS-240221',
    productId: '21',
    productName: 'SCS Echo Lite 2',
    productSku: 'SCS-ECHO-LITE-2',
    importedAt: DateTime(2026, 2, 21, 14, 27),
  ),
  ImportedSerialRecord(
    serial: 'SN-EL2-0003',
    orderId: 'SCS-240221',
    productId: '21',
    productName: 'SCS Echo Lite 2',
    productSku: 'SCS-ECHO-LITE-2',
    importedAt: DateTime(2026, 2, 21, 14, 28),
  ),
  ImportedSerialRecord(
    serial: 'SN-EL2-0004',
    orderId: 'SCS-240221',
    productId: '21',
    productName: 'SCS Echo Lite 2',
    productSku: 'SCS-ECHO-LITE-2',
    importedAt: DateTime(2026, 2, 21, 14, 29),
  ),
  ImportedSerialRecord(
    serial: 'SN-VMX-0001',
    orderId: 'SCS-240221',
    productId: '22',
    productName: 'SCS Vanguard Max',
    productSku: 'SCS-VANGUARD-MAX',
    importedAt: DateTime(2026, 2, 21, 14, 30),
  ),
  ImportedSerialRecord(
    serial: 'SN-VMX-0002',
    orderId: 'SCS-240221',
    productId: '22',
    productName: 'SCS Vanguard Max',
    productSku: 'SCS-VANGUARD-MAX',
    importedAt: DateTime(2026, 2, 21, 14, 31),
  ),
  ImportedSerialRecord(
    serial: 'SN-PAN-0001',
    orderId: 'SCS-240221',
    productId: '23',
    productName: 'SCS Pulse ANC',
    productSku: 'SCS-PULSE-ANC',
    importedAt: DateTime(2026, 2, 21, 14, 32),
  ),
  ImportedSerialRecord(
    serial: 'SN-PAN-0002',
    orderId: 'SCS-240221',
    productId: '23',
    productName: 'SCS Pulse ANC',
    productSku: 'SCS-PULSE-ANC',
    importedAt: DateTime(2026, 2, 21, 14, 33),
  ),
  ImportedSerialRecord(
    serial: 'SN-PAN-0003',
    orderId: 'SCS-240221',
    productId: '23',
    productName: 'SCS Pulse ANC',
    productSku: 'SCS-PULSE-ANC',
    importedAt: DateTime(2026, 2, 21, 14, 34),
  ),
  ImportedSerialRecord(
    serial: 'SN-TWX-0001',
    orderId: 'SCS-240221',
    productId: '24',
    productName: 'SCS Titan Wireless X',
    productSku: 'SCS-TITAN-WIRELESS-X',
    importedAt: DateTime(2026, 2, 21, 14, 35),
  ),
  ImportedSerialRecord(
    serial: 'SN-TWX-0002',
    orderId: 'SCS-240221',
    productId: '24',
    productName: 'SCS Titan Wireless X',
    productSku: 'SCS-TITAN-WIRELESS-X',
    importedAt: DateTime(2026, 2, 21, 14, 36),
  ),
  ImportedSerialRecord(
    serial: 'SN-A50-0001',
    orderId: 'SCS-240221',
    productId: '25',
    productName: 'SCS Aero 50',
    productSku: 'SCS-AERO-50',
    importedAt: DateTime(2026, 2, 21, 14, 37),
  ),
  ImportedSerialRecord(
    serial: 'SN-A50-0002',
    orderId: 'SCS-240221',
    productId: '25',
    productName: 'SCS Aero 50',
    productSku: 'SCS-AERO-50',
    importedAt: DateTime(2026, 2, 21, 14, 38),
  ),
  ImportedSerialRecord(
    serial: 'SN-A50-0003',
    orderId: 'SCS-240221',
    productId: '25',
    productName: 'SCS Aero 50',
    productSku: 'SCS-AERO-50',
    importedAt: DateTime(2026, 2, 21, 14, 39),
  ),
  ImportedSerialRecord(
    serial: 'SN-A50-0004',
    orderId: 'SCS-240221',
    productId: '25',
    productName: 'SCS Aero 50',
    productSku: 'SCS-AERO-50',
    importedAt: DateTime(2026, 2, 21, 14, 40),
  ),
  ImportedSerialRecord(
    serial: 'SN-A50-0005',
    orderId: 'SCS-240221',
    productId: '25',
    productName: 'SCS Aero 50',
    productSku: 'SCS-AERO-50',
    importedAt: DateTime(2026, 2, 21, 14, 41),
  ),
  ImportedSerialRecord(
    serial: 'SN-QST-0001',
    orderId: 'SCS-240221',
    productId: '26',
    productName: 'SCS Quantum Studio',
    productSku: 'SCS-QUANTUM-STUDIO',
    importedAt: DateTime(2026, 2, 21, 14, 42),
  ),
  ImportedSerialRecord(
    serial: 'SN-QST-0002',
    orderId: 'SCS-240221',
    productId: '26',
    productName: 'SCS Quantum Studio',
    productSku: 'SCS-QUANTUM-STUDIO',
    importedAt: DateTime(2026, 2, 21, 14, 43),
  ),
  ImportedSerialRecord(
    serial: 'SN-OCP-0001',
    orderId: 'SCS-240221',
    productId: '27',
    productName: 'SCS Orbit Chat Pro',
    productSku: 'SCS-ORBIT-CHAT-PRO',
    importedAt: DateTime(2026, 2, 21, 14, 44),
  ),
  ImportedSerialRecord(
    serial: 'SN-OCP-0002',
    orderId: 'SCS-240221',
    productId: '27',
    productName: 'SCS Orbit Chat Pro',
    productSku: 'SCS-ORBIT-CHAT-PRO',
    importedAt: DateTime(2026, 2, 21, 14, 45),
  ),
  ImportedSerialRecord(
    serial: 'SN-OCP-0003',
    orderId: 'SCS-240221',
    productId: '27',
    productName: 'SCS Orbit Chat Pro',
    productSku: 'SCS-ORBIT-CHAT-PRO',
    importedAt: DateTime(2026, 2, 21, 14, 46),
  ),
  ImportedSerialRecord(
    serial: 'SN-OCP-0004',
    orderId: 'SCS-240221',
    productId: '27',
    productName: 'SCS Orbit Chat Pro',
    productSku: 'SCS-ORBIT-CHAT-PRO',
    importedAt: DateTime(2026, 2, 21, 14, 47),
  ),
];
