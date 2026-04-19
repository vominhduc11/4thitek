import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dealer_navigation.dart';
import 'dealer_routes.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'utils.dart';
import 'warranty_controller.dart';
import 'warranty_serial_inventory_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/notification_icon_button.dart';
import 'widgets/section_card.dart';

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
    final size = MediaQuery.sizeOf(context);
    final isTablet = size.shortestSide >= AppBreakpoints.phone;
    final isWideLayout = size.width >= 920;
    final maxWidth = isTablet ? 980.0 : double.infinity;

    return Scaffold(
      appBar: AppBar(
        leading: const DealerFallbackBackButton(
          fallbackPath: DealerRoutePath.home,
        ),
        title: BrandAppBarTitle(texts.screenTitle),
        actions: [
          NotificationIconButton(
            count: NotificationScope.of(context).unreadCount,
            onPressed: () => context.pushDealerNotifications(),
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
                child: _WarrantyHubHeroCard(
                  title: texts.heroTitle,
                  subtitle: texts.heroSubtitle(
                    quickOrder: quickOrder,
                    hasCompletedOrders: completedOrders.isNotEmpty,
                  ),
                  stateLabel: quickOrder == null
                      ? texts.noOrderReadyLabel
                      : texts.orderReadyLabel(quickOrder.id),
                  metrics: [
                    _WarrantyHeroMetric(
                      icon: Icons.inventory_2_outlined,
                      label: texts.importedLabel,
                      value: '$importedSerialCount',
                    ),
                    _WarrantyHeroMetric(
                      icon: Icons.qr_code_2_outlined,
                      label: texts.availableLabel,
                      value: '$availableSerialCount',
                    ),
                    _WarrantyHeroMetric(
                      icon: Icons.verified_outlined,
                      label: texts.activatedLabel,
                      value: '$activatedSerialCount',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              if (isWideLayout)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: FadeSlideIn(
                        delay: const Duration(milliseconds: 40),
                        child: _buildQuickProcessCard(
                          context,
                          texts: texts,
                          quickOrder: quickOrder,
                          hasCompletedOrders: completedOrders.isNotEmpty,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: FadeSlideIn(
                        delay: const Duration(milliseconds: 60),
                        child: _buildSerialInventoryCard(
                          context,
                          texts: texts,
                          importedSerialCount: importedSerialCount,
                          availableSerialCount: availableSerialCount,
                          activatedSerialCount: activatedSerialCount,
                        ),
                      ),
                    ),
                  ],
                )
              else ...[
                FadeSlideIn(
                  delay: const Duration(milliseconds: 40),
                  child: _buildQuickProcessCard(
                    context,
                    texts: texts,
                    quickOrder: quickOrder,
                    hasCompletedOrders: completedOrders.isNotEmpty,
                  ),
                ),
                const SizedBox(height: 14),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 60),
                  child: _buildSerialInventoryCard(
                    context,
                    texts: texts,
                    importedSerialCount: importedSerialCount,
                    availableSerialCount: availableSerialCount,
                    activatedSerialCount: activatedSerialCount,
                  ),
                ),
              ],
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 80),
                child: SectionCard(
                  title: texts.recentTitle,
                  child: recentActivations.isEmpty
                      ? _WarrantyHubEmptyState(
                          message: texts.emptyRecentMessage,
                        )
                      : Column(
                          children: [
                            for (final entry
                                in recentActivations.asMap().entries)
                              Padding(
                                padding: EdgeInsets.only(
                                  bottom:
                                      entry.key == recentActivations.length - 1
                                      ? 0
                                      : 10,
                                ),
                                child: _WarrantyActivationListItem(
                                  activation: entry.value,
                                  texts: texts,
                                  animate: entry.key < 6,
                                  index: entry.key,
                                ),
                              ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Widget _buildQuickProcessCard(
  BuildContext context, {
  required _WarrantyHubTexts texts,
  required Order? quickOrder,
  required bool hasCompletedOrders,
}) {
  return SectionCard(
    title: texts.quickProcessTitle,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          texts.quickProcessDescription(
            quickOrder: quickOrder,
            hasCompletedOrders: hasCompletedOrders,
          ),
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: quickOrder == null
                ? null
                : () => context.pushDealerWarrantyActivation(quickOrder.id),
            icon: const Icon(Icons.bolt_outlined),
            label: Text(texts.processSerialAction),
          ),
        ),
      ],
    ),
  );
}

Widget _buildSerialInventoryCard(
  BuildContext context, {
  required _WarrantyHubTexts texts,
  required int importedSerialCount,
  required int availableSerialCount,
  required int activatedSerialCount,
}) {
  final colors = Theme.of(context).colorScheme;
  return SectionCard(
    title: texts.serialInventoryTitle,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          texts.serialInventoryDescription,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: colors.onSurfaceVariant,
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
              color: colors.primary,
            ),
            _MetricChip(
              label: texts.availableLabel,
              value: '$availableSerialCount',
              color:
                  Color.lerp(colors.primary, colors.secondary, 0.35) ??
                  colors.primary,
            ),
            _MetricChip(
              label: texts.activatedLabel,
              value: '$activatedSerialCount',
              color: colors.secondary,
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
                  builder: (_) => const WarrantySerialInventoryScreen(),
                ),
              );
            },
            icon: const Icon(Icons.inventory_2_outlined, size: 18),
            label: Text(texts.viewSerialAction),
          ),
        ),
      ],
    ),
  );
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

class _WarrantyHeroMetric {
  const _WarrantyHeroMetric({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;
}

class _WarrantyHubHeroCard extends StatelessWidget {
  const _WarrantyHubHeroCard({
    required this.title,
    required this.subtitle,
    required this.stateLabel,
    required this.metrics,
  });

  final String title;
  final String subtitle;
  final String stateLabel;
  final List<_WarrantyHeroMetric> metrics;

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
            colors.secondaryContainer.withValues(alpha: 0.86),
          ],
        ),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.32),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 620;
                final statePill = Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
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
                      Icon(
                        Icons.verified_user_outlined,
                        size: 16,
                        color: colors.onSurfaceVariant,
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          stateLabel,
                          overflow: TextOverflow.ellipsis,
                          style: textTheme.labelLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
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
                          alpha: 0.86,
                        ),
                        height: 1.45,
                      ),
                    ),
                  ],
                );

                if (compact) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      statePill,
                      const SizedBox(height: 16),
                      titleBlock,
                    ],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: titleBlock),
                    const SizedBox(width: 16),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 260),
                      child: statePill,
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: metrics
                  .map(
                    (metric) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: colors.surface.withValues(alpha: 0.72),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: colors.outlineVariant.withValues(alpha: 0.35),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            metric.icon,
                            size: 18,
                            color: colors.onSurfaceVariant,
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                metric.label,
                                style: textTheme.labelSmall?.copyWith(
                                  color: colors.onSurfaceVariant,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                metric.value,
                                style: textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: colors.onSurface,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(growable: false),
            ),
          ],
        ),
      ),
    );
  }
}

class _WarrantyHubEmptyState extends StatelessWidget {
  const _WarrantyHubEmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: colors.primaryContainer.withValues(alpha: 0.24),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.history_outlined, color: colors.primary, size: 22),
          const SizedBox(height: 10),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class _WarrantyActivationListItem extends StatelessWidget {
  const _WarrantyActivationListItem({
    required this.activation,
    required this.texts,
    required this.animate,
    required this.index,
  });

  final WarrantyActivationRecord activation;
  final _WarrantyHubTexts texts;
  final bool animate;
  final int index;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return FadeSlideIn(
      key: ValueKey(
        '${activation.orderId}-${activation.productId}-${activation.serial}',
      ),
      animate: animate,
      delay: animate ? Duration(milliseconds: 100 + 35 * index) : Duration.zero,
      child: RepaintBoundary(
        child: Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(
              color: colors.outlineVariant.withValues(alpha: 0.6),
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
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _WarrantyHubTexts {
  const _WarrantyHubTexts({required this.isEnglish});

  final bool isEnglish;

  String get heroTitle =>
      isEnglish ? 'Warranty operations' : 'Vận hành bảo hành';
  String heroSubtitle({
    required Order? quickOrder,
    required bool hasCompletedOrders,
  }) {
    if (quickOrder != null) {
      return isEnglish
          ? 'A delivered order is ready for serial processing. Review customer details and activate warranty without leaving this hub.'
          : 'Một đơn đã giao đang sẵn sàng để xử lý serial. Kiểm tra thông tin khách hàng và kích hoạt bảo hành ngay từ hub này.';
    }
    if (!hasCompletedOrders) {
      return isEnglish
          ? 'Serial processing becomes available after an order reaches completed status.'
          : 'Xử lý serial sẽ khả dụng khi đơn hàng chuyển sang trạng thái hoàn thành.';
    }
    return isEnglish
        ? 'All delivered orders already have enough processed serials.'
        : 'Tất cả đơn đã giao đã được xử lý đủ serial.';
  }

  String get noOrderReadyLabel =>
      isEnglish ? 'No order ready' : 'Chưa có đơn sẵn sàng';
  String orderReadyLabel(String orderId) =>
      isEnglish ? 'Order $orderId ready' : 'Đơn $orderId sẵn sàng';

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
