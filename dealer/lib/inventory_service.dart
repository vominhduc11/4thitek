import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'models.dart';
import 'utils.dart';
import 'warranty_models.dart';

enum InventoryMessageCode { unauthenticated, invalidSummaryPayload, invalidSerialPayload, syncFailed }

const String _inventoryMessageTokenPrefix = 'inventory.message.';

String inventoryServiceMessageToken(InventoryMessageCode code) =>
    '$_inventoryMessageTokenPrefix${code.name}';

String resolveInventoryServiceMessage(
  String? message, {
  required bool isEnglish,
}) {
  final normalized = message?.trim();
  if (normalized == null || normalized.isEmpty) {
    return isEnglish
        ? 'Unable to sync inventory right now.'
        : 'Không thể đồng bộ tồn kho lúc này.';
  }

  switch (normalized) {
    case 'inventory.message.unauthenticated':
      return isEnglish
          ? 'You need to sign in before viewing inventory.'
          : 'Bạn cần đăng nhập trước khi xem tồn kho.';
    case 'inventory.message.invalidSummaryPayload':
      return isEnglish
          ? 'Inventory summary data is invalid.'
          : 'Dữ liệu tổng quan tồn kho không hợp lệ.';
    case 'inventory.message.invalidSerialPayload':
      return isEnglish
          ? 'Inventory serial data is invalid.'
          : 'Dữ liệu serial tồn kho không hợp lệ.';
    case 'inventory.message.syncFailed':
      return isEnglish
          ? 'Unable to sync inventory right now.'
          : 'Không thể đồng bộ tồn kho lúc này.';
    default:
      return normalized;
  }
}

class DealerInventoryProductRecord {
  const DealerInventoryProductRecord({
    required this.product,
    required this.totalSerials,
    required this.readySerials,
    required this.warrantySerials,
    required this.issueSerials,
    required this.latestImportedAt,
    required this.orderCodes,
  });

  final Product product;
  final int totalSerials;
  final int readySerials;
  final int warrantySerials;
  final int issueSerials;
  final DateTime latestImportedAt;
  final List<String> orderCodes;
}

class DealerInventorySummaryRecord {
  const DealerInventorySummaryRecord({
    required this.totalProducts,
    required this.totalSerials,
    required this.readySerials,
    required this.warrantySerials,
    required this.issueSerials,
    required this.items,
  });

  final int totalProducts;
  final int totalSerials;
  final int readySerials;
  final int warrantySerials;
  final int issueSerials;
  final List<DealerInventoryProductRecord> items;
}

class DealerInventorySerialRecord {
  const DealerInventorySerialRecord({
    required this.id,
    required this.record,
  });

  final int id;
  final ImportedSerialRecord record;
}

class InventoryTimelineEntry {
  const InventoryTimelineEntry({
    required this.type,
    required this.title,
    required this.description,
    this.occurredAt,
  });

  final String type;
  final String title;
  final String description;
  final DateTime? occurredAt;
}

class DealerInventorySerialDetailRecord {
  const DealerInventorySerialDetailRecord({
    required this.serial,
    required this.timeline,
  });

  final DealerInventorySerialRecord serial;
  final List<InventoryTimelineEntry> timeline;
}

class InventoryService {
  InventoryService({AuthStorage? authStorage, http.Client? client})
    : _authStorage = authStorage ?? AuthStorage() {
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: client ?? http.Client(),
    );
  }

  final AuthStorage _authStorage;
  late final http.Client _client;

  Future<DealerInventorySummaryRecord> fetchSummary() async {
    final response = await _client.get(
      DealerApiConfig.resolveApiUri('/dealer/inventory/summary'),
      headers: await _authorizedHeaders(),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw InventoryException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw InventoryException(
        inventoryServiceMessageToken(InventoryMessageCode.invalidSummaryPayload),
      );
    }
    return _mapSummary(data);
  }

  Future<List<DealerInventorySerialRecord>> fetchSerials({
    required String productId,
  }) async {
    final response = await _client.get(
      DealerApiConfig.resolveApiUri(
        '/dealer/inventory/serials',
      ).replace(queryParameters: <String, String>{'productId': productId}),
      headers: await _authorizedHeaders(),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw InventoryException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! List<dynamic>) {
      throw InventoryException(
        inventoryServiceMessageToken(InventoryMessageCode.invalidSerialPayload),
      );
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(_mapSerial)
        .toList(growable: false);
  }

  Future<DealerInventorySerialDetailRecord> fetchSerialDetail(int serialId) async {
    final response = await _client.get(
      DealerApiConfig.resolveApiUri('/dealer/inventory/serials/$serialId'),
      headers: await _authorizedHeaders(),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw InventoryException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw InventoryException(
        inventoryServiceMessageToken(InventoryMessageCode.invalidSerialPayload),
      );
    }
    final serial = data['serial'];
    if (serial is! Map<String, dynamic>) {
      throw InventoryException(
        inventoryServiceMessageToken(InventoryMessageCode.invalidSerialPayload),
      );
    }
    final timeline = (data['timeline'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(
          (entry) => InventoryTimelineEntry(
            type: (entry['type'] ?? '').toString(),
            title: (entry['title'] ?? '').toString(),
            description: (entry['description'] ?? '').toString(),
            occurredAt: parseApiDateTime(entry['occurredAt']),
          ),
        )
        .toList(growable: false);
    return DealerInventorySerialDetailRecord(
      serial: _mapSerial(serial),
      timeline: timeline,
    );
  }

  void close() {
    _client.close();
  }

  Future<Map<String, String>> _authorizedHeaders() async {
    final token = await _readAccessToken();
    if (token == null) {
      throw InventoryException(
        inventoryServiceMessageToken(InventoryMessageCode.unauthenticated),
      );
    }
    return <String, String>{
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<String?> _readAccessToken() async {
    if (!DealerApiConfig.isConfigured) {
      return null;
    }
    final token = await _authStorage.readAccessToken();
    if (token == null || token.trim().isEmpty) {
      return null;
    }
    return token.trim();
  }

  Map<String, dynamic> _decodeBody(String body) {
    if (body.trim().isEmpty) {
      return const <String, dynamic>{};
    }
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    return const <String, dynamic>{};
  }

  String _extractErrorMessage(Map<String, dynamic> payload) {
    final error = payload['error']?.toString().trim();
    if (error != null && error.isNotEmpty) {
      return error;
    }
    return inventoryServiceMessageToken(InventoryMessageCode.syncFailed);
  }

  DealerInventorySummaryRecord _mapSummary(Map<String, dynamic> json) {
    final items = (json['items'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map((item) {
          final product = Product(
            id: _asRequiredString(item['productId']),
            name: (item['productName'] ?? '').toString(),
            sku: (item['productSku'] ?? '').toString(),
            shortDescription: '',
            price: 0,
            stock: _asInt(item['readySerials']),
            warrantyMonths: 0,
            imageUrl: (item['image'] as String?)?.trim().isEmpty ?? true
                ? null
                : (item['image'] as String),
          );
          return DealerInventoryProductRecord(
            product: product,
            totalSerials: _asInt(item['totalSerials']),
            readySerials: _asInt(item['readySerials']),
            warrantySerials: _asInt(item['warrantySerials']),
            issueSerials: _asInt(item['issueSerials']),
            latestImportedAt:
                parseApiDateTime(item['latestImportedAt']) ?? DateTime.now(),
            orderCodes: ((item['orderCodes'] as List<dynamic>?) ?? const [])
                .map((value) => value.toString())
                .where((value) => value.trim().isNotEmpty)
                .toList(growable: false),
          );
        })
        .toList(growable: false);

    return DealerInventorySummaryRecord(
      totalProducts: _asInt(json['totalProducts']),
      totalSerials: _asInt(json['totalSerials']),
      readySerials: _asInt(json['readySerials']),
      warrantySerials: _asInt(json['warrantySerials']),
      issueSerials: _asInt(json['issueSerials']),
      items: items,
    );
  }

  DealerInventorySerialRecord _mapSerial(Map<String, dynamic> json) {
    return DealerInventorySerialRecord(
      id: _asInt(json['id']),
      record: ImportedSerialRecord(
        serial: (json['serial'] ?? '').toString(),
        orderId: (json['orderCode'] ?? json['orderId'] ?? '').toString(),
        productId: _asRequiredString(json['productId']),
        productName: (json['productName'] ?? '').toString(),
        productSku: (json['productSku'] ?? '').toString(),
        importedAt: parseApiDateTime(json['importedAt']) ?? DateTime.now(),
        status: parseImportedSerialStatus(json['status']?.toString()),
        warehouseId: (json['warehouseId'] ?? 'main').toString(),
        warehouseName: (json['warehouseName'] ?? 'Kho').toString(),
      ),
    );
  }

  int _asInt(Object? value) {
    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _asRequiredString(Object? value) {
    final resolved = value?.toString().trim() ?? '';
    if (resolved.isEmpty) {
      throw InventoryException(
        inventoryServiceMessageToken(InventoryMessageCode.invalidSummaryPayload),
      );
    }
    return resolved;
  }
}

class InventoryException implements Exception {
  const InventoryException(this.message);

  final String message;

  @override
  String toString() => message;
}
