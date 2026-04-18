import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/upload_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:image_picker/image_picker.dart';

void main() {
  test('resolveUploadServiceMessage maps unauthenticated in English', () {
    expect(
      resolveUploadServiceMessage(
        uploadServiceMessageToken(UploadMessageCode.unauthenticated),
        isEnglish: true,
      ),
      'You need to sign in before uploading files.',
    );
  });

  test('resolveUploadServiceMessage maps unauthenticated in Vietnamese', () {
    expect(
      resolveUploadServiceMessage(
        uploadServiceMessageToken(UploadMessageCode.unauthenticated),
        isEnglish: false,
      ),
      'Bạn cần đăng nhập trước khi tải tệp lên.',
    );
  });

  test(
    'resolveUploadServiceMessage maps upload failed in English and Vietnamese',
    () {
      expect(
        resolveUploadServiceMessage(
          uploadServiceMessageToken(UploadMessageCode.uploadFailed),
          isEnglish: true,
        ),
        'Upload failed.',
      );
      expect(
        resolveUploadServiceMessage(
          uploadServiceMessageToken(UploadMessageCode.uploadFailed),
          isEnglish: false,
        ),
        'Tải lên thất bại.',
      );
    },
  );

  test('uploadServiceErrorMessage preserves backend-provided message', () {
    expect(
      uploadServiceErrorMessage(
        const UploadException('Storage provider unavailable.'),
        isEnglish: false,
      ),
      'Storage provider unavailable.',
    );
  });

  test(
    'uploadXFile decodes percent-encoded file names from backend metadata',
    () async {
      final client = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {
              'url':
                  '/api/v1/upload/support/evidence/dealers/1/Ng%C6%B0%E1%BB%9Di%20d%C3%B9ng.pdf',
              'fileName': 'Ng%C6%B0%E1%BB%9Di%20d%C3%B9ng.pdf',
            },
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final service = UploadService(
        authStorage: _FakeAuthStorage('dealer-token'),
        client: client,
      );

      final file = XFile.fromData(
        utf8.encode('proof'),
        name: 'whatever.pdf',
        mimeType: 'application/pdf',
      );
      final result = await service.uploadXFile(
        file: file,
        category: 'support-tickets',
      );

      expect(result.fileName, 'Người dùng.pdf');
      service.close();
    },
  );

  test(
    'uploadSupportMediaFile completes multipart session and finalize flow',
    () async {
      final tempDir = await Directory.systemTemp.createTemp(
        'dealer-upload-multipart',
      );
      final filePath = '${tempDir.path}${Platform.pathSeparator}evidence.mp4';
      await File(filePath).writeAsBytes(utf8.encode('video-payload'));

      Map<String, dynamic>? sessionBody;
      var uploadCalled = false;
      int uploadRequestCount = 0;
      final client = MockClient((request) async {
        if (request.method == 'POST' &&
            request.url.path.endsWith('/media/upload-session')) {
          sessionBody = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response(
            jsonEncode({
              'success': true,
              'data': {
                'mediaAssetId': 321,
                'uploadMethod': 'MULTIPART',
                'uploadUrl':
                    'https://api.4thitek.vn/api/v1/media/upload-session/321/upload',
              },
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }
        if (request.method == 'POST' &&
            request.url.path.endsWith('/media/upload-session/321/upload')) {
          uploadRequestCount += 1;
          uploadCalled = true;
          return http.Response(
            jsonEncode({'success': true}),
            200,
            headers: {'content-type': 'application/json'},
          );
        }
        if (request.method == 'POST' &&
            request.url.path.endsWith('/media/finalize')) {
          final finalizeBody = jsonDecode(request.body) as Map<String, dynamic>;
          expect(finalizeBody['mediaAssetId'], 321);
          return http.Response(
            jsonEncode({
              'success': true,
              'data': {
                'id': 321,
                'originalFileName': 'evidence.mp4',
                'mediaType': 'VIDEO',
                'contentType': 'video/mp4',
                'sizeBytes': 15,
                'downloadUrl': '/api/v1/media/321/download',
                'accessUrl': '/api/v1/media/321/access-url',
              },
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }
        return http.Response('{}', 404);
      });

      final service = UploadService(
        authStorage: _FakeAuthStorage('dealer-token'),
        client: client,
      );

      final file = _PathBackedXFile(
        filePath,
        name: 'evidence.mp4',
        mimeType: 'video/mp4',
      );

      final uploaded = await service.uploadSupportMediaFile(file: file);

      expect(uploadCalled, isTrue);
      expect(uploadRequestCount, 1);
      expect(sessionBody, isNotNull);
      expect(sessionBody!['category'], 'support_ticket');
      expect(sessionBody!['contentType'], 'video/mp4');
      expect(uploaded.mediaAssetId, 321);
      expect(uploaded.mediaType, 'VIDEO');
      expect(uploaded.contentType, 'video/mp4');
      expect(uploaded.sizeBytes, 15);
      expect(uploaded.url, contains('/api/v1/media/321/download'));
      expect(uploaded.accessUrl, contains('/api/v1/media/321/access-url'));

      service.close();
      await tempDir.delete(recursive: true);
    },
  );

  test('uploadSupportMediaFile supports presigned put upload method', () async {
    final tempDir = await Directory.systemTemp.createTemp(
      'dealer-upload-presigned',
    );
    final filePath = '${tempDir.path}${Platform.pathSeparator}proof.pdf';
    await File(filePath).writeAsBytes(utf8.encode('pdf-proof'));

    var putCalled = false;
    final client = MockClient((request) async {
      if (request.method == 'POST' &&
          request.url.path.endsWith('/media/upload-session')) {
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {
              'mediaAssetId': 654,
              'uploadMethod': 'PRESIGNED_PUT',
              'uploadUrl': 'https://uploads.example.com/support/654.bin',
              'uploadHeaders': {'x-amz-acl': 'private'},
            },
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      if (request.method == 'PUT' &&
          request.url.host == 'uploads.example.com') {
        putCalled = true;
        expect(request.headers['x-amz-acl'], 'private');
        return http.Response('', 200);
      }
      if (request.method == 'POST' &&
          request.url.path.endsWith('/media/finalize')) {
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {
              'id': 654,
              'originalFileName': 'proof.pdf',
              'mediaType': 'DOCUMENT',
              'contentType': 'application/pdf',
              'sizeBytes': 9,
              'downloadUrl': '/api/v1/media/654/download',
            },
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      return http.Response('{}', 404);
    });

      final service = UploadService(
        authStorage: _FakeAuthStorage('dealer-token'),
        client: client,
      );

      final file = _PathBackedXFile(
        filePath,
        name: 'proof.pdf',
        mimeType: 'application/pdf',
      );

      final uploaded = await service.uploadSupportMediaFile(file: file);

      expect(putCalled, isTrue);
      expect(uploaded.mediaAssetId, 654);
      expect(uploaded.mediaType, 'DOCUMENT');
      expect(uploaded.fileName, 'proof.pdf');

      service.close();
      await tempDir.delete(recursive: true);
  });

  test('uploadSupportMediaFile reports progress for path-based presigned uploads', () async {
    final tempDir = await Directory.systemTemp.createTemp('dealer-upload-progress');
    final filePath = '${tempDir.path}${Platform.pathSeparator}video.mp4';
    await File(filePath).writeAsBytes(utf8.encode('video-stream-body'));

    final progressValues = <double>[];
    final client = MockClient((request) async {
      if (request.method == 'POST' &&
          request.url.path.endsWith('/media/upload-session')) {
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {
              'mediaAssetId': 777,
              'uploadMethod': 'PRESIGNED_PUT',
              'uploadUrl': 'https://uploads.example.com/support/777.bin',
            },
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      if (request.method == 'PUT' &&
          request.url.host == 'uploads.example.com') {
        return http.Response('', 200);
      }
      if (request.method == 'POST' &&
          request.url.path.endsWith('/media/finalize')) {
        return http.Response(
          jsonEncode({
            'success': true,
            'data': {
              'id': 777,
              'originalFileName': 'video.mp4',
              'mediaType': 'VIDEO',
              'contentType': 'video/mp4',
              'sizeBytes': 17,
              'downloadUrl': '/api/v1/media/777/download',
            },
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      return http.Response('{}', 404);
    });

    final service = UploadService(
      authStorage: _FakeAuthStorage('dealer-token'),
      client: client,
    );

    final file = _PathBackedXFile(filePath, name: 'video.mp4', mimeType: 'video/mp4');
    final uploaded = await service.uploadSupportMediaFile(
      file: file,
      onProgress: progressValues.add,
    );

    expect(uploaded.mediaAssetId, 777);
    expect(progressValues, isNotEmpty);
    expect(progressValues.last, 100);

    service.close();
    await tempDir.delete(recursive: true);
  });

  test(
    'uploadSupportMediaFile returns unauthenticated when multipart upload content is unauthorized',
    () async {
      final tempDir = await Directory.systemTemp.createTemp(
        'dealer-upload-unauth',
      );
      final filePath = '${tempDir.path}${Platform.pathSeparator}evidence.mp4';
      await File(filePath).writeAsBytes(utf8.encode('video-payload'));

      final client = MockClient((request) async {
        if (request.method == 'POST' &&
            request.url.path.endsWith('/media/upload-session')) {
          return http.Response(
            jsonEncode({
              'success': true,
              'data': {
                'mediaAssetId': 999,
                'uploadMethod': 'MULTIPART',
                'uploadUrl':
                    'https://api.4thitek.vn/api/v1/media/upload-session/999/upload',
              },
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }
        if (request.method == 'POST' &&
            request.url.path.endsWith('/media/upload-session/999/upload')) {
          return http.Response(
            jsonEncode({'success': false, 'error': 'Unauthorized'}),
            401,
            headers: {'content-type': 'application/json'},
          );
        }
        return http.Response('{}', 404);
      });

      final service = UploadService(
        authStorage: _FakeAuthStorage('dealer-token'),
        client: client,
      );

      final file = _PathBackedXFile(
        filePath,
        name: 'evidence.mp4',
        mimeType: 'video/mp4',
      );

      await expectLater(
        () => service.uploadSupportMediaFile(file: file),
        throwsA(
          isA<UploadException>().having(
            (error) => error.message,
            'message',
            uploadServiceMessageToken(UploadMessageCode.unauthenticated),
          ),
        ),
      );

      service.close();
      await tempDir.delete(recursive: true);
    },
  );
}

class _FakeAuthStorage extends AuthStorage {
  _FakeAuthStorage(this._token);

  final String _token;

  @override
  Future<String?> readAccessToken() async => _token;
}

class _PathBackedXFile extends XFile {
  _PathBackedXFile(
    super.path, {
    required super.name,
    super.mimeType,
  });

  @override
  Future<Uint8List> readAsBytes() {
    throw StateError('readAsBytes should not be called for path-based uploads');
  }
}
