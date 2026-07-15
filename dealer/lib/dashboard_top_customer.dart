part of 'dashboard_screen.dart';

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
