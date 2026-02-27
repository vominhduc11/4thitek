import 'package:flutter/material.dart';

import 'models.dart';
import 'order_controller.dart';
import 'notifications_screen.dart';
import 'utils.dart';
import 'warranty_activation_screen.dart';
import 'warranty_controller.dart';
import 'warranty_serial_inventory_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

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

    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Kho'),
        actions: [
          IconButton(
            tooltip: 'Thong bao',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          FadeSlideIn(
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
                    Text(
                      'Xu ly serial nhanh',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      quickOrder == null
                          ? (completedOrders.isEmpty
                                ? 'Chua co don da giao. Chi don hoan thanh moi duoc xu ly serial.'
                                : 'Tat ca don da giao da xu ly du serial.')
                          : 'Mo don ${quickOrder.id} de xu ly serial va thong tin khach hang.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.black54,
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
                                    builder: (context) =>
                                        WarrantyActivationScreen(
                                          orderId: quickOrder.id,
                                        ),
                                  ),
                                );
                              },
                        child: const Text('Xu ly serial'),
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
                side: const BorderSide(color: Color(0xFFE5EAF5)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Kho serial',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Serial duoc NPP dong bo khi don chuyen sang hoan thanh. Dealer khong can ghi nhan thu cong.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.black54,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _MetricChip(
                          label: 'Da nhap',
                          value: '$importedSerialCount',
                          color: const Color(0xFF1D4ED8),
                        ),
                        _MetricChip(
                          label: 'San sang',
                          value: '$availableSerialCount',
                          color: const Color(0xFF047857),
                        ),
                        _MetricChip(
                          label: 'Da kich hoat',
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
                        icon: const Icon(Icons.inventory_2_outlined, size: 18),
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
              'Gan day',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 10),
          if (recentActivations.isEmpty)
            FadeSlideIn(
              delay: const Duration(milliseconds: 90),
              child: const Card(
                elevation: 0,
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Chua co luot xu ly serial nao.'),
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
                    side: const BorderSide(color: Color(0xFFE5EAF5)),
                  ),
                  child: ListTile(
                    title: Text(activation.serial),
                    subtitle: Text(
                      'Don ${activation.orderId} - ${activation.productSku}\n'
                      'Khach: ${activation.customerName} (${activation.customerPhone})\n'
                      'Tu ${formatDate(activation.startsAt)} den ${formatDate(activation.expiresAt)}',
                    ),
                    isThreeLine: true,
                    trailing: Text(
                      'Da xu ly',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF127A34),
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
              color: const Color(0xFF475569),
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
