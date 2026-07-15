// ignore_for_file: invalid_use_of_protected_member

part of 'product_list_screen.dart';

extension _ProductListCards on _ProductListScreenState {
  Widget _buildProductCard(
    BuildContext context,
    Product product,
    int index,
    CartController cart, {
    required bool isTablet,
    bool isGridLayout = false,
  }) {
    final texts = _productListTexts(context);
    final pageIndex = index % _pageSize;
    final shouldAnimate = pageIndex < _animatedItemsPerPage;
    final delay = shouldAnimate
        ? Duration(milliseconds: 30 * pageIndex)
        : Duration.zero;
    final isSyncingProduct = cart.isSyncingProduct(product.id);
    final isAddingToCart = _addingProductIds.contains(product.id);
    final isRecentlyAdded = _recentlyAddedProductIds.contains(product.id);
    final isBusy = isAddingToCart || isSyncingProduct;
    final remainingStock = cart.remainingStockFor(product);
    final isOutOfStock = cart.isOutOfStock(product);
    final hasReachedCartLimit = cart.hasReachedCartLimit(product);
    final suggestedAddQuantity = cart.suggestedAddQuantity(product);
    final canAddToCart = suggestedAddQuantity > 0 && !isBusy;
    final primaryAddActionLabel = isOutOfStock
        ? texts.outOfStockAction
        : hasReachedCartLimit
        ? texts.unavailableAction
        : (texts.isEnglish ? 'Add to cart' : 'Thêm vào giỏ');
    final productSemanticsLabel = texts.productSemanticsLabel(
      product,
      remainingStock,
    );

    if (!isTablet) {
      return _buildMobileUtilityProductCard(
        context,
        product,
        cart,
        animateEntry: shouldAnimate,
        delay: delay,
        isBusy: isBusy,
        canAddToCart: canAddToCart,
        remainingStock: remainingStock,
        productSemanticsLabel: productSemanticsLabel,
      );
    }

    final theme = Theme.of(context);
    final imageSize = isTablet ? 80.0 : 64.0;
    final cardPadding = isTablet ? (isGridLayout ? 16.0 : 18.0) : 14.0;
    final addButtonLabel = primaryAddActionLabel;
    final useCompactQuickAdd = isGridLayout && canAddToCart;

    return FadeSlideIn(
      key: ValueKey(product.id),
      animate: shouldAnimate,
      delay: delay,
      child: RepaintBoundary(
        child: Padding(
          padding: EdgeInsets.only(
            bottom: isGridLayout ? 0 : (isTablet ? 12 : 10),
          ),
          child: Semantics(
            container: true,
            label: productSemanticsLabel,
            hint: texts.openProductDetailsHint,
            child: _InteractiveProductCardSurface(
              borderRadius: BorderRadius.circular(18),
              side: BorderSide(
                color: theme.colorScheme.outlineVariant.withValues(alpha: 0.6),
              ),
              onTap: () => _openProductDetails(context, product),
              child: Padding(
                padding: EdgeInsets.all(cardPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (isGridLayout) ...[
                      _buildSquareProductCardImage(
                        product,
                        borderRadius: BorderRadius.circular(16),
                        widthFactor: isTablet ? 0.84 : 0.88,
                        contentPadding: const EdgeInsets.all(10),
                        iconSize: 34,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        product.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        product.sku,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 8),
                      StockBadge(
                        remainingStock: remainingStock,
                        lowStockThreshold: _lowStockThreshold,
                        iconSize: 13,
                        iconTextSpacing: 3.5,
                      ),
                    ] else ...[
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Hero(
                            tag: 'product-image-${product.id}',
                            child: ProductImage(
                              product: product,
                              width: imageSize,
                              height: imageSize,
                              borderRadius: BorderRadius.circular(14),
                              fit: BoxFit.contain,
                              contentPadding: const EdgeInsets.all(6),
                              iconSize: isTablet ? 32 : 26,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  product.name,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        product.sku,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: theme.textTheme.bodySmall
                                            ?.copyWith(
                                              color: theme
                                                  .colorScheme
                                                  .onSurfaceVariant,
                                            ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    StockBadge(
                                      remainingStock: remainingStock,
                                      lowStockThreshold: _lowStockThreshold,
                                      iconSize: isTablet ? 14 : 12,
                                      iconTextSpacing: isTablet ? 4 : 3,
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                    SizedBox(height: isGridLayout ? 10 : 12),
                    Divider(
                      height: 1,
                      thickness: 1,
                      color: theme.colorScheme.outlineVariant.withValues(
                        alpha: 0.5,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Builder(
                      builder: (context) {
                        final priceText = Text(
                          formatVnd(product.price),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w800,
                          ),
                        );

                        Widget buildQuantityButton() {
                          return Tooltip(
                            message: isSyncingProduct
                                ? texts.syncingCartTooltip
                                : texts.chooseQuantityTooltip,
                            child: OutlinedButton(
                              onPressed: canAddToCart
                                  ? () => _handleAddToCart(
                                      cart,
                                      product,
                                      openQuantityDialog: true,
                                    )
                                  : null,
                              style: OutlinedButton.styleFrom(
                                minimumSize: const Size(48, 48),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                ),
                              ),
                              child: isSyncingProduct
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.2,
                                      ),
                                    )
                                  : const Icon(Icons.tune, size: 18),
                            ),
                          );
                        }

                        Widget buildQuickAddButton() {
                          final quickAddBackground = isRecentlyAdded
                              ? theme.colorScheme.tertiaryContainer
                              : theme.colorScheme.secondaryContainer.withValues(
                                  alpha: 0.8,
                                );
                          final quickAddForeground = isRecentlyAdded
                              ? theme.colorScheme.onTertiaryContainer
                              : theme.colorScheme.onSecondaryContainer;

                          return ElevatedButton(
                            onPressed: canAddToCart
                                ? () => _handleAddToCart(cart, product)
                                : null,
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size(48, 48),
                              padding: EdgeInsets.symmetric(
                                horizontal: useCompactQuickAdd ? 10 : 14,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              elevation: 0,
                              backgroundColor: quickAddBackground,
                              foregroundColor: quickAddForeground,
                            ),
                            child: _buildQuickAddButtonContent(
                              context,
                              isBusy: isBusy,
                              isEnabled: canAddToCart,
                              isRecentlyAdded: isRecentlyAdded,
                              useCompactLayout: useCompactQuickAdd,
                              label: addButtonLabel,
                            ),
                          );
                        }

                        final isMobileListLayout = !isTablet && !isGridLayout;
                        return LayoutBuilder(
                          builder: (context, constraints) {
                            final useStackedActionLayout =
                                isMobileListLayout ||
                                (isGridLayout && constraints.maxWidth < 284);
                            if (useStackedActionLayout) {
                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  priceText,
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      buildQuantityButton(),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Align(
                                          alignment: Alignment.centerRight,
                                          child: buildQuickAddButton(),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              );
                            }

                            return Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: Align(
                                    alignment: Alignment.centerLeft,
                                    child: priceText,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                buildQuantityButton(),
                                const SizedBox(width: 8),
                                buildQuickAddButton(),
                              ],
                            );
                          },
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMobileUtilityProductCard(
    BuildContext context,
    Product product,
    CartController cart, {
    required bool animateEntry,
    required Duration delay,
    required bool isBusy,
    required bool canAddToCart,
    required int remainingStock,
    required String productSemanticsLabel,
  }) {
    final texts = _productListTexts(context);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final isRecentlyAdded = _recentlyAddedProductIds.contains(product.id);
    final isOutOfStock = cart.isOutOfStock(product);
    final hasReachedCartLimit = cart.hasReachedCartLimit(product);
    final primaryActionLabel = isOutOfStock
        ? texts.outOfStockAction
        : hasReachedCartLimit
        ? texts.unavailableAction
        : texts.chooseQuantityAction;
    final warrantyLabel = product.warrantyMonths > 0
        ? (texts.isEnglish
              ? '${product.warrantyMonths} mo warranty'
              : 'BH ${product.warrantyMonths} tháng')
        : null;
    final supportingMetadata = warrantyLabel == null
        ? product.sku
        : '${product.sku} • $warrantyLabel';

    return FadeSlideIn(
      key: ValueKey(product.id),
      animate: animateEntry,
      delay: delay,
      child: RepaintBoundary(
        child: Semantics(
          container: true,
          label: productSemanticsLabel,
          hint: texts.openProductDetailsHint,
          child: _InteractiveProductCardSurface(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(
              color: colors.outlineVariant.withValues(alpha: 0.68),
            ),
            onTap: () => _openProductDetails(context, product),
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    colors.surface.withValues(alpha: 0.98),
                    colors.surfaceContainerLow.withValues(alpha: 0.94),
                  ],
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            colors.surfaceContainerLow.withValues(alpha: 0.96),
                            colors.surface.withValues(alpha: 0.98),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: colors.outlineVariant.withValues(alpha: 0.28),
                        ),
                      ),
                      child: AspectRatio(
                        aspectRatio: 1.48,
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(10, 10, 10, 8),
                          child: _buildSquareProductCardImage(
                            product,
                            borderRadius: BorderRadius.circular(18),
                            widthFactor: 0.78,
                            contentPadding: const EdgeInsets.all(4),
                            iconSize: 28,
                            showSurfaceDecoration: false,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        height: 1.12,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      supportingMetadata,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      texts.dealerPriceLabel,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      formatVnd(product.price),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: colors.primary,
                        fontWeight: FontWeight.w800,
                        height: 1,
                      ),
                    ),
                    const SizedBox(height: 12),
                    StockBadge(
                      remainingStock: remainingStock,
                      lowStockThreshold: _lowStockThreshold,
                      showInStockQuantity: true,
                      useColonForLowStock: true,
                      subtle: true,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      iconSize: 13,
                      iconTextSpacing: 4,
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        key: ValueKey<String>(
                          'mobile-product-primary-action-${product.id}',
                        ),
                        onPressed: canAddToCart
                            ? () => _handleAddToCart(
                                cart,
                                product,
                                openQuantityDialog: true,
                              )
                            : null,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(0, 52),
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                          backgroundColor: isRecentlyAdded
                              ? colors.tertiaryContainer
                              : colors.primaryContainer.withValues(alpha: 0.92),
                          foregroundColor: isRecentlyAdded
                              ? colors.onTertiaryContainer
                              : colors.onPrimaryContainer,
                          disabledBackgroundColor: colors
                              .surfaceContainerHighest
                              .withValues(alpha: 0.94),
                          disabledForegroundColor: colors.onSurfaceVariant
                              .withValues(alpha: 0.78),
                        ),
                        child: _buildQuickAddButtonContent(
                          context,
                          isBusy: isBusy,
                          isEnabled: canAddToCart,
                          isRecentlyAdded: isRecentlyAdded,
                          useCompactLayout: false,
                          label: primaryActionLabel,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSquareProductCardImage(
    Product product, {
    required BorderRadius borderRadius,
    required double widthFactor,
    required EdgeInsetsGeometry contentPadding,
    required double iconSize,
    bool showSurfaceDecoration = true,
  }) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final mediaSize = constraints.maxWidth * widthFactor;
        return Center(
          child: Hero(
            tag: 'product-image-${product.id}',
            child: ProductImage(
              product: product,
              width: mediaSize,
              height: mediaSize,
              borderRadius: borderRadius,
              fit: BoxFit.contain,
              contentPadding: contentPadding,
              iconSize: iconSize,
              showSurfaceDecoration: showSurfaceDecoration,
            ),
          ),
        );
      },
    );
  }

  int get _activeFilterCount {
    var count = 0;
    if (_query.normalizedSearchText.isNotEmpty) count++;
    if (_query.stockFilter != StockFilter.all) count++;
    if (_query.sortOption != SortOption.none) count++;
    return count;
  }

  bool get _hasAnyFilters => _query.hasFilters;

  int get _visibleResultCount => _pagingController.itemList?.length ?? 0;
}
