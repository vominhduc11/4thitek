import 'package:flutter/material.dart';

import 'models.dart';
import 'order_controller.dart';
import 'notifications_screen.dart';
import 'utils.dart';
import 'warranty_activation_screen.dart';
import 'warranty_controller.dart';
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

    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Bảo hành'),
        actions: [
          IconButton(
            tooltip: 'Thông báo',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const NotificationsScreen(),
                ),
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
                      'Kich hoat nhanh',
                      style: Theme.of(
                        context,
                      ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      quickOrder == null
                          ? (completedOrders.isEmpty
                                ? 'Chua co don da giao. Chi don hoan thanh moi duoc kich hoat bao hanh.'
                                : 'Tat ca don da giao da kich hoat du serial.')
                          : 'Mo don ${quickOrder.id} de nhap serial va thong tin khach hang.',
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
                                    builder: (context) => WarrantyActivationScreen(
                                      orderId: quickOrder.id,
                                    ),
                                  ),
                                );
                              },
                        child: const Text('Kich hoat bao hanh'),
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
                  child: Text('Chua co luot kich hoat bao hanh nao.'),
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
                      'Don ${activation.orderId} · ${activation.productSku}\n'
                      'Khach: ${activation.customerName} (${activation.customerPhone})\n'
                      'Tu ${formatDate(activation.startsAt)} den ${formatDate(activation.expiresAt)}',
                    ),
                    isThreeLine: true,
                    trailing: Text(
                      'Da kich hoat',
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
    final activatedCount = warrantyController.activationsForOrder(order.id).length;
    if (activatedCount < order.totalItems) {
      return order;
    }
  }

  return null;
}
