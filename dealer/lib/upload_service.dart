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

class UploadService {
  UploadService({AuthStorage? authStorage, http.Client? client})
    : _authStorage = authStorage ?? AuthStorage() {
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: client ?? http.Client(),
    );
  }

  final AuthStorage _authStorage;
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

    final rawUrl = data['url']?.toString() ?? '';
    final fileName = data['fileName']?.toString() ?? '';
    if (rawUrl.isEmpty || fileName.isEmpty) {
      throw UploadException(
        uploadServiceMessageToken(UploadMessageCode.missingMetadata),
      );
    }

    return UploadedFileRef(
      url: DealerApiConfig.resolveUrl(rawUrl),
      fileName: fileName,
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

class UploadException implements Exception {
  const UploadException(this.message);

  final String message;

  @override
  String toString() => message;
}
