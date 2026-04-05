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
import 'widgets/skeleton_box.dart';

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
  bool _compactFiltersExpanded = false;
  OrderController? _observedOrderController;
  OrderQueryRepository? _orderQueryRepository;
  int _queryRevision = 0;

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
        return RepaintBoundary(
          child: AlertDialog(
            scrollable: true,
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 20,
            ),
            title: Text(texts.confirmCancelTitle),
            content: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Text(texts.confirmCancelDescription(order.id)),
            ),
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
          ),
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
    final chips = options.map((option) {
      final isSelected = selected == option;
      return FilterChip(
        label: Text(labelFor(option)),
        selected: isSelected,
        onSelected: (_) => onSelected(option),
        showCheckmark: false,
        side: BorderSide(
          color: isSelected
              ? colors.primary.withValues(alpha: 0.35)
              : colors.outlineVariant.withValues(alpha: 0.45),
        ),
        backgroundColor: colors.surface.withValues(alpha: 0.72),
        selectedColor: colors.primaryContainer.withValues(alpha: 0.9),
        labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
          fontWeight: FontWeight.w600,
          color: isSelected
              ? colors.onPrimaryContainer
              : colors.onSurfaceVariant,
        ),
        visualDensity: const VisualDensity(horizontal: -1, vertical: -1),
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      );
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: labelStyle),
        const SizedBox(height: 8),
        if (useWrapLayout)
          Wrap(spacing: 8, runSpacing: 8, children: chips)
        else
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: chips.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, index) => chips[index],
            ),
          ),
      ],
    );
  }

  Widget _buildOverviewPanel({
    required BuildContext context,
    required _OrdersTexts texts,
    required ColorScheme colors,
    required _OrdersLayoutConfig layout,
    required int resultCount,
    required int pendingCount,
    required int debtOrderCount,
    required bool hasActiveSearch,
    required bool hasActiveCriteria,
    required String activeCriteriaSummary,
    required List<OrderStatus?> statusFilters,
    required List<OrderPaymentStatus?> paymentFilters,
  }) {
    if (layout.isCompact) {
      return _buildCompactOverviewPanel(
        context: context,
        texts: texts,
        colors: colors,
        resultCount: resultCount,
        pendingCount: pendingCount,
        debtOrderCount: debtOrderCount,
        hasActiveSearch: hasActiveSearch,
        hasActiveCriteria: hasActiveCriteria,
        activeCriteriaSummary: activeCriteriaSummary,
        statusFilters: statusFilters,
        paymentFilters: paymentFilters,
      );
    }

    return Container(
      padding: EdgeInsets.fromLTRB(
        layout.isCompact ? 16 : 20,
        16,
        layout.isCompact ? 16 : 20,
        18,
      ),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(layout.isCompact ? 26 : 28),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.45),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
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
              filled: true,
              fillColor: colors.surface.withValues(alpha: 0.78),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
            ),
            onChanged: _onSearchChanged,
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _OrdersSummaryStat(
                icon: Icons.receipt_long_outlined,
                value: '$resultCount',
                label: texts.screenTitle,
              ),
              if (pendingCount > 0)
                _OrdersSummaryStat(
                  icon: Icons.hourglass_top_rounded,
                  value: '$pendingCount',
                  label: texts.orderStatusLabel(OrderStatus.pending),
                  isActive: _query.status == OrderStatus.pending,
                  onTap: () => _setStatusFilter(
                    _query.status == OrderStatus.pending
                        ? null
                        : OrderStatus.pending,
                  ),
                ),
              if (debtOrderCount > 0)
                _OrdersSummaryStat(
                  icon: Icons.account_balance_wallet_outlined,
                  value: '$debtOrderCount',
                  label: texts.outstandingCriteriaLabel,
                  isActive: _query.onlyOutstanding,
                  onTap: _toggleOutstandingQuickFilter,
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
                child: _OrdersActionChip(
                  icon: Icons.swap_vert_rounded,
                  label: texts.sortLabel(_query.sort),
                  isActive: _query.sort != OrderSortOption.newest,
                ),
              ),
              if (hasActiveCriteria)
                _OrdersActionChip(
                  icon: Icons.filter_alt_off_outlined,
                  label: texts.clearFiltersAndSearchAction,
                  onTap: _clearAllCriteria,
                ),
            ],
          ),
          if (hasActiveCriteria && activeCriteriaSummary.isNotEmpty) ...[
            const SizedBox(height: 14),
            _buildActiveCriteriaBanner(
              context,
              colors: colors,
              summary: activeCriteriaSummary,
            ),
          ],
          const SizedBox(height: 16),
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
          const SizedBox(height: 12),
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
        ],
      ),
    );
  }

  Widget _buildCompactOverviewPanel({
    required BuildContext context,
    required _OrdersTexts texts,
    required ColorScheme colors,
    required int resultCount,
    required int pendingCount,
    required int debtOrderCount,
    required bool hasActiveSearch,
    required bool hasActiveCriteria,
    required String activeCriteriaSummary,
    required List<OrderStatus?> statusFilters,
    required List<OrderPaymentStatus?> paymentFilters,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.45),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
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
              filled: true,
              fillColor: colors.surface.withValues(alpha: 0.78),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
            ),
            onChanged: _onSearchChanged,
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _OrdersCompactStatChip(
                icon: Icons.receipt_long_outlined,
                value: '$resultCount',
                label: texts.screenTitle,
              ),
              if (pendingCount > 0)
                _OrdersCompactStatChip(
                  icon: Icons.hourglass_top_rounded,
                  value: '$pendingCount',
                  label: texts.orderStatusLabel(OrderStatus.pending),
                  isActive: _query.status == OrderStatus.pending,
                  onTap: () => _setStatusFilter(
                    _query.status == OrderStatus.pending
                        ? null
                        : OrderStatus.pending,
                  ),
                ),
              if (debtOrderCount > 0)
                _OrdersCompactStatChip(
                  icon: Icons.account_balance_wallet_outlined,
                  value: '$debtOrderCount',
                  label: texts.outstandingCriteriaLabel,
                  isActive: _query.onlyOutstanding,
                  onTap: _toggleOutstandingQuickFilter,
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
                child: _OrdersCompactActionChip(
                  icon: Icons.swap_vert_rounded,
                  label: texts.sortLabel(_query.sort),
                  isActive: _query.sort != OrderSortOption.newest,
                ),
              ),
              _OrdersCompactActionChip(
                icon: _compactFiltersExpanded
                    ? Icons.expand_less_rounded
                    : Icons.tune_rounded,
                label: _activeFilterCount > 0
                    ? '${texts.isEnglish ? 'Filters' : 'Bộ lọc'} ($_activeFilterCount)'
                    : (texts.isEnglish ? 'Filters' : 'Bộ lọc'),
                isActive: _compactFiltersExpanded || _activeFilterCount > 0,
                onTap: () {
                  setState(
                    () => _compactFiltersExpanded = !_compactFiltersExpanded,
                  );
                },
              ),
              if (hasActiveCriteria)
                _OrdersCompactActionChip(
                  icon: Icons.filter_alt_off_outlined,
                  label: texts.isEnglish ? 'Clear' : 'Xóa',
                  onTap: _clearAllCriteria,
                ),
            ],
          ),
          if (hasActiveCriteria &&
              activeCriteriaSummary.isNotEmpty &&
              !_compactFiltersExpanded) ...[
            const SizedBox(height: 10),
            _buildActiveCriteriaBanner(
              context,
              colors: colors,
              summary: activeCriteriaSummary,
              compact: true,
            ),
          ],
          AnimatedSize(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOutCubic,
            child: _compactFiltersExpanded
                ? Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (hasActiveCriteria &&
                            activeCriteriaSummary.isNotEmpty) ...[
                          _buildActiveCriteriaBanner(
                            context,
                            colors: colors,
                            summary: activeCriteriaSummary,
                            compact: true,
                          ),
                          const SizedBox(height: 12),
                        ],
                        _buildFilterChips<OrderStatus>(
                          context: context,
                          label: texts.statusFilterLabel,
                          options: statusFilters,
                          selected: _query.status,
                          onSelected: _setStatusFilter,
                          labelFor: (status) => status == null
                              ? texts.allFilterOption
                              : texts.orderStatusLabel(status),
                          useWrapLayout: false,
                        ),
                        const SizedBox(height: 12),
                        _buildFilterChips<OrderPaymentStatus>(
                          context: context,
                          label: texts.paymentFilterLabel,
                          options: paymentFilters,
                          selected: _query.paymentStatus,
                          onSelected: _setPaymentStatusFilter,
                          labelFor: (status) => status == null
                              ? texts.allFilterOption
                              : texts.orderPaymentStatusLabel(status),
                          useWrapLayout: false,
                        ),
                      ],
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveCriteriaBanner(
    BuildContext context, {
    required ColorScheme colors,
    required String summary,
    bool compact = false,
  }) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 10 : 12,
        vertical: compact ? 9 : 10,
      ),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(compact ? 14 : 16),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.filter_alt_rounded,
            size: compact ? 16 : 18,
            color: colors.primary,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              summary,
              maxLines: compact ? 2 : null,
              overflow: compact ? TextOverflow.ellipsis : null,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
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
      OrderPaymentStatus.pending,
      OrderPaymentStatus.paid,
      OrderPaymentStatus.debtRecorded,
      OrderPaymentStatus.failed,
      OrderPaymentStatus.cancelled,
    ];
    final hasActiveSearch = _query.normalizedSearchText.isNotEmpty;
    final hasActiveCriteria = _query.hasCriteria;
    final activeCriteriaSummary = _activeCriteriaSummary(context);
    final resultCount = querySnapshot.items.length;
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
          delay: shouldAnimate
              ? Duration(milliseconds: math.min(25 * pageIndex, 150))
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
                                      _StatusChip(status: order.status),
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
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: colors.surfaceContainerLow.withValues(
                                  alpha: 0.76,
                                ),
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: colors.outlineVariant.withValues(
                                    alpha: 0.3,
                                  ),
                                ),
                              ),
                              child: LayoutBuilder(
                                builder: (context, constraints) {
                                  final useThreeColumns =
                                      constraints.maxWidth >= 380;
                                  final spacing = 10.0;
                                  final itemWidth = useThreeColumns
                                      ? (constraints.maxWidth - spacing * 2) / 3
                                      : (constraints.maxWidth - spacing) / 2;
                                  final metrics = <Widget>[
                                    SizedBox(
                                      width: itemWidth,
                                      child: _OrderMetricTile(
                                        icon: _paymentMethodIcon(
                                          order.paymentMethod,
                                        ),
                                        label: texts.paymentFilterLabel,
                                        value: texts.paymentMethodLabel(
                                          context,
                                          order.paymentMethod,
                                        ),
                                      ),
                                    ),
                                    SizedBox(
                                      width: itemWidth,
                                      child: _OrderMetricTile(
                                        icon: Icons.payments_outlined,
                                        label: texts.amountPaidMetricLabel,
                                        value: formatVnd(order.paidAmount),
                                        accentColor: order.paidAmount > 0
                                            ? colors.primary
                                            : null,
                                      ),
                                    ),
                                    SizedBox(
                                      width: itemWidth,
                                      child: order.outstandingAmount > 0
                                          ? _OrderMetricTile(
                                              icon: Icons
                                                  .account_balance_wallet_outlined,
                                              label: texts
                                                  .outstandingCriteriaLabel,
                                              value: formatVnd(
                                                order.outstandingAmount,
                                              ),
                                              accentColor: colors.error,
                                            )
                                          : _OrderMetricTile(
                                              icon: _paymentStatusIcon(
                                                order.paymentStatus,
                                              ),
                                              label: texts
                                                  .paymentStatusMetricLabel,
                                              value: texts
                                                  .orderPaymentStatusLabel(
                                                    order.paymentStatus,
                                                  ),
                                              accentColor:
                                                  _paymentStatusTextColor(
                                                    order.paymentStatus,
                                                  ),
                                            ),
                                    ),
                                  ];
                                  return Wrap(
                                    spacing: spacing,
                                    runSpacing: spacing,
                                    children: metrics,
                                  );
                                },
                              ),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                _PaymentStatusChip(
                                  paymentStatus: order.paymentStatus,
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
                        child: Align(
                          alignment: Alignment.centerRight,
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
                            label: Text(texts.cancelOrderAction),
                          ),
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
                padding: EdgeInsets.fromLTRB(
                  16,
                  layout.isCompact ? 8 : 12,
                  16,
                  0,
                ),
                child: _buildOverviewPanel(
                  context: context,
                  texts: texts,
                  colors: colors,
                  layout: layout,
                  resultCount: resultCount,
                  pendingCount: pendingCount,
                  debtOrderCount: debtOrderCount,
                  hasActiveSearch: hasActiveSearch,
                  hasActiveCriteria: hasActiveCriteria,
                  activeCriteriaSummary: activeCriteriaSummary,
                  statusFilters: statusFilters,
                  paymentFilters: paymentFilters,
                ),
              ),
              SizedBox(height: layout.isCompact ? 8 : 12),
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
                            layout.isCompact ? 4 : 8,
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
                            layout.isCompact ? 4 : 8,
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

class _OrdersSummaryStat extends StatelessWidget {
  const _OrdersSummaryStat({
    required this.icon,
    required this.value,
    required this.label,
    this.isActive = false,
    this.onTap,
  });

  final IconData icon;
  final String value;
  final String label;
  final bool isActive;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final foreground = isActive ? colors.onPrimaryContainer : colors.onSurface;
    final background = isActive
        ? colors.primaryContainer
        : colors.surface.withValues(alpha: 0.76);
    final borderColor = isActive
        ? colors.primary.withValues(alpha: 0.24)
        : colors.outlineVariant.withValues(alpha: 0.35);
    final child = Container(
      constraints: const BoxConstraints(minWidth: 108),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: (isActive ? colors.onPrimaryContainer : colors.primary)
                  .withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              size: 18,
              color: isActive ? colors.onPrimaryContainer : colors.primary,
            ),
          ),
          const SizedBox(width: 12),
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: foreground,
                  fontWeight: FontWeight.w800,
                  height: 1,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: isActive
                      ? colors.onPrimaryContainer.withValues(alpha: 0.84)
                      : colors.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
    if (onTap == null) {
      return child;
    }
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: child,
      ),
    );
  }
}

class _OrdersActionChip extends StatelessWidget {
  const _OrdersActionChip({
    required this.icon,
    required this.label,
    this.isActive = false,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final chip = Container(
      constraints: const BoxConstraints(minHeight: 58),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isActive
            ? colors.secondaryContainer.withValues(alpha: 0.8)
            : colors.surface.withValues(alpha: 0.76),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isActive
              ? colors.secondary.withValues(alpha: 0.22)
              : colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 18,
            color: isActive ? colors.onSecondaryContainer : colors.primary,
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isActive
                  ? colors.onSecondaryContainer
                  : colors.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
    if (onTap == null) {
      return chip;
    }
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: chip,
      ),
    );
  }
}

class _OrdersCompactStatChip extends StatelessWidget {
  const _OrdersCompactStatChip({
    required this.icon,
    required this.value,
    required this.label,
    this.isActive = false,
    this.onTap,
  });

  final IconData icon;
  final String value;
  final String label;
  final bool isActive;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final chip = Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isActive
            ? colors.primaryContainer.withValues(alpha: 0.94)
            : colors.surface.withValues(alpha: 0.76),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isActive
              ? colors.primary.withValues(alpha: 0.22)
              : colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: isActive ? colors.onPrimaryContainer : colors.primary,
          ),
          const SizedBox(width: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: isActive ? colors.onPrimaryContainer : colors.onSurface,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: isActive
                  ? colors.onPrimaryContainer.withValues(alpha: 0.82)
                  : colors.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
    if (onTap == null) {
      return chip;
    }
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: chip,
      ),
    );
  }
}

class _OrdersCompactActionChip extends StatelessWidget {
  const _OrdersCompactActionChip({
    required this.icon,
    required this.label,
    this.isActive = false,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final chip = Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isActive
            ? colors.secondaryContainer.withValues(alpha: 0.82)
            : colors.surface.withValues(alpha: 0.76),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isActive
              ? colors.secondary.withValues(alpha: 0.22)
              : colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: isActive ? colors.onSecondaryContainer : colors.primary,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: isActive
                  ? colors.onSecondaryContainer
                  : colors.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
    if (onTap == null) {
      return chip;
    }
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: chip,
      ),
    );
  }
}

class _OrderMetaBadge extends StatelessWidget {
  const _OrderMetaBadge({
    required this.icon,
    required this.label,
    this.backgroundColor,
    this.foregroundColor,
  });

  final IconData icon;
  final String label;
  final Color? backgroundColor;
  final Color? foregroundColor;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final effectiveForeground = foregroundColor ?? colors.onSurfaceVariant;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color:
            backgroundColor ??
            colors.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: effectiveForeground.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: effectiveForeground),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: effectiveForeground,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderMetricTile extends StatelessWidget {
  const _OrderMetricTile({
    required this.icon,
    required this.label,
    required this.value,
    this.accentColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color? accentColor;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final effectiveAccent = accentColor ?? colors.primary;
    return Container(
      constraints: const BoxConstraints(minHeight: 84),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.82),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.28),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: effectiveAccent),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: colors.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: accentColor ?? colors.onSurface,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
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
    final background = _backgroundForStatus(status);
    final textColor = _textForStatus(status);

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
    final background = _paymentStatusBackground(paymentStatus);
    final textColor = _paymentStatusTextColor(paymentStatus);

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
      : 'Hãy đặt hàng để xem lịch sử đơn hàng tại đây.';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get emptyFilteredTitle => isEnglish
      ? 'No matching orders found'
      : 'Không tìm thấy đơn hàng phù hợp';
  String get emptyFilteredDescription => isEnglish
      ? 'Try adjusting your keyword or filters.'
      : 'Thử đổi từ khóa hoặc bộ lọc hiện tại.';
  String get clearFiltersAndSearchAction =>
      isEnglish ? 'Clear filters and search' : 'Xóa bộ lọc và tìm kiếm';
  String get loadOrdersFailedMessage => isEnglish
      ? 'Unable to load orders.'
      : 'Không thể tải danh sách đơn hàng.';
  String get loadMoreOrdersFailedMessage => isEnglish
      ? 'Unable to load more orders.'
      : 'Không thể tải thêm đơn hàng.';
  String get outstandingCriteriaLabel =>
      isEnglish ? 'Remaining balance' : 'Còn phải thanh toán';
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
  String get paymentStatusMetricLabel =>
      isEnglish ? 'Payment status' : 'Thanh toán';
  String get totalAmountMetricLabel => isEnglish ? 'Order total' : 'Tổng đơn';
  String get amountPaidMetricLabel => isEnglish ? 'Collected' : 'Đã thu';
  String get serialProgressSectionLabel =>
      isEnglish ? 'Serial progress' : 'Tiến độ serial';

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
        return isEnglish ? 'Pending' : 'Chờ xử lý';
      case OrderStatus.confirmed:
        return isEnglish ? 'Confirmed' : 'Đã xác nhận';
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
      case OrderPaymentStatus.pending:
        return isEnglish ? 'Unpaid' : 'Chưa thanh toán';
      case OrderPaymentStatus.paid:
        return isEnglish ? 'Paid' : 'Đã thanh toán';
      case OrderPaymentStatus.debtRecorded:
        return isEnglish ? 'Open receivable' : 'Công nợ phải thu';
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
      ? '$count ${count == 1 ? 'order with open receivable' : 'orders with open receivable'}'
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

IconData _paymentMethodIcon(OrderPaymentMethod method) {
  switch (method) {
    case OrderPaymentMethod.bankTransfer:
      return Icons.account_balance_outlined;
    case OrderPaymentMethod.debt:
      return Icons.account_balance_wallet_outlined;
  }
}

IconData _paymentStatusIcon(OrderPaymentStatus status) {
  switch (status) {
    case OrderPaymentStatus.cancelled:
      return Icons.do_not_disturb_alt_outlined;
    case OrderPaymentStatus.failed:
      return Icons.error_outline_rounded;
    case OrderPaymentStatus.pending:
      return Icons.schedule_rounded;
    case OrderPaymentStatus.paid:
      return Icons.verified_outlined;
    case OrderPaymentStatus.debtRecorded:
      return Icons.receipt_long_outlined;
  }
}

Color _paymentStatusBackground(OrderPaymentStatus status) {
  switch (status) {
    case OrderPaymentStatus.cancelled:
      return const Color(0xFF3B1F26);
    case OrderPaymentStatus.failed:
      return const Color(0xFF3B1F26);
    case OrderPaymentStatus.pending:
      return const Color(0xFF4A1E24);
    case OrderPaymentStatus.paid:
      return const Color(0xFF1A3F2D);
    case OrderPaymentStatus.debtRecorded:
      return const Color(0xFF4C3B16);
  }
}

Color _paymentStatusTextColor(OrderPaymentStatus status) {
  switch (status) {
    case OrderPaymentStatus.cancelled:
      return const Color(0xFFFDA4AF);
    case OrderPaymentStatus.failed:
      return const Color(0xFFFDA4AF);
    case OrderPaymentStatus.pending:
      return const Color(0xFFFDA4AF);
    case OrderPaymentStatus.paid:
      return const Color(0xFF86EFAC);
    case OrderPaymentStatus.debtRecorded:
      return const Color(0xFFF4D18A);
  }
}

Color _backgroundForStatus(OrderStatus status) {
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

Color _textForStatus(OrderStatus status) {
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
