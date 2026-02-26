import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'mock_data.dart';
import 'models.dart';
import 'order_controller.dart';
import 'notifications_screen.dart';
import 'product_list_screen.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/skeleton_box.dart';
import 'debt_tracking_screen.dart';

const _dashboardMutedText = Color(0xFF64748B);
const _lowStockAlertThreshold = 10;
const _mobileBreakpoint = 600.0;
const _tabletBreakpoint = 900.0;
const _desktopBreakpoint = 1200.0;
const _overviewCompactBreakpoint = 480.0;
const _donutStackBreakpoint = 420.0;
const _compactDebtRowBreakpoint = 420.0;
const _maxDashboardContentWidth = 1280.0;

enum _DashboardTimeFilter { month, quarter }

enum _DashboardQuickAction { createOrder, activateWarranty }

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isLoading = true;
  _DashboardTimeFilter _timeFilter = _DashboardTimeFilter.month;

  @override
  void initState() {
    super.initState();
    _loadMockDashboard();
  }

  Future<void> _loadMockDashboard() async {
    await Future.delayed(const Duration(milliseconds: 450));
    if (!mounted) {
      return;
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final orderController = OrderScope.of(context);
    final orders = orderController.orders;
    final monthlyRevenue = _buildMonthlyRevenue(orders);
    final activationSeries = _buildActivationSeries(days: 30);
    final warrantyActivationSeries = _buildActivationSeries(days: 90);

    final now = DateTime.now();
    final periodContextLabel = _periodContextLabel(now);
    final currentMonthRevenue = monthlyRevenue[now.month - 1].value;
    final currentMonthOrders = orders
        .where(
          (order) =>
              order.createdAt.year == now.year &&
              order.createdAt.month == now.month,
        )
        .length;

    final screenWidth = MediaQuery.sizeOf(context).width;
    final isMobile = screenWidth < _mobileBreakpoint;
    final horizontalPadding = isMobile ? 16.0 : 20.0;
    final listBottomPadding = 24.0;

    final content = _isLoading
        ? const _DashboardLoadingView()
        : ListView(
            padding: EdgeInsets.fromLTRB(
              horizontalPadding,
              16,
              horizontalPadding,
              listBottomPadding,
            ),
            children: [
              FadeSlideIn(
                child: _OverviewCard(
                  totalDebt: orderController.totalOutstandingDebt,
                  currentMonthRevenue: currentMonthRevenue,
                  currentMonthOrders: currentMonthOrders,
                  contextLabel: periodContextLabel,
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 95),
                child: const _SectionTitle(title: 'Hiệu suất theo dõi'),
              ),
              const SizedBox(height: 8),
              LayoutBuilder(
                builder: (context, constraints) {
                  final cols = constraints.maxWidth >= _desktopBreakpoint
                      ? 3
                      : constraints.maxWidth >= _tabletBreakpoint
                      ? 2
                      : 1;
                  final childWidth =
                      (constraints.maxWidth - (cols - 1) * 12) / cols;
                  return Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      SizedBox(
                        width: childWidth,
                        child: FadeSlideIn(
                          delay: const Duration(milliseconds: 110),
                          child: _OrderStatusDistributionCard(orders: orders),
                        ),
                      ),
                      SizedBox(
                        width: childWidth,
                        child: FadeSlideIn(
                          delay: const Duration(milliseconds: 115),
                          child: _AgingDebtCard(
                            buckets: _buildDebtBuckets(
                              orderController.totalOutstandingDebt,
                            ),
                            onViewAll: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const DebtTrackingScreen(),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      SizedBox(
                        width: childWidth,
                        child: FadeSlideIn(
                          delay: const Duration(milliseconds: 120),
                          child: _LowStockPanel(
                            products: _buildLowStockProducts(),
                          ),
                        ),
                      ),
                      SizedBox(
                        width: childWidth,
                        child: FadeSlideIn(
                          delay: const Duration(milliseconds: 125),
                          child: _ActivationTrendCard(data: activationSeries),
                        ),
                      ),
                      SizedBox(
                        width: childWidth,
                        child: FadeSlideIn(
                          delay: const Duration(milliseconds: 130),
                          child: _WarrantyStatusDonutCard(
                            activations: warrantyActivationSeries,
                          ),
                        ),
                      ),
                      SizedBox(
                        width: childWidth,
                        child: FadeSlideIn(
                          delay: const Duration(milliseconds: 135),
                          child: _RevenueChartCard(data: monthlyRevenue),
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 140),
                child: const _SectionTitle(title: 'Đơn hàng gần đây'),
              ),
              const SizedBox(height: 8),
              if (orders.isEmpty)
                const _EmptyCard(message: 'Chưa có đơn nào.')
              else
                ...orders.take(5).map((order) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _RecentOrderCard(order: order),
                  );
                }),
            ],
          );

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle('Tổng quan - $periodContextLabel'),
        actions: [
          PopupMenuButton<_DashboardTimeFilter>(
            tooltip: 'Lọc thời gian',
            icon: const Icon(Icons.calendar_month_outlined),
            initialValue: _timeFilter,
            onSelected: (value) {
              if (_timeFilter == value) {
                return;
              }
              setState(() => _timeFilter = value);
            },
            itemBuilder: (context) => [
              CheckedPopupMenuItem<_DashboardTimeFilter>(
                value: _DashboardTimeFilter.month,
                checked: _timeFilter == _DashboardTimeFilter.month,
                child: const Text('Theo tháng'),
              ),
              CheckedPopupMenuItem<_DashboardTimeFilter>(
                value: _DashboardTimeFilter.quarter,
                checked: _timeFilter == _DashboardTimeFilter.quarter,
                child: const Text('Theo quý'),
              ),
            ],
          ),
          IconButton(
            tooltip: 'Thông báo',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
            icon: const Icon(Icons.notifications_outlined),
          ),
          if (isMobile)
            PopupMenuButton<_DashboardQuickAction>(
              tooltip: 'Thao tac nhanh',
              icon: const Icon(Icons.more_horiz_rounded),
              onSelected: _handleQuickAction,
              itemBuilder: (context) => const [
                PopupMenuItem<_DashboardQuickAction>(
                  value: _DashboardQuickAction.createOrder,
                  child: Text('T\u1ea1o \u0111\u01a1n nh\u1eadp'),
                ),
                PopupMenuItem<_DashboardQuickAction>(
                  value: _DashboardQuickAction.activateWarranty,
                  child: Text('K\u00edch ho\u1ea1t BH'),
                ),
              ],
            ),
          if (!isMobile) ...[
            TextButton.icon(
              onPressed: () =>
                  _handleQuickAction(_DashboardQuickAction.createOrder),
              icon: const Icon(Icons.add_shopping_cart_outlined),
              label: const Text('Tạo đơn nhập'),
            ),
            TextButton.icon(
              onPressed: () =>
                  _handleQuickAction(_DashboardQuickAction.activateWarranty),
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Kích hoạt BH'),
            ),
            const SizedBox(width: 6),
          ],
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            maxWidth: _maxDashboardContentWidth,
          ),
          child: content,
        ),
      ),
    );
  }

  void _handleQuickAction(_DashboardQuickAction action) {
    final message = switch (action) {
      _DashboardQuickAction.createOrder =>
        'T\u00ednh n\u0103ng t\u1ea1o \u0111\u01a1n \u0111ang \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt.',
      _DashboardQuickAction.activateWarranty =>
        'T\u00ednh n\u0103ng k\u00edch ho\u1ea1t b\u1ea3o h\u00e0nh \u0111ang \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt.',
    };

    final messenger = ScaffoldMessenger.of(context);
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
      );
  }

  String _periodContextLabel(DateTime date) {
    if (_timeFilter == _DashboardTimeFilter.month) {
      return 'Tháng ${date.month}/${date.year}';
    }
    final quarter = ((date.month - 1) ~/ 3) + 1;
    return 'Quý $quarter/${date.year}';
  }
}

class _OverviewCard extends StatelessWidget {
  const _OverviewCard({
    required this.totalDebt,
    required this.currentMonthRevenue,
    required this.currentMonthOrders,
    required this.contextLabel,
  });

  final int totalDebt;
  final int currentMonthRevenue;
  final int currentMonthOrders;
  final String contextLabel;

  @override
  Widget build(BuildContext context) {
    const revenueAccent = Color(0xFF38BDF8);
    const debtAccent = Color(0xFFF59E0B);
    const orderAccent = Color(0xFF22C55E);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1D4ED8), Color(0xFF2563EB)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'T\u1ed5ng quan v\u1eadn h\u00e0nh',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Bối cảnh dữ liệu: $contextLabel',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: const Color(0xF2FFFFFF),
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 14),
          _OverviewMetricTile(
            icon: Icons.payments_rounded,
            accentColor: revenueAccent,
            label: 'Gi\u00e1 tr\u1ecb nh\u1eadp h\u00e0ng th\u00e1ng',
            value: _formatCompactVnd(currentMonthRevenue),
            isPrimary: true,
          ),
          const SizedBox(height: 10),
          LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < _overviewCompactBreakpoint;
              final debtCard = _OverviewMetricTile(
                icon: Icons.account_balance_wallet_rounded,
                accentColor: debtAccent,
                label: 'T\u1ed5ng c\u00f4ng n\u1ee3',
                value: _formatCompactVnd(totalDebt),
                isPrimary: false,
              );
              final orderCard = _OverviewMetricTile(
                icon: Icons.receipt_long_rounded,
                accentColor: orderAccent,
                label: '\u0110\u01a1n trong th\u00e1ng',
                value: '$currentMonthOrders',
                isPrimary: false,
              );

              if (compact) {
                return Column(
                  children: [debtCard, const SizedBox(height: 10), orderCard],
                );
              }

              return Row(
                children: [
                  Expanded(child: debtCard),
                  const SizedBox(width: 10),
                  Expanded(child: orderCard),
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
  const _RevenueChartCard({required this.data});

  final List<_MonthRevenue> data;

  @override
  State<_RevenueChartCard> createState() => _RevenueChartCardState();
}

class _RevenueChartCardState extends State<_RevenueChartCard> {
  int? _selectedBarGroupIndex;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final currentMonth = now.month;
    final currentYear = now.year;

    final monthsWithData = widget.data.where((item) => item.value > 0).toList();
    final hasAnyData = monthsWithData.isNotEmpty;
    final hasSparseData = hasAnyData && monthsWithData.length <= 2;
    final chartData = widget.data;
    final zeroValueMonthCount = chartData
        .where((item) => item.value <= 0)
        .length;
    final showMissingMonthNote = zeroValueMonthCount > 0;
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

    final subtitle = !hasAnyData
        ? 'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u \u0111\u01a1n nh\u1eadp trong n\u0103m $currentYear.'
        : hasSparseData
        ? '\u0110\u00e3 c\u00f3 d\u1eef li\u1ec7u ${monthsWithData.length}/12 th\u00e1ng c\u1ee7a n\u0103m $currentYear.'
        : 'T\u1ed5ng h\u1ee3p gi\u00e1 tr\u1ecb \u0111\u01a1n nh\u1eadp theo t\u1eebng th\u00e1ng trong n\u0103m $currentYear.';

    final showValueLabels = hasAnyData && monthsWithData.length <= 2;
    final yearlyTotal = widget.data.fold<int>(
      0,
      (sum, item) => sum + item.value,
    );
    final currentMonthValue = widget.data[currentMonth - 1].value;
    final previousMonthValue = currentMonth > 1
        ? widget.data[currentMonth - 2].value
        : 0;
    final monthChangePercent = previousMonthValue <= 0
        ? 0.0
        : (currentMonthValue - previousMonthValue) / previousMonthValue * 100;
    final monthChangeText = previousMonthValue <= 0
        ? (currentMonthValue > 0
              ? 'M\u1edbi ph\u00e1t sinh'
              : 'Kh\u00f4ng \u0111\u1ed5i')
        : '${monthChangePercent >= 0 ? '+' : ''}${monthChangePercent.toStringAsFixed(1)}%';
    final monthChangeColor = previousMonthValue <= 0
        ? const Color(0xFF475569)
        : currentMonthValue >= previousMonthValue
        ? const Color(0xFF15803D)
        : const Color(0xFFB91C1C);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Gi\u00e1 tr\u1ecb nh\u1eadp h\u00e0ng theo th\u00e1ng ($currentYear)',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: theme.textTheme.bodySmall?.copyWith(
                color: _dashboardMutedText,
              ),
            ),
            if (hasAnyData) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  _InsightChip(
                    label: 'T\u1ed5ng n\u0103m',
                    value: _formatCompactVnd(yearlyTotal),
                    valueColor: const Color(0xFF1E3A8A),
                  ),
                  _InsightChip(
                    label: 'Th\u00e1ng n\u00e0y',
                    value: _formatCompactVnd(currentMonthValue),
                    valueColor: const Color(0xFF1E3A8A),
                  ),
                  _InsightChip(
                    label: 'So v\u1edbi th\u00e1ng tr\u01b0\u1edbc',
                    value: monthChangeText,
                    valueColor: monthChangeColor,
                  ),
                ],
              ),
            ],
            if (showMissingMonthNote) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F9FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFBAE6FD)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.info_outline_rounded,
                      size: 15,
                      color: Color(0xFF0369A1),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Hiển thị đủ 12 tháng, $zeroValueMonthCount tháng chưa có dữ liệu đang được hiển thị là 0.',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: const Color(0xFF075985),
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
                height: 220,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                alignment: Alignment.center,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.bar_chart_rounded,
                      color: Color(0xFF94A3B8),
                      size: 30,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Chưa có dữ liệu thống kê',
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: const Color(0xFF334155),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Dữ liệu sẽ hiển thị khi có đơn nhập phát sinh.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              )
            else
              SizedBox(
                height: 240,
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
                          if (groupIndex < 0 ||
                              groupIndex >= chartData.length) {
                            return null;
                          }
                          final item = chartData[groupIndex];
                          return BarTooltipItem(
                            '${item.label}/$currentYear\n${formatVnd(item.value)}',
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
                                  color: const Color(0xFF64748B),
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
                            final isCurrent = item.month == currentMonth;
                            final hasValue = item.value > 0;
                            return SideTitleWidget(
                              axisSide: meta.axisSide,
                              space: 6,
                              child: Text(
                                item.label,
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: isCurrent
                                      ? const Color(0xFF1D4ED8)
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
                                currentMonth,
                              ),
                              borderSide: chartData[i].month == currentMonth
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
                ),
              ),
          ],
        ),
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
      colors: [Color(0xFF1D4ED8), Color(0xFF60A5FA)],
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: const Color(0xFF64748B),
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
  const _RecentOrderCard({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = _statusColor(order.status);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
      ),
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
                      color: const Color(0xFF0F172A),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                _OrderStatusTag(label: order.status.label, color: statusColor),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              formatVnd(order.total),
              style: theme.textTheme.titleLarge?.copyWith(
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${_formatRecentOrderMetaDate(order.createdAt)} \u2022 ${order.totalItems} SP \u2022 ${_shortPaymentStatus(order.paymentStatus)}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: const Color(0xFF475569),
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
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

String _shortPaymentStatus(OrderPaymentStatus status) {
  switch (status) {
    case OrderPaymentStatus.unpaid:
      return 'Ch\u01b0a thanh to\u00e1n';
    case OrderPaymentStatus.paid:
      return '\u0110\u00e3 thanh to\u00e1n';
    case OrderPaymentStatus.debtRecorded:
      return 'C\u00f4ng n\u1ee3';
  }
}

class _LowStockCard extends StatelessWidget {
  const _LowStockCard({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final shortage = math.max(0, _lowStockAlertThreshold - product.stock);
    final isCritical = product.stock <= 3;
    final accentColor = isCritical
        ? const Color(0xFFDC2626)
        : const Color(0xFFD97706);
    final surfaceColor = isCritical
        ? const Color(0xFFFEF2F2)
        : const Color(0xFFFFF7ED);
    final borderColor = isCritical
        ? const Color(0xFFFCA5A5)
        : const Color(0xFFFCD34D);
    final ratio = (product.stock / _lowStockAlertThreshold)
        .clamp(0.0, 1.0)
        .toDouble();
    final minimumTarget = product.minOrderQty <= 0 ? 1 : product.minOrderQty;
    final shortageToMinimum = math.max(0, minimumTarget - product.stock);
    final statusLabel = shortage > 0
        ? 'Thiếu $shortage so với ngưỡng $_lowStockAlertThreshold'
        : 'Chạm ngưỡng cảnh báo';

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
                child: Icon(
                  _categoryIcon(product.category),
                  size: 20,
                  color: accentColor,
                ),
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
                        color: const Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'SKU: ${_compactSku(product.sku)}',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: const Color(0xFF64748B),
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
                  color: Colors.white.withValues(alpha: 0.72),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: borderColor.withValues(alpha: 0.65),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${product.stock}/$_lowStockAlertThreshold',
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: accentColor,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      'Tồn / Ngưỡng',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: const Color(0xFF475569),
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
                shortageToMinimum > 0
                    ? 'Min $minimumTarget (thiếu $shortageToMinimum)'
                    : 'Min: $minimumTarget',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: const Color(0xFF334155),
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

IconData _categoryIcon(ProductCategory category) {
  switch (category) {
    case ProductCategory.headset:
      return Icons.headset_mic_rounded;
    case ProductCategory.keyboard:
      return Icons.keyboard_rounded;
    case ProductCategory.mouse:
      return Icons.mouse_rounded;
    case ProductCategory.speaker:
      return Icons.speaker_rounded;
    case ProductCategory.webcam:
      return Icons.videocam_rounded;
    case ProductCategory.accessory:
      return Icons.cable_rounded;
  }
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
  const _LowStockPanel({required this.products});

  final List<Product> products;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: const Color(0xFFFFF1F2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFEF4444), width: 1.3),
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
                    color: const Color(0xFFFEF2F2),
                    border: Border.all(
                      color: const Color(0xFFEF4444),
                      width: 1.4,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: const Icon(
                    Icons.warning_amber_rounded,
                    size: 22,
                    color: Color(0xFFDC2626),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Cảnh báo tồn kho thấp',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF7F1D1D),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Mức ưu tiên cao, cần bổ sung hàng ngay.',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: const Color(0xFF7C2D12),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                if (products.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: const Color(0xFFFCA5A5)),
                    ),
                    child: Text(
                      '${products.length} SKU',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: const Color(0xFFB91C1C),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            if (products.isEmpty)
              const _EmptyCard(message: 'Tất cả SKU đang đủ tồn.')
            else
              ...products.asMap().entries.map((entry) {
                final index = entry.key;
                final product = entry.value;
                return Padding(
                  padding: EdgeInsets.only(
                    bottom: index == products.length - 1 ? 0 : 8,
                  ),
                  child: _LowStockCard(product: product),
                );
              }),
            if (products.isNotEmpty) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const ProductListScreen(),
                      ),
                    );
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFDC2626),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(0, 42),
                  ),
                  icon: const Icon(Icons.local_shipping_outlined, size: 18),
                  label: const Text('Nhập thêm ngay'),
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
  const _OrderStatusDistributionCard({required this.orders});

  final List<Order> orders;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final totals = _computeStatusTotals(orders);
    final totalCount = totals.values.fold<int>(0, (sum, v) => sum + v);
    final showEmpty = totalCount == 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5EAF5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
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
                child: Text(
                  'Phân bố trạng thái đơn',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              if (!showEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    'Tổng: $totalCount đơn',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: const Color(0xFF334155),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          if (!showEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Text(
                'Thanh trạng thái được chuẩn hóa cùng thang đo để so sánh nhanh.',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: const Color(0xFF475569),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          const SizedBox(height: 12),
          if (showEmpty)
            const _EmptyCard(message: 'Chưa có đơn hàng nào.')
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
                    label: status.label,
                    count: count,
                    ratio: ratio,
                    percent: percent,
                    color: _statusColor(status),
                    onTap: () => _showStatusDetailSheet(
                      context: context,
                      status: status,
                      orders: statusOrders,
                      totalCount: totalCount,
                      color: _statusColor(status),
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
    final count = orders.length;
    final ratio = totalCount == 0 ? 0.0 : count / totalCount;
    final percent = totalCount == 0 ? 0 : (ratio * 100).round();

    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) {
        final theme = Theme.of(context);
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
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
                        status.label,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Text(
                      '$count đơn ($percent%)',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF1E293B),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Danh sách đơn theo trạng thái đã chọn',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF475569),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 12),
                if (orders.isEmpty)
                  const _EmptyCard(
                    message: 'Không có đơn nào ở trạng thái này.',
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
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          title: Text(order.id),
                          subtitle: Text(formatDateTime(order.createdAt)),
                          trailing: Text(
                            formatVnd(order.total),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF1E293B),
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
    final content = Row(
      children: [
        SizedBox(
          width: 86,
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall?.copyWith(
              color: const Color(0xFF334155),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: ClipRRect(
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
          ),
        ),
        const SizedBox(width: 10),
        SizedBox(
          width: 78,
          child: Text(
            '$count đơn\n$percent%',
            textAlign: TextAlign.right,
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1E293B),
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
        child: Row(
          children: [
            Expanded(child: content),
            const SizedBox(width: 4),
            Icon(
              Icons.chevron_right_rounded,
              size: 18,
              color: const Color(0xFF64748B),
            ),
          ],
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
    final total = buckets.fold<int>(0, (sum, b) => sum + b.amount);
    final showEmpty = total == 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5EAF5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
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
                child: Text(
                  'Công nợ theo tuổi nợ',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              TextButton.icon(
                onPressed: onViewAll,
                style: TextButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                  foregroundColor: const Color(0xFF1D4ED8),
                ),
                icon: const Icon(Icons.list_alt_outlined, size: 18),
                label: const Text('Xem danh sách'),
              ),
            ],
          ),
          if (!showEmpty) ...[
            const SizedBox(height: 4),
            Text(
              'Tổng công nợ: ${formatVnd(total)}',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF1E293B),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
          const SizedBox(height: 12),
          if (showEmpty)
            const _EmptyCard(message: 'Chưa có công nợ.')
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
    );
  }

  void _showBucketDetailSheet({
    required BuildContext context,
    required _DebtBucket bucket,
    required int total,
  }) {
    final ratio = total == 0 ? 0.0 : bucket.amount / total;
    final percent = total == 0 ? 0 : (ratio * 100).round();

    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        final theme = Theme.of(context);
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
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
                        color: const Color(0xFF1E293B),
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Giá trị: ${formatVnd(bucket.amount)}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: const Color(0xFF1E293B),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _bucketDescription(bucket),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: const Color(0xFF475569),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (bucket.minDay >= 91) ...[
                  const SizedBox(height: 6),
                  Text(
                    '>90 ngày bao gồm toàn bộ công nợ quá hạn từ 91 ngày trở lên.',
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
                  label: const Text('Mở danh sách công nợ'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _bucketDescription(_DebtBucket bucket) {
    if (bucket.minDay >= 91) {
      return 'Nhóm nợ quá hạn cao, cần ưu tiên theo dõi và thu hồi.';
    }
    return 'Nhóm này bao gồm các khoản nợ từ ${bucket.minDay} đến ${bucket.maxDay} ngày.';
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
        Icon(_bucketIcon(bucket), size: 14, color: const Color(0xFF64748B)),
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
                  color: const Color(0xFF1E293B),
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                '$percent%',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: const Color(0xFF475569),
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

class _NoticeCard extends StatelessWidget {
  const _NoticeCard({required this.notice});

  final DistributorNotice notice;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
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
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: _dashboardMutedText),
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
  const _EmptyCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
      ),
      child: Padding(padding: const EdgeInsets.all(16), child: Text(message)),
    );
  }
}

class _DashboardLoadingView extends StatelessWidget {
  const _DashboardLoadingView();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
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

class _MonthRevenue {
  const _MonthRevenue({required this.month, required this.value});

  final int month;
  final int value;

  String get label => 'T$month';
}

List<_MonthRevenue> _buildMonthlyRevenue(List<Order> orders) {
  final now = DateTime.now();
  final values = List<int>.filled(12, 0);
  for (final order in orders) {
    if (order.createdAt.year != now.year) {
      continue;
    }
    values[order.createdAt.month - 1] += order.total;
  }

  return [
    for (var i = 0; i < 12; i++) _MonthRevenue(month: i + 1, value: values[i]),
  ];
}

List<_CustomerStat> _buildTopCustomers(List<Order> orders) {
  final Map<String, _CustomerStat> map = {};

  for (final order in orders) {
    final key = '${order.receiverName}-${order.receiverPhone}';
    final current = map[key];
    final updated = _CustomerStat(
      name: order.receiverName,
      phone: order.receiverPhone,
      total: (current?.total ?? 0) + order.total,
      orderCount: (current?.orderCount ?? 0) + 1,
      lastOrder: [
        if (current != null) current.lastOrder,
        order.createdAt,
      ].reduce((a, b) => a.isAfter(b) ? a : b),
    );
    map[key] = updated;
  }

  final list = map.values.toList()
    ..sort((a, b) {
      final totalCompare = b.total.compareTo(a.total);
      if (totalCompare != 0) return totalCompare;
      return b.lastOrder.compareTo(a.lastOrder);
    });
  return list;
}

List<Product> _buildLowStockProducts() {
  final products =
      mockProducts
          .where((p) => p.isOrderable && p.stock <= _lowStockAlertThreshold)
          .toList()
        ..sort((a, b) => a.stock.compareTo(b.stock));
  return products.take(5).toList();
}

List<_DebtBucket> _buildDebtBuckets(int totalOutstandingDebt) {
  const buckets = [
    _DebtBucket(
      label: '0-30 ngày',
      minDay: 0,
      maxDay: 30,
      color: Color(0xFF1D4ED8),
    ),
    _DebtBucket(
      label: '31-60 ngày',
      minDay: 31,
      maxDay: 60,
      color: Color(0xFF7C3AED),
    ),
    _DebtBucket(
      label: '61-90 ngày',
      minDay: 61,
      maxDay: 90,
      color: Color(0xFFEA580C),
    ),
    _DebtBucket(
      label: '>90 ngày',
      minDay: 91,
      maxDay: 9999,
      color: Color(0xFFD92D20),
    ),
  ];

  if (totalOutstandingDebt <= 0) {
    return buckets.map((b) => b.copyWith(amount: 0)).toList();
  }
  // Mock distribution: split theo tỷ lệ mẫu.
  final splits = [0.35, 0.25, 0.20, 0.20];
  return [
    for (var i = 0; i < buckets.length; i++)
      buckets[i].copyWith(amount: (totalOutstandingDebt * splits[i]).round()),
  ];
}

List<_DailyActivation> _buildActivationSeries({required int days}) {
  final now = DateTime.now();
  final List<_DailyActivation> list = [];
  for (var i = days - 1; i >= 0; i--) {
    final date = DateTime(
      now.year,
      now.month,
      now.day,
    ).subtract(Duration(days: i));
    // deterministic mock: based on date to stay stable
    final count =
        (date.day * date.month) % 7 +
        (date.weekday == DateTime.saturday ? 2 : 0);
    list.add(_DailyActivation(date: date, count: count));
  }
  return list;
}

List<_WarrantyStatusStat> _buildWarrantyStatuses(
  List<_DailyActivation> activations,
) {
  final total = activations.fold<int>(0, (s, d) => s + d.count);
  if (total == 0) {
    return const [
      _WarrantyStatusStat(
        label: 'Kích hoạt',
        count: 0,
        color: Color(0xFF1D4ED8),
      ),
      _WarrantyStatusStat(
        label: 'Chờ xử lý',
        count: 0,
        color: Color(0xFF6D28D9),
      ),
      _WarrantyStatusStat(
        label: 'Đang xử lý',
        count: 0,
        color: Color(0xFFC2410C),
      ),
      _WarrantyStatusStat(
        label: 'Hoàn tất',
        count: 0,
        color: Color(0xFF15803D),
      ),
      _WarrantyStatusStat(label: 'Từ chối', count: 0, color: Color(0xFFB91C1C)),
    ];
  }
  // mock distribution based on total
  final dist = {
    'Kích hoạt': (total * 0.55).round(),
    'Chờ xử lý': (total * 0.12).round(),
    'Đang xử lý': (total * 0.18).round(),
    'Hoàn tất': (total * 0.12).round(),
    'Từ chối': total, // will adjust below
  };
  dist['Từ chối'] = math.max(
    0,
    total - dist.values.take(4).fold<int>(0, (s, v) => s + v),
  );

  return [
    _WarrantyStatusStat(
      label: 'Kích hoạt',
      count: dist['Kích hoạt']!,
      color: const Color(0xFF1D4ED8),
    ),
    _WarrantyStatusStat(
      label: 'Chờ xử lý',
      count: dist['Chờ xử lý']!,
      color: const Color(0xFF6D28D9),
    ),
    _WarrantyStatusStat(
      label: 'Đang xử lý',
      count: dist['Đang xử lý']!,
      color: const Color(0xFFC2410C),
    ),
    _WarrantyStatusStat(
      label: 'Hoàn tất',
      count: dist['Hoàn tất']!,
      color: const Color(0xFF15803D),
    ),
    _WarrantyStatusStat(
      label: 'Từ chối',
      count: dist['Từ chối']!,
      color: const Color(0xFFB91C1C),
    ),
  ];
}

Color _statusColor(OrderStatus status) {
  switch (status) {
    case OrderStatus.pendingApproval:
      return const Color(0xFFC2410C);
    case OrderStatus.approved:
      return const Color(0xFF2563EB);
    case OrderStatus.shipping:
      return const Color(0xFF7C3AED);
    case OrderStatus.completed:
      return const Color(0xFF15803D);
  }
}

class _ActivationTrendCard extends StatefulWidget {
  const _ActivationTrendCard({required this.data});

  final List<_DailyActivation> data;

  @override
  State<_ActivationTrendCard> createState() => _ActivationTrendCardState();
}

class _ActivationTrendCardState extends State<_ActivationTrendCard> {
  int? _selectedSpotIndex;

  @override
  Widget build(BuildContext context) {
    final data = widget.data;
    final theme = Theme.of(context);
    const secondaryTextColor = Color(0xFF475569);

    if (data.isEmpty) {
      return const _EmptyCard(message: 'Chưa có kích hoạt nào trong 30 ngày.');
    }

    var peakIndex = 0;
    for (var i = 1; i < data.length; i++) {
      if (data[i].count > data[peakIndex].count) {
        peakIndex = i;
      }
    }
    final peakPoint = data[peakIndex];

    final totalActivations = data.fold<int>(0, (sum, item) => sum + item.count);
    final averagePerDay = totalActivations / data.length;
    final maxY = data
        .fold<int>(0, (max, item) => math.max(max, item.count))
        .toDouble();
    final roughTopY = math.max(5, (maxY * 1.2).ceil()).toDouble();
    final yInterval = math.max(1, (roughTopY / 4).ceil()).toDouble();
    final topY = (roughTopY / yInterval).ceil() * yInterval;
    final chartMinX = -1.0;
    final chartMaxX = data.length.toDouble();
    final enableHoverTooltip = kIsWeb;

    bool shouldShowMarker(int index) {
      return index == 0 || index == data.length - 1 || index == peakIndex;
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Kích hoạt bảo hành ở 30 ngày gần nhất',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Số lượt kích hoạt theo từng ngày',
              style: theme.textTheme.bodySmall?.copyWith(
                color: secondaryTextColor,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Đơn vị: lượt/ngày',
              style: theme.textTheme.labelSmall?.copyWith(
                color: secondaryTextColor,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 220,
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
                        color: const Color(0xFF2563EB).withValues(alpha: 0.4),
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
                          labelResolver: (_) =>
                              'TB: ${averagePerDay.toStringAsFixed(1)}',
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
                              0xFF2563EB,
                            ).withValues(alpha: 0.22),
                            strokeWidth: 1.1,
                            dashArray: const [5, 4],
                          ),
                          FlDotData(
                            show: true,
                            getDotPainter: (spot, percent, line, index) =>
                                FlDotCirclePainter(
                                  radius: 4,
                                  color: const Color(0xFF2563EB),
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
                          final d = data[idx].date;
                          return LineTooltipItem(
                            '${d.day}/${d.month} • ${spot.y.toInt()} lượt',
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
                              idx % 6 == 0;
                          if (!shouldShowLabel) {
                            return const SizedBox.shrink();
                          }

                          final d = data[idx].date;
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
                          !enableHoverTooltip && _selectedSpotIndex != null
                          ? [_selectedSpotIndex!]
                          : const [],
                      spots: [
                        for (var i = 0; i < data.length; i++)
                          FlSpot(i.toDouble(), data[i].count.toDouble()),
                      ],
                      isCurved: true,
                      curveSmoothness: 0.25,
                      preventCurveOverShooting: true,
                      color: const Color(0xFF2563EB),
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
                                : const Color(0xFF2563EB),
                          );
                        },
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        color: const Color(0xFF2563EB).withValues(alpha: 0.08),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: [
                _MiniKpi(label: 'Tổng 30 ngày', value: '$totalActivations'),
                _MiniKpi(
                  label: 'Trung bình/ngày',
                  value: averagePerDay.toStringAsFixed(1),
                ),
                _MiniKpi(
                  label: 'Đỉnh (${peakPoint.date.day}/${peakPoint.date.month})',
                  value: '${peakPoint.count}',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _WarrantyStatusDonutCard extends StatefulWidget {
  const _WarrantyStatusDonutCard({required this.activations});

  final List<_DailyActivation> activations;

  @override
  State<_WarrantyStatusDonutCard> createState() =>
      _WarrantyStatusDonutCardState();
}

class _WarrantyStatusDonutCardState extends State<_WarrantyStatusDonutCard> {
  static const _ranges = <int>[7, 30, 90];
  static const _maxSegments = 5;

  int _selectedRange = 30;
  int? _selectedIndex;
  Offset? _tooltipAnchor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final enableHoverTooltip = kIsWeb;
    final filteredActivations = _filterByRange(
      widget.activations,
      _selectedRange,
    );
    final stats = _buildWarrantyStatuses(filteredActivations);
    final total = stats.fold<int>(0, (sum, e) => sum + e.count);
    final showEmpty = total == 0;

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
    );
    final isGroupedLegend = displayStats.length != sortedStats.length;

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
        side: const BorderSide(color: Color(0xFFE5EAF5)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Trạng thái bảo hành',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Tổng: $total serial/claim',
              style: theme.textTheme.bodySmall?.copyWith(
                color: _dashboardMutedText,
              ),
            ),
            const SizedBox(height: 10),
            SegmentedButton<int>(
              showSelectedIcon: false,
              multiSelectionEnabled: false,
              style: ButtonStyle(
                visualDensity: VisualDensity.compact,
                padding: WidgetStateProperty.all(
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
                side: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.selected)) {
                    return const BorderSide(
                      color: Colors.transparent,
                      width: 0,
                    );
                  }
                  return const BorderSide(color: Color(0xFFCBD5E1), width: 1);
                }),
                backgroundColor: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.selected)) {
                    return const Color(0xFF1D4ED8);
                  }
                  return Colors.white;
                }),
                foregroundColor: WidgetStateProperty.resolveWith((states) {
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
                for (final range in _ranges)
                  ButtonSegment<int>(value: range, label: Text('$range ngày')),
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
            ),
            if (isGroupedLegend) ...[
              const SizedBox(height: 6),
              Text(
                'Hiển thị nhóm tỉ trọng cao nhất + Khác để dễ quét nhanh.',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
            const SizedBox(height: 12),
            if (showEmpty)
              _buildEmptyDonutState(theme)
            else
              LayoutBuilder(
                builder: (context, constraints) {
                  final useVerticalLayout =
                      constraints.maxWidth < _donutStackBreakpoint;
                  final donutSize = useVerticalLayout ? 164.0 : 148.0;
                  final chart = _buildDonutChart(
                    theme: theme,
                    stats: displayStats,
                    total: total,
                    donutSize: donutSize,
                    touchedStat: touchedStat,
                    enableHoverTooltip: enableHoverTooltip,
                  );
                  final legend = Column(
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

                  if (useVerticalLayout) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Center(child: chart),
                        const SizedBox(height: 12),
                        legend,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      chart,
                      const SizedBox(width: 16),
                      Expanded(child: legend),
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
    required _WarrantyStatusStat? touchedStat,
    required bool enableHoverTooltip,
  }) {
    return SizedBox(
      width: donutSize,
      height: donutSize,
      child: Stack(
        clipBehavior: Clip.none,
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
            swapAnimationDuration: const Duration(milliseconds: 320),
            swapAnimationCurve: Curves.easeOutCubic,
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$total',
                style: theme.textTheme.headlineMedium?.copyWith(
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w900,
                  fontSize: 22,
                  height: 1.0,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Tổng',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          if (touchedStat != null && _tooltipAnchor != null)
            Positioned(
              left:
                  _tooltipAnchor!.dx +
                  (_tooltipAnchor!.dx >= donutSize / 2 ? 10 : -10),
              top:
                  _tooltipAnchor!.dy +
                  (_tooltipAnchor!.dy >= donutSize / 2 ? 8 : -8),
              child: IgnorePointer(
                child: FractionalTranslation(
                  translation: Offset(
                    _tooltipAnchor!.dx >= donutSize / 2 ? 0 : -1,
                    _tooltipAnchor!.dy >= donutSize / 2 ? 0 : -1,
                  ),
                  child: _DonutSliceTooltip(
                    color: touchedStat.color,
                    label: touchedStat.label,
                    count: touchedStat.count,
                    percent: (touchedStat.count / total * 100).round(),
                  ),
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
    final percent = total == 0 ? 0 : (stat.count / total * 100).round();
    return Semantics(
      button: true,
      label: '${stat.label}: ${stat.count} đơn, $percent%',
      child: Material(
        color: isSelected ? const Color(0xFFF8FAFC) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 44),
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
                      '${stat.label}  ${stat.count} đơn ($percent%)',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF1E293B),
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

  Widget _buildEmptyDonutState(ThemeData theme) {
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
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '0',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: const Color(0xFF334155),
                      fontWeight: FontWeight.w900,
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Tổng',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: const Color(0xFF64748B),
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
          'Không có dữ liệu trong khoảng thời gian này',
          style: theme.textTheme.bodySmall?.copyWith(
            color: const Color(0xFF475569),
            fontWeight: FontWeight.w600,
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
    final now = DateTime.now();
    final start = DateTime(
      now.year,
      now.month,
      now.day,
    ).subtract(Duration(days: days - 1));
    return source.where((item) => !item.date.isBefore(start)).toList();
  }

  List<_WarrantyStatusStat> _groupWarrantyStats(
    List<_WarrantyStatusStat> sortedStats, {
    required int maxSegments,
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

    if (groupedCount > 0) {
      visibleStats.add(
        _WarrantyStatusStat(
          label: 'Khác',
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
          label: 'Khác',
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
  });

  final Color color;
  final String label;
  final int count;
  final int percent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      constraints: const BoxConstraints(minWidth: 110, maxWidth: 180),
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
                  '$count đơn ($percent%)',
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

class _TopCustomerCard extends StatelessWidget {
  const _TopCustomerCard({required this.stat});

  final _CustomerStat stat;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5EAF5)),
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
              color: const Color(0xFFEEF2FF),
            ),
            alignment: Alignment.center,
            child: Text(
              stat.initials,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: const Color(0xFF4338CA),
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
                    color: _dashboardMutedText,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${stat.orderCount} đơn • ${formatVnd(stat.total)}',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: Colors.black87,
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
                  color: _dashboardMutedText,
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
  OrderStatus.pendingApproval,
  OrderStatus.shipping,
  OrderStatus.completed,
  OrderStatus.approved,
];

class _CustomerStat {
  const _CustomerStat({
    required this.name,
    required this.phone,
    required this.total,
    required this.orderCount,
    required this.lastOrder,
  });

  final String name;
  final String phone;
  final int total;
  final int orderCount;
  final DateTime lastOrder;

  int get avgOrder => orderCount == 0 ? 0 : (total / orderCount).round();
  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].isNotEmpty ? parts[0][0] : '') +
          (parts.last.isNotEmpty ? parts.last[0] : '');
    }
    return name.isNotEmpty ? name[0] : '?';
  }
}

class _DebtBucket {
  const _DebtBucket({
    required this.label,
    required this.minDay,
    required this.maxDay,
    required this.color,
    this.amount = 0,
  });

  final String label;
  final int minDay;
  final int maxDay;
  final Color color;
  final int amount;

  _DebtBucket copyWith({int? amount}) {
    return _DebtBucket(
      label: label,
      minDay: minDay,
      maxDay: maxDay,
      color: color,
      amount: amount ?? this.amount,
    );
  }
}

class _DailyActivation {
  const _DailyActivation({required this.date, required this.count});

  final DateTime date;
  final int count;
}

class _WarrantyStatusStat {
  const _WarrantyStatusStat({
    required this.label,
    required this.count,
    required this.color,
  });

  final String label;
  final int count;
  final Color color;
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
            color: const Color(0xFF475569),
          ),
        ),
      ],
    );
  }
}
