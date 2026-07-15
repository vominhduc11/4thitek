// ignore_for_file: invalid_use_of_protected_member

part of 'orders_screen.dart';

extension _OrdersScreenOverview on _OrdersScreenState {
  Widget _buildOverviewPanel({
    required BuildContext context,
    required _OrdersTexts texts,
    required ColorScheme colors,
    required _OrdersLayoutConfig layout,
    required int resultCount,
    required int pendingCount,
    required int outstandingOrderCount,
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
        outstandingOrderCount: outstandingOrderCount,
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
              if (outstandingOrderCount > 0)
                _OrdersSummaryStat(
                  icon: Icons.account_balance_wallet_outlined,
                  value: '$outstandingOrderCount',
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
    required int outstandingOrderCount,
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
              if (outstandingOrderCount > 0)
                _OrdersCompactStatChip(
                  icon: Icons.account_balance_wallet_outlined,
                  value: '$outstandingOrderCount',
                  label: texts.outstandingCriteriaLabel,
                  isActive: _query.onlyOutstanding,
                  onTap: _toggleOutstandingQuickFilter,
                ),
              _OrdersCompactActionChip(
                icon: Icons.tune_rounded,
                label: _activeFilterCount > 0
                    ? '${texts.filterSheetTitle} ($_activeFilterCount)'
                    : texts.filterSheetTitle,
                isActive: _activeFilterCount > 0,
                onTap: () => _openFilterSheet(
                  context,
                  texts: texts,
                  statusFilters: statusFilters,
                  paymentFilters: paymentFilters,
                ),
              ),
            ],
          ),
          if (hasActiveCriteria && activeCriteriaSummary.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildActiveCriteriaBanner(
              context,
              colors: colors,
              summary: activeCriteriaSummary,
              compact: true,
            ),
          ],
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

  bool _handleScrollNotification(
    ScrollNotification notification, {
    required bool useFloatingOverview,
  }) {
    if (!useFloatingOverview || notification.metrics.axis != Axis.vertical) {
      return false;
    }

    if (notification.metrics.pixels <= 0) {
      _lastObservedScrollPixels = notification.metrics.pixels;
      _setFloatingOverviewReveal(1);
      return false;
    }

    if (notification is ScrollUpdateNotification) {
      final currentPixels = notification.metrics.pixels;
      final delta =
          notification.scrollDelta ??
          (_lastObservedScrollPixels == null
              ? 0
              : currentPixels - _lastObservedScrollPixels!);
      _lastObservedScrollPixels = currentPixels;

      if (delta > 0) {
        _setFloatingOverviewReveal(
          _floatingOverviewReveal - (delta / _floatingOverviewHideDistance),
        );
      } else if (delta < 0) {
        _setFloatingOverviewReveal(
          _floatingOverviewReveal +
              ((-delta) / _floatingOverviewRevealDistance),
        );
      }
    } else if (notification is ScrollEndNotification) {
      _lastObservedScrollPixels = notification.metrics.pixels;
    }

    return false;
  }

  void _setFloatingOverviewReveal(double value) {
    final nextValue = value.clamp(0.0, 1.0);
    if ((_floatingOverviewReveal - nextValue).abs() < 0.001 || !mounted) {
      return;
    }
    setState(() => _floatingOverviewReveal = nextValue);
  }

  void _setOverviewSectionHeight(Size size) {
    final nextHeight = size.height;
    if ((_overviewSectionHeight - nextHeight).abs() < 0.5) {
      return;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || (_overviewSectionHeight - nextHeight).abs() < 0.5) {
        return;
      }
      setState(() => _overviewSectionHeight = nextHeight);
    });
  }

  Widget _buildOverviewHeaderSlot({
    required BuildContext context,
    required _OrdersTexts texts,
    required ColorScheme colors,
    required _OrdersLayoutConfig layout,
    required int resultCount,
    required int pendingCount,
    required int outstandingOrderCount,
    required bool hasActiveSearch,
    required bool hasActiveCriteria,
    required String activeCriteriaSummary,
    required List<OrderStatus?> statusFilters,
    required List<OrderPaymentStatus?> paymentFilters,
    required bool enableScrollCollapse,
  }) {
    final overviewSection = _MeasureSize(
      onChange: _setOverviewSectionHeight,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(16, layout.isCompact ? 8 : 12, 16, 0),
            child: _buildOverviewPanel(
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
            ),
          ),
          SizedBox(height: layout.isCompact ? 8 : 12),
        ],
      ),
    );

    if (!enableScrollCollapse || _overviewSectionHeight <= 0) {
      return KeyedSubtree(
        key: const ValueKey<String>('orders-overview-shell'),
        child: overviewSection,
      );
    }

    final reveal = _floatingOverviewReveal.clamp(0.0, 1.0);
    final visualProgress = Curves.easeOutCubic.transform(reveal);
    final visibleHeight =
        _floatingOverviewCollapsedHeight +
        ((_overviewSectionHeight - _floatingOverviewCollapsedHeight) * reveal);

    return KeyedSubtree(
      key: const ValueKey<String>('orders-overview-shell'),
      child: SizedBox(
        height: visibleHeight,
        child: ClipRect(
          child: Stack(
            fit: StackFit.expand,
            children: [
              Positioned(
                top: -(_overviewSectionHeight + 12) * (1 - visualProgress),
                left: 0,
                right: 0,
                child: overviewSection,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
