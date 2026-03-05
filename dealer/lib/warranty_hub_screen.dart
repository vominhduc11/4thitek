import 'package:flutter/material.dart';

import 'breakpoints.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'notifications_screen.dart';
import 'order_controller.dart';
import 'utils.dart';
import 'warranty_activation_screen.dart';
import 'warranty_controller.dart';
import 'warranty_serial_inventory_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/notification_icon_button.dart';

class WarrantyHubScreen extends StatelessWidget {
  const WarrantyHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final orderController = OrderScope.of(context);
    final warrantyController = WarrantyScope.of(context);
    final orders = orderController.orders;
    final completedOrders = orders
        .where((order) => order.status == OrderStatus.completed)
        .toList(growable: false);

    final quickOrder = _pickQuickOrder(completedOrders, warrantyController);
    final recentActivations = warrantyController.recentActivations(limit: 20);
    final importedSerialCount = warrantyController.importedSerialCount;
    final availableSerialCount =
        warrantyController.availableImportedSerialCount;
    final activatedSerialCount =
        warrantyController.activatedImportedSerialCount;
    final isTablet =
        MediaQuery.sizeOf(context).shortestSide >= AppBreakpoints.phone;
    final maxWidth = isTablet ? 980.0 : double.infinity;

    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Bảo hành'),
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
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              FadeSlideIn(
                child: Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                    side: BorderSide(
                      color: Theme.of(
                        context,
                      ).colorScheme.outlineVariant.withValues(alpha: 0.6),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Xử lý serial nhanh',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          quickOrder == null
                              ? (completedOrders.isEmpty
                                    ? 'Chưa có đơn đã giao. Chỉ đơn hoàn thành mới được xử lý serial.'
                                    : 'Tất cả đơn đã giao đã xử lý đủ serial.')
                              : 'Mở đơn ${quickOrder.id} để xử lý serial và thông tin khách hàng.',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                                height: 1.5,
                              ),
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: quickOrder == null
                                ? null
                                : () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) =>
                                            WarrantyActivationScreen(
                                              orderId: quickOrder.id,
                                            ),
                                      ),
                                    );
                                  },
                            child: const Text('Xử lý serial'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 40),
                child: Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                    side: BorderSide(
                      color: Theme.of(
                        context,
                      ).colorScheme.outlineVariant.withValues(alpha: 0.6),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Kho serial',
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Serial được NPP đồng bộ khi đơn chuyển sang hoàn thành. Đại lý không cần ghi nhận thủ công.',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                                height: 1.5,
                              ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _MetricChip(
                              label: 'Đã nhập',
                              value: '$importedSerialCount',
                              color: const Color(0xFF1D4ED8),
                            ),
                            _MetricChip(
                              label: 'Sẵn sàng',
                              value: '$availableSerialCount',
                              color: const Color(0xFF047857),
                            ),
                            _MetricChip(
                              label: 'Đã kích hoạt',
                              value: '$activatedSerialCount',
                              color: const Color(0xFFB45309),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      const WarrantySerialInventoryScreen(),
                                ),
                              );
                            },
                            icon: const Icon(
                              Icons.inventory_2_outlined,
                              size: 18,
                            ),
                            label: const Text('Xem serial'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: Text(
                  'Gần đây',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              if (recentActivations.isEmpty)
                FadeSlideIn(
                  delay: const Duration(milliseconds: 90),
                  child: Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(
                        color: Theme.of(
                          context,
                        ).colorScheme.outlineVariant.withValues(alpha: 0.6),
                      ),
                    ),
                    child: const Padding(
                      padding: EdgeInsets.all(16),
                      child: Text('Chưa có lượt xử lý serial nào.'),
                    ),
                  ),
                ),
              ...recentActivations.asMap().entries.map((entry) {
                final index = entry.key;
                final activation = entry.value;
                return FadeSlideIn(
                  key: ValueKey(
                    '${activation.orderId}-${activation.productId}-${activation.serial}',
                  ),
                  delay: Duration(milliseconds: 100 + 35 * index),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: Theme.of(
                            context,
                          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
                        ),
                      ),
                      child: ListTile(
                        title: Text(activation.serial),
                        subtitle: Text(
                          'Đơn ${activation.orderId} - ${activation.productSku}\n'
                          'Khách: ${activation.customerName} (${activation.customerPhone})\n'
                          'Từ ${formatDate(activation.startsAt)} đến ${formatDate(activation.expiresAt)}',
                        ),
                        isThreeLine: true,
                        trailing: Text(
                          'Đã xử lý',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color:
                                    Theme.of(context).brightness ==
                                        Brightness.dark
                                    ? const Color(0xFF4ADE80)
                                    : const Color(0xFF127A34),
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}

Order? _pickQuickOrder(
  List<Order> orders,
  WarrantyController warrantyController,
) {
  for (final order in orders) {
    final activatedCount = warrantyController
        .activationsForOrder(order.id)
        .length;
    if (activatedCount < order.totalItems) {
      return order;
    }
  }

  return null;
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: color,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
