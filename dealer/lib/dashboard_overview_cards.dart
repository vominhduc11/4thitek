part of 'dashboard_screen.dart';

class _DashboardQuickActionsCard extends StatelessWidget {
  const _DashboardQuickActionsCard({
    required this.onCreateOrder,
    required this.onOpenInventory,
    required this.onOpenWarrantyHub,
    required this.title,
    required this.subtitle,
    required this.createOrderLabel,
    required this.inventoryLabel,
    required this.warrantyLabel,
  });

  final VoidCallback onCreateOrder;
  final VoidCallback onOpenInventory;
  final VoidCallback onOpenWarrantyHub;
  final String title;
  final String subtitle;
  final String createOrderLabel;
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
    this.storageKey = 'dashboard-insights',
  });

  final String title;
  final String subtitle;
  final List<Widget> children;
  final String storageKey;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return _DashboardSurfaceCard(
      padding: EdgeInsets.zero,
      child: Theme(
        data: theme.copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          key: PageStorageKey<String>(storageKey),
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
    required this.totalOutstandingAmount,
    required this.periodRevenue,
    required this.periodOrders,
    required this.periodCompletedOrders,
    required this.periodUnitLabel,
    required this.contextLabel,
    required this.texts,
  });

  final int totalOutstandingAmount;
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
    final outstandingAccent = cs.error;
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
              final outstandingCard = _OverviewMetricTile(
                icon: Icons.account_balance_wallet_rounded,
                accentColor: outstandingAccent,
                label: texts.overviewOutstandingLabel,
                value: _formatCompactVnd(totalOutstandingAmount),
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
              final cards = [outstandingCard, orderCard, completionRateCard];
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
