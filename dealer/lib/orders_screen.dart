import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:infinite_scroll_pagination/infinite_scroll_pagination.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dealer_navigation.dart';
import 'global_search.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'order_query_service.dart';
import 'query_page.dart';
import 'widgets/notification_icon_button.dart';
import 'utils.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/error_state_with_retry.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/order_status_chip.dart';
import 'widgets/skeleton_box.dart';
import 'dealer_routes.dart';

part 'orders_screen_support.dart';
part 'orders_screen_actions.dart';
part 'orders_screen_overview.dart';
part 'orders_screen_widgets.dart';
part 'orders_screen_texts.dart';

const int _pageSize = 10;
const double _floatingOverviewCollapsedHeight = 8;
const double _floatingOverviewRevealDistance = 72;
const double _floatingOverviewHideDistance = 132;

_OrdersTexts _ordersTexts(BuildContext context) => _OrdersTexts(
  isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
);

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({
    super.key,
    this.onSwitchTab,
    this.showFallbackNavigation = true,
    this.pendingFilterRevision = 0,
  });

  final ValueChanged<int>? onSwitchTab;
  final bool showFallbackNavigation;
  final int pendingFilterRevision;

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  late final PagingController<int, Order> _pagingController;
  late final TextEditingController _searchController;
  Timer? _searchDebounce;
  Timer? _orderRefreshDebounce;
  String _lastOrderSnapshot = '';
  bool _hasInitializedSnapshot = false;
  OrderController? _observedOrderController;
  OrderQueryRepository? _orderQueryRepository;
  int _queryRevision = 0;
  double _floatingOverviewReveal = 1;
  double? _lastObservedScrollPixels;
  double _overviewSectionHeight = 0;

  OrderListQuery _query = const OrderListQuery();

  int get _activeFilterCount {
    var count = 0;
    if (_query.onlyOutstanding) count++;
    if (_query.status != null) count++;
    if (_query.paymentStatus != null) count++;
    if (_query.sort != OrderSortOption.newest) count++;
    return count;
  }

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
  void didUpdateWidget(OrdersScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.pendingFilterRevision != oldWidget.pendingFilterRevision &&
        widget.pendingFilterRevision > 0) {
      _setStatusFilter(OrderStatus.pending);
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
    final outstandingOrderCount = querySnapshot.outstandingOrderCount;

    final statusFilters = <OrderStatus?>[
      null,
      OrderStatus.pending,
      OrderStatus.confirmed,
      OrderStatus.processing,
      OrderStatus.shipping,
      OrderStatus.completed,
      OrderStatus.cancelRequested,
      OrderStatus.cancelRejected,
      OrderStatus.cancelled,
    ];
    final paymentFilters = <OrderPaymentStatus?>[
      null,
      OrderPaymentStatus.pending,
      OrderPaymentStatus.paid,
      OrderPaymentStatus.cancelled,
    ];
    final hasActiveSearch = _query.normalizedSearchText.isNotEmpty;
    final hasActiveCriteria = _query.hasCriteria;
    final activeCriteriaSummary = _activeCriteriaSummary(context);
    final resultCount = querySnapshot.items.length;
    final useFloatingOverview = layout.isCompact && allOrders.isNotEmpty;
    final orderBuilderDelegate = PagedChildBuilderDelegate<Order>(
      itemBuilder: (context, order, index) {
        final pageIndex = index % _pageSize;
        final shouldAnimate = pageIndex < 6;
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
          animate: shouldAnimate,
          delay: shouldAnimate && pageIndex < 3
              ? Duration(milliseconds: 50 * pageIndex)
              : Duration.zero,
          child: Semantics(
            container: true,
            label: orderSemanticsLabel,
            hint: texts.openOrderDetailsHint,
            child: RepaintBoundary(
              child: Card(
                clipBehavior: Clip.antiAlias,
                elevation: 0,
                color: colors.surface,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(22),
                  side: BorderSide(
                    color: colors.outlineVariant.withValues(alpha: 0.55),
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    InkWell(
                      onTap: () => _openOrderDetail(context, order.id),
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(
                          18,
                          18,
                          18,
                          canCancel ? 12 : 18,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        order.receiverName,
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleMedium
                                            ?.copyWith(
                                              fontWeight: FontWeight.w700,
                                            ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        texts.placedAt(order.createdAt),
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyMedium
                                            ?.copyWith(
                                              color: colors.onSurfaceVariant,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),
                                ConstrainedBox(
                                  constraints: BoxConstraints(
                                    maxWidth: layout.isCompact ? 150 : 180,
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      OrderStatusChip(
                                        status: order.status,
                                        label: texts.orderStatusLabel(
                                          order.status,
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Text(
                                        formatVnd(order.total),
                                        textAlign: TextAlign.end,
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleLarge
                                            ?.copyWith(
                                              color: colors.onSurface,
                                              fontWeight: FontWeight.w800,
                                              height: 1.05,
                                            ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        texts.totalAmountMetricLabel,
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelMedium
                                            ?.copyWith(
                                              color: colors.onSurfaceVariant,
                                              fontWeight: FontWeight.w600,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                _OrderMetaBadge(
                                  icon: Icons.receipt_long_outlined,
                                  label: order.id,
                                ),
                                _OrderMetaBadge(
                                  icon: Icons.inventory_2_outlined,
                                  label: texts.itemCountLabel(order.totalItems),
                                ),
                                if (order.receiverPhone.trim().isNotEmpty)
                                  _OrderMetaBadge(
                                    icon: Icons.call_outlined,
                                    label: order.receiverPhone,
                                  ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                _OrderMetaBadge(
                                  icon: _paymentMethodIcon(order.paymentMethod),
                                  label: texts.paymentMethodLabel(
                                    context,
                                    order.paymentMethod,
                                  ),
                                ),
                                _OrderMetaBadge(
                                  icon: Icons.payments_outlined,
                                  label:
                                      '${texts.amountPaidMetricLabel}: ${formatVnd(order.paidAmount)}',
                                ),
                                OrderPaymentStatusChip(
                                  paymentStatus: order.paymentStatus,
                                  label: texts.orderPaymentStatusLabel(
                                    order.paymentStatus,
                                  ),
                                ),
                                if (order.outstandingAmount > 0)
                                  _OrderMetaBadge(
                                    icon: Icons.warning_amber_rounded,
                                    label: texts.outstandingAmountLabel(
                                      order.outstandingAmount,
                                    ),
                                    backgroundColor: colors.errorContainer
                                        .withValues(alpha: 0.16),
                                    foregroundColor: colors.error,
                                  ),
                              ],
                            ),
                            if (shouldShowSerialProgress) ...[
                              const SizedBox(height: 12),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: colors.surface.withValues(alpha: 0.72),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: colors.outlineVariant.withValues(
                                      alpha: 0.28,
                                    ),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.qr_code_scanner_rounded,
                                          size: 18,
                                          color: colors.primary,
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            texts.serialProgressSectionLabel,
                                            style: Theme.of(context)
                                                .textTheme
                                                .labelLarge
                                                ?.copyWith(
                                                  fontWeight: FontWeight.w700,
                                                ),
                                          ),
                                        ),
                                        Text(
                                          texts.serialProgressLabel(
                                            serialProcessedCount,
                                            order.totalItems,
                                          ),
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.copyWith(
                                                color: colors.onSurfaceVariant,
                                                fontWeight: FontWeight.w600,
                                              ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(999),
                                      child: LinearProgressIndicator(
                                        value: order.totalItems > 0
                                            ? serialProcessedCount /
                                                  order.totalItems
                                            : 0,
                                        minHeight: 6,
                                        backgroundColor:
                                            colors.surfaceContainerHighest,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    if (canCancel) const Divider(height: 1),
                    if (canCancel)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
                        child: Row(
                          children: [
                            Flexible(
                              child: OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: colors.error,
                                  side: BorderSide(
                                    color: colors.error.withValues(alpha: 0.3),
                                  ),
                                  minimumSize: const Size(0, 44),
                                ),
                                onPressed: () => _confirmCancel(context, order),
                                icon: const Icon(Icons.close_rounded, size: 18),
                                label: Text(
                                  texts.cancelOrderAction,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                            const Spacer(),
                            if (order.status == OrderStatus.pending)
                              FilledButton.icon(
                                style: FilledButton.styleFrom(
                                  minimumSize: const Size(0, 44),
                                ),
                                onPressed: () => _quickUpdateStatus(
                                  context,
                                  order,
                                  OrderStatus.confirmed,
                                  texts,
                                ),
                                icon: const Icon(Icons.check_rounded, size: 18),
                                label: Text(texts.confirmOrderAction),
                              )
                            else if (order.status == OrderStatus.confirmed)
                              FilledButton.icon(
                                style: FilledButton.styleFrom(
                                  minimumSize: const Size(0, 44),
                                ),
                                onPressed: () => _quickUpdateStatus(
                                  context,
                                  order,
                                  OrderStatus.shipping,
                                  texts,
                                ),
                                icon: const Icon(
                                  Icons.local_shipping_outlined,
                                  size: 18,
                                ),
                                label: Text(texts.startShippingAction),
                              ),
                          ],
                        ),
                      ),
                  ],
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
      firstPageProgressIndicatorBuilder: (context) {
        if (layout.useGridLayout) {
          return Column(
            children: List.generate(2, (rowIndex) {
              return Padding(
                padding: EdgeInsets.only(bottom: rowIndex < 1 ? 12 : 0),
                child: Row(
                  children: List.generate(layout.gridColumnCount, (colIndex) {
                    return Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(
                          left: colIndex > 0 ? 6 : 0,
                          right: colIndex < layout.gridColumnCount - 1 ? 6 : 0,
                        ),
                        child: SizedBox(
                          height: layout.gridItemExtent,
                          child: const _OrderCardSkeleton(),
                        ),
                      ),
                    );
                  }),
                ),
              );
            }),
          );
        }
        return Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Column(
            children: List.generate(
              4,
              (index) => const Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: _OrderCardSkeleton(),
              ),
            ),
          ),
        );
      },
      newPageProgressIndicatorBuilder: (context) {
        if (layout.useGridLayout) {
          return Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 12),
            child: Row(
              children: List.generate(layout.gridColumnCount, (colIndex) {
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                      left: colIndex > 0 ? 6 : 0,
                      right: colIndex < layout.gridColumnCount - 1 ? 6 : 0,
                    ),
                    child: SizedBox(
                      height: layout.gridItemExtent,
                      child: const _OrderCardSkeleton(),
                    ),
                  ),
                );
              }),
            ),
          );
        }
        return const Padding(
          padding: EdgeInsets.only(top: 4, bottom: 12),
          child: _OrderCardSkeleton(),
        );
      },
      noItemsFoundIndicatorBuilder: (context) {
        if (allOrders.isEmpty) {
          return FadeSlideIn(
            child: _EmptyOrders(onCreateOrder: () => _openCreateOrder(context)),
          );
        }
        return _EmptyFilterResult(
          activeCriteriaSummary: activeCriteriaSummary,
          canClearCriteria: hasActiveCriteria,
          onClearCriteria: _clearAllCriteria,
        );
      },
      firstPageErrorIndicatorBuilder: (context) {
        return ErrorStateWithRetry(
          onRetry: _pagingController.refresh,
          message: texts.loadOrdersFailedMessage,
          retryLabel: texts.retryAction,
        );
      },
      newPageErrorIndicatorBuilder: (context) {
        return ErrorStateWithRetry(
          onRetry: _pagingController.retryLastFailedRequest,
          message: texts.loadMoreOrdersFailedMessage,
          retryLabel: texts.retryAction,
        );
      },
    );

    Widget pagedOrdersView = layout.useGridLayout
        ? PagedGridView<int, Order>(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            physics: const AlwaysScrollableScrollPhysics(),
            pagingController: _pagingController,
            padding: EdgeInsets.fromLTRB(
              20,
              layout.isCompact ? 4 : 8,
              20,
              layout.listBottomPadding,
            ),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: layout.gridColumnCount,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              mainAxisExtent: layout.gridItemExtent,
            ),
            builderDelegate: orderBuilderDelegate,
          )
        : PagedListView<int, Order>(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            physics: const AlwaysScrollableScrollPhysics(),
            pagingController: _pagingController,
            padding: EdgeInsets.fromLTRB(
              20,
              layout.isCompact ? 4 : 8,
              20,
              layout.listBottomPadding,
            ),
            builderDelegate: orderBuilderDelegate,
          );

    if (useFloatingOverview) {
      pagedOrdersView = NotificationListener<ScrollNotification>(
        onNotification: (notification) =>
            _handleScrollNotification(notification, useFloatingOverview: true),
        child: pagedOrdersView,
      );
    }

    final orderListContent = allOrders.isEmpty
        ? Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              layout.isCompact ? 4 : 8,
              20,
              layout.listBottomPadding,
            ),
            child: FadeSlideIn(
              child: _EmptyOrders(
                onCreateOrder: () => _openCreateOrder(context),
              ),
            ),
          )
        : RefreshIndicator(
            onRefresh: () async {
              await orderController.refresh();
              _refreshOrders();
            },
            child: pagedOrdersView,
          );

    return Scaffold(
      appBar: AppBar(
        leading: widget.showFallbackNavigation
            ? const DealerFallbackBackButton(fallbackPath: DealerRoutePath.home)
            : null,
        title: BrandAppBarTitle(texts.screenTitle),
        actions: [
          const GlobalSearchIconButton(),
          NotificationIconButton(
            count: NotificationScope.of(context).unreadCount,
            onPressed: () => context.pushDealerNotifications(),
          ),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: layout.contentMaxWidth),
          child: Column(
            children: [
              _buildOverviewHeaderSlot(
                context: context,
                texts: texts,
                colors: colors,
                layout: layout,
                resultCount: resultCount,
                pendingCount: pendingCount,
                outstandingOrderCount: outstandingOrderCount,
                hasActiveSearch: hasActiveSearch,
                hasActiveCriteria: hasActiveCriteria,
                activeCriteriaSummary: activeCriteriaSummary,
                statusFilters: statusFilters,
                paymentFilters: paymentFilters,
                enableScrollCollapse: useFloatingOverview,
              ),
              Expanded(child: orderListContent),
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
