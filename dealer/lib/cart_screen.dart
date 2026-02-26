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
    final cart = CartScope.of(context);
    final items = cart.items;
    final discountPercent = cart.discountPercent;
    final discountAmount = cart.discountAmount;
    final totalAfterDiscount = cart.totalAfterDiscount;
    final vatAmount = cart.vatAmount;
    final total = cart.total;

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Gio hang')),
      body: AnimatedSwitcher(
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
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
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
                    child: Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                        side: const BorderSide(color: Color(0xFFE5EAF5)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
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
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.product.name,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleSmall
                                        ?.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    formatVnd(item.product.price),
                                    style: Theme.of(context).textTheme.bodySmall
                                        ?.copyWith(color: Colors.black54),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'So luong chon linh hoat',
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelSmall
                                        ?.copyWith(color: Colors.black54),
                                  ),
                                  if (!canIncrease) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      item.product.isOrderable
                                          ? 'Đã đạt tồn kho tối đa'
                                          : 'Sản phẩm tạm ngưng phân phối',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: const Color(0xFFD94939),
                                            fontWeight: FontWeight.w600,
                                          ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            SizedBox(
                              width: 132,
                              child: SpinBox(
                                min: minQty.toDouble(),
                                max: maxQty.toDouble(),
                                value: item.quantity.toDouble(),
                                step: 1,
                                decimals: 0,
                                decoration: const InputDecoration(
                                  isDense: true,
                                  contentPadding:
                                      EdgeInsets.symmetric(vertical: 8),
                                  border: InputBorder.none,
                                ),
                                onChanged: (val) => cart.setQuantity(
                                  item.product,
                                  val.round(),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
      ),
      bottomNavigationBar: items.isEmpty
          ? null
          : SafeArea(
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 18,
                      offset: const Offset(0, -8),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Tạm tính',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        Text(
                          formatVnd(cart.subtotal),
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                    if (discountAmount > 0) ...[
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Giam gia ($discountPercent%)',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          Text(
                            '-${formatVnd(discountAmount)}',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: const Color(0xFF127A34),
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
                            'Sau giam gia',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          Text(
                            formatVnd(totalAfterDiscount),
                            style: Theme.of(context).textTheme.bodyMedium,
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
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        Text(
                          formatVnd(vatAmount),
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Tong thanh toan',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        Text(
                          formatVnd(total),
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                    if (cart.totalItems < 10) ...[
                      const SizedBox(height: 6),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Mua them ${10 - cart.totalItems} san pham de giam 10%.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.black54,
                          ),
                        ),
                      ),
                    ] else if (cart.totalItems < 20) ...[
                      const SizedBox(height: 6),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Mua them ${20 - cart.totalItems} san pham de giam 20%.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.black54,
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
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
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

