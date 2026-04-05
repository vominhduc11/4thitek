import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_spinbox/flutter_spinbox.dart';
import 'package:infinite_scroll_pagination/infinite_scroll_pagination.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'cart_screen.dart';
import 'global_search.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'product_detail_screen.dart';
import 'product_catalog_controller.dart';
import 'product_query_service.dart';
import 'query_page.dart';
import 'utils.dart';
import 'widgets/cart_icon_button.dart';
import 'widgets/notification_icon_button.dart';
import 'notifications_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/product_image.dart';
import 'widgets/skeleton_box.dart';
import 'widgets/stock_badge.dart';

part 'product_list_screen_support.dart';

_ProductListTexts _productListTexts(BuildContext context) => _ProductListTexts(
  isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
);

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  static const int _pageSize = 10;
  static const int _lowStockThreshold = kLowStockThreshold;
  static const double _tabletListMaxContentWidth = 1040;
  static const Duration _searchDebounceDuration = Duration(milliseconds: 320);
  static const double _floatingFilterCollapsedHeight = 8;
  static const double _floatingFilterRevealDistance = 72;
  static const double _floatingFilterHideDistance = 132;
  static const int _animatedItemsPerPage = 4;

  late final PagingController<int, Product> _pagingController;
  final TextEditingController _searchController = TextEditingController();
  final ValueNotifier<bool> _isSearchPending = ValueNotifier<bool>(false);
  final ValueNotifier<bool> _isCatalogRefreshing = ValueNotifier<bool>(false);
  late final Listenable _searchFieldListenable;
  Timer? _searchDebounce;
  Timer? _catalogRefreshDebounce;
  ProductListQuery _query = const ProductListQuery();
  ProductCatalogController? _productCatalog;
  ProductQueryRepository? _productQueryRepository;
  final Set<String> _addingProductIds = <String>{};
  final Set<String> _recentlyAddedProductIds = <String>{};
  final Map<String, Timer> _recentlyAddedTimers = <String, Timer>{};
  String? _catalogSnapshot;
  bool _isManuallyRefreshingCatalog = false;
  double _floatingFilterBarReveal = 1;
  double? _lastObservedScrollPixels;
  // Counts how many catalog change notifications should be ignored while a
  // manual local-catalog page fetch is in flight. Increment before triggering
  // a fetch that relies on local catalog data, decrement when that fetch
  // completes, and resume normal notification-driven refreshes once it
  // returns to 0.
  int _suppressedCatalogLoadCount = 0;
  // Monotonic revision token for query refreshes. Increment before each manual
  // refresh, let in-flight page requests capture the current value, and ignore
  // responses that complete after a newer revision has started.
  int _queryRevision = 0;

  @override
  void initState() {
    super.initState();
    _pagingController = PagingController(firstPageKey: 0);
    _pagingController.addPageRequestListener(_fetchPage);
    _searchFieldListenable = Listenable.merge([
      _searchController,
      _isSearchPending,
    ]);
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final nextCatalog = ProductCatalogScope.maybeOf(context);
    if (identical(_productCatalog, nextCatalog)) {
      return;
    }
    _productCatalog?.removeListener(_handleCatalogChanged);
    _catalogRefreshDebounce?.cancel();
    _productCatalog = nextCatalog;
    _productQueryRepository = nextCatalog == null
        ? null
        : ProductQueryRepository(
            localDataSource: LocalProductQueryDataSource(catalog: nextCatalog),
            remoteDataSource: BasicRemoteProductQueryDataSource(
              catalog: nextCatalog,
            ),
          );
    _catalogSnapshot = nextCatalog == null
        ? null
        : _catalogSummarySnapshot(nextCatalog);
    _productCatalog?.addListener(_handleCatalogChanged);
    unawaited(_productCatalog?.load());
  }

  @override
  void dispose() {
    _productCatalog?.removeListener(_handleCatalogChanged);
    _searchDebounce?.cancel();
    _catalogRefreshDebounce?.cancel();
    for (final timer in _recentlyAddedTimers.values) {
      timer.cancel();
    }
    _recentlyAddedTimers.clear();
    _isSearchPending.dispose();
    _isCatalogRefreshing.dispose();
    _searchController.dispose();
    _pagingController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final texts = _productListTexts(context);
    final cart = CartScope.of(context);
    final layout = _ProductListAdaptiveLayout.fromContext(context);
    final horizontalPadding = layout.centeredHorizontalPadding;
    final bottomSafeArea = MediaQuery.viewPaddingOf(context).bottom;
    final stickyBarHeight = layout.stickyHeaderExtent;
    final useFloatingFilterBar = !layout.isDesktop;
    final floatingFilterBarReveal = _floatingFilterBarReveal.clamp(0.0, 1.0);
    final floatingSpacerHeight =
        _floatingFilterCollapsedHeight +
        ((stickyBarHeight - _floatingFilterCollapsedHeight) *
            floatingFilterBarReveal);
    final floatingFilterBarVisualProgress = Curves.easeOutCubic.transform(
      floatingFilterBarReveal,
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
          CartIconButton(
            count: cart.totalItems,
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const CartScreen()),
              );
            },
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: Stack(
        children: [
          NotificationListener<ScrollNotification>(
            onNotification: (notification) => _handleScrollNotification(
              notification,
              useFloatingFilterBar: useFloatingFilterBar,
            ),
            child: RefreshIndicator(
              onRefresh: _refreshCatalog,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  if (layout.isDesktop)
                    SliverPersistentHeader(
                      pinned: true,
                      delegate: _PinnedHeaderDelegate(
                        minExtent: stickyBarHeight,
                        maxExtent: stickyBarHeight,
                        child: _buildFilterBarSliverSurface(
                          context,
                          layout: layout,
                          cart: cart,
                          horizontalPadding: horizontalPadding,
                        ),
                      ),
                    )
                  else
                    SliverToBoxAdapter(
                      child: SizedBox(height: floatingSpacerHeight),
                    ),
                  SliverPadding(
                    padding: EdgeInsets.fromLTRB(
                      horizontalPadding,
                      0,
                      horizontalPadding,
                      layout.resolveResultsBottomPadding(
                        bottomSafeArea: bottomSafeArea,
                      ),
                    ),
                    sliver: _buildResultsSliver(context, cart, layout: layout),
                  ),
                ],
              ),
            ),
          ),
          if (useFloatingFilterBar)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: IgnorePointer(
                ignoring: floatingFilterBarReveal <= 0.04,
                child: ClipRect(
                  clipBehavior: Clip.hardEdge,
                  child: Transform.translate(
                    offset: Offset(
                      0,
                      -(stickyBarHeight + 12) *
                          (1 - floatingFilterBarVisualProgress),
                    ),
                    child: _buildFilterBarSliverSurface(
                      context,
                      layout: layout,
                      cart: cart,
                      horizontalPadding: horizontalPadding,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

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
    const useGridLayout = true;
    return SliverLayoutBuilder(
      builder: (context, constraints) {
        final gridGeometry = layout.resolveGridGeometry(
          constraints.crossAxisExtent,
        );
        final delegate = PagedChildBuilderDelegate<Product>(
          itemBuilder: (context, product, index) {
            return _buildProductCard(
              context,
              product,
              index,
              cart,
              isTablet: layout.isTablet,
              isGridLayout: useGridLayout,
            );
          },
          firstPageProgressIndicatorBuilder: (context) {
            return _buildFirstPageSkeleton(
              isGridLayout: useGridLayout,
              crossAxisCount: gridGeometry.crossAxisCount,
              gridItemExtent: gridGeometry.itemExtent,
            );
          },
          newPageProgressIndicatorBuilder: (context) {
            return _buildNewPageSkeleton(
              isGridLayout: useGridLayout,
              crossAxisCount: gridGeometry.crossAxisCount,
              gridItemExtent: gridGeometry.itemExtent,
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

        return PagedSliverGrid<int, Product>(
          pagingController: _pagingController,
          builderDelegate: delegate,
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

  Future<void> _fetchPage(int pageKey) async {
    final requestRevision = _queryRevision;
    var usesLocalCatalogSource = false;
    try {
      final repository = _productQueryRepository;
      if (repository == null) {
        _pagingController.appendLastPage(const <Product>[]);
        return;
      }
      usesLocalCatalogSource =
          !(repository.remoteDataSource?.supports(_query) ?? false);
      if (usesLocalCatalogSource) {
        _suppressedCatalogLoadCount++;
      }

      final result = await repository.fetchPage(
        _query,
        QueryPageRequest(offset: pageKey, limit: _pageSize),
      );
      if (!mounted || requestRevision != _queryRevision) {
        return;
      }
      if (result.isLastPage) {
        _pagingController.appendLastPage(result.items);
      } else {
        _pagingController.appendPage(
          result.items,
          result.nextOffset ?? pageKey + result.items.length,
        );
      }
    } catch (error) {
      _pagingController.error = error;
    } finally {
      if (usesLocalCatalogSource) {
        final nextSuppressedCatalogLoadCount = _suppressedCatalogLoadCount - 1;
        assert(
          nextSuppressedCatalogLoadCount >= 0,
          '_suppressedCatalogLoadCount went negative - suppression logic is unbalanced',
        );
        _suppressedCatalogLoadCount = math.max(
          0,
          nextSuppressedCatalogLoadCount,
        );
      }
    }
  }

  void _onSearchChanged() {
    _searchDebounce?.cancel();
    final next = _searchController.text.trim();
    if (next == _query.searchText) {
      _setSearchPending(false);
      return;
    }
    _setSearchPending(true);
    _searchDebounce = Timer(
      _searchDebounceDuration,
      () => _applySearchText(_searchController.text),
    );
  }

  void _applySearchText(String rawValue) {
    final next = rawValue.trim();
    if (!mounted) {
      return;
    }
    if (next == _query.searchText) {
      _setSearchPending(false);
      return;
    }
    _setSearchPending(false);
    setState(() => _query = _query.copyWith(searchText: next));
    _refreshProducts();
  }

  void _submitSearch(String rawValue) {
    _searchDebounce?.cancel();
    _applySearchText(rawValue);
  }

  void _setSearchPending(bool value) {
    if (_isSearchPending.value == value) {
      return;
    }
    _isSearchPending.value = value;
  }

  void _setStockFilter(StockFilter filter) {
    if (filter == _query.stockFilter) {
      return;
    }
    setState(() => _query = _query.copyWith(stockFilter: filter));
    _refreshProducts();
  }

  void _setSortOption(SortOption option) {
    if (option == _query.sortOption) {
      return;
    }
    setState(() => _query = _query.copyWith(sortOption: option));
    _refreshProducts();
  }

  void _resetFilters() {
    _searchDebounce?.cancel();
    _setSearchPending(false);
    setState(() {
      _query = const ProductListQuery();
      _searchController.text = '';
    });
    _refreshProducts();
  }

  void _clearSearch() {
    if (_searchController.text.isEmpty && _query.searchText.isEmpty) {
      return;
    }
    _searchDebounce?.cancel();
    _setSearchPending(false);
    setState(() {
      _query = _query.copyWith(searchText: '');
      _searchController.clear();
    });
    _refreshProducts();
  }

  Widget _buildSearchField(BuildContext context, {required bool isTablet}) {
    final texts = _productListTexts(context);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final fieldColor = colors.surface;

    return AnimatedBuilder(
      animation: _searchFieldListenable,
      builder: (context, _) {
        final hasText = _searchController.text.isNotEmpty;
        final isPending = _isSearchPending.value;
        final suffix = _buildSearchSuffixIcon(
          context,
          hasText: hasText,
          isPending: isPending,
          tooltip: texts.clearSearchTooltip,
        );

        if (isTablet) {
          return TextField(
            controller: _searchController,
            textInputAction: TextInputAction.search,
            onSubmitted: _submitSearch,
            decoration: InputDecoration(
              isDense: true,
              hintText: texts.searchHint,
              prefixIcon: const Icon(Icons.search, size: 20),
              suffixIcon: suffix,
              filled: true,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: theme.colorScheme.outlineVariant),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: theme.colorScheme.outlineVariant),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: theme.colorScheme.primary,
                  width: 1.5,
                ),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 9,
              ),
            ),
          );
        }

        return TextField(
          controller: _searchController,
          textInputAction: TextInputAction.search,
          onSubmitted: _submitSearch,
          decoration: InputDecoration(
            isDense: true,
            hintText: texts.searchHint,
            hintStyle: theme.textTheme.bodyMedium?.copyWith(
              color: colors.onSurfaceVariant,
            ),
            prefixIcon: Icon(
              Icons.search_rounded,
              size: 20,
              color: colors.onSurfaceVariant,
            ),
            suffixIcon: suffix,
            filled: true,
            fillColor: fieldColor,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(
                color: colors.outlineVariant.withValues(alpha: 0.85),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(
                color: colors.outlineVariant.withValues(alpha: 0.85),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: colors.primary, width: 1.4),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 11,
            ),
          ),
        );
      },
    );
  }

  Widget? _buildSearchSuffixIcon(
    BuildContext context, {
    required bool hasText,
    required bool isPending,
    required String tooltip,
  }) {
    if (!hasText && !isPending) {
      return null;
    }

    final colors = Theme.of(context).colorScheme;

    return SizedBox(
      width: hasText && isPending ? 72 : 48,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isPending) ...[
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2.2,
                color: colors.primary,
              ),
            ),
            if (hasText) const SizedBox(width: 4),
          ],
          if (hasText)
            IconButton(
              icon: const Icon(Icons.close_rounded, size: 18),
              tooltip: tooltip,
              onPressed: _clearSearch,
            ),
        ],
      ),
    );
  }

  Widget _buildDiscountBanner(
    BuildContext context, {
    required CartController cart,
    required bool isTablet,
  }) {
    final theme = Theme.of(context);
    final borderRadius = isTablet ? 16.0 : 12.0;
    final horizontalPadding = isTablet ? 18.0 : 12.0;
    final verticalPadding = isTablet ? 10.0 : 7.0;
    final iconSize = isTablet ? 18.0 : 15.0;
    final iconSpacing = isTablet ? 10.0 : 7.0;
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: horizontalPadding,
        vertical: verticalPadding,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: theme.colorScheme.primary.withValues(alpha: 0.18),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.local_offer_outlined,
            size: iconSize,
            color: theme.colorScheme.primary,
          ),
          SizedBox(width: iconSpacing),
          Expanded(
            child: Text(
              _discountBannerMessage(context, cart),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style:
                  (isTablet
                          ? theme.textTheme.bodyMedium
                          : theme.textTheme.labelLarge)
                      ?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
            ),
          ),
        ],
      ),
    );
  }

  String _discountBannerMessage(BuildContext context, CartController cart) {
    final texts = _productListTexts(context);
    final nextTarget = cart.nextDiscountTarget;
    if (nextTarget == null) {
      if (cart.discountPercent > 0) {
        return texts.discountReachedMessage(cart.discountPercent);
      }
      return texts.discountAutoApplyMessage;
    }

    final remaining = remainingQuantityForBulkDiscountTarget(
      target: nextTarget,
      items: cart.items,
    );
    if (remaining <= 0) {
      if (cart.discountPercent > 0) {
        return texts.discountReachedMessage(cart.discountPercent);
      }
      return texts.discountAutoApplyMessage;
    }

    final productName = _productNameForDiscountTarget(cart.items, nextTarget);
    if (productName != null && productName.trim().isNotEmpty) {
      return texts.discountTargetProductMessage(
        remaining,
        productName,
        nextTarget.percent,
      );
    }
    return texts.discountTargetMessage(remaining, nextTarget.percent);
  }

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

  void _openProductDetails(BuildContext context, Product product) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ProductDetailScreen(product: product),
      ),
    );
  }

  Widget _buildQuickAddButtonContent(
    BuildContext context, {
    required bool isBusy,
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
    final suggestedAddQuantity = cart.suggestedAddQuantity(product);
    final canAddToCart = suggestedAddQuantity > 0 && !isBusy;
    final primaryAddActionLabel = remainingStock <= 0
        ? texts.quickAddLabel(remainingStock: remainingStock)
        : (texts.isEnglish ? 'Add to cart' : 'Thêm vào giỏ');
    final productSemanticsLabel = texts.productSemanticsLabel(
      product,
      remainingStock,
    );

    if (isGridLayout && !isTablet) {
      return _buildMobileUtilityProductCard(
        context,
        product,
        cart,
        animateEntry: shouldAnimate,
        delay: delay,
        isBusy: isBusy,
        isSyncingProduct: isSyncingProduct,
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
    required bool isSyncingProduct,
    required bool canAddToCart,
    required int remainingStock,
    required String productSemanticsLabel,
  }) {
    final texts = _productListTexts(context);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final isRecentlyAdded = _recentlyAddedProductIds.contains(product.id);
    final primaryActionLabel = remainingStock <= 0
        ? texts.quickAddLabel(remainingStock: remainingStock)
        : texts.addToCartAction;
    final warrantyLabel = product.warrantyMonths > 0
        ? (texts.isEnglish
              ? '${product.warrantyMonths} mo warranty'
              : 'BH ${product.warrantyMonths} tháng')
        : null;

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
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
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
                      aspectRatio: 1.56,
                      child: Stack(
                        children: [
                          Positioned.fill(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(10, 10, 10, 8),
                              child: _buildSquareProductCardImage(
                                product,
                                borderRadius: BorderRadius.circular(18),
                                widthFactor: 0.76,
                                contentPadding: const EdgeInsets.all(4),
                                iconSize: 28,
                                showSurfaceDecoration: false,
                              ),
                            ),
                          ),
                          Positioned(
                            top: 10,
                            right: 10,
                            child: OutlinedButton.icon(
                              onPressed: () =>
                                  _openProductDetails(context, product),
                              style: OutlinedButton.styleFrom(
                                minimumSize: const Size(0, 38),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 10,
                                ),
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                visualDensity: VisualDensity.compact,
                                backgroundColor: colors.surface.withValues(
                                  alpha: 0.9,
                                ),
                                foregroundColor: colors.onSurface,
                                side: BorderSide(
                                  color: colors.outlineVariant.withValues(
                                    alpha: 0.36,
                                  ),
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              icon: const Icon(
                                Icons.arrow_outward_rounded,
                                size: 16,
                              ),
                              label: Text(texts.viewDetailsAction),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                      height: 1.12,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
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
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Flexible(
                        child: Align(
                          alignment: Alignment.topRight,
                          child: StockBadge(
                            remainingStock: remainingStock,
                            lowStockThreshold: _lowStockThreshold,
                            showInStockQuantity: true,
                            useColonForLowStock: true,
                            subtle: true,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 5,
                            ),
                            iconSize: 12,
                            iconTextSpacing: 3,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      _ProductMetaPill(
                        icon: Icons.qr_code_2_rounded,
                        label: product.sku,
                        backgroundColor: colors.surfaceContainerLow.withValues(
                          alpha: 0.84,
                        ),
                        foregroundColor: colors.onSurfaceVariant,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 9,
                          vertical: 6,
                        ),
                        iconSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                      if (warrantyLabel != null)
                        _ProductMetaPill(
                          icon: Icons.verified_outlined,
                          label: warrantyLabel,
                          backgroundColor: colors.surfaceContainerHighest
                              .withValues(alpha: 0.68),
                          foregroundColor: colors.onSurfaceVariant,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 9,
                            vertical: 6,
                          ),
                          iconSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: canAddToCart
                              ? () => _handleAddToCart(cart, product)
                              : null,
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(0, 50),
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                            backgroundColor: isRecentlyAdded
                                ? colors.tertiaryContainer
                                : colors.primaryContainer.withValues(
                                    alpha: 0.92,
                                  ),
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
                            isRecentlyAdded: isRecentlyAdded,
                            useCompactLayout: false,
                            label: primaryActionLabel,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Tooltip(
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
                            minimumSize: const Size(50, 50),
                            padding: EdgeInsets.zero,
                            backgroundColor: colors.surface.withValues(
                              alpha: 0.72,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            side: BorderSide(
                              color: colors.outlineVariant.withValues(
                                alpha: 0.5,
                              ),
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
                              : Icon(
                                  Icons.tune_rounded,
                                  size: 19,
                                  color: canAddToCart
                                      ? colors.onSurface
                                      : colors.onSurfaceVariant.withValues(
                                          alpha: 0.7,
                                        ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ],
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

enum _ProductListDeviceClass { mobile, tablet, desktop }

class _ProductListAdaptiveLayout {
  const _ProductListAdaptiveLayout({
    required this.deviceClass,
    required this.viewportWidth,
    required this.shortestSide,
    required this.textScale,
    required this.maxContentWidth,
    required this.baseHorizontalPadding,
    required this.gridSpacing,
    required this.minGridTileWidth,
    required this.maxGridColumns,
    required this.futureFilterRailWidth,
    required this.contentSectionGap,
  });

  factory _ProductListAdaptiveLayout.fromContext(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final viewportWidth = size.width;
    final shortestSide = size.shortestSide;
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.8);

    if (viewportWidth >= AppBreakpoints.desktop) {
      const futureFilterRailWidth = 280.0;
      const contentSectionGap = 28.0;
      return _ProductListAdaptiveLayout(
        deviceClass: _ProductListDeviceClass.desktop,
        viewportWidth: viewportWidth,
        shortestSide: shortestSide,
        textScale: textScale,
        maxContentWidth: 1120 + futureFilterRailWidth + contentSectionGap,
        baseHorizontalPadding: 32,
        gridSpacing: 20,
        minGridTileWidth: 228,
        maxGridColumns: 6,
        futureFilterRailWidth: futureFilterRailWidth,
        contentSectionGap: contentSectionGap,
      );
    }

    if (viewportWidth >= 700 || shortestSide >= AppBreakpoints.phone) {
      return _ProductListAdaptiveLayout(
        deviceClass: _ProductListDeviceClass.tablet,
        viewportWidth: viewportWidth,
        shortestSide: shortestSide,
        textScale: textScale,
        maxContentWidth: _ProductListScreenState._tabletListMaxContentWidth,
        baseHorizontalPadding: 24,
        gridSpacing: 16,
        minGridTileWidth: 220,
        maxGridColumns: 4,
        futureFilterRailWidth: 0,
        contentSectionGap: 24,
      );
    }

    return _ProductListAdaptiveLayout(
      deviceClass: _ProductListDeviceClass.mobile,
      viewportWidth: viewportWidth,
      shortestSide: shortestSide,
      textScale: textScale,
      maxContentWidth: double.infinity,
      baseHorizontalPadding: 16,
      gridSpacing: 12,
      minGridTileWidth: 248,
      maxGridColumns: 2,
      futureFilterRailWidth: 0,
      contentSectionGap: 16,
    );
  }

  final _ProductListDeviceClass deviceClass;
  final double viewportWidth;
  final double shortestSide;
  final double textScale;
  final double maxContentWidth;
  final double baseHorizontalPadding;
  final double gridSpacing;
  final double minGridTileWidth;
  final int maxGridColumns;
  final double futureFilterRailWidth;
  final double contentSectionGap;

  bool get isMobile => deviceClass == _ProductListDeviceClass.mobile;
  bool get isTablet => deviceClass != _ProductListDeviceClass.mobile;
  bool get isDesktop => deviceClass == _ProductListDeviceClass.desktop;
  bool get supportsFutureFilterRail => futureFilterRailWidth > 0;

  double get centeredHorizontalPadding {
    if (!maxContentWidth.isFinite) {
      return baseHorizontalPadding;
    }

    final availableWidth = viewportWidth - (baseHorizontalPadding * 2);
    if (availableWidth <= maxContentWidth) {
      return baseHorizontalPadding;
    }

    return baseHorizontalPadding + ((availableWidth - maxContentWidth) / 2);
  }

  double get stickyOuterTopPadding => isMobile ? 4 : 8;

  double get stickyOuterBottomPadding => isDesktop ? 16 : (isMobile ? 10 : 14);

  double resolveResultsBottomPadding({required double bottomSafeArea}) {
    if (isDesktop) {
      return 32;
    }
    if (isMobile) {
      return 104 + bottomSafeArea;
    }
    return 24;
  }

  double get filterRowHeight =>
      (isMobile ? 42 : 48) + ((textScale - 1) * (isMobile ? 10 : 12));

  double get filterSectionSpacing => isDesktop ? 12 : 10;

  double get summaryWidth => isDesktop ? 188 : 156;

  double get desktopSearchFieldWidth =>
      (viewportWidth * 0.26).clamp(320.0, 420.0).toDouble();

  double get stickyHeaderExtent {
    final bannerHeight = isMobile
        ? 34 + ((textScale - 1) * 8)
        : 44 + ((textScale - 1) * 10);
    final searchRowHeight = isMobile
        ? 48 + ((textScale - 1) * 10)
        : 48 + ((textScale - 1) * 10);
    final summaryRowHeight = 40 + ((textScale - 1) * 8);

    if (isMobile) {
      return stickyOuterTopPadding +
          stickyOuterBottomPadding +
          10 +
          bannerHeight +
          8 +
          searchRowHeight +
          8 +
          filterRowHeight +
          8 +
          summaryRowHeight +
          8;
    }

    if (isDesktop) {
      return stickyOuterTopPadding +
          stickyOuterBottomPadding +
          16 +
          math.max(bannerHeight, searchRowHeight) +
          filterSectionSpacing +
          filterRowHeight +
          14;
    }

    return stickyOuterTopPadding +
        stickyOuterBottomPadding +
        12 +
        bannerHeight +
        10 +
        searchRowHeight +
        10 +
        filterRowHeight +
        12;
  }

  _ProductGridGeometry resolveGridGeometry(double crossAxisExtent) {
    final minGridColumns = isMobile ? 1 : 2;
    final rawColumnCount =
        ((crossAxisExtent + gridSpacing) / (minGridTileWidth + gridSpacing))
            .floor();
    final crossAxisCount = rawColumnCount.clamp(minGridColumns, maxGridColumns);
    final itemWidth =
        (crossAxisExtent - ((crossAxisCount - 1) * gridSpacing)) /
        crossAxisCount;

    return _ProductGridGeometry(
      crossAxisCount: crossAxisCount,
      crossAxisSpacing: gridSpacing,
      mainAxisSpacing: gridSpacing,
      itemExtent: _resolveGridItemExtent(itemWidth),
    );
  }

  double _resolveGridItemExtent(double itemWidth) {
    if (isMobile) {
      final mediaExtent = math.max(0, (itemWidth - 28) / 1.56);
      const contentHeight = 184.0;
      return mediaExtent + contentHeight + ((textScale - 1) * 102);
    }

    final mediaExtent = math.max(
      0,
      (itemWidth - 32) * (itemWidth >= 300 ? 0.84 : 0.88),
    );
    final contentHeight = itemWidth >= 300 ? 204.0 : 216.0;
    return mediaExtent + contentHeight + ((textScale - 1) * 96);
  }
}

class _ProductGridGeometry {
  const _ProductGridGeometry({
    required this.crossAxisCount,
    required this.crossAxisSpacing,
    required this.mainAxisSpacing,
    required this.itemExtent,
  });

  final int crossAxisCount;
  final double crossAxisSpacing;
  final double mainAxisSpacing;
  final double itemExtent;
}

class _PinnedHeaderDelegate extends SliverPersistentHeaderDelegate {
  const _PinnedHeaderDelegate({
    required this.minExtent,
    required this.maxExtent,
    required this.child,
  });

  @override
  final double minExtent;

  @override
  final double maxExtent;

  final Widget child;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return SizedBox.expand(
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        decoration: BoxDecoration(
          boxShadow: overlapsContent
              ? [
                  BoxShadow(
                    color: Theme.of(
                      context,
                    ).shadowColor.withValues(alpha: 0.06),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: child,
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _PinnedHeaderDelegate oldDelegate) {
    return oldDelegate.child != child ||
        oldDelegate.minExtent != minExtent ||
        oldDelegate.maxExtent != maxExtent;
  }
}

class _ProductListStatePanel extends StatelessWidget {
  const _ProductListStatePanel({
    required this.icon,
    required this.title,
    required this.description,
    this.actions = const <Widget>[],
    this.compact = false,
  });

  final IconData icon;
  final String title;
  final String description;
  final List<Widget> actions;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: compact ? 360 : 380),
      child: Semantics(
        container: true,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: colors.outlineVariant.withValues(alpha: 0.55),
            ),
            boxShadow: [
              BoxShadow(
                color: theme.shadowColor.withValues(alpha: 0.03),
                blurRadius: 12,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Padding(
            padding: EdgeInsets.all(compact ? 18 : 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  icon,
                  size: compact ? 36 : 42,
                  color: colors.onSurfaceVariant,
                ),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colors.onSurfaceVariant,
                    height: 1.35,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (actions.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 8,
                    runSpacing: 8,
                    children: actions,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _InteractiveProductCardSurface extends StatefulWidget {
  const _InteractiveProductCardSurface({
    required this.borderRadius,
    required this.side,
    required this.onTap,
    required this.child,
  });

  final BorderRadius borderRadius;
  final BorderSide side;
  final VoidCallback onTap;
  final Widget child;

  @override
  State<_InteractiveProductCardSurface> createState() =>
      _InteractiveProductCardSurfaceState();
}

class _InteractiveProductCardSurfaceState
    extends State<_InteractiveProductCardSurface> {
  bool _isHovered = false;
  bool _isPressed = false;
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final highlight = _isHovered || _isFocused;
    final borderColor = highlight
        ? Color.lerp(widget.side.color, colors.primary, 0.38)!
        : widget.side.color;
    final shadowAlpha = _isPressed
        ? 0.02
        : highlight
        ? 0.06
        : 0.0;
    final translateY = _isPressed
        ? 0.0
        : _isHovered
        ? -1.0
        : 0.0;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      curve: Curves.easeOutCubic,
      transform: Matrix4.translationValues(0, translateY, 0),
      decoration: ShapeDecoration(
        color: theme.cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: widget.borderRadius,
          side: BorderSide(color: borderColor, width: widget.side.width),
        ),
        shadows: shadowAlpha == 0
            ? const <BoxShadow>[]
            : [
                BoxShadow(
                  color: theme.shadowColor.withValues(alpha: shadowAlpha),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(borderRadius: widget.borderRadius),
        child: InkWell(
          onTap: widget.onTap,
          onHover: (value) => setState(() => _isHovered = value),
          onHighlightChanged: (value) => setState(() => _isPressed = value),
          onFocusChange: (value) => setState(() => _isFocused = value),
          overlayColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.pressed)) {
              return colors.primary.withValues(alpha: 0.08);
            }
            if (states.contains(WidgetState.hovered) ||
                states.contains(WidgetState.focused)) {
              return colors.primary.withValues(alpha: 0.04);
            }
            return null;
          }),
          borderRadius: widget.borderRadius,
          child: widget.child,
        ),
      ),
    );
  }
}

class _ProductMetaPill extends StatelessWidget {
  const _ProductMetaPill({
    required this.icon,
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
    this.padding = const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
    this.iconSize = 14,
    this.fontWeight = FontWeight.w700,
  });

  final IconData icon;
  final String label;
  final Color backgroundColor;
  final Color foregroundColor;
  final EdgeInsetsGeometry padding;
  final double iconSize;
  final FontWeight fontWeight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: foregroundColor.withValues(alpha: 0.16)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: iconSize, color: foregroundColor),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.labelMedium?.copyWith(
                color: foregroundColor,
                fontWeight: fontWeight,
                height: 1,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductCardSkeleton extends StatelessWidget {
  const _ProductCardSkeleton({this.isGridLayout = false});

  final bool isGridLayout;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.all(isGridLayout ? 16 : 14),
        child: isGridLayout
            ? const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonBox(
                    width: double.infinity,
                    height: 172,
                    borderRadius: BorderRadius.all(Radius.circular(22)),
                  ),
                  SizedBox(height: 12),
                  SkeletonBox(width: double.infinity, height: 22),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: SkeletonBox(width: double.infinity, height: 16),
                      ),
                      SizedBox(width: 12),
                      SkeletonBox(width: 96, height: 28),
                    ],
                  ),
                  SizedBox(height: 12),
                  Row(
                    children: [
                      SkeletonBox(width: 84, height: 28),
                      SizedBox(width: 8),
                      SkeletonBox(width: 92, height: 28),
                    ],
                  ),
                  SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: SkeletonBox(width: double.infinity, height: 50),
                      ),
                      SizedBox(width: 10),
                      SkeletonBox(width: 50, height: 50),
                    ],
                  ),
                ],
              )
            : const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonBox(
                        width: 64,
                        height: 64,
                        borderRadius: BorderRadius.all(Radius.circular(14)),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SkeletonBox(width: double.infinity, height: 18),
                            SizedBox(height: 6),
                            Row(
                              children: [
                                SkeletonBox(width: 80, height: 13),
                                SizedBox(width: 8),
                                SkeletonBox(width: 60, height: 20),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 12),
                  Divider(height: 1, thickness: 1),
                  SizedBox(height: 10),
                  Row(
                    children: [
                      SkeletonBox(width: 110, height: 20),
                      Spacer(),
                      SkeletonBox(width: 130, height: 40),
                    ],
                  ),
                ],
              ),
      ),
    );
  }
}

class _ProductListTexts {
  const _ProductListTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Products' : 'Sản phẩm';
  String get searchHint => isEnglish
      ? 'Search by product name or SKU...'
      : 'Tìm theo tên hoặc SKU...';
  String get clearSearchTooltip => isEnglish ? 'Clear search' : 'Xóa tìm kiếm';
  String get emptyFilteredProductsMessage => isEnglish
      ? 'No products match your current filters.'
      : 'Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.';
  String get emptyProductsMessage => isEnglish
      ? 'No products available to display.'
      : 'Chưa có sản phẩm để hiển thị.';
  String get discountAutoApplyMessage => isEnglish
      ? 'Volume discounts apply automatically when eligible'
      : 'Chiết khấu số lượng sẽ tự động áp dụng khi đủ điều kiện';
  String get sortTooltip => isEnglish ? 'Sort products' : 'Sắp xếp';
  String get loadProductsFailedTitle => isEnglish
      ? 'Unable to load the product catalog.'
      : 'Không tải được danh mục sản phẩm.';
  String get loadProductsFailedDescription => isEnglish
      ? 'Please check your connection and try again.'
      : 'Vui lòng kiểm tra kết nối và thử lại.';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get openProductDetailsHint =>
      isEnglish ? 'Open product details' : 'Mở chi tiết sản phẩm';
  String get syncingCartTooltip =>
      isEnglish ? 'Syncing cart' : 'Đang đồng bộ giỏ hàng';
  String get chooseQuantityTooltip =>
      isEnglish ? 'Choose quantity' : 'Chọn số lượng';
  String get backToCartAction => isEnglish ? 'Go to cart' : 'Quay lại giỏ hàng';
  String get chooseQuantityDialogTitle =>
      isEnglish ? 'Choose quantity' : 'Chọn số lượng';
  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get addAction => isEnglish ? 'Add' : 'Thêm';
  String get addToCartAction => isEnglish ? 'Add to cart' : 'Thêm vào giỏ';
  String get unavailableAction => isEnglish ? 'Unavailable' : 'Không thể thêm';
  String get dealerPriceLabel => isEnglish ? 'Dealer price' : 'Giá đại lý';
  String get viewDetailsAction => isEnglish ? 'Details' : 'Chi tiết';
  String resultsLabel(int count) =>
      isEnglish ? '$count results' : '$count kết quả';

  String stockFilterLabel(StockFilter filter) {
    switch (filter) {
      case StockFilter.all:
        return isEnglish ? 'All' : 'Tất cả';
      case StockFilter.inStock:
        return isEnglish ? 'In stock' : 'Còn hàng';
      case StockFilter.lowStock:
        return isEnglish ? 'Low stock' : 'Sắp hết';
      case StockFilter.outOfStock:
        return isEnglish ? 'Out of stock' : 'Hết hàng';
    }
  }

  String clearFiltersLabel(int count) =>
      isEnglish ? 'Clear filters ($count)' : 'Xóa lọc ($count)';

  String sortLabel(SortOption option) {
    switch (option) {
      case SortOption.none:
        return isEnglish ? 'Sort' : 'Sắp xếp';
      case SortOption.priceAsc:
        return isEnglish ? 'Price low -> high' : 'Giá thấp → cao';
      case SortOption.priceDesc:
        return isEnglish ? 'Price high -> low' : 'Giá cao → thấp';
      case SortOption.nameAsc:
        return isEnglish ? 'Name A -> Z' : 'Tên A → Z';
      case SortOption.nameDesc:
        return isEnglish ? 'Name Z -> A' : 'Tên Z → A';
    }
  }

  String sortMenuOptionLabel(SortOption option) {
    if (option == SortOption.none) {
      return isEnglish ? 'Default' : 'Mặc định';
    }
    return sortLabel(option);
  }

  String discountReachedMessage(int percent) => isEnglish
      ? 'Current discount tier reached: $percent%'
      : 'Đã đạt mức chiết khấu hiện tại: $percent%';

  String discountTargetProductMessage(
    int remaining,
    String productName,
    int percent,
  ) => isEnglish
      ? 'Buy $remaining more ${remaining == 1 ? 'item' : 'items'} of "$productName" to unlock $percent% discount'
      : 'Mua thêm $remaining sản phẩm "$productName" để mở chiết khấu $percent%';

  String discountTargetMessage(int remaining, int percent) => isEnglish
      ? 'Buy $remaining more ${remaining == 1 ? 'item' : 'items'} to unlock $percent% discount'
      : 'Mua thêm $remaining sản phẩm để mở chiết khấu $percent%';

  String quickAddLabel({required int remainingStock}) {
    if (remainingStock <= 0) {
      return isEnglish ? 'Out of stock' : 'Hết hàng';
    }
    return isEnglish ? 'Quick add' : 'Thêm nhanh';
  }

  String productSemanticsLabel(Product product, int remainingStock) => isEnglish
      ? '${product.name}, SKU ${product.sku}, price ${formatVnd(product.price)}, stock $remainingStock'
      : '${product.name}, SKU ${product.sku}, giá ${formatVnd(product.price)}, tồn kho $remainingStock';

  String addedToCartMessage(int quantity) => isEnglish
      ? 'Added $quantity ${quantity == 1 ? 'item' : 'items'} to cart'
      : 'Đã thêm $quantity sản phẩm vào giỏ';

  String quantityRangeLabel(int minQty, int maxQuantity) => isEnglish
      ? 'Minimum: $minQty • Maximum: $maxQuantity'
      : 'Tối thiểu: $minQty • Tối đa: $maxQuantity';
}

String? _productNameForDiscountTarget(
  List<CartItem> items,
  BulkDiscountTarget target,
) {
  final productId = target.productId;
  if (productId == null) {
    return null;
  }
  for (final item in items) {
    if (item.product.id == productId) {
      return item.product.name;
    }
  }
  return null;
}

extension _ProductListTextsUxStates on _ProductListTexts {
  String get emptyFilteredTitle =>
      isEnglish ? 'No matching products' : 'Không có sản phẩm phù hợp';
  String get emptyFilteredDescription => isEnglish
      ? 'Try another keyword or clear the current filters to see more products.'
      : 'Thử từ khóa khác hoặc xóa bộ lọc hiện tại để xem thêm sản phẩm.';
  String get emptyCatalogTitle =>
      isEnglish ? 'Catalog is empty' : 'Danh mục chưa có sản phẩm';
  String get emptyCatalogDescription => isEnglish
      ? 'Products will appear here once your catalog is updated.'
      : 'Sản phẩm sẽ xuất hiện tại đây khi danh mục được cập nhật.';
  String get loadMoreProductsFailedTitle => isEnglish
      ? 'Could not load more products'
      : 'Không tải thêm được sản phẩm';
  String get loadMoreProductsFailedDescription => isEnglish
      ? 'You can retry without losing the products already on screen.'
      : 'Bạn có thể thử lại mà vẫn giữ các sản phẩm đang hiển thị trên màn hình.';
  String get refreshCatalogAction =>
      isEnglish ? 'Refresh catalog' : 'Tải lại danh mục';
  String get refreshingCatalogLabel => isEnglish
      ? 'Refreshing product catalog'
      : 'Đang cập nhật danh mục sản phẩm';
  String get loadingProductsLabel =>
      isEnglish ? 'Loading products' : 'Đang tải sản phẩm';
  String get loadingMoreProductsLabel =>
      isEnglish ? 'Loading more products' : 'Đang tải thêm sản phẩm';
  String get addedAction => isEnglish ? 'Added' : 'Đã thêm';
}
