part of 'inventory_screen.dart';

class _InventoryProductTile extends StatelessWidget {
  const _InventoryProductTile({required this.item, required this.onTap});

  final InventoryProductItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final now = DateTime.now();
    final importAgeDays = now.difference(item.latestImportedAt).inDays;
    final isFreshImport = importAgeDays <= 14;
    late final String status;
    late final Color statusColor;
    late final IconData statusIcon;
    switch (item.stockStatus) {
      case InventoryStockStatus.inStock:
        status = texts.inStockStatus;
        statusColor = const Color(0xFF4ADE80);
        statusIcon = Icons.check_circle_outline;
      case InventoryStockStatus.lowStock:
        status = texts.lowStockStatus;
        statusColor = const Color(0xFFFBBF24);
        statusIcon = Icons.warning_amber_rounded;
      case InventoryStockStatus.outOfStock:
        status = texts.outOfStockStatus;
        statusColor = const Color(0xFFFCA5A5);
        statusIcon = Icons.remove_circle_outline;
    }

    return Semantics(
      button: true,
      label: texts.productTileSemantic(
        item.product.name,
        item.product.sku,
        item.readyQuantity,
        status,
      ),
      child: Card(
        elevation: 0,
        margin: EdgeInsets.zero,
        shadowColor: colorScheme.shadow.withValues(alpha: 0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: statusColor.withValues(alpha: 0.18)),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final showSidePanel = constraints.maxWidth >= 320;
                final compactTile = constraints.maxWidth < 360;
                final imageSize = showSidePanel
                    ? (compactTile ? 60.0 : 72.0)
                    : 72.0;
                final supportingMetrics = <Widget>[
                  _InventoryInlineMetric(
                    icon: Icons.inventory_2_outlined,
                    label:
                        '${texts.importedMetricLabel}: ${item.importedQuantity}',
                  ),
                  _InventoryInlineMetric(
                    icon: Icons.schedule_rounded,
                    label: texts.latestImportedLabel(
                      formatDate(item.latestImportedAt),
                    ),
                  ),
                  if (item.issueQuantity > 0)
                    _InventoryInlineMetric(
                      icon: Icons.report_gmailerrorred_outlined,
                      label: '${texts.issueMetricLabel}: ${item.issueQuantity}',
                      accentColor: const Color(0xFFB45309),
                    ),
                  if (item.stockStatus == InventoryStockStatus.lowStock)
                    _InventoryInlineMetric(
                      icon: Icons.warning_amber_rounded,
                      label: texts.lowStockStatus,
                      accentColor: const Color(0xFFB45309),
                    ),
                  if (item.warrantyQuantity > 0)
                    _InventoryInlineMetric(
                      icon: Icons.verified_outlined,
                      label:
                          '${texts.warrantyMetricLabel}: ${item.warrantyQuantity}',
                      accentColor: const Color(0xFF0F9D8B),
                    ),
                  if (!compactTile && item.orderIds.isNotEmpty)
                    _InventoryInlineMetric(
                      icon: Icons.receipt_long_outlined,
                      label: item.orderIds.length == 1
                          ? item.orderIds.first
                          : '${item.orderIds.length} orders',
                    ),
                ];
                final visibleSupportingMetrics = compactTile
                    ? supportingMetrics.take(2).toList()
                    : supportingMetrics;
                final identityBlock = Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _InventoryTileStatusBadge(
                          icon: statusIcon,
                          label: status,
                          color: statusColor,
                        ),
                        if (isFreshImport)
                          _InventoryTileStatusBadge(
                            icon: Icons.new_releases_outlined,
                            label: 'New import',
                            color: const Color(0xFF2563EB),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      item.product.name,
                      maxLines: compactTile ? 1 : 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: colorScheme.onSurface,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'SKU: ${item.product.sku}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.1,
                      ),
                    ),
                    SizedBox(height: compactTile ? 6 : 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: visibleSupportingMetrics,
                    ),
                  ],
                );
                final readyPanel = _InventoryReadyQuantityPanel(
                  label: texts.stockMetricLabel,
                  quantity: item.readyQuantity,
                  status: status,
                  statusColor: statusColor,
                  statusIcon: statusIcon,
                );

                return showSidePanel
                    ? Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Semantics(
                            image: true,
                            label: texts.productImageLabel(item.product.name),
                            child: ExcludeSemantics(
                              child: ProductImage(
                                product: item.product,
                                width: imageSize,
                                height: imageSize,
                                borderRadius: BorderRadius.circular(16),
                                fit: BoxFit.cover,
                                iconSize: 22,
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(child: identityBlock),
                          const SizedBox(width: 16),
                          SizedBox(
                            width: compactTile ? 108 : 132,
                            child: readyPanel,
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Semantics(
                                image: true,
                                label: texts.productImageLabel(
                                  item.product.name,
                                ),
                                child: ExcludeSemantics(
                                  child: ProductImage(
                                    product: item.product,
                                    width: imageSize,
                                    height: imageSize,
                                    borderRadius: BorderRadius.circular(16),
                                    fit: BoxFit.cover,
                                    iconSize: 22,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(child: identityBlock),
                            ],
                          ),
                          const SizedBox(height: 14),
                          readyPanel,
                        ],
                      );
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _InventoryReadyQuantityPanel extends StatelessWidget {
  const _InventoryReadyQuantityPanel({
    required this.label,
    required this.quantity,
    required this.status,
    required this.statusColor,
    required this.statusIcon,
  });

  final String label;
  final int quantity;
  final String status;
  final Color statusColor;
  final IconData statusIcon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            statusColor.withValues(alpha: 0.16),
            colorScheme.surfaceContainerLow.withValues(alpha: 0.96),
          ],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: statusColor.withValues(alpha: 0.24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.labelMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$quantity',
            style: theme.textTheme.headlineSmall?.copyWith(
              color: colorScheme.onSurface,
              fontWeight: FontWeight.w900,
              height: 1,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(statusIcon, size: 15, color: statusColor),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  status,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InventoryInlineMetric extends StatelessWidget {
  const _InventoryInlineMetric({
    required this.icon,
    required this.label,
    this.accentColor,
  });

  final IconData icon;
  final String label;
  final Color? accentColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final resolvedColor = accentColor ?? colorScheme.onSurfaceVariant;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: resolvedColor),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall?.copyWith(
              color: resolvedColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

class _InventoryTileStatusBadge extends StatelessWidget {
  const _InventoryTileStatusBadge({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
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
