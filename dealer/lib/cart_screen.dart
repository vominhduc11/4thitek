import 'package:flutter/material.dart';
import 'package:flutter_spinbox/flutter_spinbox.dart';

import 'cart_controller.dart';
import 'checkout_screen.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/product_image.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key, this.onShop});

  final VoidCallback? onShop;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final cart = CartScope.of(context);
    final items = cart.items;
    final discountPercent = cart.discountPercent;
    final discountAmount = cart.discountAmount;
    final totalAfterDiscount = cart.totalAfterDiscount;
    final vatAmount = cart.vatAmount;
    final total = cart.total;
    final isTablet = MediaQuery.sizeOf(context).shortestSide >= 600;
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.6);
    final listBottomPadding = 120 + (textScale - 1) * 36;

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Giỏ hàng')),
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
                      final minQty = item.product.effectiveMinOrderQty;
                      final maxQty = item.product.stock;
                      return FadeSlideIn(
                        key: ValueKey(item.product.id),
                        delay: Duration(milliseconds: 30 * index),
                        child: Dismissible(
                          key: ValueKey('dismiss-${item.product.id}'),
                          direction: DismissDirection.endToStart,
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
                          onDismissed: (_) => cart.remove(item.product.id),
                          child: Card(
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
                              padding: const EdgeInsets.fromLTRB(16, 12, 4, 12),
                              child: Row(
                                children: [
                                  ProductImage(
                                    product: item.product,
                                    width: 44,
                                    height: 44,
                                    borderRadius: BorderRadius.circular(12),
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
                                          style: theme.textTheme.titleSmall
                                              ?.copyWith(
                                                fontWeight: FontWeight.w700,
                                              ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          formatVnd(item.product.price),
                                          style: theme.textTheme.bodySmall
                                              ?.copyWith(
                                                color: colors.onSurfaceVariant,
                                              ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Tổng dòng: ${formatVnd(item.product.price * item.quantity)}',
                                          style: theme.textTheme.bodySmall
                                              ?.copyWith(
                                                color: colors.primary,
                                                fontWeight: FontWeight.w600,
                                              ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Số lượng chọn linh hoạt',
                                          style: theme.textTheme.labelSmall
                                              ?.copyWith(
                                                color: colors.onSurfaceVariant,
                                              ),
                                        ),
                                        if (!canIncrease) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            item.product.isOrderable
                                                ? 'Đã đạt tồn kho tối đa'
                                                : 'Sản phẩm tạm ngưng phân phối',
                                            style: theme.textTheme.bodySmall
                                                ?.copyWith(
                                                  color: colors.error,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  SizedBox(
                                    width: 120,
                                    child: SpinBox(
                                      min: minQty.toDouble(),
                                      max: maxQty.toDouble(),
                                      value: item.quantity.toDouble(),
                                      step: 1,
                                      decimals: 0,
                                      decoration: const InputDecoration(
                                        isDense: true,
                                        contentPadding: EdgeInsets.symmetric(
                                          vertical: 8,
                                        ),
                                        border: InputBorder.none,
                                      ),
                                      onChanged: (val) => cart.setQuantity(
                                        item.product,
                                        val.round(),
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(
                                      Icons.delete_outline,
                                      size: 20,
                                    ),
                                    color: const Color(0xFFDC2626),
                                    tooltip: 'Xóa khỏi giỏ',
                                    onPressed: () =>
                                        cart.remove(item.product.id),
                                  ),
                                ],
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
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: contentMaxWidth),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Tạm tính', style: theme.textTheme.bodyMedium),
                            Text(
                              formatVnd(cart.subtotal),
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        if (discountAmount > 0) ...[
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Chiết khấu ($discountPercent%)',
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
                              Text(
                                'Sau giảm giá',
                                style: theme.textTheme.bodyMedium,
                              ),
                              Text(
                                formatVnd(totalAfterDiscount),
                                style: theme.textTheme.bodyMedium,
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'VAT (${CartController.vatPercent}%)',
                              style: theme.textTheme.bodyMedium,
                            ),
                            Text(
                              formatVnd(vatAmount),
                              style: theme.textTheme.bodyMedium,
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Tổng thanh toán',
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
                        if (cart.totalItems < 10) ...[
                          const SizedBox(height: 6),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Mua thêm ${10 - cart.totalItems} sản phẩm để giảm 10%.',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colors.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ] else if (cart.totalItems < 20) ...[
                          const SizedBox(height: 6),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Mua thêm ${20 - cart.totalItems} sản phẩm để giảm 20%.',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colors.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ] else
                          const SizedBox(height: 6),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => const CheckoutScreen(),
                                ),
                              );
                            },
                            child: const Text('Thanh toán'),
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
  const _EmptyCart({required this.onShop});

  final VoidCallback onShop;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.shopping_cart_outlined, size: 64),
            const SizedBox(height: 16),
            Text(
              'Giỏ hàng đang trống',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Hãy thêm sản phẩm để bắt đầu đặt hàng.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: onShop,
              child: const Text('Tiếp tục mua hàng'),
            ),
          ],
        ),
      ),
    );
  }
}
