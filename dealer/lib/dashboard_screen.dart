import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import 'mock_data.dart';
import 'models.dart';
import 'order_controller.dart';
import 'utils.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/skeleton_box.dart';

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
    final topProducts = _buildTopProducts(orders);
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

    return Scaffold(
      appBar: AppBar(title: const Text('Tong quan')),
      body: _isLoading
          ? const _DashboardLoadingView()
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              children: [
                FadeSlideIn(
                  child: _OverviewCard(
                    totalDebt: orderController.totalOutstandingDebt,
                    currentMonthRevenue: currentMonthRevenue,
                    currentMonthOrders: currentMonthOrders,
                  ),
                ),
                const SizedBox(height: 14),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 60),
                  child: _RevenueChartCard(data: monthlyRevenue),
                ),
                const SizedBox(height: 14),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 90),
                  child: const _SectionTitle(title: 'Don hang gan day'),
                ),
                const SizedBox(height: 8),
                if (orders.isEmpty)
                  const _EmptyCard(message: 'Chua co don hang nao.')
                else
                  ...orders.take(5).map((order) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _RecentOrderCard(order: order),
                    );
                  }),
                const SizedBox(height: 6),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 120),
                  child: const _SectionTitle(title: 'San pham ban chay'),
                ),
                const SizedBox(height: 8),
                if (topProducts.isEmpty)
                  const _EmptyCard(message: 'Chua co du lieu san pham ban chay.')
                else
                  ...topProducts.take(5).toList().asMap().entries.map((entry) {
                    final rank = entry.key + 1;
                    final product = entry.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _TopProductCard(rank: rank, stat: product),
                    );
                  }),
                const SizedBox(height: 6),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 150),
                  child: const _SectionTitle(
                    title: 'Thong bao tu nha phan phoi',
                  ),
                ),
                const SizedBox(height: 8),
                ...notices.map(
                  (notice) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _NoticeCard(notice: notice),
                  ),
                ),
              ],
            ),
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
            'Du lieu tong quan (mock API)',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Phien ban demo dung local state + mock services.',
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
                label: 'Doanh thu thang',
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
              'Doanh thu theo thang',
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(
              'Tong hop doanh thu don hang theo tung thang trong nam.',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.black54),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 230,
              child: BarChart(
                BarChartData(
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
                        getTitlesWidget: (value, meta) {
                          final idx = value.toInt();
                          if (idx < 0 || idx >= data.length) {
                            return const SizedBox.shrink();
                          }
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            child: Text(data[idx].label),
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
                            width: 14,
                            borderRadius: BorderRadius.circular(4),
                            gradient: const LinearGradient(
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                              colors: [Color(0xFF2563EB), Color(0xFF60A5FA)],
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

class _TopProductCard extends StatelessWidget {
  const _TopProductCard({required this.rank, required this.stat});

  final int rank;
  final _TopProductStat stat;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
      ),
      child: ListTile(
        leading: CircleAvatar(
          radius: 16,
          backgroundColor: const Color(0xFFEFF4FF),
          child: Text(
            '$rank',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: const Color(0xFF1D4ED8),
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        title: Text(stat.productName),
        subtitle: Text('${stat.quantity} san pham da ban'),
        trailing: Text(
          formatVnd(stat.revenue),
          style: Theme.of(
            context,
          ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
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

class _TopProductStat {
  const _TopProductStat({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.revenue,
  });

  final String productId;
  final String productName;
  final int quantity;
  final int revenue;
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

List<_TopProductStat> _buildTopProducts(List<Order> orders) {
  final quantityByProduct = <String, int>{};
  final revenueByProduct = <String, int>{};
  final nameByProduct = <String, String>{};

  for (final order in orders) {
    for (final item in order.items) {
      quantityByProduct[item.product.id] =
          (quantityByProduct[item.product.id] ?? 0) + item.quantity;
      revenueByProduct[item.product.id] =
          (revenueByProduct[item.product.id] ?? 0) + item.total;
      nameByProduct[item.product.id] = item.product.name;
    }
  }

  final list = quantityByProduct.entries
      .map(
        (entry) => _TopProductStat(
          productId: entry.key,
          productName: nameByProduct[entry.key] ?? entry.key,
          quantity: entry.value,
          revenue: revenueByProduct[entry.key] ?? 0,
        ),
      )
      .toList();

  list.sort((a, b) {
    final quantityCompare = b.quantity.compareTo(a.quantity);
    if (quantityCompare != 0) {
      return quantityCompare;
    }
    return b.revenue.compareTo(a.revenue);
  });
  return list;
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
