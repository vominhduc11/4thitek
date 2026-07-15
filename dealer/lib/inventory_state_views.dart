part of 'inventory_screen.dart';

class _InventoryLoadingView extends StatelessWidget {
  const _InventoryLoadingView({required this.bottomPadding});

  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(16, 12, 16, bottomPadding),
      children: [
        const _SkeletonBox(height: 156, radius: 24),
        const SizedBox(height: 12),
        const _SkeletonBox(height: 170, radius: 24),
        const SizedBox(height: 12),
        ...List.generate(
          5,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: _inventoryListItemSpacing),
            child: _SkeletonBox(height: 166, radius: 20),
          ),
        ),
      ],
    );
  }
}

class _SkeletonBox extends StatefulWidget {
  const _SkeletonBox({required this.height, this.radius = 10});

  final double height;
  final double radius;

  @override
  State<_SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<_SkeletonBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 980),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final baseColor =
        Color.lerp(
          colorScheme.surfaceContainerHighest,
          colorScheme.surfaceContainerLow,
          0.55,
        ) ??
        colorScheme.surfaceContainerHighest;
    final highlightColor =
        Color.lerp(baseColor, colorScheme.surface, 0.35) ?? colorScheme.surface;

    return AnimatedBuilder(
      animation: _controller,
      builder: (_, _) {
        final pulse =
            Color.lerp(baseColor, highlightColor, _controller.value) ??
            baseColor;
        return RepaintBoundary(
          child: Container(
            width: double.infinity,
            height: widget.height,
            decoration: BoxDecoration(
              color: pulse,
              borderRadius: BorderRadius.circular(widget.radius),
            ),
          ),
        );
      },
    );
  }
}

class _InventoryErrorView extends StatelessWidget {
  const _InventoryErrorView({
    required this.onRetry,
    this.message,
    this.details,
  });

  final VoidCallback onRetry;
  final String? message;
  final String? details;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: _InventoryStateCard(
          icon: Icons.sync_problem_outlined,
          title: message ?? texts.loadInventoryErrorMessage,
          description: details,
          tone: _InventoryStateTone.error,
          action: ElevatedButton.icon(
            onPressed: onRetry,
            style: ElevatedButton.styleFrom(minimumSize: const Size(132, 46)),
            icon: const Icon(Icons.refresh_outlined),
            label: Text(texts.retryAction),
          ),
        ),
      ),
    );
  }
}

class _InventoryEmptyView extends StatelessWidget {
  const _InventoryEmptyView({required this.onImport});

  final VoidCallback onImport;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: _InventoryStateCard(
          icon: Icons.inventory_2_outlined,
          title: texts.emptyInventoryTitle,
          description: texts.emptyInventorySubtitle,
          tone: _InventoryStateTone.info,
          action: Semantics(
            button: true,
            label: texts.importStockAction,
            child: ElevatedButton.icon(
              key: const ValueKey<String>('inventory-import-action'),
              onPressed: onImport,
              style: ElevatedButton.styleFrom(minimumSize: const Size(132, 46)),
              icon: const Icon(Icons.playlist_add_check_circle_outlined),
              label: Text(texts.importStockAction),
            ),
          ),
        ),
      ),
    );
  }
}

class _InventoryFilteredEmptyView extends StatelessWidget {
  const _InventoryFilteredEmptyView({required this.onClear});

  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 30),
      child: Center(
        child: _InventoryStateCard(
          icon: Icons.filter_alt_off_outlined,
          title: texts.filteredEmptyMessage,
          tone: _InventoryStateTone.neutral,
          action: TextButton(
            onPressed: onClear,
            style: TextButton.styleFrom(minimumSize: const Size(116, 48)),
            child: Text(texts.clearFiltersAction),
          ),
        ),
      ),
    );
  }
}

enum _InventoryStateTone { info, error, neutral }

class _InventoryStateCard extends StatelessWidget {
  const _InventoryStateCard({
    required this.icon,
    required this.title,
    required this.tone,
    this.description,
    this.action,
  });

  final IconData icon;
  final String title;
  final _InventoryStateTone tone;
  final String? description;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isError = tone == _InventoryStateTone.error;
    final isInfo = tone == _InventoryStateTone.info;
    final background = isError
        ? colors.errorContainer.withValues(alpha: 0.42)
        : isInfo
        ? colors.primaryContainer.withValues(alpha: 0.32)
        : colors.surfaceContainerHighest.withValues(alpha: 0.45);
    final borderColor = isError
        ? colors.error.withValues(alpha: 0.28)
        : isInfo
        ? colors.primary.withValues(alpha: 0.22)
        : colors.outlineVariant.withValues(alpha: 0.72);
    final iconColor = isError
        ? colors.error
        : isInfo
        ? colors.primary
        : colors.onSurfaceVariant;

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 420),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 42, color: iconColor),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            if (description != null && description!.trim().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                description!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colors.onSurfaceVariant,
                  height: 1.4,
                ),
              ),
            ],
            if (action != null) ...[const SizedBox(height: 14), action!],
          ],
        ),
      ),
    );
  }
}
