part of 'inventory_screen.dart';

class _InventoryTexts {
  const _InventoryTexts({required this.isEnglish});

  final bool isEnglish;

  String get heroTitle => isEnglish
      ? 'Manage dealer stock with reliable sync and faster outbound handling.'
      : 'Theo dõi serial sẵn sàng và xử lý xuất kho nhanh hơn.';
  String get liveSyncLabel =>
      isEnglish ? 'Live dealer sync' : 'Đồng bộ trực tiếp';
  String get syncAttentionLabel =>
      isEnglish ? 'Needs attention' : 'Cần kiểm tra';
  String get controlPanelLabel =>
      isEnglish ? 'Search, filter, and sort' : 'Tìm kiếm và tinh chỉnh';
  String inventoryResultsSummary(int filteredCount, int totalCount) => isEnglish
      ? '$filteredCount of $totalCount tracked SKUs visible'
      : 'Hiển thị $filteredCount / $totalCount SKU đang theo dõi';
  String get catalogSectionTitle =>
      isEnglish ? 'Tracked inventory' : 'Danh sách SKU';
  String catalogSectionSubtitle(int filteredCount) => isEnglish
      ? '$filteredCount products match the current view'
      : '$filteredCount sản phẩm khớp bộ lọc hiện tại';
  String lowStockHighlight(int count) =>
      isEnglish ? '$count low-stock SKUs' : '$count SKU sắp hết';
  String lowStockWarningTitle(int count) => isEnglish
      ? '$count product${count == 1 ? '' : 's'} need restocking'
      : '$count sản phẩm cần nhập thêm hàng';
  String get lowStockWarningAction => isEnglish ? 'View all' : 'Xem danh sách';
  String get outOfStockWarningTitle => isEnglish
      ? 'Some products are out of stock'
      : 'Một số sản phẩm đã hết hàng';

  String inventorySourceSummary(String? warrantySyncAt) {
    if (isEnglish) {
      if (warrantySyncAt != null) {
        return 'Inventory is calculated from your product serials. Last sync: $warrantySyncAt.';
      }
      return 'Inventory is calculated automatically from your product serials.';
    }
    if (warrantySyncAt != null) {
      return 'Tồn kho được tính từ serial sản phẩm của bạn. Đồng bộ lần cuối: $warrantySyncAt.';
    }
    return 'Tồn kho được tính tự động từ serial sản phẩm của bạn.';
  }

  String get screenTitle => isEnglish ? 'Inventory' : 'Kho';
  String get searchSemantic => isEnglish
      ? 'Search products by name, SKU, or order code'
      : 'Tìm kiếm theo tên sản phẩm, SKU hoặc mã đơn';
  String get searchHint => isEnglish
      ? 'Search by product name, SKU, or order code'
      : 'Tìm theo tên sản phẩm, SKU hoặc mã đơn';
  String get clearSearchTooltip => isEnglish ? 'Clear search' : 'Xóa tìm kiếm';
  String sortLabel(InventorySortOption option) {
    switch (option) {
      case InventorySortOption.name:
        return isEnglish ? 'Sort: Name' : 'Sắp xếp: Tên';
      case InventorySortOption.quantity:
        return isEnglish ? 'Sort: Ready stock' : 'Sắp xếp: Sẵn sàng';
      case InventorySortOption.importedDate:
        return isEnglish ? 'Sort: Imported date' : 'Sắp xếp: Ngày nhập';
    }
  }

  String get totalProductsLabel =>
      isEnglish ? 'Total products' : 'Tổng sản phẩm';
  String get totalProductsHelperText =>
      isEnglish ? 'Tracked SKUs' : 'SKU đang theo dõi';
  String get totalInventoryLabel =>
      isEnglish ? 'Ready to sell' : 'Sẵn sàng bán';
  String get totalInventoryHelperText =>
      isEnglish ? 'Sellable serials' : 'Serial có thể bán ngay';
  String get lowStockSummaryLabel => isEnglish ? 'Low stock' : 'Sắp hết hàng';
  String get lowStockSummaryHelperText =>
      isEnglish ? 'Needs replenishment soon' : 'Cần nhập thêm sớm';
  String get filterAllLabel => isEnglish ? 'All' : 'Tất cả';
  String get filterInStockLabel => isEnglish ? 'Ready to sell' : 'Sẵn sàng bán';
  String get filterLowStockLabel => isEnglish ? 'Low stock' : 'Sắp hết';
  String get filterOutOfStockLabel => isEnglish ? 'Out of stock' : 'Hết hàng';
  String get sortByNameOption => isEnglish ? 'By name' : 'Theo tên';
  String get sortByQuantityOption =>
      isEnglish ? 'By ready-to-sell quantity' : 'Theo số lượng sẵn sàng bán';
  String get sortByImportedDateOption =>
      isEnglish ? 'By imported date' : 'Theo ngày nhập';
  String get openSortMenuSemantic =>
      isEnglish ? 'Open sort menu' : 'Mở bộ lọc sắp xếp';
  String get sortTooltip => isEnglish ? 'Sort' : 'Sắp xếp';
  String sortDirectionLabel(bool ascending) => ascending
      ? (isEnglish ? 'Ascending' : 'Tăng dần')
      : (isEnglish ? 'Descending' : 'Giảm dần');
  String sortDirectionSemantic(String label) => isEnglish
      ? 'Change sort direction, currently $label'
      : 'Đổi chiều sắp xếp, hiện tại $label';
  String sortDirectionTooltip(String label) => isEnglish
      ? 'Change sort direction ($label)'
      : 'Đổi chiều sắp xếp ($label)';
  String get exportAction => isEnglish ? 'Export stock' : 'Xuất hàng';
  String get scanQrBarcodeAction =>
      isEnglish ? 'Scan for export' : 'Quét để xuất hàng';
  String get scanQuickActionHelper => isEnglish
      ? 'Use scanner for export validation, not product lookup.'
      : 'Quét dùng cho kiểm tra xuất kho, không phải tra cứu sản phẩm.';
  String get quickActionsLabel =>
      isEnglish ? 'Quick actions' : 'Thao tác nhanh';
  String get sourceHealthLabel =>
      isEnglish ? 'Sync source status' : 'Trạng thái nguồn đồng bộ';
  String get sourceHealthyValue => isEnglish ? 'Healthy' : 'Ổn định';
  String get invalidScannedCodeMessage =>
      isEnglish ? 'The scanned code is not valid.' : 'Mã quét không hợp lệ.';
  String get inStockStatus => isEnglish ? 'Ready to sell' : 'Sẵn sàng';
  String get lowStockStatus => isEnglish ? 'Low stock' : 'Sắp hết';
  String get outOfStockStatus => isEnglish ? 'Out of stock' : 'Hết hàng';
  String productTileSemantic(
    String name,
    String sku,
    int quantity,
    String status,
  ) => isEnglish
      ? '$name, SKU $sku, ready $quantity, status $status'
      : '$name, SKU $sku, sẵn sàng $quantity, trạng thái $status';
  String productImageLabel(String productName) => isEnglish
      ? 'Product image for $productName'
      : 'Ảnh sản phẩm $productName';
  String get stockMetricLabel => isEnglish ? 'Ready to sell' : 'Sẵn sàng';
  String get warrantyMetricLabel =>
      isEnglish ? 'Activated / warranty' : 'Đã kích hoạt / bảo hành';
  String get issueMetricLabel => isEnglish ? 'Needs attention' : 'Cần xử lý';
  String get importedMetricLabel =>
      isEnglish ? 'Imported serials' : 'Serial đã nhập';
  String latestImportedLabel(String dateLabel) =>
      isEnglish ? 'Latest import: $dateLabel' : 'Nhập gần nhất: $dateLabel';
  String get loadInventoryErrorMessage => isEnglish
      ? 'Unable to load inventory data. Please try again.'
      : 'Không thể tải dữ liệu kho. Vui lòng thử lại.';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get emptyInventoryTitle =>
      isEnglish ? 'Inventory is empty.' : 'Kho chưa có sản phẩm.';
  String get emptyInventorySubtitle => isEnglish
      ? 'Import goods from the distributor to start managing inventory.'
      : 'Nhập hàng từ nhà phân phối để bắt đầu quản lý kho.';
  String get importStockAction => isEnglish ? 'Import stock' : 'Nhập hàng';
  String get filteredEmptyMessage => isEnglish
      ? 'No products match the current filter.'
      : 'Không có sản phẩm phù hợp bộ lọc hiện tại.';
  String get clearFiltersAction => isEnglish ? 'Clear filters' : 'Xóa bộ lọc';
}
