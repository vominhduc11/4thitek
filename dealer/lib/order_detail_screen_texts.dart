part of 'order_detail_screen.dart';

String _eligibilityReasonText(
  DealerReturnEligibilityRecord eligibility, {
  required bool isEnglish,
}) {
  final reason = eligibility.reasonCode.trim().toUpperCase();
  switch (reason) {
    case 'ELIGIBLE':
      return isEnglish ? 'Eligible for return' : 'Du dieu kien doi tra';
    case 'ORDER_NOT_COMPLETED':
      return isEnglish
          ? 'Order is not completed yet.'
          : 'Don hang chua hoan tat.';
    case 'SERIAL_STATUS_NOT_ELIGIBLE':
      return isEnglish
          ? 'Serial status is not eligible for return.'
          : 'Trang thai serial khong cho phep doi tra.';
    case 'ACTIVE_RETURN_REQUEST_EXISTS':
      return isEnglish
          ? 'This serial already has an active return request.'
          : 'Serial nay da co yeu cau doi tra dang xu ly.';
    default:
      return eligibility.reasonMessage.isNotEmpty
          ? eligibility.reasonMessage
          : (isEnglish
                ? 'Eligibility unavailable.'
                : 'Khong xac dinh du dieu kien.');
  }
}

class _OrderDetailTexts {
  const _OrderDetailTexts({required this.isEnglish});

  final bool isEnglish;

  static const int proofRequiredThreshold = 10000000;

  String get screenTitle => isEnglish ? 'Order details' : 'Chi tiết đơn hàng';
  String get orderNotFoundMessage =>
      isEnglish ? 'Order not found.' : 'Không tìm thấy đơn hàng.';
  String get orderNotFoundDescription => isEnglish
      ? 'This order may have been removed or is no longer available in the current session.'
      : 'Đơn hàng này có thể đã bị xóa hoặc không còn khả dụng trong phiên làm việc hiện tại.';
  String get updateOrderStatusFailedMessage => isEnglish
      ? 'Unable to update the order status. Please try again.'
      : 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.';
  String get confirmCancelTitle =>
      isEnglish ? 'Request order cancellation' : 'Gửi yêu cầu hủy đơn';
  String get cancelReasonLabel =>
      isEnglish ? 'Reason for cancellation' : 'Lý do hủy';
  String get cancelReasonPlaceholder =>
      isEnglish ? 'Select a reason...' : 'Chọn lý do...';
  String get cancelReasonRequired =>
      isEnglish ? 'Please select a reason.' : 'Vui lòng chọn lý do.';
  List<String> get cancelReasonOptions => isEnglish
      ? [
          'Customer request',
          'Out of stock',
          'Price error',
          'Duplicate order',
          'Other',
        ]
      : [
          'Khách yêu cầu hủy',
          'Hết hàng',
          'Lỗi giá',
          'Đơn bị trùng',
          'Lý do khác',
        ];
  String orderCodeSummary(String orderId) =>
      isEnglish ? 'Order: #$orderId' : 'Đơn hàng: #$orderId';
  String totalAmountSummary(String amount) =>
      isEnglish ? 'Total amount: $amount' : 'Tổng tiền: $amount';
  String itemCountSummary(int count) =>
      isEnglish ? '$count items' : '$count sản phẩm';
  String get irreversibleWarning => isEnglish
      ? 'An admin will review your cancellation request.'
      : 'Quản trị viên sẽ xem xét yêu cầu hủy của bạn.';
  String get noAction => isEnglish ? 'No' : 'Không';
  String get cancelOrderAction =>
      isEnglish ? 'Send cancellation request' : 'Gửi yêu cầu hủy';
  String get confirmReceivedTitle =>
      isEnglish ? 'Confirm delivery received' : 'Xác nhận đã nhận hàng';
  String get paymentWillBeMarkedCompleteMessage => isEnglish
      ? 'Payment will be marked complete for this order.'
      : 'Thanh toán sẽ được đánh dấu hoàn tất cho đơn hàng này.';
  String get confirmAction => isEnglish ? 'Confirm' : 'Xác nhận';
  String get confirmOrderAction => isEnglish ? 'Confirm order' : 'Xác nhận đơn';
  String get startShippingAction => isEnglish ? 'Start shipping' : 'Giao hàng';
  String get completeOrderAction => isEnglish ? 'Mark complete' : 'Hoàn thành';
  String get confirmReceivedAction =>
      isEnglish ? 'Confirm received' : 'Xác nhận đã nhận hàng';
  String get cannotOpenPhoneAppMessage => isEnglish
      ? 'Unable to open the phone app on this device.'
      : 'Không thể mở ứng dụng gọi điện trên thiết bị này.';
  String get cannotOpenMapAppMessage => isEnglish
      ? 'Unable to open the map application.'
      : 'Không thể mở ứng dụng bản đồ.';
  String get reorderNoneAddedMessage => isEnglish
      ? 'No products were added to the cart because they are out of stock.'
      : 'Không có sản phẩm nào được thêm vào giỏ vì đã hết hàng.';
  String get reorderAllAddedMessage => isEnglish
      ? 'All products were added to the cart.'
      : 'Đã thêm tất cả sản phẩm vào giỏ hàng.';
  String reorderPartialAddedMessage(int addedCount, List<String> skipped) =>
      isEnglish
      ? 'Added $addedCount products. Skipped: ${skipped.join(', ')} (out of stock or over stock limit).'
      : 'Đã thêm $addedCount sản phẩm. Bỏ qua: ${skipped.join(', ')} (hết hàng hoặc vượt tồn kho).';
  String get openCartAction => isEnglish ? 'Open cart' : 'Mở giỏ hàng';
  String copiedLabelMessage(String label) =>
      isEnglish ? 'Copied $label' : 'Đã sao chép $label';
  String cannotLoadBankTransferMessage(Object error) => isEnglish
      ? bankTransferLoadErrorMessage(error, isEnglish: true)
      : bankTransferLoadErrorMessage(error, isEnglish: false);
  String get recordPaymentTitle =>
      isEnglish ? 'Record payment' : 'Ghi nhận thanh toán';
  String outstandingOrderSummary(String orderId, String amount) => isEnglish
      ? 'Order $orderId has an outstanding amount of $amount'
      : 'Đơn $orderId còn nợ $amount';
  String get amountLabel => isEnglish ? 'Amount' : 'Số tiền';
  String amountHint(String maxAmount) =>
      isEnglish ? 'Maximum $maxAmount' : 'Tối đa $maxAmount';
  String get paymentChannelLabel =>
      isEnglish ? 'Payment channel' : 'Kênh thanh toán';
  String get attachProofButton =>
      isEnglish ? 'Attach payment proof' : 'Đính kèm chứng từ';
  String get attachingProofLabel =>
      isEnglish ? 'Uploading proof...' : 'Đang tải chứng từ...';
  String get closeAction => isEnglish ? 'Close' : 'Đóng';
  String get backAction => isEnglish ? 'Back' : 'Quay lại';
  String get invalidAmountMessage =>
      isEnglish ? 'Invalid amount.' : 'Số tiền không hợp lệ.';
  String get amountExceedsOutstandingMessage => isEnglish
      ? 'The amount exceeds the remaining outstanding balance.'
      : 'Số tiền vượt quá số dư cần thanh toán còn lại.';
  String get recordPaymentScreenNote => isEnglish
      ? 'Recorded from the order detail screen.'
      : 'Ghi nhận từ màn hình chi tiết đơn hàng.';
  String proofRequiredHint(String threshold) => isEnglish
      ? 'Proof is required for orders with outstanding amount from $threshold.'
      : 'Bắt buộc đính kèm chứng từ khi đơn còn nợ từ $threshold.';
  String proofRequiredForLargeOutstandingMessage(String threshold) => isEnglish
      ? 'Attach payment proof before recording this payment. Required from $threshold outstanding.'
      : 'Vui lòng đính kèm chứng từ trước khi ghi nhận thanh toán. Áp dụng khi còn nợ từ $threshold.';
  String proofAttachedSuccess(String fileName) => isEnglish
      ? 'Attached proof $fileName.'
      : 'Đã đính kèm chứng từ $fileName.';
  String proofUploadFailed(Object error) =>
      uploadServiceErrorMessage(error, isEnglish: isEnglish);
  String get cannotRecordPaymentMessage => isEnglish
      ? 'Unable to record the payment. Please check again.'
      : 'Không thể ghi nhận thanh toán. Vui lòng kiểm tra lại.';
  String paymentRecordedMessage(String amount, String orderId) => isEnglish
      ? 'Recorded $amount for order $orderId.'
      : 'Đã ghi nhận $amount cho đơn $orderId.';
  String get recordAction => isEnglish ? 'Record' : 'Ghi nhận';
  String get reorderAction => isEnglish ? 'Reorder' : 'Đặt lại đơn cũ';
  String get bankTransferInfoAction =>
      isEnglish ? 'Bank transfer info' : 'Thông tin chuyển khoản';
  String get recordPaymentAction =>
      isEnglish ? 'Record payment' : 'Ghi nhận thanh toán';
  String get processSerialAction =>
      isEnglish ? 'Process serials' : 'Xử lý serial';
  String get createReturnAction =>
      isEnglish ? 'Create return request' : 'Tạo yêu cầu đổi trả';
  String get createReturnForSerialAction =>
      isEnglish ? 'Create for this serial' : 'Tạo cho serial này';
  String get openReturnRequestAction =>
      isEnglish ? 'Open return request' : 'Mở yêu cầu đổi trả';
  String get returnOverviewTitle =>
      isEnglish ? 'Return eligibility' : 'Điều kiện đổi trả';
  String returnOverviewSummary(int eligibleCount, int activeCount, int total) =>
      isEnglish
      ? '$eligibleCount of $total serial(s) are eligible. $activeCount serial(s) already have active return requests.'
      : '$eligibleCount/$total serial đủ điều kiện. $activeCount serial đã có yêu cầu đang xử lý.';
  String get returnNoSerialsMessage => isEnglish
      ? 'No serials found for this order.'
      : 'Không tìm thấy serial cho đơn hàng này.';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get serialProcessingLockedTitle => isEnglish
      ? 'Serial processing is almost ready'
      : 'Xử lý serial sắp khả dụng';
  String get serialProcessingLockedMessage => isEnglish
      ? 'This order is already shipping, but serial processing only opens after the order reaches completed status.'
      : 'Đơn hàng đang giao, nhưng chỉ có thể xử lý serial sau khi đơn chuyển sang trạng thái hoàn thành.';
  String get fulfillmentInfoTitle =>
      isEnglish ? 'Delivery tracking' : 'Theo dõi vận chuyển';
  String get carrierLabel => isEnglish ? 'Carrier' : 'Đơn vị vận chuyển';
  String get trackingCodeLabel =>
      isEnglish ? 'Tracking code' : 'Mã vận đơn';
  String get shippedAtLabel =>
      isEnglish ? 'Handed to carrier' : 'Đã giao cho đơn vị vận chuyển';
  String get deliveredAtLabel =>
      isEnglish ? 'Delivered successfully' : 'Đã giao thành công';
  String get notAvailableValue =>
      isEnglish ? 'Not available' : 'Chưa có thông tin';
  String get orderInfoTitle =>
      isEnglish ? 'Order information' : 'Thông tin đơn';
  String get orderIdLabel => isEnglish ? 'Order ID' : 'Mã đơn';
  String copiedOrderIdMessage(String orderId) =>
      isEnglish ? 'Copied order ID $orderId' : 'Đã sao chép mã đơn $orderId';
  String get orderDateLabel => isEnglish ? 'Order date' : 'Ngày đặt';
  String get orderStatusRowLabel =>
      isEnglish ? 'Order status' : 'Trạng thái đơn';
  String get paymentMethodRowLabel =>
      isEnglish ? 'Payment method' : 'Phương thức thanh toán';
  String get paymentStatusRowLabel =>
      isEnglish ? 'Payment status' : 'Trạng thái thanh toán';
  String get shippingInfoTitle =>
      isEnglish ? 'Shipping information' : 'Thông tin nhận hàng';
  String noteValue(String note) => isEnglish ? 'Note: $note' : 'Ghi chú: $note';
  String productsTitle(int count) =>
      isEnglish ? 'Products ($count)' : 'Sản phẩm ($count)';
  String get paymentTitle => isEnglish ? 'Payment' : 'Thanh toán';
  String get subtotalLabel => isEnglish ? 'Subtotal' : 'Tạm tính';
  String discountLabel(int percent) =>
      isEnglish ? 'Discount ($percent%)' : 'Chiết khấu ($percent%)';
  String get afterDiscountLabel =>
      isEnglish ? 'After discount' : 'Sau chiết khấu';
  String vatLabel(int percent) =>
      isEnglish ? 'VAT ($percent%)' : 'VAT ($percent%)';
  String get paidAmountLabel => isEnglish ? 'Paid amount' : 'Đã thanh toán';
  String get outstandingAmountLabel =>
      isEnglish ? 'Outstanding' : 'Còn phải thanh toán';
  String get totalLabel => isEnglish ? 'Total' : 'Tổng cộng';
  String get paymentHistoryTitle =>
      isEnglish ? 'Payment history' : 'Lịch sử thanh toán';
  String get totalRecordedLabel =>
      isEnglish ? 'Total recorded' : 'Tổng đã ghi nhận';
  String get copyTooltip => isEnglish ? 'Copy' : 'Sao chép';

  String orderStatusLabel(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return isEnglish ? 'Pending' : 'Chờ xử lý';
      case OrderStatus.confirmed:
        return isEnglish ? 'Confirmed' : 'Đã xác nhận';
      case OrderStatus.processing:
        return isEnglish ? 'Processing' : 'Đang chuẩn bị hàng';
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

  String paymentMethodLabel(BuildContext context, OrderPaymentMethod method) =>
      method.localizedLabel(context);

  String orderPaymentStatusLabel(OrderPaymentStatus status) {
    switch (status) {
      case OrderPaymentStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
      case OrderPaymentStatus.pending:
        return isEnglish ? 'Unpaid' : 'Chưa thanh toán';
      case OrderPaymentStatus.paid:
        return isEnglish ? 'Paid' : 'Đã thanh toán';
    }
  }

  String get bankTransferChannelValue => 'Chuyển khoản';
  String get cashChannelValue => 'Tiền mặt';

  String paymentChannelDisplay(String value) {
    final normalized = value.trim().toLowerCase();
    if (normalized.contains('chuyển khoản') ||
        normalized.contains('transfer') ||
        normalized.contains('bank')) {
      return isEnglish ? 'Bank transfer' : 'Chuyển khoản';
    }
    if (normalized.contains('tiền mặt') || normalized.contains('cash')) {
      return isEnglish ? 'Cash' : 'Tiền mặt';
    }
    return value;
  }
}
