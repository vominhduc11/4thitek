import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'utils.dart';

enum SupportMessageCode {
  unauthenticated,
  invalidTicketPayload,
  invalidTicketPagePayload,
  syncFailed,
}

const String _supportMessageTokenPrefix = 'support.message.';

String supportServiceMessageToken(SupportMessageCode code) =>
    '$_supportMessageTokenPrefix${code.name}';

String resolveSupportServiceMessage(
  String? message, {
  required bool isEnglish,
}) {
  final normalized = message?.trim();
  if (normalized == null || normalized.isEmpty) {
    return isEnglish
        ? 'Unable to sync support request.'
        : 'Không thể đồng bộ yêu cầu hỗ trợ.';
  }

  switch (normalized) {
    case 'support.message.unauthenticated':
      return isEnglish
          ? 'You need to sign in before contacting support.'
          : 'Bạn cần đăng nhập trước khi liên hệ hỗ trợ.';
    case 'support.message.invalidTicketPayload':
      return isEnglish
          ? 'Support request data is invalid.'
          : 'Dữ liệu yêu cầu hỗ trợ không hợp lệ.';
    case 'support.message.invalidTicketPagePayload':
      return isEnglish
          ? 'Support request history data is invalid.'
          : 'Dữ liệu lịch sử yêu cầu hỗ trợ không hợp lệ.';
    case 'support.message.syncFailed':
      return isEnglish
          ? 'Unable to sync support request.'
          : 'Không thể đồng bộ yêu cầu hỗ trợ.';
    default:
      return normalized;
  }
}

class DealerSupportTicketRecord {
  const DealerSupportTicketRecord({
    required this.id,
    required this.ticketCode,
    required this.category,
    required this.priority,
    required this.status,
    required this.subject,
    required this.message,
    this.contextData,
    this.assigneeId,
    this.assigneeName,
    this.messages = const <SupportTicketMessageRecord>[],
    required this.createdAt,
    required this.updatedAt,
    this.resolvedAt,
    this.closedAt,
  });

  final int id;
  final String ticketCode;
  final String category;
  final String priority;
  final String status;
  final String subject;
  final String message;
  final SupportTicketContextRecord? contextData;
  final int? assigneeId;
  final String? assigneeName;
  final List<SupportTicketMessageRecord> messages;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? resolvedAt;
  final DateTime? closedAt;
}

class SupportTicketMessageRecord {
  const SupportTicketMessageRecord({
    required this.id,
    required this.authorRole,
    required this.authorName,
    required this.internalNote,
    required this.message,
    this.attachments = const <SupportTicketAttachmentRecord>[],
    required this.createdAt,
  });

  final int id;
  final String authorRole;
  final String? authorName;
  final bool internalNote;
  final String message;
  final List<SupportTicketAttachmentRecord> attachments;
  final DateTime createdAt;
}

class SupportTicketContextRecord {
  const SupportTicketContextRecord({
    this.orderCode,
    this.transactionCode,
    this.paidAmount,
    this.paymentReference,
    this.serial,
    this.returnReason,
  });

  final String? orderCode;
  final String? transactionCode;
  final num? paidAmount;
  final String? paymentReference;
  final String? serial;
  final String? returnReason;

  bool get isEmpty =>
      _isBlank(orderCode) &&
      _isBlank(transactionCode) &&
      paidAmount == null &&
      _isBlank(paymentReference) &&
      _isBlank(serial) &&
      _isBlank(returnReason);

  Map<String, dynamic>? toJson() {
    final payload = <String, dynamic>{};
    if (!_isBlank(orderCode)) {
      payload['orderCode'] = orderCode!.trim();
    }
    if (!_isBlank(transactionCode)) {
      payload['transactionCode'] = transactionCode!.trim();
    }
    if (paidAmount != null) {
      payload['paidAmount'] = paidAmount;
    }
    if (!_isBlank(paymentReference)) {
      payload['paymentReference'] = paymentReference!.trim();
    }
    if (!_isBlank(serial)) {
      payload['serial'] = serial!.trim();
    }
    if (!_isBlank(returnReason)) {
      payload['returnReason'] = returnReason!.trim();
    }
    return payload.isEmpty ? null : payload;
  }
}

class SupportTicketAttachmentRecord {
  const SupportTicketAttachmentRecord({required this.url, this.fileName});

  final String url;
  final String? fileName;

  Map<String, dynamic> toJson() => <String, dynamic>{
    'url': url.trim(),
    if (fileName != null && fileName!.trim().isNotEmpty)
      'fileName': fileName!.trim(),
  };
}

class DealerSupportTicketPage {
  const DealerSupportTicketPage({
    required this.items,
    required this.page,
    required this.size,
    required this.totalPages,
    required this.totalElements,
  });

  final List<DealerSupportTicketRecord> items;
  final int page;
  final int size;
  final int totalPages;
  final int totalElements;
}

class SupportService {
  SupportService({AuthStorage? authStorage, http.Client? client})
    : _authStorage = authStorage ?? AuthStorage() {
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: client ?? http.Client(),
    );
  }

  final AuthStorage _authStorage;
  late final http.Client _client;

  Future<DealerSupportTicketRecord?> fetchLatestTicket() async {
    final token = await _readAccessToken();
    if (token == null) {
      return null;
    }

    final response = await _client.get(
      DealerApiConfig.resolveApiUri('/dealer/support-tickets/latest'),
      headers: await _authorizedHeaders(),
    );
    final payload = _decodeBody(response.bodyBytes);
    if (response.statusCode == HttpStatus.notFound) {
      debugPrint(
        'SupportService: fetchLatestTicket returned 404 (no tickets found)',
      );
      return null;
    }
    if (response.statusCode >= 400) {
      throw SupportException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data == null) {
      return null;
    }
    if (data is! Map<String, dynamic>) {
      throw SupportException(
        supportServiceMessageToken(SupportMessageCode.invalidTicketPayload),
      );
    }
    return _mapTicket(data);
  }

  Future<DealerSupportTicketRecord> submitTicket({
    required String category,
    required String priority,
    required String subject,
    required String message,
    SupportTicketContextRecord? contextData,
    List<SupportTicketAttachmentRecord> attachments =
        const <SupportTicketAttachmentRecord>[],
  }) async {
    final body = <String, dynamic>{
      'category': category,
      'priority': priority,
      'subject': subject.trim(),
      'message': message.trim(),
    };
    final encodedContext = contextData?.toJson();
    if (encodedContext != null) {
      body['contextData'] = encodedContext;
    }
    final encodedAttachments = attachments
        .where((attachment) => attachment.url.trim().isNotEmpty)
        .map((attachment) => attachment.toJson())
        .toList(growable: false);
    if (encodedAttachments.isNotEmpty) {
      body['attachments'] = encodedAttachments;
    }
    final response = await _client.post(
      DealerApiConfig.resolveApiUri('/dealer/support-tickets'),
      headers: await _authorizedJsonHeaders(),
      body: jsonEncode(body),
    );
    final payload = _decodeBody(response.bodyBytes);
    if (response.statusCode >= 400) {
      throw SupportException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw SupportException(
        supportServiceMessageToken(SupportMessageCode.invalidTicketPayload),
      );
    }
    return _mapTicket(data);
  }

  Future<DealerSupportTicketPage> fetchTicketsPage({
    int page = 0,
    int size = 10,
  }) async {
    final response = await _client.get(
      DealerApiConfig.resolveApiUri('/dealer/support-tickets/page').replace(
        queryParameters: <String, String>{'page': '$page', 'size': '$size'},
      ),
      headers: await _authorizedHeaders(),
    );
    final payload = _decodeBody(response.bodyBytes);
    if (response.statusCode >= 400) {
      throw SupportException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw SupportException(
        supportServiceMessageToken(SupportMessageCode.invalidTicketPagePayload),
      );
    }
    final items = (data['items'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(_mapTicket)
        .toList();
    return DealerSupportTicketPage(
      items: items,
      page: _parseInt(data['page']),
      size: _parseInt(data['size']),
      totalPages: _parseInt(data['totalPages']),
      totalElements: _parseInt(data['totalElements']),
    );
  }

  Future<DealerSupportTicketRecord> submitTicketMessage({
    required int ticketId,
    required String message,
    List<SupportTicketAttachmentRecord> attachments =
        const <SupportTicketAttachmentRecord>[],
  }) async {
    final body = <String, dynamic>{'message': message.trim()};
    final encodedAttachments = attachments
        .where((attachment) => attachment.url.trim().isNotEmpty)
        .map((attachment) => attachment.toJson())
        .toList(growable: false);
    if (encodedAttachments.isNotEmpty) {
      body['attachments'] = encodedAttachments;
    }
    final response = await _client.post(
      DealerApiConfig.resolveApiUri(
        '/dealer/support-tickets/$ticketId/messages',
      ),
      headers: await _authorizedJsonHeaders(),
      body: jsonEncode(body),
    );
    final payload = _decodeBody(response.bodyBytes);
    if (response.statusCode >= 400) {
      throw SupportException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw SupportException(
        supportServiceMessageToken(SupportMessageCode.invalidTicketPayload),
      );
    }
    return _mapTicket(data);
  }

  void close() {
    _client.close();
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

  Future<Map<String, String>> _authorizedHeaders() async {
    final token = await _readAccessToken();
    if (token == null) {
      throw SupportException(
        supportServiceMessageToken(SupportMessageCode.unauthenticated),
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

  Map<String, dynamic> _decodeBody(List<int> bodyBytes) {
    if (bodyBytes.isEmpty) {
      return const <String, dynamic>{};
    }
    final decoded = jsonDecode(utf8.decode(bodyBytes));
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
    return supportServiceMessageToken(SupportMessageCode.syncFailed);
  }

  DealerSupportTicketRecord _mapTicket(Map<String, dynamic> json) {
    return DealerSupportTicketRecord(
      id: _parseInt(json['id']),
      ticketCode: json['ticketCode']?.toString() ?? '',
      category: _normalizePossibleMojibake(
        json['category']?.toString() ?? 'OTHER',
      ),
      priority: _normalizePossibleMojibake(
        json['priority']?.toString() ?? 'NORMAL',
      ),
      status: _normalizePossibleMojibake(json['status']?.toString() ?? 'OPEN'),
      subject: _normalizePossibleMojibake(json['subject']?.toString() ?? ''),
      message: _normalizePossibleMojibake(json['message']?.toString() ?? ''),
      contextData: _mapContextData(json['contextData']),
      assigneeId: _parseOptionalInt(json['assigneeId']),
      assigneeName: _parseOptionalString(json['assigneeName']),
      messages: (json['messages'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(
            (message) => SupportTicketMessageRecord(
              id: _parseInt(message['id']),
              authorRole: _normalizePossibleMojibake(
                message['authorRole']?.toString() ?? 'system',
              ),
              authorName: _parseOptionalString(message['authorName']),
              internalNote: message['internalNote'] == true,
              message: _normalizePossibleMojibake(
                message['message']?.toString() ?? '',
              ),
              attachments: _mapAttachments(message['attachments']),
              createdAt:
                  parseApiDateTime(message['createdAt']) ?? DateTime.now(),
            ),
          )
          .toList(growable: false),
      createdAt: parseApiDateTime(json['createdAt']) ?? DateTime.now(),
      updatedAt: parseApiDateTime(json['updatedAt']) ?? DateTime.now(),
      resolvedAt: parseApiDateTime(json['resolvedAt']),
      closedAt: parseApiDateTime(json['closedAt']),
    );
  }

  String? _parseOptionalString(Object? value) {
    final normalized = value?.toString().trim();
    if (normalized == null || normalized.isEmpty) {
      return null;
    }
    return _normalizePossibleMojibake(normalized);
  }

  int _parseInt(Object? value) {
    if (value is int) {
      return value;
    }
    if (value is double) {
      return value.round();
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
}

SupportTicketContextRecord? _mapContextData(Object? raw) {
  if (raw is! Map<String, dynamic>) {
    return null;
  }
  final context = SupportTicketContextRecord(
    orderCode: _parseOptionalStringStatic(raw['orderCode']),
    transactionCode: _parseOptionalStringStatic(raw['transactionCode']),
    paidAmount: raw['paidAmount'] as num?,
    paymentReference: _parseOptionalStringStatic(raw['paymentReference']),
    serial: _parseOptionalStringStatic(raw['serial']),
    returnReason: _parseOptionalStringStatic(raw['returnReason']),
  );
  return context.isEmpty ? null : context;
}

List<SupportTicketAttachmentRecord> _mapAttachments(Object? raw) {
  final entries = raw is List<dynamic> ? raw : const <dynamic>[];
  return entries
      .whereType<Map<String, dynamic>>()
      .map(
        (attachment) => SupportTicketAttachmentRecord(
          url: attachment['url']?.toString().trim() ?? '',
          fileName: _parseOptionalStringStatic(attachment['fileName']),
        ),
      )
      .where((attachment) => attachment.url.isNotEmpty)
      .toList(growable: false);
}

String? _parseOptionalStringStatic(Object? value) {
  final normalized = value?.toString().trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  return _normalizePossibleMojibake(normalized);
}

bool _isBlank(String? value) => value == null || value.trim().isEmpty;

String _normalizePossibleMojibake(String value) {
  if (value.isEmpty || !_looksLikeMojibake(value)) {
    return value;
  }
  try {
    final repaired = utf8.decode(latin1.encode(value));
    return _looksLikeMojibake(repaired) ? value : repaired;
  } catch (_) {
    return value;
  }
}

bool _looksLikeMojibake(String value) {
  return value.contains('Ã') ||
      value.contains('Â') ||
      value.contains('Ä') ||
      value.contains('Å') ||
      value.contains('Æ') ||
      value.contains('áº') ||
      value.contains('á»') ||
      value.contains('â€');
}

class SupportException implements Exception {
  const SupportException(this.message);

  final String message;

  @override
  String toString() => message;
}
