import 'dart:convert';

import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/return_request_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

void main() {
  test('maps return detail outcome fields including order adjustment id', () async {
    final service = ReturnRequestService(
      authStorage: _FakeAuthStorage(),
      client: _FakeClient((request) async {
        if (request.url.path.endsWith('/dealer/returns/11')) {
          return _jsonResponse(
            statusCode: 200,
            body: <String, dynamic>{
              'success': true,
              'data': <String, dynamic>{
                'id': 11,
                'requestCode': 'RET-11',
                'orderCode': 'DH-001',
                'type': 'DEFECTIVE_RETURN',
                'status': 'PARTIALLY_RESOLVED',
                'requestedResolution': 'REPLACE',
                'items': <Map<String, dynamic>>[
                  <String, dynamic>{
                    'id': 21,
                    'productName': 'Router AX',
                    'productSku': 'AX-1',
                    'serialSnapshot': 'SER-0001',
                    'itemStatus': 'CREDITED',
                    'finalResolution': 'REFUND',
                    'replacementOrderId': 77,
                    'refundAmount': 50000,
                    'creditAmount': 30000,
                    'orderAdjustmentId': 9001,
                  },
                ],
                'attachments': <Map<String, dynamic>>[],
                'events': <Map<String, dynamic>>[],
              },
            },
          );
        }
        return _jsonResponse(statusCode: 404, body: <String, dynamic>{'error': 'not-found'});
      }),
    );

    final detail = await service.fetchDetail(11);
    service.close();

    expect(detail.id, 11);
    expect(detail.items, hasLength(1));
    expect(detail.items.first.replacementOrderId, 77);
    expect(detail.items.first.refundAmount, 50000);
    expect(detail.items.first.creditAmount, 30000);
    expect(detail.items.first.orderAdjustmentId, 9001);
  });

  test('parses activeRequestId from return-eligibility response', () async {
    final service = ReturnRequestService(
      authStorage: _FakeAuthStorage(),
      client: _FakeClient((request) async {
        if (request.url.path.endsWith('/dealer/inventory/serials/9/return-eligibility')) {
          return _jsonResponse(
            statusCode: 200,
            body: <String, dynamic>{
              'success': true,
              'data': <String, dynamic>{
                'serialId': 9,
                'serial': 'SER-0009',
                'eligible': false,
                'reasonCode': 'ACTIVE_RETURN_REQUEST_EXISTS',
                'reasonMessage': 'Serial already has an active return request',
                'activeRequestId': 321,
                'activeRequestCode': 'RET-ABC-321',
              },
            },
          );
        }
        return _jsonResponse(statusCode: 404, body: <String, dynamic>{'error': 'not-found'});
      }),
    );

    final eligibility = await service.fetchSerialEligibility(9);
    service.close();

    expect(eligibility.serialId, 9);
    expect(eligibility.activeRequestId, 321);
    expect(eligibility.activeRequestCode, 'RET-ABC-321');
    expect(eligibility.eligible, isFalse);
  });
}

class _FakeAuthStorage extends AuthStorage {
  @override
  Future<String?> readAccessToken() async => 'dealer-token';

  @override
  Future<String?> readRefreshToken() async => null;
}

class _FakeClient extends http.BaseClient {
  _FakeClient(this._handler);

  final Future<http.Response> Function(http.BaseRequest request) _handler;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final response = await _handler(request);
    return http.StreamedResponse(
      Stream<List<int>>.fromIterable(<List<int>>[response.bodyBytes]),
      response.statusCode,
      headers: response.headers,
      reasonPhrase: response.reasonPhrase,
      request: request,
    );
  }
}

http.Response _jsonResponse({
  required int statusCode,
  required Map<String, dynamic> body,
}) {
  return http.Response(
    jsonEncode(body),
    statusCode,
    headers: const <String, String>{'content-type': 'application/json'},
  );
}
