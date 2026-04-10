import 'dart:collection';
import 'dart:convert';

import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  const product = Product(
    id: '1',
    name: 'Router AX',
    sku: 'AX-1',
    shortDescription: 'Router',
    price: 100000,
    stock: 10,
    warrantyMonths: 12,
  );

  late AuthStorage authStorage;
  late _QueuedHttpClient client;
  late OrderController controller;

  setUp(() async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    authStorage = AuthStorage();
    await authStorage.persistLogin(
      rememberMe: true,
      email: 'dealer@example.com',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    );
    client = _QueuedHttpClient();
    controller = OrderController(
      authStorage: authStorage,
      client: client,
      productLookup: (productId) => productId == product.id ? product : null,
    );
  });

  tearDown(() {
    controller.dispose();
    client.close();
  });

  test(
    'load syncs orders without prefetching payments for every order',
    () async {
      client.enqueue(
        'GET',
        '/api/v1/dealer/orders',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            body: <String, dynamic>{
              'data': <Map<String, dynamic>>[
                _orderPayload(remoteId: 101, orderCode: 'DH-001'),
                _orderPayload(remoteId: 102, orderCode: 'DH-002'),
              ],
            },
          ),
        ),
      );

      await controller.load();

      expect(controller.orders, hasLength(2));
      expect(controller.paymentHistory, isEmpty);
      expect(client.requestLog, <String>['GET /api/v1/dealer/orders']);
    },
  );

  test(
    'refreshSingleOrder loads detail and payment history on demand',
    () async {
      client.enqueue(
        'GET',
        '/api/v1/dealer/orders',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            body: <String, dynamic>{
              'data': <Map<String, dynamic>>[
                _orderPayload(remoteId: 101, orderCode: 'DH-001'),
              ],
            },
          ),
        ),
      );
      client.enqueue(
        'GET',
        '/api/v1/dealer/orders/101',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            body: <String, dynamic>{
              'data': _orderPayload(
                remoteId: 101,
                orderCode: 'DH-001',
                paymentStatus: 'PAID',
                paidAmount: 110000,
              ),
            },
          ),
        ),
      );
      client.enqueue(
        'GET',
        '/api/v1/dealer/orders/101/payments',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            body: <String, dynamic>{
              'data': <Map<String, dynamic>>[
                <String, dynamic>{
                  'id': 501,
                  'orderId': 101,
                  'amount': 110000,
                  'paidAt': '2026-04-10T01:00:00Z',
                  'channel': 'BANK_TRANSFER',
                  'note': 'Matched by SePay',
                  'proofFileName': null,
                },
              ],
            },
          ),
        ),
      );

      await controller.refreshSingleOrder('DH-001');

      expect(controller.orders, hasLength(1));
      expect(
        controller.findById('DH-001')?.paymentStatus,
        OrderPaymentStatus.paid,
      );
      expect(controller.paymentHistory, hasLength(1));
      expect(controller.paymentHistory.first.orderId, 'DH-001');
      expect(controller.paymentHistory.first.amount, 110000);
      expect(client.requestLog, <String>[
        'GET /api/v1/dealer/orders',
        'GET /api/v1/dealer/orders/101',
        'GET /api/v1/dealer/orders/101/payments',
      ]);
    },
  );

  test(
    'refreshSingleOrder keeps last known payment history when payment sync fails',
    () async {
      client.enqueue(
        'GET',
        '/api/v1/dealer/orders',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            body: <String, dynamic>{
              'data': <Map<String, dynamic>>[
                _orderPayload(remoteId: 101, orderCode: 'DH-001'),
              ],
            },
          ),
        ),
      );
      client.enqueue(
        'GET',
        '/api/v1/dealer/orders/101',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            body: <String, dynamic>{
              'data': _orderPayload(
                remoteId: 101,
                orderCode: 'DH-001',
                paymentStatus: 'PAID',
                paidAmount: 110000,
              ),
            },
          ),
        ),
      );
      client.enqueue(
        'GET',
        '/api/v1/dealer/orders/101/payments',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            body: <String, dynamic>{
              'data': <Map<String, dynamic>>[
                <String, dynamic>{
                  'id': 501,
                  'orderId': 101,
                  'amount': 110000,
                  'paidAt': '2026-04-10T01:00:00Z',
                  'channel': 'BANK_TRANSFER',
                  'note': 'Matched by SePay',
                  'proofFileName': null,
                },
              ],
            },
          ),
        ),
      );

      await controller.refreshSingleOrder('DH-001');

      client.enqueue(
        'GET',
        '/api/v1/dealer/orders/101',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            body: <String, dynamic>{
              'data': _orderPayload(
                remoteId: 101,
                orderCode: 'DH-001',
                paymentStatus: 'PAID',
                paidAmount: 110000,
              ),
            },
          ),
        ),
      );
      client.enqueue(
        'GET',
        '/api/v1/dealer/orders/101/payments',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            statusCode: 500,
            body: <String, dynamic>{'message': 'temporary failure'},
          ),
        ),
      );

      await controller.refreshSingleOrder('DH-001');

      expect(controller.paymentHistory, hasLength(1));
      expect(controller.paymentHistory.first.orderId, 'DH-001');
      expect(controller.paymentHistory.first.amount, 110000);
      expect(client.requestLog, <String>[
        'GET /api/v1/dealer/orders',
        'GET /api/v1/dealer/orders/101',
        'GET /api/v1/dealer/orders/101/payments',
        'GET /api/v1/dealer/orders/101',
        'GET /api/v1/dealer/orders/101/payments',
      ]);
    },
  );
}

typedef _RequestHandler =
    Future<http.StreamedResponse> Function(http.BaseRequest request);

class _QueuedHttpClient extends http.BaseClient {
  final Map<String, Queue<_RequestHandler>> _handlers =
      <String, Queue<_RequestHandler>>{};
  final List<String> requestLog = <String>[];

  void enqueue(String method, String path, _RequestHandler handler) {
    final key = _requestKey(method, path);
    final queue = _handlers.putIfAbsent(key, Queue<_RequestHandler>.new);
    queue.add(handler);
  }

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final key = _requestKey(request.method, request.url.path);
    requestLog.add(key);
    final queue = _handlers[key];
    if (queue == null || queue.isEmpty) {
      throw StateError('Unexpected request: $key');
    }
    return queue.removeFirst()(request);
  }

  @override
  void close() {}

  String _requestKey(String method, String path) =>
      '${method.toUpperCase()} $path';
}

http.StreamedResponse _jsonResponse(
  http.BaseRequest request, {
  int statusCode = 200,
  Map<String, dynamic> body = const <String, dynamic>{},
}) {
  final bytes = utf8.encode(jsonEncode(body));
  return http.StreamedResponse(
    Stream<List<int>>.value(bytes),
    statusCode,
    request: request,
    headers: const <String, String>{'content-type': 'application/json'},
  );
}

Map<String, dynamic> _orderPayload({
  required int remoteId,
  required String orderCode,
  String paymentStatus = 'PENDING',
  int paidAmount = 0,
}) {
  return <String, dynamic>{
    'id': remoteId,
    'orderCode': orderCode,
    'createdAt': '2026-04-10T00:00:00Z',
    'completedAt': null,
    'status': 'PENDING',
    'paymentMethod': 'BANK_TRANSFER',
    'paymentStatus': paymentStatus,
    'receiverName': 'Nguyen Van A',
    'receiverAddress': '123 Duong A',
    'receiverPhone': '0901234567',
    'items': <Map<String, dynamic>>[
      <String, dynamic>{
        'productId': 1,
        'productName': 'Router AX',
        'productSku': 'AX-1',
        'quantity': 1,
        'unitPrice': 100000,
      },
    ],
    'paidAmount': paidAmount,
    'subtotal': 100000,
    'discountPercent': 0,
    'discountAmount': 0,
    'vatPercent': 10,
    'vatAmount': 10000,
    'totalAmount': 110000,
  };
}
