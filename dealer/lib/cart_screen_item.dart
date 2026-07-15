part of 'cart_screen.dart';

class _CartItemCard extends StatelessWidget {
  const _CartItemCard({
    required this.item,
    required this.texts,
    required this.isSyncingItem,
    required this.canIncrease,
    required this.quantityFieldWidth,
    required this.isWide,
    required this.onRemove,
    required this.onConfirmDismiss,
    required this.onQuantityChanged,
  });

  final CartItem item;
  final _CartTexts texts;
  final bool isSyncingItem;
  final bool canIncrease;
  final double quantityFieldWidth;
  final bool isWide;
  final VoidCallback onRemove;
  final Future<bool> Function() onConfirmDismiss;
  final ValueChanged<double> onQuantityChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    const minQty = 1;
    final maxQty = item.product.stock <= 0 ? 1 : item.product.stock;

    final quantitySpinBox = SizedBox(
      width: quantityFieldWidth,
      child: Stack(
        alignment: Alignment.center,
        children: [
          IgnorePointer(
            ignoring: isSyncingItem || item.product.stock <= 0,
            child: Opacity(
              opacity: (isSyncingItem || item.product.stock <= 0) ? 0.7 : 1,
              child: SpinBox(
                min: minQty.toDouble(),
                max: maxQty.toDouble(),
                value: item.quantity.clamp(minQty, maxQty).toDouble(),
                step: 1,
                decimals: 0,
                decoration: InputDecoration(
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 8,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: colors.outlineVariant),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: colors.primary, width: 1.5),
                  ),
                ),
                onChanged: onQuantityChanged,
              ),
            ),
          ),
          if (isSyncingItem)
            Positioned.fill(
              child: Align(
                alignment: Alignment.center,
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: colors.primary,
                  ),
                ),
              ),
            ),
        ],
      ),
    );

    final deleteButton = isSyncingItem
        ? SizedBox(
            width: 40,
            height: 40,
            child: Center(
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: colors.primary,
                ),
              ),
            ),
          )
        : IconButton(
            icon: const Icon(Icons.delete_outline, size: 20),
            color: colors.error,
            tooltip: texts.deleteTooltip,
            onPressed: onRemove,
          );

    final statusHints = <Widget>[
      const SizedBox(height: 8),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          StockBadge(
            remainingStock: item.product.stock,
            lowStockThreshold: 5,
            showInStockQuantity: true,
          ),
          if (!canIncrease && item.product.stock > 0)
            _InlineHintChip(text: texts.maxStockReached, color: colors.error),
          if (isSyncingItem)
            _InlineHintChip(text: texts.syncingItemHint, color: colors.primary),
          if (item.product.stock <= 0)
            _InlineHintChip(
              text: texts.discontinuedProduct,
              color: colors.error,
            ),
        ],
      ),
    ];

    return Semantics(
      container: true,
      label: texts.cartItemSemantics(item.product.name),
      hint: texts.cartItemHint,
      child: Dismissible(
        key: ValueKey('dismiss-${item.product.id}'),
        direction: isSyncingItem
            ? DismissDirection.none
            : DismissDirection.endToStart,
        dismissThresholds: const <DismissDirection, double>{
          DismissDirection.endToStart: 0.42,
        },
        confirmDismiss: (_) => onConfirmDismiss(),
        background: Container(
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 20),
          decoration: BoxDecoration(
            color: colors.error,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Icon(Icons.delete_outline, color: Colors.white, size: 24),
              const SizedBox(height: 6),
              Text(
                texts.swipeDeleteAffordance,
                style: theme.textTheme.labelMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        onDismissed: (_) => onRemove(),
        child: Card(
          margin: EdgeInsets.zero,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(
              color: colors.outlineVariant.withValues(alpha: 0.6),
            ),
          ),
          child: Padding(
            padding: EdgeInsets.fromLTRB(isWide ? 16 : 14, 14, 8, 14),
            child: isWide
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ProductImage(
                        product: item.product,
                        width: 68,
                        height: 68,
                        borderRadius: BorderRadius.circular(16),
                        iconSize: 24,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: _ItemContent(
                          item: item,
                          texts: texts,
                          statusHints: statusHints,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          deleteButton,
                          const SizedBox(height: 8),
                          quantitySpinBox,
                        ],
                      ),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ProductImage(
                            product: item.product,
                            width: 68,
                            height: 68,
                            borderRadius: BorderRadius.circular(16),
                            iconSize: 24,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _ItemContent(
                              item: item,
                              texts: texts,
                              statusHints: statusHints,
                            ),
                          ),
                          deleteButton,
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              texts.lineTotalLabel(
                                formatVnd(item.product.price * item.quantity),
                              ),
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: colors.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          quantitySpinBox,
                        ],
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

class _ItemContent extends StatelessWidget {
  const _ItemContent({
    required this.item,
    required this.texts,
    required this.statusHints,
  });

  final CartItem item;
  final _CartTexts texts;
  final List<Widget> statusHints;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          item.product.name,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
            height: 1.2,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 6),
        Text(
          formatVnd(item.product.price),
          style: theme.textTheme.bodyMedium?.copyWith(
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          texts.skuLabel(item.product.sku),
          style: theme.textTheme.labelMedium?.copyWith(
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          texts.lineTotalLabel(formatVnd(item.product.price * item.quantity)),
          style: theme.textTheme.bodySmall?.copyWith(
            color: colors.primary,
            fontWeight: FontWeight.w700,
          ),
        ),
        ...statusHints,
      ],
    );
  }
}

class _InlineHintChip extends StatelessWidget {
  const _InlineHintChip({required this.text, required this.color});

  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
