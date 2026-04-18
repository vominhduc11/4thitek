import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';

enum UploadMessageCode {
  apiNotConfigured,
  unauthenticated,
  invalidJson,
  uploadFailed,
  missingMetadata,
}

const String _uploadMessageTokenPrefix = 'upload.message.';

String uploadServiceMessageToken(UploadMessageCode code) =>
    '$_uploadMessageTokenPrefix${code.name}';

String resolveUploadServiceMessage(String? message, {required bool isEnglish}) {
  final normalized = message?.trim();
  if (normalized == null || normalized.isEmpty) {
    return isEnglish ? 'Upload failed.' : 'Tải lên thất bại.';
  }

  switch (normalized) {
    case 'upload.message.apiNotConfigured':
      return isEnglish
          ? 'Upload API is not configured.'
          : 'API tải lên chưa được cấu hình.';
    case 'upload.message.unauthenticated':
      return isEnglish
          ? 'You need to sign in before uploading files.'
          : 'Bạn cần đăng nhập trước khi tải tệp lên.';
    case 'upload.message.invalidJson':
      return isEnglish
          ? 'Upload response is invalid.'
          : 'Phản hồi tải lên không hợp lệ.';
    case 'upload.message.uploadFailed':
      return isEnglish ? 'Upload failed.' : 'Tải lên thất bại.';
    case 'upload.message.missingMetadata':
      return isEnglish
          ? 'Upload response is missing file metadata.'
          : 'Phản hồi tải lên thiếu thông tin tệp.';
    default:
      return normalized;
  }
}

String uploadServiceErrorMessage(Object error, {required bool isEnglish}) {
  final message = switch (error) {
    UploadException() => error.message,
    _ => error.toString().trim(),
  };
  return resolveUploadServiceMessage(message, isEnglish: isEnglish);
}

class UploadedFileRef {
  const UploadedFileRef({required this.url, required this.fileName});

  final String url;
  final String fileName;
}

class UploadedSupportMediaRef {
  const UploadedSupportMediaRef({
    required this.mediaAssetId,
    required this.url,
    required this.fileName,
    this.accessUrl,
    this.mediaType,
    this.contentType,
    this.sizeBytes,
  });

  final int mediaAssetId;
  final String url;
  final String fileName;
  final String? accessUrl;
  final String? mediaType;
  final String? contentType;
  final int? sizeBytes;
}

class UploadService {
  UploadService({AuthStorage? authStorage, http.Client? client})
    : _authStorage = authStorage ?? AuthStorage(),
      _rawClient = client ?? http.Client() {
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: _rawClient,
    );
  }

  final AuthStorage _authStorage;
  final http.Client _rawClient;
  late final http.Client _client;

  Future<UploadedFileRef> uploadXFile({
    required XFile file,
    required String category,
  }) async {
    if (!DealerApiConfig.isConfigured) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.apiNotConfigured),
      );
    }

    final accessToken = await _authStorage.readAccessToken();
    if (accessToken == null || accessToken.trim().isEmpty) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.unauthenticated),
      );
    }

    final uri = DealerApiConfig.uploadUri(category);
    final request = http.MultipartRequest('POST', uri);
    request.headers[HttpHeaders.authorizationHeader] = 'Bearer $accessToken';
    request.headers[HttpHeaders.acceptHeader] = 'application/json';
    final List<int> fileBytes;
    try {
      fileBytes = await file.readAsBytes();
    } catch (e) {
      throw UploadException('Failed to read file: $e');
    }
    try {
      request.files.add(
        http.MultipartFile.fromBytes('file', fileBytes, filename: file.name),
      );
    } catch (e) {
      throw UploadException('Failed to encode file for upload: $e');
    }

    final streamedResponse = await _client.send(request);
    final response = await http.Response.fromStream(streamedResponse);
    final Object? decoded;
    try {
      decoded = jsonDecode(response.body);
    } catch (_) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.invalidJson),
      );
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded is Map<String, dynamic>
          ? decoded['error']?.toString()
          : null;
      throw UploadException(
        message ?? uploadServiceMessageToken(UploadMessageCode.uploadFailed),
      );
    }
    if (decoded is! Map<String, dynamic>) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.invalidJson),
      );
    }

    final success = decoded['success'] == true;
    final data = decoded['data'];
    if (!success || data is! Map<String, dynamic>) {
      throw UploadException(
        decoded['error']?.toString() ??
            uploadServiceMessageToken(UploadMessageCode.uploadFailed),
      );
    }

    final rawUrl = data['url']?.toString().trim() ?? '';
    if (rawUrl.isEmpty) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.missingMetadata),
      );
    }
    final fileName = _resolveUploadedFileName(
      data['fileName'],
      fallbackName: file.name,
      rawUrl: rawUrl,
    );

    return UploadedFileRef(
      url: DealerApiConfig.resolveUploadUrl(rawUrl),
      fileName: fileName,
    );
  }

  Future<UploadedSupportMediaRef> uploadSupportMediaFile({
    required XFile file,
    void Function(double progress)? onProgress,
  }) async {
    if (!DealerApiConfig.isConfigured) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.apiNotConfigured),
      );
    }

    final accessToken = await _authStorage.readAccessToken();
    if (accessToken == null || accessToken.trim().isEmpty) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.unauthenticated),
      );
    }

    final fileName = file.name.trim().isEmpty ? 'attachment' : file.name.trim();
    final contentType = _resolveMediaContentType(fileName, file.mimeType);
    final sizeBytes = await file.length();

    final sessionResponse = await _client.post(
      DealerApiConfig.resolveApiUri('/media/upload-session'),
      headers: <String, String>{
        HttpHeaders.authorizationHeader: 'Bearer ${accessToken.trim()}',
        HttpHeaders.acceptHeader: 'application/json',
        HttpHeaders.contentTypeHeader: 'application/json',
      },
      body: jsonEncode(<String, dynamic>{
        'fileName': fileName,
        'contentType': contentType,
        'sizeBytes': sizeBytes,
        'category': 'support_ticket',
      }),
    );

    final sessionPayload = _decodeJsonResponse(sessionResponse);
    if (sessionResponse.statusCode < 200 || sessionResponse.statusCode >= 300) {
      final message = _extractApiError(sessionPayload);
      throw UploadException(
        message ?? uploadServiceMessageToken(UploadMessageCode.uploadFailed),
      );
    }

    final sessionData = sessionPayload['data'];
    if (sessionData is! Map<String, dynamic>) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.invalidJson),
      );
    }
    final mediaAssetId = _parseInt(sessionData['mediaAssetId']);
    final uploadMethod =
        sessionData['uploadMethod']?.toString().trim().toUpperCase() ?? '';
    final uploadUrl = sessionData['uploadUrl']?.toString().trim() ?? '';
    if (mediaAssetId <= 0 || uploadUrl.isEmpty) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.missingMetadata),
      );
    }

    final uploadHeaders = <String, String>{};
    final rawHeaders = sessionData['uploadHeaders'];
    if (rawHeaders is Map<String, dynamic>) {
      rawHeaders.forEach((key, value) {
        final normalizedKey = key.toString().trim();
        final normalizedValue = value?.toString().trim() ?? '';
        if (normalizedKey.isNotEmpty && normalizedValue.isNotEmpty) {
          uploadHeaders[normalizedKey] = normalizedValue;
        }
      });
    }

    if (uploadMethod == 'PRESIGNED_PUT') {
      await _uploadPresignedPut(
        url: uploadUrl,
        file: file,
        contentType: contentType,
        headers: uploadHeaders,
        onProgress: onProgress,
      );
    } else {
      await _uploadMultipartSession(
        accessToken: accessToken,
        uploadUrl: uploadUrl,
        file: file,
        contentType: contentType,
        onProgress: onProgress,
      );
    }

    final finalizeResponse = await _client.post(
      DealerApiConfig.resolveApiUri('/media/finalize'),
      headers: <String, String>{
        HttpHeaders.authorizationHeader: 'Bearer ${accessToken.trim()}',
        HttpHeaders.acceptHeader: 'application/json',
        HttpHeaders.contentTypeHeader: 'application/json',
      },
      body: jsonEncode(<String, dynamic>{'mediaAssetId': mediaAssetId}),
    );

    final finalizePayload = _decodeJsonResponse(finalizeResponse);
    if (finalizeResponse.statusCode < 200 ||
        finalizeResponse.statusCode >= 300) {
      final message = _extractApiError(finalizePayload);
      throw UploadException(
        message ?? uploadServiceMessageToken(UploadMessageCode.uploadFailed),
      );
    }
    final finalizeData = finalizePayload['data'];
    if (finalizeData is! Map<String, dynamic>) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.invalidJson),
      );
    }
    onProgress?.call(100);

    final resolvedUrl = DealerApiConfig.resolveUploadUrl(
      finalizeData['downloadUrl']?.toString() ??
          finalizeData['accessUrl']?.toString() ??
          '',
    );
    if (resolvedUrl.trim().isEmpty) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.missingMetadata),
      );
    }
    final resolvedFileName = _resolveUploadedFileName(
      finalizeData['originalFileName'],
      fallbackName: fileName,
      rawUrl: resolvedUrl,
    );

    final rawAccessUrl = finalizeData['accessUrl']?.toString().trim();
    final resolvedAccessUrl = rawAccessUrl == null || rawAccessUrl.isEmpty
        ? null
        : DealerApiConfig.resolveUploadUrl(rawAccessUrl);

    return UploadedSupportMediaRef(
      mediaAssetId: mediaAssetId,
      url: resolvedUrl,
      fileName: resolvedFileName,
      accessUrl: resolvedAccessUrl,
      mediaType: finalizeData['mediaType']?.toString(),
      contentType: finalizeData['contentType']?.toString(),
      sizeBytes: _parseOptionalInt(finalizeData['sizeBytes']),
    );
  }

  Future<void> deleteUrl(String url) async {
    final normalizedUrl = url.trim();
    if (normalizedUrl.isEmpty || !DealerApiConfig.isConfigured) {
      return;
    }
    final accessToken = await _authStorage.readAccessToken();
    if (accessToken == null || accessToken.trim().isEmpty) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.unauthenticated),
      );
    }
    final uri = DealerApiConfig.resolveApiUri(
      '/upload',
    ).replace(queryParameters: <String, String>{'url': normalizedUrl});
    final response = await _client.delete(
      uri,
      headers: <String, String>{
        HttpHeaders.authorizationHeader: 'Bearer ${accessToken.trim()}',
        HttpHeaders.acceptHeader: 'application/json',
      },
    );
    final decoded = jsonDecode(response.body.isEmpty ? '{}' : response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded is Map<String, dynamic>
          ? decoded['error']?.toString()
          : null;
      throw UploadException(
        message ?? uploadServiceMessageToken(UploadMessageCode.uploadFailed),
      );
    }
  }

  Future<void> _uploadMultipartSession({
    required String accessToken,
    required String uploadUrl,
    required XFile file,
    required String contentType,
    void Function(double progress)? onProgress,
  }) async {
    final request = http.MultipartRequest('POST', Uri.parse(uploadUrl));
    request.headers[HttpHeaders.authorizationHeader] =
        'Bearer ${accessToken.trim()}';
    request.headers[HttpHeaders.acceptHeader] = 'application/json';

    if (file.path.isNotEmpty) {
      request.files.add(
        await http.MultipartFile.fromPath(
          'file',
          file.path,
          filename: file.name,
        ),
      );
    } else {
      final bytes = await file.readAsBytes();
      request.files.add(
        http.MultipartFile.fromBytes('file', bytes, filename: file.name),
      );
    }

    onProgress?.call(75);
    final streamed = await _client.send(request);
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final payload = _decodeJsonResponse(response);
      final message = _extractApiError(payload);
      throw UploadException(
        message ?? uploadServiceMessageToken(UploadMessageCode.uploadFailed),
      );
    }
  }

  Future<void> _uploadPresignedPut({
    required String url,
    required XFile file,
    required String contentType,
    required Map<String, String> headers,
    void Function(double progress)? onProgress,
  }) async {
    try {
      final uploadUri = Uri.parse(url);
      final normalizedPath = file.path.trim();
      final http.StreamedResponse streamed;
      if (normalizedPath.isNotEmpty) {
        final localFile = File(normalizedPath);
        final request = http.StreamedRequest('PUT', uploadUri);
        request.headers[HttpHeaders.contentTypeHeader] = contentType;
        headers.forEach((key, value) {
          if (key.trim().isNotEmpty && value.trim().isNotEmpty) {
            request.headers[key] = value;
          }
        });
        request.contentLength = await localFile.length();
        onProgress?.call(20);
        final responseFuture = _rawClient.send(request);
        final totalBytes = request.contentLength ?? 0;
        var sentBytes = 0;
        await for (final chunk in localFile.openRead()) {
          request.sink.add(chunk);
          sentBytes += chunk.length;
          if (totalBytes > 0) {
            final percent = 20 + ((sentBytes / totalBytes) * 70);
            onProgress?.call(percent.clamp(20.0, 90.0));
          }
        }
        await request.sink.close();
        streamed = await responseFuture;
      } else {
        final request = http.Request('PUT', uploadUri);
        request.headers[HttpHeaders.contentTypeHeader] = contentType;
        headers.forEach((key, value) {
          if (key.trim().isNotEmpty && value.trim().isNotEmpty) {
            request.headers[key] = value;
          }
        });
        request.bodyBytes = await file.readAsBytes();
        onProgress?.call(90);
        streamed = await _rawClient.send(request);
      }

      final response = await http.Response.fromStream(streamed);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final payload = _decodeJsonResponse(response);
        final message = _extractApiError(payload);
        throw UploadException(
          message ?? uploadServiceMessageToken(UploadMessageCode.uploadFailed),
        );
      }
      onProgress?.call(95);
    } on UploadException {
      rethrow;
    } catch (error) {
      throw UploadException('Failed to upload file: $error');
    }
  }

  Map<String, dynamic> _decodeJsonResponse(http.Response response) {
    final rawBody = response.body;
    if (rawBody.trim().isEmpty) {
      return const <String, dynamic>{};
    }
    try {
      final decoded = jsonDecode(rawBody);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
    } catch (_) {
      return const <String, dynamic>{};
    }
    return const <String, dynamic>{};
  }

  String? _extractApiError(Map<String, dynamic> payload) {
    final message = payload['error']?.toString().trim();
    if (message == null || message.isEmpty) {
      return null;
    }
    return message;
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

  static Future<String> xFileToDataUri(XFile file) async {
    final bytes = await file.readAsBytes();
    final parts = file.name.split('.');
    final extension = parts.length > 1 ? parts.last.toLowerCase() : 'png';
    final mimeType = switch (extension) {
      'jpg' || 'jpeg' => 'image/jpeg',
      'gif' => 'image/gif',
      'webp' => 'image/webp',
      _ => 'image/png',
    };
    return 'data:$mimeType;base64,${base64Encode(bytes)}';
  }

  void close() {
    _client.close();
  }
}

String _resolveUploadedFileName(
  Object? value, {
  required String fallbackName,
  required String rawUrl,
}) {
  final normalized = value?.toString().trim();
  if (normalized != null && normalized.isNotEmpty) {
    final extracted = _extractLastPathSegment(normalized);
    if (extracted != null) {
      return extracted;
    }
  }

  final fromUrl = _extractLastPathSegment(rawUrl);
  if (fromUrl != null) {
    return fromUrl;
  }

  final fallback = fallbackName.trim();
  return fallback.isEmpty ? 'attachment' : fallback;
}

String _resolveMediaContentType(String fileName, String? declaredType) {
  final normalizedType = declaredType?.trim().toLowerCase();
  if (normalizedType != null && normalizedType.isNotEmpty) {
    return normalizedType;
  }
  final extension = fileName.contains('.')
      ? fileName.split('.').last.trim().toLowerCase()
      : '';
  return switch (extension) {
    'jpg' || 'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'webp' => 'image/webp',
    'mp4' => 'video/mp4',
    'webm' => 'video/webm',
    'pdf' => 'application/pdf',
    _ => 'application/octet-stream',
  };
}

String? _extractLastPathSegment(String? value) {
  final normalized = value?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  final uri = Uri.tryParse(normalized);
  var path = uri?.path ?? normalized;
  if (path.isEmpty) {
    return null;
  }
  path = path.replaceAll('\\', '/').replaceAll(RegExp(r'/+$'), '');
  final index = path.lastIndexOf('/');
  final segment = (index >= 0 ? path.substring(index + 1) : path).trim();
  if (segment.isEmpty) {
    return null;
  }
  try {
    return Uri.decodeComponent(segment);
  } catch (_) {
    return segment;
  }
}

class UploadException implements Exception {
  const UploadException(this.message);

  final String message;

  @override
  String toString() => message;
}
