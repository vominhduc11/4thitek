import 'dart:convert';

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

  test('resolveUploadServiceMessage maps upload failed in English and Vietnamese', () {
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
  });

  test('uploadServiceErrorMessage preserves backend-provided message', () {
    expect(
      uploadServiceErrorMessage(
        const UploadException('Storage provider unavailable.'),
        isEnglish: false,
      ),
      'Storage provider unavailable.',
    );
  });

  test('uploadXFile decodes percent-encoded file names from backend metadata', () async {
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
  });
}

class _FakeAuthStorage extends AuthStorage {
  _FakeAuthStorage(this._token);

  final String _token;

  @override
  Future<String?> readAccessToken() async => _token;
}
