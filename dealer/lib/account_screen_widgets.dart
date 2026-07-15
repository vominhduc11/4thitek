// ignore_for_file: invalid_use_of_protected_member

part of 'account_screen.dart';

extension _AccountScreenWidgets on _AccountScreenState {
  Widget _sectionDescription(BuildContext context, String text) {
    final theme = Theme.of(context);
    return Text(
      text,
      style: theme.textTheme.bodyMedium?.copyWith(
        color: theme.colorScheme.onSurfaceVariant,
        height: 1.45,
      ),
    );
  }

  Widget _tileColumn(List<Widget> tiles) {
    return Column(
      children: [
        for (var i = 0; i < tiles.length; i++) ...[
          tiles[i],
          if (i != tiles.length - 1) const SizedBox(height: 12),
        ],
      ],
    );
  }

  Widget _infoTile(
    BuildContext context,
    IconData icon,
    String label,
    String value, {
    int maxLines = 1,
  }) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: _panelDecoration(
        colors,
        radius: 18,
        background: colors.surfaceContainerLow,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: colors.primaryContainer.withValues(alpha: 0.72),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: colors.onPrimaryContainer),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: colors.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  value.trim().isEmpty ? '-' : value,
                  maxLines: maxLines,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionTile(
    IconData icon,
    String title,
    String subtitle,
    VoidCallback? onTap,
  ) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: _panelDecoration(
            colors,
            radius: 18,
            background: colors.surfaceContainerLow,
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: colors.secondaryContainer.withValues(alpha: 0.72),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: colors.onSecondaryContainer),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Icon(
                Icons.chevron_right_rounded,
                size: 22,
                color: colors.onSurfaceVariant,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroSkeleton(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: _panelDecoration(
        colors,
        radius: 24,
        background: colors.surfaceContainerHigh,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Row(
            children: [
              SkeletonBox(
                width: 64,
                height: 64,
                borderRadius: BorderRadius.all(Radius.circular(999)),
              ),
              SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SkeletonBox(width: 124, height: 16),
                    SizedBox(height: 10),
                    SkeletonBox(width: 220, height: 24),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          SkeletonBox(width: double.infinity, height: 16),
          SizedBox(height: 10),
          SkeletonBox(width: 240, height: 16),
          SizedBox(height: 16),
          SkeletonBox(width: double.infinity, height: 50),
        ],
      ),
    );
  }

  Widget _buildSectionSkeleton(
    BuildContext context,
    String title,
    int rows, {
    bool includeButtons = false,
  }) {
    final colors = Theme.of(context).colorScheme;
    return SectionCard(
      title: title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SkeletonBox(width: double.infinity, height: 14),
          const SizedBox(height: 10),
          const SkeletonBox(width: 220, height: 14),
          const SizedBox(height: 16),
          for (var index = 0; index < rows; index++) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: _panelDecoration(
                colors,
                radius: 18,
                background: colors.surfaceContainerLow,
              ),
              child: const Row(
                children: [
                  SkeletonBox(
                    width: 42,
                    height: 42,
                    borderRadius: BorderRadius.all(Radius.circular(14)),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonBox(width: double.infinity, height: 14),
                        SizedBox(height: 8),
                        SkeletonBox(width: 180, height: 12),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (index != rows - 1) const SizedBox(height: 12),
          ],
          if (includeButtons) ...[
            const SizedBox(height: 16),
            const Row(
              children: [
                Expanded(
                  child: SkeletonBox(width: double.infinity, height: 50),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: SkeletonBox(width: double.infinity, height: 50),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _metaChip(BuildContext context, IconData icon, String label) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: _panelDecoration(
        colors,
        radius: 999,
        background: colors.surfaceContainerLow.withValues(alpha: 0.95),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: colors.primary),
          const SizedBox(width: 8),
          Text(
            label,
            style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }

  Widget _contactChip(BuildContext context, IconData icon, String label) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 120, maxWidth: 280),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: _panelDecoration(
          colors,
          radius: 18,
          background: colors.surfaceContainerLow,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: colors.onSurfaceVariant),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  BoxDecoration _panelDecoration(
    ColorScheme colors, {
    required double radius,
    Color? background,
    Color? borderColor,
    List<Color>? gradient,
  }) {
    return BoxDecoration(
      color: gradient == null
          ? (background ?? colors.surfaceContainerHigh)
          : null,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(
        color: borderColor ?? colors.outlineVariant.withValues(alpha: 0.55),
      ),
      gradient: gradient == null
          ? null
          : LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: gradient,
            ),
      boxShadow: [
        BoxShadow(
          color: colors.shadow.withValues(alpha: 0.03),
          blurRadius: 16,
          offset: const Offset(0, 8),
        ),
      ],
    );
  }
}
