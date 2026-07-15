part of 'inventory_product_detail_screen.dart';

class _SerialEmptyStateCard extends StatelessWidget {
  const _SerialEmptyStateCard({
    required this.message,
    required this.icon,
    this.actionLabel,
    this.onAction,
  });

  final String message;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: colorScheme.primary, size: 24),
            const SizedBox(height: 10),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.restart_alt_rounded),
                label: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InventoryMetric extends StatelessWidget {
  const _InventoryMetric({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  final String label;
  final String value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 76),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 14, color: color),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: color,
                fontSize: 18,
                fontWeight: FontWeight.w800,
                height: 1.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InventoryDetailAppBarTitle extends StatelessWidget {
  const _InventoryDetailAppBarTitle({
    required this.screenTitle,
    required this.productName,
    required this.productSku,
  });

  final String screenTitle;
  final String productName;
  final String productSku;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        BrandAppBarTitle(screenTitle),
        Text(
          productSku.isEmpty ? productName : '$productName • $productSku',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _SerialProgressPanel extends StatelessWidget {
  const _SerialProgressPanel({
    required this.shownCount,
    required this.filteredCount,
    required this.totalCount,
    required this.progress,
    required this.summaryLabel,
    this.loadingHint,
  });

  final int shownCount;
  final int filteredCount;
  final int totalCount;
  final double progress;
  final String summaryLabel;
  final String? loadingHint;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.28),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.7),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            summaryLabel,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          LinearProgressIndicator(value: progress),
          if (loadingHint != null) ...[
            const SizedBox(height: 6),
            Text(
              loadingHint!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colorScheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          const SizedBox(height: 2),
          Text(
            '$shownCount / $filteredCount (${totalCount.toString()} total)',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _SerialFilterChip extends StatelessWidget {
  const _SerialFilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _detailMinTapTarget),
      child: ChoiceChip(
        label: Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: colorScheme.onSurface),
        ),
        selected: selected,
        showCheckmark: false,
        onSelected: (_) => onTap(),
        selectedColor: colorScheme.secondaryContainer,
        backgroundColor: colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.38,
        ),
        side: BorderSide(
          color: colorScheme.outlineVariant.withValues(alpha: 0.8),
        ),
      ),
    );
  }
}

class _SerialTile extends StatelessWidget {
  const _SerialTile({
    required this.record,
    required this.status,
    required this.onOpenOrder,
    required this.onCopy,
    this.returnIndicatorLabel,
    this.returnIndicatorColor,
    this.onViewTimeline,
    this.onCheckReturnEligibility,
  });

  final ImportedSerialRecord record;
  final ImportedSerialStatus status;
  final VoidCallback onOpenOrder;
  final VoidCallback onCopy;
  final String? returnIndicatorLabel;
  final Color? returnIndicatorColor;
  final VoidCallback? onViewTimeline;
  final VoidCallback? onCheckReturnEligibility;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryProductDetailTexts(context);
    final colorScheme = Theme.of(context).colorScheme;
    final color = switch (status) {
      ImportedSerialStatus.available ||
      ImportedSerialStatus.assigned => const Color(0xFF4ADE80),
      ImportedSerialStatus.warranty => const Color(0xFFFBBF24),
      ImportedSerialStatus.inspecting => const Color(0xFFFDE68A),
      ImportedSerialStatus.defective ||
      ImportedSerialStatus.returned => const Color(0xFFFCA5A5),
      ImportedSerialStatus.scrapped => const Color(0xFFCBD5E1),
      ImportedSerialStatus.reserved ||
      ImportedSerialStatus.unknown => const Color(0xFF93C5FD),
    };
    final statusLabel = switch (status) {
      ImportedSerialStatus.available ||
      ImportedSerialStatus.assigned => texts.readyStatusLabel,
      ImportedSerialStatus.warranty => texts.warrantyStatusLabel,
      ImportedSerialStatus.inspecting => texts.inspectingStatusLabel,
      ImportedSerialStatus.defective => texts.defectiveStatusLabel,
      ImportedSerialStatus.returned => texts.returnedStatusLabel,
      ImportedSerialStatus.scrapped => texts.scrappedStatusLabel,
      ImportedSerialStatus.reserved => texts.reservedStatusLabel,
      ImportedSerialStatus.unknown => texts.unknownStatusLabel,
    };
    final hasReturnIndicator =
        returnIndicatorLabel != null && returnIndicatorLabel!.trim().isNotEmpty;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 8, 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    record.serial,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: colorScheme.onSurface,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                PopupMenuButton<String>(
                  tooltip: texts.serialOptionsTooltip,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(
                    minWidth: _detailMinTapTarget,
                    minHeight: _detailMinTapTarget,
                  ),
                  onSelected: (value) {
                    if (value == 'copy') {
                      onCopy();
                    } else if (value == 'timeline') {
                      onViewTimeline?.call();
                    } else if (value == 'return-eligibility') {
                      onCheckReturnEligibility?.call();
                    }
                  },
                  itemBuilder: (_) => [
                    if (onViewTimeline != null)
                      PopupMenuItem<String>(
                        value: 'timeline',
                        child: Text(texts.timelineAction),
                      ),
                    if (onCheckReturnEligibility != null)
                      PopupMenuItem<String>(
                        value: 'return-eligibility',
                        child: Text(texts.returnEligibilityAction),
                      ),
                    PopupMenuItem<String>(
                      value: 'copy',
                      child: Text(texts.copySerialAction),
                    ),
                  ],
                  child: Container(
                    width: _detailMinTapTarget,
                    height: _detailMinTapTarget,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.more_vert,
                      color: color.withValues(alpha: 0.88),
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: color.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    statusLabel,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: color.withValues(alpha: 0.9),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                if (hasReturnIndicator)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: (returnIndicatorColor ?? colorScheme.tertiary)
                          .withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: (returnIndicatorColor ?? colorScheme.tertiary)
                            .withValues(alpha: 0.36),
                      ),
                    ),
                    child: Text(
                      returnIndicatorLabel!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color:
                            returnIndicatorColor ??
                            colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.schedule_outlined,
                      size: 15,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      texts.importedAtLabel(formatDateTime(record.importedAt)),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                TextButton.icon(
                  onPressed: onOpenOrder,
                  style: TextButton.styleFrom(
                    minimumSize: const Size(100, 40),
                    padding: const EdgeInsets.symmetric(horizontal: 0),
                    foregroundColor: colorScheme.primary,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                  ),
                  icon: const Icon(Icons.receipt_long_outlined, size: 16),
                  label: Text(
                    texts.orderLinkLabel(record.orderId),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colorScheme.primary,
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                      decorationThickness: 1.2,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                if (onCheckReturnEligibility != null)
                  OutlinedButton.icon(
                    onPressed: onCheckReturnEligibility,
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(120, 36),
                      visualDensity: VisualDensity.compact,
                    ),
                    icon: const Icon(
                      Icons.assignment_return_outlined,
                      size: 16,
                    ),
                    label: Text(texts.returnEligibilityAction),
                  ),
                if (onViewTimeline != null)
                  OutlinedButton.icon(
                    onPressed: onViewTimeline,
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(110, 36),
                      visualDensity: VisualDensity.compact,
                    ),
                    icon: const Icon(Icons.timeline_outlined, size: 16),
                    label: Text(texts.timelineAction),
                  ),
                TextButton.icon(
                  onPressed: onCopy,
                  style: TextButton.styleFrom(
                    minimumSize: const Size(88, 36),
                    visualDensity: VisualDensity.compact,
                  ),
                  icon: const Icon(Icons.copy_outlined, size: 16),
                  label: Text(texts.copySerialAction),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InventoryTimelineSheet extends StatelessWidget {
  const _InventoryTimelineSheet({required this.detail, required this.texts});

  final DealerInventorySerialDetailRecord detail;
  final _InventoryProductDetailTexts texts;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final serial = detail.serial.record;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 42,
              height: 4,
              decoration: BoxDecoration(
                color: colorScheme.outlineVariant.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            texts.timelineTitle(serial.serial),
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            '${serial.productName} • ${serial.productSku}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),
          Flexible(
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: detail.timeline.isEmpty ? 1 : detail.timeline.length,
              separatorBuilder: (_, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                if (detail.timeline.isEmpty) {
                  return _SerialEmptyStateCard(
                    icon: Icons.timeline_outlined,
                    message: texts.emptyTimelineMessage,
                  );
                }
                final entry = detail.timeline[index];
                final occurredAt = entry.occurredAt;
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest.withValues(
                      alpha: 0.32,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: colorScheme.outlineVariant.withValues(alpha: 0.55),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entry.title,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: colorScheme.onSurface,
                        ),
                      ),
                      if (occurredAt != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          formatDateTime(occurredAt),
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ],
                      const SizedBox(height: 6),
                      Text(
                        entry.description,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
