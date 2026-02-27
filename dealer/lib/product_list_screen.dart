import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_spinbox/flutter_spinbox.dart';
import 'package:infinite_scroll_pagination/infinite_scroll_pagination.dart';

import 'cart_controller.dart';
import 'cart_screen.dart';
import 'mock_data.dart';
import 'models.dart';
import 'product_detail_screen.dart';
import 'utils.dart';
import 'widgets/cart_icon_button.dart';
import 'notifications_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/product_image.dart';
import 'widgets/skeleton_box.dart';

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  static const int _pageSize = 10;
  static const int _lowStockThreshold = 10;
  static const double _tabletBreakpoint = 760;
  static const double _stickyFilterBarHeight = 74;
  static const Duration _apiLatency = Duration(milliseconds: 900);

  late final PagingController<int, Product> _pagingController;
  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;
  String _searchText = '';
  StockFilter _stockFilter = StockFilter.all;
  SortOption _sortOption = SortOption.none;
  final List<Product> _catalogProducts = mockProducts
      .where((product) => product.category == ProductCategory.headset)
      .toList(growable: false);
  late final double _minPrice;
  late final double _maxPrice;
  late RangeValues _priceRange;
  final Set<int> _warrantyFilters = {};
  final Set<String> _addingProductIds = <String>{};
  int _queryRevision = 0;

  @override
  void initState() {
    super.initState();
    final prices = _catalogProducts.map((product) => product.price).toList();
    if (prices.isEmpty) {
      _minPrice = 0;
      _maxPrice = 0;
      _priceRange = const RangeValues(0, 0);
    } else {
      _minPrice = prices.reduce(math.min).toDouble();
      _maxPrice = prices.reduce(math.max).toDouble();
      _priceRange = RangeValues(_minPrice, _maxPrice);
    }

    _pagingController = PagingController(firstPageKey: 0);
    _pagingController.addPageRequestListener(_fetchPage);
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    _pagingController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = CartScope.of(context);
    final width = MediaQuery.sizeOf(context).width;
    final isTablet = width >= _tabletBreakpoint;
    final horizontalPadding = isTablet ? 28.0 : 20.0;
    final stickyBarHeight = isTablet ? 82.0 : _stickyFilterBarHeight;

    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Sản phẩm'),
        actions: [
          IconButton(
            tooltip: 'Thông báo',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
            icon: const Icon(Icons.notifications_outlined),
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
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                horizontalPadding,
                12,
                horizontalPadding,
                10,
              ),
              child: _buildHeaderTop(context, isTablet: isTablet),
            ),
          ),
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
                child: _buildStickyFilterBar(context, isTablet: isTablet),
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
            sliver: PagedSliverList<int, Product>(
              pagingController: _pagingController,
              builderDelegate: PagedChildBuilderDelegate<Product>(
                itemBuilder: (context, product, index) {
                  return _buildProductCard(
                    context,
                    product,
                    index,
                    cart,
                    isTablet: isTablet,
                  );
                },
                firstPageProgressIndicatorBuilder: (context) {
                  return _buildFirstPageSkeleton();
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
                  final message = _hasAnyFilters
                      ? 'Không tìm thấy sản phẩm phù hợp bộ lọc.'
                      : 'Chưa có sản phẩm để hiển thị.';
                  return FadeSlideIn(
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 32,
                          vertical: 32,
                        ),
                        child: Text(
                          message,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: Colors.black54),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _fetchPage(int pageKey) async {
    final requestRevision = _queryRevision;
    try {
      await Future.delayed(_apiLatency);
      if (!mounted || requestRevision != _queryRevision) {
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
      _priceRange = RangeValues(_minPrice, _maxPrice);
      _warrantyFilters.clear();
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
    final query = _searchText.toLowerCase();
    final filtered = _catalogProducts
        .where((product) {
          if (query.isNotEmpty) {
            final name = product.name.toLowerCase();
            final sku = product.sku.toLowerCase();
            if (!name.contains(query) && !sku.contains(query)) {
              return false;
            }
          }

          switch (_stockFilter) {
            case StockFilter.inStock:
              return product.stock > _lowStockThreshold;
            case StockFilter.lowStock:
              return product.stock > 0 && product.stock <= _lowStockThreshold;
            case StockFilter.outOfStock:
              return product.stock == 0;
            case StockFilter.all:
              return true;
          }
        })
        .where((product) {
          final price = product.price.toDouble();
          if (price < _priceRange.start || price > _priceRange.end) {
            return false;
          }
          if (_warrantyFilters.isNotEmpty &&
              !_warrantyFilters.contains(product.warrantyMonths)) {
            return false;
          }
          return true;
        })
        .toList();

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
      case SortOption.none:
        break;
    }

    return filtered;
  }

  Widget _buildHeaderTop(BuildContext context, {required bool isTablet}) {
    return ValueListenableBuilder<PagingState<int, Product>>(
      valueListenable: _pagingController,
      builder: (context, state, _) {
        final total = _catalogProducts.length;
        final filteredTotal = _applyFilters().length;
        final loaded = math.min(state.itemList?.length ?? 0, filteredTotal);
        final theme = Theme.of(context);

        return FadeSlideIn(
          child: Container(
            padding: EdgeInsets.all(isTablet ? 20 : 16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Colors.white, Color(0xFFF8FAFF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE5EAF5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Danh mục sản phẩm',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Tìm nhanh theo tên hoặc SKU',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: isTablet ? 14 : 10),
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: isTablet ? 12 : 10,
                        vertical: isTablet ? 10 : 8,
                      ),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '$filteredTotal',
                            style: theme.textTheme.titleSmall?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            'kết quả',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: isTablet ? 12 : 10),
                Text(
                  'Đang hiển thị: $loaded / $total',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.black54,
                  ),
                ),
                SizedBox(height: isTablet ? 14 : 12),
                TextField(
                  controller: _searchController,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: 'Tìm theo tên hoặc SKU',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isEmpty
                        ? null
                        : IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: _clearSearch,
                          ),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFFE0E6F2)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFFE0E6F2)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(
                        color: theme.colorScheme.primary,
                        width: 1.5,
                      ),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                ),
                if (_hasAdvancedFilters) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 9,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF4F7FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E9FA)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.tune, size: 16, color: Colors.black54),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _buildAdvancedSummary(),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.black87,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStickyFilterBar(BuildContext context, {required bool isTablet}) {
    final hasActiveFilters = _hasAnyFilters;
    final activeCount = _activeFilterCount;
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5EAF5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.fromLTRB(
          10,
          isTablet ? 8 : 6,
          10,
          isTablet ? 8 : 6,
        ),
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
          _buildStockChip(context, StockFilter.all, 'Tất cả'),
          const SizedBox(width: 8),
          _buildStockChip(context, StockFilter.inStock, 'Còn hàng'),
          const SizedBox(width: 8),
          _buildStockChip(context, StockFilter.lowStock, 'Sắp hết'),
          const SizedBox(width: 8),
          _buildStockChip(context, StockFilter.outOfStock, 'Hết hàng'),
          const SizedBox(width: 8),
          _buildSortMenu(context),
          const SizedBox(width: 8),
          _buildAdvancedFilterButton(context),
          if (hasActiveFilters) ...[
            const SizedBox(width: 8),
            TextButton.icon(
              onPressed: _resetFilters,
              icon: const Icon(Icons.close_rounded, size: 16),
              label: Text('Xóa lọc ($activeCount)'),
            ),
          ],
          const SizedBox(width: 2),
        ],
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

    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => _setStockFilter(filter),
      selectedColor: colors.primary.withValues(alpha: 0.15),
      labelStyle: TextStyle(
        color: isSelected ? colors.primary : Colors.black87,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(999),
        side: BorderSide(
          color: isSelected ? colors.primary : const Color(0xFFE0E5F2),
        ),
      ),
      backgroundColor: Colors.white,
      visualDensity: VisualDensity.compact,
    );
  }

  Widget _buildSortMenu(BuildContext context) {
    final label = switch (_sortOption) {
      SortOption.priceAsc => 'Giá thấp -> cao',
      SortOption.priceDesc => 'Giá cao -> thấp',
      SortOption.nameAsc => 'Tên A -> Z',
      SortOption.none => 'Sắp xếp',
    };

    return PopupMenuButton<SortOption>(
      onSelected: _setSortOption,
      itemBuilder: (context) => const [
        PopupMenuItem(value: SortOption.none, child: Text('Mặc định')),
        PopupMenuItem(
          value: SortOption.priceAsc,
          child: Text('Giá thấp -> cao'),
        ),
        PopupMenuItem(
          value: SortOption.priceDesc,
          child: Text('Giá cao -> thấp'),
        ),
        PopupMenuItem(value: SortOption.nameAsc, child: Text('Tên A -> Z')),
      ],
      child: IgnorePointer(
        child: OutlinedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.swap_vert),
          label: Text(label),
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.black87,
            minimumSize: const Size(0, 40),
          ),
        ),
      ),
    );
  }

  Widget _buildAdvancedFilterButton(BuildContext context) {
    final activeCount = _activeFilterCount;
    return OutlinedButton.icon(
      onPressed: _openAdvancedFilters,
      icon: const Icon(Icons.tune),
      label: Text(
        activeCount > 0 ? 'Lọc nâng cao ($activeCount)' : 'Lọc nâng cao',
      ),
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.black87,
        minimumSize: const Size(0, 40),
      ),
    );
  }

  Widget _buildErrorIndicator(
    BuildContext context, {
    bool isFirstPage = false,
  }) {
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
            color: Colors.black45,
            size: isFirstPage ? 48 : 36,
          ),
          const SizedBox(height: 12),
          Text(
            'Không tải được danh sách sản phẩm.',
            style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'Vui lòng kiểm tra kết nối và thử lại.',
            style: textTheme.bodySmall?.copyWith(color: Colors.black54),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: _pagingController.retryLastFailedRequest,
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildFirstPageSkeleton() {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        children: List.generate(
          5,
          (index) => const Padding(
            padding: EdgeInsets.only(bottom: 12),
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
  }) {
    final delay = Duration(milliseconds: 30 * (index % _pageSize));
    final isAddingToCart = _addingProductIds.contains(product.id);
    final remainingStock = cart.remainingStockFor(product);
    final suggestedAddQuantity = cart.suggestedAddQuantity(product);
    final canAddToCart = suggestedAddQuantity > 0 && !isAddingToCart;
    final theme = Theme.of(context);
    final imageSize = isTablet ? 68.0 : 56.0;
    final cardPadding = isTablet ? 18.0 : 16.0;
    final addButtonLabel = !product.isOrderable
        ? 'Ngưng bán'
        : remainingStock <= 0
        ? 'Hết hàng'
        : 'Thêm vào giỏ';

    return FadeSlideIn(
      key: ValueKey(product.id),
      delay: delay,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: const BorderSide(color: Color(0xFFE5EAF5)),
          ),
          child: Padding(
            padding: EdgeInsets.all(cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Hero(
                      tag: 'product-image-${product.id}',
                      child: ProductImage(
                        product: product,
                        width: imageSize,
                        height: imageSize,
                        borderRadius: BorderRadius.circular(14),
                        iconSize: isTablet ? 28 : 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
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
                            'SKU: ${product.sku}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: Colors.black54,
                            ),
                          ),
                          const SizedBox(height: 6),
                          _StockBadge(remainingStock: remainingStock),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF4F7FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E9FA)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Giá',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: Colors.black54,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            formatVnd(product.price),
                            style: theme.textTheme.titleSmall?.copyWith(
                              color: theme.colorScheme.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  product.description,
                  maxLines: isTablet ? 3 : 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.black54,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _MetaPill(
                      icon: Icons.verified_outlined,
                      label: 'BH ${product.warrantyMonths} tháng',
                    ),
                    _MetaPill(
                      icon: Icons.inventory_2_outlined,
                      label: 'Còn lại: $remainingStock',
                    ),
                    _MetaPill(
                      icon: Icons.edit_note_outlined,
                      label: 'SL linh hoat',
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) =>
                                ProductDetailScreen(product: product),
                          ),
                        );
                      },
                      icon: const Icon(Icons.info_outline, size: 18),
                      label: const Text('Chi tiết'),
                    ),
                    const Spacer(),
                    ElevatedButton(
                      onPressed: canAddToCart
                          ? () => _handleAddToCart(cart, product)
                          : null,
                      child: isAddingToCart
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.4,
                              ),
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
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openAdvancedFilters() {
    final initialRange = _priceRange;
    final initialWarranty = Set<int>.from(_warrantyFilters);
    final warrantyOptions =
        _catalogProducts
            .map((product) => product.warrantyMonths)
            .toSet()
            .toList()
          ..sort();
    final priceRangeEnabled = _minPrice < _maxPrice;
    final divisions = priceRangeEnabled ? 10 : null;
    RangeValues tempRange = initialRange;
    final tempWarranty = <int>{...initialWarranty};

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return SafeArea(
              child: Padding(
                padding: EdgeInsets.fromLTRB(
                  20,
                  16,
                  20,
                  20 + MediaQuery.of(context).viewInsets.bottom,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Bộ lọc nâng cao',
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(),
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Khoảng giá',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${formatVnd(tempRange.start.round())} - ${formatVnd(tempRange.end.round())}',
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                      ),
                      if (priceRangeEnabled)
                        RangeSlider(
                          min: _minPrice,
                          max: _maxPrice,
                          divisions: divisions,
                          values: tempRange,
                          labels: RangeLabels(
                            formatVnd(tempRange.start.round()),
                            formatVnd(tempRange.end.round()),
                          ),
                          onChanged: (values) {
                            setModalState(() => tempRange = values);
                          },
                        )
                      else
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: Text('Không có dữ liệu giá để lọc.'),
                        ),
                      const SizedBox(height: 12),
                      Text(
                        'Bảo hành (tháng)',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      if (warrantyOptions.isEmpty)
                        const Text('Không có dữ liệu bảo hành.')
                      else
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: warrantyOptions.map((months) {
                            final isSelected = tempWarranty.contains(months);
                            return FilterChip(
                              label: Text('$months tháng'),
                              selected: isSelected,
                              onSelected: (selected) {
                                setModalState(() {
                                  if (selected) {
                                    tempWarranty.add(months);
                                  } else {
                                    tempWarranty.remove(months);
                                  }
                                });
                              },
                              selectedColor: Theme.of(
                                context,
                              ).colorScheme.primary.withValues(alpha: 0.15),
                              materialTapTargetSize:
                                  MaterialTapTargetSize.padded,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 8,
                              ),
                              labelStyle: TextStyle(
                                color: isSelected
                                    ? Theme.of(context).colorScheme.primary
                                    : Colors.black87,
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.w400,
                              ),
                            );
                          }).toList(),
                        ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          TextButton(
                            onPressed: () {
                              setModalState(() {
                                tempRange = RangeValues(_minPrice, _maxPrice);
                                tempWarranty.clear();
                              });
                            },
                            style: TextButton.styleFrom(
                              minimumSize: const Size(92, 44),
                            ),
                            child: const Text('Đặt lại'),
                          ),
                          const Spacer(),
                          ElevatedButton(
                            onPressed: () {
                              setState(() {
                                _priceRange = tempRange;
                                _warrantyFilters
                                  ..clear()
                                  ..addAll(tempWarranty);
                              });
                              _refreshProducts();
                              Navigator.of(context).pop();
                            },
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size(92, 44),
                            ),
                            child: const Text('Áp dụng'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  bool get _hasPriceFilter =>
      _priceRange.start > _minPrice || _priceRange.end < _maxPrice;

  bool get _hasWarrantyFilter => _warrantyFilters.isNotEmpty;

  bool get _hasAdvancedFilters => _hasPriceFilter || _hasWarrantyFilter;

  int get _activeFilterCount {
    var count = 0;
    if (_searchText.isNotEmpty) {
      count++;
    }
    if (_stockFilter != StockFilter.all) {
      count++;
    }
    if (_sortOption != SortOption.none) {
      count++;
    }
    if (_hasPriceFilter) {
      count++;
    }
    if (_hasWarrantyFilter) {
      count++;
    }
    return count;
  }

  bool get _hasAnyFilters =>
      _searchText.isNotEmpty ||
      _stockFilter != StockFilter.all ||
      _sortOption != SortOption.none ||
      _hasAdvancedFilters;

  String _buildAdvancedSummary() {
    final parts = <String>[];
    if (_hasPriceFilter) {
      parts.add(
        'Giá: ${formatVnd(_priceRange.start.round())} - ${formatVnd(_priceRange.end.round())}',
      );
    }
    if (_hasWarrantyFilter) {
      final values = _warrantyFilters.toList()..sort();
      parts.add('Bảo hành: ${values.join(', ')} tháng');
    }
    return parts.join(' | ');
  }

  void _refreshProducts() {
    _queryRevision++;
    _pagingController.refresh();
  }

  Future<void> _handleAddToCart(CartController cart, Product product) async {
    if (_addingProductIds.contains(product.id)) {
      return;
    }
    final remainingStock = cart.remainingStockFor(product);
    if (!product.isOrderable || remainingStock <= 0) {
      _showSnack(
        product.isOrderable
            ? 'Sản phẩm đã hết hàng hoặc đã đạt giới hạn trong giỏ'
            : 'Sản phẩm tạm ngưng phân phối',
      );
      return;
    }
    final addQuantity = await _promptQuantity(product, remainingStock);
    if (!mounted) {
      return;
    }
    if (addQuantity == null) {
      return;
    }
    if (!cart.canAdd(product, quantity: addQuantity)) {
      _showSnack('Sản phẩm đã đạt giới hạn tồn kho');
      return;
    }

    setState(() => _addingProductIds.add(product.id));
    try {
      final didAdd = await cart.addWithApiSimulation(
        product,
        quantity: addQuantity,
      );
      if (!mounted) {
        return;
      }
      if (!didAdd) {
        _showSnack('Sản phẩm đã đạt giới hạn tồn kho');
        return;
      }

      final messenger = ScaffoldMessenger.of(context);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text(
              'Đã thêm ${product.name} (x$addQuantity) vào giỏ hàng',
            ),
            action: SnackBarAction(
              label: 'Xem giỏ',
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const CartScreen()),
                );
              },
            ),
          ),
        );
    } finally {
      if (mounted) {
        setState(() => _addingProductIds.remove(product.id));
      }
    }
  }

  Future<int?> _promptQuantity(Product product, int maxQuantity) {
    final minQty = product.effectiveMinOrderQty;
    var selected = minQty <= maxQuantity ? minQty : maxQuantity;
    return showDialog<int>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Chọn số lượng'),
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
                'Tối thiểu: $minQty • Tối đa: $maxQuantity',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: Colors.black54),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(dialogContext).pop(selected),
              child: const Text('Thêm'),
            ),
          ],
        );
      },
    );
  }

  Future<int?> _showAddQuantityDialog({
    required String productName,
    required int maxQuantity,
  }) async {
    var selectedQuantity = 1;
    return showDialog<int>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Chọn số lượng'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    productName,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Text('Tối đa: $maxQuantity'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      IconButton(
                        onPressed: selectedQuantity > 1
                            ? () {
                                setDialogState(() {
                                  selectedQuantity -= 1;
                                });
                              }
                            : null,
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Expanded(
                        child: Text(
                          '$selectedQuantity',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                      IconButton(
                        onPressed: selectedQuantity < maxQuantity
                            ? () {
                                setDialogState(() {
                                  selectedQuantity += 1;
                                });
                              }
                            : null,
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                    ],
                  ),
                  if (selectedQuantity == maxQuantity)
                    Text(
                      'Đã đạt tối đa theo tồn kho.',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                    ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Hủy'),
                ),
                ElevatedButton(
                  onPressed: () =>
                      Navigator.of(dialogContext).pop(selectedQuantity),
                  child: const Text('Thêm'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showSnack(String message) {
    final messenger = ScaffoldMessenger.of(context);
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(behavior: SnackBarBehavior.floating, content: Text(message)),
      );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFF),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE5EAF5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: Colors.black54),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
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
    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      decoration: BoxDecoration(
        boxShadow: overlapsContent
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: child,
    );
  }

  @override
  bool shouldRebuild(covariant _PinnedHeaderDelegate oldDelegate) {
    return oldDelegate.child != child ||
        oldDelegate.minExtent != minExtent ||
        oldDelegate.maxExtent != maxExtent;
  }
}

class _StockBadge extends StatelessWidget {
  const _StockBadge({required this.remainingStock});

  final int remainingStock;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall;
    late final String label;
    late final Color textColor;
    late final Color background;

    if (remainingStock <= 0) {
      label = 'Hết hàng';
      textColor = const Color(0xFFD94939);
      background = const Color(0xFFFFEBE9);
    } else if (remainingStock <= 10) {
      label = 'Sắp hết ($remainingStock)';
      textColor = const Color(0xFFB26A00);
      background = const Color(0xFFFFF4DD);
    } else {
      label = 'Còn hàng';
      textColor = const Color(0xFF127A34);
      background = const Color(0xFFEAF7EE);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            remainingStock <= 0
                ? Icons.error_outline
                : remainingStock <= 10
                ? Icons.schedule
                : Icons.check_circle_outline,
            size: 14,
            color: textColor,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: style?.copyWith(
              color: textColor,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductCardSkeleton extends StatelessWidget {
  const _ProductCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
      ),
      child: const Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(
                  width: 56,
                  height: 56,
                  borderRadius: BorderRadius.all(Radius.circular(14)),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SkeletonBox(width: 160, height: 18),
                      SizedBox(height: 6),
                      SkeletonBox(width: 100, height: 14),
                      SizedBox(height: 8),
                      SkeletonBox(width: 92, height: 20),
                    ],
                  ),
                ),
                SizedBox(width: 8),
                SkeletonBox(width: 90, height: 20),
              ],
            ),
            SizedBox(height: 12),
            SkeletonBox(width: double.infinity, height: 14),
            SizedBox(height: 8),
            SkeletonBox(width: 280, height: 14),
            SizedBox(height: 14),
            Row(
              children: [
                SkeletonBox(width: 94, height: 40),
                Spacer(),
                SkeletonBox(width: 120, height: 40),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

enum StockFilter { all, inStock, lowStock, outOfStock }

enum SortOption { none, priceAsc, priceDesc, nameAsc }
