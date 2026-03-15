import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:infinite_scroll_pagination/infinite_scroll_pagination.dart';

import 'breakpoints.dart';
import 'global_search.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'notifications_screen.dart';
import 'widgets/notification_icon_button.dart';
import 'product_list_screen.dart';
import 'utils.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

enum _OrderSort { newest, highestValue, debtFirst }

extension _OrderSortLabel on _OrderSort {
  String get label {
    switch (this) {
      case _OrderSort.newest:
        return 'Mới nhất';
      case _OrderSort.highestValue:
        return 'Giá trị cao';
      case _OrderSort.debtFirst:
        return 'Còn nợ trước';
    }
  }
}

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key, this.onSwitchTab});

  final ValueChanged<int>? onSwitchTab;

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  static const int _pageSize = 10;
  static const Duration _apiLatency = Duration(milliseconds: 350);

  late final PagingController<int, Order> _pagingController;
  late final TextEditingController _searchController;
  Timer? _searchDebounce;
  int _queryRevision = 0;
  String _lastOrderSnapshot = '';
  bool _hasInitializedSnapshot = false;
  OrderController? _observedOrderController;

  String _searchQuery = '';
  OrderStatus? _selectedStatus; // null = all
  OrderPaymentStatus? _selectedPaymentStatus; // null = all
  bool _onlyOutstanding = false;
  _OrderSort _selectedSort = _OrderSort.newest;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    _pagingController = PagingController(firstPageKey: 0);
    _pagingController.addPageRequestListener(_fetchPage);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final controller = OrderScope.of(context);
    if (!identical(controller, _observedOrderController)) {
      _observedOrderController?.removeListener(_handleOrderControllerChanged);
      _observedOrderController = controller;
      _observedOrderController?.addListener(_handleOrderControllerChanged);
      _syncOrderSnapshot(controller.orders);
    }
  }

  void _handleOrderControllerChanged() {
    final controller = _observedOrderController;
    if (!mounted || controller == null) {
      return;
    }
    _syncOrderSnapshot(controller.orders);
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _observedOrderController?.removeListener(_handleOrderControllerChanged);
    _searchController.dispose();
    _pagingController.dispose();
    super.dispose();
  }

  List<Order> _filterOrders(List<Order> orders) {
    var result = List<Order>.from(orders);
    if (_selectedStatus != null) {
      result = result.where((o) => o.status == _selectedStatus).toList();
    }
    if (_selectedPaymentStatus != null) {
      result = result
          .where((o) => o.paymentStatus == _selectedPaymentStatus)
          .toList();
    }
    if (_onlyOutstanding) {
      result = result
          .where(
            (o) => o.outstandingAmount > 0 && o.status != OrderStatus.cancelled,
          )
          .toList();
    }
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      result = result.where((o) {
        final matchesOrderId = o.id.toLowerCase().contains(q);
        final matchesReceiverName = o.receiverName.toLowerCase().contains(q);
        final matchesReceiverPhone = o.receiverPhone.toLowerCase().contains(q);
        final matchesProductName = o.items.any(
          (item) => item.product.name.toLowerCase().contains(q),
        );
        return matchesOrderId ||
            matchesReceiverName ||
            matchesReceiverPhone ||
            matchesProductName;
      }).toList();
    }

    switch (_selectedSort) {
      case _OrderSort.newest:
        result.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      case _OrderSort.highestValue:
        result.sort((a, b) {
          final totalCompare = b.total.compareTo(a.total);
          if (totalCompare != 0) {
            return totalCompare;
          }
          return b.createdAt.compareTo(a.createdAt);
        });
      case _OrderSort.debtFirst:
        result.sort((a, b) {
          final debtCompare = b.outstandingAmount.compareTo(
            a.outstandingAmount,
          );
          if (debtCompare != 0) {
            return debtCompare;
          }
          return b.createdAt.compareTo(a.createdAt);
        });
    }

    return result;
  }

  Future<void> _fetchPage(int pageKey) async {
    final requestRevision = _queryRevision;
    try {
      await Future.delayed(_apiLatency);
      if (!mounted || requestRevision != _queryRevision) {
        return;
      }

      final allOrders = OrderScope.of(context).orders;
      final filteredOrders = _filterOrders(allOrders);
      final start = pageKey;
      final end = math.min(start + _pageSize, filteredOrders.length);
      final newItems = start >= filteredOrders.length
          ? const <Order>[]
          : filteredOrders.sublist(start, end);
      final isLastPage = end >= filteredOrders.length;
      if (isLastPage) {
        _pagingController.appendLastPage(newItems);
      } else {
        _pagingController.appendPage(newItems, end);
      }
    } catch (error) {
      _pagingController.error = error;
    }
  }

  void _refreshOrders() {
    _queryRevision++;
    _pagingController.refresh();
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    final next = value.trim();
    _searchDebounce = Timer(const Duration(milliseconds: 320), () {
      if (!mounted || next == _searchQuery) {
        return;
      }
      setState(() => _searchQuery = next);
      _refreshOrders();
    });
  }

  void _clearSearch() {
    final hasValue =
        _searchController.text.isNotEmpty || _searchQuery.isNotEmpty;
    if (!hasValue) {
      return;
    }
    _searchDebounce?.cancel();
    _searchController.clear();
    if (_searchQuery.isEmpty) {
      return;
    }
    setState(() => _searchQuery = '');
    _refreshOrders();
  }

  void _setStatusFilter(OrderStatus? status) {
    if (_selectedStatus == status) {
      return;
    }
    setState(() => _selectedStatus = status);
    _refreshOrders();
  }

  void _setPaymentStatusFilter(OrderPaymentStatus? paymentStatus) {
    if (_selectedPaymentStatus == paymentStatus) {
      return;
    }
    setState(() => _selectedPaymentStatus = paymentStatus);
    _refreshOrders();
  }

  void _clearActiveFilters() {
    if (_selectedStatus == null &&
        _selectedPaymentStatus == null &&
        !_onlyOutstanding) {
      return;
    }
    setState(() {
      _selectedStatus = null;
      _selectedPaymentStatus = null;
      _onlyOutstanding = false;
    });
    _refreshOrders();
  }

  void _clearAllCriteria() {
    final hadSearch =
        _searchController.text.isNotEmpty || _searchQuery.isNotEmpty;
    final hadFilters =
        _selectedStatus != null ||
        _selectedPaymentStatus != null ||
        _onlyOutstanding;
    if (!hadSearch && !hadFilters) {
      return;
    }
    _searchDebounce?.cancel();
    _searchController.clear();
    setState(() {
      _searchQuery = '';
      _selectedStatus = null;
      _selectedPaymentStatus = null;
      _onlyOutstanding = false;
    });
    _refreshOrders();
  }

  void _toggleOutstandingQuickFilter() {
    setState(() {
      _onlyOutstanding = !_onlyOutstanding;
    });
    _refreshOrders();
  }

  void _setSort(_OrderSort sort) {
    if (_selectedSort == sort) {
      return;
    }
    setState(() => _selectedSort = sort);
    _refreshOrders();
  }

  void _syncOrderSnapshot(List<Order> orders) {
    final snapshot = Object.hashAll(
      orders.map(
        (o) => Object.hash(o.id, o.status, o.paymentStatus, o.paidAmount),
      ),
    ).toString();
    if (!_hasInitializedSnapshot) {
      _hasInitializedSnapshot = true;
      _lastOrderSnapshot = snapshot;
      return;
    }
    if (_lastOrderSnapshot == snapshot) {
      return;
    }
    _lastOrderSnapshot = snapshot;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      _refreshOrders();
    });
  }

  String _activeCriteriaSummary() {
    final parts = <String>[];
    if (_onlyOutstanding) {
      parts.add('Còn nợ');
    }
    if (_selectedStatus != null) {
      parts.add('Trạng thái: ${_selectedStatus!.label}');
    }
    if (_selectedPaymentStatus != null) {
      parts.add('Thanh toán: ${_selectedPaymentStatus!.label}');
    }
    if (_searchQuery.isNotEmpty) {
      parts.add('Từ khóa: "$_searchQuery"');
    }
    return parts.join(' · ');
  }

  void _confirmCancel(BuildContext context, Order order) {
    showDialog<void>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        final colors = Theme.of(context).colorScheme;
        return AlertDialog(
          title: const Text('Xác nhận hủy đơn'),
          content: Text('Bạn có chắc muốn hủy đơn hàng ${order.id}?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Không'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: colors.errorContainer,
                foregroundColor: colors.onErrorContainer,
              ),
              onPressed: () async {
                Navigator.of(dialogContext).pop();
                final success = await OrderScope.of(
                  context,
                ).updateOrderStatus(order.id, OrderStatus.cancelled);
                if (!context.mounted || success) {
                  return;
                }
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.',
                    ),
                  ),
                );
              },
              child: const Text('Hủy đơn'),
            ),
          ],
        );
      },
    );
  }

  void _openOrderDetail(BuildContext context, String orderId) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => OrderDetailScreen(orderId: orderId),
      ),
    );
  }

  void _openCreateOrder(BuildContext context) {
    if (widget.onSwitchTab != null) {
      widget.onSwitchTab!(0);
      return;
    }
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const ProductListScreen()));
  }

  Widget _buildFilterChips<T>({
    required BuildContext context,
    required String label,
    required List<T?> options,
    required T? selected,
    required ValueChanged<T?> onSelected,
    required String Function(T?) labelFor,
    required bool useWrapLayout,
  }) {
    final colors = Theme.of(context).colorScheme;
    final labelStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
      color: colors.onSurfaceVariant,
      fontWeight: FontWeight.w600,
    );
    final chips = options
        .map(
          (option) => FilterChip(
            label: Text(labelFor(option)),
            selected: selected == option,
            onSelected: (_) => onSelected(option),
            showCheckmark: false,
          ),
        )
        .toList();

    if (useWrapLayout) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$label:', style: labelStyle),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: chips),
          ],
        ),
      );
    }

    return SizedBox(
      height: 48,
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16, right: 8),
            child: Text('$label:', style: labelStyle),
          ),
          Expanded(
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(right: 16),
              itemCount: chips.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, index) => chips[index],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final mediaSize = MediaQuery.sizeOf(context);
    final shortestSide = mediaSize.shortestSide;
    final isCompact = shortestSide < AppBreakpoints.phone;
    final contentMaxWidth = isCompact ? double.infinity : 1100.0;
    final constrainedWidth = isCompact
        ? mediaSize.width
        : math.min(mediaSize.width, contentMaxWidth);
    final useWrapFilters = !isCompact && constrainedWidth >= 900;
    final useGridLayout = !isCompact;
    final bottomSafeArea = MediaQuery.of(context).viewPadding.bottom;
    final listBottomPadding = (isCompact ? 104.0 : 88.0) + bottomSafeArea;

    final orderController = OrderScope.of(context);
    final warrantyController = WarrantyScope.of(context);
    final allOrders = orderController.orders;
    final filteredOrders = _filterOrders(allOrders);
    final pendingApprovalCount = filteredOrders
        .where((order) => order.status == OrderStatus.pendingApproval)
        .length;
    final debtOrderCount = filteredOrders
        .where(
          (order) =>
              order.paymentMethod == OrderPaymentMethod.debt &&
              order.outstandingAmount > 0 &&
              order.status != OrderStatus.cancelled,
        )
        .length;

    final statusFilters = <OrderStatus?>[
      null,
      OrderStatus.pendingApproval,
      OrderStatus.approved,
      OrderStatus.shipping,
      OrderStatus.completed,
      OrderStatus.cancelled,
    ];
    final paymentFilters = <OrderPaymentStatus?>[
      null,
      OrderPaymentStatus.unpaid,
      OrderPaymentStatus.paid,
      OrderPaymentStatus.debtRecorded,
      OrderPaymentStatus.cancelled,
      OrderPaymentStatus.failed,
    ];
    final hasSummaryData = pendingApprovalCount > 0 || debtOrderCount > 0;
    final hasActiveFilters =
        _selectedStatus != null ||
        _selectedPaymentStatus != null ||
        _onlyOutstanding;
    final hasActiveSearch = _searchQuery.isNotEmpty;
    final activeCriteriaSummary = _activeCriteriaSummary();
    final canResetCriteria = hasActiveFilters || hasActiveSearch;
    final hasActiveCriteria = canResetCriteria;
    final orderBuilderDelegate = PagedChildBuilderDelegate<Order>(
      itemBuilder: (context, order, index) {
        final canCancel =
            order.status == OrderStatus.pendingApproval ||
            order.status == OrderStatus.approved;
        final shouldShowSerialProgress =
            order.status == OrderStatus.completed ||
            order.status == OrderStatus.shipping;
        final serialProcessedCount = warrantyController.activationCountForOrder(
          order.id,
        );
        final orderSemanticsLabel =
            'Don ${order.id}, ${order.receiverName}, tong ${formatVnd(order.total)}, '
            '${order.totalItems} san pham';
        final card = FadeSlideIn(
          key: ValueKey(order.id),
          delay: Duration(
            milliseconds: math.min(25 * (index % _pageSize), 150),
          ),
          child: Semantics(
            container: true,
            label: orderSemanticsLabel,
            hint: 'Mo chi tiet don hang',
            child: Card(
              clipBehavior: Clip.antiAlias,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
                side: BorderSide(
                  color: colors.outlineVariant.withValues(alpha: 0.6),
                ),
              ),
              child: InkWell(
                onTap: () => _openOrderDetail(context, order.id),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  order.id,
                                  style: Theme.of(context).textTheme.titleSmall
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  order.receiverName,
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(fontWeight: FontWeight.w600),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Đặt ${formatRelativeTime(order.createdAt)}',
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                ),
                              ],
                            ),
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _StatusChip(status: order.status),
                              const SizedBox(width: 4),
                              Icon(
                                Icons.chevron_right,
                                size: 18,
                                color: colors.onSurfaceVariant,
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        formatVnd(order.total),
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              color: colors.onSurface,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${order.totalItems} sản phẩm',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Thanh toán: ${order.paymentMethod.label}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            'Trạng thái TT:',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: colors.onSurfaceVariant),
                          ),
                          const SizedBox(width: 8),
                          _PaymentStatusChip(
                            paymentStatus: order.paymentStatus,
                          ),
                        ],
                      ),
                      if (shouldShowSerialProgress) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: order.totalItems > 0
                                      ? serialProcessedCount / order.totalItems
                                      : 0,
                                  minHeight: 4,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Serial $serialProcessedCount/${order.totalItems}',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: colors.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ],
                      if (order.outstandingAmount > 0) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Còn nợ: ${formatVnd(order.outstandingAmount)}',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colors.error,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ],
                      if (canCancel) ...[
                        const SizedBox(height: 12),
                        TextButton(
                          style: TextButton.styleFrom(
                            foregroundColor: Theme.of(
                              context,
                            ).colorScheme.error,
                            minimumSize: const Size(0, 48),
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                          ),
                          onPressed: () => _confirmCancel(context, order),
                          child: const Text('Hủy đơn'),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
        if (useGridLayout) {
          return card;
        }
        return Padding(padding: const EdgeInsets.only(bottom: 12), child: card);
      },
      firstPageProgressIndicatorBuilder: (context) =>
          const Center(child: CircularProgressIndicator()),
      newPageProgressIndicatorBuilder: (context) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator()),
      ),
      noItemsFoundIndicatorBuilder: (context) {
        if (allOrders.isEmpty) {
          return FadeSlideIn(
            child: _EmptyOrders(onCreateOrder: () => _openCreateOrder(context)),
          );
        }
        return _EmptyFilterResult(
          activeCriteriaSummary: activeCriteriaSummary,
          canClearCriteria: canResetCriteria,
          onClearCriteria: _clearAllCriteria,
        );
      },
      firstPageErrorIndicatorBuilder: (context) {
        return _PagedErrorState(
          onRetry: _pagingController.refresh,
          message: 'Không thể tải danh sách đơn hàng.',
        );
      },
      newPageErrorIndicatorBuilder: (context) {
        return _PagedErrorState(
          onRetry: _pagingController.retryLastFailedRequest,
          message: 'Không thể tải thêm đơn hàng.',
        );
      },
    );

    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Đơn hàng'),
        actions: [
          const GlobalSearchIconButton(),
          NotificationIconButton(
            count: NotificationScope.of(context).unreadCount,
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
          ),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Tìm mã đơn, tên khách, SĐT, sản phẩm...',
                    prefixIcon: const Icon(Icons.search_outlined),
                    suffixIcon: hasActiveSearch
                        ? IconButton(
                            onPressed: _clearSearch,
                            tooltip: 'Xóa tìm kiếm',
                            icon: const Icon(Icons.close),
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  onChanged: _onSearchChanged,
                ),
              ),
              const SizedBox(height: 10),
              _buildFilterChips<OrderStatus>(
                context: context,
                label: 'Trạng thái',
                options: statusFilters,
                selected: _selectedStatus,
                onSelected: _setStatusFilter,
                labelFor: (status) => status == null ? 'Tất cả' : status.label,
                useWrapLayout: useWrapFilters,
              ),
              const SizedBox(height: 8),
              _buildFilterChips<OrderPaymentStatus>(
                context: context,
                label: 'Thanh toán',
                options: paymentFilters,
                selected: _selectedPaymentStatus,
                onSelected: _setPaymentStatusFilter,
                labelFor: (status) => status == null ? 'Tất cả' : status.label,
                useWrapLayout: useWrapFilters,
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: hasSummaryData
                          ? Wrap(
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                if (pendingApprovalCount > 0)
                                  Text(
                                    '$pendingApprovalCount đơn chờ duyệt',
                                    style: Theme.of(context).textTheme.bodySmall
                                        ?.copyWith(
                                          color: colors.onSurfaceVariant,
                                          fontWeight: FontWeight.w600,
                                        ),
                                  ),
                                if (pendingApprovalCount > 0 &&
                                    debtOrderCount > 0)
                                  Text(
                                    ' · ',
                                    style: Theme.of(context).textTheme.bodySmall
                                        ?.copyWith(
                                          color: colors.onSurfaceVariant,
                                        ),
                                  ),
                                if (debtOrderCount > 0)
                                  InkWell(
                                    onTap: _toggleOutstandingQuickFilter,
                                    borderRadius: BorderRadius.circular(6),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 2,
                                        vertical: 2,
                                      ),
                                      child: Text(
                                        '$debtOrderCount đơn còn nợ',
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(
                                              color: _onlyOutstanding
                                                  ? colors.primary
                                                  : colors.onSurfaceVariant,
                                              fontWeight: FontWeight.w700,
                                              decoration:
                                                  TextDecoration.underline,
                                            ),
                                      ),
                                    ),
                                  ),
                              ],
                            )
                          : const SizedBox.shrink(),
                    ),
                    if (hasActiveCriteria)
                      Container(
                        margin: const EdgeInsets.only(right: 6),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: colors.primaryContainer,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.filter_alt,
                              size: 14,
                              color: colors.onPrimaryContainer,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Đang lọc',
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(
                                    color: colors.onPrimaryContainer,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    if (hasActiveFilters)
                      IconButton(
                        onPressed: _clearActiveFilters,
                        tooltip: 'Xóa bộ lọc',
                        icon: const Icon(
                          Icons.filter_alt_off_outlined,
                          size: 20,
                        ),
                      ),
                    PopupMenuButton<_OrderSort>(
                      tooltip: 'Sắp xếp đơn hàng',
                      onSelected: _setSort,
                      itemBuilder: (context) => _OrderSort.values
                          .map(
                            (sort) => PopupMenuItem<_OrderSort>(
                              value: sort,
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 22,
                                    child: _selectedSort == sort
                                        ? Icon(
                                            Icons.check,
                                            size: 18,
                                            color: colors.primary,
                                          )
                                        : null,
                                  ),
                                  Text(sort.label),
                                ],
                              ),
                            ),
                          )
                          .toList(),
                      child: Container(
                        constraints: const BoxConstraints(minHeight: 48),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: colors.surfaceContainerHighest.withValues(
                            alpha: 0.45,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.sort, size: 16),
                            const SizedBox(width: 6),
                            Text(_selectedSort.label),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async {
                    await orderController.load(forceRefresh: true);
                    _refreshOrders();
                  },
                  child: useGridLayout
                      ? PagedGridView<int, Order>(
                          keyboardDismissBehavior:
                              ScrollViewKeyboardDismissBehavior.onDrag,
                          physics: const AlwaysScrollableScrollPhysics(),
                          pagingController: _pagingController,
                          padding: EdgeInsets.fromLTRB(
                            20,
                            8,
                            20,
                            listBottomPadding,
                          ),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                                mainAxisExtent: 460,
                              ),
                          builderDelegate: orderBuilderDelegate,
                        )
                      : PagedListView<int, Order>(
                          keyboardDismissBehavior:
                              ScrollViewKeyboardDismissBehavior.onDrag,
                          physics: const AlwaysScrollableScrollPhysics(),
                          pagingController: _pagingController,
                          padding: EdgeInsets.fromLTRB(
                            20,
                            8,
                            20,
                            listBottomPadding,
                          ),
                          builderDelegate: orderBuilderDelegate,
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: isCompact
          ? FloatingActionButton.extended(
              onPressed: () => _openCreateOrder(context),
              icon: const Icon(Icons.add_shopping_cart_outlined),
              label: const Text('Tạo đơn'),
            )
          : FloatingActionButton(
              tooltip: 'Tạo đơn',
              onPressed: () => _openCreateOrder(context),
              child: const Icon(Icons.add_shopping_cart_outlined),
            ),
    );
  }
}

class _EmptyOrders extends StatelessWidget {
  const _EmptyOrders({required this.onCreateOrder});

  final VoidCallback onCreateOrder;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.receipt_long_outlined, size: 64),
            const SizedBox(height: 16),
            Text(
              'Chưa có đơn hàng',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Hãy đặt hàng để xem lịch sử đơn hàng của bạn.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: onCreateOrder,
              icon: const Icon(Icons.add_shopping_cart_outlined),
              label: const Text('Tạo đơn hàng đầu tiên'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PagedErrorState extends StatelessWidget {
  const _PagedErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline, color: colors.error, size: 40),
            const SizedBox(height: 10),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyFilterResult extends StatelessWidget {
  const _EmptyFilterResult({
    required this.activeCriteriaSummary,
    required this.canClearCriteria,
    required this.onClearCriteria,
  });

  final String activeCriteriaSummary;
  final bool canClearCriteria;
  final VoidCallback onClearCriteria;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.search_off_outlined, size: 64),
            const SizedBox(height: 16),
            Text(
              'Không tìm thấy đơn hàng phù hợp',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Thử thay đổi từ khóa hoặc bộ lọc trạng thái.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            if (activeCriteriaSummary.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                activeCriteriaSummary,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (canClearCriteria) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: onClearCriteria,
                icon: const Icon(Icons.filter_alt_off_outlined),
                label: const Text('Xóa bộ lọc và tìm kiếm'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final OrderStatus status;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final background = _backgroundForStatus(status, isDark: isDark);
    final textColor = _textForStatus(status, isDark: isDark);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.28)),
      ),
      child: Text(
        status.label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}

class _PaymentStatusChip extends StatelessWidget {
  const _PaymentStatusChip({required this.paymentStatus});

  final OrderPaymentStatus paymentStatus;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final background = _paymentStatusBackground(paymentStatus, isDark: isDark);
    final textColor = _paymentStatusTextColor(paymentStatus, isDark: isDark);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.28)),
      ),
      child: Text(
        paymentStatus.label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}

Color _paymentStatusBackground(
  OrderPaymentStatus status, {
  required bool isDark,
}) {
  if (isDark) {
    switch (status) {
      case OrderPaymentStatus.cancelled:
        return const Color(0xFF3B1F26);
      case OrderPaymentStatus.failed:
        return const Color(0xFF4C2A15);
      case OrderPaymentStatus.unpaid:
        return const Color(0xFF4A1E24);
      case OrderPaymentStatus.paid:
        return const Color(0xFF1A3F2D);
      case OrderPaymentStatus.debtRecorded:
        return const Color(0xFF4C3B16);
    }
  }
  switch (status) {
    case OrderPaymentStatus.cancelled:
      return const Color(0xFFFDE7EC);
    case OrderPaymentStatus.failed:
      return const Color(0xFFFFEDD5);
    case OrderPaymentStatus.unpaid:
      return const Color(0xFFFEECEE);
    case OrderPaymentStatus.paid:
      return const Color(0xFFE8F8EF);
    case OrderPaymentStatus.debtRecorded:
      return const Color(0xFFFFF6DB);
  }
}

Color _paymentStatusTextColor(
  OrderPaymentStatus status, {
  required bool isDark,
}) {
  if (isDark) {
    switch (status) {
      case OrderPaymentStatus.cancelled:
        return const Color(0xFFFDA4AF);
      case OrderPaymentStatus.failed:
        return const Color(0xFFF6AD55);
      case OrderPaymentStatus.unpaid:
        return const Color(0xFFFDA4AF);
      case OrderPaymentStatus.paid:
        return const Color(0xFF86EFAC);
      case OrderPaymentStatus.debtRecorded:
        return const Color(0xFFF4D18A);
    }
  }
  switch (status) {
    case OrderPaymentStatus.cancelled:
      return const Color(0xFFB42318);
    case OrderPaymentStatus.failed:
      return const Color(0xFFB54708);
    case OrderPaymentStatus.unpaid:
      return const Color(0xFFB42318);
    case OrderPaymentStatus.paid:
      return const Color(0xFF1D7A3A);
    case OrderPaymentStatus.debtRecorded:
      return const Color(0xFF8A5A00);
  }
}

Color _backgroundForStatus(OrderStatus status, {required bool isDark}) {
  if (isDark) {
    switch (status) {
      case OrderStatus.pendingApproval:
        return const Color(0xFF4C3B16);
      case OrderStatus.approved:
        return const Color(0xFF1E3150);
      case OrderStatus.shipping:
        return const Color(0xFF154052);
      case OrderStatus.completed:
        return const Color(0xFF1A3F2D);
      case OrderStatus.cancelled:
        return const Color(0xFF2A3642);
    }
  }
  switch (status) {
    case OrderStatus.pendingApproval:
      return const Color(0xFFFFF6DB);
    case OrderStatus.approved:
      return const Color(0xFFEAF2FF);
    case OrderStatus.shipping:
      return const Color(0xFFE0F2FE);
    case OrderStatus.completed:
      return const Color(0xFFE8F8EF);
    case OrderStatus.cancelled:
      return const Color(0xFFF1F5F9);
  }
}

Color _textForStatus(OrderStatus status, {required bool isDark}) {
  if (isDark) {
    switch (status) {
      case OrderStatus.pendingApproval:
        return const Color(0xFFF4D18A);
      case OrderStatus.approved:
        return const Color(0xFF93C5FD);
      case OrderStatus.shipping:
        return const Color(0xFF7DD3FC);
      case OrderStatus.completed:
        return const Color(0xFF86EFAC);
      case OrderStatus.cancelled:
        return const Color(0xFFCBD5E1);
    }
  }
  switch (status) {
    case OrderStatus.pendingApproval:
      return const Color(0xFF8A5A00);
    case OrderStatus.approved:
      return const Color(0xFF1A4FA3);
    case OrderStatus.shipping:
      return const Color(0xFF0C4A6E);
    case OrderStatus.completed:
      return const Color(0xFF1D7A3A);
    case OrderStatus.cancelled:
      return const Color(0xFF64748B);
  }
}
