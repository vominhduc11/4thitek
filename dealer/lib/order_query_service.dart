import 'models.dart';
import 'order_controller.dart';
import 'query_page.dart';

const Object _queryUnset = Object();

enum OrderSortOption { newest, highestValue, debtFirst }

class OrderListQuery {
  const OrderListQuery({
    this.searchText = '',
    this.status,
    this.paymentStatus,
    this.onlyOutstanding = false,
    this.sort = OrderSortOption.newest,
  });

  final String searchText;
  final OrderStatus? status;
  final OrderPaymentStatus? paymentStatus;
  final bool onlyOutstanding;
  final OrderSortOption sort;

  String get normalizedSearchText => searchText.trim();

  bool get hasCriteria =>
      normalizedSearchText.isNotEmpty ||
      status != null ||
      paymentStatus != null ||
      onlyOutstanding ||
      sort != OrderSortOption.newest;

  OrderListQuery copyWith({
    String? searchText,
    Object? status = _queryUnset,
    Object? paymentStatus = _queryUnset,
    bool? onlyOutstanding,
    OrderSortOption? sort,
  }) {
    return OrderListQuery(
      searchText: searchText ?? this.searchText,
      status: identical(status, _queryUnset)
          ? this.status
          : status as OrderStatus?,
      paymentStatus: identical(paymentStatus, _queryUnset)
          ? this.paymentStatus
          : paymentStatus as OrderPaymentStatus?,
      onlyOutstanding: onlyOutstanding ?? this.onlyOutstanding,
      sort: sort ?? this.sort,
    );
  }

  Map<String, String> toRemoteQueryParameters(QueryPageRequest pageRequest) {
    final params = <String, String>{
      'page': '${pageRequest.pageIndex}',
      'size': '${pageRequest.limit}',
    };
    if (normalizedSearchText.isNotEmpty) {
      params['q'] = normalizedSearchText;
    }
    if (status != null) {
      params['status'] = status!.name;
    }
    if (paymentStatus != null) {
      params['paymentStatus'] = paymentStatus!.name;
    }
    if (onlyOutstanding) {
      params['onlyOutstanding'] = 'true';
    }
    params['sort'] = sort.name;
    return params;
  }

  @override
  bool operator ==(Object other) {
    return other is OrderListQuery &&
        other.searchText == searchText &&
        other.status == status &&
        other.paymentStatus == paymentStatus &&
        other.onlyOutstanding == onlyOutstanding &&
        other.sort == sort;
  }

  @override
  int get hashCode =>
      Object.hash(searchText, status, paymentStatus, onlyOutstanding, sort);
}

class OrderQuerySnapshot {
  const OrderQuerySnapshot({
    required this.items,
    required this.pendingApprovalCount,
    required this.outstandingOrderCount,
  });

  const OrderQuerySnapshot.empty()
    : items = const <Order>[],
      pendingApprovalCount = 0,
      outstandingOrderCount = 0;

  final List<Order> items;
  final int pendingApprovalCount;
  final int outstandingOrderCount;
}

abstract class OrderQueryDataSource {
  bool supports(OrderListQuery query);

  Future<QueryPageResult<Order>> fetchPage(
    OrderListQuery query,
    QueryPageRequest pageRequest,
  );
}

class LocalOrderQueryDataSource implements OrderQueryDataSource {
  LocalOrderQueryDataSource({required this.orderController});

  final OrderController orderController;

  @override
  bool supports(OrderListQuery query) => true;

  @override
  Future<QueryPageResult<Order>> fetchPage(
    OrderListQuery query,
    QueryPageRequest pageRequest,
  ) async {
    final snapshot = readSnapshot(query);
    return QueryPageResult<Order>.slice(
      allItems: snapshot.items,
      request: pageRequest,
    );
  }

  OrderQuerySnapshot readSnapshot(OrderListQuery query) {
    final items = _applyOrderQuery(
      List<Order>.from(orderController.orders),
      query,
    );
    final pendingApprovalCount = items
        .where((order) => order.status == OrderStatus.pendingApproval)
        .length;
    final outstandingOrderCount = items
        .where(
          (order) =>
              order.paymentMethod == OrderPaymentMethod.debt &&
              order.outstandingAmount > 0 &&
              order.status != OrderStatus.cancelled,
        )
        .length;
    return OrderQuerySnapshot(
      items: items,
      pendingApprovalCount: pendingApprovalCount,
      outstandingOrderCount: outstandingOrderCount,
    );
  }
}

class OrderQueryRepository {
  OrderQueryRepository({required this.localDataSource, this.remoteDataSource});

  final LocalOrderQueryDataSource localDataSource;
  final OrderQueryDataSource? remoteDataSource;

  Future<QueryPageResult<Order>> fetchPage(
    OrderListQuery query,
    QueryPageRequest pageRequest,
  ) async {
    final remote = remoteDataSource;
    if (remote != null && remote.supports(query)) {
      return remote.fetchPage(query, pageRequest);
    }
    return localDataSource.fetchPage(query, pageRequest);
  }

  OrderQuerySnapshot readSnapshot(OrderListQuery query) {
    return localDataSource.readSnapshot(query);
  }
}

List<Order> _applyOrderQuery(List<Order> orders, OrderListQuery query) {
  final normalizedQuery = query.normalizedSearchText.toLowerCase();
  final filtered = orders
      .where((order) {
        if (query.status != null && order.status != query.status) {
          return false;
        }
        if (query.paymentStatus != null &&
            order.paymentStatus != query.paymentStatus) {
          return false;
        }
        if (query.onlyOutstanding &&
            (order.outstandingAmount <= 0 ||
                order.status == OrderStatus.cancelled)) {
          return false;
        }
        if (normalizedQuery.isEmpty) {
          return true;
        }
        final matchesOrderId = order.id.toLowerCase().contains(normalizedQuery);
        final matchesReceiverName = order.receiverName.toLowerCase().contains(
          normalizedQuery,
        );
        final matchesReceiverPhone = order.receiverPhone.toLowerCase().contains(
          normalizedQuery,
        );
        final matchesProductName = order.items.any(
          (item) => item.product.name.toLowerCase().contains(normalizedQuery),
        );
        return matchesOrderId ||
            matchesReceiverName ||
            matchesReceiverPhone ||
            matchesProductName;
      })
      .toList(growable: false);

  final sorted = List<Order>.of(filtered, growable: true);
  switch (query.sort) {
    case OrderSortOption.newest:
      sorted.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      break;
    case OrderSortOption.highestValue:
      sorted.sort((a, b) {
        final totalCompare = b.total.compareTo(a.total);
        if (totalCompare != 0) {
          return totalCompare;
        }
        return b.createdAt.compareTo(a.createdAt);
      });
      break;
    case OrderSortOption.debtFirst:
      sorted.sort((a, b) {
        final debtCompare = b.outstandingAmount.compareTo(a.outstandingAmount);
        if (debtCompare != 0) {
          return debtCompare;
        }
        return b.createdAt.compareTo(a.createdAt);
      });
      break;
  }
  return List<Order>.unmodifiable(sorted);
}
