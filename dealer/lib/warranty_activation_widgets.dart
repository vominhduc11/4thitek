part of 'warranty_activation_screen.dart';

enum _ActivationStateTone { info, error, neutral }

class _ActivationStateScaffold extends StatelessWidget {
  const _ActivationStateScaffold({
    required this.title,
    required this.icon,
    required this.headline,
    required this.message,
    this.action,
    this.isLoading = false,
    this.tone = _ActivationStateTone.neutral,
  });

  final String title;
  final IconData icon;
  final String headline;
  final String message;
  final Widget? action;
  final bool isLoading;
  final _ActivationStateTone tone;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isError = tone == _ActivationStateTone.error;
    final isInfo = tone == _ActivationStateTone.info || isLoading;
    final background = isError
        ? colors.errorContainer.withValues(alpha: 0.42)
        : isInfo
        ? colors.primaryContainer.withValues(alpha: 0.3)
        : colors.surfaceContainerHighest.withValues(alpha: 0.42);
    final border = isError
        ? colors.error.withValues(alpha: 0.28)
        : isInfo
        ? colors.primary.withValues(alpha: 0.22)
        : colors.outlineVariant.withValues(alpha: 0.72);
    final iconColor = isError
        ? colors.error
        : isInfo
        ? colors.primary
        : colors.onSurfaceVariant;

    return Scaffold(
      appBar: AppBar(title: BrandAppBarTitle(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: background,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: border),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (isLoading)
                    SizedBox(
                      width: 28,
                      height: 28,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.6,
                        color: iconColor,
                      ),
                    )
                  else
                    Icon(icon, size: 42, color: iconColor),
                  const SizedBox(height: 14),
                  Text(
                    headline,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    message,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colors.onSurfaceVariant,
                      height: 1.45,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (action != null) ...[const SizedBox(height: 16), action!],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 1,
      shadowColor: colorScheme.shadow.withValues(alpha: 0.16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
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
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: colorScheme.onSurface,
                fontSize: 17,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 14),
            child,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    this.isEmphasis = false,
  });

  final String label;
  final String value;
  final bool isEmphasis;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final labelStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
      color: colorScheme.onSurfaceVariant,
      fontSize: 12,
      fontWeight: FontWeight.w500,
      height: 1.3,
    );
    final valueStyle = Theme.of(context).textTheme.bodyMedium?.copyWith(
      color: colorScheme.onSurface,
      fontSize: 14,
      fontWeight: FontWeight.w700,
      height: 1.25,
    );
    final emphasisStyle = Theme.of(context).textTheme.titleSmall?.copyWith(
      color: colorScheme.primary,
      fontSize: 16,
      fontWeight: FontWeight.w800,
    );

    return Row(
      children: [
        Expanded(child: Text(label, style: labelStyle)),
        const SizedBox(width: 12),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: isEmphasis ? emphasisStyle : valueStyle,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
