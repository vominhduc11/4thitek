import 'dart:async';
import 'dart:convert';
import 'dart:math';

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
const String _stockConflictMessage =
    'Stock is being updated by another request; please retry';
const String _optimisticConflictMessage =
    'The record was modified by another request; please retry';
const String _roundedPaymentAmountMessage =
    'Payment amount must round to at least 1 VND';
final RegExp _minimumPartialPaymentPattern = RegExp(
  r'^Payment amount must be at least (\d+) VND unless it fully settles the outstanding balance$',
);
final RegExp _insufficientStockPattern = RegExp(
  r'^Insufficient stock for product (.+)$',
);

String orderControllerMessageToken(OrderMessageCode code) =>
    '$_orderMessageTokenPrefix${code.name}';

String? _resolveDynamicOrderMessage(
  String normalized, {
  required bool isEnglish,
}) {
  final minimumPartialMatch = _minimumPartialPaymentPattern.firstMatch(
    normalized,
  );
  if (minimumPartialMatch != null) {
    final minimumAmount = int.tryParse(minimumPartialMatch.group(1) ?? '');
    final minimumLabel = minimumAmount == null
        ? '${minimumPartialMatch.group(1)} VND'
        : formatVnd(minimumAmount);
    return isEnglish
        ? 'Each partial debt payment must be at least $minimumLabel unless it clears the remaining outstanding balance.'
        : 'Mỗi lần thanh toán công nợ từng phần phải từ $minimumLabel trở lên, trừ khi thanh toán hết công nợ còn lại.';
  }

  final insufficientStockMatch = _insufficientStockPattern.firstMatch(
    normalized,
  );
  if (insufficientStockMatch != null) {
    final productName = insufficientStockMatch.group(1)?.trim();
    if (productName == null || productName.isEmpty) {
      return isEnglish
          ? 'Insufficient stock. Please refresh and try again.'
          : 'Tồn kho không còn đủ. Vui lòng làm mới và thử lại.';
    }
    return isEnglish
        ? 'Insufficient stock for $productName. Please refresh and try again.'
        : 'Tồn kho của $productName không còn đủ. Vui lòng làm mới và thử lại.';
  }

  switch (normalized) {
    case _stockConflictMessage:
    case _optimisticConflictMessage:
      return isEnglish
          ? 'Stock changed while your request was being processed. Please refresh and try again.'
          : 'Tồn kho vừa thay đổi trong lúc xử lý. Vui lòng làm mới và thử lại.';
    case _roundedPaymentAmountMessage:
      return isEnglish
          ? 'The rounded payment amount must be at least 1 VND.'
          : 'Số tiền sau khi làm tròn phải từ 1 VND trở lên.';
    default:
      return null;
  }
}

String resolveOrderControllerMessage(
  String? message, {
  required bool isEnglish,
}) {
  final normalized = message?.trim();
  final dynamicMessage = normalized == null
      ? null
      : _resolveDynamicOrderMessage(normalized, isEnglish: isEnglish);
  if (!isEnglish) {
    if (normalized == null || normalized.isEmpty) {
      return 'Không thể đồng bộ dữ liệu đơn hàng.';
    }
    final dynamicMessage = _resolveDynamicOrderMessage(
      normalized,
      isEnglish: false,
    );
    switch (normalized) {
      case 'order.message.apiNotConfigured':
        return 'API đơn hàng chưa được cấu hình.';
      case 'order.message.unauthenticated':
        return 'Bạn cần đăng nhập trước khi thao tác đơn hàng.';
      case 'order.message.invalidOrderPayload':
        return 'Dữ liệu đơn hàng không hợp lệ.';
      case 'order.message.invalidOrdersPayload':
        return 'Dữ liệu danh sách đơn hàng không hợp lệ.';
      case 'order.message.invalidCreateOrderPayload':
        return 'Dữ liệu đơn hàng vừa tạo không hợp lệ.';
      case 'order.message.createOrderFailed':
        return 'Không thể tạo đơn hàng. Vui lòng thử lại.';
      case 'order.message.statusUpdateFailed':
        return 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.';
      case 'order.message.paymentFailed':
        return 'Không thể ghi nhận thanh toán. Vui lòng kiểm tra lại.';
      case 'order.message.syncFailed':
        return 'Không thể đồng bộ dữ liệu đơn hàng.';
      case 'Debt payment is not available for this dealer':
        return 'Tài khoản chưa được cấp hạn mức công nợ.';
      case 'Credit limit exceeded':
        return 'Vượt hạn mức công nợ. Vui lòng kiểm tra lại tổng công nợ hiện tại trước khi đặt đơn.';
      default:
        if (dynamicMessage != null) {
          return dynamicMessage;
        }
        break;
    }
  }
  if (normalized == null || normalized.isEmpty) {
    return isEnglish
        ? 'Unable to sync order data.'
        : 'Không thể đồng bộ dữ liệu đơn hàng.';
  }

  switch (normalized) {
    case 'order.message.apiNotConfigured':
      return isEnglish
          ? 'Order API is not configured.'
          : 'API đơn hàng chưa được cấu hình.';
    case 'order.message.unauthenticated':
      return isEnglish
          ? 'You need to sign in before managing orders.'
          : 'Bạn cần đăng nhập trước khi thao tác đơn hàng.';
    case 'order.message.invalidOrderPayload':
      return isEnglish
          ? 'Order data is invalid.'
          : 'Dữ liệu đơn hàng không hợp lệ.';
    case 'order.message.invalidOrdersPayload':
      return isEnglish
          ? 'Orders data is invalid.'
          : 'Dữ liệu danh sách đơn hàng không hợp lệ.';
    case 'order.message.invalidCreateOrderPayload':
      return isEnglish
          ? 'Created order data is invalid.'
          : 'Dữ liệu đơn hàng vừa tạo không hợp lệ.';
    case 'order.message.createOrderFailed':
      return isEnglish
          ? 'Unable to create the order. Please try again.'
          : 'Không thể tạo đơn hàng. Vui lòng thử lại.';
    case 'order.message.statusUpdateFailed':
      return isEnglish
          ? 'Unable to update the order status. Please try again.'
          : 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.';
    case 'order.message.paymentFailed':
      return isEnglish
          ? 'Unable to record the payment. Please check again.'
          : 'Không thể ghi nhận thanh toán. Vui lòng kiểm tra lại.';
    case 'order.message.syncFailed':
      return isEnglish
          ? 'Unable to sync order data.'
          : 'Không thể đồng bộ dữ liệu đơn hàng.';
    case 'Debt payment is not available for this dealer':
      return isEnglish
          ? 'This account has not been granted a credit limit yet.'
          : 'Tài khoản chưa được cấp hạn mức công nợ.';
    case 'Credit limit exceeded':
      return isEnglish
          ? 'Credit limit exceeded. Please review the current outstanding debt before placing the order.'
          : 'Vượt hạn mức công nợ. Vui lòng kiểm tra lại tổng công nợ hiện tại trước khi đặt đơn.';
    default:
      if (dynamicMessage != null) {
        return dynamicMessage;
      }
      return normalized;
  }
}

String orderControllerErrorMessage(Object? error, {required bool isEnglish}) {
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
      _replacePaymentHistory(const <DebtPaymentRecord>[]);
      notifyListeners();
    }
  }

  Future<void> refreshSingleOrder(String orderId) async {
    final remoteOrderId = _remoteOrderIds[orderId];
    if (remoteOrderId == null) {
      await refresh();
      return;
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
    _replacePaymentHistory(const <DebtPaymentRecord>[]);
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
  static const Map<OrderStatus, Set<OrderStatus>> _validTransitions =
      <OrderStatus, Set<OrderStatus>>{
        OrderStatus.pending: {OrderStatus.cancelled},
        OrderStatus.confirmed: {OrderStatus.cancelled},
        OrderStatus.shipping: {},
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
      return _trackCriticalMutation(() async {
        try {
          final response = await _client.patch(
            DealerApiConfig.resolveApiUri(
              '/dealer/orders/$remoteOrderId/status',
            ),
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
        DateTime.now().difference(prev.at).inSeconds < 5) {
      return false;
    }
    _lastPayment[orderId] = (amount: safeAmount, at: DateTime.now());

    final remoteOrderId = _remoteOrderIds[orderId];
    if (remoteOrderId != null && await _canUseRemoteApi()) {
      try {
        final response = await _client.post(
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
    final headers = await _authorizedJsonHeaders();
    headers['X-Idempotency-Key'] = _generateIdempotencyKey();
    final response = await _client.post(
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

  Future<List<DebtPaymentRecord>> _fetchRemotePaymentsForOrder(
    int remoteOrderId,
  ) async {
    try {
      final response = await _client.get(
        DealerApiConfig.resolveApiUri('/dealer/orders/$remoteOrderId/payments'),
        headers: await _authorizedHeaders(),
      );
      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        return const <DebtPaymentRecord>[];
      }
      final data = payload['data'];
      if (data is! List) {
        return const <DebtPaymentRecord>[];
      }
      return data
          .whereType<Map<String, dynamic>>()
          .map(_mapRemotePayment)
          .toList(growable: false);
    } catch (_) {
      return const <DebtPaymentRecord>[];
    }
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
    if (json['id'] == null) {
      throw const OrderControllerException('order.message.invalidOrderPayload');
    }
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
        return OrderStatus.confirmed;
      case 'SHIPPING':
        return OrderStatus.shipping;
      case 'COMPLETED':
        return OrderStatus.completed;
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
    return <String, String>{
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, String>> _authorizedJsonHeaders() async {
    final headers = await _authorizedHeaders();
    return <String, String>{...headers, 'Content-Type': 'application/json'};
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

