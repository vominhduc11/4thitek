part of 'orders_screen.dart';

class _OrdersTexts {
  const _OrdersTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Orders' : 'Đơn hàng';
  String get searchHint => isEnglish
      ? 'Search order ID, customer, phone, product...'
      : 'Tìm mã đơn, tên khách, SĐT, sản phẩm...';
  String get clearSearchTooltip => isEnglish ? 'Clear search' : 'Xóa tìm kiếm';
  String get statusFilterLabel => isEnglish ? 'Status' : 'Trạng thái';
  String get paymentFilterLabel => isEnglish ? 'Payment' : 'Thanh toán';
  String get allFilterOption => isEnglish ? 'All' : 'Tất cả';
  String get filteredBadgeLabel => isEnglish ? 'Filtered' : 'Đang lọc';
  String get clearFiltersTooltip => isEnglish ? 'Clear filters' : 'Xóa bộ lọc';
  String get sortTooltip => isEnglish ? 'Sort orders' : 'Sắp xếp đơn hàng';
  String get filterSheetTitle => isEnglish ? 'Sort & Filter' : 'Sắp xếp & Lọc';
  String get applyFiltersAction => isEnglish ? 'Apply' : 'Áp dụng';
  String get clearFiltersAction => isEnglish ? 'Clear all' : 'Xóa tất cả';
  String get createOrderAction => isEnglish ? 'Create order' : 'Tạo đơn';
  String get createFirstOrderAction =>
      isEnglish ? 'Create your first order' : 'Tạo đơn hàng đầu tiên';
  String get emptyOrdersTitle =>
      isEnglish ? 'No orders yet' : 'Chưa có đơn hàng';
  String get emptyOrdersDescription => isEnglish
      ? 'Place an order to see your order history here.'
      : 'Hãy đặt hàng để xem lịch sử đơn hàng tại đây.';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get emptyFilteredTitle => isEnglish
      ? 'No matching orders found'
      : 'Không tìm thấy đơn hàng phù hợp';
  String get emptyFilteredDescription => isEnglish
      ? 'Try adjusting your keyword or filters.'
      : 'Thử đổi từ khóa hoặc bộ lọc hiện tại.';
  String get clearFiltersAndSearchAction =>
      isEnglish ? 'Clear filters and search' : 'Xóa bộ lọc và tìm kiếm';
  String get loadOrdersFailedMessage => isEnglish
      ? 'Unable to load orders.'
      : 'Không thể tải danh sách đơn hàng.';
  String get loadMoreOrdersFailedMessage => isEnglish
      ? 'Unable to load more orders.'
      : 'Không thể tải thêm đơn hàng.';
  String get outstandingCriteriaLabel =>
      isEnglish ? 'Remaining balance' : 'Còn phải thanh toán';
  String get confirmCancelTitle =>
      isEnglish ? 'Request cancellation' : 'Gửi yêu cầu hủy đơn';
  String get noAction => isEnglish ? 'No' : 'Không';
  String get cancelOrderAction =>
      isEnglish ? 'Send cancellation request' : 'Gửi yêu cầu hủy';
  String get confirmOrderAction => isEnglish ? 'Confirm' : 'Xác nhận';
  String get startShippingAction => isEnglish ? 'Ship' : 'Giao hàng';
  String get updateOrderStatusFailedMessage => isEnglish
      ? 'Unable to update the order status. Please try again.'
      : 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.';
  String get openOrderDetailsHint =>
      isEnglish ? 'Open order details' : 'Mở chi tiết đơn hàng';
  String get paymentStatusLabel =>
      isEnglish ? 'Payment status:' : 'Trạng thái TT:';
  String get paymentStatusMetricLabel =>
      isEnglish ? 'Payment status' : 'Thanh toán';
  String get totalAmountMetricLabel => isEnglish ? 'Order total' : 'Tổng đơn';
  String get amountPaidMetricLabel => isEnglish ? 'Collected' : 'Đã thu';
  String get serialProgressSectionLabel =>
      isEnglish ? 'Serial progress' : 'Tiến độ serial';

  String sortLabel(OrderSortOption sort) {
    switch (sort) {
      case OrderSortOption.newest:
        return isEnglish ? 'Newest first' : 'Mới nhất';
      case OrderSortOption.highestValue:
        return isEnglish ? 'Highest value' : 'Giá trị cao';
    }
  }

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

  String statusCriteriaLabel(OrderStatus status) =>
      '${isEnglish ? 'Status' : 'Trạng thái'}: ${orderStatusLabel(status)}';

  String paymentCriteriaLabel(OrderPaymentStatus status) =>
      '${isEnglish ? 'Payment' : 'Thanh toán'}: '
      '${orderPaymentStatusLabel(status)}';

  String keywordCriteriaLabel(String value) =>
      '${isEnglish ? 'Keyword' : 'Từ khóa'}: "$value"';

  String confirmCancelDescription(String orderId) => isEnglish
      ? 'Send a cancellation request for order $orderId? An admin will review and approve or reject it.'
      : 'Gửi yêu cầu hủy đơn $orderId? Quản trị viên sẽ xem xét và duyệt hoặc từ chối.';

  String orderSemanticsLabel(Order order) {
    final count = itemCountLabel(order.totalItems);
    return isEnglish
        ? 'Order ${order.id}, ${order.receiverName}, total ${formatVnd(order.total)}, $count'
        : 'Đơn ${order.id}, ${order.receiverName}, tổng ${formatVnd(order.total)}, $count';
  }

  String placedAt(DateTime value) =>
      '${isEnglish ? 'Placed' : 'Đặt'} ${relativeTimeLabel(value)}';

  String itemCountLabel(int count) {
    if (!isEnglish) {
      return '$count sản phẩm';
    }
    return '$count ${count == 1 ? 'item' : 'items'}';
  }

  String paymentMethodSummary(
    BuildContext context,
    OrderPaymentMethod method,
  ) =>
      '${isEnglish ? 'Payment' : 'Thanh toán'}: '
      '${paymentMethodLabel(context, method)}';

  String serialProgressLabel(int processedCount, int totalCount) => isEnglish
      ? 'Serials $processedCount/$totalCount'
      : 'Serial $processedCount/$totalCount';

  String outstandingAmountLabel(int amount) => isEnglish
      ? 'Outstanding: ${formatVnd(amount)}'
      : 'Còn nợ: ${formatVnd(amount)}';

  String pendingCountLabel(int count) => isEnglish
      ? '$count ${count == 1 ? 'pending order' : 'pending orders'}'
      : '$count đơn chờ xử lý';

  String outstandingOrderCountLabel(int count) => isEnglish
      ? '$count ${count == 1 ? 'unpaid order' : 'unpaid orders'}'
      : '$count đơn còn nợ';

  String relativeTimeLabel(DateTime value, {DateTime? now}) {
    final current = (now ?? DateTime.now()).toLocal();
    final target = value.toLocal();
    final diff = current.difference(target);

    if (diff.isNegative) {
      return formatDateTime(target);
    }
    if (diff.inMinutes < 1) {
      return isEnglish ? 'just now' : 'vừa xong';
    }
    if (diff.inHours < 1) {
      final minutes = diff.inMinutes;
      return isEnglish
          ? '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago'
          : '$minutes phút trước';
    }
    if (diff.inDays < 1) {
      final hours = diff.inHours;
      return isEnglish
          ? '$hours ${hours == 1 ? 'hour' : 'hours'} ago'
          : '$hours giờ trước';
    }

    final currentDate = DateTime(current.year, current.month, current.day);
    final targetDate = DateTime(target.year, target.month, target.day);
    final dayDiff = currentDate.difference(targetDate).inDays;

    if (dayDiff == 1) {
      final time =
          '${target.hour.toString().padLeft(2, '0')}:${target.minute.toString().padLeft(2, '0')}';
      return isEnglish ? 'yesterday $time' : 'hôm qua $time';
    }
    if (dayDiff < 7) {
      return isEnglish
          ? '$dayDiff ${dayDiff == 1 ? 'day' : 'days'} ago'
          : '$dayDiff ngày trước';
    }
    return formatDateTime(target);
  }
}

IconData _paymentMethodIcon(OrderPaymentMethod method) {
  switch (method) {
    case OrderPaymentMethod.bankTransfer:
      return Icons.account_balance_outlined;
  }
}
