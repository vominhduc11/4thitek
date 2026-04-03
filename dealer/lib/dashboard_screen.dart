import 'dart:async';
import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'global_search.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'notifications_screen.dart';
import 'widgets/notification_icon_button.dart';
import 'orders_screen.dart';
import 'product_list_screen.dart';
import 'utils.dart';
import 'warranty_controller.dart';
import 'warranty_hub_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/skeleton_box.dart';
import 'debt_tracking_screen.dart';
import 'inventory_screen.dart';

part 'dashboard_screen_support.dart';

const _lowStockAlertThreshold = kLowStockThreshold;
const _mobileBreakpoint = AppBreakpoints.phone;
const _tabletBreakpoint = AppBreakpoints.tablet;
const _desktopBreakpoint = AppBreakpoints.desktop;
const _overviewCompactBreakpoint = 480.0;
const _donutStackBreakpoint = 600.0;
const _compactDebtRowBreakpoint = 420.0;
const _maxDashboardContentWidth = 1280.0;
const _dashboardCardRadius = 20.0;
const _dashboardCardPadding = 18.0;
const _dashboardSectionSpacing = 16.0;
const _dashboardCompactSpacing = 12.0;
const _dashboardGridSpacing = 12.0;

Color _dashboardMutedText(BuildContext context) =>
    Theme.of(context).colorScheme.onSurfaceVariant;

ShapeBorder _dashboardCardShape(
  BuildContext context, {
  double radius = _dashboardCardRadius,
  Color? borderColor,
  double borderWidth = 1,
}) {
  return RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(radius),
    side: BorderSide(
      color:
          borderColor ??
          Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.6),
      width: borderWidth,
    ),
  );
}

class _DashboardSurfaceCard extends StatelessWidget {
  const _DashboardSurfaceCard({
    required this.child,
    this.color,
    this.padding = const EdgeInsets.all(_dashboardCardPadding),
    this.borderColor,
  });

  final Widget child;
  final Color? color;
  final EdgeInsetsGeometry padding;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: color,
      shape: _dashboardCardShape(context, borderColor: borderColor),
      child: Padding(padding: padding, child: child),
    );
  }
}

class _DashboardCardHeader extends StatelessWidget {
  const _DashboardCardHeader({
    required this.title,
    this.subtitle,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subtitle = this.subtitle;
    final titleBlock = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        if (subtitle != null && subtitle.trim().isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: theme.textTheme.bodySmall?.copyWith(
              color: _dashboardMutedText(context),
              height: 1.45,
            ),
          ),
        ],
      ],
    );

    if (trailing == null) {
      return titleBlock;
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final stackTrailing = constraints.maxWidth < 420;
        if (stackTrailing) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [titleBlock, const SizedBox(height: 12), trailing!],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: titleBlock),
            const SizedBox(width: 12),
            trailing!,
          ],
        );
      },
    );
  }
}

class _DashboardStatBadge extends StatelessWidget {
  const _DashboardStatBadge({
    required this.icon,
    required this.label,
    this.backgroundColor,
    this.foregroundColor,
  });

  final IconData icon;
  final String label;
  final Color? backgroundColor;
  final Color? foregroundColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final background = backgroundColor ?? theme.colorScheme.surfaceContainerLow;
    final foreground = foregroundColor ?? theme.colorScheme.onSurface;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.85),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: foreground),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.labelMedium?.copyWith(
                color: foreground,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardPeriodHeaderCard extends StatelessWidget {
  const _DashboardPeriodHeaderCard({
    required this.periodContextLabel,
    required this.filterLabel,
    required this.compactPeriodLabel,
    required this.summary,
    required this.previousLabel,
    required this.nextLabel,
    required this.onPreviousPeriod,
    required this.onOpenTimeFilter,
    required this.onNextPeriod,
    this.warningMessage,
  });

  final String periodContextLabel;
  final String filterLabel;
  final String compactPeriodLabel;
  final String summary;
  final String previousLabel;
  final String nextLabel;
  final VoidCallback onPreviousPeriod;
  final VoidCallback onOpenTimeFilter;
  final VoidCallback? onNextPeriod;
  final String? warningMessage;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final hasWarning =
        warningMessage != null && warningMessage!.trim().isNotEmpty;

    return _DashboardSurfaceCard(
      color: hasWarning
          ? colorScheme.errorContainer.withValues(alpha: 0.26)
          : colorScheme.surfaceContainerLow,
      borderColor: hasWarning
          ? colorScheme.error.withValues(alpha: 0.35)
          : colorScheme.outlineVariant.withValues(alpha: 0.85),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _DashboardStatBadge(
                icon: Icons.calendar_month_outlined,
                label: filterLabel,
                backgroundColor: colorScheme.surface,
              ),
              _DashboardStatBadge(
                icon: hasWarning
                    ? Icons.sync_problem_outlined
                    : Icons.cloud_done_outlined,
                label: hasWarning ? warningMessage!.trim() : summary,
                backgroundColor: hasWarning
                    ? colorScheme.errorContainer.withValues(alpha: 0.4)
                    : colorScheme.surface,
                foregroundColor: hasWarning
                    ? colorScheme.onErrorContainer
                    : colorScheme.onSurface,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            periodContextLabel,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w800,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            summary,
            style: theme.textTheme.bodySmall?.copyWith(
              color: _dashboardMutedText(context),
              height: 1.45,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              final compactControls = constraints.maxWidth < 560;
              final stackControls = constraints.maxWidth < 440;
              final previousButton = compactControls
                  ? OutlinedButton(
                      onPressed: onPreviousPeriod,
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 50),
                      ),
                      child: const Icon(Icons.chevron_left_rounded),
                    )
                  : OutlinedButton.icon(
                      onPressed: onPreviousPeriod,
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 50),
                      ),
                      icon: const Icon(Icons.chevron_left_rounded),
                      label: Text(previousLabel),
                    );
              final filterButton = FilledButton.tonalIcon(
                onPressed: onOpenTimeFilter,
                style: FilledButton.styleFrom(
                  minimumSize: const Size(0, 50),
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                ),
                icon: const Icon(Icons.tune_rounded, size: 18),
                label: Text(compactPeriodLabel),
              );
              final nextButton = compactControls
                  ? OutlinedButton(
                      onPressed: onNextPeriod,
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 50),
                      ),
                      child: const Icon(Icons.chevron_right_rounded),
                    )
                  : OutlinedButton.icon(
                      onPressed: onNextPeriod,
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(0, 50),
                      ),
                      icon: const Icon(Icons.chevron_right_rounded),
                      label: Text(nextLabel),
                    );

              if (stackControls) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Expanded(child: previousButton),
                        const SizedBox(width: 8),
                        Expanded(child: nextButton),
                      ],
                    ),
                    const SizedBox(height: 8),
                    filterButton,
                  ],
                );
              }

              return Row(
                children: [
                  Expanded(child: previousButton),
                  const SizedBox(width: 8),
                  Expanded(flex: compactControls ? 2 : 3, child: filterButton),
                  const SizedBox(width: 8),
                  Expanded(child: nextButton),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

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
      ? 'Keep common dealer tasks within one tap instead of switching between tabs.'
      : 'Ưu tiên các tác vụ đại lý dùng thường xuyên để giảm số lần chuyển tab.';
  String get createOrderLabel => isEnglish ? 'New order' : 'Tạo đơn';
  String get debtLabel => isEnglish ? 'Debt' : 'Công nợ';
  String get inventoryLabel => isEnglish ? 'Inventory' : 'Kho';
  String get warrantyLabel => isEnglish ? 'Warranty' : 'Bảo hành';
  String get trackingSectionTitle =>
      isEnglish ? 'Operational insights' : 'Hiệu suất theo dõi';
  String get mobileInsightsTitle =>
      isEnglish ? 'Inventory and warranty' : 'Kho và bảo hành';
  String get mobileInsightsSubtitle => isEnglish
      ? 'Secondary charts stay collapsed on mobile, but remain available when needed.'
      : 'Ẩn bớt biểu đồ phụ trên mobile, nhưng vẫn giữ đủ insight khi cần.';
  String get recentOrdersTitle =>
      isEnglish ? 'Recent orders' : 'Đơn hàng gần đây';
  String get viewAllAction => isEnglish ? 'View all' : 'Xem tất cả';
  String get recentOrdersEmptyMessage => isEnglish
      ? 'There are no orders in the selected period yet.'
      : 'Bạn chưa có đơn hàng nào trong kỳ đã chọn.';
  String get recentOrdersEmptyDescription => isEnglish
      ? 'Create a new order to start tracking activity.'
      : 'Hãy tạo đơn hàng mới để bắt đầu theo dõi.';
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
      ? 'Data window: $contextLabel'
      : 'Bối cảnh dữ liệu: $contextLabel';
  String overviewRevenueLabel(String periodUnitLabel) => isEnglish
      ? 'Purchase value this $periodUnitLabel'
      : 'Giá trị nhập hàng trong $periodUnitLabel';
  String get overviewDebtLabel =>
      isEnglish ? 'Total outstanding debt' : 'Tổng công nợ';
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
      case OrderStatus.shipping:
        return isEnglish ? 'Shipping' : 'Đang giao';
      case OrderStatus.completed:
        return isEnglish ? 'Completed' : 'Hoàn thành';
      case OrderStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
    }
  }

  String paymentStatusShort(OrderPaymentStatus status) {
    switch (status) {
      case OrderPaymentStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
      case OrderPaymentStatus.failed:
        return isEnglish ? 'Failed' : 'Thất bại';
      case OrderPaymentStatus.pending:
        return isEnglish ? 'Unpaid' : 'Chưa thanh toán';
      case OrderPaymentStatus.paid:
        return isEnglish ? 'Paid' : 'Đã thanh toán';
      case OrderPaymentStatus.debtRecorded:
        return isEnglish ? 'Debt' : 'Công nợ';
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
            : 'Mức ưu tiên cao, cần bổ sung hàng ngay.')
      : (isEnglish
            ? 'No SKU is currently below the warning threshold.'
            : 'Chưa có SKU nào dưới ngưỡng cảnh báo.');

  String get lowStockEmptyTitle =>
      isEnglish ? 'No alerts need attention' : 'Không có cảnh báo cần xử lý';
  String get lowStockEmptyMessage => isEnglish
      ? 'No product is currently below the warning threshold.'
      : 'Hiện chưa có sản phẩm nào dưới ngưỡng cảnh báo.';
  String get lowStockEmptyDescription => isEnglish
      ? 'You can open detailed inventory to review it regularly.'
      : 'Bạn có thể xem tồn kho chi tiết để kiểm tra định kỳ.';
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
      : 'Hãy tạo đơn hàng mới để bắt đầu theo dõi.';
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

  String get debtAgingTitle =>
      isEnglish ? 'Debt by age' : 'Công nợ theo tuổi nợ';
  String get viewDebtListAction => isEnglish ? 'View list' : 'Xem danh sách';
  String totalDebtLabel(int total) => isEnglish
      ? 'Total debt: ${formatVnd(total)}'
      : 'Tổng công nợ: ${formatVnd(total)}';
  String get debtAgingHint => isEnglish
      ? 'Debt aging is grouped by order creation date for orders that still have an outstanding balance.'
      : 'Tuổi nợ được nhóm theo ngày tạo đơn với các đơn vẫn còn dư nợ.';
  String get debtAgingEmptyMessage => isEnglish
      ? 'No debt has been recorded yet.'
      : 'Hiện chưa có công nợ phát sinh.';
  String get debtAgingEmptyDescription => isEnglish
      ? 'Debt will appear after transactions are recorded.'
      : 'Công nợ sẽ hiển thị sau khi có giao dịch.';
  String get openDebtListAction =>
      isEnglish ? 'Open debt list' : 'Mở danh sách công nợ';
  String get openDebtListSemantic =>
      isEnglish ? 'Open debt list' : 'Mở danh sách công nợ';
  String bucketValueLabel(int amount) => isEnglish
      ? 'Value: ${formatVnd(amount)}'
      : 'Giá trị: ${formatVnd(amount)}';

  String bucketDescription(_DebtBucket bucket) {
    if (bucket.minDay >= 91) {
      return isEnglish
          ? 'This overdue bucket is high risk and should be prioritized for follow-up.'
          : 'Nhóm nợ quá hạn cao, cần ưu tiên theo dõi và thu hồi.';
    }
    return isEnglish
        ? 'This bucket includes debts from ${bucket.minDay} to ${bucket.maxDay} days.'
        : 'Nhóm này bao gồm các khoản nợ từ ${bucket.minDay} đến ${bucket.maxDay} ngày.';
  }

  String get over90DayNote => isEnglish
      ? '>90 days includes all overdue debt from 91 days onward.'
      : '>90 ngày bao gồm toàn bộ công nợ quá hạn từ 91 ngày trở lên.';

  String get warrantyStatusTitle =>
      isEnglish ? 'Serial status' : 'Trạng thái serial';
  String get metricUnavailableLabel =>
      isEnglish ? 'Unavailable' : 'Chưa có dữ liệu thật';
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
      : 'Hiện app chỉ có lịch sử kích hoạt; backend chưa cung cấp nhóm trạng thái serial thực cho màn hình này.';

  String debtBucketRangeLabel(int minDay, int maxDay) {
    if (maxDay >= 9999) {
      return isEnglish ? '>90 days' : '>90 ngày';
    }
    return isEnglish ? '$minDay-$maxDay days' : '$minDay-$maxDay ngày';
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, this.onSwitchTab});

  final ValueChanged<int>? onSwitchTab;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  _DashboardLoadState _loadState = _DashboardLoadState.loading;
  String? _loadErrorMessage;
  String? _syncWarningMessage;
  _DashboardTimeFilter _timeFilter = _DashboardTimeFilter.month;
  DateTime _selectedPeriod = DateTime.now();

  // Snapshot cache — avoids recomputation when inputs haven't changed.
  _DashboardSnapshot? _cachedSnapshot;
  List<Order>? _lastSnapshotOrders;
  List<WarrantyActivationRecord>? _lastSnapshotActivations;
  _DashboardTimeFilter? _lastSnapshotFilter;
  DateTime? _lastSnapshotPeriod;
  List<_DashboardLowStockItem>? _cachedLowStockProducts;
  List<Order>? _lastLowStockOrders;
  List<WarrantyActivationRecord>? _lastLowStockActivations;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        unawaited(_loadDashboardState());
      }
    });
  }

  Future<void> _loadDashboardState({bool showLoadingState = true}) async {
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final loadErrorMessage = texts.loadErrorMessage;
    final orderController = OrderScope.of(context);
    final warrantyController = WarrantyScope.of(context);
    if (showLoadingState && mounted) {
      setState(() {
        _loadState = _DashboardLoadState.loading;
        _loadErrorMessage = null;
        _syncWarningMessage = null;
      });
    }

    await Future.wait<void>([
      orderController.refresh(),
      warrantyController.load(forceRefresh: true),
    ]);
    if (!mounted) {
      return;
    }

    final warnings = <String>{};
    if (orderController.lastActionMessage != null) {
      warnings.add(
        orderControllerErrorMessage(
          orderController.lastActionMessage,
          isEnglish: texts.isEnglish,
        ),
      );
    }
    if (warrantyController.lastSyncMessage != null) {
      warnings.add(
        warrantySyncErrorMessage(
          warrantyController.lastSyncMessage,
          isEnglish: texts.isEnglish,
        ),
      );
    }
    final warningMessage = warnings.isEmpty ? null : warnings.join('\n');
    final shouldShowError =
        orderController.orders.isEmpty &&
        warrantyController.activations.isEmpty &&
        warnings.isNotEmpty;

    setState(() {
      _cachedSnapshot = null;
      _lastSnapshotOrders = null;
      _lastSnapshotActivations = null;
      _lastSnapshotFilter = null;
      _lastSnapshotPeriod = null;
      _cachedLowStockProducts = null;
      _lastLowStockOrders = null;
      _lastLowStockActivations = null;
      _syncWarningMessage = warningMessage;
      _loadState = shouldShowError
          ? _DashboardLoadState.error
          : _DashboardLoadState.ready;
      _loadErrorMessage = shouldShowError
          ? (warningMessage ?? loadErrorMessage)
          : null;
    });
  }

  void _openCreateOrderFlow() {
    if (widget.onSwitchTab != null) {
      widget.onSwitchTab!(0);
      return;
    }
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const ProductListScreen()));
  }

  void _openDebtTracking() {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const DebtTrackingScreen()));
  }

  void _openInventoryScreen() {
    if (widget.onSwitchTab != null) {
      widget.onSwitchTab!(3);
      return;
    }
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const InventoryScreen()));
  }

  void _openLowStockInventoryScreen() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const InventoryScreen(
          initialStockFilter: InventoryStockFilter.lowStock,
        ),
      ),
    );
  }

  void _openOrdersScreen() {
    if (widget.onSwitchTab != null) {
      widget.onSwitchTab!(1);
      return;
    }
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const OrdersScreen()));
  }

  void _openOrderDetail(String orderId) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: orderId)),
    );
  }

  Future<void> _openWarrantyHub() async {
    await Future.wait<void>([
      OrderScope.of(context).refresh(),
      WarrantyScope.of(context).load(forceRefresh: true),
    ]);
    if (!mounted) {
      return;
    }
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const WarrantyHubScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final orderController = OrderScope.of(context);
    final warrantyCtrl = WarrantyScope.of(context);
    final snapshotOrdersForLowStock = orderController.orders;
    final snapshotActivationsForLowStock = warrantyCtrl.activations;
    if (_cachedLowStockProducts == null ||
        !identical(_lastLowStockOrders, snapshotOrdersForLowStock) ||
        !identical(_lastLowStockActivations, snapshotActivationsForLowStock)) {
      _lastLowStockOrders = snapshotOrdersForLowStock;
      _lastLowStockActivations = snapshotActivationsForLowStock;
      _cachedLowStockProducts = _buildLowStockProducts(
        orderController: orderController,
        warrantyController: warrantyCtrl,
      );
    }
    final lowStockProducts = _cachedLowStockProducts!;
    final now = DateTime.now();
    final snapshotOrders = orderController.orders;
    final snapshotActivations = warrantyCtrl.activations;
    if (_cachedSnapshot == null ||
        !identical(_lastSnapshotOrders, snapshotOrders) ||
        !identical(_lastSnapshotActivations, snapshotActivations) ||
        _lastSnapshotFilter != _timeFilter ||
        _lastSnapshotPeriod != _selectedPeriod) {
      _lastSnapshotOrders = snapshotOrders;
      _lastSnapshotActivations = snapshotActivations;
      _lastSnapshotFilter = _timeFilter;
      _lastSnapshotPeriod = _selectedPeriod;
      _cachedSnapshot = _buildDashboardSnapshot(
        orders: snapshotOrders,
        activations: snapshotActivations,
        timeFilter: _timeFilter,
        selectedPeriod: _selectedPeriod,
        now: now,
        isEnglish: texts.isEnglish,
      );
    }
    final snapshot = _cachedSnapshot!;
    final periodAnchor = snapshot.periodAnchor;
    final periodOrders = snapshot.periodOrders;
    final monthlyRevenue = snapshot.monthlyRevenue;
    final activationWindowDays = snapshot.activationWindowDays;
    final activationSeries = snapshot.activationSeries;
    final warrantyActivationSeries = snapshot.warrantyActivationSeries;
    final warrantyRanges = snapshot.warrantyRanges;
    final periodContextLabel = snapshot.periodContextLabel;
    final periodRevenue = snapshot.periodRevenue;
    final periodOrderCount = snapshot.periodOrderCount;
    final periodCompletedOrderCount = snapshot.periodCompletedOrderCount;
    final totalOutstandingDebt = snapshot.totalOutstandingDebt;
    final unreadNotificationCount =
        context
            .dependOnInheritedWidgetOfExactType<NotificationScope>()
            ?.notifier
            ?.unreadCount ??
        0;
    final periodUnitLabel = snapshot.periodUnitLabel;
    final dashboardLoadErrorMessage = texts.loadErrorMessage;
    final syncSummary = texts.dashboardSourceSummary(
      orderController.lastRemoteSyncAt == null
          ? null
          : formatDateTime(orderController.lastRemoteSyncAt!),
      warrantyCtrl.lastRemoteSyncAt == null
          ? null
          : formatDateTime(warrantyCtrl.lastRemoteSyncAt!),
    );
    final primaryTrackingCards = <Widget>[
      FadeSlideIn(
        delay: const Duration(milliseconds: 110),
        child: RepaintBoundary(
          child: _RevenueChartCard(
            data: monthlyRevenue,
            focusMonth: periodAnchor.month,
            displayYear: periodAnchor.year,
            onCreateOrder: _openCreateOrderFlow,
          ),
        ),
      ),
      FadeSlideIn(
        delay: const Duration(milliseconds: 115),
        child: RepaintBoundary(
          child: _OrderStatusDistributionCard(
            orders: periodOrders,
            onCreateOrder: _openCreateOrderFlow,
          ),
        ),
      ),
      FadeSlideIn(
        delay: const Duration(milliseconds: 120),
        child: RepaintBoundary(
          child: _AgingDebtCard(
            buckets: _buildDebtBuckets(snapshotOrders, now: now, texts: texts),
            onViewAll: _openDebtTracking,
          ),
        ),
      ),
    ];
    final secondaryTrackingCards = <Widget>[
      FadeSlideIn(
        delay: const Duration(milliseconds: 125),
        child: RepaintBoundary(
          child: _LowStockPanel(
            products: lowStockProducts,
            onOpenInventory: _openInventoryScreen,
            onOpenLowStockInventory: _openLowStockInventoryScreen,
          ),
        ),
      ),
      FadeSlideIn(
        delay: const Duration(milliseconds: 130),
        child: RepaintBoundary(
          child: _ActivationTrendCard(
            data: activationSeries,
            windowDays: activationWindowDays,
          ),
        ),
      ),
      FadeSlideIn(
        delay: const Duration(milliseconds: 135),
        child: RepaintBoundary(
          child: _WarrantyStatusDonutCard(
            activations: warrantyActivationSeries,
            ranges: warrantyRanges,
            initialRange: warrantyRanges.last,
          ),
        ),
      ),
    ];

    final screenSize = MediaQuery.sizeOf(context);
    final screenWidth = screenSize.width;
    final isMobile = screenWidth < _mobileBreakpoint;
    final canMoveNextPeriod = _dashboardCanMoveToNextPeriod(
      periodAnchor,
      _timeFilter,
      now,
    );
    final horizontalPadding = screenWidth >= _desktopBreakpoint
        ? 24.0
        : isMobile
        ? 16.0
        : 20.0;
    final listBottomPadding = 24.0;
    final sectionSpacing = isMobile
        ? _dashboardCompactSpacing
        : _dashboardSectionSpacing;
    final timeFilterLabel = _timeFilter == _DashboardTimeFilter.month
        ? texts.filterByMonthLabel
        : texts.filterByQuarterLabel;

    final Widget content;
    if (_loadState == _DashboardLoadState.loading) {
      content = _DashboardLoadingView(horizontalPadding: horizontalPadding);
    } else if (_loadState == _DashboardLoadState.error) {
      content = _DashboardErrorView(
        title: texts.dashboardErrorTitle,
        message: _loadErrorMessage ?? dashboardLoadErrorMessage,
        description: texts.dashboardErrorDescription,
        ctaLabel: texts.retryAction,
        ctaSemanticLabel: texts.retryDashboardSemantic,
        onRetry: () => unawaited(_loadDashboardState()),
        horizontalPadding: horizontalPadding,
      );
    } else {
      content = RefreshIndicator(
        onRefresh: () => _loadDashboardState(showLoadingState: false),
        child: ListView(
          key: const PageStorageKey<String>('dashboard-scroll'),
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(
            horizontalPadding,
            sectionSpacing,
            horizontalPadding,
            listBottomPadding,
          ),
          children: [
            FadeSlideIn(
              child: RepaintBoundary(
                child: _DashboardPeriodHeaderCard(
                  periodContextLabel: periodContextLabel,
                  filterLabel: timeFilterLabel,
                  compactPeriodLabel: _periodCompactLabelFor(
                    periodAnchor,
                    _timeFilter,
                  ),
                  summary: syncSummary,
                  previousLabel: texts.previousPeriodLabel,
                  nextLabel: texts.nextPeriodLabel,
                  onPreviousPeriod: _moveToPreviousPeriod,
                  onOpenTimeFilter: _openTimeFilterSheet,
                  onNextPeriod: canMoveNextPeriod ? _moveToNextPeriod : null,
                  warningMessage: _syncWarningMessage,
                ),
              ),
            ),
            SizedBox(height: sectionSpacing),
            FadeSlideIn(
              child: RepaintBoundary(
                child: _OverviewCard(
                  totalDebt: totalOutstandingDebt,
                  periodRevenue: periodRevenue,
                  periodOrders: periodOrderCount,
                  periodCompletedOrders: periodCompletedOrderCount,
                  periodUnitLabel: periodUnitLabel,
                  contextLabel: periodContextLabel,
                  texts: texts,
                ),
              ),
            ),
            SizedBox(height: sectionSpacing),
            FadeSlideIn(
              delay: const Duration(milliseconds: 70),
              child: RepaintBoundary(
                child: _DashboardQuickActionsCard(
                  onCreateOrder: _openCreateOrderFlow,
                  onOpenDebtTracking: _openDebtTracking,
                  onOpenInventory: _openInventoryScreen,
                  onOpenWarrantyHub: _openWarrantyHub,
                  title: texts.quickActionsTitle,
                  subtitle: texts.quickActionsSubtitle,
                  createOrderLabel: texts.createOrderLabel,
                  debtLabel: texts.debtLabel,
                  inventoryLabel: texts.inventoryLabel,
                  warrantyLabel: texts.warrantyLabel,
                ),
              ),
            ),
            SizedBox(height: sectionSpacing),
            FadeSlideIn(
              delay: const Duration(milliseconds: 95),
              child: _SectionTitle(title: texts.trackingSectionTitle),
            ),
            const SizedBox(height: 8),
            if (isMobile) ...[
              ...primaryTrackingCards.map(
                (card) => Padding(
                  padding: const EdgeInsets.only(
                    bottom: _dashboardCompactSpacing,
                  ),
                  child: card,
                ),
              ),
              _DashboardExpandableInsights(
                title: texts.mobileInsightsTitle,
                subtitle: texts.mobileInsightsSubtitle,
                children: secondaryTrackingCards,
              ),
            ] else
              LayoutBuilder(
                builder: (context, constraints) {
                  final cols = constraints.maxWidth >= _desktopBreakpoint
                      ? 3
                      : constraints.maxWidth >= _tabletBreakpoint
                      ? 2
                      : 1;
                  final childWidth =
                      (constraints.maxWidth -
                          (cols - 1) * _dashboardGridSpacing) /
                      cols;
                  return Wrap(
                    spacing: _dashboardGridSpacing,
                    runSpacing: _dashboardGridSpacing,
                    children: [
                      ...primaryTrackingCards.map(
                        (card) => SizedBox(width: childWidth, child: card),
                      ),
                      ...secondaryTrackingCards.map(
                        (card) => SizedBox(width: childWidth, child: card),
                      ),
                    ],
                  );
                },
              ),
            SizedBox(height: sectionSpacing),
            FadeSlideIn(
              delay: const Duration(milliseconds: 140),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isCompactHeader = constraints.maxWidth < 360;
                  final actionButton = TextButton.icon(
                    onPressed: _openOrdersScreen,
                    style: TextButton.styleFrom(
                      minimumSize: const Size(48, 48),
                      visualDensity: VisualDensity.compact,
                      foregroundColor: Theme.of(context).colorScheme.primary,
                    ),
                    icon: const Icon(Icons.open_in_new_rounded, size: 16),
                    label: Text(texts.viewAllAction),
                  );

                  if (periodOrders.isEmpty) {
                    return _SectionTitle(title: texts.recentOrdersTitle);
                  }
                  if (isCompactHeader) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _SectionTitle(title: texts.recentOrdersTitle),
                        const SizedBox(height: 4),
                        actionButton,
                      ],
                    );
                  }
                  return Row(
                    children: [
                      Expanded(
                        child: _SectionTitle(title: texts.recentOrdersTitle),
                      ),
                      actionButton,
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            if (periodOrders.isEmpty)
              _EmptyCard(
                title: texts.recentOrdersTitle,
                message: texts.recentOrdersEmptyMessage,
                description: texts.recentOrdersEmptyDescription,
                icon: Icons.receipt_long_outlined,
                ctaLabel: texts.createOrderAction,
                ctaSemanticLabel: texts.createOrderSemanticLabel,
                ctaIcon: Icons.add_shopping_cart_outlined,
                onCtaPressed: _openCreateOrderFlow,
              )
            else
              ...periodOrders
                  .take(5)
                  .toList(growable: false)
                  .asMap()
                  .entries
                  .map((entry) {
                    final index = entry.key;
                    final order = entry.value;
                    final shouldAnimate = index < 4;
                    return FadeSlideIn(
                      animate: shouldAnimate,
                      delay: shouldAnimate
                          ? Duration(milliseconds: 170 + 30 * index)
                          : Duration.zero,
                      child: Padding(
                        padding: EdgeInsets.only(
                          bottom: index == math.min(periodOrders.length, 5) - 1
                              ? 0
                              : 10,
                        ),
                        child: RepaintBoundary(
                          child: _RecentOrderCard(
                            order: order,
                            onTap: () => _openOrderDetail(order.id),
                          ),
                        ),
                      ),
                    );
                  }),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(texts.appBarTitle, logoSize: 30, logoGap: 4),
        actions: [
          const GlobalSearchIconButton(),
          NotificationIconButton(
            count: unreadNotificationCount,
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
          ),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            maxWidth: _maxDashboardContentWidth,
          ),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: KeyedSubtree(key: ValueKey(_loadState), child: content),
          ),
        ),
      ),
    );
  }

  void _moveToPreviousPeriod() {
    setState(() {
      _selectedPeriod = _dashboardPreviousPeriodStartForFilter(
        _selectedPeriod,
        _timeFilter,
      );
    });
  }

  void _moveToNextPeriod() {
    final now = DateTime.now();
    final periodAnchor = _dashboardNormalizePeriodAnchorForFilter(
      _selectedPeriod,
      _timeFilter,
      now: now,
    );
    if (!_dashboardCanMoveToNextPeriod(periodAnchor, _timeFilter, now)) {
      return;
    }
    setState(() {
      _selectedPeriod = _dashboardNextPeriodStartForFilter(
        periodAnchor,
        _timeFilter,
      );
    });
  }

  Future<void> _openTimeFilterSheet() async {
    final selection = await _showDashboardTimeFilterSheet(
      context: context,
      initialFilter: _timeFilter,
      selectedPeriod: _selectedPeriod,
      texts: _DashboardTexts(
        isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
      ),
    );
    if (!mounted || selection == null) {
      return;
    }
    setState(() {
      _timeFilter = selection.filter;
      _selectedPeriod = selection.period;
    });
  }
}

class _DashboardQuickActionsCard extends StatelessWidget {
  const _DashboardQuickActionsCard({
    required this.onCreateOrder,
    required this.onOpenDebtTracking,
    required this.onOpenInventory,
    required this.onOpenWarrantyHub,
    required this.title,
    required this.subtitle,
    required this.createOrderLabel,
    required this.debtLabel,
    required this.inventoryLabel,
    required this.warrantyLabel,
  });

  final VoidCallback onCreateOrder;
  final VoidCallback onOpenDebtTracking;
  final VoidCallback onOpenInventory;
  final VoidCallback onOpenWarrantyHub;
  final String title;
  final String subtitle;
  final String createOrderLabel;
  final String debtLabel;
  final String inventoryLabel;
  final String warrantyLabel;

  @override
  Widget build(BuildContext context) {
    final actions = <Widget>[
      _DashboardQuickActionButton(
        icon: Icons.add_shopping_cart_outlined,
        label: createOrderLabel,
        onPressed: onCreateOrder,
        isPrimary: true,
      ),
      _DashboardQuickActionButton(
        icon: Icons.account_balance_wallet_outlined,
        label: debtLabel,
        onPressed: onOpenDebtTracking,
      ),
      _DashboardQuickActionButton(
        icon: Icons.inventory_2_outlined,
        label: inventoryLabel,
        onPressed: onOpenInventory,
      ),
      _DashboardQuickActionButton(
        icon: Icons.verified_user_outlined,
        label: warrantyLabel,
        onPressed: onOpenWarrantyHub,
      ),
    ];

    return _DashboardSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _DashboardCardHeader(title: title, subtitle: subtitle),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              final maxWidth = constraints.maxWidth;
              final columns = maxWidth >= 1080
                  ? 4
                  : maxWidth >= 640
                  ? 2
                  : maxWidth >= 360
                  ? 2
                  : 1;
              final regularWidth = columns == 1
                  ? maxWidth
                  : (maxWidth - (columns - 1) * _dashboardGridSpacing) /
                        columns;
              final primaryFullWidth = columns == 2 && maxWidth < 640;

              return Wrap(
                spacing: _dashboardGridSpacing,
                runSpacing: _dashboardGridSpacing,
                children: [
                  for (var i = 0; i < actions.length; i++)
                    SizedBox(
                      width: i == 0 && primaryFullWidth
                          ? maxWidth
                          : regularWidth,
                      child: actions[i],
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _DashboardQuickActionButton extends StatelessWidget {
  const _DashboardQuickActionButton({
    required this.icon,
    required this.label,
    required this.onPressed,
    this.isPrimary = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final backgroundColor = isPrimary
        ? colorScheme.primary
        : colorScheme.surfaceContainerLow;
    final foregroundColor = isPrimary
        ? colorScheme.onPrimary
        : colorScheme.onSurface;
    final iconBackgroundColor = isPrimary
        ? Colors.white.withValues(alpha: 0.16)
        : colorScheme.primaryContainer;
    final iconColor = isPrimary ? colorScheme.onPrimary : colorScheme.primary;
    final borderColor = isPrimary
        ? colorScheme.primary.withValues(alpha: 0.85)
        : colorScheme.outlineVariant.withValues(alpha: 0.8);

    return Semantics(
      button: true,
      label: label,
      child: Material(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(16),
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: borderColor),
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 92),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: iconBackgroundColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Icon(icon, size: 20, color: iconColor),
                        ),
                        const Spacer(),
                        Icon(
                          Icons.arrow_forward_rounded,
                          size: 18,
                          color: foregroundColor.withValues(
                            alpha: isPrimary ? 0.88 : 0.52,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      label,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: foregroundColor,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
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
}

class _DashboardExpandableInsights extends StatelessWidget {
  const _DashboardExpandableInsights({
    required this.title,
    required this.subtitle,
    required this.children,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return _DashboardSurfaceCard(
      padding: EdgeInsets.zero,
      child: Theme(
        data: theme.copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          key: const PageStorageKey<String>('dashboard-mobile-insights'),
          tilePadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
          childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
          title: Text(
            title,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          subtitle: Text(
            subtitle,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          children: children
              .map(
                (child) => Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: child,
                ),
              )
              .toList(growable: false),
        ),
      ),
    );
  }
}

class _OverviewCard extends StatelessWidget {
  const _OverviewCard({
    required this.totalDebt,
    required this.periodRevenue,
    required this.periodOrders,
    required this.periodCompletedOrders,
    required this.periodUnitLabel,
    required this.contextLabel,
    required this.texts,
  });

  final int totalDebt;
  final int periodRevenue;
  final int periodOrders;
  final int periodCompletedOrders;
  final String periodUnitLabel;
  final String contextLabel;
  final _DashboardTexts texts;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final revenueAccent = cs.primary;
    final debtAccent = cs.error;
    final orderAccent = cs.secondary;
    final completionRateAccent = cs.tertiary;
    final completionRate = periodOrders == 0
        ? 0
        : ((periodCompletedOrders / periodOrders) * 100).round();
    final completionLabel = texts.completionRateLabel(
      periodCompletedOrders,
      periodOrders,
    );

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0071BC), Color(0xFF29ABE2)],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            texts.overviewTitle,
            style: theme.textTheme.titleMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            texts.overviewContext(contextLabel),
            style: theme.textTheme.bodyMedium?.copyWith(
              color: const Color(0xF2FFFFFF),
              fontWeight: FontWeight.w500,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 16),
          _OverviewMetricTile(
            icon: Icons.payments_rounded,
            accentColor: revenueAccent,
            label: texts.overviewRevenueLabel(periodUnitLabel),
            value: _formatCompactVnd(periodRevenue),
            isPrimary: true,
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              final debtCard = _OverviewMetricTile(
                icon: Icons.account_balance_wallet_rounded,
                accentColor: debtAccent,
                label: texts.overviewDebtLabel,
                value: _formatCompactVnd(totalDebt),
                isPrimary: false,
              );
              final orderCard = _OverviewMetricTile(
                icon: Icons.receipt_long_rounded,
                accentColor: orderAccent,
                label: texts.overviewOrdersLabel(periodUnitLabel),
                value: '$periodOrders',
                isPrimary: false,
              );
              final completionRateCard = _OverviewMetricTile(
                icon: Icons.task_alt_rounded,
                accentColor: completionRateAccent,
                label: completionLabel,
                value: '$completionRate%',
                isPrimary: false,
              );
              final cards = [debtCard, orderCard, completionRateCard];
              final compact = constraints.maxWidth < 360;
              final useTwoColumns =
                  constraints.maxWidth >= 360 &&
                  constraints.maxWidth < _overviewCompactBreakpoint;
              final itemWidth = useTwoColumns
                  ? (constraints.maxWidth - _dashboardGridSpacing) / 2
                  : constraints.maxWidth >= 720
                  ? (constraints.maxWidth - (_dashboardGridSpacing * 2)) / 3
                  : constraints.maxWidth;

              if (compact) {
                return Column(
                  children: [
                    for (var i = 0; i < cards.length; i++) ...[
                      if (i > 0) const SizedBox(height: 10),
                      cards[i],
                    ],
                  ],
                );
              }

              return Wrap(
                spacing: _dashboardGridSpacing,
                runSpacing: _dashboardGridSpacing,
                children: [
                  for (final card in cards)
                    SizedBox(width: itemWidth, child: card),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _OverviewMetricTile extends StatelessWidget {
  const _OverviewMetricTile({
    required this.icon,
    required this.accentColor,
    required this.label,
    required this.value,
    required this.isPrimary,
  });

  final IconData icon;
  final Color accentColor;
  final String label;
  final String value;
  final bool isPrimary;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isPrimary ? 14 : 12,
        vertical: isPrimary ? 14 : 12,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: isPrimary ? 0.16 : 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: Colors.white.withValues(alpha: isPrimary ? 0.32 : 0.24),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: isPrimary ? 42 : 38,
            height: isPrimary ? 42 : 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.2),
            ),
            alignment: Alignment.center,
            child: Icon(icon, color: accentColor, size: isPrimary ? 24 : 22),
          ),
          SizedBox(width: isPrimary ? 12 : 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style:
                      (isPrimary
                              ? theme.textTheme.headlineSmall
                              : theme.textTheme.titleLarge)
                          ?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: const Color(0xE6FFFFFF),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

String _formatCompactVnd(int amount) {
  final abs = amount.abs().toDouble();
  if (abs >= 1000000000) {
    return '${_formatCompactValue(amount / 1000000000)}B \u20ab';
  }
  if (abs >= 1000000) {
    return '${_formatCompactValue(amount / 1000000)}M \u20ab';
  }
  if (abs >= 1000) {
    return '${_formatCompactValue(amount / 1000)}K \u20ab';
  }
  return '$amount \u20ab';
}

String _formatCompactValue(double value) {
  final text = value.toStringAsFixed(1);
  if (text.endsWith('.0')) {
    return text.substring(0, text.length - 2);
  }
  return text;
}

class _RevenueChartCard extends StatefulWidget {
  const _RevenueChartCard({
    required this.data,
    required this.focusMonth,
    required this.displayYear,
    required this.onCreateOrder,
  });

  final List<_MonthRevenue> data;
  final int focusMonth;
  final int displayYear;
  final VoidCallback onCreateOrder;

  @override
  State<_RevenueChartCard> createState() => _RevenueChartCardState();
}

class _RevenueChartCardState extends State<_RevenueChartCard> {
  int? _selectedBarGroupIndex;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    final texts = _DashboardTexts(isEnglish: isEnglish);
    final colorScheme = theme.colorScheme;
    final focusMonth = widget.focusMonth.clamp(1, 12);
    final displayYear = widget.displayYear;

    final monthsWithData = widget.data.where((item) => item.value > 0).toList();
    final hasAnyData = monthsWithData.isNotEmpty;
    final hasSparseData = hasAnyData && monthsWithData.length <= 2;
    final chartData = widget.data;
    final zeroValueMonthCount = chartData
        .where((item) => item.value <= 0)
        .length;
    final showMissingMonthNote = hasAnyData && zeroValueMonthCount > 0;
    final enableHoverTooltip = kIsWeb;

    final maxValue = chartData.fold<int>(
      0,
      (max, item) => math.max(max, item.value),
    );
    final topY = maxValue <= 0
        ? 1000000.0
        : math
              .max(1000000, ((maxValue * 1.25) / 1000000).ceil() * 1000000)
              .toDouble();
    final yInterval = topY / 4;

    final subtitle = hasSparseData
        ? (isEnglish
              ? 'Data is available for ${monthsWithData.length}/12 months in $displayYear.'
              : '\u0110\u00e3 c\u00f3 d\u1eef li\u1ec7u ${monthsWithData.length}/12 th\u00e1ng c\u1ee7a n\u0103m $displayYear.')
        : (isEnglish
              ? 'Monthly purchase value across $displayYear.'
              : 'T\u1ed5ng h\u1ee3p gi\u00e1 tr\u1ecb \u0111\u01a1n nh\u1eadp theo t\u1eebng th\u00e1ng trong n\u0103m $displayYear.');

    final showValueLabels = hasAnyData && monthsWithData.length <= 2;
    final yearlyTotal = widget.data.fold<int>(
      0,
      (sum, item) => sum + item.value,
    );
    final focusMonthValue = widget.data[focusMonth - 1].value;
    final previousMonthValue = focusMonth > 1
        ? widget.data[focusMonth - 2].value
        : 0;
    final monthChangePercent = previousMonthValue <= 0
        ? 0.0
        : (focusMonthValue - previousMonthValue) / previousMonthValue * 100;
    final monthChangeText = previousMonthValue <= 0
        ? (focusMonthValue > 0
              ? (isEnglish ? 'New activity' : 'M\u1edbi ph\u00e1t sinh')
              : (isEnglish ? 'No change' : 'Kh\u00f4ng \u0111\u1ed5i'))
        : '${monthChangePercent >= 0 ? '+' : ''}${monthChangePercent.toStringAsFixed(1)}%';
    final monthChangeColor = previousMonthValue <= 0
        ? _dashboardMutedText(context)
        : focusMonthValue >= previousMonthValue
        ? const Color(0xFF15803D)
        : const Color(0xFFB91C1C);
    final chartHeight = (MediaQuery.sizeOf(context).width * 0.46)
        .clamp(240.0, 340.0)
        .toDouble();

    return _DashboardSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _DashboardCardHeader(
            title: isEnglish
                ? 'Monthly purchase value ($displayYear)'
                : 'Gi\u00e1 tr\u1ecb nh\u1eadp h\u00e0ng theo th\u00e1ng ($displayYear)',
            subtitle: hasAnyData ? subtitle : null,
          ),
          if (hasAnyData) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                _InsightChip(
                  label: isEnglish ? 'Year total' : 'T\u1ed5ng n\u0103m',
                  value: _formatCompactVnd(yearlyTotal),
                  valueColor: const Color(0xFF1E3A8A),
                ),
                _InsightChip(
                  label: isEnglish ? 'Selected month' : 'Th\u00e1ng ch\u1ecdn',
                  value: _formatCompactVnd(focusMonthValue),
                  valueColor: const Color(0xFF1E3A8A),
                ),
                _InsightChip(
                  label: isEnglish
                      ? 'Vs previous month'
                      : 'So v\u1edbi th\u00e1ng tr\u01b0\u1edbc',
                  value: monthChangeText,
                  valueColor: monthChangeColor,
                ),
              ],
            ),
          ],
          if (showMissingMonthNote) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: colorScheme.primary.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    size: 15,
                    color: colorScheme.onPrimaryContainer,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      isEnglish
                          ? 'Showing all 12 months. $zeroValueMonthCount months without data are displayed as 0.'
                          : 'Hiển thị đủ 12 tháng, $zeroValueMonthCount tháng chưa có dữ liệu đang được hiển thị là 0.',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          if (!hasAnyData)
            Container(
              width: double.infinity,
              constraints: const BoxConstraints(minHeight: 220),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: theme.colorScheme.outlineVariant),
              ),
              alignment: Alignment.center,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.bar_chart_rounded,
                      color: theme.colorScheme.onPrimaryContainer,
                      size: 20,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    isEnglish
                        ? 'No purchase orders have been recorded in $displayYear yet.'
                        : 'Bạn chưa có đơn nhập nào trong năm $displayYear.',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isEnglish
                        ? 'Create a new order to start tracking monthly purchase value.'
                        : 'Hãy tạo đơn hàng mới để bắt đầu theo dõi giá trị nhập theo tháng.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: _dashboardMutedText(context),
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: 220,
                    child: Semantics(
                      button: true,
                      label: isEnglish
                          ? 'Create a new order to track monthly purchase value'
                          : 'Tạo đơn hàng mới để theo dõi giá trị nhập hàng theo tháng',
                      child: FilledButton.icon(
                        onPressed: widget.onCreateOrder,
                        style: FilledButton.styleFrom(
                          minimumSize: const Size(220, 48),
                        ),
                        icon: const Icon(
                          Icons.add_shopping_cart_outlined,
                          size: 18,
                        ),
                        label: Text(texts.createOrderAction),
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            SizedBox(
              height: chartHeight,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  minY: 0,
                  maxY: topY,
                  barTouchData: BarTouchData(
                    enabled: true,
                    handleBuiltInTouches: enableHoverTooltip,
                    touchCallback: (event, response) {
                      if (enableHoverTooltip) {
                        return;
                      }
                      if (event is! FlTapUpEvent) {
                        return;
                      }
                      final touchedIdx = response?.spot?.touchedBarGroupIndex;
                      if (touchedIdx == null ||
                          touchedIdx < 0 ||
                          touchedIdx >= chartData.length ||
                          chartData[touchedIdx].value <= 0) {
                        setState(() => _selectedBarGroupIndex = null);
                        return;
                      }
                      setState(() {
                        _selectedBarGroupIndex =
                            _selectedBarGroupIndex == touchedIdx
                            ? null
                            : touchedIdx;
                      });
                    },
                    touchTooltipData: BarTouchTooltipData(
                      tooltipRoundedRadius: 10,
                      tooltipPadding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      tooltipMargin: 8,
                      fitInsideHorizontally: true,
                      fitInsideVertically: true,
                      getTooltipColor: (_) => const Color(0xFF0F172A),
                      getTooltipItem: (group, groupIndex, rod, rodIndex) {
                        if (groupIndex < 0 || groupIndex >= chartData.length) {
                          return null;
                        }
                        final item = chartData[groupIndex];
                        return BarTooltipItem(
                          '${item.label}/$displayYear\n${formatVnd(item.value)}',
                          const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        );
                      },
                    ),
                  ),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: yInterval,
                    getDrawingHorizontalLine: (value) => FlLine(
                      color: const Color(0xFFCBD5E1).withValues(alpha: 0.35),
                      strokeWidth: 1,
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    topTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: showValueLabels,
                        reservedSize: 40,
                        interval: 1,
                        getTitlesWidget: (value, meta) {
                          final idx = value.toInt();
                          if (value != idx.toDouble() ||
                              idx < 0 ||
                              idx >= chartData.length) {
                            return const SizedBox.shrink();
                          }
                          final amount = chartData[idx].value;
                          if (amount <= 0) {
                            return const SizedBox.shrink();
                          }
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            child: Text(
                              '${_formatCompactValue(amount / 1000000)}M ₫',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: const Color(0xFF334155),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 54,
                        interval: yInterval,
                        getTitlesWidget: (value, meta) {
                          if (value <= 0) {
                            return const SizedBox.shrink();
                          }
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            child: Text(
                              '${_formatCompactValue(value / 1000000)}M ₫',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: _dashboardMutedText(context),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 28,
                        interval: 1,
                        getTitlesWidget: (value, meta) {
                          final idx = value.toInt();
                          if (value != idx.toDouble() ||
                              idx < 0 ||
                              idx >= chartData.length) {
                            return const SizedBox.shrink();
                          }
                          final item = chartData[idx];
                          final isCurrent = item.month == focusMonth;
                          final hasValue = item.value > 0;
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            space: 6,
                            child: Text(
                              item.label,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: isCurrent
                                    ? theme.colorScheme.primary
                                    : hasValue
                                    ? const Color(0xFF334155)
                                    : const Color(0xFF94A3B8),
                                fontWeight: isCurrent
                                    ? FontWeight.w800
                                    : FontWeight.w600,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  barGroups: [
                    for (var i = 0; i < chartData.length; i++)
                      BarChartGroupData(
                        x: i,
                        showingTooltipIndicators:
                            !enableHoverTooltip &&
                                _selectedBarGroupIndex == i &&
                                chartData[i].value > 0
                            ? const [0]
                            : const [],
                        barRods: [
                          BarChartRodData(
                            toY: chartData[i].value.toDouble(),
                            width: 18,
                            backDrawRodData: BackgroundBarChartRodData(
                              show: true,
                              toY: topY * 0.06,
                              color: const Color(0xFFE2E8F0),
                            ),
                            borderRadius: BorderRadius.circular(5),
                            gradient: _revenueBarGradient(
                              chartData[i],
                              focusMonth,
                            ),
                            borderSide: chartData[i].month == focusMonth
                                ? const BorderSide(
                                    color: Color(0xFF1E3A8A),
                                    width: 1,
                                  )
                                : BorderSide.none,
                          ),
                        ],
                      ),
                  ],
                ),
                swapAnimationDuration: Duration.zero,
                swapAnimationCurve: Curves.linear,
              ),
            ),
        ],
      ),
    );
  }
}

LinearGradient _revenueBarGradient(_MonthRevenue item, int currentMonth) {
  if (item.value <= 0) {
    return const LinearGradient(
      begin: Alignment.bottomCenter,
      end: Alignment.topCenter,
      colors: [Color(0xFFD7DEE8), Color(0xFFE8EDF4)],
    );
  }

  if (item.month == currentMonth) {
    return const LinearGradient(
      begin: Alignment.bottomCenter,
      end: Alignment.topCenter,
      colors: [Color(0xFF0071BC), Color(0xFF29ABE2)],
    );
  }

  return const LinearGradient(
    begin: Alignment.bottomCenter,
    end: Alignment.topCenter,
    colors: [Color(0xFF3B82F6), Color(0xFF93C5FD)],
  );
}

class _InsightChip extends StatelessWidget {
  const _InsightChip({
    required this.label,
    required this.value,
    required this.valueColor,
  });

  final String label;
  final String value;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: _dashboardMutedText(context),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: theme.textTheme.labelMedium?.copyWith(
              color: valueColor,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentOrderCard extends StatelessWidget {
  const _RecentOrderCard({required this.order, this.onTap});

  final Order order;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final statusColor = _statusColor(
      order.status,
      Theme.of(context).colorScheme,
    );

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      order.id,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.onSurface,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  _OrderStatusTag(
                    label: texts.orderStatusLabel(order.status),
                    color: statusColor,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                formatVnd(order.total),
                style: theme.textTheme.titleLarge?.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                texts.recentOrderMeta(
                  order.createdAt,
                  order.totalItems,
                  order.paymentStatus,
                ),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: _dashboardMutedText(context),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderStatusTag extends StatelessWidget {
  const _OrderStatusTag({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.34)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

String _formatRecentOrderMetaDate(DateTime value) {
  final day = value.day.toString().padLeft(2, '0');
  final month = value.month.toString().padLeft(2, '0');
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '$day/$month \u00b7 $hour:$minute';
}

class _LowStockCard extends StatelessWidget {
  const _LowStockCard({required this.item});

  final _DashboardLowStockItem item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final colorScheme = theme.colorScheme;
    final product = item.product;
    final availableQuantity = item.availableQuantity;
    final shortage = math.max(0, _lowStockAlertThreshold - availableQuantity);
    final isCritical = availableQuantity <= 3;
    final accentColor = isCritical
        ? const Color(0xFFDC2626)
        : const Color(0xFFD97706);
    final surfaceColor = isCritical
        ? colorScheme.errorContainer
        : colorScheme.tertiaryContainer;
    final borderColor = isCritical ? colorScheme.error : colorScheme.tertiary;
    final ratio = (availableQuantity / _lowStockAlertThreshold)
        .clamp(0.0, 1.0)
        .toDouble();
    const minimumTarget = 1;
    final shortageToMinimum = math.max(0, minimumTarget - availableQuantity);
    final statusLabel = texts.lowStockStatusLabel(shortage);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: accentColor.withValues(alpha: 0.16),
                ),
                alignment: Alignment.center,
                child: Icon(_productIcon(), size: 20, color: accentColor),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'SKU: ${_compactSku(product.sku)}',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: _dashboardMutedText(context),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface.withValues(alpha: 0.72),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: borderColor.withValues(alpha: 0.65),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '$availableQuantity/$_lowStockAlertThreshold',
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: accentColor,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      texts.lowStockThresholdLabel,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: _dashboardMutedText(context),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          LayoutBuilder(
            builder: (context, constraints) {
              final fillWidth = ratio == 0
                  ? 0.0
                  : math.max(6.0, constraints.maxWidth * ratio);
              return ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: Stack(
                  alignment: Alignment.centerLeft,
                  children: [
                    Container(
                      height: 8,
                      color: accentColor.withValues(alpha: 0.18),
                    ),
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 350),
                      curve: Curves.easeOutCubic,
                      width: fillWidth,
                      height: 8,
                      decoration: BoxDecoration(
                        color: accentColor,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(Icons.warning_amber_rounded, size: 14, color: accentColor),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  statusLabel,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: accentColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                texts.lowStockMinimumLabel(minimumTarget, shortageToMinimum),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

IconData _productIcon() {
  return Icons.inventory_2_rounded;
}

String _compactSku(String sku) {
  final cleaned = sku.trim();
  if (cleaned.length <= 18) {
    return cleaned;
  }
  final parts = cleaned.split('-');
  if (parts.length >= 3) {
    return '${parts.first}-...-${parts.last}';
  }
  return '${cleaned.substring(0, 8)}...${cleaned.substring(cleaned.length - 5)}';
}

class _LowStockPanel extends StatelessWidget {
  const _LowStockPanel({
    required this.products,
    required this.onOpenInventory,
    required this.onOpenLowStockInventory,
  });

  final List<_DashboardLowStockItem> products;
  final VoidCallback onOpenInventory;
  final VoidCallback onOpenLowStockInventory;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final colorScheme = theme.colorScheme;
    final hasAlerts = products.isNotEmpty;
    final panelColor = hasAlerts
        ? colorScheme.errorContainer
        : colorScheme.tertiaryContainer;
    final panelBorderColor = hasAlerts
        ? colorScheme.error
        : colorScheme.tertiary;
    final headerIconBg = hasAlerts
        ? colorScheme.errorContainer
        : colorScheme.tertiaryContainer;
    final headerIconColor = hasAlerts
        ? colorScheme.onErrorContainer
        : colorScheme.onTertiaryContainer;
    final headerTitle = texts.lowStockHeaderTitle(hasAlerts);
    final headerSubtitle = texts.lowStockHeaderSubtitle(hasAlerts);

    return Card(
      elevation: 0,
      color: panelColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: panelBorderColor, width: 1.3),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: headerIconBg,
                    border: Border.all(color: panelBorderColor, width: 1.4),
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    hasAlerts
                        ? Icons.warning_amber_rounded
                        : Icons.verified_outlined,
                    size: 22,
                    color: headerIconColor,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        headerTitle,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: hasAlerts
                              ? colorScheme.onErrorContainer
                              : colorScheme.onTertiaryContainer,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        headerSubtitle,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: hasAlerts
                              ? colorScheme.onErrorContainer.withValues(
                                  alpha: 0.85,
                                )
                              : colorScheme.onTertiaryContainer.withValues(
                                  alpha: 0.85,
                                ),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                if (hasAlerts)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: colorScheme.error),
                    ),
                    child: Text(
                      texts.lowStockSkuCountLabel(products.length),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.onErrorContainer,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            if (products.isEmpty)
              _EmptyCard(
                title: texts.lowStockEmptyTitle,
                message: texts.lowStockEmptyMessage,
                description: texts.lowStockEmptyDescription,
                icon: Icons.inventory_2_outlined,
                ctaLabel: texts.viewInventoryAction,
                ctaSemanticLabel: texts.openInventorySemantic,
                ctaIcon: Icons.inventory_2_outlined,
                onCtaPressed: onOpenInventory,
              )
            else
              ...products.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                return Padding(
                  padding: EdgeInsets.only(
                    bottom: index == products.length - 1 ? 0 : 8,
                  ),
                  child: _LowStockCard(item: item),
                );
              }),
            if (hasAlerts) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onOpenLowStockInventory,
                  style: FilledButton.styleFrom(
                    backgroundColor: colorScheme.error,
                    foregroundColor: colorScheme.onError,
                    minimumSize: const Size(0, 48),
                  ),
                  icon: const Icon(Icons.local_shipping_outlined, size: 18),
                  label: Text(texts.replenishNowAction),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _OrderStatusDistributionCard extends StatelessWidget {
  const _OrderStatusDistributionCard({
    required this.orders,
    required this.onCreateOrder,
  });

  final List<Order> orders;
  final VoidCallback onCreateOrder;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final colorScheme = theme.colorScheme;
    final totals = _computeStatusTotals(orders);
    final totalCount = totals.values.fold<int>(0, (sum, v) => sum + v);
    final showEmpty = totalCount == 0;

    return _DashboardSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _DashboardCardHeader(
            title: texts.orderDistributionTitle,
            subtitle: showEmpty ? null : texts.orderDistributionHint,
            trailing: _DashboardStatBadge(
              icon: Icons.receipt_long_outlined,
              label: texts.orderCountChipLabel(totalCount),
            ),
          ),
          const SizedBox(height: 12),
          if (showEmpty)
            _EmptyCard(
              title: texts.orderDistributionTitle,
              message: texts.orderDistributionEmptyMessage,
              description: texts.orderDistributionEmptyDescription,
              icon: Icons.inbox_outlined,
              ctaLabel: texts.createOrderAction,
              ctaSemanticLabel: texts.createOrderToTrackSemantic,
              ctaIcon: Icons.add_shopping_cart_outlined,
              onCtaPressed: onCreateOrder,
            )
          else
            Column(
              children: _statusOrder.map((status) {
                final count = totals[status] ?? 0;
                final ratio = totalCount == 0 ? 0.0 : count / totalCount;
                final percent = totalCount == 0 ? 0 : (ratio * 100).round();
                final statusOrders =
                    orders.where((order) => order.status == status).toList()
                      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _StatusBar(
                    label: texts.orderStatusLabel(status),
                    count: count,
                    ratio: ratio,
                    percent: percent,
                    color: _statusColor(status, colorScheme),
                    onTap: () => _showStatusDetailSheet(
                      context: context,
                      status: status,
                      orders: statusOrders,
                      totalCount: totalCount,
                      color: _statusColor(status, colorScheme),
                    ),
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }

  Map<OrderStatus, int> _computeStatusTotals(List<Order> orders) {
    final map = <OrderStatus, int>{for (final s in _statusOrder) s: 0};
    for (final order in orders) {
      map[order.status] = (map[order.status] ?? 0) + 1;
    }
    return map;
  }

  void _showStatusDetailSheet({
    required BuildContext context,
    required OrderStatus status,
    required List<Order> orders,
    required int totalCount,
    required Color color,
  }) {
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final count = orders.length;
    final ratio = totalCount == 0 ? 0.0 : count / totalCount;
    final percent = totalCount == 0 ? 0 : (ratio * 100).round();

    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      requestFocus: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final theme = Theme.of(context);
        return SafeArea(
          top: false,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: RepaintBoundary(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: color,
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                texts.orderStatusLabel(status),
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            Text(
                              texts.orderCountPercentLabel(count, percent),
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.colorScheme.onSurface,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          texts.selectedStatusListDescription,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: _dashboardMutedText(context),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (orders.isEmpty)
                          _EmptyCard(
                            title: texts.noMatchingOrdersTitle,
                            message: texts.noMatchingOrdersMessage,
                            description: texts.noMatchingOrdersDescription,
                            icon: Icons.filter_alt_off_outlined,
                          )
                        else
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxHeight: 300),
                            child: ListView.separated(
                              shrinkWrap: true,
                              itemCount: orders.length,
                              separatorBuilder: (context, index) =>
                                  const Divider(height: 1),
                              itemBuilder: (context, index) {
                                final order = orders[index];
                                return ListTile(
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 2,
                                  ),
                                  minVerticalPadding: 8,
                                  title: Text(order.id),
                                  subtitle: Text(
                                    formatDateTime(order.createdAt),
                                  ),
                                  trailing: Text(
                                    formatVnd(order.total),
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onSurface,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _StatusBar extends StatelessWidget {
  const _StatusBar({
    required this.label,
    required this.count,
    required this.ratio,
    required this.percent,
    required this.color,
    this.onTap,
  });

  final String label;
  final int count;
  final double ratio;
  final int percent;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );

    Widget ratioBar() {
      return ClipRRect(
        borderRadius: BorderRadius.circular(999),
        child: Container(
          height: 11,
          color: color.withValues(alpha: 0.16),
          child: TweenAnimationBuilder<double>(
            tween: Tween<double>(begin: 0, end: ratio.clamp(0.0, 1.0)),
            duration: const Duration(milliseconds: 450),
            curve: Curves.easeOutCubic,
            builder: (context, animatedRatio, _) {
              return FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: animatedRatio,
                child: Container(color: color),
              );
            },
          ),
        ),
      );
    }

    final compactContent = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              texts.orderCountPercentLabel(count, percent),
              textAlign: TextAlign.right,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: theme.colorScheme.onSurface,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ratioBar(),
      ],
    );

    final regularContent = Row(
      children: [
        SizedBox(
          width: 86,
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: ratioBar()),
        const SizedBox(width: 10),
        SizedBox(
          width: 104,
          child: Text(
            texts.orderCountPercentLabel(count, percent),
            textAlign: TextAlign.right,
            maxLines: 2,
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurface,
              height: 1.25,
            ),
          ),
        ),
      ],
    );

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isCompact = constraints.maxWidth < 350;
            return Row(
              children: [
                Expanded(child: isCompact ? compactContent : regularContent),
                const SizedBox(width: 4),
                Icon(
                  Icons.chevron_right_rounded,
                  size: 18,
                  color: _dashboardMutedText(context),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _AgingDebtCard extends StatelessWidget {
  const _AgingDebtCard({required this.buckets, required this.onViewAll});

  final List<_DebtBucket> buckets;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final total = buckets.fold<int>(0, (sum, b) => sum + b.amount);
    final showEmpty = total == 0;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final isCompactHeader = constraints.maxWidth < 360;
                final actionButton = TextButton.icon(
                  onPressed: onViewAll,
                  style: TextButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    minimumSize: const Size(48, 48),
                    foregroundColor: Theme.of(context).colorScheme.primary,
                  ),
                  icon: const Icon(Icons.list_alt_outlined, size: 18),
                  label: Text(texts.viewDebtListAction),
                );

                if (showEmpty) {
                  return Text(
                    texts.debtAgingTitle,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                    overflow: TextOverflow.ellipsis,
                  );
                }
                if (isCompactHeader) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        texts.debtAgingTitle,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      actionButton,
                    ],
                  );
                }
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        texts.debtAgingTitle,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    actionButton,
                  ],
                );
              },
            ),
            if (!showEmpty) ...[
              const SizedBox(height: 4),
              Text(
                texts.totalDebtLabel(total),
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: theme.colorScheme.outlineVariant),
                ),
                child: Text(
                  texts.debtAgingHint,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: _dashboardMutedText(context),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            if (showEmpty)
              _EmptyCard(
                title: texts.debtAgingTitle,
                message: texts.debtAgingEmptyMessage,
                description: texts.debtAgingEmptyDescription,
                icon: Icons.account_balance_wallet_outlined,
                ctaLabel: texts.openDebtListAction,
                ctaSemanticLabel: texts.openDebtListSemantic,
                ctaIcon: Icons.list_alt_outlined,
                onCtaPressed: onViewAll,
              )
            else
              Column(
                children: buckets.map((bucket) {
                  final ratio = total == 0 ? 0.0 : bucket.amount / total;
                  final percent = total == 0 ? 0 : (ratio * 100).round();
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _AgingDebtRow(
                      bucket: bucket,
                      ratio: ratio,
                      percent: percent,
                      onTap: () => _showBucketDetailSheet(
                        context: context,
                        bucket: bucket,
                        total: total,
                      ),
                    ),
                  );
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }

  void _showBucketDetailSheet({
    required BuildContext context,
    required _DebtBucket bucket,
    required int total,
  }) {
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final ratio = total == 0 ? 0.0 : bucket.amount / total;
    final percent = total == 0 ? 0 : (ratio * 100).round();

    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      requestFocus: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final theme = Theme.of(context);
        return SafeArea(
          top: false,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: RepaintBoundary(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: bucket.color,
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                bucket.label,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            Text(
                              '$percent%',
                              style: theme.textTheme.titleSmall?.copyWith(
                                color: theme.colorScheme.onSurface,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          texts.bucketValueLabel(bucket.amount),
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurface,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          texts.bucketDescription(bucket),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: _dashboardMutedText(context),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        if (bucket.minDay >= 91) ...[
                          const SizedBox(height: 6),
                          Text(
                            texts.over90DayNote,
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: const Color(0xFF334155),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        FilledButton.tonalIcon(
                          onPressed: () {
                            Navigator.of(context).pop();
                            onViewAll();
                          },
                          icon: const Icon(Icons.open_in_new_rounded, size: 16),
                          label: Text(texts.openDebtListAction),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _AgingDebtRow extends StatelessWidget {
  const _AgingDebtRow({
    required this.bucket,
    required this.ratio,
    required this.percent,
    this.onTap,
  });

  final _DebtBucket bucket;
  final double ratio;
  final int percent;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final label = Row(
      children: [
        Icon(
          _bucketIcon(bucket),
          size: 14,
          color: _dashboardMutedText(context),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            bucket.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall?.copyWith(
              color: const Color(0xFF334155),
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        final isCompact = constraints.maxWidth < _compactDebtRowBreakpoint;
        final value = ConstrainedBox(
          constraints: BoxConstraints(
            minWidth: isCompact ? 74 : 92,
            maxWidth: isCompact ? 108 : 124,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatVnd(bucket.amount),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.titleSmall?.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                '$percent%',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: _dashboardMutedText(context),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );

        final content = isCompact
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: label),
                      const SizedBox(width: 8),
                      value,
                    ],
                  ),
                  const SizedBox(height: 8),
                  _buildRatioBar(),
                ],
              )
            : Row(
                children: [
                  Expanded(flex: 3, child: label),
                  const SizedBox(width: 10),
                  Expanded(flex: 4, child: _buildRatioBar()),
                  const SizedBox(width: 10),
                  value,
                ],
              );

        return InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
            child: content,
          ),
        );
      },
    );
  }

  Widget _buildRatioBar() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final clamped = ratio.clamp(0.0, 1.0).toDouble();
        final fillWidth = clamped == 0
            ? 0.0
            : math.max(6.0, constraints.maxWidth * clamped);

        return ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: Stack(
            alignment: Alignment.centerLeft,
            children: [
              Container(
                height: 11,
                color: bucket.color.withValues(alpha: 0.14),
              ),
              Positioned.fill(
                child: IgnorePointer(
                  child: CustomPaint(
                    painter: _BarGuidePainter(
                      color: const Color(0xFF94A3B8).withValues(alpha: 0.22),
                    ),
                  ),
                ),
              ),
              AnimatedContainer(
                duration: const Duration(milliseconds: 420),
                curve: Curves.easeOutCubic,
                width: fillWidth,
                height: 11,
                decoration: BoxDecoration(
                  color: bucket.color,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  IconData _bucketIcon(_DebtBucket bucket) {
    if (bucket.maxDay <= 30) {
      return Icons.schedule_outlined;
    }
    if (bucket.maxDay <= 60) {
      return Icons.timelapse_outlined;
    }
    if (bucket.maxDay <= 90) {
      return Icons.hourglass_bottom_outlined;
    }
    return Icons.warning_amber_rounded;
  }
}

class _BarGuidePainter extends CustomPainter {
  const _BarGuidePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1;
    for (final marker in const [0.25, 0.5, 0.75]) {
      final x = size.width * marker;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _BarGuidePainter oldDelegate) {
    return oldDelegate.color != color;
  }
}

// ignore: unused_element
class _NoticeCard extends StatelessWidget {
  const _NoticeCard({required this.notice});

  final DistributorNotice notice;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              notice.title,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(notice.message),
            const SizedBox(height: 8),
            Text(
              formatDate(notice.createdAt),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: _dashboardMutedText(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(
        context,
      ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
    required this.title,
    required this.message,
    this.description,
    this.icon = Icons.inbox_outlined,
    this.ctaLabel,
    this.ctaSemanticLabel,
    this.onCtaPressed,
    this.ctaIcon,
  });

  final String title;
  final String message;
  final String? description;
  final IconData icon;
  final String? ctaLabel;
  final String? ctaSemanticLabel;
  final VoidCallback? onCtaPressed;
  final IconData? ctaIcon;

  bool get _hasCta => ctaLabel != null && onCtaPressed != null;

  Widget _buildCtaButton() {
    final label = ctaLabel!;
    final style = FilledButton.styleFrom(
      minimumSize: const Size(double.infinity, 48),
    );
    if (ctaIcon != null) {
      return FilledButton.icon(
        onPressed: onCtaPressed,
        style: style,
        icon: Icon(ctaIcon, size: 18),
        label: Text(label),
      );
    }
    return FilledButton(
      onPressed: onCtaPressed,
      style: style,
      child: Text(label),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final semanticParts = <String>[title, message];
    final desc = description;
    if (desc != null && desc.isNotEmpty) {
      semanticParts.add(desc);
    }
    final resolvedSemanticLabel = semanticParts.join(' ');

    return Semantics(
      container: true,
      label: resolvedSemanticLabel,
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: Theme.of(
              context,
            ).colorScheme.outlineVariant.withValues(alpha: 0.6),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: ExcludeSemantics(
                    child: Icon(
                      icon,
                      size: 20,
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                message,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              if (desc != null && desc.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: _dashboardMutedText(context),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
              if (_hasCta) ...[
                const SizedBox(height: 12),
                Semantics(
                  button: true,
                  label: ctaSemanticLabel ?? ctaLabel!,
                  child: SizedBox(
                    width: double.infinity,
                    child: _buildCtaButton(),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardErrorView extends StatelessWidget {
  const _DashboardErrorView({
    required this.title,
    required this.message,
    required this.description,
    required this.ctaLabel,
    required this.ctaSemanticLabel,
    required this.onRetry,
    required this.horizontalPadding,
  });

  final String title;
  final String message;
  final String description;
  final String ctaLabel;
  final String ctaSemanticLabel;
  final VoidCallback onRetry;
  final double horizontalPadding;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(
        horizontalPadding,
        16,
        horizontalPadding,
        24,
      ),
      children: [
        _EmptyCard(
          title: title,
          message: message,
          description: description,
          icon: Icons.cloud_off_outlined,
          ctaLabel: ctaLabel,
          ctaSemanticLabel: ctaSemanticLabel,
          ctaIcon: Icons.refresh,
          onCtaPressed: onRetry,
        ),
      ],
    );
  }
}

class _DashboardLoadingView extends StatelessWidget {
  const _DashboardLoadingView({required this.horizontalPadding});

  final double horizontalPadding;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: EdgeInsets.fromLTRB(
        horizontalPadding,
        16,
        horizontalPadding,
        24,
      ),
      children: const [
        SkeletonBox(width: double.infinity, height: 150),
        SizedBox(height: 14),
        SkeletonBox(width: double.infinity, height: 300),
        SizedBox(height: 14),
        SkeletonBox(width: double.infinity, height: 90),
        SizedBox(height: 10),
        SkeletonBox(width: double.infinity, height: 90),
        SizedBox(height: 14),
        SkeletonBox(width: double.infinity, height: 90),
        SizedBox(height: 10),
        SkeletonBox(width: double.infinity, height: 90),
      ],
    );
  }
}

Color _statusColor(OrderStatus status, ColorScheme colorScheme) {
  switch (status) {
    case OrderStatus.pending:
      return colorScheme.tertiary;
    case OrderStatus.confirmed:
      return colorScheme.primary;
    case OrderStatus.shipping:
      return colorScheme.secondary;
    case OrderStatus.completed:
      return colorScheme.primaryContainer;
    case OrderStatus.cancelled:
      return colorScheme.outline;
  }
}

class _ActivationTrendCard extends StatefulWidget {
  const _ActivationTrendCard({required this.data, required this.windowDays});

  final List<_DailyActivation> data;
  final int windowDays;

  @override
  State<_ActivationTrendCard> createState() => _ActivationTrendCardState();
}

class _ActivationTrendCardState extends State<_ActivationTrendCard> {
  int? _selectedSpotIndex;

  @override
  Widget build(BuildContext context) {
    final rawData = widget.data;
    final theme = Theme.of(context);
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    final secondaryTextColor = _dashboardMutedText(context);
    final windowDays = widget.windowDays;
    final isCompactMobile =
        MediaQuery.sizeOf(context).width < _mobileBreakpoint;
    final useWeeklyBuckets = isCompactMobile && windowDays >= 90;

    if (rawData.isEmpty) {
      return _EmptyCard(
        title: isEnglish
            ? 'No activation data yet'
            : 'Chưa có dữ liệu kích hoạt',
        message: isEnglish
            ? 'No activation has been recorded in the last $windowDays days.'
            : 'Chưa ghi nhận lượt kích hoạt nào trong $windowDays ngày gần đây.',
        description: isEnglish
            ? 'Complete orders and process serials to start tracking.'
            : 'Hãy hoàn tất đơn và xử lý serial để bắt đầu theo dõi.',
        icon: Icons.show_chart_outlined,
      );
    }

    final data = _buildChartData(rawData, weeklyBucket: useWeeklyBuckets);

    var peakIndex = 0;
    for (var i = 1; i < data.length; i++) {
      if (data[i].count > data[peakIndex].count) {
        peakIndex = i;
      }
    }
    final peakPoint = data[peakIndex];
    final peakLabel = _formatPointLabel(peakPoint);

    final totalActivations = rawData.fold<int>(
      0,
      (sum, item) => sum + item.count,
    );
    final averagePerDay = totalActivations / rawData.length;
    final maxY = data
        .fold<int>(0, (max, item) => math.max(max, item.count))
        .toDouble();
    final roughTopY = math.max(5, (maxY * 1.2).ceil()).toDouble();
    final yInterval = math.max(1, (roughTopY / 4).ceil()).toDouble();
    final topY = (roughTopY / yInterval).ceil() * yInterval;
    final chartMinX = -1.0;
    final chartMaxX = data.length.toDouble();
    final enableHoverTooltip = kIsWeb;
    final hasValidSelectedSpot =
        _selectedSpotIndex != null &&
        _selectedSpotIndex! >= 0 &&
        _selectedSpotIndex! < data.length;
    final targetLabelCount = useWeeklyBuckets
        ? (isCompactMobile ? 3 : 6)
        : (isCompactMobile ? 4 : 7);
    final xLabelStep = math.max(1, (data.length / targetLabelCount).ceil());
    final chartHeight = (MediaQuery.sizeOf(context).width * 0.45)
        .clamp(220.0, 320.0)
        .toDouble();

    bool shouldShowMarker(int index) {
      return index == 0 || index == data.length - 1 || index == peakIndex;
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isEnglish
                  ? 'Serial processing in the last $windowDays days'
                  : 'Xử lý serial $windowDays ngày gần nhất',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              useWeeklyBuckets
                  ? (isEnglish
                        ? 'Weekly activation volume'
                        : 'Số lượt kích hoạt theo tuần')
                  : (isEnglish
                        ? 'Daily activation volume'
                        : 'Số lượt kích hoạt theo từng ngày'),
              style: theme.textTheme.bodySmall?.copyWith(
                color: secondaryTextColor,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isEnglish ? 'Unit: activations/day' : 'Đơn vị: lượt/ngày',
              style: theme.textTheme.labelSmall?.copyWith(
                color: secondaryTextColor,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (useWeeklyBuckets) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: theme.colorScheme.outlineVariant),
                ),
                child: Text(
                  isEnglish
                      ? 'Grouped by week for easier reading on mobile.'
                      : 'Đang gộp dữ liệu theo tuần để dễ đọc trên mobile.',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 8),
            SizedBox(
              height: chartHeight,
              child: LineChart(
                LineChartData(
                  minX: chartMinX,
                  maxX: chartMaxX,
                  minY: 0,
                  maxY: topY,
                  clipData: const FlClipData.none(),
                  extraLinesData: ExtraLinesData(
                    extraLinesOnTop: true,
                    horizontalLines: [
                      HorizontalLine(
                        y: averagePerDay,
                        color: const Color(0xFF29ABE2).withValues(alpha: 0.4),
                        strokeWidth: 1.1,
                        dashArray: const [6, 4],
                        label: HorizontalLineLabel(
                          show: true,
                          alignment: Alignment.topLeft,
                          padding: const EdgeInsets.only(left: 6, bottom: 2),
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: const Color(0xFF1E3A8A),
                            fontWeight: FontWeight.w700,
                            fontSize: 11,
                          ),
                          labelResolver: (_) => isEnglish
                              ? 'Avg: ${averagePerDay.toStringAsFixed(1)}'
                              : 'TB: ${averagePerDay.toStringAsFixed(1)}',
                        ),
                      ),
                    ],
                  ),
                  lineTouchData: LineTouchData(
                    enabled: true,
                    handleBuiltInTouches: enableHoverTooltip,
                    touchSpotThreshold: 24,
                    touchCallback: (event, response) {
                      if (enableHoverTooltip || event is! FlTapUpEvent) {
                        return;
                      }
                      final spots = response?.lineBarSpots;
                      final touchedIndex = spots != null && spots.isNotEmpty
                          ? spots.first.x.round()
                          : null;
                      if (touchedIndex == null ||
                          touchedIndex < 0 ||
                          touchedIndex >= data.length) {
                        if (_selectedSpotIndex != null) {
                          setState(() => _selectedSpotIndex = null);
                        }
                        return;
                      }
                      setState(() {
                        _selectedSpotIndex = _selectedSpotIndex == touchedIndex
                            ? null
                            : touchedIndex;
                      });
                    },
                    getTouchLineStart: (barData, spotIndex) => 0,
                    getTouchLineEnd: (barData, spotIndex) => topY,
                    getTouchedSpotIndicator: (barData, spotIndexes) {
                      return spotIndexes.map((spotIndex) {
                        return TouchedSpotIndicatorData(
                          FlLine(
                            color: const Color(
                              0xFF29ABE2,
                            ).withValues(alpha: 0.22),
                            strokeWidth: 1.1,
                            dashArray: const [5, 4],
                          ),
                          FlDotData(
                            show: true,
                            getDotPainter: (spot, percent, line, index) =>
                                FlDotCirclePainter(
                                  radius: 4,
                                  color: const Color(0xFF29ABE2),
                                  strokeWidth: 2,
                                  strokeColor: Colors.white,
                                ),
                          ),
                        );
                      }).toList();
                    },
                    touchTooltipData: LineTouchTooltipData(
                      tooltipRoundedRadius: 10,
                      tooltipPadding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      tooltipMargin: 10,
                      fitInsideHorizontally: true,
                      fitInsideVertically: true,
                      getTooltipColor: (_) => const Color(0xFF0F172A),
                      getTooltipItems: (touchedSpots) {
                        return touchedSpots.map((spot) {
                          final idx = spot.x.round();
                          if (idx < 0 || idx >= data.length) {
                            return null;
                          }
                          return LineTooltipItem(
                            isEnglish
                                ? '${_formatPointLabel(data[idx])} • ${spot.y.toInt()} activations'
                                : '${_formatPointLabel(data[idx])} • ${spot.y.toInt()} lượt',
                            const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          );
                        }).toList();
                      },
                    ),
                  ),
                  titlesData: FlTitlesData(
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 34,
                        interval: yInterval,
                        getTitlesWidget: (value, meta) {
                          if (value < 0 || value > topY) {
                            return const SizedBox.shrink();
                          }
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            child: Text(
                              value.toInt().toString(),
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: secondaryTextColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        interval: 1,
                        reservedSize: 28,
                        getTitlesWidget: (value, meta) {
                          final idx = value.round();
                          if ((value - idx).abs() > 0.001 ||
                              idx < 0 ||
                              idx >= data.length) {
                            return const SizedBox.shrink();
                          }

                          final shouldShowLabel =
                              idx == 0 ||
                              idx == data.length - 1 ||
                              idx % xLabelStep == 0;
                          if (!shouldShowLabel) {
                            return const SizedBox.shrink();
                          }

                          final d = data[idx].endDate;
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            space: 8,
                            child: Text(
                              '${d.day}/${d.month}',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: secondaryTextColor,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: yInterval,
                    getDrawingHorizontalLine: (value) => FlLine(
                      color: const Color(0xFF94A3B8).withValues(alpha: 0.16),
                      strokeWidth: 1,
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      showingIndicators:
                          !enableHoverTooltip && hasValidSelectedSpot
                          ? [_selectedSpotIndex!]
                          : const [],
                      spots: [
                        for (var i = 0; i < data.length; i++)
                          FlSpot(i.toDouble(), data[i].count.toDouble()),
                      ],
                      isCurved: true,
                      curveSmoothness: 0.25,
                      preventCurveOverShooting: true,
                      color: const Color(0xFF29ABE2),
                      barWidth: 2.2,
                      isStrokeCapRound: true,
                      dotData: FlDotData(
                        show: true,
                        checkToShowDot: (spot, barData) {
                          final idx = spot.x.round();
                          if (idx < 0 || idx >= data.length) {
                            return false;
                          }
                          return shouldShowMarker(idx);
                        },
                        getDotPainter: (spot, percent, barData, index) {
                          final isPeak = index == peakIndex;
                          return FlDotCirclePainter(
                            radius: isPeak ? 3.5 : 2.6,
                            color: isPeak
                                ? const Color(0xFFDC2626)
                                : Colors.white,
                            strokeWidth: 1.8,
                            strokeColor: isPeak
                                ? const Color(0xFFDC2626)
                                : const Color(0xFF29ABE2),
                          );
                        },
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        color: const Color(0xFF29ABE2).withValues(alpha: 0.08),
                      ),
                    ),
                  ],
                ),
                duration: Duration.zero,
                curve: Curves.linear,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: [
                _MiniKpi(
                  label: isEnglish
                      ? 'Total $windowDays days'
                      : 'Tổng $windowDays ngày',
                  value: '$totalActivations',
                ),
                _MiniKpi(
                  label: isEnglish ? 'Average / day' : 'Trung bình/ngày',
                  value: averagePerDay.toStringAsFixed(1),
                ),
                _MiniKpi(
                  label: isEnglish
                      ? '${useWeeklyBuckets ? 'Peak week' : 'Peak'} ($peakLabel)'
                      : '${useWeeklyBuckets ? 'Đỉnh tuần' : 'Đỉnh'} ($peakLabel)',
                  value: '${peakPoint.count}',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  List<_ActivationChartPoint> _buildChartData(
    List<_DailyActivation> source, {
    required bool weeklyBucket,
  }) {
    if (!weeklyBucket) {
      return [
        for (final item in source)
          _ActivationChartPoint(
            startDate: item.date,
            endDate: item.date,
            count: item.count,
          ),
      ];
    }

    final buckets = <_ActivationChartPoint>[];
    for (var i = 0; i < source.length; i += 7) {
      final end = math.min(i + 7, source.length);
      final chunk = source.sublist(i, end);
      final total = chunk.fold<int>(0, (sum, item) => sum + item.count);
      buckets.add(
        _ActivationChartPoint(
          startDate: chunk.first.date,
          endDate: chunk.last.date,
          count: total,
        ),
      );
    }
    return buckets;
  }

  String _formatPointLabel(_ActivationChartPoint point) {
    if (_isSameDay(point.startDate, point.endDate)) {
      return '${point.endDate.day}/${point.endDate.month}';
    }
    return '${point.startDate.day}/${point.startDate.month}'
        '-${point.endDate.day}/${point.endDate.month}';
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}

class _WarrantyStatusDonutCard extends StatefulWidget {
  const _WarrantyStatusDonutCard({
    required this.activations,
    required this.ranges,
    required this.initialRange,
  });

  final List<_DailyActivation> activations;
  final List<int> ranges;
  final int initialRange;

  @override
  State<_WarrantyStatusDonutCard> createState() =>
      _WarrantyStatusDonutCardState();
}

class _WarrantyStatusDonutCardState extends State<_WarrantyStatusDonutCard> {
  static const _maxSegments = 5;

  late int _selectedRange;
  int? _selectedIndex;
  Offset? _tooltipAnchor;

  @override
  void initState() {
    super.initState();
    _selectedRange = _resolveInitialRange();
  }

  @override
  void didUpdateWidget(covariant _WarrantyStatusDonutCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!listEquals(oldWidget.ranges, widget.ranges) ||
        oldWidget.initialRange != widget.initialRange) {
      _selectedRange = _resolveInitialRange();
      _selectedIndex = null;
      _tooltipAnchor = null;
    }
  }

  int _resolveInitialRange() {
    if (widget.ranges.isEmpty) {
      return 30;
    }
    if (widget.ranges.contains(widget.initialRange)) {
      return widget.initialRange;
    }
    return widget.ranges.last;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    final texts = _DashboardTexts(isEnglish: isEnglish);
    final enableHoverTooltip = kIsWeb;
    final filteredActivations = _filterByRange(
      widget.activations,
      _selectedRange,
    );
    final trackedActivationCount = widget.activations.fold<int>(
      0,
      (sum, item) => sum + item.count,
    );
    final stats = _buildWarrantyStatuses(filteredActivations);
    final total = stats.fold<int>(0, (sum, e) => sum + e.count);
    final showUnavailable = total == 0;

    final sortedStats = [...stats]
      ..sort((a, b) {
        final left = total == 0 ? 0.0 : a.count / total;
        final right = total == 0 ? 0.0 : b.count / total;
        final byPercent = right.compareTo(left);
        if (byPercent != 0) {
          return byPercent;
        }
        return b.count.compareTo(a.count);
      });
    final displayStats = _groupWarrantyStats(
      sortedStats,
      maxSegments: _maxSegments,
      isEnglish: isEnglish,
    );

    final touchedStat =
        _selectedIndex != null &&
            _selectedIndex! >= 0 &&
            _selectedIndex! < displayStats.length
        ? displayStats[_selectedIndex!]
        : null;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              texts.warrantyStatusTitle,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              showUnavailable
                  ? texts.metricUnavailableLabel
                  : (isEnglish
                        ? 'Total: $total serial-processing orders'
                        : 'Tổng: $total đơn xử lý serial'),
              style: theme.textTheme.bodySmall?.copyWith(
                color: _dashboardMutedText(context),
              ),
            ),
            const SizedBox(height: 10),
            if (!showUnavailable) ...[
              LayoutBuilder(
                builder: (context, constraints) {
                  final isCompactSegment = constraints.maxWidth < 360;
                  final segmentButton = SegmentedButton<int>(
                    showSelectedIcon: false,
                    multiSelectionEnabled: false,
                    style: ButtonStyle(
                      visualDensity: VisualDensity.compact,
                      padding: WidgetStateProperty.all(
                        EdgeInsets.symmetric(
                          horizontal: isCompactSegment ? 8 : 10,
                          vertical: 8,
                        ),
                      ),
                      side: WidgetStateProperty.resolveWith((states) {
                        if (states.contains(WidgetState.selected)) {
                          return const BorderSide(
                            color: Colors.transparent,
                            width: 0,
                          );
                        }
                        return const BorderSide(
                          color: Color(0xFFCBD5E1),
                          width: 1,
                        );
                      }),
                      backgroundColor: WidgetStateProperty.resolveWith((
                        states,
                      ) {
                        if (states.contains(WidgetState.selected)) {
                          return theme.colorScheme.primary;
                        }
                        return theme.colorScheme.surface;
                      }),
                      foregroundColor: WidgetStateProperty.resolveWith((
                        states,
                      ) {
                        if (states.contains(WidgetState.selected)) {
                          return Colors.white;
                        }
                        return const Color(0xFF475569);
                      }),
                      textStyle: WidgetStateProperty.resolveWith((states) {
                        return theme.textTheme.labelMedium?.copyWith(
                          fontWeight: states.contains(WidgetState.selected)
                              ? FontWeight.w800
                              : FontWeight.w600,
                        );
                      }),
                    ),
                    segments: [
                      for (final range in widget.ranges)
                        ButtonSegment<int>(
                          value: range,
                          label: Text(texts.warrantyRangeLabel(range)),
                        ),
                    ],
                    selected: {_selectedRange},
                    onSelectionChanged: (selected) {
                      if (selected.isEmpty) {
                        return;
                      }
                      final value = selected.first;
                      if (value == _selectedRange) {
                        return;
                      }
                      setState(() {
                        _selectedRange = value;
                        _selectedIndex = null;
                        _tooltipAnchor = null;
                      });
                    },
                  );

                  return SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.hardEdge,
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minWidth: constraints.maxWidth,
                      ),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: segmentButton,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),
            ],
            if (showUnavailable)
              _buildEmptyDonutState(
                theme,
                texts: texts,
                activationCount: trackedActivationCount,
              )
            else
              LayoutBuilder(
                builder: (context, constraints) {
                  final isWideLayout =
                      constraints.maxWidth >= _donutStackBreakpoint;
                  final rawChartWidth = isWideLayout
                      ? constraints.maxWidth * 0.45
                      : constraints.maxWidth;
                  final chartSize = math.min(rawChartWidth, 300.0);
                  final chart = _buildDonutChart(
                    theme: theme,
                    stats: displayStats,
                    total: total,
                    donutSize: chartSize,
                    maxTooltipWidth: chartSize * 0.9,
                    touchedStat: touchedStat,
                    enableHoverTooltip: enableHoverTooltip,
                  );
                  final legendList = Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (var i = 0; i < displayStats.length; i++)
                        Padding(
                          padding: EdgeInsets.only(
                            bottom: i == displayStats.length - 1 ? 0 : 8,
                          ),
                          child: _buildLegendRow(
                            theme: theme,
                            stat: displayStats[i],
                            total: total,
                            isSelected: _selectedIndex == i,
                            onTap: () {
                              setState(() {
                                _selectedIndex = _selectedIndex == i ? null : i;
                                _tooltipAnchor = null;
                              });
                            },
                          ),
                        ),
                    ],
                  );
                  final legendScrollable = ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 300),
                    child: Scrollbar(
                      thumbVisibility: isWideLayout && displayStats.length > 3,
                      child: SingleChildScrollView(child: legendList),
                    ),
                  );
                  final legendWrap = Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (var i = 0; i < displayStats.length; i++)
                        _buildLegendChip(
                          theme: theme,
                          stat: displayStats[i],
                          total: total,
                          isSelected: _selectedIndex == i,
                          isCompact: true,
                          onTap: () {
                            setState(() {
                              _selectedIndex = _selectedIndex == i ? null : i;
                              _tooltipAnchor = null;
                            });
                          },
                        ),
                    ],
                  );

                  if (!isWideLayout) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Center(
                          child: SizedBox(width: chartSize, child: chart),
                        ),
                        const SizedBox(height: 16),
                        legendWrap,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(width: chartSize, child: chart),
                      const SizedBox(width: 20),
                      Expanded(child: legendScrollable),
                    ],
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDonutChart({
    required ThemeData theme,
    required List<_WarrantyStatusStat> stats,
    required int total,
    required double donutSize,
    required double maxTooltipWidth,
    required _WarrantyStatusStat? touchedStat,
    required bool enableHoverTooltip,
  }) {
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    return SizedBox(
      width: donutSize,
      height: donutSize,
      child: Stack(
        clipBehavior: Clip.hardEdge,
        alignment: Alignment.center,
        children: [
          PieChart(
            PieChartData(
              sectionsSpace: 2,
              centerSpaceRadius: 50,
              pieTouchData: PieTouchData(
                touchCallback: (event, response) {
                  final touchedSection = response?.touchedSection;
                  final idx = touchedSection?.touchedSectionIndex;

                  if (event is FlTapCancelEvent ||
                      event is FlPointerExitEvent ||
                      event is FlLongPressEnd) {
                    if (_selectedIndex != null || _tooltipAnchor != null) {
                      setState(() {
                        _selectedIndex = null;
                        _tooltipAnchor = null;
                      });
                    }
                    return;
                  }

                  if (!enableHoverTooltip && event is! FlTapUpEvent) {
                    return;
                  }

                  if (idx == null || idx < 0 || idx >= stats.length) {
                    if (!enableHoverTooltip &&
                        (_selectedIndex != null || _tooltipAnchor != null)) {
                      setState(() {
                        _selectedIndex = null;
                        _tooltipAnchor = null;
                      });
                    }
                    return;
                  }

                  if (touchedSection == null ||
                      touchedSection.touchedSection == null) {
                    return;
                  }

                  setState(() {
                    if (!enableHoverTooltip) {
                      _selectedIndex = _selectedIndex == idx ? null : idx;
                      _tooltipAnchor = _selectedIndex == null
                          ? null
                          : _buildTooltipAnchor(
                              touchedSection,
                              donutSize: donutSize,
                            );
                      return;
                    }
                    _selectedIndex = idx;
                    _tooltipAnchor = _buildTooltipAnchor(
                      touchedSection,
                      donutSize: donutSize,
                    );
                  });
                },
              ),
              sections: [
                for (var i = 0; i < stats.length; i++)
                  PieChartSectionData(
                    color: stats[i].color,
                    value: stats[i].count.toDouble(),
                    radius: _selectedIndex == i ? 57 : 52,
                    showTitle: _selectedIndex == i,
                    title: total == 0
                        ? ''
                        : '${(stats[i].count / total * 100).round()}%',
                    titleStyle: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
              ],
            ),
            swapAnimationDuration: Duration.zero,
            swapAnimationCurve: Curves.linear,
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$total',
                style: theme.textTheme.headlineMedium?.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w900,
                  fontSize: 22,
                  height: 1.0,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                isEnglish ? 'Total' : 'Tổng',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: _dashboardMutedText(context),
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          if (touchedStat != null && _tooltipAnchor != null)
            CustomSingleChildLayout(
              delegate: _DonutTooltipPositionDelegate(anchor: _tooltipAnchor!),
              child: IgnorePointer(
                child: _DonutSliceTooltip(
                  color: touchedStat.color,
                  label: touchedStat.label,
                  count: touchedStat.count,
                  percent: (touchedStat.count / total * 100).round(),
                  maxWidth: maxTooltipWidth,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLegendRow({
    required ThemeData theme,
    required _WarrantyStatusStat stat,
    required int total,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final percent = total == 0 ? 0 : (stat.count / total * 100).round();
    return Semantics(
      button: true,
      label:
          '${stat.label}: ${texts.orderCountPercentLabel(stat.count, percent)}',
      child: Material(
        color: isSelected
            ? theme.colorScheme.surfaceContainerLow
            : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 48),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
              child: Row(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: isSelected ? 12 : 10,
                    height: isSelected ? 12 : 10,
                    decoration: BoxDecoration(
                      color: stat.color,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: stat.color.withValues(
                          alpha: isSelected ? 0.9 : 0.45,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '${stat.label}  ${texts.orderCountPercentLabel(stat.count, percent)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface,
                        fontWeight: isSelected
                            ? FontWeight.w800
                            : FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLegendChip({
    required ThemeData theme,
    required _WarrantyStatusStat stat,
    required int total,
    required bool isSelected,
    required bool isCompact,
    required VoidCallback onTap,
  }) {
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final percent = total == 0 ? 0 : (stat.count / total * 100).round();
    return Semantics(
      button: true,
      label:
          '${stat.label}: ${texts.orderCountPercentLabel(stat.count, percent)}',
      child: Material(
        color: isSelected
            ? theme.colorScheme.surfaceContainerHighest
            : theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: isSelected ? 10 : 8,
                  height: isSelected ? 10 : 8,
                  decoration: BoxDecoration(
                    color: stat.color,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${stat.label} ($percent%)',
                  style:
                      (isCompact
                              ? theme.textTheme.labelSmall
                              : theme.textTheme.labelMedium)
                          ?.copyWith(
                            color: theme.colorScheme.onSurface,
                            fontWeight: isSelected
                                ? FontWeight.w800
                                : FontWeight.w700,
                          ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyDonutState(
    ThemeData theme, {
    required _DashboardTexts texts,
    required int activationCount,
  }) {
    return Column(
      children: [
        SizedBox(
          width: 164,
          height: 164,
          child: Stack(
            alignment: Alignment.center,
            children: [
              PieChart(
                PieChartData(
                  sectionsSpace: 0,
                  centerSpaceRadius: 50,
                  pieTouchData: PieTouchData(enabled: false),
                  sections: [
                    PieChartSectionData(
                      color: Color(0xFFD6DEE8),
                      value: 100,
                      radius: 52,
                      showTitle: false,
                    ),
                  ],
                ),
                swapAnimationDuration: Duration.zero,
                swapAnimationCurve: Curves.linear,
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'N/A',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: const Color(0xFF334155),
                      fontWeight: FontWeight.w900,
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    texts.metricUnavailableLabel,
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: _dashboardMutedText(context),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Text(
          texts.warrantyStatusUnavailableMessage(activationCount),
          style: theme.textTheme.bodySmall?.copyWith(
            color: _dashboardMutedText(context),
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          texts.warrantyStatusUnavailableDescription,
          style: theme.textTheme.bodySmall?.copyWith(
            color: _dashboardMutedText(context),
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  List<_DailyActivation> _filterByRange(
    List<_DailyActivation> source,
    int days,
  ) {
    if (source.isEmpty) {
      return source;
    }
    final end = source.last.date;
    final start = DateTime(
      end.year,
      end.month,
      end.day,
    ).subtract(Duration(days: days - 1));
    return source.where((item) => !item.date.isBefore(start)).toList();
  }

  List<_WarrantyStatusStat> _groupWarrantyStats(
    List<_WarrantyStatusStat> sortedStats, {
    required int maxSegments,
    required bool isEnglish,
  }) {
    if (sortedStats.isEmpty || maxSegments <= 0) {
      return sortedStats;
    }

    final totalCount = sortedStats.fold<int>(
      0,
      (sum, item) => sum + item.count,
    );
    const minVisibleRatio = 0.04;
    var groupedCount = 0;
    final visibleStats = <_WarrantyStatusStat>[];

    for (final stat in sortedStats) {
      final ratio = totalCount == 0 ? 0.0 : stat.count / totalCount;
      if (ratio < minVisibleRatio) {
        groupedCount += stat.count;
      } else {
        visibleStats.add(stat);
      }
    }

    final otherLabel = isEnglish ? 'Other' : 'Khác';

    if (groupedCount > 0) {
      visibleStats.add(
        _WarrantyStatusStat(
          label: otherLabel,
          count: groupedCount,
          color: const Color(0xFF475569),
        ),
      );
    }

    visibleStats.sort((a, b) => b.count.compareTo(a.count));

    final keepCount = maxSegments - 1;
    if (visibleStats.length <= maxSegments || keepCount <= 0) {
      return visibleStats;
    }

    final top = visibleStats.take(keepCount).toList();
    final othersCount = visibleStats
        .skip(keepCount)
        .fold<int>(0, (sum, item) => sum + item.count);

    if (othersCount > 0) {
      top.add(
        _WarrantyStatusStat(
          label: otherLabel,
          count: othersCount,
          color: const Color(0xFF475569),
        ),
      );
    }
    return top;
  }

  Offset _buildTooltipAnchor(
    PieTouchedSection touchedSection, {
    required double donutSize,
  }) {
    final center = Offset(donutSize / 2, donutSize / 2);
    final angleRad = touchedSection.touchAngle * (math.pi / 180);
    final distance = (touchedSection.touchRadius + 16).clamp(46.0, 88.0);
    return Offset(
      center.dx + math.cos(angleRad) * distance,
      center.dy + math.sin(angleRad) * distance,
    );
  }
}

class _DonutSliceTooltip extends StatelessWidget {
  const _DonutSliceTooltip({
    required this.color,
    required this.label,
    required this.count,
    required this.percent,
    required this.maxWidth,
  });

  final Color color;
  final String label;
  final int count;
  final int percent;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    return Container(
      constraints: BoxConstraints(maxWidth: maxWidth),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.22),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          const SizedBox(width: 7),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  texts.orderCountPercentLabel(count, percent),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DonutTooltipPositionDelegate extends SingleChildLayoutDelegate {
  const _DonutTooltipPositionDelegate({required this.anchor});

  final Offset anchor;

  static const double _margin = 6;
  static const double _horizontalGap = 10;
  static const double _verticalGap = 8;

  @override
  Offset getPositionForChild(Size size, Size childSize) {
    final placeRight = anchor.dx >= size.width / 2;
    final placeBelow = anchor.dy >= size.height / 2;

    final targetLeft = placeRight
        ? anchor.dx + _horizontalGap
        : anchor.dx - _horizontalGap - childSize.width;
    final targetTop = placeBelow
        ? anchor.dy + _verticalGap
        : anchor.dy - _verticalGap - childSize.height;

    final maxLeft = math.max(_margin, size.width - childSize.width - _margin);
    final maxTop = math.max(_margin, size.height - childSize.height - _margin);

    final clampedLeft = targetLeft.clamp(_margin, maxLeft).toDouble();
    final clampedTop = targetTop.clamp(_margin, maxTop).toDouble();
    return Offset(clampedLeft, clampedTop);
  }

  @override
  bool shouldRelayout(covariant _DonutTooltipPositionDelegate oldDelegate) {
    return anchor != oldDelegate.anchor;
  }
}

// ignore: unused_element
class _TopCustomerCard extends StatelessWidget {
  const _TopCustomerCard({required this.stat});

  final _CustomerStat stat;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFE6F4FB),
            ),
            alignment: Alignment.center,
            child: Text(
              stat.initials,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: const Color(0xFF0071BC),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  stat.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  stat.phone,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: _dashboardMutedText(context),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${stat.orderCount} đơn • ${formatVnd(stat.total)}',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatVnd(stat.total),
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                'TB/đơn: ${formatVnd(stat.avgOrder)}',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: _dashboardMutedText(context),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

const _statusOrder = <OrderStatus>[
  OrderStatus.pending,
  OrderStatus.confirmed,
  OrderStatus.shipping,
  OrderStatus.completed,
];

class _ActivationChartPoint {
  const _ActivationChartPoint({
    required this.startDate,
    required this.endDate,
    required this.count,
  });

  final DateTime startDate;
  final DateTime endDate;
  final int count;
}

class _MiniKpi extends StatelessWidget {
  const _MiniKpi({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: _dashboardMutedText(context),
          ),
        ),
      ],
    );
  }
}
