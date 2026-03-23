import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'models.dart';
import 'utils.dart';

enum OrderMessageCode {
  apiNotConfigured,
  unauthenticated,
  invalidOrderPayload,
  invalidOrdersPayload,
  invalidCreateOrderPayload,
  createOrderFailed,
  statusUpdateFailed,
  paymentFailed,
  syncFailed,
}

const String _orderMessageTokenPrefix = 'order.message.';

String orderControllerMessageToken(OrderMessageCode code) =>
    '$_orderMessageTokenPrefix${code.name}';

String resolveOrderControllerMessage(
  String? message, {
  required bool isEnglish,
}) {
  final normalized = message?.trim();
  if (normalized == null || normalized.isEmpty) {
    return isEnglish
        ? 'Unable to sync order data.'
        : 'Khong the dong bo du lieu don hang.';
  }

  switch (normalized) {
    case 'order.message.apiNotConfigured':
      return isEnglish
          ? 'Order API is not configured.'
          : 'API don hang chua duoc cau hinh.';
    case 'order.message.unauthenticated':
      return isEnglish
          ? 'You need to sign in before managing orders.'
          : 'Ban can dang nhap truoc khi thao tac don hang.';
    case 'order.message.invalidOrderPayload':
      return isEnglish
          ? 'Order data is invalid.'
          : 'Du lieu don hang khong hop le.';
    case 'order.message.invalidOrdersPayload':
      return isEnglish
          ? 'Orders data is invalid.'
          : 'Du lieu danh sach don hang khong hop le.';
    case 'order.message.invalidCreateOrderPayload':
      return isEnglish
          ? 'Created order data is invalid.'
          : 'Du lieu don hang vua tao khong hop le.';
    case 'order.message.createOrderFailed':
      return isEnglish
          ? 'Unable to create the order. Please try again.'
          : 'Khong the tao don hang. Vui long thu lai.';
    case 'order.message.statusUpdateFailed':
      return isEnglish
          ? 'Unable to update the order status. Please try again.'
          : 'Khong the cap nhat trang thai don hang. Vui long thu lai.';
    case 'order.message.paymentFailed':
      return isEnglish
          ? 'Unable to record the payment. Please check again.'
          : 'Khong the ghi nhan thanh toan. Vui long kiem tra lai.';
    case 'order.message.syncFailed':
      return isEnglish
          ? 'Unable to sync order data.'
          : 'Khong the dong bo du lieu don hang.';
    default:
      return normalized;
  }
}

String orderControllerErrorMessage(
  Object? error, {
  required bool isEnglish,
}) {
  final message = switch (error) {
    OrderControllerException() => error.message,
    String() => error,
    _ => error?.toString(),
  };
  return resolveOrderControllerMessage(message, isEnglish: isEnglish);
}

class OrderControllerException implements Exception {
  const OrderControllerException(this.message);

  final String message;

  @override
  String toString() => message;
}

class OrderController extends ChangeNotifier {
  OrderController({
    Product? Function(String productId)? productLookup,
    AuthStorage? authStorage,
    http.Client? client,
  }) : _orders = <Order>[],
       _paymentHistory = <DebtPaymentRecord>[],
       _productLookup = productLookup {
    _authStorage = authStorage ?? AuthStorage();
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: client ?? http.Client(),
    );
  }

  final List<Order> _orders;
  final Map<String, Order> _orderById = <String, Order>{};
  final List<DebtPaymentRecord> _paymentHistory;
  final Product? Function(String productId)? _productLookup;
  late final AuthStorage _authStorage;
  late final http.Client _client;
  final Map<String, int> _remoteOrderIds = <String, int>{};
  final Map<int, String> _remoteOrderCodes = <int, String>{};
  final Map<String, ({int amount, DateTime at})> _lastPayment =
      <String, ({int amount, DateTime at})>{};
  List<Order> _sortedOrdersCache = const <Order>[];
  List<Order> _sortedDebtOrdersCache = const <Order>[];
  List<DebtPaymentRecord> _sortedPaymentHistoryCache =
      const <DebtPaymentRecord>[];
  bool _ordersCacheDirty = true;
  bool _debtOrdersCacheDirty = true;
  bool _paymentHistoryCacheDirty = true;
  String? _lastActionMessage;
  DateTime? _lastRemoteSyncAt;

  String? get lastActionMessage => _lastActionMessage;
  DateTime? get lastRemoteSyncAt => _lastRemoteSyncAt;

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
      _replacePaymentHistory(const <DebtPaymentRecord>[]);
      notifyListeners();
    }
  }

  Future<void> refresh() async {
    _lastActionMessage = null;
    final loadedRemote = await _loadRemoteOrdersAndPayments();
    if (!loadedRemote) {
      await Future<void>.delayed(const Duration(milliseconds: 300));
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
    _replacePaymentHistory(const <DebtPaymentRecord>[]);
    notifyListeners();
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

  List<Order> get debtOrders {
    if (_debtOrdersCacheDirty) {
      final list =
          _orders
              .where(
                (order) =>
                    order.paymentMethod == OrderPaymentMethod.debt &&
                    order.outstandingAmount > 0 &&
                    order.status != OrderStatus.cancelled,
              )
              .toList(growable: false)
            ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      _sortedDebtOrdersCache = List<Order>.unmodifiable(list);
      _debtOrdersCacheDirty = false;
    }
    return _sortedDebtOrdersCache;
  }

  int get totalOutstandingDebt {
    return _orders
        .where(
          (order) =>
              order.paymentMethod == OrderPaymentMethod.debt &&
              order.outstandingAmount > 0 &&
              order.status != OrderStatus.cancelled,
        )
        .fold<int>(0, (sum, order) => sum + order.outstandingAmount);
  }

  List<DebtPaymentRecord> get paymentHistory {
    if (_paymentHistoryCacheDirty) {
      final list = List<DebtPaymentRecord>.from(_paymentHistory)
        ..sort((a, b) => b.paidAt.compareTo(a.paidAt));
      _sortedPaymentHistoryCache = List<DebtPaymentRecord>.unmodifiable(list);
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
  }

  static const Map<OrderStatus, Set<OrderStatus>> _validTransitions =
      <OrderStatus, Set<OrderStatus>>{
        OrderStatus.pendingApproval: {
          OrderStatus.approved,
          OrderStatus.cancelled,
        },
        OrderStatus.approved: {OrderStatus.shipping, OrderStatus.cancelled},
        OrderStatus.shipping: {OrderStatus.completed, OrderStatus.cancelled},
        OrderStatus.completed: {},
        OrderStatus.cancelled: {},
      };

  Future<bool> updateOrderStatus(String orderId, OrderStatus status) async {
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
      try {
        final response = await _client.patch(
          DealerApiConfig.resolveApiUri('/dealer/orders/$remoteOrderId/status'),
          headers: await _authorizedJsonHeaders(),
          body: jsonEncode(<String, dynamic>{
            'status': _toRemoteOrderStatus(status),
          }),
        );
        final payload = _decodeBody(response.body);
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
        DateTime.now().difference(prev.at).inSeconds < 5) {
      return false;
    }
    _lastPayment[orderId] = (amount: safeAmount, at: DateTime.now());

    final remoteOrderId = _remoteOrderIds[orderId];
    if (remoteOrderId != null && await _canUseRemoteApi()) {
      try {
        final response = await _client.post(
          DealerApiConfig.resolveApiUri('/dealer/orders/$remoteOrderId/payments'),
          headers: await _authorizedJsonHeaders(),
          body: jsonEncode(<String, dynamic>{
            'amount': safeAmount,
            if (method != null) 'method': _toRemotePaymentMethod(method),
            'channel': channel.trim(),
            if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
            if (proofFileName != null && proofFileName.trim().isNotEmpty)
              'proofFileName': proofFileName.trim(),
          }),
        );
        final payload = _decodeBody(response.body);
        if (response.statusCode >= 400) {
          throw OrderControllerException(
            _extractErrorMessageWithFallback(
              payload,
              orderControllerMessageToken(
                OrderMessageCode.paymentFailed,
              ),
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
    if (!await _canUseRemoteApi()) {
      return false;
    }

    try {
      final response = await _client.get(
        DealerApiConfig.resolveApiUri('/dealer/orders'),
        headers: await _authorizedHeaders(),
      );
      final payload = _decodeBody(response.body);
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

      final paymentsByOrder = await Future.wait(
        _remoteOrderIds.values.map(_fetchRemotePaymentsForOrder),
      );

      _replaceOrders(remoteOrders);
      _replacePaymentHistory(paymentsByOrder.expand((items) => items));
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
    final response = await _client.post(
      DealerApiConfig.resolveApiUri('/dealer/orders'),
      headers: await _authorizedJsonHeaders(),
      body: jsonEncode(<String, dynamic>{
        'paymentMethod': _toRemotePaymentMethod(order.paymentMethod),
        'receiverName': order.receiverName,
        'receiverAddress': order.receiverAddress,
        'receiverPhone': order.receiverPhone,
        if (order.note != null && order.note!.trim().isNotEmpty)
          'note': order.note!.trim(),
        'items': order.items
            .map(
              (item) => <String, dynamic>{
                'productId': int.tryParse(item.product.id),
                'quantity': item.quantity,
              },
            )
            .where((item) => item['productId'] != null)
            .toList(growable: false),
      }),
    );
    final payload = _decodeBody(response.body);
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
    final response = await _client.get(
      DealerApiConfig.resolveApiUri('/dealer/orders/$remoteOrderId'),
      headers: await _authorizedHeaders(),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw OrderControllerException(
        _extractErrorMessageWithFallback(
          payload,
          orderControllerMessageToken(
            OrderMessageCode.invalidOrderPayload,
          ),
        ),
      );
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw const OrderControllerException('order.message.invalidOrderPayload');
    }
    _replaceOrder(_mapRemoteOrder(data));
  }

  Future<List<DebtPaymentRecord>> _fetchRemotePaymentsForOrder(
    int remoteOrderId,
  ) async {
    final response = await _client.get(
      DealerApiConfig.resolveApiUri('/dealer/orders/$remoteOrderId/payments'),
      headers: await _authorizedHeaders(),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw OrderControllerException(
        _extractErrorMessageWithFallback(
          payload,
          orderControllerMessageToken(OrderMessageCode.paymentFailed),
        ),
      );
    }
    final data = payload['data'];
    if (data is! List) {
      return const <DebtPaymentRecord>[];
    }
    return data
        .whereType<Map<String, dynamic>>()
        .map(_mapRemotePayment)
        .toList(growable: false);
  }

  Future<void> _reloadRemotePaymentsForOrder(int remoteOrderId) async {
    final orderCode = _remoteOrderCodes[remoteOrderId];
    if (orderCode == null) {
      return;
    }
    _paymentHistory.removeWhere((payment) => payment.orderId == orderCode);
    _paymentHistory.addAll(await _fetchRemotePaymentsForOrder(remoteOrderId));
    _markPaymentsDirty();
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
    final remoteId = _parseInt(json['id']);
    final orderCode =
        _normalizeString(json['orderCode']) ?? remoteId.toString();
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
      receiverName: _normalizeString(json['receiverName']) ?? '',
      receiverAddress: _normalizeString(json['receiverAddress']) ?? '',
      receiverPhone: _normalizeString(json['receiverPhone']) ?? '',
      items: items,
      paidAmount: _parsePrice(json['paidAmount']),
      note: _normalizeString(json['note']),
      subtotalOverride: _parsePrice(json['subtotal']),
      discountPercentOverride: _parseInt(json['discountPercent']),
      discountAmountOverride: _parsePrice(json['discountAmount']),
      vatPercentOverride: _parseInt(json['vatPercent'], fallback: kVatPercent),
      vatAmountOverride: _parsePrice(json['vatAmount']),
      totalAmountOverride: _parsePrice(json['totalAmount']),
    );
  }

  OrderLineItem? _mapRemoteOrderItem(Map<String, dynamic> json) {
    final productId = json['productId']?.toString();
    final quantity = _parseInt(json['quantity']);
    if (productId == null || productId.isEmpty || quantity <= 0) {
      return null;
    }
    final fallback = _findProductById(productId);
    final product = Product(
      id: productId,
      name:
          _normalizeString(json['productName']) ?? fallback?.name ?? 'Product',
      sku: _normalizeString(json['productSku']) ?? fallback?.sku ?? productId,
      shortDescription: fallback?.shortDescription ?? '',
      price: _parsePrice(json['unitPrice'], fallback: fallback?.price ?? 0),
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

  DebtPaymentRecord _mapRemotePayment(Map<String, dynamic> json) {
    final remoteOrderId = _parseInt(json['orderId']);
    final orderCode =
        _remoteOrderCodes[remoteOrderId] ?? remoteOrderId.toString();
    return DebtPaymentRecord(
      id: json['id']?.toString() ?? '',
      orderId: orderCode,
      amount: _parsePrice(json['amount']),
      paidAt: parseApiDateTime(json['paidAt']) ?? DateTime.now(),
      channel: _normalizeString(json['channel']) ?? '',
      note: _normalizeString(json['note']),
      proofFileName: _normalizeString(json['proofFileName']),
    );
  }

  OrderStatus _mapRemoteOrderStatus(String? raw) {
    switch ((raw ?? '').trim().toUpperCase()) {
      case 'CONFIRMED':
        return OrderStatus.approved;
      case 'SHIPPING':
        return OrderStatus.shipping;
      case 'COMPLETED':
        return OrderStatus.completed;
      case 'CANCELLED':
        return OrderStatus.cancelled;
      case 'PENDING':
      default:
        return OrderStatus.pendingApproval;
    }
  }

  String _toRemoteOrderStatus(OrderStatus status) {
    switch (status) {
      case OrderStatus.pendingApproval:
        return 'PENDING';
      case OrderStatus.approved:
        return 'CONFIRMED';
      case OrderStatus.shipping:
        return 'SHIPPING';
      case OrderStatus.completed:
        return 'COMPLETED';
      case OrderStatus.cancelled:
        return 'CANCELLED';
    }
  }

  OrderPaymentMethod _mapRemotePaymentMethod(String? raw) {
    switch ((raw ?? '').trim().toUpperCase()) {
      case 'DEBT':
        return OrderPaymentMethod.debt;
      case 'BANK_TRANSFER':
      default:
        return OrderPaymentMethod.bankTransfer;
    }
  }

  String _toRemotePaymentMethod(OrderPaymentMethod method) {
    switch (method) {
      case OrderPaymentMethod.bankTransfer:
        return 'BANK_TRANSFER';
      case OrderPaymentMethod.debt:
        return 'DEBT';
    }
  }

  OrderPaymentStatus _mapRemotePaymentStatus(String? raw) {
    switch ((raw ?? '').trim().toUpperCase()) {
      case 'PAID':
        return OrderPaymentStatus.paid;
      case 'DEBT_RECORDED':
        return OrderPaymentStatus.debtRecorded;
      case 'CANCELLED':
        return OrderPaymentStatus.cancelled;
      case 'FAILED':
        return OrderPaymentStatus.failed;
      case 'PENDING':
      default:
        return OrderPaymentStatus.unpaid;
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
    return <String, String>{
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, String>> _authorizedJsonHeaders() async {
    final headers = await _authorizedHeaders();
    return <String, String>{...headers, 'Content-Type': 'application/json'};
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

  int _parseInt(Object? value, {int fallback = 0}) {
    if (value is int) {
      return value;
    }
    if (value is double) {
      return value.round();
    }
    return int.tryParse(value?.toString() ?? '') ?? fallback;
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
    final text = value?.toString().trim() ?? '';
    return text.isEmpty ? null : text;
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

  void _replacePaymentHistory(Iterable<DebtPaymentRecord> payments) {
    _paymentHistory
      ..clear()
      ..addAll(payments);
    _markPaymentsDirty();
  }

  void _markOrdersDirty() {
    _ordersCacheDirty = true;
    _debtOrdersCacheDirty = true;
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
