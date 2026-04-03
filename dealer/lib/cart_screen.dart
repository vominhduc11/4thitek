import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_spinbox/flutter_spinbox.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'checkout_screen.dart';
import 'global_search.dart';
import 'models.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/product_image.dart';
import 'widgets/section_card.dart';
import 'widgets/stock_badge.dart';

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
    final navigator = Navigator.of(context);
    final canPop = navigator.canPop();
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
    final nextDiscountProductName = nextDiscountTarget?.productId == null
        ? null
        : _productNameForDiscountTarget(items, nextDiscountTarget!);
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

    Future<void> goCheckout() async {
      if (!hasAnyOrderableItems || isCartSyncing) {
        return;
      }
      await Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (context) => const CheckoutScreen()));
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
                  productName: nextDiscountProductName,
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
        FadeSlideIn(child: buildOverviewCard(desktop: desktop)),
        const SizedBox(height: 16),
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

      if (!desktop) {
        children.addAll([
          const SizedBox(height: 18),
          FadeSlideIn(
            delay: const Duration(milliseconds: 80),
            child: buildSummaryPanel(
              showCheckoutAction: false,
              showSwipeHint: true,
            ),
          ),
        ]);
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

    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        automaticallyImplyLeading: canPop,
        leading: canPop
            ? BackButton(onPressed: () => navigator.maybePop())
            : null,
        leadingWidth: canPop ? 56 : null,
        titleSpacing: canPop ? 0 : null,
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
                      Navigator.of(context).popUntil((route) => route.isFirst);
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
    );
  }
}

class _CartHeroCard extends StatelessWidget {
  const _CartHeroCard({
    required this.title,
    required this.subtitle,
    required this.itemCountLabel,
    required this.subtotalLabel,
    required this.subtotalValue,
    required this.totalLabel,
    required this.totalValue,
    required this.statusLabel,
    required this.isSyncing,
  });

  final String title;
  final String subtitle;
  final String itemCountLabel;
  final String subtotalLabel;
  final String subtotalValue;
  final String totalLabel;
  final String totalValue;
  final String statusLabel;
  final bool isSyncing;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colors.primaryContainer.withValues(alpha: 0.96),
            colors.secondaryContainer.withValues(alpha: 0.88),
          ],
        ),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.35),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 620;
                final iconShell = Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: colors.surface.withValues(alpha: 0.72),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Icon(
                    Icons.shopping_cart_outlined,
                    color: colors.onSurface,
                    size: 28,
                  ),
                );

                final titleBlock = Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: colors.onPrimaryContainer,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      subtitle,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colors.onPrimaryContainer.withValues(
                          alpha: 0.84,
                        ),
                        height: 1.45,
                      ),
                    ),
                  ],
                );

                final statusPill = _CartStatusPill(
                  label: statusLabel,
                  isActive: isSyncing,
                  icon: isSyncing
                      ? Icons.sync_outlined
                      : Icons.check_circle_outline,
                );

                if (compact) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          iconShell,
                          const SizedBox(width: 12),
                          Expanded(child: statusPill),
                        ],
                      ),
                      const SizedBox(height: 16),
                      titleBlock,
                    ],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    iconShell,
                    const SizedBox(width: 16),
                    Expanded(child: titleBlock),
                    const SizedBox(width: 12),
                    statusPill,
                  ],
                );
              },
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _HeroMetricChip(
                  icon: Icons.inventory_2_outlined,
                  label: itemCountLabel,
                ),
                _HeroMetricChip(
                  icon: Icons.calculate_outlined,
                  label: '$subtotalLabel: $subtotalValue',
                ),
                _HeroMetricChip(
                  icon: Icons.payments_outlined,
                  label: '$totalLabel: $totalValue',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CartOverviewCard extends StatelessWidget {
  const _CartOverviewCard({
    required this.title,
    required this.subtitle,
    required this.itemCountLabel,
    required this.totalLabel,
    required this.totalValue,
    required this.statusLabel,
    required this.isSyncing,
  });

  final String title;
  final String subtitle;
  final String itemCountLabel;
  final String totalLabel;
  final String totalValue;
  final String statusLabel;
  final bool isSyncing;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return SectionCard(
      title: title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _HeroMetricChip(
                icon: Icons.inventory_2_outlined,
                label: itemCountLabel,
              ),
              _HeroMetricChip(
                icon: Icons.payments_outlined,
                label: '$totalLabel: $totalValue',
              ),
              _CartStatusPill(
                label: statusLabel,
                isActive: isSyncing,
                icon: isSyncing
                    ? Icons.sync_outlined
                    : Icons.check_circle_outline,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CartSectionHeader extends StatelessWidget {
  const _CartSectionHeader({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: textTheme.bodySmall?.copyWith(
                  color: colors.onSurfaceVariant,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CartCheckoutBar extends StatelessWidget {
  const _CartCheckoutBar({
    required this.totalLabel,
    required this.totalValue,
    required this.itemCountLabel,
    required this.buttonLabel,
    required this.statusMessage,
    required this.canCheckout,
    required this.isSyncing,
    required this.onPressed,
  });

  final String totalLabel;
  final String totalValue;
  final String itemCountLabel;
  final String buttonLabel;
  final String statusMessage;
  final bool canCheckout;
  final bool isSyncing;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return LayoutBuilder(
      builder: (context, constraints) {
        final stacked = constraints.maxWidth < 380;
        final statusColor = canCheckout ? colors.primary : colors.error;
        final summaryBlock = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    totalValue,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.2,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Flexible(
                  child: Text(
                    itemCountLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: statusColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    statusMessage,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.bodySmall?.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ],
        );

        final actionButton = SizedBox(
          width: stacked ? double.infinity : null,
          child: FilledButton.icon(
            onPressed: canCheckout ? onPressed : null,
            style: FilledButton.styleFrom(
              minimumSize: const Size(0, 48),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            icon: isSyncing
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                      color: colors.onPrimary,
                    ),
                  )
                : const Icon(Icons.arrow_forward_outlined),
            label: Text(buttonLabel),
          ),
        );

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: colors.surface.withValues(alpha: 0.94),
            border: Border.all(
              color: colors.outlineVariant.withValues(alpha: 0.7),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                totalLabel,
                style: textTheme.labelMedium?.copyWith(
                  color: colors.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              if (stacked) ...[
                summaryBlock,
                const SizedBox(height: 10),
                actionButton,
              ] else ...[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(child: summaryBlock),
                    const SizedBox(width: 12),
                    actionButton,
                  ],
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _HeroMetricChip extends StatelessWidget {
  const _HeroMetricChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: colors.onSurfaceVariant),
          const SizedBox(width: 8),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 220),
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _CartStatusPill extends StatelessWidget {
  const _CartStatusPill({
    required this.label,
    required this.isActive,
    required this.icon,
  });

  final String label;
  final bool isActive;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final background = isActive
        ? colors.primary.withValues(alpha: 0.14)
        : colors.surface.withValues(alpha: 0.72);
    final foreground = isActive ? colors.primary : colors.onSurfaceVariant;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: isActive
              ? colors.primary.withValues(alpha: 0.24)
              : colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: foreground),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: foreground,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  const _CartItemCard({
    required this.item,
    required this.texts,
    required this.isSyncingItem,
    required this.canIncrease,
    required this.quantityFieldWidth,
    required this.isWide,
    required this.onRemove,
    required this.onQuantityChanged,
  });

  final CartItem item;
  final _CartTexts texts;
  final bool isSyncingItem;
  final bool canIncrease;
  final double quantityFieldWidth;
  final bool isWide;
  final VoidCallback onRemove;
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
        background: Container(
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 20),
          decoration: BoxDecoration(
            color: colors.error,
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Icon(
            Icons.delete_outline,
            color: Colors.white,
            size: 24,
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

class _CartMetricTile extends StatelessWidget {
  const _CartMetricTile({
    required this.icon,
    required this.label,
    required this.value,
    this.emphasize = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final valueColor = emphasize ? colors.primary : colors.onSurface;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: colors.primaryContainer.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: colors.onPrimaryContainer, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: colors.onSurfaceVariant),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: valueColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final color = valueColor ?? Theme.of(context).colorScheme.onSurface;

    return Row(
      children: [
        Expanded(
          child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
        ),
        const SizedBox(width: 12),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: color,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _DiscountHintCard extends StatelessWidget {
  const _DiscountHintCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: colors.secondaryContainer.withValues(alpha: 0.40),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.local_offer_outlined,
            color: colors.onSecondaryContainer,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colors.onSecondaryContainer,
                height: 1.45,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusNotice extends StatelessWidget {
  const _StatusNotice({
    required this.icon,
    required this.message,
    required this.color,
  });

  final IconData icon;
  final String message;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            message,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class _EmptyCart extends StatelessWidget {
  const _EmptyCart({required this.onShop, required this.texts});

  final VoidCallback onShop;
  final _CartTexts texts;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Container(
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  colors.primaryContainer.withValues(alpha: 0.96),
                  colors.secondaryContainer.withValues(alpha: 0.88),
                ],
              ),
              border: Border.all(
                color: colors.outlineVariant.withValues(alpha: 0.35),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 84,
                  height: 84,
                  decoration: BoxDecoration(
                    color: colors.surface.withValues(alpha: 0.72),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Icon(
                    Icons.shopping_cart_outlined,
                    size: 42,
                    color: colors.onSurface,
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  texts.emptyTitle,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: colors.onPrimaryContainer,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                Text(
                  texts.emptySubtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colors.onPrimaryContainer.withValues(alpha: 0.84),
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 22),
                FilledButton.icon(
                  onPressed: onShop,
                  icon: const Icon(Icons.storefront_outlined),
                  label: Text(texts.continueShoppingButton),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CartTexts {
  const _CartTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Cart' : 'Giỏ hàng';

  String get heroTitle => isEnglish ? 'Review your cart' : 'Kiểm tra giỏ hàng';

  String get heroSubtitle => isEnglish
      ? 'Adjust quantities, review discounts and continue to checkout when everything looks right.'
      : 'Điều chỉnh số lượng, xem chiết khấu và tiếp tục thanh toán khi mọi thứ đã sẵn sàng.';

  String get overviewTitle =>
      isEnglish ? 'Cart overview' : 'Tổng quan giỏ hàng';

  String get overviewSubtitle => isEnglish
      ? 'Review the order quickly, then continue checking line items below.'
      : 'Xem nhanh tổng quan đơn hàng, sau đó rà soát từng sản phẩm ở phía dưới.';

  String get itemsSectionTitle =>
      isEnglish ? 'Items in cart' : 'Sản phẩm trong giỏ';

  String get itemsSectionSubtitle => isEnglish
      ? 'Update quantities or remove any item before proceeding.'
      : 'Điều chỉnh số lượng hoặc xóa sản phẩm trước khi tiếp tục thanh toán.';

  String get subtotalLabel => isEnglish ? 'Subtotal' : 'Tạm tính';

  String discountLabel(int percent) =>
      isEnglish ? 'Discount ($percent%)' : 'Chiết khấu ($percent%)';

  String get afterDiscountLabel =>
      isEnglish ? 'After discount' : 'Sau giảm giá';

  String vatLabel(int percent) => 'VAT ($percent%)';

  String get totalPaymentLabel =>
      isEnglish ? 'Total payment' : 'Tổng thanh toán';

  String get summaryTitle => isEnglish ? 'Order summary' : 'Tóm tắt đơn hàng';

  String get summarySubtitle => isEnglish
      ? 'Review pricing and checkout availability before placing the order.'
      : 'Kiểm tra giá trị đơn hàng và khả năng thanh toán trước khi đặt hàng.';

  String itemCountLabel(int count) =>
      isEnglish ? '$count items' : '$count sản phẩm';

  String get checkoutButton =>
      isEnglish ? 'Proceed to checkout' : 'Tiếp tục thanh toán';

  String get syncingCheckoutButton =>
      isEnglish ? 'Syncing cart...' : 'Đang đồng bộ giỏ hàng...';

  String get readyCheckoutHint => isEnglish
      ? 'Cart is ready for checkout.'
      : 'Giỏ hàng đã sẵn sàng để thanh toán.';

  String get checkoutUnavailableHint => isEnglish
      ? 'No available products for checkout.'
      : 'Không có sản phẩm khả dụng để thanh toán.';

  String get syncingBeforeCheckoutHint => isEnglish
      ? 'Wait for cart sync to finish before checkout.'
      : 'Vui lòng chờ đồng bộ giỏ hàng hoàn tất trước khi thanh toán.';

  String get swipeDeleteHint => isEnglish
      ? 'You can also swipe an item left to remove it.'
      : 'Bạn cũng có thể vuốt sang trái để xóa sản phẩm.';

  String removedFromCart(String productName) => isEnglish
      ? 'Removed $productName from cart'
      : 'Đã xóa $productName khỏi giỏ';

  String get syncCartFailed => isEnglish
      ? 'Could not sync cart. Please try again.'
      : 'Không thể đồng bộ giỏ hàng. Vui lòng thử lại.';

  String get undoAction => isEnglish ? 'Undo' : 'Hoàn tác';

  String get deleteTooltip => isEnglish ? 'Remove from cart' : 'Xóa khỏi giỏ';

  String cartItemSemantics(String productName) =>
      isEnglish ? 'Cart item $productName' : 'Mục giỏ hàng $productName';

  String get cartItemHint =>
      isEnglish ? 'Swipe left to remove' : 'Vuốt sang trái để xóa';

  String lineTotalLabel(String amount) =>
      isEnglish ? 'Line total: $amount' : 'Tổng dòng: $amount';

  String skuLabel(String sku) => 'SKU: $sku';

  String get maxStockReached =>
      isEnglish ? 'Reached maximum stock' : 'Đã đạt tồn kho tối đa';

  String get syncingItemHint =>
      isEnglish ? 'Syncing quantity...' : 'Đang đồng bộ số lượng...';

  String get discontinuedProduct => isEnglish
      ? 'Product is temporarily unavailable'
      : 'Sản phẩm tạm ngưng phân phối';

  String get readyStatusLabel =>
      isEnglish ? 'Ready to review' : 'Sẵn sàng kiểm tra';

  String get syncingStatusLabel =>
      isEnglish ? 'Cart syncing' : 'Đang đồng bộ giỏ hàng';

  String buyMoreHint({
    required int remainingQuantity,
    required int targetPercent,
    String? productName,
  }) {
    if (isEnglish) {
      if (productName != null && productName.trim().isNotEmpty) {
        return 'Buy $remainingQuantity more of "$productName" to get $targetPercent% off.';
      }
      return 'Buy $remainingQuantity more products to get $targetPercent% off.';
    }
    if (productName != null && productName.trim().isNotEmpty) {
      return 'Mua thêm $remainingQuantity sản phẩm "$productName" để giảm $targetPercent%.';
    }
    return 'Mua thêm $remainingQuantity sản phẩm để giảm $targetPercent%.';
  }

  String get emptyTitle =>
      isEnglish ? 'Your cart is empty' : 'Giỏ hàng đang trống';

  String get emptySubtitle => isEnglish
      ? 'Add products to start placing your order.'
      : 'Hãy thêm sản phẩm để bắt đầu đặt hàng.';

  String get continueShoppingButton =>
      isEnglish ? 'Continue shopping' : 'Tiếp tục mua hàng';
}

String? _productNameForDiscountTarget(
  List<CartItem> items,
  BulkDiscountTarget target,
) {
  final productId = target.productId;
  if (productId == null) {
    return null;
  }
  for (final item in items) {
    if (item.product.id == productId) {
      return item.product.name;
    }
  }
  return null;
}
