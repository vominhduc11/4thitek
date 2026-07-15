import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_spinbox/flutter_spinbox.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'dealer_navigation.dart';
import 'dealer_routes.dart';
import 'global_search.dart';
import 'models.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/product_image.dart';
import 'widgets/section_card.dart';
import 'widgets/stock_badge.dart';

part 'cart_screen_cards.dart';
part 'cart_screen_item.dart';
part 'cart_screen_summary.dart';
part 'cart_screen_texts.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key, this.onShop});

  final VoidCallback? onShop;

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final Map<String, Timer> _quantityDebounceTimers = {};

  @override
  void dispose() {
    for (final timer in _quantityDebounceTimers.values) {
      timer.cancel();
    }
    super.dispose();
  }

  void _scheduleQuantitySync(CartController cart, CartItem item, double value) {
    final productId = item.product.id;
    _quantityDebounceTimers[productId]?.cancel();
    _quantityDebounceTimers[productId] = Timer(
      const Duration(milliseconds: 400),
      () => unawaited(cart.setQuantity(item.product, value.round())),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    final texts = _CartTexts(isEnglish: isEnglish);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final cart = CartScope.of(context);
    final items = cart.items;

    final hasAnyOrderableItems = items.any((item) => item.product.stock > 0);
    final isCartSyncing = cart.isSyncing;
    final discountPercent = cart.discountPercent;
    final discountAmount = cart.discountAmount;
    final totalAfterDiscount = cart.totalAfterDiscount;
    final vatAmount = cart.vatAmount;
    final total = cart.total;
    final nextDiscountTarget = cart.nextDiscountTarget;

    final screenWidth = MediaQuery.sizeOf(context).width;
    final isTablet = AppBreakpoints.isTablet(context);
    final isDesktopWide = screenWidth >= 1180;
    final useSideSummary = screenWidth >= 960;
    final isLandscapePhone =
        MediaQuery.orientationOf(context) == Orientation.landscape && !isTablet;
    final useWideItemLayout =
        isTablet || isLandscapePhone || screenWidth >= 560;

    final contentMaxWidth = isDesktopWide
        ? 1240.0
        : isTablet
        ? 980.0
        : 760.0;

    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6);
    final safeBottom = MediaQuery.paddingOf(context).bottom;
    final hasBottomCheckoutBar = items.isNotEmpty && !useSideSummary;
    final listBottomPadding = hasBottomCheckoutBar
        ? 92 + safeBottom + (textScale - 1) * 18
        : 24.0;

    final quantityFieldWidth = isDesktopWide
        ? 156.0
        : isTablet
        ? 148.0
        : (isLandscapePhone ? 136.0 : 128.0);

    final nextDiscountRemaining = nextDiscountTarget == null
        ? 0
        : remainingQuantityForBulkDiscountTarget(
            target: nextDiscountTarget,
            items: items,
          );
    final compactCheckoutButtonLabel = isCartSyncing
        ? (isEnglish ? 'Syncing...' : 'Đang đồng bộ...')
        : (isEnglish ? 'Checkout' : 'Thanh toán');

    Future<void> removeItemWithUndo(CartItem item) async {
      HapticFeedback.lightImpact();
      final removedQty = item.quantity;
      final didRemove = await cart.remove(item.product.id);
      if (!context.mounted) {
        return;
      }
      if (!didRemove) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(SnackBar(content: Text(texts.syncCartFailed)));
        return;
      }
      final messenger = ScaffoldMessenger.of(context);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(texts.removedFromCart(item.product.name)),
            action: SnackBarAction(
              label: texts.undoAction,
              onPressed: () {
                unawaited(cart.setQuantity(item.product, removedQty));
              },
            ),
          ),
        );
    }

    Future<bool> confirmSwipeRemoval(CartItem item) async {
      if (isCartSyncing || cart.isSyncingProduct(item.product.id)) {
        return false;
      }
      final result = await showModalBottomSheet<bool>(
        context: context,
        showDragHandle: true,
        useSafeArea: true,
        backgroundColor: colors.surface,
        builder: (sheetContext) {
          final sheetTheme = Theme.of(sheetContext);
          final sheetColors = sheetTheme.colorScheme;
          return Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  texts.swipeDeleteConfirmTitle,
                  style: sheetTheme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  texts.swipeDeleteConfirmMessage(item.product.name),
                  style: sheetTheme.textTheme.bodyMedium?.copyWith(
                    color: sheetColors.onSurfaceVariant,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: sheetColors.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: sheetColors.outlineVariant.withValues(alpha: 0.75),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ProductImage(
                        product: item.product,
                        width: 48,
                        height: 48,
                        borderRadius: BorderRadius.circular(14),
                        iconSize: 18,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.product.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: sheetTheme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              texts.itemCountLabel(item.quantity),
                              style: sheetTheme.textTheme.bodySmall?.copyWith(
                                color: sheetColors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(sheetContext).pop(false),
                        child: Text(texts.keepItemAction),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () => Navigator.of(sheetContext).pop(true),
                        style: FilledButton.styleFrom(
                          backgroundColor: sheetColors.error,
                          foregroundColor: sheetColors.onError,
                        ),
                        icon: const Icon(Icons.delete_outline, size: 18),
                        label: Text(texts.confirmDeleteAction),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      );
      return result ?? false;
    }

    Future<void> goCheckout() async {
      if (!hasAnyOrderableItems || isCartSyncing) {
        return;
      }
      await context.pushDealerCheckout();
    }

    Widget buildSummaryPanel({
      required bool showCheckoutAction,
      required bool showSwipeHint,
      EdgeInsetsGeometry? padding,
    }) {
      return SectionCard(
        title: texts.summaryTitle,
        icon: Icons.payments_outlined,
        padding: padding ?? const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              texts.summarySubtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 16),
            _CartMetricTile(
              icon: Icons.shopping_bag_outlined,
              label: texts.itemCountLabel(cart.totalItems),
              value: formatVnd(cart.subtotal),
            ),
            const SizedBox(height: 12),
            _CartMetricTile(
              icon: Icons.payments_outlined,
              label: texts.totalPaymentLabel,
              value: formatVnd(total),
              emphasize: true,
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                color: colors.primaryContainer.withValues(alpha: 0.32),
                border: Border.all(
                  color: colors.outlineVariant.withValues(alpha: 0.35),
                ),
              ),
              child: Column(
                children: [
                  _SummaryRow(
                    label: texts.subtotalLabel,
                    value: formatVnd(cart.subtotal),
                  ),
                  if (discountAmount > 0) ...[
                    const SizedBox(height: 10),
                    _SummaryRow(
                      label: texts.discountLabel(discountPercent),
                      value: '-${formatVnd(discountAmount)}',
                      valueColor: colors.primary,
                    ),
                    const SizedBox(height: 10),
                    _SummaryRow(
                      label: texts.afterDiscountLabel,
                      value: formatVnd(totalAfterDiscount),
                    ),
                  ],
                  const SizedBox(height: 10),
                  _SummaryRow(
                    label: texts.vatLabel(cart.vatPercent),
                    value: formatVnd(vatAmount),
                  ),
                ],
              ),
            ),
            if (nextDiscountTarget != null && nextDiscountRemaining > 0) ...[
              const SizedBox(height: 14),
              _DiscountHintCard(
                message: texts.buyMoreHint(
                  remainingQuantity: nextDiscountRemaining,
                  targetPercent: nextDiscountTarget.percent,
                ),
              ),
            ],
            const SizedBox(height: 16),
            _StatusNotice(
              icon: hasAnyOrderableItems
                  ? Icons.check_circle_outline
                  : Icons.error_outline,
              message: hasAnyOrderableItems
                  ? texts.readyCheckoutHint
                  : texts.checkoutUnavailableHint,
              color: hasAnyOrderableItems ? colors.primary : colors.error,
            ),
            if (isCartSyncing) ...[
              const SizedBox(height: 10),
              _StatusNotice(
                icon: Icons.sync_outlined,
                message: texts.syncingBeforeCheckoutHint,
                color: colors.primary,
              ),
            ],
            if (showCheckoutAction) ...[
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: hasAnyOrderableItems && !isCartSyncing
                      ? goCheckout
                      : null,
                  icon: isCartSyncing
                      ? SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.2,
                            color: colors.onPrimary,
                          ),
                        )
                      : const Icon(Icons.arrow_forward_outlined),
                  label: Text(
                    isCartSyncing
                        ? texts.syncingCheckoutButton
                        : texts.checkoutButton,
                  ),
                ),
              ),
            ],
            if (showSwipeHint) ...[
              const SizedBox(height: 10),
              Text(
                texts.swipeDeleteHint,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colors.onSurfaceVariant,
                  height: 1.45,
                ),
              ),
            ],
          ],
        ),
      );
    }

    Widget buildOverviewCard({required bool desktop}) {
      if (desktop) {
        return _CartHeroCard(
          title: texts.heroTitle,
          subtitle: texts.heroSubtitle,
          itemCountLabel: texts.itemCountLabel(cart.totalItems),
          subtotalLabel: texts.subtotalLabel,
          subtotalValue: formatVnd(cart.subtotal),
          totalLabel: texts.totalPaymentLabel,
          totalValue: formatVnd(total),
          statusLabel: isCartSyncing
              ? texts.syncingStatusLabel
              : texts.readyStatusLabel,
          isSyncing: isCartSyncing,
        );
      }

      return _CartOverviewCard(
        title: texts.overviewTitle,
        subtitle: texts.overviewSubtitle,
        itemCountLabel: texts.itemCountLabel(cart.totalItems),
        totalLabel: texts.totalPaymentLabel,
        totalValue: formatVnd(total),
        statusLabel: isCartSyncing
            ? texts.syncingStatusLabel
            : texts.readyStatusLabel,
        isSyncing: isCartSyncing,
      );
    }

    Widget buildCartList({required bool desktop}) {
      final children = <Widget>[
        if (desktop) ...[
          FadeSlideIn(child: buildOverviewCard(desktop: true)),
          const SizedBox(height: 16),
        ],
        FadeSlideIn(
          delay: const Duration(milliseconds: 40),
          child: _CartSectionHeader(
            title: texts.itemsSectionTitle,
            subtitle: texts.itemsSectionSubtitle,
          ),
        ),
        const SizedBox(height: 12),
      ];

      for (var index = 0; index < items.length; index++) {
        final item = items[index];
        final isSyncingItem = cart.isSyncingProduct(item.product.id);
        final canIncrease = cart.suggestedAddQuantity(item.product) > 0;
        final shouldAnimate = index < 6;
        children.add(
          FadeSlideIn(
            key: ValueKey(item.product.id),
            animate: shouldAnimate,
            delay: shouldAnimate
                ? Duration(milliseconds: 30 * index)
                : Duration.zero,
            child: RepaintBoundary(
              child: _CartItemCard(
                item: item,
                texts: texts,
                isSyncingItem: isSyncingItem,
                canIncrease: canIncrease,
                quantityFieldWidth: quantityFieldWidth,
                isWide: useWideItemLayout,
                onRemove: () => unawaited(removeItemWithUndo(item)),
                onConfirmDismiss: () => confirmSwipeRemoval(item),
                onQuantityChanged: (value) =>
                    _scheduleQuantitySync(cart, item, value),
              ),
            ),
          ),
        );
        if (index != items.length - 1) {
          children.add(const SizedBox(height: 12));
        }
      }

      return ListView(
        padding: EdgeInsets.fromLTRB(
          desktop ? 20 : 16,
          desktop ? 20 : 16,
          desktop ? 20 : 16,
          desktop ? 24 : listBottomPadding,
        ),
        children: children,
      );
    }

    final mediaQuery = MediaQuery.of(context);
    final screenTextScale = mediaQuery.textScaler.scale(1);
    final safeTextScaler = screenTextScale.isFinite && screenTextScale > 1.1
        ? const TextScaler.linear(1.1)
        : mediaQuery.textScaler;

    return MediaQuery(
      data: mediaQuery.copyWith(textScaler: safeTextScaler),
      child: Scaffold(
        backgroundColor: colors.surface,
        appBar: AppBar(
          leading: const DealerFallbackBackButton(
            fallbackPath: DealerRoutePath.home,
          ),
          toolbarHeight: 64,
          backgroundColor: colors.surfaceContainerLow,
          foregroundColor: colors.onSurface,
          surfaceTintColor: Colors.transparent,
          elevation: 0.6,
          shadowColor: colors.shadow.withValues(alpha: 0.14),
          scrolledUnderElevation: 0,
          shape: Border(
            bottom: BorderSide(
              color: colors.outlineVariant.withValues(alpha: 0.7),
            ),
          ),
          title: BrandAppBarTitle(texts.screenTitle, logoSize: 26, logoGap: 8),
          actions: const [GlobalSearchIconButton()],
        ),
        body: LayoutBuilder(
          builder: (context, constraints) {
            Widget bodyContent;
            if (items.isEmpty) {
              bodyContent = FadeSlideIn(
                child: _EmptyCart(
                  texts: texts,
                  onShop:
                      widget.onShop ??
                      () {
                        context.goToDealerHome();
                      },
                ),
              );
            } else if (useSideSummary) {
              bodyContent = Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(flex: 7, child: buildCartList(desktop: true)),
                  const SizedBox(width: 18),
                  SizedBox(
                    width: isDesktopWide ? 360 : 320,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(0, 20, 20, 24),
                      child: SingleChildScrollView(
                        child: FadeSlideIn(
                          delay: const Duration(milliseconds: 80),
                          child: buildSummaryPanel(
                            showCheckoutAction: true,
                            showSwipeHint: false,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            } else {
              bodyContent = Column(
                children: [
                  Expanded(child: buildCartList(desktop: false)),
                  SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
                      child: FadeSlideIn(
                        delay: const Duration(milliseconds: 60),
                        child: _CartCheckoutBar(
                          totalLabel: texts.totalPaymentLabel,
                          totalValue: formatVnd(total),
                          itemCountLabel: texts.itemCountLabel(cart.totalItems),
                          buttonLabel: compactCheckoutButtonLabel,
                          statusMessage: isCartSyncing
                              ? texts.syncingBeforeCheckoutHint
                              : hasAnyOrderableItems
                              ? texts.readyCheckoutHint
                              : texts.checkoutUnavailableHint,
                          canCheckout: hasAnyOrderableItems && !isCartSyncing,
                          isSyncing: isCartSyncing,
                          onPressed: goCheckout,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }

            return Stack(
              children: [
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          colors.primaryContainer.withValues(alpha: 0.10),
                          colors.surface,
                          colors.surface,
                        ],
                      ),
                    ),
                  ),
                ),
                Align(
                  alignment: Alignment.topCenter,
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: contentMaxWidth),
                    child: SizedBox(
                      height: constraints.maxHeight,
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 220),
                        switchInCurve: Curves.easeOut,
                        switchOutCurve: Curves.easeIn,
                        child: bodyContent,
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
