part of 'cart_screen.dart';

class _CartHeroCard extends StatelessWidget {
  const _CartHeroCard({
    required this.title,
    required this.subtitle,
    required this.itemCountLabel,
    required this.subtotalLabel,
    required this.subtotalValue,
    required this.totalLabel,
    required this.totalValue,
    required this.statusLabel,
    required this.isSyncing,
  });

  final String title;
  final String subtitle;
  final String itemCountLabel;
  final String subtotalLabel;
  final String subtotalValue;
  final String totalLabel;
  final String totalValue;
  final String statusLabel;
  final bool isSyncing;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colors.primaryContainer.withValues(alpha: 0.96),
            colors.secondaryContainer.withValues(alpha: 0.88),
          ],
        ),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.35),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 620;
                final iconShell = Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: colors.surface.withValues(alpha: 0.72),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Icon(
                    Icons.shopping_cart_outlined,
                    color: colors.onSurface,
                    size: 28,
                  ),
                );

                final titleBlock = Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: colors.onPrimaryContainer,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      subtitle,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colors.onPrimaryContainer.withValues(
                          alpha: 0.84,
                        ),
                        height: 1.45,
                      ),
                    ),
                  ],
                );

                final statusPill = _CartStatusPill(
                  label: statusLabel,
                  isActive: isSyncing,
                  icon: isSyncing
                      ? Icons.sync_outlined
                      : Icons.check_circle_outline,
                );

                if (compact) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          iconShell,
                          const SizedBox(width: 12),
                          Expanded(child: statusPill),
                        ],
                      ),
                      const SizedBox(height: 16),
                      titleBlock,
                    ],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    iconShell,
                    const SizedBox(width: 16),
                    Expanded(child: titleBlock),
                    const SizedBox(width: 12),
                    statusPill,
                  ],
                );
              },
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _HeroMetricChip(
                  icon: Icons.inventory_2_outlined,
                  label: itemCountLabel,
                ),
                _HeroMetricChip(
                  icon: Icons.calculate_outlined,
                  label: '$subtotalLabel: $subtotalValue',
                ),
                _HeroMetricChip(
                  icon: Icons.payments_outlined,
                  label: '$totalLabel: $totalValue',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CartOverviewCard extends StatelessWidget {
  const _CartOverviewCard({
    required this.title,
    required this.subtitle,
    required this.itemCountLabel,
    required this.totalLabel,
    required this.totalValue,
    required this.statusLabel,
    required this.isSyncing,
  });

  final String title;
  final String subtitle;
  final String itemCountLabel;
  final String totalLabel;
  final String totalValue;
  final String statusLabel;
  final bool isSyncing;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return SectionCard(
      title: title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _HeroMetricChip(
                icon: Icons.inventory_2_outlined,
                label: itemCountLabel,
              ),
              _HeroMetricChip(
                icon: Icons.payments_outlined,
                label: '$totalLabel: $totalValue',
              ),
              _CartStatusPill(
                label: statusLabel,
                isActive: isSyncing,
                icon: isSyncing
                    ? Icons.sync_outlined
                    : Icons.check_circle_outline,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CartSectionHeader extends StatelessWidget {
  const _CartSectionHeader({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: textTheme.bodySmall?.copyWith(
                  color: colors.onSurfaceVariant,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CartCheckoutBar extends StatelessWidget {
  const _CartCheckoutBar({
    required this.totalLabel,
    required this.totalValue,
    required this.itemCountLabel,
    required this.buttonLabel,
    required this.statusMessage,
    required this.canCheckout,
    required this.isSyncing,
    required this.onPressed,
  });

  final String totalLabel;
  final String totalValue;
  final String itemCountLabel;
  final String buttonLabel;
  final String statusMessage;
  final bool canCheckout;
  final bool isSyncing;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return LayoutBuilder(
      builder: (context, constraints) {
        final textScale = MediaQuery.textScalerOf(context).scale(1);
        final stacked = constraints.maxWidth < 420 || textScale > 1.15;
        final statusColor = canCheckout ? colors.primary : colors.error;
        final summaryBlock = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    totalValue,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.2,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Flexible(
                  child: Text(
                    itemCountLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: statusColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    statusMessage,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.bodySmall?.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ],
        );

        final actionButton = SizedBox(
          width: stacked ? double.infinity : null,
          child: FilledButton.icon(
            onPressed: canCheckout ? onPressed : null,
            style: FilledButton.styleFrom(
              minimumSize: const Size(0, 48),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            icon: isSyncing
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                      color: colors.onPrimary,
                    ),
                  )
                : const Icon(Icons.arrow_forward_outlined),
            label: Text(buttonLabel),
          ),
        );

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: colors.surface.withValues(alpha: 0.94),
            border: Border.all(
              color: colors.outlineVariant.withValues(alpha: 0.7),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                totalLabel,
                style: textTheme.labelMedium?.copyWith(
                  color: colors.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              if (stacked) ...[
                summaryBlock,
                const SizedBox(height: 10),
                actionButton,
              ] else ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(child: summaryBlock),
                    const SizedBox(width: 12),
                    actionButton,
                  ],
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _HeroMetricChip extends StatelessWidget {
  const _HeroMetricChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: colors.onSurfaceVariant),
          const SizedBox(width: 8),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 220),
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _CartStatusPill extends StatelessWidget {
  const _CartStatusPill({
    required this.label,
    required this.isActive,
    required this.icon,
  });

  final String label;
  final bool isActive;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final background = isActive
        ? colors.primary.withValues(alpha: 0.14)
        : colors.surface.withValues(alpha: 0.72);
    final foreground = isActive ? colors.primary : colors.onSurfaceVariant;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: isActive
              ? colors.primary.withValues(alpha: 0.24)
              : colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: foreground),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: foreground,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
