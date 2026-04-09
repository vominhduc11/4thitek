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
          ? 'Support ticket data is invalid.'
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
    required this.createdAt,
  });

  final int id;
  final String authorRole;
  final String? authorName;
  final bool internalNote;
  final String message;
  final DateTime createdAt;
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
    final payload = _decodeBody(response.body);
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
  }) async {
    final response = await _client.post(
      DealerApiConfig.resolveApiUri('/dealer/support-tickets'),
      headers: await _authorizedJsonHeaders(),
      body: jsonEncode(<String, dynamic>{
        'category': category,
        'priority': priority,
        'subject': subject.trim(),
        'message': message.trim(),
      }),
    );
    final payload = _decodeBody(response.body);
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
    final payload = _decodeBody(response.body);
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
  }) async {
    final response = await _client.post(
      DealerApiConfig.resolveApiUri(
        '/dealer/support-tickets/$ticketId/messages',
      ),
      headers: await _authorizedJsonHeaders(),
      body: jsonEncode(<String, dynamic>{'message': message.trim()}),
    );
    final payload = _decodeBody(response.body);
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
    return supportServiceMessageToken(SupportMessageCode.syncFailed);
  }

  DealerSupportTicketRecord _mapTicket(Map<String, dynamic> json) {
    return DealerSupportTicketRecord(
      id: _parseInt(json['id']),
      ticketCode: json['ticketCode']?.toString() ?? '',
      category: json['category']?.toString() ?? 'OTHER',
      priority: json['priority']?.toString() ?? 'NORMAL',
      status: json['status']?.toString() ?? 'OPEN',
      subject: json['subject']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      assigneeId: _parseOptionalInt(json['assigneeId']),
      assigneeName: _parseOptionalString(json['assigneeName']),
      messages: (json['messages'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(
            (message) => SupportTicketMessageRecord(
              id: _parseInt(message['id']),
              authorRole: message['authorRole']?.toString() ?? 'system',
              authorName: _parseOptionalString(message['authorName']),
              internalNote: message['internalNote'] == true,
              message: message['message']?.toString() ?? '',
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
    return normalized;
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

class SupportException implements Exception {
  const SupportException(this.message);

  final String message;

  @override
  String toString() => message;
}
