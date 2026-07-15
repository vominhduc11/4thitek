// ignore_for_file: invalid_use_of_protected_member

part of 'product_list_screen.dart';

extension _ProductListScroll on _ProductListScreenState {
  bool _handleScrollNotification(
    ScrollNotification notification, {
    required bool useFloatingFilterBar,
  }) {
    if (!useFloatingFilterBar || notification.metrics.axis != Axis.vertical) {
      return false;
    }

    if (notification.metrics.pixels <= 0) {
      _lastObservedScrollPixels = notification.metrics.pixels;
      _setFloatingFilterBarReveal(1);
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
        _setFloatingFilterBarReveal(
          _floatingFilterBarReveal - (delta / _floatingFilterHideDistance),
        );
      } else if (delta < 0) {
        _setFloatingFilterBarReveal(
          _floatingFilterBarReveal + ((-delta) / _floatingFilterRevealDistance),
        );
      }
    } else if (notification is ScrollEndNotification) {
      _lastObservedScrollPixels = notification.metrics.pixels;
    }

    return false;
  }

  void _setFloatingFilterBarReveal(double value) {
    final nextValue = value.clamp(0.0, 1.0);
    if ((_floatingFilterBarReveal - nextValue).abs() < 0.001 || !mounted) {
      return;
    }
    setState(() => _floatingFilterBarReveal = nextValue);
  }

  Widget _buildFilterBarSliverSurface(
    BuildContext context, {
    required _ProductListAdaptiveLayout layout,
    required CartController cart,
    required double horizontalPadding,
  }) {
    return RepaintBoundary(
      child: Stack(
        children: [
          Container(
            color: Theme.of(context).scaffoldBackgroundColor,
            padding: EdgeInsets.fromLTRB(
              horizontalPadding,
              layout.stickyOuterTopPadding,
              horizontalPadding,
              layout.stickyOuterBottomPadding,
            ),
            child: _buildStickyFilterBar(context, layout: layout, cart: cart),
          ),
          Positioned(
            left: horizontalPadding,
            right: horizontalPadding,
            bottom: 2,
            child: _buildBackgroundRefreshIndicator(context),
          ),
        ],
      ),
    );
  }

  Widget _buildBackgroundRefreshIndicator(BuildContext context) {
    final texts = _productListTexts(context);
    final colors = Theme.of(context).colorScheme;

    return IgnorePointer(
      child: ValueListenableBuilder<bool>(
        valueListenable: _isCatalogRefreshing,
        builder: (context, isRefreshing, _) {
          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, animation) {
              return FadeTransition(
                opacity: animation,
                child: SizeTransition(
                  axisAlignment: 1,
                  sizeFactor: animation,
                  child: child,
                ),
              );
            },
            child: isRefreshing
                ? Semantics(
                    key: const ValueKey('catalog-refresh-indicator'),
                    container: true,
                    liveRegion: true,
                    label: texts.refreshingCatalogLabel,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        minHeight: 3,
                        color: colors.primary,
                        backgroundColor: colors.primary.withValues(alpha: 0.12),
                      ),
                    ),
                  )
                : const SizedBox.shrink(key: ValueKey('catalog-refresh-idle')),
          );
        },
      ),
    );
  }

  Widget _buildResultsSliver(
    BuildContext context,
    CartController cart, {
    required _ProductListAdaptiveLayout layout,
  }) {
    final useGridLayout = !layout.isMobile;
    return SliverLayoutBuilder(
      builder: (context, constraints) {
        PagedChildBuilderDelegate<Product> buildDelegate({
          required bool isGridLayout,
          int crossAxisCount = 1,
          double gridItemExtent = 0,
        }) {
          return PagedChildBuilderDelegate<Product>(
            itemBuilder: (context, product, index) {
              return _buildProductCard(
                context,
                product,
                index,
                cart,
                isTablet: layout.isTablet,
                isGridLayout: isGridLayout,
              );
            },
            firstPageProgressIndicatorBuilder: (context) {
              return _buildFirstPageSkeleton(
                isGridLayout: isGridLayout,
                crossAxisCount: crossAxisCount,
                gridItemExtent: gridItemExtent,
              );
            },
            newPageProgressIndicatorBuilder: (context) {
              return _buildNewPageSkeleton(
                isGridLayout: isGridLayout,
                crossAxisCount: crossAxisCount,
                gridItemExtent: gridItemExtent,
              );
            },
            firstPageErrorIndicatorBuilder: (context) {
              return _buildErrorIndicator(context, isFirstPage: true);
            },
            newPageErrorIndicatorBuilder: (context) {
              return _buildErrorIndicator(context);
            },
            noItemsFoundIndicatorBuilder: (context) {
              return _buildEmptyStateIndicator(context);
            },
          );
        }

        if (!useGridLayout) {
          return PagedSliverList<int, Product>(
            pagingController: _pagingController,
            builderDelegate: buildDelegate(isGridLayout: false),
          );
        }

        final gridGeometry = layout.resolveGridGeometry(
          constraints.crossAxisExtent,
        );
        return PagedSliverGrid<int, Product>(
          pagingController: _pagingController,
          builderDelegate: buildDelegate(
            isGridLayout: true,
            crossAxisCount: gridGeometry.crossAxisCount,
            gridItemExtent: gridGeometry.itemExtent,
          ),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: gridGeometry.crossAxisCount,
            mainAxisSpacing: gridGeometry.mainAxisSpacing,
            crossAxisSpacing: gridGeometry.crossAxisSpacing,
            mainAxisExtent: gridGeometry.itemExtent,
          ),
        );
      },
    );
  }
}
