part of 'inventory_product_detail_screen.dart';

class _InventoryProductDetailTexts {
  const _InventoryProductDetailTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Inventory details' : 'Chi tiết kho';
  String filterAllLabel(int count) =>
      isEnglish ? 'All ($count)' : 'Tất cả ($count)';
  String filterReadyLabel(int count) =>
      isEnglish ? 'Ready to sell ($count)' : 'Sẵn sàng bán ($count)';
  String filterWarrantyLabel(int count) =>
      isEnglish ? 'Warranty ($count)' : 'Bảo hành ($count)';
  String filterIssueLabel(int count) =>
      isEnglish ? 'Needs attention ($count)' : 'Cần xử lý ($count)';
  String productImageLabel(String productName) => isEnglish
      ? 'Product image for $productName'
      : 'Ảnh sản phẩm $productName';
  String latestImportedLabel(String dateTimeLabel) => isEnglish
      ? 'Latest import: $dateTimeLabel'
      : 'Nhập gần nhất: $dateTimeLabel';
  String get readyMetricLabel => isEnglish ? 'Ready to sell' : 'Sẵn sàng bán';
  String get importedMetricLabel =>
      isEnglish ? 'Imported serials' : 'Serial đã nhập';
  String get warrantyMetricLabel =>
      isEnglish ? 'Activated / warranty' : 'Đã kích hoạt / bảo hành';
  String get issueMetricLabel => isEnglish ? 'Needs attention' : 'Cần xử lý';
  String get exportAction => isEnglish ? 'Export stock' : 'Xuất hàng';
  String get scanQrAction => isEnglish ? 'Scan QR' : 'Quét QR';
  String get scanForExportAction =>
      isEnglish ? 'Scan for export' : 'Quét mã để xuất hàng';
  String get scanForExportHint => isEnglish
      ? 'Scan validates the serial and opens export with serial prefilled.'
      : 'Quét mã để kiểm tra serial và mở xuất hàng với serial điền sẵn.';
  String get searchSerialHint =>
      isEnglish ? 'Search serial or order id' : 'Tìm theo serial hoặc mã đơn';
  String get clearSearchAction => isEnglish ? 'Clear search' : 'Xóa tìm kiếm';
  String searchResultsLabel(int count) =>
      isEnglish ? '$count result(s)' : '$count kết quả';
  String serialVisibilitySummary(int shown, int filtered, int total) =>
      isEnglish
      ? 'Showing $shown of $filtered matching serial(s) from $total total.'
      : 'Đang hiển thị $shown/$filtered serial phù hợp trên tổng $total serial.';
  String get loadingMoreHint => isEnglish
      ? 'More serials load automatically when you scroll down.'
      : 'Danh sách sẽ tự tải thêm khi bạn kéo xuống.';
  String loadMoreSerialsAction(int remaining) => isEnglish
      ? 'Load more ($remaining remaining)'
      : 'Tải thêm (còn $remaining)';
  String get noSerialsMessage => isEnglish
      ? 'This product does not have any serials yet.'
      : 'Sản phẩm này chưa có danh sách serial.';
  String get filterEmptyMessage => isEnglish
      ? 'No serial matches the selected filter.'
      : 'Không có serial phù hợp bộ lọc.';
  String get searchEmptyMessage => isEnglish
      ? 'No serial matches your search and filter.'
      : 'Không có serial phù hợp từ tìm kiếm và bộ lọc.';
  String get clearFilterAction => isEnglish ? 'Clear filter' : 'Xóa bộ lọc';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get invalidScannedCodeMessage =>
      isEnglish ? 'The scanned code is not valid.' : 'Mã quét không hợp lệ.';
  String copiedSerialMessage(String serial) =>
      isEnglish ? 'Copied serial $serial.' : 'Đã sao chép serial $serial.';
  String get readyStatusLabel => isEnglish ? 'Ready to sell' : 'Sẵn sàng bán';
  String get warrantyStatusLabel =>
      isEnglish ? 'Under warranty' : 'Đang bảo hành';
  String get inspectingStatusLabel =>
      isEnglish ? 'Inspecting' : 'Đang kiểm định';
  String get defectiveStatusLabel => isEnglish ? 'Defective' : 'Lỗi';
  String get returnedStatusLabel => isEnglish ? 'Returned' : 'Trả về';
  String get scrappedStatusLabel => isEnglish ? 'Scrapped' : 'Đã loại bỏ';
  String get reservedStatusLabel => isEnglish ? 'Reserved' : 'Đã giữ chỗ';
  String get unknownStatusLabel =>
      isEnglish ? 'Unknown status' : 'Trạng thái không xác định';
  String importedAtLabel(String dateTimeLabel) =>
      isEnglish ? 'Imported: $dateTimeLabel' : 'Nhập: $dateTimeLabel';
  String orderLinkLabel(String orderId) =>
      isEnglish ? 'Order $orderId' : 'Đơn $orderId';
  String get serialOptionsTooltip =>
      isEnglish ? 'Serial options' : 'Tùy chọn serial';
  String get copySerialAction => isEnglish ? 'Copy serial' : 'Sao chép serial';
  String get timelineAction =>
      isEnglish ? 'View timeline' : 'Xem dòng thời gian';
  String get returnEligibilityAction =>
      isEnglish ? 'Return eligibility' : 'Điều kiện đổi trả';
  String returnEligibilityTitle(String serial) => isEnglish
      ? 'Return eligibility • $serial'
      : 'Điều kiện đổi trả • $serial';
  String get createReturnAction =>
      isEnglish ? 'Create return request' : 'Tạo yêu cầu đổi trả';
  String get openActiveReturnAction =>
      isEnglish ? 'Open active request' : 'Mở yêu cầu đang xử lý';
  String timelineTitle(String serial) => isEnglish
      ? 'Serial timeline • $serial'
      : 'Dòng thời gian serial • $serial';
  String get emptyTimelineMessage => isEnglish
      ? 'No timeline entries are available for this serial yet.'
      : 'Chưa có mốc thời gian nào cho serial này.';
  String get timelineLoadFailedMessage => isEnglish
      ? 'Unable to load serial timeline right now.'
      : 'Không thể tải dòng thời gian serial lúc này.';
}
