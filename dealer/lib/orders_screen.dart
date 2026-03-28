import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:infinite_scroll_pagination/infinite_scroll_pagination.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'global_search.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'order_query_service.dart';
import 'notifications_screen.dart';
import 'query_page.dart';
import 'widgets/notification_icon_button.dart';
import 'product_list_screen.dart';
import 'utils.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

part 'orders_screen_support.dart';

_OrdersTexts _ordersTexts(BuildContext context) => _OrdersTexts(
  isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
);

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key, this.onSwitchTab});

  final ValueChanged<int>? onSwitchTab;

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  static const int _pageSize = 10;

  late final PagingController<int, Order> _pagingController;
  late final TextEditingController _searchController;
  Timer? _searchDebounce;
  Timer? _orderRefreshDebounce;
  String _lastOrderSnapshot = '';
  bool _hasInitializedSnapshot = false;
  OrderController? _observedOrderController;
  OrderQueryRepository? _orderQueryRepository;
  int _queryRevision = 0;

  OrderListQuery _query = const OrderListQuery();

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
      _orderQueryRepository = OrderQueryRepository(
        localDataSource: LocalOrderQueryDataSource(orderController: controller),
      );
      _observedOrderController?.addListener(_handleOrderControllerChanged);
      _syncOrderSnapshot(controller.orders);
      _refreshOrders();
    }
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _orderRefreshDebounce?.cancel();
    _observedOrderController?.removeListener(_handleOrderControllerChanged);
    _searchController.dispose();
    _pagingController.dispose();
    super.dispose();
  }

  void _confirmCancel(BuildContext context, Order order) {
    final texts = _ordersTexts(context);
    showDialog<void>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        final colors = Theme.of(context).colorScheme;
        return AlertDialog(
          title: Text(texts.confirmCancelTitle),
          content: Text(texts.confirmCancelDescription(order.id)),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(texts.noAction),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: colors.errorContainer,
                foregroundColor: colors.onErrorContainer,
              ),
              onPressed: () async {
                Navigator.of(dialogContext).pop();
                final orderController = OrderScope.of(context);
                final success = await orderController.updateOrderStatus(
                  order.id,
                  OrderStatus.cancelled,
                );
                if (!context.mounted || success) {
                  return;
                }
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      orderControllerErrorMessage(
                        orderController.lastActionMessage,
                        isEnglish: texts.isEnglish,
                      ),
                    ),
                  ),
                );
              },
              child: Text(texts.cancelOrderAction),
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
    final texts = _ordersTexts(context);
    final colors = Theme.of(context).colorScheme;
    final layout = _OrdersLayoutConfig.fromContext(context);

    final orderController = OrderScope.of(context);
    final warrantyController = WarrantyScope.of(context);
    final querySnapshot =
        _orderQueryRepository?.readSnapshot(_query) ??
        const OrderQuerySnapshot.empty();
    final allOrders = orderController.orders;
    final pendingCount = querySnapshot.pendingCount;
    final debtOrderCount = querySnapshot.outstandingOrderCount;

    final statusFilters = <OrderStatus?>[
      null,
      OrderStatus.pending,
      OrderStatus.confirmed,
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
    final hasSummaryData = pendingCount > 0 || debtOrderCount > 0;
    final hasActiveFilters =
        _query.status != null ||
        _query.paymentStatus != null ||
        _query.onlyOutstanding;
    final hasActiveSearch = _query.normalizedSearchText.isNotEmpty;
    final activeCriteriaSummary = _activeCriteriaSummary(context);
    final canResetCriteria = hasActiveFilters || hasActiveSearch;
    final hasActiveCriteria = canResetCriteria;
    final orderBuilderDelegate = PagedChildBuilderDelegate<Order>(
      itemBuilder: (context, order, index) {
        final canCancel =
            order.status == OrderStatus.pending ||
            order.status == OrderStatus.confirmed;
        final shouldShowSerialProgress =
            order.status == OrderStatus.completed ||
            order.status == OrderStatus.shipping;
        final serialProcessedCount = warrantyController.activationCountForOrder(
          order.id,
        );
        final orderSemanticsLabel = texts.orderSemanticsLabel(order);
        final card = FadeSlideIn(
          key: ValueKey(order.id),
          delay: Duration(
            milliseconds: math.min(25 * (index % _pageSize), 150),
          ),
          child: Semantics(
            container: true,
            label: orderSemanticsLabel,
            hint: texts.openOrderDetailsHint,
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
                                  texts.placedAt(order.createdAt),
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
                        texts.itemCountLabel(order.totalItems),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        texts.paymentMethodSummary(
                          context,
                          order.paymentMethod,
                        ),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            texts.paymentStatusLabel,
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
                              texts.serialProgressLabel(
                                serialProcessedCount,
                                order.totalItems,
                              ),
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: colors.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ],
                      if (order.outstandingAmount > 0) ...[
                        const SizedBox(height: 4),
                        Text(
                          texts.outstandingAmountLabel(order.outstandingAmount),
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
                          child: Text(texts.cancelOrderAction),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
        if (layout.useGridLayout) {
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
          message: texts.loadOrdersFailedMessage,
        );
      },
      newPageErrorIndicatorBuilder: (context) {
        return _PagedErrorState(
          onRetry: _pagingController.retryLastFailedRequest,
          message: texts.loadMoreOrdersFailedMessage,
        );
      },
    );

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(texts.screenTitle),
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
          constraints: BoxConstraints(maxWidth: layout.contentMaxWidth),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: texts.searchHint,
                    prefixIcon: const Icon(Icons.search_outlined),
                    suffixIcon: hasActiveSearch
                        ? IconButton(
                            onPressed: _clearSearch,
                            tooltip: texts.clearSearchTooltip,
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
                label: texts.statusFilterLabel,
                options: statusFilters,
                selected: _query.status,
                onSelected: _setStatusFilter,
                labelFor: (status) => status == null
                    ? texts.allFilterOption
                    : texts.orderStatusLabel(status),
                useWrapLayout: layout.useWrapFilters,
              ),
              const SizedBox(height: 8),
              _buildFilterChips<OrderPaymentStatus>(
                context: context,
                label: texts.paymentFilterLabel,
                options: paymentFilters,
                selected: _query.paymentStatus,
                onSelected: _setPaymentStatusFilter,
                labelFor: (status) => status == null
                    ? texts.allFilterOption
                    : texts.orderPaymentStatusLabel(status),
                useWrapLayout: layout.useWrapFilters,
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
                                if (pendingCount > 0)
                                  Text(
                                    texts.pendingCountLabel(pendingCount),
                                    style: Theme.of(context).textTheme.bodySmall
                                        ?.copyWith(
                                          color: colors.onSurfaceVariant,
                                          fontWeight: FontWeight.w600,
                                        ),
                                  ),
                                if (pendingCount > 0 && debtOrderCount > 0)
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
                                        texts.outstandingOrderCountLabel(
                                          debtOrderCount,
                                        ),
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(
                                              color: _query.onlyOutstanding
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
                              texts.filteredBadgeLabel,
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
                        tooltip: texts.clearFiltersTooltip,
                        icon: const Icon(
                          Icons.filter_alt_off_outlined,
                          size: 20,
                        ),
                      ),
                    PopupMenuButton<OrderSortOption>(
                      tooltip: texts.sortTooltip,
                      onSelected: _setSort,
                      itemBuilder: (context) => OrderSortOption.values
                          .map(
                            (sort) => PopupMenuItem<OrderSortOption>(
                              value: sort,
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 22,
                                    child: _query.sort == sort
                                        ? Icon(
                                            Icons.check,
                                            size: 18,
                                            color: colors.primary,
                                          )
                                        : null,
                                  ),
                                  Text(texts.sortLabel(sort)),
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
                            Text(texts.sortLabel(_query.sort)),
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
                    await orderController.refresh();
                    _refreshOrders();
                  },
                  child: layout.useGridLayout
                      ? PagedGridView<int, Order>(
                          keyboardDismissBehavior:
                              ScrollViewKeyboardDismissBehavior.onDrag,
                          physics: const AlwaysScrollableScrollPhysics(),
                          pagingController: _pagingController,
                          padding: EdgeInsets.fromLTRB(
                            20,
                            8,
                            20,
                            layout.listBottomPadding,
                          ),
                          gridDelegate:
                              SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: layout.gridColumnCount,
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                                mainAxisExtent: layout.gridItemExtent,
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
                            layout.listBottomPadding,
                          ),
                          builderDelegate: orderBuilderDelegate,
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: layout.isCompact
          ? FloatingActionButton.extended(
              onPressed: () => _openCreateOrder(context),
              icon: const Icon(Icons.add_shopping_cart_outlined),
              label: Text(texts.createOrderAction),
            )
          : FloatingActionButton(
              tooltip: texts.createOrderAction,
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
    final texts = _ordersTexts(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.receipt_long_outlined, size: 64),
            const SizedBox(height: 16),
            Text(
              texts.emptyOrdersTitle,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              texts.emptyOrdersDescription,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: onCreateOrder,
              icon: const Icon(Icons.add_shopping_cart_outlined),
              label: Text(texts.createFirstOrderAction),
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
    final texts = _ordersTexts(context);
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
              label: Text(texts.retryAction),
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
    final texts = _ordersTexts(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.search_off_outlined, size: 64),
            const SizedBox(height: 16),
            Text(
              texts.emptyFilteredTitle,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              texts.emptyFilteredDescription,
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
                label: Text(texts.clearFiltersAndSearchAction),
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
    final texts = _ordersTexts(context);
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
        texts.orderStatusLabel(status),
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
    final texts = _ordersTexts(context);
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
        texts.orderPaymentStatusLabel(paymentStatus),
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}

class _OrdersTexts {
  const _OrdersTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Orders' : 'Đơn hàng';
  String get searchHint => isEnglish
      ? 'Search order ID, customer, phone, product...'
      : 'Tìm mã đơn, tên khách, SĐT, sản phẩm...';
  String get clearSearchTooltip => isEnglish ? 'Clear search' : 'Xóa tìm kiếm';
  String get statusFilterLabel => isEnglish ? 'Status' : 'Trạng thái';
  String get paymentFilterLabel => isEnglish ? 'Payment' : 'Thanh toán';
  String get allFilterOption => isEnglish ? 'All' : 'Tất cả';
  String get filteredBadgeLabel => isEnglish ? 'Filtered' : 'Đang lọc';
  String get clearFiltersTooltip => isEnglish ? 'Clear filters' : 'Xóa bộ lọc';
  String get sortTooltip => isEnglish ? 'Sort orders' : 'Sắp xếp đơn hàng';
  String get createOrderAction => isEnglish ? 'Create order' : 'Tạo đơn';
  String get createFirstOrderAction =>
      isEnglish ? 'Create your first order' : 'Tạo đơn hàng đầu tiên';
  String get emptyOrdersTitle =>
      isEnglish ? 'No orders yet' : 'Chưa có đơn hàng';
  String get emptyOrdersDescription => isEnglish
      ? 'Place an order to see your order history here.'
      : 'Hãy đặt hàng để xem lịch sử đơn hàng của bạn.';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get emptyFilteredTitle => isEnglish
      ? 'No matching orders found'
      : 'Không tìm thấy đơn hàng phù hợp';
  String get emptyFilteredDescription => isEnglish
      ? 'Try adjusting your keyword or filters.'
      : 'Thử thay đổi từ khóa hoặc bộ lọc trạng thái.';
  String get clearFiltersAndSearchAction =>
      isEnglish ? 'Clear filters and search' : 'Xóa bộ lọc và tìm kiếm';
  String get loadOrdersFailedMessage => isEnglish
      ? 'Unable to load orders.'
      : 'Không thể tải danh sách đơn hàng.';
  String get loadMoreOrdersFailedMessage => isEnglish
      ? 'Unable to load more orders.'
      : 'Không thể tải thêm đơn hàng.';
  String get outstandingCriteriaLabel => isEnglish ? 'Outstanding' : 'Còn nợ';
  String get confirmCancelTitle =>
      isEnglish ? 'Confirm cancellation' : 'Xác nhận hủy đơn';
  String get noAction => isEnglish ? 'No' : 'Không';
  String get cancelOrderAction => isEnglish ? 'Cancel order' : 'Hủy đơn';
  String get updateOrderStatusFailedMessage => isEnglish
      ? 'Unable to update the order status. Please try again.'
      : 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.';
  String get openOrderDetailsHint =>
      isEnglish ? 'Open order details' : 'Mở chi tiết đơn hàng';
  String get paymentStatusLabel =>
      isEnglish ? 'Payment status:' : 'Trạng thái TT:';

  String sortLabel(OrderSortOption sort) {
    switch (sort) {
      case OrderSortOption.newest:
        return isEnglish ? 'Newest first' : 'Mới nhất';
      case OrderSortOption.highestValue:
        return isEnglish ? 'Highest value' : 'Giá trị cao';
      case OrderSortOption.debtFirst:
        return isEnglish ? 'Outstanding first' : 'Còn nợ trước';
    }
  }

  String orderStatusLabel(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return isEnglish ? 'Pending' : '\u0043h\u1EDD x\u1EED l\u00FD';
      case OrderStatus.confirmed:
        return isEnglish ? 'Confirmed' : '\u0110\u00E3 x\u00E1c nh\u1EADn';
      case OrderStatus.shipping:
        return isEnglish ? 'Shipping' : 'Đang giao';
      case OrderStatus.completed:
        return isEnglish ? 'Completed' : 'Hoàn thành';
      case OrderStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
    }
  }

  String paymentMethodLabel(BuildContext context, OrderPaymentMethod method) =>
      method.localizedLabel(context);

  String orderPaymentStatusLabel(OrderPaymentStatus status) {
    switch (status) {
      case OrderPaymentStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
      case OrderPaymentStatus.failed:
        return isEnglish ? 'Failed' : 'Thất bại';
      case OrderPaymentStatus.unpaid:
        return isEnglish ? 'Unpaid' : 'Chưa thanh toán';
      case OrderPaymentStatus.paid:
        return isEnglish ? 'Paid' : 'Đã thanh toán';
      case OrderPaymentStatus.debtRecorded:
        return isEnglish ? 'Debt recorded' : 'Công nợ';
    }
  }

  String statusCriteriaLabel(OrderStatus status) =>
      '${isEnglish ? 'Status' : 'Trạng thái'}: ${orderStatusLabel(status)}';

  String paymentCriteriaLabel(OrderPaymentStatus status) =>
      '${isEnglish ? 'Payment' : 'Thanh toán'}: '
      '${orderPaymentStatusLabel(status)}';

  String keywordCriteriaLabel(String value) =>
      '${isEnglish ? 'Keyword' : 'Từ khóa'}: "$value"';

  String confirmCancelDescription(String orderId) => isEnglish
      ? 'Are you sure you want to cancel order $orderId?'
      : 'Bạn có chắc muốn hủy đơn hàng $orderId?';

  String orderSemanticsLabel(Order order) {
    final count = itemCountLabel(order.totalItems);
    return isEnglish
        ? 'Order ${order.id}, ${order.receiverName}, total ${formatVnd(order.total)}, $count'
        : 'Đơn ${order.id}, ${order.receiverName}, tổng ${formatVnd(order.total)}, $count';
  }

  String placedAt(DateTime value) =>
      '${isEnglish ? 'Placed' : 'Đặt'} ${relativeTimeLabel(value)}';

  String itemCountLabel(int count) {
    if (!isEnglish) {
      return '$count sản phẩm';
    }
    return '$count ${count == 1 ? 'item' : 'items'}';
  }

  String paymentMethodSummary(
    BuildContext context,
    OrderPaymentMethod method,
  ) =>
      '${isEnglish ? 'Payment' : 'Thanh toán'}: '
      '${paymentMethodLabel(context, method)}';

  String serialProgressLabel(int processedCount, int totalCount) => isEnglish
      ? 'Serials $processedCount/$totalCount'
      : 'Serial $processedCount/$totalCount';

  String outstandingAmountLabel(int amount) => isEnglish
      ? 'Outstanding: ${formatVnd(amount)}'
      : 'Còn nợ: ${formatVnd(amount)}';

  String pendingCountLabel(int count) => isEnglish
      ? '$count ${count == 1 ? 'pending order' : 'pending orders'}'
      : '$count đơn chờ xử lý';

  String outstandingOrderCountLabel(int count) => isEnglish
      ? '$count ${count == 1 ? 'order with outstanding debt' : 'orders with outstanding debt'}'
      : '$count đơn còn nợ';

  String relativeTimeLabel(DateTime value, {DateTime? now}) {
    final current = (now ?? DateTime.now()).toLocal();
    final target = value.toLocal();
    final diff = current.difference(target);

    if (diff.isNegative) {
      return formatDateTime(target);
    }
    if (diff.inMinutes < 1) {
      return isEnglish ? 'just now' : 'vừa xong';
    }
    if (diff.inHours < 1) {
      final minutes = diff.inMinutes;
      return isEnglish
          ? '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago'
          : '$minutes phút trước';
    }
    if (diff.inDays < 1) {
      final hours = diff.inHours;
      return isEnglish
          ? '$hours ${hours == 1 ? 'hour' : 'hours'} ago'
          : '$hours giờ trước';
    }

    final currentDate = DateTime(current.year, current.month, current.day);
    final targetDate = DateTime(target.year, target.month, target.day);
    final dayDiff = currentDate.difference(targetDate).inDays;

    if (dayDiff == 1) {
      final time =
          '${target.hour.toString().padLeft(2, '0')}:${target.minute.toString().padLeft(2, '0')}';
      return isEnglish ? 'yesterday $time' : 'hôm qua $time';
    }
    if (dayDiff < 7) {
      return isEnglish
          ? '$dayDiff ${dayDiff == 1 ? 'day' : 'days'} ago'
          : '$dayDiff ngày trước';
    }
    return formatDateTime(target);
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
      case OrderStatus.pending:
        return const Color(0xFF4C3B16);
      case OrderStatus.confirmed:
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
    case OrderStatus.pending:
      return const Color(0xFFFFF6DB);
    case OrderStatus.confirmed:
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
      case OrderStatus.pending:
        return const Color(0xFFF4D18A);
      case OrderStatus.confirmed:
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
    case OrderStatus.pending:
      return const Color(0xFF8A5A00);
    case OrderStatus.confirmed:
      return const Color(0xFF1A4FA3);
    case OrderStatus.shipping:
      return const Color(0xFF0C4A6E);
    case OrderStatus.completed:
      return const Color(0xFF1D7A3A);
    case OrderStatus.cancelled:
      return const Color(0xFF64748B);
  }
}
