part of 'warranty_activation_screen.dart';

class _WarrantyActivationTexts {
  const _WarrantyActivationTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Serial processing' : 'Xử lý serial';
  String get loadingTitle =>
      isEnglish ? 'Syncing serial data' : 'Đang đồng bộ dữ liệu serial';
  String get loadingDescription => isEnglish
      ? 'Please wait while the latest order and warranty inventory are prepared.'
      : 'Vui lòng chờ trong lúc hệ thống chuẩn bị dữ liệu đơn hàng và kho bảo hành mới nhất.';
  String get orderNotFoundTitle =>
      isEnglish ? 'Order not found' : 'Không tìm thấy đơn hàng';
  String get orderNotFoundMessage => isEnglish
      ? 'Cannot find the order for serial processing.'
      : 'Không tìm thấy đơn hàng để xử lý serial.';
  String get syncWarningTitle =>
      isEnglish ? 'Sync warning' : 'Cảnh báo đồng bộ';
  String get initialSyncWarning => isEnglish
      ? 'Latest warranty data could not be refreshed. The screen is using the current local data.'
      : 'Không thể làm mới dữ liệu bảo hành mới nhất. Màn hình đang dùng dữ liệu hiện có trên máy.';
  String get cannotProcessTitle =>
      isEnglish ? 'Order is not ready' : 'Đơn hàng chưa sẵn sàng';
  String get cannotProcessMessage => isEnglish
      ? 'Only completed orders can be processed for serials.'
      : 'Chỉ đơn đã hoàn thành mới được xử lý serial.';
  String currentStatusLabel(String statusLabel) => isEnglish
      ? 'Current status: $statusLabel'
      : 'Trạng thái hiện tại: $statusLabel';
  String get processingInfoTitle =>
      isEnglish ? 'Serial processing information' : 'Thông tin xử lý serial';
  String get orderIdLabel => isEnglish ? 'Order ID' : 'Mã đơn hàng';
  String get orderDateLabel => isEnglish ? 'Order date' : 'Ngày đặt';
  String get progressLabel => isEnglish ? 'Progress' : 'Tiến độ';
  String serialProgressValue(int activatedCount, int totalCount) => isEnglish
      ? '$activatedCount/$totalCount serials'
      : '$activatedCount/$totalCount serial';
  String get inventoryValidationHint => isEnglish
      ? 'Only serials already in inventory and matching the order item can be activated.'
      : 'Chỉ serial đã nhập kho và thuộc sản phẩm trong đơn mới được kích hoạt.';
  String get customerNameLabel =>
      isEnglish ? 'Customer name' : 'Tên khách hàng';
  String get customerEmailLabel =>
      isEnglish ? 'Customer email *' : 'Email khách hàng *';
  String get customerEmailHelper => isEnglish
      ? 'Required. Used to store warranty activation details and support contact.'
      : 'Bắt buộc. Dùng để lưu thông tin kích hoạt bảo hành và liên hệ hỗ trợ.';
  String get customerPhoneLabel =>
      isEnglish ? 'Customer phone number' : 'Số điện thoại khách hàng';
  String get customerAddressLabel =>
      isEnglish ? 'Customer address' : 'Địa chỉ khách hàng';
  String purchaseDateLabel(String dateLabel) =>
      isEnglish ? 'Purchase date: $dateLabel' : 'Ngày mua: $dateLabel';
  String get purchaseDateHint => isEnglish
      ? 'Dealers can adjust the in-store purchase date before activating warranty.'
      : 'Đại lý có thể chọn lại ngày khách mua tại cửa hàng trước khi kích hoạt bảo hành.';
  String get prefilledCustomerHint => isEnglish
      ? 'Customer information is prefilled from the order and can still be edited if needed.'
      : 'Thông tin khách hàng được điền sẵn từ đơn hàng, vẫn có thể chỉnh sửa nếu cần.';
  String get quantityLabel => isEnglish ? 'Quantity' : 'Số lượng';
  String get activatedCountLabel => isEnglish ? 'Activated' : 'Đã kích hoạt';
  String get availableInventorySerialsLabel =>
      isEnglish ? 'Valid serials in inventory' : 'Serial hợp lệ trong kho';
  String remainingSerialsLabel(int remaining) => isEnglish
      ? 'Enter $remaining remaining serials'
      : 'Nhập $remaining serial còn thiếu';
  String get scanQrAction => isEnglish ? 'Scan QR' : 'Quét QR';
  String get bulkPasteAction =>
      isEnglish ? 'Paste multiple serials' : 'Dán nhiều serial';
  String serialFieldLabel(int index, int remaining) =>
      isEnglish ? 'Serial $index/$remaining' : 'Serial $index/$remaining';
  String get serialFieldHelper => isEnglish
      ? 'Example: SN-ABC-12345 (letters, numbers, and - only)'
      : 'Ví dụ: SN-ABC-12345 (chỉ gồm chữ, số và dấu -)';
  String get fullyActivatedButtonLabel => isEnglish
      ? 'Order already has all serials activated'
      : 'Đơn đã kích hoạt đủ serial';
  String get confirmActivationAction =>
      isEnglish ? 'Confirm serial activation' : 'Xác nhận kích hoạt serial';

  String serialNotFoundInInventory(String serial) => isEnglish
      ? 'Cannot find serial $serial in inventory.'
      : 'Không tìm thấy serial $serial trong kho.';
  String serialBelongsToOtherOrder(
    String serial,
    String importedOrderId,
    String currentOrderId,
  ) => isEnglish
      ? 'Serial $serial belongs to order $importedOrderId, not order $currentOrderId.'
      : 'Serial $serial thuộc đơn $importedOrderId, không thuộc đơn $currentOrderId.';
  String serialProductMismatch(String serial) => isEnglish
      ? 'Serial $serial does not match the product being processed.'
      : 'Serial $serial không khớp sản phẩm cần xử lý.';
  String noEmptySerialSlot(String productName) => isEnglish
      ? 'There is no empty serial slot left for $productName.'
      : 'Không còn ô serial trống cho $productName.';
  String productAlreadyFull(String productName) => isEnglish
      ? '$productName already has enough serials and cannot be auto-filled.'
      : 'Đã đủ serial cho $productName, không thể tự điền thêm.';
  String prefilledSerialAssigned(String serial) => isEnglish
      ? 'Assigned scanned serial: $serial'
      : 'Đã điền serial quét: $serial';
  String get pickPurchaseDateHelp =>
      isEnglish ? 'Select purchase date' : 'Chọn ngày mua';
  String purchaseDateBeforeOrder(String minimumDate) => isEnglish
      ? 'Purchase date cannot be before the order date $minimumDate.'
      : 'Ngày mua không được trước ngày đặt hàng $minimumDate.';
  String get purchaseDateAfterToday => isEnglish
      ? 'Purchase date cannot be after today.'
      : 'Ngày mua không được sau hôm nay.';
  String scannedSerialAssigned(String productName) => isEnglish
      ? 'Assigned scanned serial for $productName.'
      : 'Đã điền serial quét cho $productName.';
  String get duplicateScannedSerialMessage => isEnglish
      ? 'This serial is already in the input list.'
      : 'Serial này đã có trong danh sách nhập.';
  String get invalidScannedSerialMessage => isEnglish
      ? 'The scanned serial is not valid for this product.'
      : 'Serial quét không hợp lệ cho sản phẩm này.';
  String get bulkPasteTitle =>
      isEnglish ? 'Paste multiple serials' : 'Dán nhiều serial';
  String get bulkPasteHint => isEnglish
      ? 'One serial per line, or separate them with commas'
      : 'Mỗi serial một dòng, hoặc phân tách bằng dấu phẩy';
  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get fillSerialsAction => isEnglish ? 'Fill serials' : 'Điền serial';
  String get noValidSerialsFoundMessage => isEnglish
      ? 'No valid serial was found to fill.'
      : 'Không tìm thấy serial hợp lệ để điền.';
  String bulkPasteSummary(
    int assignedCount,
    int duplicateCount,
    int invalidCount,
    int fullCount,
  ) => isEnglish
      ? 'Assigned $assignedCount serials. Duplicates: $duplicateCount, invalid: $invalidCount, no slots: $fullCount.'
      : 'Đã điền $assignedCount serial. Trùng: $duplicateCount, lỗi: $invalidCount, hết ô: $fullCount.';
  String get customerInfoRequiredMessage => isEnglish
      ? 'Please enter all customer information.'
      : 'Vui lòng nhập đầy đủ thông tin khách hàng.';
  String get invalidEmailMessage => isEnglish
      ? 'Please enter a valid email address.'
      : 'Vui lòng nhập email hợp lệ.';
  String get invalidPhoneMessage => isEnglish
      ? 'Phone number must be 10 digits and start with 0.'
      : 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.';
  String serialRequiredForProduct(String productName) => isEnglish
      ? 'Please enter all serials for $productName.'
      : 'Vui lòng nhập đầy đủ serial cho $productName.';
  String duplicateSerialInSubmission(String serial) => isEnglish
      ? 'Serial $serial is duplicated in this submission.'
      : 'Serial $serial bị trùng trong lần nhập này.';
  String get orderAlreadyFullyActivatedMessage => isEnglish
      ? 'This order already has all serials activated.'
      : 'Đơn hàng này đã kích hoạt đủ serial.';
  String get activationSyncFailedMessage => isEnglish
      ? 'Cannot sync warranty activation. Please check again.'
      : 'Không thể đồng bộ kích hoạt bảo hành. Vui lòng kiểm tra lại.';
  String get screenErrorTitle => isEnglish
      ? 'Warranty activation is temporarily unavailable'
      : 'Màn hình kích hoạt bảo hành tạm thời không khả dụng';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String activationSuccessMessage(int count) => isEnglish
      ? 'Successfully activated $count serials.'
      : 'Đã kích hoạt thành công $count serial.';

  String orderStatusLabel(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return isEnglish ? 'Pending' : '\u0043h\u1EDD x\u1EED l\u00FD';
      case OrderStatus.confirmed:
        return isEnglish ? 'Confirmed' : '\u0110\u00E3 x\u00E1c nh\u1EADn';
      case OrderStatus.processing:
        return isEnglish
            ? 'Processing'
            : '\u0110ang chu\u1EA9n b\u1ECB h\u00E0ng';
      case OrderStatus.shipping:
        return isEnglish ? 'Shipping' : 'Đang giao';
      case OrderStatus.completed:
        return isEnglish ? 'Completed' : 'Hoàn thành';
      case OrderStatus.cancelRequested:
        return isEnglish ? 'Cancel requested' : 'Đã gửi yêu cầu hủy';
      case OrderStatus.cancelRejected:
        return isEnglish ? 'Cancel rejected' : 'Yêu cầu hủy bị từ chối';
      case OrderStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
    }
  }
}
