import 'package:flutter/material.dart';

import 'cart_controller.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'notifications_screen.dart';
import 'widgets/notification_icon_button.dart';
import 'product_list_screen.dart';
import 'utils.dart';
import 'warranty_activation_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  String _searchQuery = '';
  OrderStatus? _selectedStatus; // null = all

  List<Order> _filterOrders(List<Order> orders) {
    var result = orders;
    if (_selectedStatus != null) {
      result = result.where((o) => o.status == _selectedStatus).toList();
    }
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      result = result.where((o) => o.id.toLowerCase().contains(q)).toList();
    }
    return result;
  }

  void _confirmCancel(BuildContext context, Order order) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Xác nhận hủy đơn'),
          content: Text('Bạn có chắc muốn hủy đơn hàng ${order.id}?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Không'),
            ),
            TextButton(
              style: TextButton.styleFrom(
                foregroundColor: Theme.of(context).colorScheme.error,
              ),
              onPressed: () {
                Navigator.of(dialogContext).pop();
                OrderScope.of(
                  context,
                ).updateOrderStatus(order.id, OrderStatus.cancelled);
              },
              child: const Text('Hủy đơn'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final orderController = OrderScope.of(context);
    final allOrders = orderController.orders;
    final filteredOrders = _filterOrders(allOrders);
    final cart = CartScope.of(context);
    final isMobile = MediaQuery.of(context).size.width < 600;

    final statusFilters = <OrderStatus?>[
      null,
      OrderStatus.pendingApproval,
      OrderStatus.approved,
      OrderStatus.shipping,
      OrderStatus.completed,
      OrderStatus.cancelled,
    ];

    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Đơn hàng'),
        actions: [
          NotificationIconButton(
            count: NotificationScope.of(context).unreadCount,
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Tìm theo mã đơn hàng...',
                prefixIcon: Icon(Icons.search_outlined),
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
              onChanged: (value) => setState(() => _searchQuery = value),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: statusFilters.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final status = statusFilters[index];
                final label = status == null ? 'Tất cả' : status.label;
                final isSelected = _selectedStatus == status;
                return FilterChip(
                  label: Text(label),
                  selected: isSelected,
                  onSelected: (_) => setState(() => _selectedStatus = status),
                  showCheckmark: false,
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: allOrders.isEmpty
                ? const FadeSlideIn(child: _EmptyOrders())
                : filteredOrders.isEmpty
                ? const _EmptyFilterResult()
                : ListView.separated(
                    padding: EdgeInsets.fromLTRB(
                      20,
                      8,
                      20,
                      isMobile ? 104 : 24,
                    ),
                    itemCount: filteredOrders.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final order = filteredOrders[index];
                      final canProcessSerial =
                          order.status == OrderStatus.completed ||
                          order.status == OrderStatus.shipping;
                      final canCancel =
                          order.status == OrderStatus.pendingApproval ||
                          order.status == OrderStatus.approved;
                      return FadeSlideIn(
                        key: ValueKey(order.id),
                        delay: Duration(milliseconds: 40 * index),
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
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Mã đơn: ${order.id}',
                                            style: Theme.of(context)
                                                .textTheme
                                                .titleSmall
                                                ?.copyWith(
                                                  fontWeight: FontWeight.w700,
                                                ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Đặt lúc ${formatDateTime(order.createdAt)}',
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall
                                                ?.copyWith(
                                                  color:
                                                      colors.onSurfaceVariant,
                                                ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    _StatusChip(status: order.status),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  '${order.totalItems} sản phẩm · ${formatVnd(order.total)}',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Thanh toán: ${order.paymentMethod.label}',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Trạng thái TT: ${order.paymentStatus.label}',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                if (order.outstandingAmount > 0) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    'Còn nợ: ${formatVnd(order.outstandingAmount)}',
                                    style: Theme.of(
                                      context,
                                    ).textTheme.bodySmall,
                                  ),
                                ],
                                const SizedBox(height: 12),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    OutlinedButton(
                                      style: OutlinedButton.styleFrom(
                                        minimumSize: const Size(0, 48),
                                      ),
                                      onPressed: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                OrderDetailScreen(
                                                  orderId: order.id,
                                                ),
                                          ),
                                        );
                                      },
                                      child: const Text('Xem chi tiết'),
                                    ),
                                    OutlinedButton(
                                      style: OutlinedButton.styleFrom(
                                        minimumSize: const Size(0, 48),
                                      ),
                                      onPressed: () {
                                        _reorder(context, cart, order);
                                      },
                                      child: const Text('Đặt lại đơn cũ'),
                                    ),
                                    ElevatedButton(
                                      style: ElevatedButton.styleFrom(
                                        minimumSize: const Size(0, 48),
                                      ),
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
                                      child: const Text('Xử lý serial'),
                                    ),
                                    if (canCancel)
                                      TextButton(
                                        style: TextButton.styleFrom(
                                          foregroundColor: Theme.of(
                                            context,
                                          ).colorScheme.error,
                                        ),
                                        onPressed: () =>
                                            _confirmCancel(context, order),
                                        child: const Text('Hủy đơn'),
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
          ),
        ],
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
    var addedCount = 0;
    final skipped = <String>[];

    for (final item in order.items) {
      final remaining = cart.remainingStockFor(item.product);
      if (remaining <= 0) {
        skipped.add(item.product.name);
        continue;
      }
      final qtyToAdd = item.quantity > remaining ? remaining : item.quantity;
      if (qtyToAdd <= 0) {
        skipped.add(item.product.name);
        continue;
      }
      final didAdd = cart.add(item.product, quantity: qtyToAdd);
      if (didAdd) {
        addedCount++;
      } else {
        skipped.add(item.product.name);
      }
    }

    final String message;
    if (addedCount == 0) {
      message = 'Không có sản phẩm nào được thêm vào giỏ (hết hàng).';
    } else if (skipped.isEmpty) {
      message = 'Đã thêm tất cả sản phẩm vào giỏ hàng.';
    } else {
      message =
          'Đã thêm $addedCount sản phẩm. Bỏ qua: ${skipped.join(', ')} (hết hàng hoặc vượt tồn kho).';
    }

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
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
              'Chưa có đơn hàng',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Hãy đặt hàng để xem lịch sử đơn hàng của bạn.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyFilterResult extends StatelessWidget {
  const _EmptyFilterResult();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.search_off_outlined, size: 64),
            const SizedBox(height: 16),
            Text(
              'Không tìm thấy đơn hàng phù hợp',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Thử thay đổi từ khóa hoặc bộ lọc trạng thái.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final background = _backgroundForStatus(status, isDark: isDark);
    final textColor = _textForStatus(status, isDark: isDark);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.28)),
      ),
      child: Text(
        status.label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}

Color _backgroundForStatus(OrderStatus status, {required bool isDark}) {
  if (isDark) {
    switch (status) {
      case OrderStatus.pendingApproval:
        return const Color(0xFF4C3B16);
      case OrderStatus.approved:
        return const Color(0xFF1E3150);
      case OrderStatus.shipping:
        return const Color(0xFF154052);
      case OrderStatus.completed:
        return const Color(0xFF1A3F2D);
      case OrderStatus.cancelled:
        return const Color(0xFF2A3642);
    }
  }
  switch (status) {
    case OrderStatus.pendingApproval:
      return const Color(0xFFFFF6DB);
    case OrderStatus.approved:
      return const Color(0xFFEAF2FF);
    case OrderStatus.shipping:
      return const Color(0xFFE0F2FE);
    case OrderStatus.completed:
      return const Color(0xFFE8F8EF);
    case OrderStatus.cancelled:
      return const Color(0xFFF1F5F9);
  }
}

Color _textForStatus(OrderStatus status, {required bool isDark}) {
  if (isDark) {
    switch (status) {
      case OrderStatus.pendingApproval:
        return const Color(0xFFF4D18A);
      case OrderStatus.approved:
        return const Color(0xFF93C5FD);
      case OrderStatus.shipping:
        return const Color(0xFF7DD3FC);
      case OrderStatus.completed:
        return const Color(0xFF86EFAC);
      case OrderStatus.cancelled:
        return const Color(0xFFCBD5E1);
    }
  }
  switch (status) {
    case OrderStatus.pendingApproval:
      return const Color(0xFF8A5A00);
    case OrderStatus.approved:
      return const Color(0xFF1A4FA3);
    case OrderStatus.shipping:
      return const Color(0xFF0C4A6E);
    case OrderStatus.completed:
      return const Color(0xFF1D7A3A);
    case OrderStatus.cancelled:
      return const Color(0xFF64748B);
  }
}
