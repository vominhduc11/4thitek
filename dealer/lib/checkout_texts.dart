part of 'checkout_screen.dart';

class _CheckoutTexts {
  const _CheckoutTexts({required this.isEnglish});

  final bool isEnglish;

  String get checkoutReadinessTitle => isEnglish
      ? 'Review these prerequisites before placing the order.'
      : 'Hãy hoàn tất các điều kiện sau trước khi đặt đơn.';
  String get completeProfileAction =>
      isEnglish ? 'Complete dealer profile' : 'Bổ sung hồ sơ đại lý';
  String get retryProfileAction =>
      isEnglish ? 'Reload account data' : 'Tải lại dữ liệu tài khoản';
  String get reloadPaymentInstructionsAction => isEnglish
      ? 'Reload transfer instructions'
      : 'Tải lại hướng dẫn chuyển khoản';
  String get businessNameFieldLabel =>
      isEnglish ? 'Business name' : 'Tên doanh nghiệp';
  String get contactNameFieldLabel =>
      isEnglish ? 'Contact name' : 'Người liên hệ';
  String get phoneFieldLabel => isEnglish ? 'Phone number' : 'Số điện thoại';
  String get shippingAddressFieldLabel =>
      isEnglish ? 'Shipping address' : 'Địa chỉ nhận hàng';
  String get emptyCartBlockerMessage => isEnglish
      ? 'Your cart is empty. Add products before creating an order.'
      : 'Giỏ hàng đang trống. Hãy thêm sản phẩm trước khi tạo đơn.';
  String missingProfileFieldsMessage(List<String> fields) {
    final summary = fields.join(', ');
    return isEnglish
        ? 'Update these profile fields first: $summary.'
        : 'Vui lòng cập nhật trước các mục hồ sơ sau: $summary.';
  }

  String get profileLoadFailedMessage => isEnglish
      ? 'Unable to load account information. Please retry before placing the order.'
      : 'Không tải được thông tin tài khoản. Vui lòng tải lại trước khi đặt đơn.';
  String get loadingProfileMessage => isEnglish
      ? 'Loading account information...'
      : 'Đang tải thông tin tài khoản...';
  String get primaryActionBankTransfer => isEnglish
      ? 'Create order and open transfer instructions'
      : 'Tạo đơn và mở hướng dẫn chuyển khoản';
  String cannotLoadBankTransferMessage(Object error) =>
      bankTransferLoadErrorMessage(error, isEnglish: isEnglish);
  String copiedLabelMessage(String label) =>
      isEnglish ? 'Copied $label' : 'Đã sao chép $label';
  String get screenTitle => isEnglish ? 'Checkout' : 'Thanh toán';
  String get shippingInfoTitle =>
      isEnglish ? 'Shipping information' : 'Thông tin nhận hàng';
  String get editShippingInfoAction =>
      isEnglish ? 'Edit shipping information' : 'Sửa thông tin nhận hàng';
  String contactPersonLine(String name) =>
      isEnglish ? 'Contact person: $name' : 'Người liên hệ: $name';
  String phoneLine(String phone) =>
      isEnglish ? 'Phone: $phone' : 'Số điện thoại: $phone';
  String get paymentFlowTitle =>
      isEnglish ? 'Payment flow' : 'Quy trình thanh toán';
  String get fixedFlowBadge => isEnglish ? 'Fixed flow' : 'Luồng cố định';
  String get bankTransferTitle =>
      isEnglish ? 'Bank transfer' : 'Chuyển khoản ngân hàng';
  String get bankTransferSubtitle => isEnglish
      ? 'Dealer orders currently use one verified transfer flow managed through SePay reconciliation.'
      : 'Đơn đại lý hiện dùng một luồng chuyển khoản cố định và được đối soát qua SePay.';
  String get paymentFlowDescription => isEnglish
      ? 'Create the order first, then transfer the exact amount using the exact order ID so the system can reconcile payment automatically.'
      : 'Hệ thống sẽ tạo đơn trước. Sau đó bạn chuyển đúng số tiền và đúng mã đơn để hệ thống đối soát thanh toán tự động.';
  String get paymentStepCreateTitle =>
      isEnglish ? 'Create the order first' : 'Tạo đơn hàng trước';
  String get paymentStepCreateDescription => isEnglish
      ? 'The order is recorded immediately and remains pending while payment is being matched.'
      : 'Đơn được ghi nhận ngay và giữ trạng thái chờ trong lúc hệ thống đối soát thanh toán.';
  String get paymentStepTransferTitle => isEnglish
      ? 'Transfer with the exact amount'
      : 'Chuyển khoản đúng số tiền';
  String get paymentStepTransferDescription => isEnglish
      ? 'Use the receiving account shown below. Transfer content is the order ID generated after you place the order.'
      : 'Dùng tài khoản nhận tiền bên dưới. Nội dung chuyển khoản sẽ là mã đơn được tạo sau khi bạn đặt hàng.';
  String get paymentStepConfirmTitle =>
      isEnglish ? 'Wait for automatic confirmation' : 'Chờ xác nhận tự động';
  String get paymentStepConfirmDescription => isEnglish
      ? 'SePay webhook updates payment status automatically. Admin only processes orders after successful payment.'
      : 'SePay webhook sẽ tự cập nhật trạng thái thanh toán. Admin chỉ xử lý đơn sau khi thanh toán được xác nhận.';
  String get transferPreviewTitle =>
      isEnglish ? 'Receiving account' : 'Tài khoản nhận chuyển khoản';
  String get transferPreviewHint => isEnglish
      ? 'Transfer content appears after order creation because it uses the generated order ID.'
      : 'Nội dung chuyển khoản chỉ xuất hiện sau khi tạo đơn vì sẽ dùng đúng mã đơn vừa phát sinh.';
  String get providerLabel => isEnglish ? 'Provider' : 'Nhà cung cấp';
  String get bankNameLabel => isEnglish ? 'Bank' : 'Ngân hàng';
  String get accountNumberLabel =>
      isEnglish ? 'Account number' : 'Số tài khoản';
  String get accountHolderLabel =>
      isEnglish ? 'Account holder' : 'Chủ tài khoản';
  String productsInOrderTitle(int totalItems) => isEnglish
      ? 'Products in order ($totalItems)'
      : 'Sản phẩm trong đơn ($totalItems)';
  String productLineCount(int count) =>
      isEnglish ? '$count line items' : '$count dòng sản phẩm';
  String get expandProductsHint => isEnglish
      ? 'Tap to view each product in detail'
      : 'Nhấn để xem chi tiết từng sản phẩm';
  String get orderNoteTitle => isEnglish ? 'Order note' : 'Ghi chú đơn hàng';
  String get orderNoteHint => isEnglish
      ? 'Example: deliver during office hours, call before delivery, invoice note...'
      : 'Ví dụ: giao giờ hành chính, gọi trước khi giao, lưu ý xuất hóa đơn...';
  String get orderSummaryTitle =>
      isEnglish ? 'Order summary' : 'Tóm tắt đơn hàng';
  String get itemCountLabel => isEnglish ? 'Item count' : 'Số lượng sản phẩm';
  String get subtotalLabel => isEnglish ? 'Subtotal' : 'Tạm tính';
  String discountLabel(int percent) =>
      isEnglish ? 'Discount ($percent%)' : 'Chiết khấu ($percent%)';
  String get afterDiscountLabel =>
      isEnglish ? 'After discount' : 'Sau chiết khấu';
  String vatLabel(int percent) =>
      isEnglish ? 'VAT ($percent%)' : 'VAT ($percent%)';
  String get paymentStatusLabelTitle =>
      isEnglish ? 'Payment status' : 'Trạng thái thanh toán';
  String get bankTransferSummaryHint => isEnglish
      ? 'The order will be created first. Then transfer the exact amount with the exact order ID so the SePay webhook can reconcile it automatically.'
      : 'Đơn sẽ được tạo trước. Sau đó hãy chuyển khoản đúng số tiền và đúng mã đơn để SePay webhook đối soát tự động.';
  String get loadingBankTransferMessage => isEnglish
      ? 'Loading bank transfer information from the system...'
      : 'Đang tải thông tin chuyển khoản từ hệ thống...';
  String get bankTransferUnavailableMessage => isEnglish
      ? 'Bank transfer information could not be loaded yet. Please try again before placing the order.'
      : 'Chưa tải được thông tin chuyển khoản. Hãy thử lại trước khi đặt đơn.';
  String get retryAction => isEnglish ? 'Retry' : 'Tải lại';
  String get totalLabel => isEnglish ? 'Total' : 'Tổng cộng';
  String get pricingNote => isEnglish
      ? 'Note: The actual order price is calculated using the current price at checkout time, and may differ if product prices changed since the last refresh.'
      : 'Lưu ý: Giá thực tế trong đơn được tính theo giá hiện hành tại thời điểm đặt hàng và có thể khác nếu giá sản phẩm thay đổi từ lần tải gần nhất.';
  String get cannotCreateOrderMessage => isEnglish
      ? 'Unable to create the order. Please try again.'
      : 'Không thể tạo đơn hàng. Vui lòng thử lại.';
  String stockIssue(String productName, int stock) => isEnglish
      ? '$productName only has $stock items left in stock.'
      : '$productName chỉ còn $stock sản phẩm trong kho.';
  String productCountSummary(int count) =>
      isEnglish ? 'Item count: $count' : 'Số lượng sản phẩm: $count';
  String totalPaymentSummary(String amount) =>
      isEnglish ? 'Total payment: $amount' : 'Tổng thanh toán: $amount';
  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get validationDialogTitle =>
      isEnglish ? 'Order needs adjustments' : 'Đơn hàng cần điều chỉnh';
  String get validationDialogSubtitle =>
      isEnglish ? 'Please review:' : 'Vui lòng kiểm tra:';
  String get cartSyncInProgressMessage => isEnglish
      ? 'The cart is still syncing. Please wait a moment and try again.'
      : 'Giỏ hàng vẫn đang đồng bộ. Vui lòng đợi một chút rồi thử lại.';
  String get closeAction => isEnglish ? 'Close' : 'Đóng';
  String outOfStockIssue(String productName) => isEnglish
      ? '$productName is currently out of stock.'
      : '$productName hiện đã hết hàng.';

  String paymentStatusLabel(OrderPaymentStatus status) {
    switch (status) {
      case OrderPaymentStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
      case OrderPaymentStatus.pending:
        return isEnglish ? 'Unpaid' : 'Chưa thanh toán';
      case OrderPaymentStatus.paid:
        return isEnglish ? 'Paid' : 'Đã thanh toán';
    }
  }
}
