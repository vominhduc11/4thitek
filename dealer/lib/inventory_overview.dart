part of 'inventory_screen.dart';

class _InventoryOverviewCard extends StatelessWidget {
  const _InventoryOverviewCard({
    required this.layout,
    required this.headline,
    required this.summary,
    required this.metrics,
    required this.importActionLabel,
    required this.exportActionLabel,
    required this.scanActionLabel,
    required this.scanHelperText,
    required this.onImportAction,
    required this.onExportAction,
    required this.onScanAction,
    required this.onRetrySync,
    this.warningMessage,
  });

  final _InventoryLayoutConfig layout;
  final String headline;
  final String summary;
  final String? warningMessage;
  final List<Widget> metrics;
  final String importActionLabel;
  final String exportActionLabel;
  final String scanActionLabel;
  final String scanHelperText;
  final VoidCallback onImportAction;
  final VoidCallback onExportAction;
  final VoidCallback onScanAction;
  final VoidCallback onRetrySync;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final hasWarning =
        warningMessage != null && warningMessage!.trim().isNotEmpty;
    final accentColor = hasWarning ? colorScheme.error : colorScheme.primary;
    final statusValue = hasWarning
        ? texts.syncAttentionLabel
        : texts.sourceHealthyValue;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.94),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: accentColor.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  headline,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurface,
                    fontWeight: FontWeight.w800,
                    height: 1.25,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Flexible(
                child: Align(
                  alignment: Alignment.topRight,
                  child: _InventoryStatusPill(
                    icon: hasWarning
                        ? Icons.priority_high_rounded
                        : Icons.sync_rounded,
                    label: '${texts.sourceHealthLabel}: $statusValue',
                    accentColor: hasWarning
                        ? colorScheme.error
                        : colorScheme.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            summary,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
              height: 1.42,
            ),
          ),
          if (hasWarning) ...[
            const SizedBox(height: 12),
            _InventorySyncWarningBanner(
              message: warningMessage!,
              onRetry: onRetrySync,
            ),
          ],
          const SizedBox(height: 14),
          if (layout.showInlineOverviewActions)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (metrics.isNotEmpty)
                  Expanded(
                    child: Wrap(spacing: 10, runSpacing: 10, children: metrics),
                  ),
                if (metrics.isNotEmpty) const SizedBox(width: 18),
                SizedBox(
                  width: 280,
                  child: _InventoryQuickActionsPanel(
                    texts: texts,
                    importActionLabel: importActionLabel,
                    exportActionLabel: exportActionLabel,
                    scanActionLabel: scanActionLabel,
                    scanHelperText: scanHelperText,
                    onImportAction: onImportAction,
                    onExportAction: onExportAction,
                    onScanAction: onScanAction,
                    compact: false,
                  ),
                ),
              ],
            )
          else ...[
            _InventoryQuickActionsPanel(
              texts: texts,
              importActionLabel: importActionLabel,
              exportActionLabel: exportActionLabel,
              scanActionLabel: scanActionLabel,
              scanHelperText: scanHelperText,
              onImportAction: onImportAction,
              onExportAction: onExportAction,
              onScanAction: onScanAction,
              compact: true,
            ),
            if (metrics.isNotEmpty) ...[
              const SizedBox(height: 14),
              Wrap(spacing: 10, runSpacing: 10, children: metrics),
            ],
          ],
        ],
      ),
    );
  }
}

class _InventoryQuickActionsPanel extends StatelessWidget {
  const _InventoryQuickActionsPanel({
    required this.texts,
    required this.importActionLabel,
    required this.exportActionLabel,
    required this.scanActionLabel,
    required this.scanHelperText,
    required this.onImportAction,
    required this.onExportAction,
    required this.onScanAction,
    required this.compact,
  });

  final _InventoryTexts texts;
  final String importActionLabel;
  final String exportActionLabel;
  final String scanActionLabel;
  final String scanHelperText;
  final VoidCallback onImportAction;
  final VoidCallback onExportAction;
  final VoidCallback onScanAction;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final scanButton = FilledButton.icon(
      onPressed: onScanAction,
      icon: const Icon(Icons.qr_code_scanner_outlined),
      label: Text(scanActionLabel),
    );
    final exportButton = OutlinedButton.icon(
      onPressed: onExportAction,
      icon: const Icon(Icons.local_shipping_outlined),
      label: Text(exportActionLabel),
    );
    final importButton = TextButton.icon(
      onPressed: onImportAction,
      icon: const Icon(Icons.move_to_inbox_outlined),
      label: Text(importActionLabel),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          texts.quickActionsLabel,
          style: theme.textTheme.labelLarge?.copyWith(
            color: colorScheme.primary,
            fontWeight: FontWeight.w700,
          ),
        ),
        Text(
          scanHelperText,
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 10),
        if (compact) ...[
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [scanButton, exportButton, importButton],
          ),
        ] else ...[
          scanButton,
          const SizedBox(height: 8),
          exportButton,
          Align(alignment: Alignment.centerLeft, child: importButton),
        ],
      ],
    );
  }
}

class _InventorySyncWarningBanner extends StatelessWidget {
  const _InventorySyncWarningBanner({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.errorContainer.withValues(alpha: 0.52),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colorScheme.error.withValues(alpha: 0.28)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.warning_amber_rounded,
            size: 18,
            color: colorScheme.onErrorContainer,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onErrorContainer,
                fontWeight: FontWeight.w600,
                height: 1.4,
              ),
            ),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(
              minimumSize: const Size(80, 40),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(_inventoryTexts(context).retryAction),
          ),
        ],
      ),
    );
  }
}

class _InventoryStatusPill extends StatelessWidget {
  const _InventoryStatusPill({
    required this.icon,
    required this.label,
    required this.accentColor,
  });

  final IconData icon;
  final String label;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: colorScheme.surface.withValues(alpha: 0.48),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: accentColor.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: accentColor),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: colorScheme.onSurface,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
