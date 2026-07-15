part of 'product_list_screen.dart';

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
  String get outOfStockAction => isEnglish ? 'Out of stock' : 'Hết hàng';
  String get unavailableAction => isEnglish ? 'Unavailable' : 'Không thể thêm';
  String get dealerPriceLabel => isEnglish ? 'Dealer price' : 'Giá đại lý';
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
      return outOfStockAction;
    }
    return isEnglish ? 'Quick add' : 'Thêm nhanh';
  }

  String get chooseQuantityAction =>
      isEnglish ? 'Choose quantity' : 'Chọn số lượng';

  String addQuantityAction(int quantity) => isEnglish
      ? 'Add $quantity ${quantity == 1 ? 'item' : 'items'}'
      : 'Thêm $quantity sản phẩm';

  String maxQuantityChipLabel(int quantity) =>
      isEnglish ? 'Max $quantity' : 'Tối đa $quantity';

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
  if (items.isEmpty) {
    return null;
  }
  CartItem? bestMatch;
  for (final item in items) {
    if (bestMatch == null || item.quantity > bestMatch.quantity) {
      bestMatch = item;
    }
  }
  final name = bestMatch?.product.name.trim();
  if (name == null || name.isEmpty) {
    return null;
  }
  return name;
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
