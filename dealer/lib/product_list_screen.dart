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

  late final PagingController<int, Product> _pagingController;
  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;
  Timer? _catalogRefreshDebounce;
  ProductListQuery _query = const ProductListQuery();
  ProductCatalogController? _productCatalog;
  ProductQueryRepository? _productQueryRepository;
  final Set<String> _addingProductIds = <String>{};
  String? _catalogSnapshot;
  bool _isManuallyRefreshingCatalog = false;
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
    _searchController.dispose();
    _pagingController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final texts = _productListTexts(context);
    final cart = CartScope.of(context);
    final size = MediaQuery.sizeOf(context);
    final width = size.width;
    final shortestSide = size.shortestSide;
    final isTablet = shortestSide >= AppBreakpoints.phone;
    final baseHorizontalPadding = isTablet ? 32.0 : 16.0;
    final maxContentWidth = isTablet
        ? _tabletListMaxContentWidth
        : double.infinity;
    final availableWidth = width - (baseHorizontalPadding * 2);
    final extraHorizontalInset =
        maxContentWidth.isFinite && availableWidth > maxContentWidth
        ? (availableWidth - maxContentWidth) / 2
        : 0.0;
    final horizontalPadding = baseHorizontalPadding + extraHorizontalInset;
    final stickyBarHeight = _stickyFilterBarHeight(context, isTablet: isTablet);

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
      body: RefreshIndicator(
        onRefresh: _refreshCatalog,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverPersistentHeader(
              pinned: true,
              delegate: _PinnedHeaderDelegate(
                minExtent: stickyBarHeight,
                maxExtent: stickyBarHeight,
                child: Container(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  padding: EdgeInsets.fromLTRB(
                    horizontalPadding,
                    isTablet ? 8 : 6,
                    horizontalPadding,
                    isTablet ? 14 : 12,
                  ),
                  child: _buildStickyFilterBar(
                    context,
                    isTablet: isTablet,
                    cart: cart,
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: EdgeInsets.fromLTRB(
                horizontalPadding,
                0,
                horizontalPadding,
                24,
              ),
              sliver: _buildResultsSliver(context, cart, isTablet: isTablet),
            ),
          ],
        ),
      ),
    );
  }

  double _stickyFilterBarHeight(
    BuildContext context, {
    required bool isTablet,
  }) {
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.8);
    final baseHeight = isTablet ? 194.0 : 248.0;
    final additionalHeight = (textScale - 1) * (isTablet ? 84 : 104);
    return baseHeight + additionalHeight;
  }

  Widget _buildResultsSliver(
    BuildContext context,
    CartController cart, {
    required bool isTablet,
  }) {
    const useGridLayout = true;
    final gridItemExtent = isTablet
        ? _tabletGridItemExtent(context)
        : _phoneGridItemExtent(context);
    final delegate = PagedChildBuilderDelegate<Product>(
      itemBuilder: (context, product, index) {
        return _buildProductCard(
          context,
          product,
          index,
          cart,
          isTablet: isTablet,
          isGridLayout: useGridLayout,
        );
      },
      firstPageProgressIndicatorBuilder: (context) {
        return _buildFirstPageSkeleton(
          isGridLayout: useGridLayout,
          gridItemExtent: gridItemExtent,
        );
      },
      newPageProgressIndicatorBuilder: (context) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator()),
      ),
      firstPageErrorIndicatorBuilder: (context) {
        return _buildErrorIndicator(context, isFirstPage: true);
      },
      newPageErrorIndicatorBuilder: (context) {
        return _buildErrorIndicator(context);
      },
      noItemsFoundIndicatorBuilder: (context) {
        final texts = _productListTexts(context);
        final message = _hasAnyFilters
            ? texts.emptyFilteredProductsMessage
            : texts.emptyProductsMessage;
        return FadeSlideIn(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 32),
              child: Text(
                message,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        );
      },
    );

    return PagedSliverGrid<int, Product>(
      pagingController: _pagingController,
      builderDelegate: delegate,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        mainAxisExtent: gridItemExtent,
      ),
    );
  }

  double _tabletGridItemExtent(BuildContext context) {
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.8);
    return 320 + (textScale - 1) * 100;
  }

  double _phoneGridItemExtent(BuildContext context) {
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6);
    return 344 + (textScale - 1) * 132;
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
          '_suppressedCatalogLoadCount went negative — suppression logic is unbalanced',
        );
        _suppressedCatalogLoadCount = math.max(
          0,
          nextSuppressedCatalogLoadCount,
        );
      }
    }
  }

  void _onSearchChanged() {
    if (mounted) {
      setState(() {});
    }
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 320), () {
      final next = _searchController.text.trim();
      if (next == _query.searchText) {
        return;
      }
      setState(() => _query = _query.copyWith(searchText: next));
      _refreshProducts();
    });
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
    setState(() {
      _query = _query.copyWith(searchText: '');
      _searchController.clear();
    });
    _refreshProducts();
  }

  Widget _buildDiscountBanner(
    BuildContext context, {
    required CartController cart,
    required bool isTablet,
  }) {
    final theme = Theme.of(context);
    final borderRadius = isTablet ? 16.0 : 12.0;
    final horizontalPadding = isTablet ? 18.0 : 14.0;
    final verticalPadding = isTablet ? 10.0 : 8.0;
    final iconSize = isTablet ? 18.0 : 16.0;
    final iconSpacing = isTablet ? 10.0 : 8.0;
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
                          : theme.textTheme.bodySmall)
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
    required bool isTablet,
    required CartController cart,
  }) {
    if (!isTablet) {
      return _buildMobileUtilityFilterBar(context, cart: cart);
    }

    final texts = _productListTexts(context);
    final hasActiveFilters = _hasAnyFilters;
    final activeCount = _activeFilterCount;
    final theme = Theme.of(context);
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6);
    final chipRowHeight = math.max(48.0, 48.0 * textScale);

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
          10,
          isTablet ? 10 : 8,
          10,
          isTablet ? 8 : 6,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildDiscountBanner(context, cart: cart, isTablet: isTablet),
            const SizedBox(height: 8),
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                isDense: true,
                hintText: texts.searchHint,
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        tooltip: texts.clearSearchTooltip,
                        onPressed: _clearSearch,
                      ),
                filled: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: theme.colorScheme.outlineVariant,
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: theme.colorScheme.outlineVariant,
                  ),
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
            ),
            const SizedBox(height: 6),
            SizedBox(
              height: chipRowHeight,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Center(
                      child: Icon(
                        Icons.filter_alt_outlined,
                        size: isTablet ? 20 : 18,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 2),
                  _buildStockChip(
                    context,
                    StockFilter.all,
                    texts.stockFilterLabel(StockFilter.all),
                  ),
                  const SizedBox(width: 8),
                  _buildStockChip(
                    context,
                    StockFilter.inStock,
                    texts.stockFilterLabel(StockFilter.inStock),
                  ),
                  const SizedBox(width: 8),
                  _buildStockChip(
                    context,
                    StockFilter.lowStock,
                    texts.stockFilterLabel(StockFilter.lowStock),
                  ),
                  const SizedBox(width: 8),
                  _buildStockChip(
                    context,
                    StockFilter.outOfStock,
                    texts.stockFilterLabel(StockFilter.outOfStock),
                  ),
                  const SizedBox(width: 8),
                  _buildSortMenu(context),
                  if (hasActiveFilters) ...[
                    const SizedBox(width: 8),
                    TextButton.icon(
                      onPressed: _resetFilters,
                      icon: const Icon(Icons.close_rounded, size: 16),
                      label: Text(texts.clearFiltersLabel(activeCount)),
                    ),
                  ],
                  const SizedBox(width: 2),
                ],
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
  }) {
    final texts = _productListTexts(context);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    final loadedCount = _visibleResultCount;
    final hasActiveFilters = _hasAnyFilters;
    final surfaceColor = isDark ? colors.surface : const Color(0xFFF8F9FF);
    final fieldColor = isDark ? colors.surface : Colors.white;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: isDark ? 0.82 : 0.45),
        ),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withValues(alpha: isDark ? 0.06 : 0.04),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDiscountBanner(context, cart: cart, isTablet: false),
            const SizedBox(height: 10),
            TextField(
              controller: _searchController,
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
                suffixIcon: _searchController.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close_rounded, size: 18),
                        tooltip: texts.clearSearchTooltip,
                        onPressed: _clearSearch,
                      ),
                filled: true,
                fillColor: fieldColor,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(18),
                  borderSide: BorderSide(
                    color: colors.outlineVariant.withValues(
                      alpha: isDark ? 0.85 : 0.65,
                    ),
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(18),
                  borderSide: BorderSide(
                    color: colors.outlineVariant.withValues(
                      alpha: isDark ? 0.85 : 0.65,
                    ),
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(18),
                  borderSide: BorderSide(color: colors.primary, width: 1.4),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 13,
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _buildStockChip(
                    context,
                    StockFilter.all,
                    texts.stockFilterLabel(StockFilter.all),
                    useUtilityStyle: true,
                  ),
                  const SizedBox(width: 8),
                  _buildStockChip(
                    context,
                    StockFilter.inStock,
                    texts.stockFilterLabel(StockFilter.inStock),
                    useUtilityStyle: true,
                  ),
                  const SizedBox(width: 8),
                  _buildStockChip(
                    context,
                    StockFilter.lowStock,
                    texts.stockFilterLabel(StockFilter.lowStock),
                    useUtilityStyle: true,
                  ),
                  const SizedBox(width: 8),
                  _buildStockChip(
                    context,
                    StockFilter.outOfStock,
                    texts.stockFilterLabel(StockFilter.outOfStock),
                    useUtilityStyle: true,
                  ),
                  if (hasActiveFilters) ...[
                    const SizedBox(width: 8),
                    OutlinedButton.icon(
                      onPressed: _resetFilters,
                      icon: const Icon(Icons.restart_alt_rounded, size: 16),
                      label: Text(texts.clearFiltersLabel(_activeFilterCount)),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(44, 40),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        side: BorderSide(
                          color: colors.outlineVariant.withValues(
                            alpha: isDark ? 0.85 : 0.8,
                          ),
                        ),
                        foregroundColor: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: Text(
                    loadedCount > 0
                        ? texts.resultsLabel(loadedCount)
                        : texts.screenTitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                _buildSortMenu(context, useUtilityStyle: true),
              ],
            ),
          ],
        ),
      ),
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
        constraints: const BoxConstraints(minHeight: 48),
        child: ChoiceChip(
          label: Text(label),
          selected: isSelected,
          onSelected: (_) => _setStockFilter(filter),
          selectedColor: useUtilityStyle
              ? colors.primary.withValues(alpha: 0.14)
              : colors.primary.withValues(alpha: 0.15),
          labelStyle:
              (useUtilityStyle
                      ? theme.textTheme.labelLarge
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
            horizontal: useUtilityStyle ? 4 : 0,
          ),
          visualDensity: VisualDensity.compact,
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
        constraints: BoxConstraints(minHeight: useUtilityStyle ? 42 : 48),
        padding: EdgeInsets.symmetric(
          horizontal: 12,
          vertical: useUtilityStyle ? 9 : 10,
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
              size: 18,
              color: colors.onSurface,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: theme.textTheme.labelLarge?.copyWith(
                color: colors.onSurface,
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
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: EdgeInsets.symmetric(
        vertical: isFirstPage ? 32 : 12,
        horizontal: 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.cloud_off_outlined,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            size: isFirstPage ? 48 : 36,
          ),
          const SizedBox(height: 12),
          Text(
            texts.loadProductsFailedTitle,
            style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            texts.loadProductsFailedDescription,
            style: textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: _retryLoadProducts,
            child: Text(texts.retryAction),
          ),
        ],
      ),
    );
  }

  Widget _buildFirstPageSkeleton({
    required bool isGridLayout,
    required double gridItemExtent,
  }) {
    if (isGridLayout) {
      return Column(
        children: List.generate(2, (rowIndex) {
          return Padding(
            padding: EdgeInsets.only(bottom: rowIndex == 1 ? 0 : 12),
            child: Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: gridItemExtent,
                    child: const _ProductCardSkeleton(isGridLayout: true),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: gridItemExtent,
                    child: const _ProductCardSkeleton(isGridLayout: true),
                  ),
                ),
              ],
            ),
          );
        }),
      );
    }

    return Padding(
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
    final delay = Duration(milliseconds: 30 * (index % _pageSize));
    final isSyncingProduct = cart.isSyncingProduct(product.id);
    final isAddingToCart = _addingProductIds.contains(product.id);
    final isBusy = isAddingToCart || isSyncingProduct;
    final remainingStock = cart.remainingStockFor(product);
    final suggestedAddQuantity = cart.suggestedAddQuantity(product);
    final canAddToCart = suggestedAddQuantity > 0 && !isBusy;
    final productSemanticsLabel = texts.productSemanticsLabel(
      product,
      remainingStock,
    );

    if (isGridLayout && !isTablet) {
      return _buildMobileUtilityProductCard(
        context,
        product,
        cart,
        delay: delay,
        isBusy: isBusy,
        isSyncingProduct: isSyncingProduct,
        canAddToCart: canAddToCart,
        remainingStock: remainingStock,
        productSemanticsLabel: productSemanticsLabel,
      );
    }

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final imageSize = isTablet ? 80.0 : 64.0;
    final gridImageHeight = isTablet ? 132.0 : 112.0;
    final cardPadding = isTablet ? (isGridLayout ? 16.0 : 18.0) : 14.0;
    final addButtonLabel = texts.quickAddLabel(remainingStock: remainingStock);

    final useCompactQuickAdd = isGridLayout && canAddToCart;

    return FadeSlideIn(
      key: ValueKey(product.id),
      delay: delay,
      child: Padding(
        padding: EdgeInsets.only(
          bottom: isGridLayout ? 0 : (isTablet ? 12 : 10),
        ),
        child: Semantics(
          container: true,
          label: productSemanticsLabel,
          hint: texts.openProductDetailsHint,
          child: Card(
            elevation: 0,
            clipBehavior: Clip.antiAlias,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
              side: BorderSide(
                color: theme.colorScheme.outlineVariant.withValues(alpha: 0.6),
              ),
            ),
            child: InkWell(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => ProductDetailScreen(product: product),
                  ),
                );
              },
              child: Padding(
                padding: EdgeInsets.all(cardPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Info section
                    if (isGridLayout) ...[
                      Hero(
                        tag: 'product-image-${product.id}',
                        child: ProductImage(
                          product: product,
                          width: double.infinity,
                          height: gridImageHeight,
                          borderRadius: BorderRadius.circular(16),
                          iconSize: 34,
                        ),
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
                    // Action row
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
                              elevation: isDark ? 0 : null,
                              backgroundColor: isDark
                                  ? theme.colorScheme.secondaryContainer
                                        .withValues(alpha: 0.8)
                                  : null,
                              foregroundColor: isDark
                                  ? theme.colorScheme.onSecondaryContainer
                                  : null,
                            ),
                            child: isBusy
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.4,
                                    ),
                                  )
                                : useCompactQuickAdd
                                ? const Icon(
                                    Icons.add_shopping_cart_outlined,
                                    size: 18,
                                  )
                                : Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.add_shopping_cart_outlined,
                                        size: 18,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(addButtonLabel),
                                    ],
                                  ),
                          );
                        }

                        final isMobileListLayout = !isTablet && !isGridLayout;
                        if (isMobileListLayout) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              priceText,
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  buildQuantityButton(),
                                  const Spacer(),
                                  buildQuickAddButton(),
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
    final isDark = theme.brightness == Brightness.dark;
    final skuBackground = isDark ? colors.surface : const Color(0xFFEFF3FB);

    return FadeSlideIn(
      key: ValueKey(product.id),
      delay: delay,
      child: Semantics(
        container: true,
        label: productSemanticsLabel,
        hint: texts.openProductDetailsHint,
        child: Card(
          margin: EdgeInsets.zero,
          elevation: 0,
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(22),
            side: BorderSide(
              color: colors.outlineVariant.withValues(alpha: 0.55),
            ),
          ),
          child: InkWell(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => ProductDetailScreen(product: product),
                ),
              );
            },
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Hero(
                    tag: 'product-image-${product.id}',
                    child: ProductImage(
                      product: product,
                      width: double.infinity,
                      height: 108,
                      borderRadius: BorderRadius.circular(18),
                      iconSize: 30,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: skuBackground,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      product.sku,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colors.onSurfaceVariant,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildMobileUtilityStockBadge(
                    context,
                    remainingStock: remainingStock,
                  ),
                  const Spacer(),
                  Text(
                    texts.dealerPriceLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: colors.onSurfaceVariant,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    formatVnd(product.price),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: colors.primary,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: canAddToCart
                              ? () => _handleAddToCart(cart, product)
                              : null,
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(0, 42),
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: isDark ? 0 : null,
                            backgroundColor: isDark
                                ? colors.secondaryContainer.withValues(
                                    alpha: 0.82,
                                  )
                                : colors.primary,
                            foregroundColor: isDark
                                ? colors.onSecondaryContainer
                                : colors.onPrimary,
                          ),
                          child: isBusy
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.4,
                                  ),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                      Icons.add_shopping_cart_outlined,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Text(
                                        canAddToCart
                                            ? texts.addAction
                                            : texts.quickAddLabel(
                                                remainingStock: remainingStock,
                                              ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                      const SizedBox(width: 8),
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
                            minimumSize: const Size(42, 42),
                            padding: EdgeInsets.zero,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: isSyncingProduct
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.2,
                                  ),
                                )
                              : const Icon(Icons.tune_rounded, size: 18),
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

  Widget _buildMobileUtilityStockBadge(
    BuildContext context, {
    required int remainingStock,
  }) {
    final theme = Theme.of(context);
    late final String label;
    late final IconData icon;
    late final Color textColor;
    late final Color backgroundColor;

    if (remainingStock <= 0) {
      label = 'Out';
      icon = Icons.error_outline;
      textColor = const Color(0xFFD94939);
      backgroundColor = const Color(0xFFFFEBE9);
    } else if (remainingStock <= _lowStockThreshold) {
      label = 'Low $remainingStock';
      icon = Icons.schedule;
      textColor = const Color(0xFFB26A00);
      backgroundColor = const Color(0xFFFFF4DD);
    } else {
      label = '$remainingStock in';
      icon = Icons.check_circle_outline;
      textColor = const Color(0xFF127A34);
      backgroundColor = const Color(0xFFEAF7EE);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: textColor),
          const SizedBox(width: 3),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.labelSmall?.copyWith(
                color: textColor,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
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
                    height: 132,
                    borderRadius: BorderRadius.all(Radius.circular(16)),
                  ),
                  SizedBox(height: 10),
                  SkeletonBox(width: double.infinity, height: 18),
                  SizedBox(height: 4),
                  SkeletonBox(width: 52, height: 13),
                  SizedBox(height: 8),
                  SkeletonBox(width: 52, height: 22),
                  SizedBox(height: 10),
                  Divider(height: 1, thickness: 1),
                  SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: SkeletonBox(width: double.infinity, height: 20),
                      ),
                      SizedBox(width: 8),
                      SkeletonBox(width: 40, height: 40),
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
      : 'Không tìm thấy sản phẩm phù hợp bộ lọc.';
  String get emptyProductsMessage => isEnglish
      ? 'No products available to display.'
      : 'Chưa có sản phẩm để hiển thị.';
  String get discountAutoApplyMessage => isEnglish
      ? 'Volume discounts apply automatically when eligible'
      : 'Chiết khấu số lượng sẽ áp dụng tự động khi đủ điều kiện';
  String get sortTooltip => isEnglish ? 'Sort products' : 'Sắp xếp';
  String get loadProductsFailedTitle => isEnglish
      ? 'Unable to load the product catalog.'
      : 'Không tải được danh sách sản phẩm.';
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
  String get dealerPriceLabel => isEnglish ? 'Dealer price' : 'Gia dai ly';
  String resultsLabel(int count) =>
      isEnglish ? '$count results' : '$count ket qua';

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
      : 'Đã đạt mức chiết khấu hiện tại $percent%';

  String discountTargetProductMessage(
    int remaining,
    String productName,
    int percent,
  ) => isEnglish
      ? 'Buy $remaining more ${remaining == 1 ? 'item' : 'items'} of "$productName" to unlock $percent% discount'
      : 'Mua thêm $remaining sản phẩm "$productName" để đạt chiết khấu $percent%';

  String discountTargetMessage(int remaining, int percent) => isEnglish
      ? 'Buy $remaining more ${remaining == 1 ? 'item' : 'items'} to unlock $percent% discount'
      : 'Mua thêm $remaining sản phẩm để đạt chiết khấu $percent%';

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
