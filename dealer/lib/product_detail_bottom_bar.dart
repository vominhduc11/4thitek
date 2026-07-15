part of 'product_detail_screen.dart';

class _BottomActionBar extends StatelessWidget {
  const _BottomActionBar({
    required this.price,
    required this.remainingStock,
    required this.quantityInCart,
    required this.nextAddQuantity,
    required this.addToCartDisabledReason,
    required this.buyNowDisabledReason,
    required this.isTablet,
    required this.isSmallMobile,
    required this.isAddingToCart,
    required this.isBuyingNow,
    required this.isSyncingProduct,
    required this.onAddToCart,
    required this.onBuyNow,
  });

  final int price;
  final int remainingStock;
  final int quantityInCart;
  final int nextAddQuantity;
  final String? addToCartDisabledReason;
  final String? buyNowDisabledReason;
  final bool isTablet;
  final bool isSmallMobile;
  final bool isAddingToCart;
  final bool isBuyingNow;
  final bool isSyncingProduct;
  final VoidCallback? onAddToCart;
  final VoidCallback? onBuyNow;

  @override
  Widget build(BuildContext context) {
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    final label = remainingStock <= 0
        ? texts.outOfStockShortLabel
        : remainingStock <= 10
        ? texts.lowStockCompactLabel
        : texts.inStockShortLabel;
    final labelColor = remainingStock <= 0
        ? colors.error
        : remainingStock <= 10
        ? colors.tertiary
        : colors.primary;
    final helperTextColor = colors.onSurfaceVariant.withValues(alpha: 0.9);
    final shouldShowAddDisabledReason =
        addToCartDisabledReason != null && onAddToCart == null;
    final shouldShowBuyDisabledReason =
        buyNowDisabledReason != null && onBuyNow == null;
    final actionDisabledReason = shouldShowBuyDisabledReason
        ? buyNowDisabledReason
        : shouldShowAddDisabledReason
        ? addToCartDisabledReason
        : null;

    final addButton = OutlinedButton(
      onPressed: onAddToCart,
      child: isAddingToCart || isSyncingProduct
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            )
          : Text(texts.addToCartTitle),
    );
    final buyButton = ElevatedButton(
      onPressed: onBuyNow,
      child: isBuyingNow || isSyncingProduct
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            )
          : Text(texts.buyNowTitle),
    );
    final horizontalPadding = isTablet
        ? 28.0
        : isSmallMobile
        ? 16.0
        : 20.0;
    final topPadding = isTablet
        ? 14.0
        : isSmallMobile
        ? 10.0
        : 12.0;
    final bottomPadding = isTablet
        ? 16.0
        : isSmallMobile
        ? 12.0
        : 14.0;

    Widget buildPriceInfo() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            formatVnd(price),
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 2),
          Text(
            texts.vatExcludedLabel,
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: colors.onSurfaceVariant),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: labelColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (quantityInCart > 0) ...[
            const SizedBox(height: 2),
            Text(
              texts.quantityInCartSummary(quantityInCart),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
          ] else if (remainingStock > 0) ...[
            const SizedBox(height: 2),
            Text(
              texts.flexibleQuantityLabel,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      );
    }

    Widget buildActionControls() {
      return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: shouldShowAddDisabledReason
                    ? Tooltip(
                        message: addToCartDisabledReason!,
                        child: addButton,
                      )
                    : addButton,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: shouldShowBuyDisabledReason
                    ? Tooltip(message: buyNowDisabledReason!, child: buyButton)
                    : buyButton,
              ),
            ],
          ),
          if (actionDisabledReason != null) ...[
            const SizedBox(height: 4),
            Text(
              actionDisabledReason,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: helperTextColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      );
    }

    return SafeArea(
      top: false,
      child: Container(
        padding: EdgeInsets.fromLTRB(
          horizontalPadding,
          topPadding,
          horizontalPadding,
          bottomPadding,
        ),
        decoration: BoxDecoration(
          color: colors.surface,
          boxShadow: [
            BoxShadow(
              color: Theme.of(context).shadowColor.withValues(alpha: 0.08),
              blurRadius: 18,
              offset: const Offset(0, -8),
            ),
          ],
        ),
        child: isSmallMobile
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  buildPriceInfo(),
                  const SizedBox(height: 8),
                  buildActionControls(),
                ],
              )
            : Row(
                children: [
                  Expanded(child: buildPriceInfo()),
                  const SizedBox(width: 12),
                  Expanded(flex: 2, child: buildActionControls()),
                ],
              ),
      ),
    );
  }
}

class _BottomActionBarPlaceholder extends StatelessWidget {
  const _BottomActionBarPlaceholder({
    required this.isTablet,
    required this.isSmallMobile,
  });

  final bool isTablet;
  final bool isSmallMobile;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final horizontalPadding = isTablet
        ? 28.0
        : isSmallMobile
        ? 16.0
        : 20.0;
    final topPadding = isTablet
        ? 14.0
        : isSmallMobile
        ? 10.0
        : 12.0;
    final bottomPadding = isTablet
        ? 16.0
        : isSmallMobile
        ? 12.0
        : 14.0;
    return SafeArea(
      top: false,
      child: Container(
        padding: EdgeInsets.fromLTRB(
          horizontalPadding,
          topPadding,
          horizontalPadding,
          bottomPadding,
        ),
        decoration: BoxDecoration(
          color: colors.surface,
          boxShadow: [
            BoxShadow(
              color: Theme.of(context).shadowColor.withValues(alpha: 0.08),
              blurRadius: 18,
              offset: const Offset(0, -8),
            ),
          ],
        ),
        child: isSmallMobile
            ? const Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  SkeletonBox(width: 120, height: 22),
                  SizedBox(height: 6),
                  SkeletonBox(width: 84, height: 12),
                  SizedBox(height: 4),
                  SkeletonBox(width: 140, height: 12),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: SkeletonBox(
                          width: double.infinity,
                          height: 40,
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                        ),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: SkeletonBox(
                          width: double.infinity,
                          height: 40,
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ],
              )
            : Row(
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SkeletonBox(width: 120, height: 22),
                        SizedBox(height: 6),
                        SkeletonBox(width: 84, height: 12),
                        SizedBox(height: 4),
                        SkeletonBox(width: 140, height: 12),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: Row(
                      children: const [
                        Expanded(
                          child: SkeletonBox(
                            width: double.infinity,
                            height: 40,
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: SkeletonBox(
                            width: double.infinity,
                            height: 40,
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _BottomBarHeightReporter extends StatefulWidget {
  const _BottomBarHeightReporter({
    required this.child,
    required this.onHeightChanged,
  });

  final Widget child;
  final ValueChanged<double> onHeightChanged;

  @override
  State<_BottomBarHeightReporter> createState() =>
      _BottomBarHeightReporterState();
}

class _BottomBarHeightReporterState extends State<_BottomBarHeightReporter> {
  double _lastHeight = -1;

  void _reportHeight() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      final height = context.size?.height;
      if (height == null || (height - _lastHeight).abs() < 0.5) {
        return;
      }
      _lastHeight = height;
      widget.onHeightChanged(height);
    });
  }

  @override
  Widget build(BuildContext context) {
    _reportHeight();
    return widget.child;
  }
}
