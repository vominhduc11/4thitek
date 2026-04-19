import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'utils.dart';

enum ReturnMessageCode { unauthenticated, invalidPayload, syncFailed }

const String _returnMessageTokenPrefix = 'returns.message.';

String returnServiceMessageToken(ReturnMessageCode code) =>
    '$_returnMessageTokenPrefix${code.name}';

String resolveReturnServiceMessage(String? message, {required bool isEnglish}) {
  final normalized = message?.trim();
  if (normalized == null || normalized.isEmpty) {
    return isEnglish
        ? 'Unable to sync return requests right now.'
        : 'Khong the dong bo yeu cau doi tra luc nay.';
  }
  switch (normalized) {
    case 'returns.message.unauthenticated':
      return isEnglish
          ? 'You need to sign in before managing return requests.'
          : 'Ban can dang nhap truoc khi quan ly yeu cau doi tra.';
    case 'returns.message.invalidPayload':
      return isEnglish
          ? 'Return request payload is invalid.'
          : 'Du lieu yeu cau doi tra khong hop le.';
    case 'returns.message.syncFailed':
      return isEnglish
          ? 'Unable to sync return requests right now.'
          : 'Khong the dong bo yeu cau doi tra luc nay.';
    default:
      return normalized;
  }
}

enum DealerReturnRequestStatus {
  submitted('SUBMITTED'),
  underReview('UNDER_REVIEW'),
  approved('APPROVED'),
  rejected('REJECTED'),
  awaitingReceipt('AWAITING_RECEIPT'),
  received('RECEIVED'),
  inspecting('INSPECTING'),
  partiallyResolved('PARTIALLY_RESOLVED'),
  completed('COMPLETED'),
  cancelled('CANCELLED'),
  unknown('UNKNOWN');

  const DealerReturnRequestStatus(this.apiValue);

  final String apiValue;

  static DealerReturnRequestStatus fromApi(String? raw) {
    final normalized = raw?.trim().toUpperCase();
    for (final value in DealerReturnRequestStatus.values) {
      if (value.apiValue == normalized) {
        return value;
      }
    }
    return DealerReturnRequestStatus.unknown;
  }
}

enum DealerReturnRequestType {
  commercialReturn('COMMERCIAL_RETURN'),
  defectiveReturn('DEFECTIVE_RETURN'),
  warrantyRma('WARRANTY_RMA'),
  unknown('UNKNOWN');

  const DealerReturnRequestType(this.apiValue);

  final String apiValue;

  static DealerReturnRequestType fromApi(String? raw) {
    final normalized = raw?.trim().toUpperCase();
    for (final value in DealerReturnRequestType.values) {
      if (value.apiValue == normalized) {
        return value;
      }
    }
    return DealerReturnRequestType.unknown;
  }
}

enum DealerReturnRequestResolution {
  replace('REPLACE'),
  creditNote('CREDIT_NOTE'),
  refund('REFUND'),
  inspectOnly('INSPECT_ONLY'),
  unknown('UNKNOWN');

  const DealerReturnRequestResolution(this.apiValue);

  final String apiValue;

  static DealerReturnRequestResolution fromApi(String? raw) {
    final normalized = raw?.trim().toUpperCase();
    for (final value in DealerReturnRequestResolution.values) {
      if (value.apiValue == normalized) {
        return value;
      }
    }
    return DealerReturnRequestResolution.unknown;
  }
}

enum DealerReturnRequestItemStatus {
  requested('REQUESTED'),
  approved('APPROVED'),
  rejected('REJECTED'),
  received('RECEIVED'),
  inspecting('INSPECTING'),
  qcPassed('QC_PASSED'),
  qcFailed('QC_FAILED'),
  restocked('RESTOCKED'),
  scrapped('SCRAPPED'),
  replaced('REPLACED'),
  credited('CREDITED'),
  unknown('UNKNOWN');

  const DealerReturnRequestItemStatus(this.apiValue);

  final String apiValue;

  static DealerReturnRequestItemStatus fromApi(String? raw) {
    final normalized = raw?.trim().toUpperCase();
    for (final value in DealerReturnRequestItemStatus.values) {
      if (value.apiValue == normalized) {
        return value;
      }
    }
    return DealerReturnRequestItemStatus.unknown;
  }
}

enum DealerReturnRequestItemCondition {
  sealed('SEALED'),
  openBox('OPEN_BOX'),
  used('USED'),
  defective('DEFECTIVE'),
  unknown('UNKNOWN');

  const DealerReturnRequestItemCondition(this.apiValue);

  final String apiValue;

  static DealerReturnRequestItemCondition fromApi(String? raw) {
    final normalized = raw?.trim().toUpperCase();
    for (final value in DealerReturnRequestItemCondition.values) {
      if (value.apiValue == normalized) {
        return value;
      }
    }
    return DealerReturnRequestItemCondition.unknown;
  }
}

enum DealerReturnRequestItemFinalResolution {
  restock('RESTOCK'),
  replace('REPLACE'),
  creditNote('CREDIT_NOTE'),
  refund('REFUND'),
  scrap('SCRAP'),
  unknown('UNKNOWN');

  const DealerReturnRequestItemFinalResolution(this.apiValue);

  final String apiValue;

  static DealerReturnRequestItemFinalResolution fromApi(String? raw) {
    final normalized = raw?.trim().toUpperCase();
    for (final value in DealerReturnRequestItemFinalResolution.values) {
      if (value.apiValue == normalized) {
        return value;
      }
    }
    return DealerReturnRequestItemFinalResolution.unknown;
  }
}

enum DealerReturnAttachmentCategory {
  proof('PROOF'),
  defectPhoto('DEFECT_PHOTO'),
  receipt('RECEIPT'),
  packing('PACKING'),
  other('OTHER'),
  unknown('UNKNOWN');

  const DealerReturnAttachmentCategory(this.apiValue);

  final String apiValue;

  static DealerReturnAttachmentCategory fromApi(String? raw) {
    final normalized = raw?.trim().toUpperCase();
    for (final value in DealerReturnAttachmentCategory.values) {
      if (value.apiValue == normalized) {
        return value;
      }
    }
    return DealerReturnAttachmentCategory.unknown;
  }
}

class DealerReturnRequestPage {
  const DealerReturnRequestPage({
    required this.items,
    required this.page,
    required this.size,
    required this.totalPages,
    required this.totalElements,
  });

  final List<DealerReturnRequestSummaryRecord> items;
  final int page;
  final int size;
  final int totalPages;
  final int totalElements;
}

class DealerReturnRequestSummaryRecord {
  const DealerReturnRequestSummaryRecord({
    required this.id,
    required this.requestCode,
    required this.orderId,
    required this.orderCode,
    required this.type,
    required this.status,
    required this.requestedResolution,
    required this.requestedAt,
    required this.totalItems,
    required this.resolvedItems,
  });

  final int id;
  final String requestCode;
  final int? orderId;
  final String orderCode;
  final DealerReturnRequestType type;
  final DealerReturnRequestStatus status;
  final DealerReturnRequestResolution requestedResolution;
  final DateTime? requestedAt;
  final int totalItems;
  final int resolvedItems;
}

class DealerReturnRequestDetailRecord {
  const DealerReturnRequestDetailRecord({
    required this.id,
    required this.requestCode,
    required this.orderId,
    required this.orderCode,
    required this.type,
    required this.status,
    required this.requestedResolution,
    required this.reasonCode,
    required this.reasonDetail,
    required this.supportTicketId,
    required this.requestedAt,
    required this.reviewedAt,
    required this.receivedAt,
    required this.completedAt,
    required this.items,
    required this.attachments,
    required this.events,
  });

  final int id;
  final String requestCode;
  final int? orderId;
  final String orderCode;
  final DealerReturnRequestType type;
  final DealerReturnRequestStatus status;
  final DealerReturnRequestResolution requestedResolution;
  final String? reasonCode;
  final String? reasonDetail;
  final int? supportTicketId;
  final DateTime? requestedAt;
  final DateTime? reviewedAt;
  final DateTime? receivedAt;
  final DateTime? completedAt;
  final List<DealerReturnRequestItemRecord> items;
  final List<DealerReturnRequestAttachmentRecord> attachments;
  final List<DealerReturnRequestEventRecord> events;
}

class DealerReturnRequestItemRecord {
  const DealerReturnRequestItemRecord({
    required this.id,
    required this.productName,
    required this.productSku,
    required this.productSerialId,
    required this.serialSnapshot,
    required this.itemStatus,
    required this.conditionOnRequest,
    required this.adminDecisionNote,
    required this.inspectionNote,
    required this.finalResolution,
    required this.replacementOrderId,
    required this.refundAmount,
    required this.creditAmount,
    required this.orderAdjustmentId,
  });

  final int id;
  final String productName;
  final String productSku;
  final int? productSerialId;
  final String serialSnapshot;
  final DealerReturnRequestItemStatus itemStatus;
  final DealerReturnRequestItemCondition? conditionOnRequest;
  final String? adminDecisionNote;
  final String? inspectionNote;
  final DealerReturnRequestItemFinalResolution? finalResolution;
  final int? replacementOrderId;
  final num? refundAmount;
  final num? creditAmount;
  final int? orderAdjustmentId;
}

class DealerReturnRequestAttachmentRecord {
  const DealerReturnRequestAttachmentRecord({
    required this.id,
    required this.itemId,
    required this.url,
    required this.fileName,
    required this.category,
  });

  final int id;
  final int? itemId;
  final String url;
  final String? fileName;
  final DealerReturnAttachmentCategory category;
}

class DealerReturnRequestEventRecord {
  const DealerReturnRequestEventRecord({
    required this.id,
    required this.eventType,
    required this.actor,
    required this.actorRole,
    required this.payloadJson,
    required this.createdAt,
  });

  final int id;
  final String eventType;
  final String? actor;
  final String? actorRole;
  final String? payloadJson;
  final DateTime? createdAt;
}

class DealerReturnEligibilityRecord {
  const DealerReturnEligibilityRecord({
    required this.serialId,
    required this.serial,
    required this.orderId,
    required this.orderCode,
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.eligible,
    required this.reasonCode,
    required this.reasonMessage,
    required this.activeRequestId,
    required this.activeRequestCode,
  });

  final int serialId;
  final String serial;
  final int? orderId;
  final String? orderCode;
  final int? productId;
  final String? productName;
  final String? productSku;
  final bool eligible;
  final String reasonCode;
  final String reasonMessage;
  final int? activeRequestId;
  final String? activeRequestCode;
}

class DealerCreateReturnRequestItemPayload {
  const DealerCreateReturnRequestItemPayload({
    required this.productSerialId,
    required this.conditionOnRequest,
  });

  final int productSerialId;
  final DealerReturnRequestItemCondition conditionOnRequest;

  Map<String, dynamic> toJson() => <String, dynamic>{
    'productSerialId': productSerialId,
    'conditionOnRequest': conditionOnRequest.apiValue,
  };
}

class DealerCreateReturnRequestAttachmentPayload {
  const DealerCreateReturnRequestAttachmentPayload({
    this.itemId,
    this.productSerialId,
    required this.url,
    this.fileName,
    required this.category,
  });

  final int? itemId;
  final int? productSerialId;
  final String url;
  final String? fileName;
  final DealerReturnAttachmentCategory category;

  Map<String, dynamic> toJson() => <String, dynamic>{
    if (itemId != null) 'itemId': itemId,
    if (productSerialId != null) 'productSerialId': productSerialId,
    'url': url.trim(),
    if (fileName != null && fileName!.trim().isNotEmpty)
      'fileName': fileName!.trim(),
    'category': category.apiValue,
  };
}

class ReturnRequestService {
  static const Duration _requestTimeout = Duration(seconds: 15);

  ReturnRequestService({AuthStorage? authStorage, http.Client? client})
    : _authStorage = authStorage ?? AuthStorage() {
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: client ?? http.Client(),
    );
  }

  final AuthStorage _authStorage;
  late final http.Client _client;

  Future<DealerReturnRequestPage> fetchPage({
    int page = 0,
    int size = 20,
    DealerReturnRequestStatus? status,
    DealerReturnRequestType? type,
    String? orderCode,
    String? serial,
  }) async {
    final response = await _withRequestTimeout(
      _client.get(
      DealerApiConfig.resolveApiUri('/dealer/returns/page').replace(
        queryParameters: <String, String>{
          'page': '$page',
          'size': '$size',
          if (status != null && status != DealerReturnRequestStatus.unknown)
            'status': status.apiValue,
          if (type != null && type != DealerReturnRequestType.unknown)
            'type': type.apiValue,
          if (orderCode != null && orderCode.trim().isNotEmpty)
            'orderCode': orderCode.trim(),
          if (serial != null && serial.trim().isNotEmpty)
            'serial': serial.trim(),
        },
      ),
      headers: await _authorizedHeaders(),
      ),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ReturnRequestException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw ReturnRequestException(
        returnServiceMessageToken(ReturnMessageCode.invalidPayload),
      );
    }
    final items = (data['items'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(_mapSummary)
        .toList(growable: false);
    return DealerReturnRequestPage(
      items: items,
      page: _parseInt(data['page']),
      size: _parseInt(data['size']),
      totalPages: _parseInt(data['totalPages']),
      totalElements: _parseInt(data['totalElements']),
    );
  }

  Future<DealerReturnRequestDetailRecord> fetchDetail(int requestId) async {
    final response = await _withRequestTimeout(
      _client.get(
      DealerApiConfig.resolveApiUri('/dealer/returns/$requestId'),
      headers: await _authorizedHeaders(),
      ),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ReturnRequestException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw ReturnRequestException(
        returnServiceMessageToken(ReturnMessageCode.invalidPayload),
      );
    }
    return _mapDetail(data);
  }

  Future<DealerReturnRequestDetailRecord> createRequest({
    required int orderId,
    required DealerReturnRequestType type,
    required DealerReturnRequestResolution requestedResolution,
    String? reasonCode,
    String? reasonDetail,
    required List<DealerCreateReturnRequestItemPayload> items,
    List<DealerCreateReturnRequestAttachmentPayload> attachments =
        const <DealerCreateReturnRequestAttachmentPayload>[],
  }) async {
    final response = await _withRequestTimeout(
      _client.post(
      DealerApiConfig.resolveApiUri('/dealer/returns'),
      headers: await _authorizedJsonHeaders(),
      body: jsonEncode(<String, dynamic>{
        'orderId': orderId,
        'type': type.apiValue,
        'requestedResolution': requestedResolution.apiValue,
        if (reasonCode != null && reasonCode.trim().isNotEmpty)
          'reasonCode': reasonCode.trim(),
        if (reasonDetail != null && reasonDetail.trim().isNotEmpty)
          'reasonDetail': reasonDetail.trim(),
        'items': items.map((item) => item.toJson()).toList(growable: false),
        if (attachments.isNotEmpty)
          'attachments': attachments
              .where((item) => item.url.trim().isNotEmpty)
              .map((item) => item.toJson())
              .toList(growable: false),
      }),
      ),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ReturnRequestException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw ReturnRequestException(
        returnServiceMessageToken(ReturnMessageCode.invalidPayload),
      );
    }
    return _mapDetail(data);
  }

  Future<DealerReturnRequestDetailRecord> cancelRequest(int requestId) async {
    final response = await _withRequestTimeout(
      _client.post(
      DealerApiConfig.resolveApiUri('/dealer/returns/$requestId/cancel'),
      headers: await _authorizedJsonHeaders(),
      body: jsonEncode(const <String, dynamic>{}),
      ),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ReturnRequestException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw ReturnRequestException(
        returnServiceMessageToken(ReturnMessageCode.invalidPayload),
      );
    }
    return _mapDetail(data);
  }

  Future<List<DealerReturnEligibilityRecord>> fetchOrderEligibleSerials(
    int orderId,
  ) async {
    final response = await _withRequestTimeout(
      _client.get(
      DealerApiConfig.resolveApiUri(
        '/dealer/orders/$orderId/return-eligible-serials',
      ),
      headers: await _authorizedHeaders(),
      ),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ReturnRequestException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! List<dynamic>) {
      throw ReturnRequestException(
        returnServiceMessageToken(ReturnMessageCode.invalidPayload),
      );
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(_mapEligibility)
        .toList(growable: false);
  }

  Future<DealerReturnEligibilityRecord> fetchSerialEligibility(
    int serialId,
  ) async {
    final response = await _withRequestTimeout(
      _client.get(
      DealerApiConfig.resolveApiUri(
        '/dealer/inventory/serials/$serialId/return-eligibility',
      ),
      headers: await _authorizedHeaders(),
      ),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ReturnRequestException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw ReturnRequestException(
        returnServiceMessageToken(ReturnMessageCode.invalidPayload),
      );
    }
    return _mapEligibility(data);
  }

  void close() {
    _client.close();
  }

  Future<T> _withRequestTimeout<T>(Future<T> future) {
    return future.timeout(_requestTimeout);
  }

  DealerReturnRequestSummaryRecord _mapSummary(Map<String, dynamic> json) {
    return DealerReturnRequestSummaryRecord(
      id: _parseInt(json['id']),
      requestCode: (json['requestCode'] ?? '').toString(),
      orderId: _parseOptionalInt(json['orderId']),
      orderCode: (json['orderCode'] ?? '').toString(),
      type: DealerReturnRequestType.fromApi(json['type']?.toString()),
      status: DealerReturnRequestStatus.fromApi(json['status']?.toString()),
      requestedResolution: DealerReturnRequestResolution.fromApi(
        json['requestedResolution']?.toString(),
      ),
      requestedAt: parseApiDateTime(json['requestedAt']),
      totalItems: _parseInt(json['totalItems']),
      resolvedItems: _parseInt(json['resolvedItems']),
    );
  }

  DealerReturnRequestDetailRecord _mapDetail(Map<String, dynamic> json) {
    return DealerReturnRequestDetailRecord(
      id: _parseInt(json['id']),
      requestCode: (json['requestCode'] ?? '').toString(),
      orderId: _parseOptionalInt(json['orderId']),
      orderCode: (json['orderCode'] ?? '').toString(),
      type: DealerReturnRequestType.fromApi(json['type']?.toString()),
      status: DealerReturnRequestStatus.fromApi(json['status']?.toString()),
      requestedResolution: DealerReturnRequestResolution.fromApi(
        json['requestedResolution']?.toString(),
      ),
      reasonCode: _parseOptionalString(json['reasonCode']),
      reasonDetail: _parseOptionalString(json['reasonDetail']),
      supportTicketId: _parseOptionalInt(json['supportTicketId']),
      requestedAt: parseApiDateTime(json['requestedAt']),
      reviewedAt: parseApiDateTime(json['reviewedAt']),
      receivedAt: parseApiDateTime(json['receivedAt']),
      completedAt: parseApiDateTime(json['completedAt']),
      items: (json['items'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(
            (item) => DealerReturnRequestItemRecord(
              id: _parseInt(item['id']),
              productName: (item['productName'] ?? '').toString(),
              productSku: (item['productSku'] ?? '').toString(),
              productSerialId: _parseOptionalInt(item['productSerialId']),
              serialSnapshot: (item['serialSnapshot'] ?? '').toString(),
              itemStatus: DealerReturnRequestItemStatus.fromApi(
                item['itemStatus']?.toString(),
              ),
              conditionOnRequest: item['conditionOnRequest'] == null
                  ? null
                  : DealerReturnRequestItemCondition.fromApi(
                      item['conditionOnRequest']?.toString(),
                    ),
              adminDecisionNote: _parseOptionalString(
                item['adminDecisionNote'],
              ),
              inspectionNote: _parseOptionalString(item['inspectionNote']),
              finalResolution: item['finalResolution'] == null
                  ? null
                  : DealerReturnRequestItemFinalResolution.fromApi(
                      item['finalResolution']?.toString(),
                    ),
              replacementOrderId: _parseOptionalInt(item['replacementOrderId']),
              refundAmount: _parseOptionalNum(item['refundAmount']),
              creditAmount: _parseOptionalNum(item['creditAmount']),
              orderAdjustmentId: _parseOptionalInt(item['orderAdjustmentId']),
            ),
          )
          .toList(growable: false),
      attachments: (json['attachments'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(
            (attachment) => DealerReturnRequestAttachmentRecord(
              id: _parseInt(attachment['id']),
              itemId: _parseOptionalInt(attachment['itemId']),
              url: (attachment['url'] ?? '').toString(),
              fileName: _parseOptionalString(attachment['fileName']),
              category: DealerReturnAttachmentCategory.fromApi(
                attachment['category']?.toString(),
              ),
            ),
          )
          .toList(growable: false),
      events: (json['events'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(
            (event) => DealerReturnRequestEventRecord(
              id: _parseInt(event['id']),
              eventType: (event['eventType'] ?? '').toString(),
              actor: _parseOptionalString(event['actor']),
              actorRole: _parseOptionalString(event['actorRole']),
              payloadJson: _parseOptionalString(event['payloadJson']),
              createdAt: parseApiDateTime(event['createdAt']),
            ),
          )
          .toList(growable: false),
    );
  }

  DealerReturnEligibilityRecord _mapEligibility(Map<String, dynamic> json) {
    return DealerReturnEligibilityRecord(
      serialId: _parseInt(json['serialId']),
      serial: (json['serial'] ?? '').toString(),
      orderId: _parseOptionalInt(json['orderId']),
      orderCode: _parseOptionalString(json['orderCode']),
      productId: _parseOptionalInt(json['productId']),
      productName: _parseOptionalString(json['productName']),
      productSku: _parseOptionalString(json['productSku']),
      eligible: json['eligible'] == true,
      reasonCode: (json['reasonCode'] ?? '').toString(),
      reasonMessage: (json['reasonMessage'] ?? '').toString(),
      activeRequestId: _parseOptionalInt(json['activeRequestId']),
      activeRequestCode: _parseOptionalString(json['activeRequestCode']),
    );
  }

  Future<Map<String, String>> _authorizedHeaders() async {
    final token = await _readAccessToken();
    if (token == null) {
      throw ReturnRequestException(
        returnServiceMessageToken(ReturnMessageCode.unauthenticated),
      );
    }
    return <String, String>{
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, String>> _authorizedJsonHeaders() async {
    final headers = await _authorizedHeaders();
    return <String, String>{...headers, 'Content-Type': 'application/json'};
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
    return returnServiceMessageToken(ReturnMessageCode.syncFailed);
  }

  int _parseInt(Object? value) {
    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  int? _parseOptionalInt(Object? value) {
    if (value == null) {
      return null;
    }
    final parsed = _parseInt(value);
    return parsed == 0 && value.toString().trim() != '0' ? null : parsed;
  }

  num? _parseOptionalNum(Object? value) {
    if (value == null) {
      return null;
    }
    if (value is num) {
      return value;
    }
    return num.tryParse(value.toString());
  }

  String? _parseOptionalString(Object? value) {
    final normalized = value?.toString().trim();
    if (normalized == null || normalized.isEmpty) {
      return null;
    }
    return normalized;
  }
}

class ReturnRequestException implements Exception {
  const ReturnRequestException(this.message);

  final String message;

  @override
  String toString() => message;
}
