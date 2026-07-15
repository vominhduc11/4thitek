part of 'dashboard_screen.dart';

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
