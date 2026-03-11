import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'models.dart';

class ProductCatalogController extends ChangeNotifier {
  ProductCatalogController({http.Client? client})
    : _client = client ?? http.Client(),
      _products = const <Product>[];

  final http.Client _client;
  List<Product> _products;
  final Map<String, Product> _productsById = <String, Product>{};
  bool _isLoading = false;
  bool _hasLoaded = false;
  bool _isUsingFallback = false;
  String? _errorMessage;

  List<Product> get products => _products;
  bool get isLoading => _isLoading;
  bool get isUsingFallback => _isUsingFallback;
  String? get errorMessage => _errorMessage;

  Product? findById(String productId) => _productsById[productId];

  Future<void> load({bool forceRefresh = false}) async {
    if (_isLoading) {
      return;
    }
    if (_hasLoaded && !forceRefresh) {
      return;
    }

    if (!DealerApiConfig.isConfigured) {
      _replaceProducts(const <Product>[]);
      _isUsingFallback = false;
      _errorMessage = 'Chua cau hinh API backend.';
      _hasLoaded = true;
      notifyListeners();
      return;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _client.get(
        Uri.parse(DealerApiConfig.resolveUrl('/api/product/products')),
        headers: const <String, String>{'Accept': 'application/json'},
      );
      final payload = _decodePayload(response.body);
      if (response.statusCode >= 400) {
        throw Exception(_extractErrorMessage(payload));
      }
      final data = payload['data'];
      if (data is! List) {
        throw Exception('Invalid product payload');
      }
      final remoteProducts = data
          .whereType<Map<String, dynamic>>()
          .map(_mapSummaryProduct)
          .toList(growable: false);

      _replaceProducts(remoteProducts);
      _isUsingFallback = false;
      _errorMessage = null;
      _hasLoaded = true;
    } catch (error) {
      _isUsingFallback = false;
      _errorMessage = error.toString();
      _hasLoaded = true;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Product> fetchDetail(String productId) async {
    final fallbackProduct =
        findById(productId) ??
        (throw StateError('Product $productId not found in catalog'));

    if (!DealerApiConfig.isConfigured) {
      throw StateError('Backend API is not configured.');
    }

    try {
      final response = await _client.get(
        Uri.parse(DealerApiConfig.resolveUrl('/api/product/$productId')),
        headers: const <String, String>{'Accept': 'application/json'},
      );
      final payload = _decodePayload(response.body);
      if (response.statusCode >= 400) {
        throw Exception(_extractErrorMessage(payload));
      }
      final data = payload['data'];
      if (data is! Map<String, dynamic>) {
        throw Exception('Invalid product detail payload');
      }
      final detailedProduct = _mapDetailProduct(data);
      _upsertProduct(detailedProduct);
      return detailedProduct;
    } catch (_) {
      if (fallbackProduct.descriptions.isNotEmpty ||
          fallbackProduct.videos.isNotEmpty ||
          fallbackProduct.specifications.isNotEmpty) {
        return fallbackProduct;
      }
      rethrow;
    }
  }

  void _upsertProduct(Product product) {
    final nextProducts = List<Product>.of(_products, growable: true);
    final index = nextProducts.indexWhere((item) => item.id == product.id);
    final previousName = index >= 0 ? nextProducts[index].name : null;
    if (index >= 0) {
      nextProducts[index] = product;
    } else {
      nextProducts.add(product);
    }
    if (index < 0 || previousName != product.name) {
      nextProducts.sort((a, b) => a.name.compareTo(b.name));
    }
    _replaceProducts(nextProducts);
    notifyListeners();
  }

  void _replaceProducts(Iterable<Product> products) {
    final nextProducts = List<Product>.unmodifiable(products);
    _products = nextProducts;
    _productsById
      ..clear()
      ..addEntries(
        nextProducts.map(
          (product) => MapEntry<String, Product>(product.id, product),
        ),
      );
  }

  Map<String, dynamic> _decodePayload(String body) {
    if (body.trim().isEmpty) {
      return const <String, dynamic>{};
    }
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    return const <String, dynamic>{};
  }

  String _extractErrorMessage(Map<String, dynamic> payload) {
    final error = payload['error']?.toString();
    if (error != null && error.trim().isNotEmpty) {
      return error.trim();
    }
    return 'Không thể tải dữ liệu sản phẩm.';
  }

  Product _mapSummaryProduct(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString().trim() ?? '',
      sku: json['sku']?.toString().trim() ?? '',
      shortDescription: json['shortDescription']?.toString().trim() ?? '',
      price: _parsePrice(json['price']),
      stock: _parseInt(json['stock']),
      warrantyMonths: _parseInt(json['warrantyMonths'], fallback: 12),
      imageUrl: _normalizeString(json['image']),
    );
  }

  Product _mapDetailProduct(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString().trim() ?? '',
      sku: json['sku']?.toString().trim() ?? '',
      shortDescription: json['shortDescription']?.toString().trim() ?? '',
      price: _parsePrice(json['price']),
      stock: _parseInt(json['stock']),
      warrantyMonths: _parseInt(json['warrantyMonths'], fallback: 12),
      imageUrl: _normalizeString(json['image']),
      descriptions: _parseDescriptions(json['descriptions']),
      videos: _parseVideos(json['videos']),
      specifications: _parseSpecifications(json['specifications']),
    );
  }

  List<ProductSpecification> _parseSpecifications(Object? rawValue) {
    final decoded = _decodeJsonArray(rawValue);
    if (decoded.isEmpty && rawValue is String) {
      final mapValue = _decodeJsonMap(rawValue);
      if (mapValue.isNotEmpty) {
        return mapValue.entries
            .map(
              (entry) => ProductSpecification(
                label: entry.key.toString(),
                value: entry.value?.toString() ?? '',
              ),
            )
            .toList(growable: false);
      }
    }
    return decoded
        .whereType<Map<String, dynamic>>()
        .map(
          (item) => ProductSpecification(
            label: item['label']?.toString().trim() ?? '',
            value: item['value']?.toString().trim() ?? '',
          ),
        )
        .where((item) => item.label.isNotEmpty || item.value.isNotEmpty)
        .toList(growable: false);
  }

  List<ProductVideoItem> _parseVideos(Object? rawValue) {
    return _decodeJsonArray(rawValue)
        .whereType<Map<String, dynamic>>()
        .map((item) {
          final url =
              item['url']?.toString().trim() ??
              item['videoUrl']?.toString().trim() ??
              '';
          return ProductVideoItem(
            title: item['title']?.toString().trim() ?? '',
            url: url,
            description:
                item['description']?.toString().trim() ??
                item['descriptions']?.toString().trim(),
            type: item['type']?.toString().trim() ?? 'tutorial',
          );
        })
        .where(
          (item) =>
              item.title.isNotEmpty ||
              item.url.isNotEmpty ||
              (item.description?.isNotEmpty ?? false),
        )
        .toList(growable: false);
  }

  List<ProductDescriptionItem> _parseDescriptions(Object? rawValue) {
    return _decodeJsonArray(rawValue)
        .whereType<Map<String, dynamic>>()
        .map((item) {
          final type = _parseDescriptionType(item['type']?.toString());
          final gallerySource = item['gallery'] ?? item['urls'];
          final gallery = <String>[];
          if (gallerySource is List) {
            for (final entry in gallerySource) {
              final nextValue = entry is Map<String, dynamic>
                  ? _normalizeString(entry['url'])
                  : _normalizeString(entry);
              if (nextValue != null && nextValue.trim().isNotEmpty) {
                gallery.add(nextValue);
              }
            }
          }

          return ProductDescriptionItem(
            type: type,
            text: _normalizeString(item['text']),
            url:
                _normalizeString(item['url']) ??
                _normalizeString(item['imageUrl']) ??
                _normalizeString(item['videoUrl']),
            caption: _normalizeString(item['caption']),
            gallery: gallery,
          );
        })
        .where((item) {
          final hasText = item.text?.trim().isNotEmpty ?? false;
          final hasUrl = item.url?.trim().isNotEmpty ?? false;
          final hasCaption = item.caption?.trim().isNotEmpty ?? false;
          return hasText || hasUrl || hasCaption || item.gallery.isNotEmpty;
        })
        .toList(growable: false);
  }

  ProductDescriptionType _parseDescriptionType(String? rawType) {
    switch ((rawType ?? '').trim().toLowerCase()) {
      case 'title':
        return ProductDescriptionType.title;
      case 'image':
        return ProductDescriptionType.image;
      case 'gallery':
        return ProductDescriptionType.gallery;
      case 'video':
        return ProductDescriptionType.video;
      case 'description':
      default:
        return ProductDescriptionType.description;
    }
  }

  List<dynamic> _decodeJsonArray(Object? rawValue) {
    if (rawValue is List) {
      return rawValue;
    }
    if (rawValue is! String || rawValue.trim().isEmpty) {
      return const <dynamic>[];
    }
    try {
      final decoded = jsonDecode(rawValue);
      if (decoded is List) {
        return decoded;
      }
    } catch (_) {
      // ignore invalid json
    }
    return const <dynamic>[];
  }

  Map<String, dynamic> _decodeJsonMap(String rawValue) {
    if (rawValue.trim().isEmpty) {
      return const <String, dynamic>{};
    }
    try {
      final decoded = jsonDecode(rawValue);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
    } catch (_) {
      // ignore invalid json
    }
    return const <String, dynamic>{};
  }

  String? _normalizeString(Object? value) {
    final text = value?.toString().trim() ?? '';
    return text.isEmpty ? null : text;
  }

  int _parseInt(Object? value, {int fallback = 0}) {
    if (value is int) {
      return value;
    }
    if (value is double) {
      return value.round();
    }
    return int.tryParse(value?.toString() ?? '') ?? fallback;
  }

  int _parsePrice(Object? value) {
    if (value is int) {
      return value;
    }
    if (value is double) {
      return value.round();
    }
    return double.tryParse(value?.toString() ?? '')?.round() ?? 0;
  }

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }
}

class ProductCatalogScope extends InheritedNotifier<ProductCatalogController> {
  const ProductCatalogScope({
    super.key,
    required ProductCatalogController controller,
    required super.child,
  }) : super(notifier: controller);

  static ProductCatalogController? maybeOf(BuildContext context) {
    return context
        .dependOnInheritedWidgetOfExactType<ProductCatalogScope>()
        ?.notifier;
  }

  static ProductCatalogController of(BuildContext context) {
    final scope = context
        .dependOnInheritedWidgetOfExactType<ProductCatalogScope>();
    assert(scope != null, 'ProductCatalogScope not found in widget tree.');
    return scope!.notifier!;
  }
}
