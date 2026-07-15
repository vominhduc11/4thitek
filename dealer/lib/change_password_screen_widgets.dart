part of 'change_password_screen.dart';

class _HeroInfoChip extends StatelessWidget {
  const _HeroInfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: colors.onSurfaceVariant),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _PasswordRuleTile extends StatelessWidget {
  const _PasswordRuleTile({
    required this.icon,
    required this.label,
    required this.isPassed,
  });

  final IconData icon;
  final String label;
  final bool isPassed;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final accent = isPassed ? colors.primary : colors.onSurfaceVariant;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isPassed
            ? colors.primaryContainer.withValues(alpha: 0.28)
            : colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isPassed
              ? colors.primary.withValues(alpha: 0.45)
              : colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isPassed ? Icons.check_circle_outline : icon,
            color: accent,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: accent,
                fontWeight: isPassed ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChangePasswordActionPanel extends StatelessWidget {
  const _ChangePasswordActionPanel({
    required this.title,
    required this.subtitle,
    required this.progressLabel,
    required this.progressValue,
    required this.progressFraction,
    required this.statusLabel,
    required this.statusValue,
    required this.isReady,
    required this.currentPasswordLabel,
    required this.currentPasswordValue,
    required this.newPasswordLabel,
    required this.newPasswordValue,
    required this.confirmPasswordLabel,
    required this.confirmPasswordValue,
    required this.submitAction,
    required this.isSubmitting,
    required this.onSubmit,
  });

  final String title;
  final String subtitle;
  final String progressLabel;
  final String progressValue;
  final double progressFraction;
  final String statusLabel;
  final String statusValue;
  final bool isReady;
  final String currentPasswordLabel;
  final String currentPasswordValue;
  final String newPasswordLabel;
  final String newPasswordValue;
  final String confirmPasswordLabel;
  final String confirmPasswordValue;
  final String submitAction;
  final bool isSubmitting;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final clampedProgress = progressFraction.clamp(0.0, 1.0).toDouble();

    return SectionCard(
      title: title,
      padding: const EdgeInsets.all(18),
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
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              color: colors.surfaceContainerLow,
              border: Border.all(
                color: colors.outlineVariant.withValues(alpha: 0.5),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ActionSummaryRow(label: progressLabel, value: progressValue),
                const SizedBox(height: 10),
                _ActionSummaryRow(label: statusLabel, value: statusValue),
                const SizedBox(height: 14),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: clampedProgress,
                    minHeight: 8,
                    backgroundColor: colors.surface.withValues(alpha: 0.55),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isReady ? colors.primary : colors.secondary,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isReady
                        ? colors.primaryContainer.withValues(alpha: 0.72)
                        : colors.surface.withValues(alpha: 0.72),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: isReady
                          ? colors.primary.withValues(alpha: 0.36)
                          : colors.outlineVariant.withValues(alpha: 0.4),
                    ),
                  ),
                  child: Text(
                    statusValue,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: isReady
                          ? colors.onPrimaryContainer
                          : colors.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          _ActionSummaryRow(
            label: currentPasswordLabel,
            value: currentPasswordValue,
          ),
          const SizedBox(height: 10),
          _ActionSummaryRow(label: newPasswordLabel, value: newPasswordValue),
          const SizedBox(height: 10),
          _ActionSummaryRow(
            label: confirmPasswordLabel,
            value: confirmPasswordValue,
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: isSubmitting ? null : onSubmit,
              icon: isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2.4),
                    )
                  : const Icon(Icons.lock_reset_outlined),
              label: Text(submitAction),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionSummaryRow extends StatelessWidget {
  const _ActionSummaryRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return LayoutBuilder(
      builder: (context, constraints) {
        final shouldStack = constraints.maxWidth < 260;
        if (shouldStack) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                value,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          );
        }

        return Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.onSurfaceVariant,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Flexible(
              child: Text(
                value,
                textAlign: TextAlign.right,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        );
      },
    );
  }
}
