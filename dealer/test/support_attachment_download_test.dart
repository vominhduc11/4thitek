import 'dart:convert';

import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/support_attachment_download.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  test('resolveSupportAttachmentFileName keeps extension or derives one', () {
    expect(
      resolveSupportAttachmentFileName(
        preferredFileName: 'invoice.pdf',
        sourceUrl: 'https://cdn.example.com/files/ignored',
        mimeType: 'application/pdf',
      ),
      'invoice.pdf',
    );

    expect(
      resolveSupportAttachmentFileName(
        preferredFileName: 'report',
        sourceUrl: 'https://cdn.example.com/files/report',
        mimeType: 'application/pdf',
      ),
      'report.pdf',
    );

    expect(
      resolveSupportAttachmentFileName(
        preferredFileName: null,
        sourceUrl: 'https://cdn.example.com/files/abc/credit_note.png',
        mimeType: 'image/png',
      ),
      'credit_note.png',
    );
  });

  test(
    'loadSupportAttachmentAsset normalizes private support URLs and attaches auth',
    () async {
      final client = MockClient((request) async {
        expect(
          request.url.path,
          '/api/v1/upload/support/evidence/1/638c7523-2267-4c58-b7aa-dd94042fe9e1.png',
        );
        expect(request.headers['authorization'], 'Bearer dealer-token');
        return http.Response.bytes(
          utf8.encode('binary-image'),
          200,
          headers: <String, String>{'content-type': 'image/png'},
        );
      });

      final asset = await loadSupportAttachmentAsset(
        'support/evidence/1/638c7523-2267-4c58-b7aa-dd94042fe9e1.png',
        authStorage: _FakeAuthStorage('dealer-token'),
        client: client,
      );

      expect(asset.mimeType, 'image/png');
      expect(asset.dataUri, startsWith('data:image/png;base64,'));
      expect(asset.bytes, isNotEmpty);
    },
  );
}

class _FakeAuthStorage extends AuthStorage {
  _FakeAuthStorage(this._token);

  final String _token;

  @override
  Future<String?> readAccessToken() async => _token;
}
