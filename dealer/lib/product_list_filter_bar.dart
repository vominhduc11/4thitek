// ignore_for_file: invalid_use_of_protected_member

part of 'product_list_screen.dart';

extension _ProductListFilterBar on _ProductListScreenState {
  Widget _buildStickyFilterBar(
    BuildContext context, {
    required _ProductListAdaptiveLayout layout,
    required CartController cart,
  }) {
    if (layout.isMobile) {
      return _buildMobileUtilityFilterBar(context, cart: cart, layout: layout);
    }

    return _buildWideFilterBar(context, cart: cart, layout: layout);
  }

  Widget _buildWideFilterBar(
    BuildContext context, {
    required CartController cart,
    required _ProductListAdaptiveLayout layout,
  }) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final resultSummary = _buildResultsSummaryLabel(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
        ),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          layout.isDesktop ? 16 : 12,
          layout.isDesktop ? 16 : 12,
          layout.isDesktop ? 16 : 12,
          layout.isDesktop ? 14 : 12,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (layout.isDesktop)
              Row(
                children: [
                  Expanded(
                    child: _buildDiscountBanner(
                      context,
                      cart: cart,
                      isTablet: true,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Flexible(
                    flex: 2,
                    fit: FlexFit.loose,
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: layout.desktopSearchFieldWidth,
                      ),
                      child: _buildSearchField(context, isTablet: true),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Flexible(
                    fit: FlexFit.loose,
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: layout.summaryWidth,
                      ),
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: resultSummary,
                      ),
                    ),
                  ),
                ],
              )
            else ...[
              _buildDiscountBanner(context, cart: cart, isTablet: true),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(child: _buildSearchField(context, isTablet: true)),
                  const SizedBox(width: 12),
                  ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: layout.summaryWidth),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: resultSummary,
                    ),
                  ),
                ],
              ),
            ],
            SizedBox(height: layout.filterSectionSpacing),
            SizedBox(
              height: layout.filterRowHeight,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: colors.surface.withValues(
                    alpha: layout.isDesktop ? 1 : 0.82,
                  ),
                  borderRadius: BorderRadius.circular(
                    layout.isDesktop ? 16 : 14,
                  ),
                  border: Border.all(
                    color: colors.outlineVariant.withValues(alpha: 0.4),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: _buildFilterControlStrip(
                    context,
                    useUtilityStyle: false,
                    includeLeadingIcon: true,
                    includeSortMenu: true,
                    includeClearAction: true,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMobileUtilityFilterBar(
    BuildContext context, {
    required CartController cart,
    required _ProductListAdaptiveLayout layout,
  }) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final loadedCount = _visibleResultCount;
    final surfaceColor = colors.surface;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.82),
        ),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(10, 10, 10, 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDiscountBanner(context, cart: cart, isTablet: false),
            const SizedBox(height: 8),
            _buildSearchField(context, isTablet: false),
            const SizedBox(height: 8),
            SizedBox(
              height: layout.filterRowHeight,
              child: _buildFilterControlStrip(
                context,
                useUtilityStyle: true,
                includeSortMenu: false,
                includeClearAction: true,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(child: _buildMobileResultsChip(context, loadedCount)),
                const SizedBox(width: 8),
                _buildSortMenu(context, useUtilityStyle: true),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterControlStrip(
    BuildContext context, {
    required bool useUtilityStyle,
    bool includeLeadingIcon = false,
    bool includeSortMenu = true,
    bool includeClearAction = false,
  }) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: _buildFilterControlChildren(
          context,
          useUtilityStyle: useUtilityStyle,
          includeLeadingIcon: includeLeadingIcon,
          includeSortMenu: includeSortMenu,
          includeClearAction: includeClearAction,
        ),
      ),
    );
  }

  List<Widget> _buildFilterControlChildren(
    BuildContext context, {
    required bool useUtilityStyle,
    required bool includeLeadingIcon,
    required bool includeSortMenu,
    required bool includeClearAction,
  }) {
    final texts = _productListTexts(context);
    final theme = Theme.of(context);
    final children = <Widget>[];

    if (includeLeadingIcon) {
      children.add(
        Padding(
          padding: const EdgeInsets.only(left: 4, right: 6),
          child: Icon(
            Icons.filter_alt_outlined,
            size: useUtilityStyle ? 18 : 20,
            color: theme.colorScheme.primary,
          ),
        ),
      );
    }

    children.addAll(
      _buildStockFilterChipWidgets(context, useUtilityStyle: useUtilityStyle),
    );

    if (includeSortMenu) {
      if (children.isNotEmpty) {
        children.add(const SizedBox(width: 8));
      }
      children.add(_buildSortMenu(context, useUtilityStyle: useUtilityStyle));
    }

    if (includeClearAction) {
      children.add(
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 180),
          switchInCurve: Curves.easeOutCubic,
          switchOutCurve: Curves.easeInCubic,
          transitionBuilder: (child, animation) {
            return FadeTransition(
              opacity: animation,
              child: SizeTransition(
                axis: Axis.horizontal,
                sizeFactor: animation,
                child: child,
              ),
            );
          },
          child: _hasAnyFilters
              ? Padding(
                  key: ValueKey<String>('clear-filters-$_activeFilterCount'),
                  padding: const EdgeInsets.only(left: 8),
                  child: _buildClearFiltersButton(
                    context,
                    useUtilityStyle: useUtilityStyle,
                    label: texts.clearFiltersLabel(_activeFilterCount),
                  ),
                )
              : const SizedBox.shrink(key: ValueKey('clear-filters-empty')),
        ),
      );
    }

    return children;
  }

  List<Widget> _buildStockFilterChipWidgets(
    BuildContext context, {
    required bool useUtilityStyle,
  }) {
    final texts = _productListTexts(context);
    return [
      _buildStockChip(
        context,
        StockFilter.all,
        texts.stockFilterLabel(StockFilter.all),
        useUtilityStyle: useUtilityStyle,
      ),
      const SizedBox(width: 8),
      _buildStockChip(
        context,
        StockFilter.inStock,
        texts.stockFilterLabel(StockFilter.inStock),
        useUtilityStyle: useUtilityStyle,
      ),
      const SizedBox(width: 8),
      _buildStockChip(
        context,
        StockFilter.lowStock,
        texts.stockFilterLabel(StockFilter.lowStock),
        useUtilityStyle: useUtilityStyle,
      ),
      const SizedBox(width: 8),
      _buildStockChip(
        context,
        StockFilter.outOfStock,
        texts.stockFilterLabel(StockFilter.outOfStock),
        useUtilityStyle: useUtilityStyle,
      ),
    ];
  }

  Widget _buildClearFiltersButton(
    BuildContext context, {
    required bool useUtilityStyle,
    required String label,
  }) {
    final colors = Theme.of(context).colorScheme;

    if (useUtilityStyle) {
      return OutlinedButton.icon(
        onPressed: _resetFilters,
        icon: const Icon(Icons.restart_alt_rounded, size: 16),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(44, 40),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          side: BorderSide(color: colors.outlineVariant.withValues(alpha: 0.8)),
          foregroundColor: colors.onSurfaceVariant,
        ),
      );
    }

    return TextButton.icon(
      onPressed: _resetFilters,
      icon: const Icon(Icons.close_rounded, size: 16),
      label: Text(label),
    );
  }

  Widget _buildMobileResultsChip(BuildContext context, int loadedCount) {
    final texts = _productListTexts(context);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final label = loadedCount > 0
        ? texts.resultsLabel(loadedCount)
        : texts.screenTitle;

    return Container(
      constraints: const BoxConstraints(minHeight: 40),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.8)),
      ),
      child: Row(
        children: [
          Icon(
            Icons.grid_view_rounded,
            size: 16,
            color: colors.onSurfaceVariant,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.labelLarge?.copyWith(
                color: colors.onSurface,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultsSummaryLabel(BuildContext context) {
    final texts = _productListTexts(context);
    final loadedCount = _visibleResultCount;
    final theme = Theme.of(context);

    return Text(
      loadedCount > 0 ? texts.resultsLabel(loadedCount) : texts.screenTitle,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
      textAlign: TextAlign.end,
    );
  }

  Widget _buildStockChip(
    BuildContext context,
    StockFilter filter,
    String label, {
    bool useUtilityStyle = false,
  }) {
    final isSelected = _query.stockFilter == filter;
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return Semantics(
      button: true,
      selected: isSelected,
      label: label,
      child: ConstrainedBox(
        constraints: BoxConstraints(minHeight: useUtilityStyle ? 40 : 48),
        child: ChoiceChip(
          label: Text(label),
          selected: isSelected,
          onSelected: (_) => _setStockFilter(filter),
          pressElevation: 0,
          selectedColor: useUtilityStyle
              ? colors.primary.withValues(alpha: 0.14)
              : colors.primary.withValues(alpha: 0.15),
          labelStyle:
              (useUtilityStyle
                      ? theme.textTheme.labelMedium
                      : theme.textTheme.bodyMedium)
                  ?.copyWith(
                    color: isSelected ? colors.primary : colors.onSurface,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(useUtilityStyle ? 14 : 999),
            side: BorderSide(
              color: isSelected ? colors.primary : colors.outlineVariant,
            ),
          ),
          backgroundColor: colors.surface,
          labelPadding: EdgeInsets.symmetric(
            horizontal: useUtilityStyle ? 2 : 0,
          ),
          visualDensity: useUtilityStyle
              ? const VisualDensity(horizontal: -2, vertical: -2)
              : VisualDensity.compact,
          materialTapTargetSize: MaterialTapTargetSize.padded,
        ),
      ),
    );
  }

  Widget _buildSortMenu(BuildContext context, {bool useUtilityStyle = false}) {
    final texts = _productListTexts(context);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final label = switch (_query.sortOption) {
      SortOption.priceAsc => texts.sortLabel(SortOption.priceAsc),
      SortOption.priceDesc => texts.sortLabel(SortOption.priceDesc),
      SortOption.nameAsc => texts.sortLabel(SortOption.nameAsc),
      SortOption.nameDesc => texts.sortLabel(SortOption.nameDesc),
      SortOption.none => texts.sortLabel(SortOption.none),
    };

    return PopupMenuButton<SortOption>(
      tooltip: texts.sortTooltip,
      onSelected: _setSortOption,
      itemBuilder: (context) => [
        PopupMenuItem(
          value: SortOption.none,
          child: Text(texts.sortMenuOptionLabel(SortOption.none)),
        ),
        PopupMenuItem(
          value: SortOption.priceAsc,
          child: Text(texts.sortMenuOptionLabel(SortOption.priceAsc)),
        ),
        PopupMenuItem(
          value: SortOption.priceDesc,
          child: Text(texts.sortMenuOptionLabel(SortOption.priceDesc)),
        ),
        PopupMenuItem(
          value: SortOption.nameAsc,
          child: Text(texts.sortMenuOptionLabel(SortOption.nameAsc)),
        ),
        PopupMenuItem(
          value: SortOption.nameDesc,
          child: Text(texts.sortMenuOptionLabel(SortOption.nameDesc)),
        ),
      ],
      child: Container(
        constraints: BoxConstraints(minHeight: useUtilityStyle ? 40 : 48),
        padding: EdgeInsets.symmetric(
          horizontal: useUtilityStyle ? 10 : 12,
          vertical: useUtilityStyle ? 8 : 10,
        ),
        decoration: ShapeDecoration(
          color: colors.surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(useUtilityStyle ? 14 : 999),
            side: BorderSide(
              color: colors.outlineVariant.withValues(alpha: 0.8),
            ),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              useUtilityStyle ? Icons.swap_vert_rounded : Icons.swap_vert,
              size: useUtilityStyle ? 17 : 18,
              color: colors.onSurface,
            ),
            SizedBox(width: useUtilityStyle ? 4 : 6),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 180),
              switchInCurve: Curves.easeOutCubic,
              switchOutCurve: Curves.easeInCubic,
              transitionBuilder: (child, animation) {
                return FadeTransition(opacity: animation, child: child);
              },
              child: useUtilityStyle
                  ? ConstrainedBox(
                      key: ValueKey<String>(label),
                      constraints: const BoxConstraints(maxWidth: 92),
                      child: Text(
                        label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: colors.onSurface,
                          fontSize: 14,
                        ),
                      ),
                    )
                  : Text(
                      label,
                      key: ValueKey<String>(label),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: colors.onSurface,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
