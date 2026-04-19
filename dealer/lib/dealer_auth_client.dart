import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'auth_storage.dart';

class DealerAuthClient extends http.BaseClient {
  static const Duration _refreshTimeout = Duration(seconds: 12);

  DealerAuthClient({required AuthStorage authStorage, http.Client? inner})
    : _authStorage = authStorage,
      _inner = inner ?? http.Client();

  final AuthStorage _authStorage;
  final http.Client _inner;
  Future<String?>? _refreshInFlight;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final snapshot = await _RequestSnapshot.capture(request);
    final firstAttempt = await snapshot.build();
    await _attachAccessToken(firstAttempt, preserveExisting: true);

    final firstResponse = await _inner.send(firstAttempt);
    if (!_shouldAttemptRefresh(firstResponse.statusCode, snapshot.url)) {
      return firstResponse;
    }

    final refreshedToken = await _refreshAccessToken();
    if (refreshedToken == null || refreshedToken.isEmpty) {
      return firstResponse;
    }

    await firstResponse.stream.drain<void>();

    final retryAttempt = await snapshot.build();
    _attachBearerToken(retryAttempt, refreshedToken);
    return _inner.send(retryAttempt);
  }

  @override
  void close() {
    _inner.close();
    super.close();
  }

  bool _shouldAttemptRefresh(int statusCode, Uri url) {
    if (statusCode != HttpStatus.unauthorized ||
        !DealerApiConfig.isConfigured) {
      return false;
    }
    final path = url.path.toLowerCase();
    if (path.endsWith(DealerApiConfig.apiPath('/auth/login').toLowerCase()) ||
        path.endsWith(DealerApiConfig.apiPath('/auth/refresh').toLowerCase())) {
      return false;
    }
    return true;
  }

  Future<void> _attachAccessToken(
    http.BaseRequest request, {
    required bool preserveExisting,
  }) async {
    if (preserveExisting && _hasAuthorizationHeader(request)) {
      return;
    }

    final token = await _authStorage.readAccessToken();
    if (token == null || token.trim().isEmpty) {
      return;
    }

    _attachBearerToken(request, token.trim());
  }

  bool _hasAuthorizationHeader(http.BaseRequest request) {
    return request.headers.keys.any(
      (key) => key.toLowerCase() == HttpHeaders.authorizationHeader,
    );
  }

  void _attachBearerToken(http.BaseRequest request, String token) {
    final existingKeys = request.headers.keys
        .where((key) => key.toLowerCase() == HttpHeaders.authorizationHeader)
        .toList(growable: false);
    for (final key in existingKeys) {
      request.headers.remove(key);
    }
    request.headers[HttpHeaders.authorizationHeader] = 'Bearer $token';
  }

  Future<String?> _refreshAccessToken() async {
    final existing = _refreshInFlight;
    if (existing != null) {
      return existing;
    }

    final refreshFuture = _performRefresh();
    _refreshInFlight = refreshFuture;
    try {
      return await refreshFuture;
    } finally {
      if (identical(_refreshInFlight, refreshFuture)) {
        _refreshInFlight = null;
      }
    }
  }

  Future<String?> _performRefresh() async {
    final refreshToken = await _authStorage.readRefreshToken();
    if (refreshToken == null || refreshToken.trim().isEmpty) {
      await _authStorage.expireSession();
      return null;
    }

    try {
      final response = await _inner.post(
        DealerApiConfig.authRefreshUri,
        headers: DealerApiConfig.jsonHeaders,
        body: jsonEncode(<String, String>{'refreshToken': refreshToken.trim()}),
      ).timeout(_refreshTimeout);

      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        if (response.statusCode == HttpStatus.badRequest ||
            response.statusCode == HttpStatus.unauthorized) {
          await _authStorage.expireSession(
            message: payload['error']?.toString().trim(),
          );
        }
        return null;
      }

      final data = payload['data'];
      if (data is! Map<String, dynamic>) {
        return null;
      }

      final accessToken = data['accessToken']?.toString().trim() ?? '';
      if (accessToken.isEmpty) {
        return null;
      }

      final nextRefreshToken = data['refreshToken']?.toString().trim();
      await _authStorage.updateTokens(
        accessToken: accessToken,
        refreshToken: nextRefreshToken,
      );
      return accessToken;
    } on TimeoutException {
      return null;
    } on Exception {
      return null;
    }
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
}

class _MultipartFileSnapshot {
  const _MultipartFileSnapshot({
    required this.field,
    required this.filename,
    required this.bytes,
  });

  final String field;
  final String? filename;
  final List<int> bytes;
}

class _RequestSnapshot {
  const _RequestSnapshot._({
    required this.method,
    required this.url,
    required this.headers,
    required this.followRedirects,
    required this.maxRedirects,
    required this.persistentConnection,
    this.bodyBytes,
    this.fields,
    this.files,
  });

  final String method;
  final Uri url;
  final Map<String, String> headers;
  final bool followRedirects;
  final int maxRedirects;
  final bool persistentConnection;
  final List<int>? bodyBytes;
  final Map<String, String>? fields;
  final List<_MultipartFileSnapshot>? files;

  static Future<_RequestSnapshot> capture(http.BaseRequest request) async {
    if (request is http.Request) {
      return _RequestSnapshot._(
        method: request.method,
        url: request.url,
        headers: Map<String, String>.from(request.headers),
        followRedirects: request.followRedirects,
        maxRedirects: request.maxRedirects,
        persistentConnection: request.persistentConnection,
        bodyBytes: List<int>.from(request.bodyBytes),
      );
    }

    if (request is http.MultipartRequest) {
      final fileSnapshots = <_MultipartFileSnapshot>[];
      for (final file in request.files) {
        fileSnapshots.add(
          _MultipartFileSnapshot(
            field: file.field,
            filename: file.filename,
            bytes: await file.finalize().toBytes(),
          ),
        );
      }

      return _RequestSnapshot._(
        method: request.method,
        url: request.url,
        headers: Map<String, String>.from(request.headers),
        followRedirects: request.followRedirects,
        maxRedirects: request.maxRedirects,
        persistentConnection: request.persistentConnection,
        fields: Map<String, String>.from(request.fields),
        files: fileSnapshots,
      );
    }

    throw UnsupportedError(
      'DealerAuthClient does not support ${request.runtimeType}.',
    );
  }

  Future<http.BaseRequest> build() async {
    if (files != null) {
      final request = http.MultipartRequest(method, url)
        ..headers.addAll(headers)
        ..fields.addAll(fields ?? const <String, String>{})
        ..followRedirects = followRedirects
        ..maxRedirects = maxRedirects
        ..persistentConnection = persistentConnection;

      for (final file in files!) {
        request.files.add(
          http.MultipartFile.fromBytes(
            file.field,
            file.bytes,
            filename: file.filename,
          ),
        );
      }
      return request;
    }

    final request = http.Request(method, url)
      ..headers.addAll(headers)
      ..followRedirects = followRedirects
      ..maxRedirects = maxRedirects
      ..persistentConnection = persistentConnection;
    if (bodyBytes != null) {
      request.bodyBytes = List<int>.from(bodyBytes!);
    }
    return request;
  }
}
