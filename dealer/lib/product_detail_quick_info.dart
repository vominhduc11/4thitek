part of 'product_detail_screen.dart';

enum _QuickInfoTone { neutral, info, success, warning, danger }

class _QuickInfoItemData {
  const _QuickInfoItemData({
    required this.label,
    required this.value,
    required this.icon,
    this.tone = _QuickInfoTone.neutral,
  });

  final String label;
  final String value;
  final IconData icon;
  final _QuickInfoTone tone;
}

class _QuickInfoPalette {
  const _QuickInfoPalette({
    required this.background,
    required this.border,
    required this.iconBackground,
    required this.iconColor,
    required this.valueColor,
  });

  final Color background;
  final Color border;
  final Color iconBackground;
  final Color iconColor;
  final Color valueColor;
}

_QuickInfoPalette _quickInfoPaletteFor(
  BuildContext context,
  _QuickInfoTone tone,
) {
  final colors = Theme.of(context).colorScheme;
  switch (tone) {
    case _QuickInfoTone.info:
      return _QuickInfoPalette(
        background: colors.primary.withValues(alpha: 0.18),
        border: colors.primary.withValues(alpha: 0.34),
        iconBackground: colors.primary.withValues(alpha: 0.26),
        iconColor: colors.primary,
        valueColor: colors.primary,
      );
    case _QuickInfoTone.success:
      return _QuickInfoPalette(
        background: colors.tertiary.withValues(alpha: 0.2),
        border: colors.tertiary.withValues(alpha: 0.34),
        iconBackground: colors.tertiary.withValues(alpha: 0.28),
        iconColor: colors.tertiary,
        valueColor: colors.tertiary,
      );
    case _QuickInfoTone.warning:
      return const _QuickInfoPalette(
        background: Color(0xFF4A3917),
        border: Color(0xFF6C4E16),
        iconBackground: Color(0xFF5C4518),
        iconColor: Color(0xFFF4D18A),
        valueColor: Color(0xFFF4D18A),
      );
    case _QuickInfoTone.danger:
      return _QuickInfoPalette(
        background: colors.errorContainer.withValues(alpha: 0.32),
        border: colors.error.withValues(alpha: 0.4),
        iconBackground: colors.error.withValues(alpha: 0.32),
        iconColor: colors.error,
        valueColor: colors.error,
      );
    case _QuickInfoTone.neutral:
      return _QuickInfoPalette(
        background: colors.surfaceContainerHighest.withValues(alpha: 0.4),
        border: colors.outlineVariant.withValues(alpha: 0.7),
        iconBackground: colors.secondaryContainer.withValues(alpha: 0.7),
        iconColor: colors.onSecondaryContainer,
        valueColor: colors.onSurface,
      );
  }
}

class _QuickInfoSection extends StatelessWidget {
  const _QuickInfoSection({
    required this.isTablet,
    required this.stock,
    required this.remainingStock,
    required this.quantityInCart,
    required this.warrantyMonths,
    required this.nextAddQuantity,
  });

  final bool isTablet;
  final int stock;
  final int remainingStock;
  final int quantityInCart;
  final int warrantyMonths;
  final int nextAddQuantity;

  _QuickInfoItemData _buildStatusItem(_ProductDetailTexts texts) {
    if (remainingStock <= 0) {
      return _QuickInfoItemData(
        label: texts.statusLabel,
        value: texts.outOfStockShortLabel,
        icon: Icons.cancel_outlined,
        tone: _QuickInfoTone.danger,
      );
    }
    if (remainingStock <= 10) {
      return _QuickInfoItemData(
        label: texts.statusLabel,
        value: texts.lowStockShortLabel,
        icon: Icons.schedule_outlined,
        tone: _QuickInfoTone.warning,
      );
    }
    return _QuickInfoItemData(
      label: texts.statusLabel,
      value: texts.inStockShortLabel,
      icon: Icons.check_circle_outline,
      tone: _QuickInfoTone.success,
    );
  }

  @override
  Widget build(BuildContext context) {
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    final canAddNow = nextAddQuantity > 0 && remainingStock > 0;
    final items = <_QuickInfoItemData>[
      _buildStatusItem(texts),
      _QuickInfoItemData(
        label: texts.stockLabel,
        value: quantityInCart > 0 ? '$remainingStock/$stock' : '$stock',
        icon: Icons.inventory_2_outlined,
        tone: remainingStock <= 0
            ? _QuickInfoTone.danger
            : remainingStock <= 10
            ? _QuickInfoTone.warning
            : _QuickInfoTone.info,
      ),
      _QuickInfoItemData(
        label: texts.readyToAddLabel,
        value: canAddNow ? texts.readyToAddValue(nextAddQuantity) : '--',
        icon: canAddNow
            ? Icons.add_shopping_cart_outlined
            : Icons.remove_shopping_cart_outlined,
        tone: canAddNow ? _QuickInfoTone.success : _QuickInfoTone.neutral,
      ),
      _QuickInfoItemData(
        label: texts.warrantyLabel,
        value: texts.warrantyMonthsValue(warrantyMonths),
        icon: Icons.verified_outlined,
        tone: _QuickInfoTone.success,
      ),
    ];

    return Container(
      padding: EdgeInsets.all(isTablet ? 18 : 14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            texts.quickInfoTitle,
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            texts.quickInfoDescription,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.35,
            ),
          ),
          if (quantityInCart > 0) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: colors.primaryContainer.withValues(alpha: 0.45),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: colors.primary.withValues(alpha: 0.24),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.shopping_cart_outlined,
                    size: 16,
                    color: colors.onPrimaryContainer,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      texts.quantityInCartBanner(quantityInCart),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.onPrimaryContainer,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 10),
          LayoutBuilder(
            builder: (context, constraints) {
              final isVeryNarrow = constraints.maxWidth < 340;
              final columns = isVeryNarrow
                  ? 1
                  : constraints.maxWidth >= 620
                  ? 3
                  : 2;
              const spacing = 10.0;
              final tileWidth =
                  (constraints.maxWidth - spacing * (columns - 1)) / columns;
              return Wrap(
                spacing: spacing,
                runSpacing: spacing,
                children: items.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  final isLastOddTile =
                      columns == 2 &&
                      items.length.isOdd &&
                      index == items.length - 1;
                  return SizedBox(
                    width: isLastOddTile ? constraints.maxWidth : tileWidth,
                    child: _QuickInfoTile(item: item),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _QuickInfoTile extends StatelessWidget {
  const _QuickInfoTile({required this.item});

  final _QuickInfoItemData item;

  @override
  Widget build(BuildContext context) {
    final palette = _quickInfoPaletteFor(context, item.tone);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: palette.iconBackground,
                  shape: BoxShape.circle,
                ),
                child: Icon(item.icon, size: 14, color: palette.iconColor),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  item.value,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: palette.valueColor,
                    fontWeight: FontWeight.w700,
                    height: 1.2,
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
