import 'dart:async';

import 'package:flutter/material.dart';
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

class CartScreen extends StatelessWidget {
  const CartScreen({super.key, this.onShop});

  final VoidCallback? onShop;

  @override
  Widget build(BuildContext context) {
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    final texts = _CartTexts(isEnglish: isEnglish);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final cart = CartScope.of(context);
    final items = cart.items;
    final hasAnyOrderableItems = items.any((item) => item.product.stock > 0);
    final discountPercent = cart.discountPercent;
    final discountAmount = cart.discountAmount;
    final totalAfterDiscount = cart.totalAfterDiscount;
    final vatAmount = cart.vatAmount;
    final total = cart.total;
    final isTablet = AppBreakpoints.isTablet(context);
    final isLandscapePhone =
        MediaQuery.orientationOf(context) == Orientation.landscape && !isTablet;
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6);
    final safeBottom = MediaQuery.paddingOf(context).bottom;
    final listBottomPadding = 104 + safeBottom + (textScale - 1) * 24;
    final quantityFieldWidth = isTablet
        ? 148.0
        : (isLandscapePhone ? 136.0 : 128.0);

    Future<void> removeItemWithUndo(CartItem item) async {
      final removedQty = item.quantity;
      final didRemove = await cart.remove(item.product.id);
      if (!context.mounted) {
        return;
      }
      if (!didRemove) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(texts.syncCartFailed)),
        );
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

    Future<bool?> confirmDismiss(CartItem item) {
      return showDialog<bool>(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            title: Text(texts.deleteConfirmTitle),
            content: Text(texts.deleteConfirmMessage(item.product.name)),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: Text(texts.cancelAction),
              ),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: colors.error,
                  foregroundColor: colors.onError,
                ),
                onPressed: () => Navigator.of(dialogContext).pop(true),
                child: Text(texts.deleteAction),
              ),
            ],
          );
        },
      );
    }

    List<Widget> buildSummaryBreakdown() {
      final rows = <Widget>[
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(texts.subtotalLabel, style: theme.textTheme.bodyMedium),
            Text(
              formatVnd(cart.subtotal),
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ];

      if (discountAmount > 0) {
        rows.addAll([
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                texts.discountLabel(discountPercent),
                style: theme.textTheme.bodyMedium,
              ),
              Text(
                '-${formatVnd(discountAmount)}',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(texts.afterDiscountLabel, style: theme.textTheme.bodyMedium),
              Text(
                formatVnd(totalAfterDiscount),
                style: theme.textTheme.bodyMedium,
              ),
            ],
          ),
        ]);
      }

      rows.addAll([
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              texts.vatLabel(CartController.vatPercent),
              style: theme.textTheme.bodyMedium,
            ),
            Text(formatVnd(vatAmount), style: theme.textTheme.bodyMedium),
          ],
        ),
      ]);

      if (cart.totalItems < 10) {
        rows.addAll([
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              texts.buyMoreHint(target: 10, current: cart.totalItems),
              style: theme.textTheme.bodySmall?.copyWith(
                color: colors.onSurfaceVariant,
              ),
            ),
          ),
        ]);
      } else if (cart.totalItems < 20) {
        rows.addAll([
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              texts.buyMoreHint(target: 20, current: cart.totalItems),
              style: theme.textTheme.bodySmall?.copyWith(
                color: colors.onSurfaceVariant,
              ),
            ),
          ),
        ]);
      }

      return rows;
    }

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(texts.screenTitle),
        actions: const [GlobalSearchIconButton()],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            switchInCurve: Curves.easeOut,
            switchOutCurve: Curves.easeIn,
            child: items.isEmpty
                ? FadeSlideIn(
                    key: const ValueKey('empty-cart'),
                    child: _EmptyCart(
                      texts: texts,
                      onShop:
                          onShop ??
                          () {
                            Navigator.of(
                              context,
                            ).popUntil((route) => route.isFirst);
                          },
                    ),
                  )
                : ListView.separated(
                    key: const ValueKey('cart-list'),
                    padding: EdgeInsets.fromLTRB(20, 16, 20, listBottomPadding),
                    itemCount: items.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = items[index];
                      final canIncrease =
                          cart.suggestedAddQuantity(item.product) > 0;
                      const minQty = 1;
                      final maxQty = item.product.stock;
                      final isWide = isTablet || isLandscapePhone;
                      final quantitySpinBox = SizedBox(
                        width: quantityFieldWidth,
                        child: SpinBox(
                          min: minQty.toDouble(),
                          max: maxQty.toDouble(),
                          value: item.quantity.toDouble(),
                          step: 1,
                          decimals: 0,
                          decoration: InputDecoration(
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 8,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide(
                                color: colors.outlineVariant,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                              borderSide: BorderSide(
                                color: colors.primary,
                                width: 1.5,
                              ),
                            ),
                          ),
                          onChanged: (val) => unawaited(
                            cart.setQuantity(item.product, val.round()),
                          ),
                        ),
                      );
                      final deleteButton = IconButton(
                        icon: const Icon(
                          Icons.delete_outline,
                          size: 20,
                        ),
                        color: const Color(0xFFDC2626),
                        tooltip: texts.deleteTooltip,
                        onPressed: () => unawaited(removeItemWithUndo(item)),
                      );
                      final stockWarning = !canIncrease
                          ? <Widget>[
                              const SizedBox(height: 4),
                              Text(
                                texts.maxStockReached,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colors.error,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ]
                          : <Widget>[];
                      return FadeSlideIn(
                        key: ValueKey(item.product.id),
                        delay: Duration(milliseconds: 30 * index),
                        child: Semantics(
                          container: true,
                          label: texts.cartItemSemantics(item.product.name),
                          hint: texts.cartItemHint,
                          child: Dismissible(
                            key: ValueKey('dismiss-${item.product.id}'),
                            direction: DismissDirection.endToStart,
                            confirmDismiss: (_) => confirmDismiss(item),
                            background: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDC2626),
                                borderRadius: BorderRadius.circular(18),
                              ),
                              child: const Icon(
                                Icons.delete_outline,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            onDismissed: (_) =>
                                unawaited(removeItemWithUndo(item)),
                            child: Card(
                              margin: EdgeInsets.zero,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                                side: BorderSide(
                                  color: colors.outlineVariant.withValues(
                                    alpha: 0.6,
                                  ),
                                ),
                              ),
                              child: Padding(
                                padding: EdgeInsets.fromLTRB(
                                  isWide ? 16 : 12,
                                  12,
                                  4,
                                  12,
                                ),
                                child: isWide
                                    // ── Wide layout (tablet / landscape) ──
                                    ? Row(
                                        children: [
                                          ProductImage(
                                            product: item.product,
                                            width: 44,
                                            height: 44,
                                            borderRadius:
                                                BorderRadius.circular(12),
                                            iconSize: 20,
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  item.product.name,
                                                  style: theme
                                                      .textTheme.titleSmall
                                                      ?.copyWith(
                                                    fontWeight:
                                                        FontWeight.w700,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  formatVnd(
                                                    item.product.price,
                                                  ),
                                                  style: theme
                                                      .textTheme.bodySmall
                                                      ?.copyWith(
                                                    color: colors
                                                        .onSurfaceVariant,
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  texts.lineTotalLabel(
                                                    formatVnd(
                                                      item.product.price *
                                                          item.quantity,
                                                    ),
                                                  ),
                                                  style: theme
                                                      .textTheme.bodySmall
                                                      ?.copyWith(
                                                    color: colors.primary,
                                                    fontWeight:
                                                        FontWeight.w600,
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  texts.skuLabel(
                                                    item.product.sku,
                                                  ),
                                                  style: theme
                                                      .textTheme.labelSmall
                                                      ?.copyWith(
                                                    color: colors
                                                        .onSurfaceVariant,
                                                  ),
                                                ),
                                                ...stockWarning,
                                              ],
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          quantitySpinBox,
                                          deleteButton,
                                        ],
                                      )
                                    // ── Compact layout (phone portrait) ──
                                    : Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              ProductImage(
                                                product: item.product,
                                                width: 56,
                                                height: 56,
                                                borderRadius:
                                                    BorderRadius.circular(14),
                                                iconSize: 22,
                                              ),
                                              const SizedBox(width: 12),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment
                                                          .start,
                                                  children: [
                                                    Text(
                                                      item.product.name,
                                                      style: theme.textTheme
                                                          .titleSmall
                                                          ?.copyWith(
                                                        fontWeight:
                                                            FontWeight.w700,
                                                      ),
                                                      maxLines: 2,
                                                      overflow: TextOverflow
                                                          .ellipsis,
                                                    ),
                                                    const SizedBox(height: 4),
                                                    Text(
                                                      formatVnd(
                                                        item.product.price,
                                                      ),
                                                      style: theme.textTheme
                                                          .bodySmall
                                                          ?.copyWith(
                                                        color: colors
                                                            .onSurfaceVariant,
                                                      ),
                                                    ),
                                                    const SizedBox(height: 2),
                                                    Text(
                                                      texts.skuLabel(
                                                        item.product.sku,
                                                      ),
                                                      style: theme.textTheme
                                                          .labelSmall
                                                          ?.copyWith(
                                                        color: colors
                                                            .onSurfaceVariant,
                                                      ),
                                                    ),
                                                    ...stockWarning,
                                                  ],
                                                ),
                                              ),
                                              deleteButton,
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          Padding(
                                            padding: const EdgeInsets.only(
                                              left: 68,
                                            ),
                                            child: Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    texts.lineTotalLabel(
                                                      formatVnd(
                                                        item.product.price *
                                                            item.quantity,
                                                      ),
                                                    ),
                                                    style: theme
                                                        .textTheme.bodySmall
                                                        ?.copyWith(
                                                      color: colors.primary,
                                                      fontWeight:
                                                          FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                                quantitySpinBox,
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ),
      ),
      bottomNavigationBar: items.isEmpty
          ? null
          : SafeArea(
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                decoration: BoxDecoration(
                  color: colors.surface,
                  boxShadow: [
                    BoxShadow(
                      color: theme.shadowColor.withValues(alpha: 0.08),
                      blurRadius: 18,
                      offset: const Offset(0, -8),
                    ),
                  ],
                ),
                child: Center(
                  heightFactor: 1.0,
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: contentMaxWidth),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isLandscapePhone)
                          Theme(
                            data: theme.copyWith(
                              dividerColor: Colors.transparent,
                            ),
                            child: ExpansionTile(
                              tilePadding: EdgeInsets.zero,
                              childrenPadding: const EdgeInsets.only(top: 6),
                              initiallyExpanded: false,
                              title: Text(
                                texts.paymentDetailsTitle,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              subtitle: Text(
                                texts.itemCountLabel(cart.totalItems),
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colors.onSurfaceVariant,
                                ),
                              ),
                              children: buildSummaryBreakdown(),
                            ),
                          )
                        else
                          ...buildSummaryBreakdown(),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              texts.totalPaymentLabel,
                              style: theme.textTheme.titleSmall,
                            ),
                            Text(
                              formatVnd(total),
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        if (!hasAnyOrderableItems)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: Text(
                                texts.checkoutUnavailableHint,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colors.error,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: hasAnyOrderableItems
                                ? () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            const CheckoutScreen(),
                                      ),
                                    );
                                  }
                                : null,
                            child: Text(texts.checkoutButton),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}

class _EmptyCart extends StatelessWidget {
  const _EmptyCart({required this.onShop, required this.texts});

  final VoidCallback onShop;
  final _CartTexts texts;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.shopping_cart_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              texts.emptyTitle,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              texts.emptySubtitle,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: onShop,
              child: Text(texts.continueShoppingButton),
            ),
          ],
        ),
      ),
    );
  }
}

class _CartTexts {
  const _CartTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Cart' : 'Giỏ hàng';
  String get subtotalLabel => isEnglish ? 'Subtotal' : 'Tạm tính';
  String discountLabel(int percent) =>
      isEnglish ? 'Discount ($percent%)' : 'Chiết khấu ($percent%)';
  String get afterDiscountLabel =>
      isEnglish ? 'After discount' : 'Sau giảm giá';
  String vatLabel(int percent) => 'VAT ($percent%)';
  String get paymentDetailsTitle =>
      isEnglish ? 'Payment details' : 'Chi tiết thanh toán';
  String itemCountLabel(int count) =>
      isEnglish ? '$count items' : '$count sản phẩm';
  String get totalPaymentLabel =>
      isEnglish ? 'Total payment' : 'Tổng thanh toán';
  String get checkoutButton => isEnglish ? 'Checkout' : 'Thanh toán';
  String get checkoutUnavailableHint => isEnglish
      ? 'No available products for checkout.'
      : 'Không có sản phẩm khả dụng để thanh toán.';

  String removedFromCart(String productName) => isEnglish
      ? 'Removed $productName from cart'
      : 'Đã xóa $productName khỏi giỏ';
  String get syncCartFailed => isEnglish
      ? 'Could not sync cart. Please try again.'
      : 'Không thể đồng bộ giỏ hàng. Vui lòng thử lại.';
  String get undoAction => isEnglish ? 'Undo' : 'Hoàn tác';
  String get deleteAction => isEnglish ? 'Delete' : 'Xóa';
  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get deleteTooltip => isEnglish ? 'Remove from cart' : 'Xóa khỏi giỏ';
  String get deleteConfirmTitle =>
      isEnglish ? 'Confirm removal' : 'Xác nhận xóa';
  String deleteConfirmMessage(String productName) => isEnglish
      ? 'Remove $productName from your cart?'
      : 'Xóa $productName khỏi giỏ hàng?';

  String cartItemSemantics(String productName) =>
      isEnglish ? 'Cart item $productName' : 'Mục giỏ hàng $productName';
  String get cartItemHint => isEnglish
      ? 'Swipe left to remove and undo if needed'
      : 'Vuốt sang trái để xóa và có thể hoàn tác';

  String lineTotalLabel(String amount) =>
      isEnglish ? 'Line total: $amount' : 'Tổng dòng: $amount';
  String skuLabel(String sku) => 'SKU: $sku';
  String get maxStockReached =>
      isEnglish ? 'Reached maximum stock' : 'Đã đạt tồn kho tối đa';
  String get discontinuedProduct => isEnglish
      ? 'Product is temporarily unavailable'
      : 'Sản phẩm tạm ngưng phân phối';

  String buyMoreHint({required int target, required int current}) {
    final remaining = target - current;
    if (isEnglish) {
      return 'Buy $remaining more products to get $target% off.';
    }
    return 'Mua thêm $remaining sản phẩm để giảm $target%.';
  }

  String get emptyTitle =>
      isEnglish ? 'Your cart is empty' : 'Giỏ hàng đang trống';
  String get emptySubtitle => isEnglish
      ? 'Add products to start placing your order.'
      : 'Hãy thêm sản phẩm để bắt đầu đặt hàng.';
  String get continueShoppingButton =>
      isEnglish ? 'Continue shopping' : 'Tiếp tục mua hàng';
}
