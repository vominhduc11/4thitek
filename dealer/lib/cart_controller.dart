import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'dealer_profile_storage.dart';
import 'models.dart';

class CartController extends ChangeNotifier {
  CartController({
    Product? Function(String productId)? productLookup,
    AuthStorage? authStorage,
    http.Client? client,
  }) : _productLookup = productLookup {
    _authStorage = authStorage ?? AuthStorage();
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: client ?? http.Client(),
    );
  }

  static const Duration _remoteRequestTimeout = Duration(seconds: 12);

  final Product? Function(String productId)? _productLookup;
  late final AuthStorage _authStorage;
  late final http.Client _client;
  final Map<String, CartItem> _items = <String, CartItem>{};
  final Map<String, CartItem> _lastSyncedItems = <String, CartItem>{};
  final Map<String, int> _pendingSyncCounts = <String, int>{};
  List<BulkDiscountRule> _discountRules = const <BulkDiscountRule>[];
  _CartPricingSummary? _pricingSummary;
  _CartPricingSummary? _lastSyncedPricingSummary;
  List<CartItem> _sortedItemsCache = const <CartItem>[];
  bool _itemsCacheDirty = true;
  int _vatPercent = kVatPercent;
  Future<void> _remoteSyncQueue = Future<void>.value();
  int _localMutationVersion = 0;

  Future<void> load() async {
    final loadMutationVersion = _localMutationVersion;
    await _loadVatPercent(notify: false);
    await _loadRemoteDiscountRules(notify: false);
    final loadedRemote = await _loadRemoteCart(
      notify: false,
      expectedMutationVersion: loadMutationVersion,
    );
    if (loadedRemote && loadMutationVersion == _localMutationVersion) {
      await _loadRemotePricingSummary(
        notify: false,
        expectedMutationVersion: loadMutationVersion,
      );
    }
    if (!loadedRemote && loadMutationVersion == _localMutationVersion) {
      _replaceItems(const <CartItem>[]);
      _replaceLastSyncedItems(const <CartItem>[]);
      _clearPricingSummary(clearLastSynced: true);
    }
    notifyListeners();
  }

  List<CartItem> get items {
    if (_itemsCacheDirty) {
      final list = _items.values.toList(growable: false)
        ..sort((a, b) => a.product.name.compareTo(b.product.name));
      _sortedItemsCache = List<CartItem>.unmodifiable(list);
      _itemsCacheDirty = false;
    }
    return _sortedItemsCache;
  }

  bool get isEmpty => _items.isEmpty;

  bool get isSyncing => _pendingSyncCounts.isNotEmpty;

  int get totalItems {
    return _items.values.fold<int>(0, (total, item) => total + item.quantity);
  }

  int get subtotal {
    final pricingSummary = _pricingSummary;
    if (pricingSummary != null) {
      return pricingSummary.subtotal;
    }
    return _items.values.fold<int>(
      0,
      (total, item) => total + item.quantity * item.product.price,
    );
  }

  List<BulkDiscountRule> get discountRules =>
      List<BulkDiscountRule>.unmodifiable(_discountRules);

  BulkDiscountTarget? get nextDiscountTarget => nextBulkDiscountTargetForCart(
    items: _items.values,
    rules: _discountRules,
  );

  int get discountPercent =>
      _pricingSummary?.discountPercent ??
      bulkDiscountPercentForCart(items: _items.values, rules: _discountRules);

  int get discountAmount =>
      _pricingSummary?.discountAmount ??
      bulkDiscountAmountForCart(items: _items.values, rules: _discountRules);

  int get totalAfterDiscount =>
      _pricingSummary?.totalAfterDiscount ?? subtotal - discountAmount;

  int get vatPercent => _pricingSummary?.vatPercent ?? _vatPercent;

  int get vatAmount =>
      _pricingSummary?.vatAmount ??
      (totalAfterDiscount * vatPercent / 100).round();

  int get total =>
      _pricingSummary?.totalAmount ?? totalAfterDiscount + vatAmount;

  int quantityFor(String productId) {
    return _items[productId]?.quantity ?? 0;
  }

  bool isOutOfStock(Product product) {
    return product.stock <= 0;
  }

  bool hasReachedCartLimit(Product product) {
    return !isOutOfStock(product) && remainingStockFor(product) <= 0;
  }

  bool isSyncingProduct(String productId) {
    return (_pendingSyncCounts[productId] ?? 0) > 0;
  }

  int remainingStockFor(Product product) {
    final remaining = product.stock - quantityFor(product.id);
    if (remaining <= 0) {
      return 0;
    }
    return remaining;
  }

  int suggestedAddQuantity(Product product) {
    if (isOutOfStock(product)) {
      return 0;
    }
    final remaining = remainingStockFor(product);
    if (remaining <= 0) {
      return 0;
    }
    const step = 1;
    return remaining < step ? remaining : step;
  }

  bool canAdd(Product product, {int? quantity}) {
    final requested = quantity ?? suggestedAddQuantity(product);
    if (requested <= 0 || isOutOfStock(product)) {
      return false;
    }
    return remainingStockFor(product) >= requested;
  }

  Future<bool> add(Product product, {int? quantity}) async {
    final requested = quantity ?? suggestedAddQuantity(product);
    if (!canAdd(product, quantity: requested)) {
      return false;
    }
    return setQuantity(product, quantityFor(product.id) + requested);
  }

  Future<bool> addWithApiSimulation(Product product, {int? quantity}) async {
    return add(product, quantity: quantity);
  }

  Future<bool> increase(String productId) async {
    final current = _items[productId];
    if (current == null) {
      return false;
    }
    final addQuantity = suggestedAddQuantity(current.product);
    if (addQuantity <= 0) {
      return false;
    }
    return setQuantity(current.product, current.quantity + addQuantity);
  }

  Future<bool> decrease(String productId) async {
    final current = _items[productId];
    if (current == null) {
      return false;
    }
    return setQuantity(current.product, current.quantity - 1);
  }

  Future<bool> remove(String productId) async {
    final current = _items[productId];
    if (current == null) {
      return true;
    }
    return _commitChange(
      affectedProductIds: <String>[productId],
      applyLocal: () => _items.remove(productId),
      remoteSync: () async {
        await _removeRemoteCartItem(productId);
        return null;
      },
    );
  }

  Future<bool> setQuantity(Product product, int quantity) async {
    if (quantity <= 0) {
      return remove(product.id);
    }

    final maxQty = product.stock;
    const minQty = 1;
    var next = quantity;
    if (next > maxQty) next = maxQty;
    if (next < minQty) next = minQty;

    return _commitChange(
      affectedProductIds: <String>[product.id],
      applyLocal: () {
        _items[product.id] = CartItem(product: product, quantity: next);
      },
      remoteSync: () => _upsertRemoteCartItem(product, next),
    );
  }

  Future<bool> clear({
    bool syncRemote = true,
    bool rollbackOnFailure = true,
  }) async {
    final affectedProductIds = _items.keys.toList(growable: false);
    if (_items.isEmpty) {
      if (!syncRemote || !await _canUseRemoteApi()) {
        return true;
      }
      try {
        await _clearRemoteCart();
        return true;
      } catch (_) {
        return !rollbackOnFailure;
      }
    }

    return _commitChange(
      affectedProductIds: affectedProductIds,
      applyLocal: _items.clear,
      remoteSync: syncRemote
          ? () async {
              await _clearRemoteCart();
              return null;
            }
          : null,
      rollbackOnFailure: rollbackOnFailure,
    );
  }

  Future<bool> _loadRemoteCart({
    bool notify = true,
    int? expectedMutationVersion,
  }) async {
    final token = await _readAccessToken();
    if (token == null) {
      return false;
    }

    try {
      final response = await _client
          .get(
            DealerApiConfig.resolveApiUri('/dealer/cart'),
            headers: _authorizedHeaders(token),
          )
          .timeout(_remoteRequestTimeout);
      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        throw Exception(_extractErrorMessage(payload));
      }
      final data = payload['data'];
      if (data is! List) {
        throw Exception('Invalid cart payload');
      }

      final nextItems = <CartItem>[];
      for (final entry in data) {
        if (entry is! Map<String, dynamic>) {
          continue;
        }
        final item = _mapRemoteCartItem(entry);
        if (item != null) {
          nextItems.add(item);
        }
      }
      if (expectedMutationVersion != null &&
          expectedMutationVersion != _localMutationVersion) {
        return true;
      }
      _replaceItems(nextItems);
      _replaceLastSyncedItems(nextItems);
      _clearPricingSummary(clearLastSynced: true);
      if (notify) {
        notifyListeners();
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> _loadRemotePricingSummary({
    bool notify = true,
    int? expectedMutationVersion,
  }) async {
    final token = await _readAccessToken();
    if (token == null) {
      _clearPricingSummary(clearLastSynced: true);
      return false;
    }

    try {
      final response = await _client
          .get(
            DealerApiConfig.resolveApiUri('/dealer/cart/summary'),
            headers: _authorizedHeaders(token),
          )
          .timeout(_remoteRequestTimeout);
      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        throw Exception(_extractErrorMessage(payload));
      }
      final data = payload['data'];
      if (data is! Map<String, dynamic>) {
        throw Exception('Invalid cart pricing summary payload');
      }
      final nextSummary = _mapPricingSummary(data);
      if (expectedMutationVersion != null &&
          expectedMutationVersion != _localMutationVersion) {
        return true;
      }
      _setPricingSummary(nextSummary, alsoSetLastSynced: true);
      if (notify) {
        notifyListeners();
      }
      return true;
    } catch (_) {
      if (expectedMutationVersion == null ||
          expectedMutationVersion == _localMutationVersion) {
        _clearPricingSummary(clearLastSynced: true);
        if (notify) {
          notifyListeners();
        }
      }
      return false;
    }
  }

  Future<bool> _loadRemoteDiscountRules({bool notify = true}) async {
    final token = await _readAccessToken();
    if (token == null) {
      _discountRules = const <BulkDiscountRule>[];
      return false;
    }

    try {
      final response = await _client
          .get(
            DealerApiConfig.resolveApiUri('/dealer/discount-rules'),
            headers: _authorizedHeaders(token),
          )
          .timeout(_remoteRequestTimeout);
      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        throw Exception(_extractErrorMessage(payload));
      }
      final data = payload['data'];
      if (data is! List) {
        throw Exception('Invalid discount rules payload');
      }
      _discountRules = data
          .whereType<Map<String, dynamic>>()
          .map(_mapDiscountRule)
          .toList(growable: false);
      if (notify) {
        notifyListeners();
      }
      return true;
    } catch (_) {
      _discountRules = const <BulkDiscountRule>[];
      if (notify) {
        notifyListeners();
      }
      return false;
    }
  }

  Future<void> _loadVatPercent({bool notify = true}) async {
    final token = await _readAccessToken();
    if (token == null) {
      final cachedProfile = await loadCachedDealerProfile();
      _setVatPercent(
        _normalizeVatPercent(cachedProfile?.vatPercent),
        notify: notify,
      );
      return;
    }

    try {
      final response = await _client
          .get(
            DealerApiConfig.resolveApiUri('/dealer/profile'),
            headers: _authorizedHeaders(token),
          )
          .timeout(_remoteRequestTimeout);
      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        throw Exception(_extractErrorMessage(payload));
      }
      final data = payload['data'];
      if (data is Map<String, dynamic>) {
        _setVatPercent(
          _normalizeVatPercent(
            _parseInt(data['vatPercent'], fallback: kVatPercent),
          ),
          notify: notify,
        );
      }
    } catch (_) {
      final cachedProfile = await loadCachedDealerProfile();
      if (cachedProfile != null) {
        _setVatPercent(
          _normalizeVatPercent(cachedProfile.vatPercent),
          notify: notify,
        );
      }
    }
  }

  Future<bool> _commitChange({
    Iterable<String> affectedProductIds = const <String>[],
    required void Function() applyLocal,
    Future<CartItem?> Function()? remoteSync,
    bool rollbackOnFailure = true,
  }) async {
    applyLocal();
    _clearActivePricingSummary();
    final localSnapshot = _copyItems(_items);
    final mutationVersion = ++_localMutationVersion;
    _markItemsDirty();
    notifyListeners();

    if (remoteSync == null) {
      return true;
    }
    if (!await _canUseRemoteApi()) {
      if (rollbackOnFailure) {
        _restoreLastSyncedItems();
      }
      return false;
    }

    final result = Completer<bool>();
    final pendingProductIds = affectedProductIds.toSet();
    if (pendingProductIds.isNotEmpty) {
      _updatePendingSyncCounts(pendingProductIds, delta: 1);
      notifyListeners();
    }

    _remoteSyncQueue = _remoteSyncQueue
        .catchError((Object e) {
          debugPrint('CartController: sync queue error: $e');
        })
        .then((_) async {
          try {
            final remoteItem = await remoteSync();
            final syncedSnapshot = _snapshotWithRemoteItem(
              localSnapshot,
              remoteItem,
            );
            _replaceLastSyncedItemsFromMap(syncedSnapshot);
            _lastSyncedPricingSummary = null;
            if (remoteItem != null &&
                mutationVersion == _localMutationVersion) {
              _items[remoteItem.product.id] = remoteItem;
              _markItemsDirty();
            }
            await _loadRemotePricingSummary(
              notify: mutationVersion == _localMutationVersion,
              expectedMutationVersion: mutationVersion,
            );
            result.complete(true);
          } catch (_) {
            if (rollbackOnFailure && mutationVersion == _localMutationVersion) {
              _restoreLastSyncedItems();
            }
            result.complete(false);
          } finally {
            if (pendingProductIds.isNotEmpty) {
              _updatePendingSyncCounts(pendingProductIds, delta: -1);
              notifyListeners();
            }
          }
        });
    return result.future;
  }

  Future<CartItem?> _upsertRemoteCartItem(Product product, int quantity) async {
    final token = await _requireAccessToken();
    final productId = int.tryParse(product.id);
    if (productId == null) {
      throw StateError('Invalid product id: ${product.id}');
    }

    final response = await _client
        .put(
          DealerApiConfig.resolveApiUri('/dealer/cart/items'),
          headers: _authorizedJsonHeaders(token),
          body: jsonEncode(<String, dynamic>{
            'productId': productId,
            'quantity': quantity,
          }),
        )
        .timeout(_remoteRequestTimeout);

    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw Exception(_extractErrorMessage(payload));
    }

    final data = payload['data'];
    if (data is Map<String, dynamic>) {
      return _mapRemoteCartItem(data);
    }
    return CartItem(product: product, quantity: quantity);
  }

  Future<void> _removeRemoteCartItem(String productId) async {
    final token = await _requireAccessToken();
    final numericProductId = int.tryParse(productId);
    if (numericProductId == null) {
      throw StateError('Invalid product id: $productId');
    }

    final response = await _client
        .delete(
          DealerApiConfig.resolveApiUri('/dealer/cart/items/$numericProductId'),
          headers: _authorizedHeaders(token),
        )
        .timeout(_remoteRequestTimeout);
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw Exception(_extractErrorMessage(payload));
    }
  }

  Future<void> _clearRemoteCart() async {
    final token = await _requireAccessToken();
    final response = await _client
        .delete(
          DealerApiConfig.resolveApiUri('/dealer/cart'),
          headers: _authorizedHeaders(token),
        )
        .timeout(_remoteRequestTimeout);
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw Exception(_extractErrorMessage(payload));
    }
  }

  Future<bool> _canUseRemoteApi() async {
    return await _readAccessToken() != null;
  }

  Future<String?> _readAccessToken() async {
    if (!DealerApiConfig.isConfigured) {
      return null;
    }
    final token = await _authStorage.readAccessToken();
    if (token == null || token.trim().isEmpty) {
      return null;
    }
    return token.trim();
  }

  Future<String> _requireAccessToken() async {
    final token = await _readAccessToken();
    if (token == null) {
      throw StateError('Unauthenticated request');
    }
    return token;
  }

  Map<String, dynamic> _decodeBody(String body) {
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
    return 'Không thể đồng bộ giỏ hàng.';
  }

  Map<String, String> _authorizedHeaders(String token) {
    return <String, String>{
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Map<String, String> _authorizedJsonHeaders(String token) {
    return <String, String>{
      ...DealerApiConfig.jsonHeaders,
      'Authorization': 'Bearer $token',
    };
  }

  CartItem? _mapRemoteCartItem(Map<String, dynamic> json) {
    final productId = json['productId']?.toString();
    final quantity = _parseInt(json['quantity'], fallback: 0);
    if (productId == null || productId.isEmpty || quantity <= 0) {
      return null;
    }

    final fallback = _findProductById(productId);
    final imageUrl = _normalizeString(json['image']) ?? fallback?.imageUrl;
    final price = _parsePrice(
      json['priceSnapshot'] ?? json['retailPrice'],
      fallback: fallback?.price ?? 0,
    );
    final product = Product(
      id: productId,
      name:
          _normalizeString(json['productName']) ?? fallback?.name ?? 'Product',
      sku: _normalizeString(json['productSku']) ?? fallback?.sku ?? productId,
      shortDescription: fallback?.shortDescription ?? '',
      price: price,
      stock: fallback?.stock ?? quantity,
      warrantyMonths: fallback?.warrantyMonths ?? 12,
      imageUrl: imageUrl,
      descriptions: fallback?.descriptions ?? const <ProductDescriptionItem>[],
      videos: fallback?.videos ?? const <ProductVideoItem>[],
      specifications:
          fallback?.specifications ?? const <ProductSpecification>[],
    );
    return CartItem(product: product, quantity: quantity);
  }

  BulkDiscountRule _mapDiscountRule(Map<String, dynamic> json) {
    final fromQuantity =
        _parseNullableInt(json['fromQuantity']) ??
        _parseNullableInt(json['minQuantity']) ??
        0;
    return BulkDiscountRule(
      fromQuantity: fromQuantity,
      toQuantity:
          _parseNullableInt(json['toQuantity']) ??
          _parseNullableInt(json['maxQuantity']),
      percent: _parseInt(json['percent']),
      rangeLabel: _normalizeString(json['rangeLabel']),
    );
  }

  _CartPricingSummary _mapPricingSummary(Map<String, dynamic> json) {
    return _CartPricingSummary(
      subtotal: _parsePrice(json['subtotal']),
      discountPercent: _parseInt(json['discountPercent']),
      discountAmount: _parsePrice(json['discountAmount']),
      totalAfterDiscount: _parsePrice(json['totalAfterDiscount']),
      vatPercent: _parseInt(json['vatPercent'], fallback: kVatPercent),
      vatAmount: _parsePrice(json['vatAmount']),
      totalAmount: _parsePrice(json['totalAmount']),
    );
  }

  Product? _findProductById(String productId) {
    return _productLookup?.call(productId);
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

  int? _parseNullableInt(Object? value) {
    if (value == null) {
      return null;
    }
    if (value is int) {
      return value;
    }
    if (value is double) {
      return value.round();
    }
    return int.tryParse(value.toString());
  }

  int _parsePrice(Object? value, {int fallback = 0}) {
    if (value is int) {
      return value;
    }
    if (value is double) {
      return value.round();
    }
    return double.tryParse(value?.toString() ?? '')?.round() ?? fallback;
  }

  String? _normalizeString(Object? value) {
    final normalized = value?.toString().trim() ?? '';
    return normalized.isEmpty ? null : normalized;
  }

  int _normalizeVatPercent(int? value) {
    if (value == null) {
      return kVatPercent;
    }
    if (value < 0) {
      return 0;
    }
    if (value > 100) {
      return 100;
    }
    return value;
  }

  void _setVatPercent(int nextVatPercent, {required bool notify}) {
    if (nextVatPercent == _vatPercent) {
      return;
    }
    _vatPercent = nextVatPercent;
    if (notify) {
      notifyListeners();
    }
  }

  void _replaceItems(Iterable<CartItem> items) {
    _items
      ..clear()
      ..addEntries(
        items.map((item) => MapEntry<String, CartItem>(item.product.id, item)),
      );
    _markItemsDirty();
  }

  void _replaceLastSyncedItems(Iterable<CartItem> items) {
    _lastSyncedItems
      ..clear()
      ..addEntries(
        items.map((item) => MapEntry<String, CartItem>(item.product.id, item)),
      );
  }

  void _replaceLastSyncedItemsFromMap(Map<String, CartItem> items) {
    _lastSyncedItems
      ..clear()
      ..addAll(items);
  }

  Map<String, CartItem> _copyItems(Map<String, CartItem> items) {
    return Map<String, CartItem>.from(items);
  }

  Map<String, CartItem> _snapshotWithRemoteItem(
    Map<String, CartItem> snapshot,
    CartItem? remoteItem,
  ) {
    if (remoteItem == null) {
      return snapshot;
    }
    return <String, CartItem>{...snapshot, remoteItem.product.id: remoteItem};
  }

  void _restoreLastSyncedItems() {
    _items
      ..clear()
      ..addAll(_lastSyncedItems);
    _pricingSummary = _lastSyncedPricingSummary;
    _markItemsDirty();
    notifyListeners();
  }

  void _setPricingSummary(
    _CartPricingSummary? summary, {
    bool alsoSetLastSynced = false,
  }) {
    _pricingSummary = summary;
    if (alsoSetLastSynced) {
      _lastSyncedPricingSummary = summary;
    }
  }

  void _clearActivePricingSummary() {
    _pricingSummary = null;
  }

  void _clearPricingSummary({bool clearLastSynced = false}) {
    _pricingSummary = null;
    if (clearLastSynced) {
      _lastSyncedPricingSummary = null;
    }
  }

  void _updatePendingSyncCounts(Set<String> productIds, {required int delta}) {
    for (final productId in productIds) {
      final nextCount = (_pendingSyncCounts[productId] ?? 0) + delta;
      if (nextCount <= 0) {
        _pendingSyncCounts.remove(productId);
      } else {
        _pendingSyncCounts[productId] = nextCount;
      }
    }
  }

  void _markItemsDirty() {
    _itemsCacheDirty = true;
  }

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }
}

class _CartPricingSummary {
  const _CartPricingSummary({
    required this.subtotal,
    required this.discountPercent,
    required this.discountAmount,
    required this.totalAfterDiscount,
    required this.vatPercent,
    required this.vatAmount,
    required this.totalAmount,
  });

  final int subtotal;
  final int discountPercent;
  final int discountAmount;
  final int totalAfterDiscount;
  final int vatPercent;
  final int vatAmount;
  final int totalAmount;
}

class CartScope extends InheritedNotifier<CartController> {
  const CartScope({
    super.key,
    required CartController controller,
    required super.child,
  }) : super(notifier: controller);

  static CartController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<CartScope>();
    assert(scope != null, 'CartScope not found in widget tree.');
    return scope!.notifier!;
  }
}
