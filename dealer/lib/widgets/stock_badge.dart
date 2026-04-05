import 'package:flutter/material.dart';

class StockBadge extends StatelessWidget {
  const StockBadge({
    super.key,
    required this.remainingStock,
    required this.lowStockThreshold,
    this.padding = const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    this.iconSize = 14,
    this.iconTextSpacing = 4,
    this.showInStockQuantity = false,
    this.useColonForLowStock = false,
    this.subtle = false,
  });

  final int remainingStock;
  final int lowStockThreshold;
  final EdgeInsetsGeometry padding;
  final double iconSize;
  final double iconTextSpacing;
  final bool showInStockQuantity;
  final bool useColonForLowStock;
  final bool subtle;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall;
    final colors = Theme.of(context).colorScheme;
    final isEnglish = Localizations.localeOf(context).languageCode == 'en';

    late final String label;
    late final Color textColor;
    late final Color background;
    late final double borderAlpha;

    if (remainingStock <= 0) {
      label = isEnglish ? 'Out of stock' : 'Hết hàng';
      textColor = colors.error;
      background = colors.errorContainer.withValues(alpha: subtle ? 0.2 : 0.42);
      borderAlpha = subtle ? 0.12 : 0.18;
    } else if (remainingStock <= lowStockThreshold) {
      label = useColonForLowStock
          ? (isEnglish
                ? 'Low stock: $remainingStock'
                : 'Sắp hết: $remainingStock')
          : (isEnglish
                ? 'Low stock ($remainingStock)'
                : 'Sắp hết ($remainingStock)');
      textColor = const Color(0xFFBDF919);
      background = Color.alphaBlend(
        const Color(0xFFBDF919).withValues(alpha: subtle ? 0.06 : 0.12),
        colors.surfaceContainerHigh,
      );
      borderAlpha = subtle ? 0.1 : 0.18;
    } else {
      label = showInStockQuantity
          ? (isEnglish
                ? 'In stock: $remainingStock'
                : 'Còn hàng: $remainingStock')
          : (isEnglish ? 'In stock' : 'Còn hàng');
      textColor = colors.primary;
      background = colors.primaryContainer.withValues(
        alpha: subtle ? 0.22 : 0.48,
      );
      borderAlpha = subtle ? 0.12 : 0.18;
    }

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: textColor.withValues(alpha: borderAlpha)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            remainingStock <= 0
                ? Icons.error_outline
                : remainingStock <= lowStockThreshold
                ? Icons.schedule
                : Icons.check_circle_outline,
            size: iconSize,
            color: textColor,
          ),
          SizedBox(width: iconTextSpacing),
          Text(
            label,
            style: style?.copyWith(
              color: textColor,
              fontWeight: subtle ? FontWeight.w600 : FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
