part of 'dashboard_screen.dart';

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
  const _SectionTitle({required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subtitle = this.subtitle;
    return Column(
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
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ],
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
    case OrderStatus.processing:
      return colorScheme.secondary;
    case OrderStatus.shipping:
      return colorScheme.secondary;
    case OrderStatus.completed:
      return colorScheme.primaryContainer;
    case OrderStatus.cancelRequested:
      return colorScheme.tertiary;
    case OrderStatus.cancelRejected:
      return colorScheme.outline;
    case OrderStatus.cancelled:
      return colorScheme.outline;
  }
}
