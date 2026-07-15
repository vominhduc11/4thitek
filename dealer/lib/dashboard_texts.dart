part of 'dashboard_screen.dart';

enum _DashboardTimeFilter { month, quarter }

enum _DashboardLoadState { loading, ready, error }

class _DashboardTexts {
  const _DashboardTexts({required this.isEnglish});

  final bool isEnglish;

  String dashboardSourceSummary(String? orderSyncAt, String? warrantySyncAt) {
    if (isEnglish) {
      if (orderSyncAt != null && warrantySyncAt != null) {
        return 'Dashboard is summarized from synced orders and warranty activity. Orders synced $orderSyncAt, warranty synced $warrantySyncAt.';
      }
      return 'Dashboard is summarized from synced orders and warranty activity.';
    }
    if (orderSyncAt != null && warrantySyncAt != null) {
      return 'Bảng tổng quan được tổng hợp từ đơn hàng và hoạt động bảo hành đã đồng bộ. Đơn hàng đồng bộ lúc $orderSyncAt, bảo hành đồng bộ lúc $warrantySyncAt.';
    }
    return 'Bảng tổng quan được tổng hợp từ đơn hàng và hoạt động bảo hành đã đồng bộ.';
  }

  String warrantyRangeLabel(int dayCount) =>
      isEnglish ? '$dayCount days' : '$dayCount ngày';

  String get loadErrorMessage => isEnglish
      ? 'Unable to load dashboard data. Please try again.'
      : 'Không thể tải dữ liệu bảng tổng quan. Vui lòng thử lại.';
  String get quickActionsTitle =>
      isEnglish ? 'Quick actions' : 'Thao tác nhanh';
  String get quickActionsSubtitle => isEnglish
      ? 'Complete common dealer tasks right from the dashboard without losing context.'
      : 'Hoàn thành các tác vụ đại lý thường dùng ngay từ dashboard mà không mất ngữ cảnh.';
  String get createOrderLabel => isEnglish ? 'New order' : 'Tạo đơn';
  String get inventoryLabel => isEnglish ? 'Inventory' : 'Kho';
  String get warrantyLabel => isEnglish ? 'Warranty' : 'Bảo hành';
  String get trackingSectionTitle =>
      isEnglish ? 'Operational insights' : 'Góc nhìn vận hành';
  String get trackingSectionSubtitle => isEnglish
      ? 'Prioritize revenue and order momentum first, then review supporting inventory and warranty signals.'
      : 'Ưu tiên doanh thu và nhịp đơn hàng trước, sau đó mới rà các tín hiệu hỗ trợ từ kho và bảo hành.';
  String get mobileInsightsTitle =>
      isEnglish ? 'Inventory and warranty' : 'Kho và bảo hành';
  String get mobileInsightsSubtitle => isEnglish
      ? 'Secondary charts stay collapsed on mobile, but remain available when needed.'
      : 'Các biểu đồ phụ được thu gọn trên mobile nhưng vẫn sẵn sàng khi cần.';
  String get secondaryInsightsTitle =>
      isEnglish ? 'Supporting insights' : 'Chỉ báo hỗ trợ';
  String get secondaryInsightsSubtitle => isEnglish
      ? 'Use these panels for stock and activation follow-up after reviewing the primary metrics.'
      : 'Dùng nhóm này để rà tồn kho và kích hoạt sau khi đã xem các chỉ số ưu tiên.';
  String get recentOrdersTitle =>
      isEnglish ? 'Recent orders' : 'Đơn hàng gần đây';
  String get recentOrdersSubtitle => isEnglish
      ? 'Keep track of the latest orders in the current reporting window.'
      : 'Theo dõi những đơn mới nhất trong kỳ đang xem.';
  String get viewAllAction => isEnglish ? 'View all' : 'Xem tất cả';
  String pendingOrdersAction(int count) =>
      isEnglish ? '$count pending' : '$count đơn chờ';
  String get processOrderLabel => isEnglish ? 'Process' : 'Xử lý';
  String get recentOrdersEmptyMessage => isEnglish
      ? 'There are no orders in the selected period yet.'
      : 'Chưa có đơn hàng nào trong kỳ đã chọn.';
  String get recentOrdersEmptyDescription => isEnglish
      ? 'Create a new order to start tracking activity.'
      : 'Hãy tạo đơn hàng mới để bắt đầu theo dõi hoạt động.';
  String get createOrderAction => isEnglish ? 'Create order' : 'Tạo đơn hàng';
  String get createOrderSemanticLabel =>
      isEnglish ? 'Create a new order' : 'Tạo đơn hàng mới';
  String get appBarTitle => isEnglish ? 'Overview' : 'Tổng quan';
  String get previousPeriodTooltip =>
      isEnglish ? 'Previous period' : 'Kỳ trước';
  String get timeFilterTooltip =>
      isEnglish ? 'Filter time range' : 'Lọc thời gian';
  String get nextPeriodTooltip => isEnglish ? 'Next period' : 'Kỳ sau';
  String revenueChipLabel(int amount) => isEnglish
      ? 'Revenue ${_formatCompactVnd(amount)}'
      : 'Doanh thu ${_formatCompactVnd(amount)}';
  String orderCountChipLabel(int count) =>
      isEnglish ? '$count orders' : '$count đơn';

  String periodUnitLabel(_DashboardTimeFilter filter) {
    switch (filter) {
      case _DashboardTimeFilter.month:
        return isEnglish ? 'month' : 'tháng';
      case _DashboardTimeFilter.quarter:
        return isEnglish ? 'quarter' : 'quý';
    }
  }

  String periodContextLabel(DateTime date, _DashboardTimeFilter filter) {
    if (filter == _DashboardTimeFilter.month) {
      return isEnglish
          ? 'Month ${date.month}/${date.year}'
          : 'Tháng ${date.month}/${date.year}';
    }
    final quarter = ((date.month - 1) ~/ 3) + 1;
    return isEnglish
        ? 'Quarter $quarter/${date.year}'
        : 'Quý $quarter/${date.year}';
  }

  String get overviewTitle =>
      isEnglish ? 'Operational overview' : 'Tổng quan vận hành';
  String overviewContext(String contextLabel) => isEnglish
      ? 'Reporting window: $contextLabel'
      : 'Kỳ theo dõi: $contextLabel';
  String overviewRevenueLabel(String periodUnitLabel) => isEnglish
      ? 'Purchase value this $periodUnitLabel'
      : 'Giá trị nhập hàng trong $periodUnitLabel';
  String get overviewOutstandingLabel =>
      isEnglish ? 'Outstanding balance' : 'Còn phải thanh toán';
  String overviewOrdersLabel(String periodUnitLabel) =>
      isEnglish ? 'Orders this $periodUnitLabel' : 'Đơn trong $periodUnitLabel';

  String completionRateLabel(int completed, int total) {
    if (total == 0) {
      return isEnglish ? 'Completion rate' : 'Tỷ lệ hoàn thành';
    }
    return isEnglish
        ? 'Completion rate ($completed/$total)'
        : 'Tỷ lệ hoàn thành ($completed/$total)';
  }

  String get dashboardErrorTitle => isEnglish
      ? 'Unable to load dashboard data'
      : 'Không thể tải dữ liệu bảng tổng quan';
  String get dashboardErrorDescription => isEnglish
      ? 'Please try again or check your network connection.'
      : 'Vui lòng thử lại hoặc kiểm tra kết nối mạng.';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get retryDashboardSemantic => isEnglish
      ? 'Retry loading dashboard data'
      : 'Thử tải lại dữ liệu bảng tổng quan';

  String get filterSheetTitle => isEnglish ? 'Time filter' : 'Lọc thời gian';
  String get filterByMonthLabel => isEnglish ? 'By month' : 'Theo tháng';
  String get filterByQuarterLabel => isEnglish ? 'By quarter' : 'Theo quý';
  String get previousPeriodLabel => isEnglish ? 'Previous period' : 'Kỳ trước';
  String get nextPeriodLabel => isEnglish ? 'Next period' : 'Kỳ sau';
  String get pickMonthLabel => isEnglish ? 'Pick month' : 'Chọn tháng';
  String get pickQuarterLabel => isEnglish ? 'Pick quarter' : 'Chọn quý';
  String get pickFromCalendarLabel =>
      isEnglish ? 'Pick from calendar' : 'Chọn từ lịch';
  String get backToCurrentLabel =>
      isEnglish ? 'Back to current' : 'Về hiện tại';
  String get applyAction => isEnglish ? 'Apply' : 'Áp dụng';

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

  String paymentStatusShort(OrderPaymentStatus status) {
    switch (status) {
      case OrderPaymentStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
      case OrderPaymentStatus.pending:
        return isEnglish ? 'Unpaid' : 'Chưa thanh toán';
      case OrderPaymentStatus.paid:
        return isEnglish ? 'Paid' : 'Đã thanh toán';
    }
  }

  String recentOrderItemsLabel(int count) =>
      isEnglish ? '$count items' : '$count sản phẩm';

  String recentOrderMeta(
    DateTime createdAt,
    int totalItems,
    OrderPaymentStatus paymentStatus,
  ) {
    return '${_formatRecentOrderMetaDate(createdAt)} • ${recentOrderItemsLabel(totalItems)} • ${paymentStatusShort(paymentStatus)}';
  }

  String get lowStockThresholdLabel =>
      isEnglish ? 'Stock / Threshold' : 'Tồn / Ngưỡng';

  String lowStockStatusLabel(int shortage) => shortage > 0
      ? (isEnglish
            ? 'Missing $shortage against threshold $_lowStockAlertThreshold'
            : 'Thiếu $shortage so với ngưỡng $_lowStockAlertThreshold')
      : (isEnglish ? 'At warning threshold' : 'Chạm ngưỡng cảnh báo');

  String lowStockMinimumLabel(int minimumTarget, int shortageToMinimum) =>
      shortageToMinimum > 0
      ? (isEnglish
            ? 'Min $minimumTarget (missing $shortageToMinimum)'
            : 'Min $minimumTarget (thiếu $shortageToMinimum)')
      : 'Min: $minimumTarget';

  String lowStockHeaderTitle(bool hasAlerts) => hasAlerts
      ? (isEnglish ? 'Low-stock alerts' : 'Cảnh báo tồn kho thấp')
      : (isEnglish ? 'Inventory is stable' : 'Tồn kho ổn định');

  String lowStockHeaderSubtitle(bool hasAlerts) => hasAlerts
      ? (isEnglish
            ? 'High priority, inventory replenishment is needed soon.'
            : 'Mức ưu tiên cao, cần bổ sung hàng sớm.')
      : (isEnglish
            ? 'No SKU is currently below the warning threshold.'
            : 'Hiện chưa có SKU nào dưới ngưỡng cảnh báo.');

  String get lowStockEmptyTitle =>
      isEnglish ? 'No alerts need attention' : 'Không có cảnh báo cần xử lý';
  String get lowStockEmptyMessage => isEnglish
      ? 'No product is currently below the warning threshold.'
      : 'Hiện chưa có sản phẩm nào dưới ngưỡng cảnh báo.';
  String get lowStockEmptyDescription => isEnglish
      ? 'You can open detailed inventory to review it regularly.'
      : 'Bạn có thể mở tồn kho chi tiết để kiểm tra định kỳ.';
  String get viewInventoryAction =>
      isEnglish ? 'View inventory' : 'Xem tồn kho';
  String get openInventorySemantic =>
      isEnglish ? 'Open inventory list' : 'Mở danh sách tồn kho';
  String get replenishNowAction =>
      isEnglish ? 'Replenish now' : 'Nhập thêm ngay';
  String lowStockSkuCountLabel(int count) => '$count SKU';

  String get orderDistributionTitle =>
      isEnglish ? 'Order status distribution' : 'Phân bố trạng thái đơn';
  String get orderDistributionHint => isEnglish
      ? 'Tap each status to view the corresponding order list.'
      : 'Chạm vào từng trạng thái để xem danh sách đơn tương ứng.';
  String get orderDistributionEmptyMessage => isEnglish
      ? 'You do not have any orders yet.'
      : 'Bạn chưa có đơn hàng nào.';
  String get orderDistributionEmptyDescription => isEnglish
      ? 'Create a new order to start tracking status.'
      : 'Hãy tạo đơn hàng mới để bắt đầu theo dõi trạng thái.';
  String get createOrderToTrackSemantic => isEnglish
      ? 'Create a new order to track status'
      : 'Tạo đơn hàng mới để theo dõi trạng thái';
  String orderCountPercentLabel(int count, int percent) =>
      isEnglish ? '$count orders ($percent%)' : '$count đơn ($percent%)';
  String get selectedStatusListDescription => isEnglish
      ? 'Orders in the selected status'
      : 'Danh sách đơn theo trạng thái đã chọn';
  String get noMatchingOrdersTitle =>
      isEnglish ? 'No matching orders' : 'Chưa có đơn phù hợp';
  String get noMatchingOrdersMessage => isEnglish
      ? 'There are no orders in this status.'
      : 'Không có đơn nào ở trạng thái này.';
  String get noMatchingOrdersDescription => isEnglish
      ? 'Choose another status or switch the tracking period.'
      : 'Hãy chọn trạng thái khác hoặc chuyển kỳ theo dõi.';

  String get warrantyStatusTitle =>
      isEnglish ? 'Serial status' : 'Trạng thái serial';
  String get metricUnavailableLabel =>
      isEnglish ? 'Unavailable' : 'Chưa có dữ liệu';
  String warrantyStatusUnavailableMessage(int activationCount) {
    if (isEnglish) {
      return activationCount > 0
          ? '$activationCount warranty activations were found, but there is no real serial-status breakdown for this dashboard card yet.'
          : 'There is no real serial-status breakdown for this dashboard card yet.';
    }
    return activationCount > 0
        ? 'Đã có $activationCount lượt kích hoạt bảo hành, nhưng chưa có dữ liệu trạng thái serial thực để tổng hợp cho thẻ này.'
        : 'Chưa có dữ liệu trạng thái serial thực để tổng hợp cho thẻ này.';
  }

  String get warrantyStatusUnavailableDescription => isEnglish
      ? 'The app currently has activation history, but backend data for real serial-status categories is not available here.'
      : 'Ứng dụng hiện có lịch sử kích hoạt, nhưng backend chưa cung cấp nhóm trạng thái serial thực cho màn hình này.';
}
