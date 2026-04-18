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
                            'id': 501,
                            'url':
                                'support/evidence/dealers/7/9d0e914f-proof.jpg',
                            'accessUrl': '/api/v1/media/501/access-url',
                            'fileName':
                                'Ng%C6%B0%E1%BB%9Di%20d%C3%B9ng%20-%20minh%20ch%E1%BB%A9ng.jpg',
                            'mediaType': 'IMAGE',
                            'contentType': 'image/jpeg',
                            'sizeBytes': 12345,
                            'createdAt': '2026-04-10T00:00:00Z',
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

      expect(attachment.url, contains('/api/v1/media/501/access-url'));
      expect(attachment.accessUrl, contains('/api/v1/media/501/access-url'));
      expect(attachment.fileName, 'Người dùng - minh chứng.jpg');
      expect(attachment.id, 501);
      expect(attachment.mediaType, 'IMAGE');
      expect(attachment.contentType, 'image/jpeg');
      expect(attachment.sizeBytes, 12345);

      service.close();
    },
  );

  test(
    'submitTicket sends mediaAssetIds and keeps legacy attachments fallback',
    () async {
      Map<String, dynamic>? requestBody;
      final client = MockClient((request) async {
        if (request.method == 'POST' &&
            request.url.path.endsWith('/dealer/support-tickets')) {
          requestBody = jsonDecode(request.body) as Map<String, dynamic>;
          return http.Response(
            jsonEncode({'success': true, 'data': _ticketResponsePayload()}),
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

      await service.submitTicket(
        category: 'OTHER',
        priority: 'NORMAL',
        subject: 'Need support',
        message: 'Please check',
        attachments: const [
          SupportTicketAttachmentRecord(
            id: 910,
            url: '/api/v1/media/910/download',
            fileName: 'proof.mp4',
          ),
          SupportTicketAttachmentRecord(
            url: '/api/v1/upload/support/evidence/dealers/7/manual.pdf',
            fileName: 'manual.pdf',
          ),
        ],
      );

      expect(requestBody, isNotNull);
      expect(requestBody!['mediaAssetIds'], equals([910]));
      expect(
        requestBody!['attachments'],
        equals([
          {
            'url': '/api/v1/upload/support/evidence/dealers/7/manual.pdf',
            'fileName': 'manual.pdf',
          },
        ]),
      );

      service.close();
    },
  );

  test('submitTicketMessage sends distinct mediaAssetIds', () async {
    Map<String, dynamic>? requestBody;
    final client = MockClient((request) async {
      if (request.method == 'POST' &&
          request.url.path.endsWith('/dealer/support-tickets/88/messages')) {
        requestBody = jsonDecode(request.body) as Map<String, dynamic>;
        return http.Response(
          jsonEncode({'success': true, 'data': _ticketResponsePayload()}),
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

    await service.submitTicketMessage(
      ticketId: 88,
      message: 'Attached evidence',
      attachments: const [
        SupportTicketAttachmentRecord(
          id: 911,
          url: '/api/v1/media/911/download',
          fileName: 'video.webm',
        ),
        SupportTicketAttachmentRecord(
          id: 911,
          url: '/api/v1/media/911/download',
          fileName: 'video.webm',
        ),
        SupportTicketAttachmentRecord(
          id: 912,
          url: '/api/v1/media/912/download',
          fileName: 'proof.pdf',
        ),
      ],
    );

    expect(requestBody, isNotNull);
    expect(requestBody!['mediaAssetIds'], equals([911, 912]));
    expect(requestBody!.containsKey('attachments'), isFalse);

    service.close();
  });
}

Map<String, dynamic> _ticketResponsePayload() {
  return <String, dynamic>{
    'id': 88,
    'ticketCode': 'TK-88',
    'category': 'OTHER',
    'priority': 'NORMAL',
    'status': 'OPEN',
    'subject': 'Need support',
    'message': 'Please check',
    'messages': const <Map<String, dynamic>>[],
    'createdAt': '2026-04-10T00:00:00Z',
    'updatedAt': '2026-04-10T00:00:00Z',
  };
}

class _FakeAuthStorage extends AuthStorage {
  _FakeAuthStorage(this._token);

  final String _token;

  @override
  Future<String?> readAccessToken() async => _token;
}
