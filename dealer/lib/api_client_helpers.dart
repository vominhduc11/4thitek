import 'dart:convert';

/// Raised at a service/controller API boundary when a dealer API call fails
/// (non-2xx status or an unexpected payload shape).
///
/// [message] is the server-provided message or a domain message token the
/// caller localizes; [statusCode] is the HTTP status when available. Using a
/// dedicated type — instead of a raw [Exception] — lets callers tell an API
/// failure apart from a programming error and keeps log output diagnostic.
class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => statusCode == null
      ? 'ApiException: $message'
      : 'ApiException($statusCode): $message';
}

Map<String, String> buildAuthorizedHeaders(String token) {
  return <String, String>{
    'Accept': 'application/json',
    'Authorization': 'Bearer $token',
  };
}

Map<String, String> buildAuthorizedJsonHeaders(String token) {
  return <String, String>{
    ...buildAuthorizedHeaders(token),
    'Content-Type': 'application/json',
  };
}

Map<String, dynamic> decodeJsonBody(String body) {
  if (body.trim().isEmpty) {
    return const <String, dynamic>{};
  }
  final decoded = jsonDecode(body);
  if (decoded is Map<String, dynamic>) {
    return decoded;
  }
  return const <String, dynamic>{};
}

Map<String, dynamic> decodeJsonBytes(List<int> bodyBytes) {
  return decodeJsonBody(utf8.decode(bodyBytes));
}
