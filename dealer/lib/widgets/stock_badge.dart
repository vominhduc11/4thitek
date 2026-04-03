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
  });

  final int remainingStock;
  final int lowStockThreshold;
  final EdgeInsetsGeometry padding;
  final double iconSize;
  final double iconTextSpacing;
  final bool showInStockQuantity;
  final bool useColonForLowStock;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall;
    final colors = Theme.of(context).colorScheme;
    late final String label;
    late final Color textColor;
    late final Color background;

    if (remainingStock <= 0) {
      label = 'Hết hàng';
      textColor = colors.error;
      background = colors.errorContainer.withValues(alpha: 0.42);
    } else if (remainingStock <= lowStockThreshold) {
      label = useColonForLowStock
          ? 'Sắp hết: $remainingStock'
          : 'Sắp hết ($remainingStock)';
      textColor = const Color(0xFFFFC361);
      background = const Color(0xFF3B2C10);
    } else {
      label = showInStockQuantity ? 'Còn hàng: $remainingStock' : 'Còn hàng';
      textColor = colors.primary;
      background = colors.primaryContainer.withValues(alpha: 0.48);
    }

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: textColor.withValues(alpha: 0.18),
        ),
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
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
