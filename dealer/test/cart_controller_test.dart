import 'dart:async';
import 'dart:collection';
import 'dart:convert';

import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/models.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  const product = Product(
    id: '1',
    name: 'Test Product',
    sku: 'SKU-1',
    shortDescription: 'Test product',
    price: 100000,
    stock: 10,
    warrantyMonths: 12,
  );

  late AuthStorage authStorage;
  late _QueuedHttpClient client;
  late CartController controller;

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
    controller = CartController(
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
    'stale failed sync does not rollback a newer local cart state',
    () async {
      final firstResponseGate = Completer<void>();
      final secondResponseGate = Completer<void>();
      client.enqueue('PUT', '/api/v1/dealer/cart/items', (request) async {
        await firstResponseGate.future;
        return _jsonResponse(
          request,
          statusCode: 500,
          body: <String, dynamic>{'error': 'sync failed'},
        );
      });
      client.enqueue('PUT', '/api/v1/dealer/cart/items', (request) async {
        await secondResponseGate.future;
        return _jsonResponse(
          request,
          body: <String, dynamic>{
            'data': <String, dynamic>{'productId': 1, 'quantity': 3},
          },
        );
      });

      final firstUpdate = controller.setQuantity(product, 2);
      final secondUpdate = controller.setQuantity(product, 3);

      expect(controller.quantityFor(product.id), 3);

      firstResponseGate.complete();
      expect(await firstUpdate, isFalse);
      expect(controller.quantityFor(product.id), 3);

      secondResponseGate.complete();
      expect(await secondUpdate, isTrue);
      expect(controller.quantityFor(product.id), 3);
    },
  );

  test('latest failed sync rolls back to the last synced cart state', () async {
    client.enqueue(
      'PUT',
      '/api/v1/dealer/cart/items',
      (request) => Future<http.StreamedResponse>.value(
        _jsonResponse(
          request,
          body: <String, dynamic>{
            'data': <String, dynamic>{'productId': 1, 'quantity': 2},
          },
        ),
      ),
    );
    client.enqueue(
      'PUT',
      '/api/v1/dealer/cart/items',
      (request) => Future<http.StreamedResponse>.value(
        _jsonResponse(
          request,
          statusCode: 500,
          body: <String, dynamic>{'error': 'sync failed'},
        ),
      ),
    );

    expect(await controller.setQuantity(product, 2), isTrue);
    expect(controller.quantityFor(product.id), 2);

    final failedUpdate = controller.setQuantity(product, 3);
    expect(controller.quantityFor(product.id), 3);

    expect(await failedUpdate, isFalse);
    expect(controller.quantityFor(product.id), 2);
  });

  test(
    'sync flags stay active while a cart mutation is still in flight',
    () async {
      final responseGate = Completer<void>();
      client.enqueue('PUT', '/api/v1/dealer/cart/items', (request) async {
        await responseGate.future;
        return _jsonResponse(
          request,
          body: <String, dynamic>{
            'data': <String, dynamic>{'productId': 1, 'quantity': 2},
          },
        );
      });

      final updateFuture = controller.setQuantity(product, 2);
      await Future<void>.delayed(Duration.zero);

      expect(controller.isSyncing, isTrue);
      expect(controller.isSyncingProduct(product.id), isTrue);

      responseGate.complete();

      expect(await updateFuture, isTrue);
      expect(controller.isSyncing, isFalse);
      expect(controller.isSyncingProduct(product.id), isFalse);
    },
  );

  test(
    'load does not overwrite local edits made while remote cart is loading',
    () async {
      final cartResponseGate = Completer<void>();
      client.enqueue(
        'GET',
        '/api/v1/dealer/profile',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            body: <String, dynamic>{
              'data': <String, dynamic>{'vatPercent': 8},
            },
          ),
        ),
      );
      client.enqueue(
        'GET',
        '/api/v1/dealer/discount-rules',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            body: <String, dynamic>{'data': const <Object>[]},
          ),
        ),
      );
      client.enqueue('GET', '/api/v1/dealer/cart', (request) async {
        await cartResponseGate.future;
        return _jsonResponse(
          request,
          body: <String, dynamic>{
            'data': <Map<String, dynamic>>[
              <String, dynamic>{'productId': 1, 'quantity': 5},
            ],
          },
        );
      });
      client.enqueue(
        'PUT',
        '/api/v1/dealer/cart/items',
        (request) => Future<http.StreamedResponse>.value(
          _jsonResponse(
            request,
            body: <String, dynamic>{
              'data': <String, dynamic>{'productId': 1, 'quantity': 1},
            },
          ),
        ),
      );

      final loadFuture = controller.load();
      await Future<void>.delayed(Duration.zero);

      final localUpdate = controller.setQuantity(product, 1);
      expect(controller.quantityFor(product.id), 1);

      cartResponseGate.complete();

      expect(await localUpdate, isTrue);
      await loadFuture;
      expect(controller.quantityFor(product.id), 1);
      expect(controller.vatPercent, 8);
    },
  );

  test('load syncs VAT percent from dealer profile for cart preview', () async {
    client.enqueue(
      'GET',
      '/api/v1/dealer/profile',
      (request) => Future<http.StreamedResponse>.value(
        _jsonResponse(
          request,
          body: <String, dynamic>{
            'data': <String, dynamic>{'vatPercent': 8},
          },
        ),
      ),
    );
    client.enqueue(
      'GET',
      '/api/v1/dealer/discount-rules',
      (request) => Future<http.StreamedResponse>.value(
        _jsonResponse(
          request,
          body: <String, dynamic>{'data': const <Object>[]},
        ),
      ),
    );
    client.enqueue(
      'GET',
      '/api/v1/dealer/cart',
      (request) => Future<http.StreamedResponse>.value(
        _jsonResponse(
          request,
          body: <String, dynamic>{'data': const <Object>[]},
        ),
      ),
    );

    await controller.load();

    expect(controller.vatPercent, 8);
  });
}

typedef _RequestHandler =
    Future<http.StreamedResponse> Function(http.BaseRequest request);

class _QueuedHttpClient extends http.BaseClient {
  final Map<String, Queue<_RequestHandler>> _handlers =
      <String, Queue<_RequestHandler>>{};

  void enqueue(String method, String path, _RequestHandler handler) {
    final key = _requestKey(method, path);
    final queue = _handlers.putIfAbsent(key, Queue<_RequestHandler>.new);
    queue.add(handler);
  }

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    final key = _requestKey(request.method, request.url.path);
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
