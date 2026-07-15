part of 'dashboard_screen.dart';

class _LowStockCard extends StatelessWidget {
  const _LowStockCard({required this.item});

  final _DashboardLowStockItem item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final colorScheme = theme.colorScheme;
    final product = item.product;
    final availableQuantity = item.availableQuantity;
    final shortage = math.max(0, _lowStockAlertThreshold - availableQuantity);
    final isCritical = availableQuantity <= 3;
    final accentColor = isCritical
        ? const Color(0xFFDC2626)
        : const Color(0xFFD97706);
    final surfaceColor = isCritical
        ? colorScheme.errorContainer
        : colorScheme.tertiaryContainer;
    final borderColor = isCritical ? colorScheme.error : colorScheme.tertiary;
    final ratio = (availableQuantity / _lowStockAlertThreshold)
        .clamp(0.0, 1.0)
        .toDouble();
    const minimumTarget = 1;
    final shortageToMinimum = math.max(0, minimumTarget - availableQuantity);
    final statusLabel = texts.lowStockStatusLabel(shortage);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: accentColor.withValues(alpha: 0.16),
                ),
                alignment: Alignment.center,
                child: Icon(_productIcon(), size: 20, color: accentColor),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'SKU: ${_compactSku(product.sku)}',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: _dashboardMutedText(context),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface.withValues(alpha: 0.72),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: borderColor.withValues(alpha: 0.65),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '$availableQuantity/$_lowStockAlertThreshold',
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: accentColor,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      texts.lowStockThresholdLabel,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: _dashboardMutedText(context),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          LayoutBuilder(
            builder: (context, constraints) {
              final fillWidth = ratio == 0
                  ? 0.0
                  : math.max(6.0, constraints.maxWidth * ratio);
              return ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: Stack(
                  alignment: Alignment.centerLeft,
                  children: [
                    Container(
                      height: 8,
                      color: accentColor.withValues(alpha: 0.18),
                    ),
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 350),
                      curve: Curves.easeOutCubic,
                      width: fillWidth,
                      height: 8,
                      decoration: BoxDecoration(
                        color: accentColor,
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(Icons.warning_amber_rounded, size: 14, color: accentColor),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  statusLabel,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: accentColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                texts.lowStockMinimumLabel(minimumTarget, shortageToMinimum),
                style: theme.textTheme.labelSmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

IconData _productIcon() {
  return Icons.inventory_2_rounded;
}

String _compactSku(String sku) {
  final cleaned = sku.trim();
  if (cleaned.length <= 18) {
    return cleaned;
  }
  final parts = cleaned.split('-');
  if (parts.length >= 3) {
    return '${parts.first}-...-${parts.last}';
  }
  return '${cleaned.substring(0, 8)}...${cleaned.substring(cleaned.length - 5)}';
}

class _LowStockPanel extends StatelessWidget {
  const _LowStockPanel({
    required this.products,
    required this.onOpenInventory,
    required this.onOpenLowStockInventory,
  });

  final List<_DashboardLowStockItem> products;
  final VoidCallback onOpenInventory;
  final VoidCallback onOpenLowStockInventory;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final colorScheme = theme.colorScheme;
    final hasAlerts = products.isNotEmpty;
    final panelColor = hasAlerts
        ? colorScheme.errorContainer
        : colorScheme.tertiaryContainer;
    final panelBorderColor = hasAlerts
        ? colorScheme.error
        : colorScheme.tertiary;
    final headerIconBg = hasAlerts
        ? colorScheme.errorContainer
        : colorScheme.tertiaryContainer;
    final headerIconColor = hasAlerts
        ? colorScheme.onErrorContainer
        : colorScheme.onTertiaryContainer;
    final headerTitle = texts.lowStockHeaderTitle(hasAlerts);
    final headerSubtitle = texts.lowStockHeaderSubtitle(hasAlerts);

    return Card(
      elevation: 0,
      color: panelColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: panelBorderColor, width: 1.3),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: headerIconBg,
                    border: Border.all(color: panelBorderColor, width: 1.4),
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    hasAlerts
                        ? Icons.warning_amber_rounded
                        : Icons.verified_outlined,
                    size: 22,
                    color: headerIconColor,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        headerTitle,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: hasAlerts
                              ? colorScheme.onErrorContainer
                              : colorScheme.onTertiaryContainer,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        headerSubtitle,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: hasAlerts
                              ? colorScheme.onErrorContainer.withValues(
                                  alpha: 0.85,
                                )
                              : colorScheme.onTertiaryContainer.withValues(
                                  alpha: 0.85,
                                ),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                if (hasAlerts)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: colorScheme.error),
                    ),
                    child: Text(
                      texts.lowStockSkuCountLabel(products.length),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.onErrorContainer,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            if (products.isEmpty)
              _EmptyCard(
                title: texts.lowStockEmptyTitle,
                message: texts.lowStockEmptyMessage,
                description: texts.lowStockEmptyDescription,
                icon: Icons.inventory_2_outlined,
                ctaLabel: texts.viewInventoryAction,
                ctaSemanticLabel: texts.openInventorySemantic,
                ctaIcon: Icons.inventory_2_outlined,
                onCtaPressed: onOpenInventory,
              )
            else
              ...products.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                return Padding(
                  padding: EdgeInsets.only(
                    bottom: index == products.length - 1 ? 0 : 8,
                  ),
                  child: _LowStockCard(item: item),
                );
              }),
            if (hasAlerts) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: onOpenLowStockInventory,
                  style: FilledButton.styleFrom(
                    backgroundColor: colorScheme.error,
                    foregroundColor: colorScheme.onError,
                    minimumSize: const Size(0, 48),
                  ),
                  icon: const Icon(Icons.local_shipping_outlined, size: 18),
                  label: Text(texts.replenishNowAction),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _OrderStatusDistributionCard extends StatelessWidget {
  const _OrderStatusDistributionCard({
    required this.orders,
    required this.onCreateOrder,
  });

  final List<Order> orders;
  final VoidCallback onCreateOrder;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final colorScheme = theme.colorScheme;
    final totals = _computeStatusTotals(orders);
    final totalCount = totals.values.fold<int>(0, (sum, v) => sum + v);
    final showEmpty = totalCount == 0;

    return _DashboardSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _DashboardCardHeader(
            title: texts.orderDistributionTitle,
            subtitle: showEmpty ? null : texts.orderDistributionHint,
            trailing: _DashboardStatBadge(
              icon: Icons.receipt_long_outlined,
              label: texts.orderCountChipLabel(totalCount),
            ),
          ),
          const SizedBox(height: 12),
          if (showEmpty)
            _EmptyCard(
              title: texts.orderDistributionTitle,
              message: texts.orderDistributionEmptyMessage,
              description: texts.orderDistributionEmptyDescription,
              icon: Icons.inbox_outlined,
              ctaLabel: texts.createOrderAction,
              ctaSemanticLabel: texts.createOrderToTrackSemantic,
              ctaIcon: Icons.add_shopping_cart_outlined,
              onCtaPressed: onCreateOrder,
            )
          else
            Column(
              children: _statusOrder.map((status) {
                final count = totals[status] ?? 0;
                final ratio = totalCount == 0 ? 0.0 : count / totalCount;
                final percent = totalCount == 0 ? 0 : (ratio * 100).round();
                final statusOrders =
                    orders.where((order) => order.status == status).toList()
                      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _StatusBar(
                    label: texts.orderStatusLabel(status),
                    count: count,
                    ratio: ratio,
                    percent: percent,
                    color: _statusColor(status, colorScheme),
                    onTap: () => _showStatusDetailSheet(
                      context: context,
                      status: status,
                      orders: statusOrders,
                      totalCount: totalCount,
                      color: _statusColor(status, colorScheme),
                    ),
                  ),
                );
              }).toList(),
            ),
        ],
      ),
    );
  }

  Map<OrderStatus, int> _computeStatusTotals(List<Order> orders) {
    final map = <OrderStatus, int>{for (final s in _statusOrder) s: 0};
    for (final order in orders) {
      map[order.status] = (map[order.status] ?? 0) + 1;
    }
    return map;
  }

  void _showStatusDetailSheet({
    required BuildContext context,
    required OrderStatus status,
    required List<Order> orders,
    required int totalCount,
    required Color color,
  }) {
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final count = orders.length;
    final ratio = totalCount == 0 ? 0.0 : count / totalCount;
    final percent = totalCount == 0 ? 0 : (ratio * 100).round();

    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      requestFocus: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final theme = Theme.of(context);
        return SafeArea(
          top: false,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: RepaintBoundary(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: color,
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                texts.orderStatusLabel(status),
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            Text(
                              texts.orderCountPercentLabel(count, percent),
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: theme.colorScheme.onSurface,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          texts.selectedStatusListDescription,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: _dashboardMutedText(context),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (orders.isEmpty)
                          _EmptyCard(
                            title: texts.noMatchingOrdersTitle,
                            message: texts.noMatchingOrdersMessage,
                            description: texts.noMatchingOrdersDescription,
                            icon: Icons.filter_alt_off_outlined,
                          )
                        else
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxHeight: 300),
                            child: ListView.separated(
                              shrinkWrap: true,
                              itemCount: orders.length,
                              separatorBuilder: (context, index) =>
                                  const Divider(height: 1),
                              itemBuilder: (context, index) {
                                final order = orders[index];
                                return ListTile(
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 2,
                                  ),
                                  minVerticalPadding: 8,
                                  title: Text(order.id),
                                  subtitle: Text(
                                    formatDateTime(order.createdAt),
                                  ),
                                  trailing: Text(
                                    formatVnd(order.total),
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onSurface,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _StatusBar extends StatelessWidget {
  const _StatusBar({
    required this.label,
    required this.count,
    required this.ratio,
    required this.percent,
    required this.color,
    this.onTap,
  });

  final String label;
  final int count;
  final double ratio;
  final int percent;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );

    Widget ratioBar() {
      return ClipRRect(
        borderRadius: BorderRadius.circular(999),
        child: Container(
          height: 11,
          color: color.withValues(alpha: 0.16),
          child: TweenAnimationBuilder<double>(
            tween: Tween<double>(begin: 0, end: ratio.clamp(0.0, 1.0)),
            duration: const Duration(milliseconds: 450),
            curve: Curves.easeOutCubic,
            builder: (context, animatedRatio, _) {
              return FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: animatedRatio,
                child: Container(color: color),
              );
            },
          ),
        ),
      );
    }

    final compactContent = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              texts.orderCountPercentLabel(count, percent),
              textAlign: TextAlign.right,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: theme.colorScheme.onSurface,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ratioBar(),
      ],
    );

    final regularContent = Row(
      children: [
        SizedBox(
          width: 86,
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: ratioBar()),
        const SizedBox(width: 10),
        SizedBox(
          width: 104,
          child: Text(
            texts.orderCountPercentLabel(count, percent),
            textAlign: TextAlign.right,
            maxLines: 2,
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurface,
              height: 1.25,
            ),
          ),
        ),
      ],
    );

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isCompact = constraints.maxWidth < 350;
            return Row(
              children: [
                Expanded(child: isCompact ? compactContent : regularContent),
                const SizedBox(width: 4),
                Icon(
                  Icons.chevron_right_rounded,
                  size: 18,
                  color: _dashboardMutedText(context),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
