import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';

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
      throw const UploadException('API upload is not configured.');
    }

    final accessToken = await _authStorage.readAccessToken();
    if (accessToken == null || accessToken.trim().isEmpty) {
      throw const UploadException(
        'You need to sign in before uploading files.',
      );
    }

    final uri = DealerApiConfig.uploadUri(category);
    final request = http.MultipartRequest('POST', uri);
    request.headers[HttpHeaders.authorizationHeader] = 'Bearer $accessToken';
    request.headers[HttpHeaders.acceptHeader] = 'application/json';
    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        await file.readAsBytes(),
        filename: file.name,
      ),
    );

    final streamedResponse = await _client.send(request);
    final response = await http.Response.fromStream(streamedResponse);
    final decoded = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded is Map<String, dynamic>
          ? decoded['error']?.toString()
          : null;
      throw UploadException(
        message ?? 'Upload failed with status ${response.statusCode}.',
      );
    }
    if (decoded is! Map<String, dynamic>) {
      throw const UploadException('Upload response is not valid JSON.');
    }

    final success = decoded['success'] == true;
    final data = decoded['data'];
    if (!success || data is! Map<String, dynamic>) {
      throw UploadException(decoded['error']?.toString() ?? 'Upload failed.');
    }

    final rawUrl = data['url']?.toString() ?? '';
    final fileName = data['fileName']?.toString() ?? '';
    if (rawUrl.isEmpty || fileName.isEmpty) {
      throw const UploadException('Upload response is missing file metadata.');
    }

    return UploadedFileRef(
      url: DealerApiConfig.resolveUrl(rawUrl),
      fileName: fileName,
    );
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
}

class UploadException implements Exception {
  const UploadException(this.message);

  final String message;

  @override
  String toString() => message;
}
