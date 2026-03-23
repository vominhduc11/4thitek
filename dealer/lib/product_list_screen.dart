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
import 'utils.dart';
import 'widgets/cart_icon_button.dart';
import 'widgets/notification_icon_button.dart';
import 'notifications_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/product_image.dart';
import 'widgets/skeleton_box.dart';
import 'widgets/stock_badge.dart';

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
  static const Duration _apiLatency = Duration(milliseconds: 400);

  late final PagingController<int, Product> _pagingController;
  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;
  Timer? _catalogRefreshDebounce;
  String _searchText = '';
  StockFilter _stockFilter = StockFilter.all;
  SortOption _sortOption = SortOption.none;
  ProductCatalogController? _productCatalog;
  final Set<String> _addingProductIds = <String>{};
  String? _catalogSnapshot;
  bool _isManuallyRefreshingCatalog = false;
  int _suppressedCatalogLoadCount = 0;
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
    final baseHorizontalPadding = isTablet ? 32.0 : 20.0;
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
    final baseHeight = isTablet ? 194.0 : 182.0;
    final additionalHeight = (textScale - 1) * 84;
    return baseHeight + additionalHeight;
  }

  Widget _buildResultsSliver(
    BuildContext context,
    CartController cart, {
    required bool isTablet,
  }) {
    final gridItemExtent = _tabletGridItemExtent(context);
    final delegate = PagedChildBuilderDelegate<Product>(
      itemBuilder: (context, product, index) {
        return _buildProductCard(
          context,
          product,
          index,
          cart,
          isTablet: isTablet,
          isGridLayout: isTablet,
        );
      },
      firstPageProgressIndicatorBuilder: (context) {
        return _buildFirstPageSkeleton(
          isGridLayout: isTablet,
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

    if (!isTablet) {
      return PagedSliverList<int, Product>(
        pagingController: _pagingController,
        builderDelegate: delegate,
      );
    }

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

  Future<void> _fetchPage(int pageKey) async {
    final requestRevision = _queryRevision;
    try {
      if (!_hasAnyFilters) {
        // Server-side pagination khi không có filter
        final pageIndex = pageKey ~/ _pageSize;
        final result = await _productCatalog?.fetchPage(pageIndex, _pageSize);
        if (!mounted || requestRevision != _queryRevision) return;
        if (result == null) {
          _pagingController.appendLastPage(const []);
          return;
        }
        final nextPageKey = (pageIndex + 1) * _pageSize;
        if (result.isLast) {
          _pagingController.appendLastPage(result.items);
        } else {
          _pagingController.appendPage(result.items, nextPageKey);
        }
      } else {
        // Client-side filter: load toàn bộ rồi lọc
        _suppressedCatalogLoadCount++;
        try {
          await _productCatalog?.load();
        } finally {
          _suppressedCatalogLoadCount = math.max(
            0,
            _suppressedCatalogLoadCount - 1,
          );
        }
        await Future.delayed(_apiLatency);
        if (!mounted || requestRevision != _queryRevision) return;

        final catalogError = _productCatalog?.errorMessage;
        if (catalogError != null) {
          _pagingController.error = catalogError;
          return;
        }

        final products = _applyFilters();
        final start = pageKey;
        final end = math.min(start + _pageSize, products.length);
        final newItems = start >= products.length
            ? const <Product>[]
            : products.sublist(start, end);
        final isLastPage = end >= products.length;
        if (isLastPage) {
          _pagingController.appendLastPage(newItems);
        } else {
          _pagingController.appendPage(newItems, end);
        }
      }
    } catch (error) {
      _pagingController.error = error;
    }
  }

  void _onSearchChanged() {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 320), () {
      final next = _searchController.text.trim();
      if (next == _searchText) {
        return;
      }
      setState(() => _searchText = next);
      _refreshProducts();
    });
  }

  void _setStockFilter(StockFilter filter) {
    if (filter == _stockFilter) {
      return;
    }
    setState(() => _stockFilter = filter);
    _refreshProducts();
  }

  void _setSortOption(SortOption option) {
    if (option == _sortOption) {
      return;
    }
    setState(() => _sortOption = option);
    _refreshProducts();
  }

  void _resetFilters() {
    setState(() {
      _stockFilter = StockFilter.all;
      _sortOption = SortOption.none;
      _searchText = '';
      _searchController.text = '';
    });
    _refreshProducts();
  }

  void _clearSearch() {
    if (_searchController.text.isEmpty && _searchText.isEmpty) {
      return;
    }
    setState(() {
      _searchText = '';
      _searchController.clear();
    });
    _refreshProducts();
  }

  List<Product> _applyFilters() {
    final catalogProducts = _productCatalog?.products ?? const <Product>[];
    final query = _searchText.toLowerCase();
    final filtered = catalogProducts.where((product) {
      if (query.isNotEmpty) {
        final name = product.name.toLowerCase();
        final sku = product.sku.toLowerCase();
        if (!name.contains(query) && !sku.contains(query)) {
          return false;
        }
      }

      switch (_stockFilter) {
        case StockFilter.inStock:
          return product.stock > 0;
        case StockFilter.lowStock:
          return product.stock > 0 && product.stock <= _lowStockThreshold;
        case StockFilter.outOfStock:
          return product.stock == 0;
        case StockFilter.all:
          return true;
      }
    }).toList();

    switch (_sortOption) {
      case SortOption.priceAsc:
        filtered.sort((a, b) => a.price.compareTo(b.price));
        break;
      case SortOption.priceDesc:
        filtered.sort((a, b) => b.price.compareTo(a.price));
        break;
      case SortOption.nameAsc:
        filtered.sort((a, b) => a.name.compareTo(b.name));
        break;
      case SortOption.nameDesc:
        filtered.sort((a, b) => b.name.compareTo(a.name));
        break;
      case SortOption.none:
        break;
    }

    return filtered;
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

  Widget _buildStockChip(
    BuildContext context,
    StockFilter filter,
    String label,
  ) {
    final isSelected = _stockFilter == filter;
    final colors = Theme.of(context).colorScheme;

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
          selectedColor: colors.primary.withValues(alpha: 0.15),
          labelStyle: TextStyle(
            color: isSelected ? colors.primary : colors.onSurface,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
            side: BorderSide(
              color: isSelected ? colors.primary : colors.outlineVariant,
            ),
          ),
          backgroundColor: colors.surface,
          visualDensity: VisualDensity.compact,
          materialTapTargetSize: MaterialTapTargetSize.padded,
        ),
      ),
    );
  }

  Widget _buildSortMenu(BuildContext context) {
    final texts = _productListTexts(context);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final label = switch (_sortOption) {
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
        constraints: const BoxConstraints(minHeight: 48),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: ShapeDecoration(
          color: colors.surface,
          shape: StadiumBorder(
            side: BorderSide(
              color: colors.outlineVariant.withValues(alpha: 0.8),
            ),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.swap_vert, size: 18, color: colors.onSurface),
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
      return GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: 4,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          mainAxisExtent: gridItemExtent,
        ),
        itemBuilder: (context, index) =>
            const _ProductCardSkeleton(isGridLayout: true),
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final imageSize = isTablet ? 80.0 : 64.0;
    final gridImageHeight = isTablet ? 132.0 : 112.0;
    final cardPadding = isTablet ? (isGridLayout ? 16.0 : 18.0) : 14.0;
    final addButtonLabel = texts.quickAddLabel(remainingStock: remainingStock);

    final useCompactQuickAdd = isGridLayout && canAddToCart;
    final productSemanticsLabel = texts.productSemanticsLabel(
      product,
      remainingStock,
    );

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

  int get _activeFilterCount {
    var count = 0;
    if (_searchText.isNotEmpty) count++;
    if (_stockFilter != StockFilter.all) count++;
    if (_sortOption != SortOption.none) count++;
    return count;
  }

  bool get _hasAnyFilters =>
      _searchText.isNotEmpty ||
      _stockFilter != StockFilter.all ||
      _sortOption != SortOption.none;

  void _handleCatalogChanged() {
    final catalog = _productCatalog;
    if (!mounted ||
        catalog == null ||
        catalog.isLoading ||
        _isManuallyRefreshingCatalog ||
        _suppressedCatalogLoadCount > 0) {
      return;
    }
    final nextSnapshot = _catalogSummarySnapshot(catalog);
    if (_catalogSnapshot == nextSnapshot) {
      return;
    }
    _catalogSnapshot = nextSnapshot;
    _catalogRefreshDebounce?.cancel();
    _catalogRefreshDebounce = Timer(const Duration(milliseconds: 120), () {
      if (!mounted) {
        return;
      }
      _refreshProducts();
    });
  }

  Future<void> _refreshCatalog() async {
    _isManuallyRefreshingCatalog = true;
    try {
      _catalogRefreshDebounce?.cancel();
      await _productCatalog?.load(forceRefresh: true);
      final catalog = _productCatalog;
      if (catalog != null) {
        _catalogSnapshot = _catalogSummarySnapshot(catalog);
      }
      if (!mounted) {
        return;
      }
      _refreshProducts();
    } finally {
      _isManuallyRefreshingCatalog = false;
    }
  }

  void _retryLoadProducts() {
    unawaited(_refreshCatalog());
  }

  void _refreshProducts() {
    _queryRevision++;
    _pagingController.refresh();
  }

  String _catalogSummarySnapshot(ProductCatalogController catalog) {
    return Object.hash(
      catalog.errorMessage,
      catalog.products.length,
      Object.hashAll(
        catalog.products.map(
          (product) => Object.hash(
            product.id,
            product.name,
            product.sku,
            product.shortDescription,
            product.price,
            product.stock,
            product.warrantyMonths,
            product.imageUrl,
          ),
        ),
      ),
    ).toString();
  }

  Future<Product> _resolveLatestProductSnapshot(Product baseProduct) async {
    final catalog = _productCatalog ?? ProductCatalogScope.maybeOf(context);
    if (catalog == null) {
      return baseProduct;
    }
    try {
      return await catalog.fetchDetail(baseProduct.id);
    } catch (_) {
      return catalog.findById(baseProduct.id) ?? baseProduct;
    }
  }

  Future<void> _handleAddToCart(
    CartController cart,
    Product product, {
    bool openQuantityDialog = false,
  }) async {
    if (_addingProductIds.contains(product.id) ||
        cart.isSyncingProduct(product.id)) {
      return;
    }
    setState(() => _addingProductIds.add(product.id));
    try {
      final latestProduct = await _resolveLatestProductSnapshot(product);
      if (!mounted) {
        return;
      }

      final remainingStock = cart.remainingStockFor(latestProduct);
      if (remainingStock <= 0) {
        _showCartLimitSnackBar();
        return;
      }

      final quickQuantity = cart.suggestedAddQuantity(latestProduct);
      if (quickQuantity <= 0) {
        _showCartLimitSnackBar();
        return;
      }

      final addQuantity = openQuantityDialog
          ? await _promptQuantity(
              latestProduct,
              remainingStock,
              initialQuantity: quickQuantity,
            )
          : quickQuantity;

      if (!mounted) {
        return;
      }
      if (addQuantity == null) {
        return;
      }
      if (!cart.canAdd(latestProduct, quantity: addQuantity)) {
        _showCartLimitSnackBar();
        return;
      }

      final didAdd = await cart.addWithApiSimulation(
        latestProduct,
        quantity: addQuantity,
      );
      if (!mounted) {
        return;
      }
      if (!didAdd) {
        _showCartLimitSnackBar();
        return;
      }
      HapticFeedback.lightImpact();
      _showAddedToCartSnackBar(addQuantity);
    } finally {
      if (mounted) {
        setState(() => _addingProductIds.remove(product.id));
      }
    }
  }

  void _showAddedToCartSnackBar(int quantity) {
    if (!mounted) {
      return;
    }
    final texts = _productListTexts(context);
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        content: Text(texts.addedToCartMessage(quantity)),
        action: SnackBarAction(
          label: texts.backToCartAction,
          onPressed: () {
            Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => const CartScreen()));
          },
        ),
      ),
    );
  }

  void _showCartLimitSnackBar() {
    if (!mounted) {
      return;
    }
    final texts = _productListTexts(context);
    final message = texts.isEnglish
        ? 'Product is out of stock or the cart limit has been reached.'
        : 'San pham da het hang hoac da dat gioi han trong gio.';
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        content: Text(message),
      ),
    );
  }

  Future<int?> _promptQuantity(
    Product product,
    int maxQuantity, {
    required int initialQuantity,
  }) {
    final texts = _productListTexts(context);
    final minQty = 1;
    final safeInitial = initialQuantity.clamp(minQty, maxQuantity);
    var selected = safeInitial <= maxQuantity ? safeInitial : maxQuantity;
    return showDialog<int>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(texts.chooseQuantityDialogTitle),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(product.name, maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 12),
              SpinBox(
                min: minQty.toDouble(),
                max: maxQuantity.toDouble(),
                value: selected.toDouble(),
                step: 1,
                decimals: 0,
                autofocus: true,
                onChanged: (val) =>
                    selected = val.round().clamp(minQty, maxQuantity),
              ),
              const SizedBox(height: 8),
              Text(
                texts.quantityRangeLabel(minQty, maxQuantity),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(texts.cancelAction),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(dialogContext).pop(selected),
              child: Text(texts.addAction),
            ),
          ],
        );
      },
    );
  }
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
                  SkeletonBox(width: 130, height: 13),
                  SizedBox(height: 8),
                  SkeletonBox(width: 96, height: 22),
                  SizedBox(height: 10),
                  Divider(height: 1, thickness: 1),
                  SizedBox(height: 10),
                  Row(
                    children: [
                      SkeletonBox(width: 96, height: 20),
                      Spacer(),
                      SkeletonBox(width: 112, height: 40),
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

enum StockFilter { all, inStock, lowStock, outOfStock }

enum SortOption { none, priceAsc, priceDesc, nameAsc, nameDesc }

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
