import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';

class DealerSupportTicketRecord {
  const DealerSupportTicketRecord({
    required this.id,
    required this.ticketCode,
    required this.category,
    required this.priority,
    required this.status,
    required this.subject,
    required this.message,
    required this.createdAt,
    required this.updatedAt,
  });

  final int id;
  final String ticketCode;
  final String category;
  final String priority;
  final String status;
  final String subject;
  final String message;
  final DateTime createdAt;
  final DateTime updatedAt;
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
      Uri.parse(
        DealerApiConfig.resolveUrl('/api/dealer/support-tickets/latest'),
      ),
      headers: await _authorizedHeaders(),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw SupportException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data == null) {
      return null;
    }
    if (data is! Map<String, dynamic>) {
      throw const SupportException('Support ticket payload is invalid.');
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
      Uri.parse(DealerApiConfig.resolveUrl('/api/dealer/support-tickets')),
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
      throw const SupportException('Support ticket payload is invalid.');
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
      throw const SupportException(
        'You need to sign in before contacting support.',
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
    return 'Could not sync support request.';
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
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse(json['updatedAt']?.toString() ?? '') ??
          DateTime.now(),
    );
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
}

class SupportException implements Exception {
  const SupportException(this.message);

  final String message;

  @override
  String toString() => message;
}
