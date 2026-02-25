import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import 'mock_data.dart';
import 'models.dart';
import 'order_controller.dart';
import 'notifications_screen.dart';
import 'utils.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/skeleton_box.dart';
import 'debt_tracking_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isLoading = true;

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
    final warrantyStatuses = _buildWarrantyStatuses(activationSeries);
    final notices = List<DistributorNotice>.from(mockDistributorNotices)
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    final now = DateTime.now();
    final currentMonthRevenue = monthlyRevenue[now.month - 1].value;
    final currentMonthOrders = orders
        .where(
          (order) =>
              order.createdAt.year == now.year && order.createdAt.month == now.month,
        )
        .length;

    final horizontalPadding =
        MediaQuery.of(context).size.width < 600 ? 16.0 : 20.0;

    final content = _isLoading
        ? const _DashboardLoadingView()
        : ListView(
            padding:
                EdgeInsets.fromLTRB(horizontalPadding, 16, horizontalPadding, 24),
            children: [
              FadeSlideIn(
                child: _OverviewCard(
                  totalDebt: orderController.totalOutstandingDebt,
                  currentMonthRevenue: currentMonthRevenue,
                  currentMonthOrders: currentMonthOrders,
                ),
              ),
              const SizedBox(height: 14),
              LayoutBuilder(
                builder: (context, constraints) {
                  final cols = constraints.maxWidth >= 1200
                      ? 3
                      : constraints.maxWidth >= 900
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
                          child:
                              _WarrantyStatusDonutCard(stats: warrantyStatuses),
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

    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tổng quan'),
        actions: [
          IconButton(
            tooltip: 'Thông báo',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const NotificationsScreen(),
                ),
              );
            },
            icon: const Icon(Icons.notifications_outlined),
          ),
          if (!isMobile) ...[
            TextButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add_shopping_cart_outlined),
              label: const Text('Tạo đơn nhập'),
            ),
            TextButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Kích hoạt BH'),
            ),
            const SizedBox(width: 6),
          ],
        ],
      ),
      floatingActionButton: isMobile
          ? FloatingActionButton.extended(
              onPressed: () {},
              icon: const Icon(Icons.add_shopping_cart_outlined),
              label: const Text('Đơn nhập'),
            )
          : null,
      body: content,
    );
  }
}

class _OverviewCard extends StatelessWidget {
  const _OverviewCard({
    required this.totalDebt,
    required this.currentMonthRevenue,
    required this.currentMonthOrders,
  });

  final int totalDebt;
  final int currentMonthRevenue;
  final int currentMonthOrders;

  @override
  Widget build(BuildContext context) {
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
            'Tổng quan vận hành',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Theo dõi nhanh đơn nhập, công nợ và bảo hành.',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.white),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 10,
            children: [
              _OverviewPill(
                icon: Icons.payments_outlined,
                label: 'Gia tri nhap hang thang',
                value: formatVnd(currentMonthRevenue),
              ),
              _OverviewPill(
                icon: Icons.receipt_long_outlined,
                label: 'Don trong thang',
                value: '$currentMonthOrders',
              ),
              _OverviewPill(
                icon: Icons.account_balance_wallet_outlined,
                label: 'Tong cong no',
                value: formatVnd(totalDebt),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _OverviewPill extends StatelessWidget {
  const _OverviewPill({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0x1AFFFFFF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x44FFFFFF)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 16),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white,
                ),
              ),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
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

class _RevenueChartCard extends StatelessWidget {
  const _RevenueChartCard({required this.data});

  final List<_MonthRevenue> data;

  @override
  Widget build(BuildContext context) {
    final maxValue = data.fold<int>(0, (max, item) => math.max(max, item.value));
    final topY = math.max(1000000, ((maxValue * 1.2) / 1000000).ceil() * 1000000)
        .toDouble();
    final currentMonth = DateTime.now().month;

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
            'Giá trị nhập hàng theo tháng',
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(
              'Tổng hợp giá trị đơn nhập theo từng tháng trong năm.',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.black54),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 230,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  minY: 0,
                  maxY: topY,
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: topY / 4,
                    getDrawingHorizontalLine: (value) => FlLine(
                      color: const Color(0xFFE8ECF7),
                      strokeWidth: 1,
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        interval: topY / 4,
                        getTitlesWidget: (value, meta) {
                          if (value <= 0) {
                            return const SizedBox.shrink();
                          }
                          final million = (value / 1000000).round();
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            child: Text('${million}tr'),
                          );
                        },
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 30,
                        getTitlesWidget: (value, meta) {
                          final labelStyle = Theme.of(context)
                              .textTheme
                              .labelSmall
                              ?.copyWith(fontSize: 11);
                          final idx = value.toInt();
                          if (idx < 0 || idx >= data.length) {
                            return const SizedBox.shrink();
                          }
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            space: 6,
                            child: Transform.rotate(
                              angle: -0.35,
                              child: Text(
                                data[idx].label,
                                style: labelStyle,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  barGroups: [
                    for (var i = 0; i < data.length; i++)
                      BarChartGroupData(
                        x: i,
                        barRods: [
                            BarChartRodData(
                              toY: data[i].value.toDouble(),
                              width: 12,
                            borderRadius: BorderRadius.circular(4),
                            gradient: LinearGradient(
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                              colors: i == currentMonth - 1
                                  ? const [Color(0xFF10B981), Color(0xFF34D399)]
                                  : const [Color(0xFF2563EB), Color(0xFF60A5FA)],
                            ),
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

class _RecentOrderCard extends StatelessWidget {
  const _RecentOrderCard({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
      ),
      child: ListTile(
        title: Text(order.id),
        subtitle: Text(
          '${formatDateTime(order.createdAt)} · ${order.totalItems} SP · ${order.paymentStatus.label}',
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              order.status.label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: _statusColor(order.status),
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              formatVnd(order.total),
              style: Theme.of(
                context,
              ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}

class _LowStockCard extends StatelessWidget {
  const _LowStockCard({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isCritical = product.stock <= 3;
    final color = isCritical ? const Color(0xFFD94939) : const Color(0xFFB26A00);

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
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: const Color(0xFFF5F8FF),
            ),
            alignment: Alignment.center,
            child: Text(
              product.category.label.substring(0, 1),
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1D4ED8),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'SKU: ${product.sku}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.black54,
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
                'Ton: ${product.stock}',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Min: ${product.effectiveMinOrderQty}',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: Colors.black54,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LowStockPanel extends StatelessWidget {
  const _LowStockPanel({required this.products});

  final List<Product> products;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
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
              'Cảnh báo tồn kho thấp',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            if (products.isEmpty)
              const _EmptyCard(message: 'Tất cả SKU đang đủ tồn.')
            else
              ...products.map(
                (product) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _LowStockCard(product: product),
                ),
              ),
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
                  'Phân bổ trạng thái đơn',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                fit: FlexFit.loose,
                child: Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  alignment: WrapAlignment.end,
                  children: [
                    if (!showEmpty)
                      Text(
                        'Tổng: $totalCount đơn',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.black54,
                        ),
                        softWrap: false,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (showEmpty)
            const _EmptyCard(message: 'Chưa có đơn hàng nào.')
          else
            Column(
              children: _statusOrder.map((status) {
                final count = totals[status] ?? 0;
                final percent =
                    totalCount == 0 ? 0 : (count / totalCount * 100).round();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _StatusBar(
                    label: status.label,
                    count: count,
                    percent: percent,
                    color: _statusColor(status),
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }

  Map<OrderStatus, int> _computeStatusTotals(List<Order> orders) {
    final map = <OrderStatus, int>{
      for (final s in _statusOrder) s: 0,
    };
    for (final order in orders) {
      map[order.status] = (map[order.status] ?? 0) + 1;
    }
    return map;
  }
}

class _StatusBar extends StatelessWidget {
  const _StatusBar({
    required this.label,
    required this.count,
    required this.percent,
    required this.color,
  });

  final String label;
  final int count;
  final int percent;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Expanded(
          flex: percent == 0 ? 1 : percent,
          child: Container(
            height: 12,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                height: 12,
                width: percent <= 0 ? 6 : null,
                constraints: BoxConstraints(
                  minWidth: percent <= 0 ? 6 : 20,
                  maxWidth: double.infinity,
                ),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label, style: theme.textTheme.bodySmall),
            Text(
              '$count (${percent}%)',
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _AgingDebtCard extends StatelessWidget {
  const _AgingDebtCard({
    required this.buckets,
    required this.onViewAll,
  });

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
              const SizedBox(width: 8),
              Flexible(
                fit: FlexFit.loose,
                child: Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  alignment: WrapAlignment.end,
                  children: [
                    if (!showEmpty)
                      Text(
                        'Tổng: ${formatVnd(total)}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.black54,
                        ),
                        softWrap: false,
                        overflow: TextOverflow.ellipsis,
                      ),
                    TextButton(
                      onPressed: onViewAll,
                      child: const Text('Xem danh sách'),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (showEmpty)
            const _EmptyCard(message: 'Chưa có công nợ.')
          else
            Column(
              children: buckets.map((bucket) {
                final percent =
                    total == 0 ? 0 : (bucket.amount / total * 100).round();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              bucket.label,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Container(
                              height: 10,
                              decoration: BoxDecoration(
                                color: bucket.color.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: FractionallySizedBox(
                                alignment: Alignment.centerLeft,
                                widthFactor:
                                    total == 0 ? 0 : bucket.amount / total,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: bucket.color,
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      ConstrainedBox(
                        constraints: const BoxConstraints(minWidth: 72),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              formatVnd(bucket.amount),
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              '$percent%',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
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
              ).textTheme.bodySmall?.copyWith(color: Colors.black54),
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
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text(message),
      ),
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
  const int threshold = 10;
  final products = mockProducts
      .where((p) => p.isOrderable && p.stock <= threshold)
      .toList()
    ..sort((a, b) => a.stock.compareTo(b.stock));
  return products.take(5).toList();
}

List<_DebtBucket> _buildDebtBuckets(int totalOutstandingDebt) {
  const buckets = [
    _DebtBucket(label: '0-30 ngày', minDay: 0, maxDay: 30, color: Color(0xFF1D4ED8)),
    _DebtBucket(label: '31-60 ngày', minDay: 31, maxDay: 60, color: Color(0xFF7C3AED)),
    _DebtBucket(label: '61-90 ngày', minDay: 61, maxDay: 90, color: Color(0xFFEA580C)),
    _DebtBucket(label: '>90 ngày', minDay: 91, maxDay: 9999, color: Color(0xFFD92D20)),
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
    final date = DateTime(now.year, now.month, now.day).subtract(Duration(days: i));
    // deterministic mock: based on date to stay stable
    final count = (date.day * date.month) % 7 + (date.weekday == DateTime.saturday ? 2 : 0);
    list.add(_DailyActivation(date: date, count: count));
  }
  return list;
}

List<_WarrantyStatusStat> _buildWarrantyStatuses(List<_DailyActivation> activations) {
  final total = activations.fold<int>(0, (s, d) => s + d.count);
  if (total == 0) {
    return const [
      _WarrantyStatusStat(label: 'Kich hoat', count: 0, color: Color(0xFF2563EB)),
      _WarrantyStatusStat(label: 'Cho xu ly', count: 0, color: Color(0xFF7C3AED)),
      _WarrantyStatusStat(label: 'Dang xu ly', count: 0, color: Color(0xFFEA580C)),
      _WarrantyStatusStat(label: 'Hoan tat', count: 0, color: Color(0xFF16A34A)),
      _WarrantyStatusStat(label: 'Tu choi', count: 0, color: Color(0xFFD92D20)),
    ];
  }
  // mock distribution based on total
  final dist = {
    'Kich hoat': (total * 0.55).round(),
    'Cho xu ly': (total * 0.12).round(),
    'Dang xu ly': (total * 0.18).round(),
    'Hoan tat': (total * 0.12).round(),
    'Tu choi': total, // will adjust below
  };
  dist['Tu choi'] = math.max(0, total - dist.values.take(4).fold<int>(0, (s, v) => s + v));

  return [
    _WarrantyStatusStat(label: 'Kich hoat', count: dist['Kich hoat']!, color: const Color(0xFF2563EB)),
    _WarrantyStatusStat(label: 'Cho xu ly', count: dist['Cho xu ly']!, color: const Color(0xFF7C3AED)),
    _WarrantyStatusStat(label: 'Dang xu ly', count: dist['Dang xu ly']!, color: const Color(0xFFEA580C)),
    _WarrantyStatusStat(label: 'Hoan tat', count: dist['Hoan tat']!, color: const Color(0xFF16A34A)),
    _WarrantyStatusStat(label: 'Tu choi', count: dist['Tu choi']!, color: const Color(0xFFD92D20)),
  ];
}

Color _statusColor(OrderStatus status) {
  switch (status) {
    case OrderStatus.pendingApproval:
      return const Color(0xFFB45309);
    case OrderStatus.approved:
      return const Color(0xFF1D4ED8);
    case OrderStatus.shipping:
      return const Color(0xFF0369A1);
    case OrderStatus.completed:
      return const Color(0xFF15803D);
  }
}

class _ActivationTrendCard extends StatelessWidget {
  const _ActivationTrendCard({required this.data});

  final List<_DailyActivation> data;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (data.isEmpty) {
      return const _EmptyCard(message: 'Chưa có kích hoạt nào trong 30 ngày.');
    }

    final maxY =
        data.fold<int>(0, (max, item) => math.max(max, item.count)).toDouble();
    final topY = math.max(5, (maxY * 1.3).ceil()).toDouble();

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
              'Kích hoạt BH 30 ngày gần nhất',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Theo ngày, 30 ngày gần nhất',
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 220,
              child: LineChart(
                LineChartData(
                  minY: 0,
                  maxY: topY,
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
                        interval: math.max(1, topY / 4),
                        getTitlesWidget: (value, meta) {
                          if (value % 1 != 0) return const SizedBox.shrink();
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            child: Text(value.toInt().toString()),
                          );
                        },
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        interval: 7,
                        getTitlesWidget: (value, meta) {
                          final idx = value.toInt();
                          if (idx < 0 || idx >= data.length) {
                            return const SizedBox.shrink();
                          }
                          final d = data[idx].date;
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            child: Text('${d.day}/${d.month}'),
                          );
                        },
                      ),
                    ),
                  ),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: math.max(1, topY / 4),
                    getDrawingHorizontalLine: (value) => FlLine(
                      color: const Color(0xFFE8ECF7),
                      strokeWidth: 1,
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: [
                        for (var i = 0; i < data.length; i++)
                          FlSpot(i.toDouble(), data[i].count.toDouble()),
                      ],
                      isCurved: true,
                      color: const Color(0xFF2563EB),
                      barWidth: 3,
                      dotData: FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        color: const Color(0xFF2563EB).withOpacity(0.15),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 16,
              children: [
                _MiniKpi(label: 'Tổng 30d', value: '${data.fold<int>(0, (s, d) => s + d.count)}'),
                _MiniKpi(
                  label: 'TB/ngày',
                  value: (data.fold<int>(0, (s, d) => s + d.count) / data.length)
                      .toStringAsFixed(1),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _WarrantyStatusDonutCard extends StatelessWidget {
  const _WarrantyStatusDonutCard({required this.stats});

  final List<_WarrantyStatusStat> stats;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final total = stats.fold<int>(0, (s, e) => s + e.count);
    final showEmpty = total == 0;

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
              'Trạng thái bảo hành (30 ngày)',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Tổng: $total serial/claim',
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54),
            ),
            const SizedBox(height: 12),
            if (showEmpty)
              const _EmptyCard(message: 'Chưa có dữ liệu bảo hành.')
            else
              Row(
                children: [
                  SizedBox(
                    width: 140,
                    height: 140,
                    child: PieChart(
                      PieChartData(
                        sectionsSpace: 2,
                        centerSpaceRadius: 36,
                        sections: stats
                            .map(
                              (s) => PieChartSectionData(
                                color: s.color,
                                value: s.count.toDouble(),
                                title:
                                    '${(s.count / total * 100).round()}%',
                                titleStyle:
                                    theme.textTheme.labelMedium?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: stats.map((s) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                  color: s.color,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(child: Text(s.label)),
                              Text(
                                '${s.count} (${(s.count / total * 100).round()}%)',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
          ],
        ),
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
                    color: Colors.black54,
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
                  color: Colors.black54,
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
  OrderStatus.approved,
  OrderStatus.shipping,
  OrderStatus.completed,
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
          style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54),
        ),
      ],
    );
  }
}
