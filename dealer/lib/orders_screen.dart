import 'package:flutter/material.dart';

import 'cart_controller.dart';
import 'models.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'notifications_screen.dart';
import 'product_list_screen.dart';
import 'utils.dart';
import 'warranty_activation_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final orders = OrderScope.of(context).orders;
    final cart = CartScope.of(context);
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Đơn hàng'),
        actions: [
          IconButton(
            tooltip: 'Thông báo',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      body: orders.isEmpty
          ? const FadeSlideIn(child: _EmptyOrders())
          : ListView.separated(
              padding: EdgeInsets.fromLTRB(20, 16, 20, isMobile ? 104 : 24),
              itemCount: orders.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final order = orders[index];
                final canProcessSerial = order.status == OrderStatus.completed;
                return FadeSlideIn(
                  key: ValueKey(order.id),
                  delay: Duration(milliseconds: 40 * index),
                  child: Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                      side: const BorderSide(color: Color(0xFFE5EAF5)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Ma don: ${order.id}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleSmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.w700,
                                          ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Dat luc ${formatDateTime(order.createdAt)}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(color: Colors.black54),
                                    ),
                                  ],
                                ),
                              ),
                              _StatusChip(status: order.status),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            '${order.totalItems} san pham · ${formatVnd(order.total)}',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(color: Colors.black54),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Thanh toan: ${order.paymentMethod.label}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Trang thai TT: ${order.paymentStatus.label}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Con no: ${formatVnd(order.outstandingAmount)}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              OutlinedButton(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          OrderDetailScreen(orderId: order.id),
                                    ),
                                  );
                                },
                                child: const Text('Xem chi tiet'),
                              ),
                              OutlinedButton(
                                onPressed: () {
                                  _reorder(context, cart, order);
                                },
                                child: const Text('Dat lai don cu'),
                              ),
                              ElevatedButton(
                                onPressed: canProcessSerial
                                    ? () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                WarrantyActivationScreen(
                                                  orderId: order.id,
                                                ),
                                          ),
                                        );
                                      }
                                    : null,
                                child: const Text('Xu ly serial'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: isMobile
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const ProductListScreen()),
                );
              },
              icon: const Icon(Icons.add_shopping_cart_outlined),
              label: const Text('Đơn nhập'),
            )
          : null,
    );
  }

  void _reorder(BuildContext context, CartController cart, Order order) {
    var lineAdded = 0;
    var unitsAdded = 0;

    for (final item in order.items) {
      final remaining = cart.remainingStockFor(item.product);
      if (remaining <= 0) {
        continue;
      }
      final qtyToAdd = item.quantity > remaining ? remaining : item.quantity;
      if (qtyToAdd <= 0) {
        continue;
      }
      final didAdd = cart.add(item.product, quantity: qtyToAdd);
      if (!didAdd) {
        continue;
      }
      lineAdded += 1;
      unitsAdded += qtyToAdd;
    }

    final messenger = ScaffoldMessenger.of(context);
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(
            lineAdded > 0
                ? 'Da them lai $lineAdded san pham (tong $unitsAdded) vao gio.'
                : 'Khong con ton kho de dat lai don nay.',
          ),
        ),
      );
  }
}

class _EmptyOrders extends StatelessWidget {
  const _EmptyOrders();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.receipt_long_outlined, size: 64),
            const SizedBox(height: 16),
            Text(
              'Chua co don hang',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Hay dat hang de xem lich su don hang cua ban.',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final OrderStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: _backgroundForStatus(status),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: _textForStatus(status),
        ),
      ),
    );
  }
}

Color _backgroundForStatus(OrderStatus status) {
  switch (status) {
    case OrderStatus.pendingApproval:
      return const Color(0xFFFFF6DB);
    case OrderStatus.approved:
      return const Color(0xFFEAF2FF);
    case OrderStatus.shipping:
      return const Color(0xFFE0F2FE);
    case OrderStatus.completed:
      return const Color(0xFFE8F8EF);
  }
}

Color _textForStatus(OrderStatus status) {
  switch (status) {
    case OrderStatus.pendingApproval:
      return const Color(0xFF8A5A00);
    case OrderStatus.approved:
      return const Color(0xFF1A4FA3);
    case OrderStatus.shipping:
      return const Color(0xFF0C4A6E);
    case OrderStatus.completed:
      return const Color(0xFF1D7A3A);
  }
}
