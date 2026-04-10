import 'dart:convert';

import 'package:dealer_hub/product_catalog_controller.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

void main() {
  test('resolveProductCatalogMessage maps sync failure in English', () {
    expect(
      resolveProductCatalogMessage(
        productCatalogMessageToken(ProductCatalogMessageCode.syncFailed),
        isEnglish: true,
      ),
      'Unable to load product data.',
    );
  });

  test('resolveProductCatalogMessage maps sync failure in Vietnamese', () {
    expect(
      resolveProductCatalogMessage(
        productCatalogMessageToken(ProductCatalogMessageCode.syncFailed),
        isEnglish: false,
      ),
      'Không thể tải dữ liệu sản phẩm.',
    );
  });

  test('ProductCatalogController stores tokenized load error for empty 500 body', () async {
    final controller = ProductCatalogController(
      client: _FakeClient((request) async {
        return _jsonResponse(statusCode: 500, body: const <String, dynamic>{});
      }),
    );

    await controller.load();

    expect(
      controller.errorMessage,
      productCatalogMessageToken(ProductCatalogMessageCode.syncFailed),
    );
  });

  test('ProductCatalogController stores tokenized invalid paginated payload error', () async {
    final controller = ProductCatalogController(
      client: _FakeClient((request) async {
        return _jsonResponse(
          statusCode: 200,
          body: <String, dynamic>{
            'data': <dynamic>['unexpected'],
          },
        );
      }),
    );

    await controller.load();

    expect(
      controller.errorMessage,
      productCatalogMessageToken(
        ProductCatalogMessageCode.invalidPaginatedPayload,
      ),
    );
  });

  test('ProductCatalogController fetchDetail throws tokenized invalid detail payload error', () async {
    final controller = ProductCatalogController(
      client: _FakeClient((request) async {
        if (request.url.path.endsWith('/api/v1/product/products/page')) {
          return _jsonResponse(
            statusCode: 200,
            body: <String, dynamic>{
              'data': <String, dynamic>{
                'items': <Map<String, dynamic>>[
                  <String, dynamic>{
                    'id': '1',
                    'name': 'Product A',
                    'sku': 'SKU-1',
                    'price': 1000,
                    'stock': 10,
                    'warrantyMonths': 12,
                  },
                ],
                'page': 0,
                'totalPages': 1,
              },
            },
          );
        }
        return _jsonResponse(
          statusCode: 200,
          body: <String, dynamic>{
            'data': <dynamic>['unexpected'],
          },
        );
      }),
    );

    await controller.load();

    expect(
      controller.fetchDetail('1'),
      throwsA(
        isA<ProductCatalogException>().having(
          (error) => error.message,
          'message',
          productCatalogMessageToken(
            ProductCatalogMessageCode.invalidProductDetailPayload,
          ),
        ),
      ),
    );
  });

  test('ProductCatalogController keeps fresh summary stock when detail payload is stale', () async {
    final controller = ProductCatalogController(
      client: _FakeClient((request) async {
        if (request.url.path.endsWith('/api/v1/product/products/page')) {
          return _jsonResponse(
            statusCode: 200,
            body: <String, dynamic>{
              'data': <String, dynamic>{
                'items': <Map<String, dynamic>>[
                  <String, dynamic>{
                    'id': '1',
                    'name': 'Product A',
                    'sku': 'SKU-1',
                    'price': 1000,
                    'stock': 0,
                    'warrantyMonths': 12,
                  },
                ],
                'page': 0,
                'totalPages': 1,
              },
            },
          );
        }
        return _jsonResponse(
          statusCode: 200,
          body: <String, dynamic>{
            'data': <String, dynamic>{
              'id': '1',
              'name': 'Product A',
              'sku': 'SKU-1',
              'shortDescription': 'Detail copy',
              'price': 1000,
              'stock': 2,
              'warrantyMonths': 12,
              'descriptions': <Map<String, dynamic>>[
                <String, dynamic>{
                  'type': 'description',
                  'text': 'Detailed body',
                },
              ],
            },
          },
        );
      }),
    );

    await controller.load();
    final product = await controller.fetchDetail('1');

    expect(product.stock, 0);
    expect(product.description, 'Detailed body');
  });
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
