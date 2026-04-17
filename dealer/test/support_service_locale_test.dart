import 'dart:convert';

import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/support_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  test('resolveSupportServiceMessage maps internal fallback in English', () {
    expect(
      resolveSupportServiceMessage(
        supportServiceMessageToken(SupportMessageCode.syncFailed),
        isEnglish: true,
      ),
      'Unable to sync support request.',
    );
  });

  test('resolveSupportServiceMessage maps internal fallback in Vietnamese', () {
    expect(
      resolveSupportServiceMessage(
        supportServiceMessageToken(SupportMessageCode.syncFailed),
        isEnglish: false,
      ),
      'Không thể đồng bộ yêu cầu hỗ trợ.',
    );
  });

  test('resolveSupportServiceMessage preserves backend-provided message', () {
    expect(
      resolveSupportServiceMessage('Support is overloaded.', isEnglish: false),
      'Support is overloaded.',
    );
  });

  test(
    'fetchTicketsPage normalizes attachment URLs and file names from API/history',
    () async {
      final client = MockClient((request) async {
        if (request.url.path.endsWith('/dealer/support-tickets/page')) {
          return http.Response(
            jsonEncode({
              'success': true,
              'data': {
                'items': [
                  {
                    'id': 11,
                    'ticketCode': 'TK-11',
                    'category': 'OTHER',
                    'priority': 'NORMAL',
                    'status': 'OPEN',
                    'subject': 'Legacy attachment',
                    'message': 'Need support',
                    'messages': [
                      {
                        'id': 111,
                        'authorRole': 'DEALER',
                        'authorName': 'Dealer',
                        'internalNote': false,
                        'message': 'Attached proof',
                        'attachments': [
                          {
                            'url':
                                'support/evidence/dealers/7/9d0e914f-proof.jpg',
                            'fileName':
                                'support/evidence/dealers/7/9d0e914f-proof.jpg',
                          },
                        ],
                        'createdAt': '2026-04-10T00:00:00Z',
                      },
                    ],
                    'createdAt': '2026-04-10T00:00:00Z',
                    'updatedAt': '2026-04-10T00:00:00Z',
                  },
                ],
                'page': 0,
                'size': 10,
                'totalPages': 1,
                'totalElements': 1,
              },
            }),
            200,
            headers: {'content-type': 'application/json'},
          );
        }
        return http.Response('{}', 404);
      });

      final service = SupportService(
        authStorage: _FakeAuthStorage('dealer-token'),
        client: client,
      );

      final page = await service.fetchTicketsPage(page: 0, size: 10);
      final attachment = page.items.first.messages.first.attachments.first;

      expect(
        attachment.url,
        contains(
          '/api/v1/upload/support/evidence/dealers/7/9d0e914f-proof.jpg',
        ),
      );
      expect(attachment.fileName, '9d0e914f-proof.jpg');

      service.close();
    },
  );
}

class _FakeAuthStorage extends AuthStorage {
  _FakeAuthStorage(this._token);

  final String _token;

  @override
  Future<String?> readAccessToken() async => _token;
}
