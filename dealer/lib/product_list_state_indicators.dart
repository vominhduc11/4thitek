// ignore_for_file: invalid_use_of_protected_member

part of 'product_list_screen.dart';

extension _ProductListStateIndicators on _ProductListScreenState {
  Widget _buildErrorIndicator(
    BuildContext context, {
    bool isFirstPage = false,
  }) {
    final texts = _productListTexts(context);
    final title = isFirstPage
        ? texts.loadProductsFailedTitle
        : texts.loadMoreProductsFailedTitle;
    final description = isFirstPage
        ? texts.loadProductsFailedDescription
        : texts.loadMoreProductsFailedDescription;

    return Padding(
      padding: EdgeInsets.symmetric(
        vertical: isFirstPage ? 32 : 12,
        horizontal: 24,
      ),
      child: Center(
        child: _ProductListStatePanel(
          icon: isFirstPage
              ? Icons.cloud_off_outlined
              : Icons.cloud_sync_outlined,
          title: title,
          description: description,
          compact: !isFirstPage,
          actions: [
            OutlinedButton.icon(
              onPressed: () => _retryLoadProducts(isFirstPage: isFirstPage),
              icon: const Icon(Icons.refresh_rounded, size: 16),
              label: Text(texts.retryAction),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyStateIndicator(BuildContext context) {
    final texts = _productListTexts(context);

    return FadeSlideIn(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
        child: Center(
          child: _hasAnyFilters
              ? _ProductListStatePanel(
                  icon: Icons.search_off_rounded,
                  title: texts.emptyFilteredTitle,
                  description: texts.emptyFilteredDescription,
                  actions: [
                    OutlinedButton.icon(
                      onPressed: _resetFilters,
                      icon: const Icon(Icons.restart_alt_rounded, size: 16),
                      label: Text(texts.clearFiltersLabel(_activeFilterCount)),
                    ),
                  ],
                )
              : _ProductListStatePanel(
                  icon: Icons.inventory_2_outlined,
                  title: texts.emptyCatalogTitle,
                  description: texts.emptyCatalogDescription,
                  actions: [
                    OutlinedButton.icon(
                      onPressed: () => unawaited(_refreshCatalog()),
                      icon: const Icon(Icons.refresh_rounded, size: 16),
                      label: Text(texts.refreshCatalogAction),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildFirstPageSkeleton({
    required bool isGridLayout,
    required int crossAxisCount,
    required double gridItemExtent,
  }) {
    final texts = _productListTexts(context);
    if (isGridLayout) {
      return Semantics(
        container: true,
        liveRegion: true,
        label: texts.loadingProductsLabel,
        child: _buildGridSkeletonRows(
          rowCount: 2,
          crossAxisCount: crossAxisCount,
          gridItemExtent: gridItemExtent,
        ),
      );
    }

    return Semantics(
      container: true,
      liveRegion: true,
      label: texts.loadingProductsLabel,
      child: Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Column(
          children: List.generate(
            5,
            (index) => const Padding(
              padding: EdgeInsets.only(bottom: 10),
              child: _ProductCardSkeleton(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNewPageSkeleton({
    required bool isGridLayout,
    required int crossAxisCount,
    required double gridItemExtent,
  }) {
    final texts = _productListTexts(context);
    if (isGridLayout) {
      return Padding(
        padding: const EdgeInsets.only(top: 12),
        child: Opacity(
          opacity: 0.86,
          child: Semantics(
            container: true,
            liveRegion: true,
            label: texts.loadingMoreProductsLabel,
            child: RepaintBoundary(
              child: _buildGridSkeletonRows(
                rowCount: 1,
                crossAxisCount: crossAxisCount,
                gridItemExtent: gridItemExtent,
              ),
            ),
          ),
        ),
      );
    }

    return Semantics(
      container: true,
      liveRegion: true,
      label: texts.loadingMoreProductsLabel,
      child: const Padding(
        padding: EdgeInsets.only(top: 12),
        child: Opacity(
          opacity: 0.86,
          child: RepaintBoundary(child: _ProductCardSkeleton()),
        ),
      ),
    );
  }

  Widget _buildGridSkeletonRows({
    required int rowCount,
    required int crossAxisCount,
    required double gridItemExtent,
  }) {
    return Column(
      children: List.generate(rowCount, (rowIndex) {
        return Padding(
          padding: EdgeInsets.only(bottom: rowIndex == rowCount - 1 ? 0 : 12),
          child: Row(
            children: List.generate(crossAxisCount, (index) {
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    right: index == crossAxisCount - 1 ? 0 : 12,
                  ),
                  child: SizedBox(
                    height: gridItemExtent,
                    child: const _ProductCardSkeleton(isGridLayout: true),
                  ),
                ),
              );
            }),
          ),
        );
      }),
    );
  }

  void _openProductDetails(BuildContext context, Product product) =>
      context.pushDealerProductDetail(product.id);

  Widget _buildQuickAddButtonContent(
    BuildContext context, {
    required bool isBusy,
    required bool isEnabled,
    required bool isRecentlyAdded,
    required bool useCompactLayout,
    required String label,
  }) {
    final texts = _productListTexts(context);

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 180),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      transitionBuilder: (child, animation) {
        return FadeTransition(opacity: animation, child: child);
      },
      child: isBusy
          ? const SizedBox(
              key: ValueKey('quick-add-busy'),
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2.4),
            )
          : !isEnabled
          ? useCompactLayout
                ? const Icon(
                    Icons.remove_shopping_cart_outlined,
                    key: ValueKey('quick-add-disabled-compact'),
                    size: 18,
                  )
                : Row(
                    key: ValueKey<String>('quick-add-disabled-$label'),
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.remove_shopping_cart_outlined, size: 18),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  )
          : isRecentlyAdded
          ? useCompactLayout
                ? const Icon(
                    Icons.check_circle_rounded,
                    key: ValueKey('quick-add-success-compact'),
                    size: 18,
                  )
                : Row(
                    key: const ValueKey('quick-add-success'),
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle_rounded, size: 18),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          texts.addedAction,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  )
          : useCompactLayout
          ? const Icon(
              Icons.add_shopping_cart_outlined,
              key: ValueKey('quick-add-idle-compact'),
              size: 18,
            )
          : Row(
              key: ValueKey<String>('quick-add-idle-$label'),
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.add_shopping_cart_outlined, size: 18),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
    );
  }
}
