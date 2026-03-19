import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
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
    final texts = _WarrantyHubTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
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
        title: BrandAppBarTitle(texts.screenTitle),
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
                          texts.quickProcessTitle,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          texts.quickProcessDescription(
                            quickOrder: quickOrder,
                            hasCompletedOrders: completedOrders.isNotEmpty,
                          ),
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
                            child: Text(texts.processSerialAction),
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
                          texts.serialInventoryTitle,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          texts.serialInventoryDescription,
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
                              label: texts.importedLabel,
                              value: '$importedSerialCount',
                              color: const Color(0xFF1D4ED8),
                            ),
                            _MetricChip(
                              label: texts.availableLabel,
                              value: '$availableSerialCount',
                              color: const Color(0xFF047857),
                            ),
                            _MetricChip(
                              label: texts.activatedLabel,
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
                            label: Text(texts.viewSerialAction),
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
                  texts.recentTitle,
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
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Text(texts.emptyRecentMessage),
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
                          texts.recentActivationSummary(
                            orderId: activation.orderId,
                            productSku: activation.productSku,
                            customerName: activation.customerName,
                            customerPhone: activation.customerPhone,
                            startDate: formatDate(activation.startsAt),
                            endDate: formatDate(activation.expiresAt),
                          ),
                        ),
                        isThreeLine: true,
                        trailing: Text(
                          texts.processedStatusLabel,
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
    final activatedCount = warrantyController.activationCountForOrder(order.id);
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

class _WarrantyHubTexts {
  const _WarrantyHubTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Warranty' : 'Bảo hành';
  String get quickProcessTitle =>
      isEnglish ? 'Quick serial processing' : 'Xử lý serial nhanh';
  String get processSerialAction =>
      isEnglish ? 'Process serials' : 'Xử lý serial';
  String get serialInventoryTitle =>
      isEnglish ? 'Serial inventory' : 'Kho serial';
  String get serialInventoryDescription => isEnglish
      ? 'Serials are synced automatically when an order reaches completed status. Dealers do not need to record them manually.'
      : 'Serial được NPP đồng bộ khi đơn chuyển sang hoàn thành. Đại lý không cần ghi nhận thủ công.';
  String get importedLabel => isEnglish ? 'Imported' : 'Đã nhập';
  String get availableLabel => isEnglish ? 'Available' : 'Sẵn sàng';
  String get activatedLabel => isEnglish ? 'Activated' : 'Đã kích hoạt';
  String get viewSerialAction => isEnglish ? 'View serials' : 'Xem serial';
  String get recentTitle => isEnglish ? 'Recent activity' : 'Gần đây';
  String get emptyRecentMessage => isEnglish
      ? 'No serial activity has been recorded yet.'
      : 'Chưa có lượt xử lý serial nào.';
  String get processedStatusLabel => isEnglish ? 'Processed' : 'Đã xử lý';

  String quickProcessDescription({
    required Order? quickOrder,
    required bool hasCompletedOrders,
  }) {
    if (quickOrder == null) {
      if (!hasCompletedOrders) {
        return isEnglish
            ? 'There are no delivered orders yet. Only completed orders can be processed for serials.'
            : 'Chưa có đơn đã giao. Chỉ đơn hoàn thành mới được xử lý serial.';
      }
      return isEnglish
          ? 'All delivered orders already have enough processed serials.'
          : 'Tất cả đơn đã giao đã xử lý đủ serial.';
    }
    return isEnglish
        ? 'Open order ${quickOrder.id} to process serials and customer details.'
        : 'Mở đơn ${quickOrder.id} để xử lý serial và thông tin khách hàng.';
  }

  String recentActivationSummary({
    required String orderId,
    required String productSku,
    required String customerName,
    required String customerPhone,
    required String startDate,
    required String endDate,
  }) {
    if (isEnglish) {
      return 'Order $orderId - $productSku\n'
          'Customer: $customerName ($customerPhone)\n'
          '$startDate to $endDate';
    }
    return 'Đơn $orderId - $productSku\n'
        'Khách: $customerName ($customerPhone)\n'
        'Từ $startDate đến $endDate';
  }
}
