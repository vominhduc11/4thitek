import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'api_client_helpers.dart';
import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'models.dart';
import 'utils.dart';

part 'order_controller_messages.dart';

class OrderController extends ChangeNotifier {
  static const Duration _requestTimeout = Duration(seconds: 15);

  OrderController({
    Product? Function(String productId)? productLookup,
    AuthStorage? authStorage,
    http.Client? client,
  }) : _orders = <Order>[],
       _paymentHistory = <OrderPaymentRecord>[],
       _productLookup = productLookup {
    _authStorage = authStorage ?? AuthStorage();
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: client ?? http.Client(),
    );
  }

  final List<Order> _orders;
  final Map<String, Order> _orderById = <String, Order>{};
  final List<OrderPaymentRecord> _paymentHistory;
  final Product? Function(String productId)? _productLookup;
  late final AuthStorage _authStorage;
  late final http.Client _client;
  final Map<String, int> _remoteOrderIds = <String, int>{};
  final Map<int, String> _remoteOrderCodes = <int, String>{};
  final Map<String, ({int amount, DateTime at})> _lastPayment =
      <String, ({int amount, DateTime at})>{};
  List<Order> _sortedOrdersCache = const <Order>[];
  List<OrderPaymentRecord> _sortedPaymentHistoryCache =
      const <OrderPaymentRecord>[];
  bool _ordersCacheDirty = true;
  bool _paymentHistoryCacheDirty = true;
  bool _isRecordingPayment = false;
  String? _lastActionMessage;
  DateTime? _lastRemoteSyncAt;
  Future<bool>? _remoteOrdersRefreshInFlight;
  int _criticalMutationDepth = 0;
  Completer<void>? _criticalMutationCompleter;

  String? get lastActionMessage => _lastActionMessage;
  DateTime? get lastRemoteSyncAt => _lastRemoteSyncAt;
  Future<void>? get pendingCriticalMutation =>
      _criticalMutationCompleter?.future;
  bool get hasPendingCriticalMutation => _criticalMutationDepth > 0;

  Future<void> load({bool forceRefresh = false}) async {
    _lastActionMessage = null;
    final loadedRemote = await _loadRemoteOrdersAndPayments();
    if (loadedRemote) {
      return;
    }
    if (forceRefresh) {
      _remoteOrderIds.clear();
      _remoteOrderCodes.clear();
      _replaceOrders(const <Order>[]);
      _replacePaymentHistory(const <OrderPaymentRecord>[]);
      notifyListeners();
    }
  }

  Future<void> refreshSingleOrder(String orderId) async {
    _lastActionMessage = null;
    var remoteOrderId = _remoteOrderIds[orderId];
    if (remoteOrderId == null) {
      final loadedRemote = await _loadRemoteOrdersAndPayments();
      if (!loadedRemote) {
        return;
      }
      remoteOrderId = _remoteOrderIds[orderId];
      if (remoteOrderId == null) {
        return;
      }
    }
    try {
      await _reloadRemoteOrder(remoteOrderId);
      await _reloadRemotePaymentsForOrder(remoteOrderId);
      notifyListeners();
    } catch (_) {
      // Silently ignore; stale data is acceptable here.
    }
  }

  Future<void> refresh() async {
    _lastActionMessage = null;
    final loadedRemote = await _loadRemoteOrdersAndPayments();
    if (!loadedRemote) {
      notifyListeners();
    }
  }

  void applyOrderStatusEvent(
    String orderCode,
    String remoteStatus,
    String remotePaymentStatus, {
    int? paidAmount,
  }) {
    final existing = _orderById[orderCode];
    if (existing == null) {
      return;
    }
    final newStatus = _mapRemoteOrderStatus(remoteStatus);
    final newPaymentStatus = _mapRemotePaymentStatus(remotePaymentStatus);
    final newPaidAmount = paidAmount ?? existing.paidAmount;
    if (existing.status == newStatus &&
        existing.paymentStatus == newPaymentStatus &&
        existing.paidAmount == newPaidAmount) {
      return;
    }
    _replaceOrder(
      existing.copyWith(
        status: newStatus,
        paymentStatus: newPaymentStatus,
        paidAmount: newPaidAmount,
      ),
    );
    notifyListeners();
  }

  Future<void> clearSessionData() async {
    _lastActionMessage = null;
    _lastRemoteSyncAt = null;
    _remoteOrderIds.clear();
    _remoteOrderCodes.clear();
    _replaceOrders(const <Order>[]);
    _replacePaymentHistory(const <OrderPaymentRecord>[]);
    notifyListeners();
  }

  Future<T> _trackCriticalMutation<T>(Future<T> Function() action) async {
    _criticalMutationDepth += 1;
    _criticalMutationCompleter ??= Completer<void>();
    try {
      return await action();
    } finally {
      _criticalMutationDepth -= 1;
      if (_criticalMutationDepth <= 0) {
        _criticalMutationDepth = 0;
        final completer = _criticalMutationCompleter;
        _criticalMutationCompleter = null;
        if (completer != null && !completer.isCompleted) {
          completer.complete();
        }
      }
    }
  }

  List<Order> get orders {
    if (_ordersCacheDirty) {
      final list = List<Order>.from(_orders)
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      _sortedOrdersCache = List<Order>.unmodifiable(list);
      _ordersCacheDirty = false;
    }
    return _sortedOrdersCache;
  }

  List<OrderPaymentRecord> get paymentHistory {
    if (_paymentHistoryCacheDirty) {
      final list = List<OrderPaymentRecord>.from(_paymentHistory)
        ..sort((a, b) => b.paidAt.compareTo(a.paidAt));
      _sortedPaymentHistoryCache = List<OrderPaymentRecord>.unmodifiable(list);
      _paymentHistoryCacheDirty = false;
    }
    return _sortedPaymentHistoryCache;
  }

  bool containsId(String id) {
    return _orders.any((order) => order.id == id);
  }

  Order? findById(String id) {
    for (final order in _orders) {
      if (order.id == id) {
        return order;
      }
    }
    return null;
  }

  int? remoteOrderIdForOrderCode(String orderCode) {
    return _remoteOrderIds[orderCode];
  }

  String? orderCodeForRemoteId(int remoteOrderId) {
    return _remoteOrderCodes[remoteOrderId];
  }

  Future<Order> addOrder(Order order) async {
    return _trackCriticalMutation(() async {
      _lastActionMessage = null;
      if (!await _canUseRemoteApi()) {
        throw OrderControllerException(_unavailableActionMessage());
      }
      try {
        return await _createRemoteOrder(order);
      } catch (error) {
        _lastActionMessage = _normalizeOrderControllerFailure(
          error,
          fallbackCode: OrderMessageCode.invalidCreateOrderPayload,
        );
        rethrow;
      }
    });
  }

  // Dealer-side pre-flight guard. Mirrors backend
  // OrderStatusTransitionPolicy.isDealerTransitionAllowed.
  // Admin-only transitions (pending -> confirmed, confirmed -> shipping,
  // shipping -> completed/cancelled) are intentionally absent because the
  // dealer app has no UI to trigger them.
  // A dealer cannot cancel an order directly. From pending/confirmed the dealer
  // raises a cancel request; an admin then approves or rejects it.
  static const Map<OrderStatus, Set<OrderStatus>> _validTransitions =
      <OrderStatus, Set<OrderStatus>>{
        OrderStatus.pending: {OrderStatus.cancelRequested},
        OrderStatus.confirmed: {OrderStatus.cancelRequested},
        OrderStatus.processing: {},
        OrderStatus.shipping: {},
        OrderStatus.completed: {},
        OrderStatus.cancelRequested: {},
        OrderStatus.cancelRejected: {},
        OrderStatus.cancelled: {},
      };

  Future<bool> updateOrderStatus(
    String orderId,
    OrderStatus status, {
    String? cancelReason,
  }) async {
    _lastActionMessage = null;
    final current = _orderById[orderId];
    if (current == null) {
      return false;
    }

    final allowed = _validTransitions[current.status] ?? const {};
    if (!allowed.contains(status)) {
      return false;
    }

    final remoteOrderId = _remoteOrderIds[orderId];
    if (remoteOrderId != null && await _canUseRemoteApi()) {
      return _trackCriticalMutation(() async {
        try {
          final response = await _withRequestTimeout(
            _client.patch(
              DealerApiConfig.resolveApiUri(
                '/dealer/orders/$remoteOrderId/status',
              ),
              headers: await _authorizedJsonHeaders(),
              body: jsonEncode(<String, dynamic>{
                'status': _toRemoteOrderStatus(status),
                if (cancelReason != null && cancelReason.trim().isNotEmpty)
                  'reason': cancelReason.trim(),
              }),
            ),
          );
          final payload = decodeJsonBody(response.body);
          if (response.statusCode >= 400) {
            throw OrderControllerException(
              _extractErrorMessageWithFallback(
                payload,
                orderControllerMessageToken(
                  OrderMessageCode.statusUpdateFailed,
                ),
              ),
            );
          }
          final data = payload['data'];
          if (data is! Map<String, dynamic>) {
            throw const OrderControllerException(
              'order.message.invalidOrderPayload',
            );
          }
          final nextOrder = _mapRemoteOrder(data);
          _replaceOrder(nextOrder);
          _lastRemoteSyncAt = DateTime.now();
          notifyListeners();
          return true;
        } catch (error) {
          _lastActionMessage = _normalizeOrderControllerFailure(
            error,
            fallbackCode: OrderMessageCode.statusUpdateFailed,
          );
          return false;
        }
      });
    }

    _lastActionMessage = _unavailableActionMessage();
    return false;
  }

  Future<bool> recordPayment({
    required String orderId,
    required int amount,
    required String channel,
    String? note,
    String? proofFileName,
    OrderPaymentMethod? method,
  }) async {
    if (_isRecordingPayment) {
      return false;
    }
    _isRecordingPayment = true;
    try {
      return await _trackCriticalMutation(
        () => _recordPaymentInternal(
          orderId: orderId,
          amount: amount,
          channel: channel,
          note: note,
          proofFileName: proofFileName,
          method: method,
        ),
      );
    } finally {
      _isRecordingPayment = false;
    }
  }

  Future<bool> _recordPaymentInternal({
    required String orderId,
    required int amount,
    required String channel,
    String? note,
    String? proofFileName,
    OrderPaymentMethod? method,
  }) async {
    _lastActionMessage = null;
    final current = _orderById[orderId];
    if (current == null) {
      return false;
    }

    if (current.status == OrderStatus.cancelled) {
      return false;
    }

    final outstanding = current.outstandingAmount;
    if (outstanding <= 0) {
      return false;
    }

    final safeAmount = amount <= 0
        ? 0
        : (amount > outstanding ? outstanding : amount);
    if (safeAmount <= 0) {
      return false;
    }

    final prev = _lastPayment[orderId];
    if (prev != null &&
        prev.amount == safeAmount &&
        DateTime.now().difference(prev.at).inSeconds < 300) {
      return false;
    }
    _lastPayment[orderId] = (amount: safeAmount, at: DateTime.now());

    final remoteOrderId = _remoteOrderIds[orderId];
    if (remoteOrderId != null && await _canUseRemoteApi()) {
      try {
        final response = await _withRequestTimeout(
          _client.post(
            DealerApiConfig.resolveApiUri(
              '/dealer/orders/$remoteOrderId/payments',
            ),
            headers: await _authorizedJsonHeaders(),
            body: jsonEncode(<String, dynamic>{
              'amount': safeAmount,
              if (method != null) 'method': _toRemotePaymentMethod(method),
              'channel': channel.trim(),
              if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
              if (proofFileName != null && proofFileName.trim().isNotEmpty)
                'proofFileName': proofFileName.trim(),
            }),
          ),
        );
        final payload = decodeJsonBody(response.body);
        if (response.statusCode >= 400) {
          throw OrderControllerException(
            _extractErrorMessageWithFallback(
              payload,
              orderControllerMessageToken(OrderMessageCode.paymentFailed),
            ),
          );
        }
        final paymentData = payload['data'];
        final nextPayment = paymentData is Map<String, dynamic>
            ? _mapRemotePayment(paymentData)
            : null;
        await _reloadRemoteOrder(remoteOrderId);
        await _reloadRemotePaymentsForOrder(remoteOrderId);
        if (nextPayment != null &&
            !_paymentHistory.any((item) => item.id == nextPayment.id)) {
          _paymentHistory.add(nextPayment);
          _markPaymentsDirty();
        }
        _lastRemoteSyncAt = DateTime.now();
        notifyListeners();
        return true;
      } catch (error) {
        _lastActionMessage = _normalizeOrderControllerFailure(
          error,
          fallbackCode: OrderMessageCode.paymentFailed,
        );
        return false;
      }
    }

    _lastActionMessage = _unavailableActionMessage();
    return false;
  }

  Future<bool> _loadRemoteOrdersAndPayments() async {
    final inFlight = _remoteOrdersRefreshInFlight;
    if (inFlight != null) {
      return inFlight;
    }

    final refreshFuture = _loadRemoteOrdersAndPaymentsInternal();
    _remoteOrdersRefreshInFlight = refreshFuture;
    refreshFuture.whenComplete(() {
      if (identical(_remoteOrdersRefreshInFlight, refreshFuture)) {
        _remoteOrdersRefreshInFlight = null;
      }
    });
    return refreshFuture;
  }

  Future<bool> _loadRemoteOrdersAndPaymentsInternal() async {
    if (!await _canUseRemoteApi()) {
      return false;
    }

    try {
      final response = await _withRequestTimeout(
        _client.get(
          DealerApiConfig.resolveApiUri('/dealer/orders'),
          headers: await _authorizedHeaders(),
        ),
      );
      final payload = decodeJsonBody(response.body);
      if (response.statusCode >= 400) {
        throw OrderControllerException(
          _extractErrorMessageWithFallback(
            payload,
            orderControllerMessageToken(OrderMessageCode.syncFailed),
          ),
        );
      }
      final data = payload['data'];
      if (data is! List) {
        throw const OrderControllerException(
          'order.message.invalidOrdersPayload',
        );
      }

      final remoteOrders = <Order>[];
      _remoteOrderIds.clear();
      _remoteOrderCodes.clear();
      for (final entry in data.whereType<Map<String, dynamic>>()) {
        remoteOrders.add(_mapRemoteOrder(entry));
      }

      _replaceOrders(remoteOrders);
      _prunePaymentHistoryToKnownOrders();
      _lastRemoteSyncAt = DateTime.now();
      notifyListeners();
      return true;
    } catch (error) {
      _lastActionMessage = _normalizeOrderControllerFailure(
        error,
        fallbackCode: OrderMessageCode.syncFailed,
      );
      return false;
    }
  }

  Future<Order> _createRemoteOrder(Order order) async {
    final headers = await _authorizedJsonHeaders();
    headers['X-Idempotency-Key'] = _generateIdempotencyKey();
    final response = await _withRequestTimeout(
      _client.post(
        DealerApiConfig.resolveApiUri('/dealer/orders'),
        headers: headers,
        body: jsonEncode(<String, dynamic>{
          'paymentMethod': _toRemotePaymentMethod(order.paymentMethod),
          'receiverName': order.receiverName,
          'receiverAddress': order.receiverAddress,
          'receiverPhone': order.receiverPhone,
          if (order.note != null && order.note!.trim().isNotEmpty)
            'note': order.note!.trim(),
          'items': () {
            final mapped = order.items
                .map(
                  (item) => <String, dynamic>{
                    'productId': int.tryParse(item.product.id),
                    'quantity': item.quantity,
                    '_rawId': item.product.id,
                  },
                )
                .toList(growable: false);
            final dropped = mapped
                .where((item) => item['productId'] == null)
                .toList();
            if (dropped.isNotEmpty) {
              debugPrint(
                'OrderController: dropping ${dropped.length} item(s) with non-numeric product ids: '
                '${dropped.map((item) => item['_rawId']).join(', ')}',
              );
            }
            return mapped
                .where((item) => item['productId'] != null)
                .map(
                  (item) => <String, dynamic>{
                    'productId': item['productId'],
                    'quantity': item['quantity'],
                  },
                )
                .toList(growable: false);
          }(),
        }),
      ),
    );
    final payload = decodeJsonBody(response.body);
    if (response.statusCode >= 400) {
      throw OrderControllerException(
        _extractErrorMessageWithFallback(
          payload,
          orderControllerMessageToken(OrderMessageCode.createOrderFailed),
        ),
      );
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw const OrderControllerException(
        'order.message.invalidCreateOrderPayload',
      );
    }
    final remoteOrder = _mapRemoteOrder(data);
    _replaceOrder(remoteOrder);
    await _reloadRemotePaymentsForOrder(_remoteOrderIds[remoteOrder.id]!);
    _lastRemoteSyncAt = DateTime.now();
    notifyListeners();
    return remoteOrder;
  }

  Future<void> _reloadRemoteOrder(int remoteOrderId) async {
    final response = await _withRequestTimeout(
      _client.get(
        DealerApiConfig.resolveApiUri('/dealer/orders/$remoteOrderId'),
        headers: await _authorizedHeaders(),
      ),
    );
    final payload = decodeJsonBody(response.body);
    if (response.statusCode >= 400) {
      throw OrderControllerException(
        _extractErrorMessageWithFallback(
          payload,
          orderControllerMessageToken(OrderMessageCode.invalidOrderPayload),
        ),
      );
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw const OrderControllerException('order.message.invalidOrderPayload');
    }
    _replaceOrder(_mapRemoteOrder(data));
  }

  Future<List<OrderPaymentRecord>?> _fetchRemotePaymentsForOrder(
    int remoteOrderId,
  ) async {
    try {
      final response = await _withRequestTimeout(
        _client.get(
          DealerApiConfig.resolveApiUri(
            '/dealer/orders/$remoteOrderId/payments',
          ),
          headers: await _authorizedHeaders(),
        ),
      );
      final payload = decodeJsonBody(response.body);
      if (response.statusCode >= 400) {
        return null;
      }
      final data = payload['data'];
      if (data is! List) {
        return null;
      }
      return data
          .whereType<Map<String, dynamic>>()
          .map(_mapRemotePayment)
          .toList(growable: false);
    } catch (e) {
      debugPrint('[OrderController] _fetchRemotePaymentsForOrder failed: $e');
      return null;
    }
  }

  Future<bool> _reloadRemotePaymentsForOrder(int remoteOrderId) async {
    final orderCode = _remoteOrderCodes[remoteOrderId];
    if (orderCode == null) {
      return false;
    }
    final payments = await _fetchRemotePaymentsForOrder(remoteOrderId);
    if (payments == null) {
      return false;
    }
    _paymentHistory.removeWhere((payment) => payment.orderId == orderCode);
    _paymentHistory.addAll(payments);
    _markPaymentsDirty();
    return true;
  }

  void _replaceOrder(Order nextOrder) {
    _orderById[nextOrder.id] = nextOrder;
    final index = _orders.indexWhere((order) => order.id == nextOrder.id);
    if (index >= 0) {
      _orders[index] = nextOrder;
    } else {
      _orders.insert(0, nextOrder);
    }
    _markOrdersDirty();
  }

  Order _mapRemoteOrder(Map<String, dynamic> json) {
    if (json['id'] == null) {
      throw const OrderControllerException('order.message.invalidOrderPayload');
    }
    final remoteId = parseInt(json['id']);
    final orderCode = normalizeString(json['orderCode']) ?? remoteId.toString();
    _remoteOrderIds[orderCode] = remoteId;
    _remoteOrderCodes[remoteId] = orderCode;

    final items = (json['items'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map<String, dynamic>>()
        .map(_mapRemoteOrderItem)
        .whereType<OrderLineItem>()
        .toList(growable: false);

    return Order(
      id: orderCode,
      createdAt: parseApiDateTime(json['createdAt']) ?? DateTime.now(),
      completedAt: parseApiDateTime(json['completedAt']),
      status: _mapRemoteOrderStatus(json['status']?.toString()),
      paymentMethod: _mapRemotePaymentMethod(json['paymentMethod']?.toString()),
      paymentStatus: _mapRemotePaymentStatus(json['paymentStatus']?.toString()),
      receiverName: normalizeString(json['receiverName']) ?? '',
      receiverAddress: normalizeString(json['receiverAddress']) ?? '',
      receiverPhone: normalizeString(json['receiverPhone']) ?? '',
      items: items,
      paidAmount: parsePrice(json['paidAmount']),
      note: normalizeString(json['note']),
      carrier: normalizeString(json['carrier']),
      trackingCode: normalizeString(json['trackingCode']),
      shippedAt: parseApiDateTime(json['shippedAt']),
      deliveredAt: parseApiDateTime(json['deliveredAt']),
      subtotalOverride: parsePrice(json['subtotal']),
      discountPercentOverride: parseInt(json['discountPercent']),
      discountAmountOverride: parsePrice(json['discountAmount']),
      vatPercentOverride: parseInt(json['vatPercent'], fallback: kVatPercent),
      vatAmountOverride: parsePrice(json['vatAmount']),
      totalAmountOverride: parsePrice(json['totalAmount']),
    );
  }

  OrderLineItem? _mapRemoteOrderItem(Map<String, dynamic> json) {
    final productId = json['productId']?.toString();
    final quantity = parseInt(json['quantity']);
    if (productId == null || productId.isEmpty || quantity <= 0) {
      return null;
    }
    final fallback = _findProductById(productId);
    final product = Product(
      id: productId,
      name: normalizeString(json['productName']) ?? fallback?.name ?? 'Product',
      sku: normalizeString(json['productSku']) ?? fallback?.sku ?? productId,
      shortDescription: fallback?.shortDescription ?? '',
      price: parsePrice(json['unitPrice'], fallback: fallback?.price ?? 0),
      stock: fallback?.stock ?? quantity,
      warrantyMonths: fallback?.warrantyMonths ?? 12,
      imageUrl: fallback?.imageUrl,
      descriptions: fallback?.descriptions ?? const <ProductDescriptionItem>[],
      videos: fallback?.videos ?? const <ProductVideoItem>[],
      specifications:
          fallback?.specifications ?? const <ProductSpecification>[],
    );
    return OrderLineItem(product: product, quantity: quantity);
  }

  OrderPaymentRecord _mapRemotePayment(Map<String, dynamic> json) {
    final remoteOrderId = parseInt(json['orderId']);
    final orderCode =
        _remoteOrderCodes[remoteOrderId] ?? remoteOrderId.toString();
    return OrderPaymentRecord(
      id: json['id']?.toString() ?? '',
      orderId: orderCode,
      amount: parsePrice(json['amount']),
      paidAt: parseApiDateTime(json['paidAt']) ?? DateTime.now(),
      channel: normalizeString(json['channel']) ?? '',
      note: normalizeString(json['note']),
      proofFileName: normalizeString(json['proofFileName']),
    );
  }

  OrderStatus _mapRemoteOrderStatus(String? raw) {
    switch ((raw ?? '').trim().toUpperCase()) {
      case 'CONFIRMED':
        return OrderStatus.confirmed;
      case 'PROCESSING':
        return OrderStatus.processing;
      case 'SHIPPING':
        return OrderStatus.shipping;
      case 'COMPLETED':
        return OrderStatus.completed;
      case 'CANCEL_REQUESTED':
        return OrderStatus.cancelRequested;
      case 'CANCEL_REJECTED':
        return OrderStatus.cancelRejected;
      case 'CANCELLED':
        return OrderStatus.cancelled;
      case 'PENDING':
      default:
        return OrderStatus.pending;
    }
  }

  String _toRemoteOrderStatus(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return 'PENDING';
      case OrderStatus.confirmed:
        return 'CONFIRMED';
      case OrderStatus.processing:
        return 'PROCESSING';
      case OrderStatus.shipping:
        return 'SHIPPING';
      case OrderStatus.completed:
        return 'COMPLETED';
      case OrderStatus.cancelRequested:
        return 'CANCEL_REQUESTED';
      case OrderStatus.cancelRejected:
        return 'CANCEL_REJECTED';
      case OrderStatus.cancelled:
        return 'CANCELLED';
    }
  }

  OrderPaymentMethod _mapRemotePaymentMethod(String? raw) {
    return OrderPaymentMethod.bankTransfer;
  }

  String _toRemotePaymentMethod(OrderPaymentMethod method) {
    return 'BANK_TRANSFER';
  }

  OrderPaymentStatus _mapRemotePaymentStatus(String? raw) {
    switch ((raw ?? '').trim().toUpperCase()) {
      case 'PAID':
        return OrderPaymentStatus.paid;
      case 'CANCELLED':
        return OrderPaymentStatus.cancelled;
      case 'PENDING':
      default:
        return OrderPaymentStatus.pending;
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

  Future<Map<String, String>> _authorizedHeaders() async {
    final token = await _readAccessToken();
    if (token == null) {
      throw OrderControllerException(
        orderControllerMessageToken(OrderMessageCode.unauthenticated),
      );
    }
    return buildAuthorizedHeaders(token);
  }

  Future<Map<String, String>> _authorizedJsonHeaders() async {
    final token = await _readAccessToken();
    if (token == null) {
      throw OrderControllerException(
        orderControllerMessageToken(OrderMessageCode.unauthenticated),
      );
    }
    return buildAuthorizedJsonHeaders(token);
  }

  Future<T> _withRequestTimeout<T>(Future<T> future) {
    return future.timeout(_requestTimeout);
  }

  String _generateIdempotencyKey() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
        '${hex.substring(12, 16)}-${hex.substring(16, 20)}-'
        '${hex.substring(20)}';
  }

  String _extractErrorMessage(Map<String, dynamic> payload) {
    final error = payload['error']?.toString();
    if (error != null && error.trim().isNotEmpty) {
      return error.trim();
    }
    return 'Không thể đồng bộ đơn hàng.';
  }

  Product? _findProductById(String id) {
    return _productLookup?.call(id);
  }

  String _extractErrorMessageWithFallback(
    Map<String, dynamic> payload,
    String fallback,
  ) {
    final error = payload['error']?.toString();
    if (error != null && error.trim().isNotEmpty) {
      return _extractErrorMessage(payload);
    }
    return fallback;
  }

  String _unavailableActionMessage() {
    if (!DealerApiConfig.isConfigured) {
      return orderControllerMessageToken(OrderMessageCode.apiNotConfigured);
    }
    return orderControllerMessageToken(OrderMessageCode.unauthenticated);
  }

  String _normalizeOrderControllerFailure(
    Object error, {
    required OrderMessageCode fallbackCode,
  }) {
    if (error is TimeoutException ||
        error is SocketException ||
        error is FormatException ||
        error is http.ClientException) {
      return orderControllerMessageToken(fallbackCode);
    }
    final message = switch (error) {
      OrderControllerException() => error.message,
      String() => error,
      _ => error.toString(),
    };
    final normalized = message
        .replaceFirst(RegExp(r'^Exception:\s*'), '')
        .trim();
    if (normalized.isEmpty) {
      return orderControllerMessageToken(fallbackCode);
    }
    if (normalized.contains('Unauthenticated request')) {
      return orderControllerMessageToken(OrderMessageCode.unauthenticated);
    }
    return normalized;
  }

  void _replaceOrders(Iterable<Order> orders) {
    _orders
      ..clear()
      ..addAll(orders);
    _orderById
      ..clear()
      ..addEntries(_orders.map((o) => MapEntry(o.id, o)));
    _markOrdersDirty();
  }

  void _replacePaymentHistory(Iterable<OrderPaymentRecord> payments) {
    _paymentHistory
      ..clear()
      ..addAll(payments);
    _markPaymentsDirty();
  }

  void _prunePaymentHistoryToKnownOrders() {
    final knownOrderIds = _remoteOrderIds.keys.toSet();
    _paymentHistory.removeWhere(
      (payment) => !knownOrderIds.contains(payment.orderId),
    );
    _markPaymentsDirty();
  }

  void _markOrdersDirty() {
    _ordersCacheDirty = true;
  }

  void _markPaymentsDirty() {
    _paymentHistoryCacheDirty = true;
  }

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }
}

class OrderScope extends InheritedNotifier<OrderController> {
  const OrderScope({
    super.key,
    required OrderController controller,
    required super.child,
  }) : super(notifier: controller);

  static OrderController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<OrderScope>();
    assert(scope != null, 'OrderScope not found in widget tree.');
    return scope!.notifier!;
  }
}
