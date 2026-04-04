import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dealer_profile_storage.dart';
import 'models.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'upload_service.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

class DebtTrackingScreen extends StatefulWidget {
  const DebtTrackingScreen({super.key});

  @override
  State<DebtTrackingScreen> createState() => _DebtTrackingScreenState();
}

class _DebtTrackingScreenState extends State<DebtTrackingScreen> {
  DealerProfile _profile = DealerProfile.defaults;
  bool _showAllPaymentHistory = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final profile = await loadDealerProfile();
      if (!mounted) {
        return;
      }
      setState(() => _profile = profile);
    } on DealerProfileStorageException {
      // Keep debt tracking usable even if profile metadata is temporarily unavailable.
    }
  }

  Future<void> _handleRefresh() async {
    await Future.wait<void>([OrderScope.of(context).refresh(), _loadProfile()]);
    if (!mounted) {
      return;
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    final texts = _DebtTexts(isEnglish: isEnglish);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final orderController = OrderScope.of(context);

    final debtOrders = orderController.debtOrders;
    final debtOrderIds = orderController.orders
        .where((order) => order.paymentMethod == OrderPaymentMethod.debt)
        .map((order) => order.id)
        .toSet();

    final paymentHistory = orderController.paymentHistory
        .where((payment) => debtOrderIds.contains(payment.orderId))
        .toList(growable: false);

    final totalOutstandingDebt = orderController.totalOpenReceivable;
    final totalCreditExposure = orderController.totalCreditExposure;
    final creditLimit = _profile.creditLimit;
    final averageOutstandingDebt = debtOrders.isEmpty
        ? 0
        : (totalOutstandingDebt / debtOrders.length).round();

    final latestPaymentAt = paymentHistory.isEmpty
        ? null
        : paymentHistory
              .map((payment) => payment.paidAt)
              .reduce((a, b) => a.isAfter(b) ? a : b);

    final creditUsageRatio = creditLimit <= 0
        ? 0.0
        : (totalCreditExposure / creditLimit).clamp(0.0, 1.0);

    final screenWidth = MediaQuery.sizeOf(context).width;
    final isTablet = AppBreakpoints.isTablet(context);
    final useWideLayout = screenWidth >= 980;
    final isDesktopWide = screenWidth >= 1180;
    final contentMaxWidth = useWideLayout
        ? 1180.0
        : isTablet
        ? 980.0
        : 760.0;

    final heroCard = FadeSlideIn(
      child: _DebtHeroCard(
        title: texts.heroTitle,
        subtitle: texts.heroSubtitle,
        totalOutstandingDebt: totalOutstandingDebt,
        outstandingOrderCount: debtOrders.length,
        creditLimit: creditLimit,
        latestPaymentAt: latestPaymentAt,
        texts: texts,
      ),
    );

    final insightPanel = FadeSlideIn(
      delay: const Duration(milliseconds: 70),
      child: _DebtInsightPanel(
        title: texts.insightPanelTitle,
        subtitle: texts.insightPanelSubtitle,
        totalOutstandingDebt: totalOutstandingDebt,
        averageOutstandingDebt: averageOutstandingDebt,
        creditLimit: creditLimit,
        creditUsageRatio: creditUsageRatio,
        recordedPaymentCount: paymentHistory.length,
        texts: texts,
      ),
    );

    final ordersSection = FadeSlideIn(
      delay: const Duration(milliseconds: 110),
      child: SectionCard(
        title: texts.debtOrdersSectionTitle,
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              texts.debtOrdersSectionSubtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 16),
            if (debtOrders.isEmpty)
              _EmptyStateCard(
                icon: Icons.check_circle_outline,
                title: texts.debtOrdersEmptyTitle,
                subtitle: texts.debtOrdersEmptySubtitle,
              )
            else
              _DebtOrdersGrid(
                orders: debtOrders,
                texts: texts,
                isTablet: isTablet,
                isDesktopWide: isDesktopWide,
              ),
          ],
        ),
      ),
    );

    final paymentSection = FadeSlideIn(
      delay: const Duration(milliseconds: 150),
      child: SectionCard(
        title: texts.paymentHistorySectionTitle,
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              texts.paymentHistorySectionSubtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 16),
            if (paymentHistory.isEmpty)
              _EmptyStateCard(
                icon: Icons.history_toggle_off_outlined,
                title: texts.paymentHistoryEmptyTitle,
                subtitle: texts.paymentHistoryEmptySubtitle,
              )
            else ...[
              ...(() {
                const maxInitial = 20;
                final displayList = _showAllPaymentHistory
                    ? paymentHistory
                    : paymentHistory.take(maxInitial).toList(growable: false);

                return displayList.asMap().entries.map((entry) {
                  final index = entry.key;
                  final payment = entry.value;
                  final shouldAnimate = index < 6;
                  return Padding(
                    padding: EdgeInsets.only(
                      bottom: index == displayList.length - 1 ? 0 : 10,
                    ),
                    child: FadeSlideIn(
                      key: ValueKey(payment.id),
                      animate: shouldAnimate,
                      delay: shouldAnimate
                          ? Duration(milliseconds: 80 + index * 35)
                          : Duration.zero,
                      child: RepaintBoundary(
                        child: _PaymentHistoryCard(
                          payment: payment,
                          texts: texts,
                        ),
                      ),
                    ),
                  );
                });
              })(),
              if (!_showAllPaymentHistory && paymentHistory.length > 20) ...[
                const SizedBox(height: 10),
                Center(
                  child: TextButton.icon(
                    onPressed: () =>
                        setState(() => _showAllPaymentHistory = true),
                    icon: const Icon(Icons.expand_more, size: 18),
                    label: Text(
                      texts.showAllPaymentsLabel(paymentHistory.length),
                    ),
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );

    Widget bodyContent;
    if (useWideLayout) {
      bodyContent = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        children: [
          heroCard,
          const SizedBox(height: 18),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 7,
                child: Column(
                  children: [
                    ordersSection,
                    const SizedBox(height: 16),
                    paymentSection,
                  ],
                ),
              ),
              const SizedBox(width: 18),
              Expanded(flex: 5, child: insightPanel),
            ],
          ),
        ],
      );
    } else {
      bodyContent = ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        children: [
          heroCard,
          const SizedBox(height: 16),
          insightPanel,
          const SizedBox(height: 16),
          ordersSection,
          const SizedBox(height: 16),
          paymentSection,
        ],
      );
    }

    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        title: BrandAppBarTitle(texts.screenTitle),
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
      ),
      body: Stack(
        children: [
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    colors.primaryContainer.withValues(alpha: 0.10),
                    colors.surface,
                    colors.surface,
                  ],
                ),
              ),
            ),
          ),
          Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: contentMaxWidth),
              child: RefreshIndicator(
                onRefresh: _handleRefresh,
                child: bodyContent,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DebtHeroCard extends StatelessWidget {
  const _DebtHeroCard({
    required this.title,
    required this.subtitle,
    required this.totalOutstandingDebt,
    required this.outstandingOrderCount,
    required this.creditLimit,
    required this.latestPaymentAt,
    required this.texts,
  });

  final String title;
  final String subtitle;
  final int totalOutstandingDebt;
  final int outstandingOrderCount;
  final int creditLimit;
  final DateTime? latestPaymentAt;
  final _DebtTexts texts;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Semantics(
      container: true,
      label: texts.summarySemantics(
        amount: formatVnd(totalOutstandingDebt),
        orderCount: outstandingOrderCount,
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              colors.primaryContainer.withValues(alpha: 0.96),
              colors.secondaryContainer.withValues(alpha: 0.88),
            ],
          ),
          border: Border.all(
            color: colors.outlineVariant.withValues(alpha: 0.35),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 28,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LayoutBuilder(
                builder: (context, constraints) {
                  final compact = constraints.maxWidth < 620;
                  final iconShell = Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: colors.surface.withValues(alpha: 0.72),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Icon(
                      Icons.account_balance_wallet_outlined,
                      color: colors.onSurface,
                      size: 28,
                    ),
                  );

                  final header = Column(
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
                            alpha: 0.84,
                          ),
                          height: 1.45,
                        ),
                      ),
                    ],
                  );

                  if (compact) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [iconShell, const SizedBox(height: 14), header],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      iconShell,
                      const SizedBox(width: 16),
                      Expanded(child: header),
                    ],
                  );
                },
              ),
              const SizedBox(height: 18),
              Text(
                formatVnd(totalOutstandingDebt),
                style: textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: colors.onPrimaryContainer,
                  height: 1.0,
                ),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _HeroInfoChip(
                    icon: Icons.receipt_long_outlined,
                    label: texts.outstandingOrdersLabel(outstandingOrderCount),
                  ),
                  _HeroInfoChip(
                    icon: Icons.account_balance_outlined,
                    label: texts.creditLimitHeroLabel(creditLimit),
                  ),
                  if (latestPaymentAt != null)
                    _HeroInfoChip(
                      icon: Icons.schedule_outlined,
                      label: texts.latestPaymentLabel(
                        formatDateTime(latestPaymentAt!),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroInfoChip extends StatelessWidget {
  const _HeroInfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
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
          Icon(icon, size: 16, color: colors.onSurfaceVariant),
          const SizedBox(width: 8),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 220),
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _DebtInsightPanel extends StatelessWidget {
  const _DebtInsightPanel({
    required this.title,
    required this.subtitle,
    required this.totalOutstandingDebt,
    required this.averageOutstandingDebt,
    required this.creditLimit,
    required this.creditUsageRatio,
    required this.recordedPaymentCount,
    required this.texts,
  });

  final String title;
  final String subtitle;
  final int totalOutstandingDebt;
  final int averageOutstandingDebt;
  final int creditLimit;
  final double creditUsageRatio;
  final int recordedPaymentCount;
  final _DebtTexts texts;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isCreditConfigured = creditLimit > 0;
    final ratioPercent = (creditUsageRatio * 100).round();

    return SectionCard(
      title: title,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 16),
          _InsightMetricTile(
            icon: Icons.payments_outlined,
            label: texts.totalDebtMetricLabel,
            value: formatVnd(totalOutstandingDebt),
            emphasize: true,
          ),
          const SizedBox(height: 12),
          _InsightMetricTile(
            icon: Icons.analytics_outlined,
            label: texts.averageDebtMetricLabel,
            value: averageOutstandingDebt <= 0
                ? texts.metricUnavailableValue
                : formatVnd(averageOutstandingDebt),
          ),
          const SizedBox(height: 12),
          _InsightMetricTile(
            icon: Icons.history_outlined,
            label: texts.recordedPaymentsMetricLabel,
            value: texts.recordedPaymentsValue(recordedPaymentCount),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              color: colors.primaryContainer.withValues(alpha: 0.32),
              border: Border.all(
                color: colors.outlineVariant.withValues(alpha: 0.35),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SummaryLine(
                  label: texts.creditUtilizationLabel,
                  value: isCreditConfigured
                      ? '$ratioPercent%'
                      : texts.metricUnavailableValue,
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: isCreditConfigured ? creditUsageRatio : 0,
                    minHeight: 8,
                    backgroundColor: colors.surface,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  texts.creditUtilizationDescription(
                    creditLimit: creditLimit,
                    ratioPercent: ratioPercent,
                  ),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                    height: 1.45,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InsightMetricTile extends StatelessWidget {
  const _InsightMetricTile({
    required this.icon,
    required this.label,
    required this.value,
    this.emphasize = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final valueColor = emphasize ? colors.primary : colors.onSurface;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: colors.primaryContainer.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, size: 20, color: colors.onPrimaryContainer),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: colors.onSurfaceVariant),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: valueColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryLine extends StatelessWidget {
  const _SummaryLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
        ),
        const SizedBox(width: 12),
        Text(
          value,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
      ],
    );
  }
}

class _DebtOrdersGrid extends StatelessWidget {
  const _DebtOrdersGrid({
    required this.orders,
    required this.texts,
    required this.isTablet,
    required this.isDesktopWide,
  });

  final List<Order> orders;
  final _DebtTexts texts;
  final bool isTablet;
  final bool isDesktopWide;

  @override
  Widget build(BuildContext context) {
    if (!isTablet) {
      return Column(
        children: [
          ...orders.asMap().entries.map((entry) {
            final index = entry.key;
            final order = entry.value;
            final shouldAnimate = index < 6;
            return FadeSlideIn(
              key: ValueKey('debt-${order.id}'),
              animate: shouldAnimate,
              delay: shouldAnimate
                  ? Duration(milliseconds: 80 + index * 35)
                  : Duration.zero,
              child: Padding(
                padding: EdgeInsets.only(
                  bottom: index == orders.length - 1 ? 0 : 10,
                ),
                child: RepaintBoundary(
                  child: _DebtOrderCard(order: order, texts: texts),
                ),
              ),
            );
          }),
        ],
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        const spacing = 10.0;
        final columns = constraints.maxWidth >= 1080
            ? 3
            : constraints.maxWidth >= 680
            ? 2
            : 1;
        final itemWidth =
            (constraints.maxWidth - spacing * (columns - 1)) / columns;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            ...orders.asMap().entries.map((entry) {
              final index = entry.key;
              final order = entry.value;
              final shouldAnimate = index < 6;
              return SizedBox(
                width: itemWidth,
                child: FadeSlideIn(
                  key: ValueKey('debt-grid-${order.id}'),
                  animate: shouldAnimate,
                  delay: shouldAnimate
                      ? Duration(milliseconds: 80 + index * 35)
                      : Duration.zero,
                  child: RepaintBoundary(
                    child: _DebtOrderCard(order: order, texts: texts),
                  ),
                ),
              );
            }),
          ],
        );
      },
    );
  }
}

class _DebtOrderCard extends StatelessWidget {
  const _DebtOrderCard({required this.order, required this.texts});

  final Order order;
  final _DebtTexts texts;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    const debtColor = Color(0xFFFBBF24);
    final paidRatio = order.total <= 0
        ? 0.0
        : (order.paidAmount / order.total).clamp(0.0, 1.0);

    return Semantics(
      container: true,
      label: texts.debtCardSemantics(
        orderId: order.id,
        outstanding: formatVnd(order.outstandingAmount),
      ),
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: colors.outlineVariant.withValues(alpha: 0.6)),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => _openOrderDetail(context),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        order.id,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _StatusChip(
                      label: texts.paymentStatusLabel(order.paymentStatus),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _InfoStrip(
                  items: [
                    _InfoStripItem(
                      icon: Icons.calendar_today_outlined,
                      label: texts.orderDateLabel,
                      value: formatDateTime(order.createdAt),
                    ),
                    _InfoStripItem(
                      icon: Icons.credit_card_outlined,
                      label: texts.paymentMethodLabel,
                      value: texts.paymentMethod(context, order.paymentMethod),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _InfoStrip(
                  items: [
                    _InfoStripItem(
                      icon: Icons.receipt_long_outlined,
                      label: texts.totalAmountLabel,
                      value: formatVnd(order.total),
                    ),
                    _InfoStripItem(
                      icon: Icons.check_circle_outline,
                      label: texts.paidAmountLabel,
                      value: formatVnd(order.paidAmount),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF422006),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: debtColor.withValues(alpha: 0.18),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        texts.outstandingAmountLabel(order.outstandingAmount),
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: debtColor,
                        ),
                      ),
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(
                          value: paidRatio,
                          minHeight: 8,
                          backgroundColor: colors.surfaceContainerHighest,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        texts.paymentProgress(
                          paid: formatVnd(order.paidAmount),
                          total: formatVnd(order.total),
                        ),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                LayoutBuilder(
                  builder: (context, constraints) {
                    final compact = constraints.maxWidth < 360;
                    if (compact) {
                      return Column(
                        children: [
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: () => _openOrderDetail(context),
                              icon: const Icon(
                                Icons.receipt_long_outlined,
                                size: 18,
                              ),
                              label: Text(texts.viewOrderButton),
                            ),
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                              onPressed: () =>
                                  _showRecordPaymentBottomSheet(context, order),
                              icon: const Icon(
                                Icons.payments_outlined,
                                size: 18,
                              ),
                              label: Text(texts.recordPaymentButton),
                            ),
                          ),
                        ],
                      );
                    }

                    return Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _openOrderDetail(context),
                            icon: const Icon(
                              Icons.receipt_long_outlined,
                              size: 18,
                            ),
                            label: Text(texts.viewOrderButton),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FilledButton.icon(
                            onPressed: () =>
                                _showRecordPaymentBottomSheet(context, order),
                            icon: const Icon(Icons.payments_outlined, size: 18),
                            label: Text(texts.recordPaymentButton),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openOrderDetail(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)),
    );
  }

  Future<void> _showRecordPaymentBottomSheet(
    BuildContext context,
    Order order,
  ) async {
    final uploadService = UploadService();
    final colors = Theme.of(context).colorScheme;
    final theme = Theme.of(context);
    final amountController = TextEditingController();
    final noteController = TextEditingController();
    final proofController = TextEditingController();
    final channels = texts.paymentChannels;
    var channel = order.paymentMethod == OrderPaymentMethod.debt
        ? channels.last
        : channels.first;
    var isSubmitting = false;
    var isUploadingProof = false;
    String? pickedFileName;

    InputDecoration inputDecoration({
      required String label,
      Widget? prefixIcon,
      String? hintText,
    }) {
      final border = OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: colors.outlineVariant.withValues(alpha: 0.7),
        ),
      );

      return InputDecoration(
        labelText: label,
        hintText: hintText,
        prefixIcon: prefixIcon,
        filled: true,
        fillColor: colors.surfaceContainerHighest.withValues(alpha: 0.22),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        border: border,
        enabledBorder: border,
        focusedBorder: border.copyWith(
          borderSide: BorderSide(color: colors.primary, width: 1.4),
        ),
      );
    }

    await showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      requestFocus: true,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetRootContext) {
        return StatefulBuilder(
          builder: (sheetContext, setDialogState) {
            final rawAmount = int.tryParse(amountController.text.trim()) ?? 0;
            final amountPreview = rawAmount > 0
                ? formatVnd(rawAmount)
                : texts.amountPreviewPlaceholder;
            final isWide = MediaQuery.sizeOf(sheetContext).width >= 720;

            final amountField = TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: (_) => setDialogState(() {}),
              decoration: inputDecoration(
                label: texts.paymentAmountLabel,
                hintText: texts.maxAmountHint(
                  formatVnd(order.outstandingAmount),
                ),
                prefixIcon: const Icon(Icons.payments_outlined),
              ),
            );

            final channelField = DropdownButtonFormField<String>(
              initialValue: channel,
              decoration: inputDecoration(
                label: texts.paymentChannelLabel,
                prefixIcon: const Icon(Icons.account_balance_outlined),
              ),
              items: channels
                  .map(
                    (item) => DropdownMenuItem<String>(
                      value: item,
                      child: Text(item),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value == null) {
                  return;
                }
                setDialogState(() => channel = value);
              },
            );

            return Padding(
              padding: EdgeInsets.fromLTRB(
                16,
                8,
                16,
                MediaQuery.viewInsetsOf(sheetContext).bottom + 16,
              ),
              child: SingleChildScrollView(
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 620),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          texts.recordPaymentDialogTitle,
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(18),
                            color: colors.primaryContainer.withValues(
                              alpha: 0.32,
                            ),
                            border: Border.all(
                              color: colors.outlineVariant.withValues(
                                alpha: 0.35,
                              ),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                order.id,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                texts.orderIdAndOutstanding(
                                  orderId: order.id,
                                  outstanding: formatVnd(
                                    order.outstandingAmount,
                                  ),
                                ),
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  height: 1.45,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (isWide)
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(child: amountField),
                              const SizedBox(width: 12),
                              Expanded(child: channelField),
                            ],
                          )
                        else ...[
                          amountField,
                          const SizedBox(height: 12),
                          channelField,
                        ],
                        const SizedBox(height: 8),
                        Text(
                          texts.amountPreview(amountPreview),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colors.onSurfaceVariant,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: noteController,
                          decoration: inputDecoration(
                            label: texts.noteLabel,
                            prefixIcon: const Icon(Icons.edit_note_outlined),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: colors.outlineVariant.withValues(
                                alpha: 0.35,
                              ),
                            ),
                            color: colors.surface,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                texts.proofSectionTitle,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                texts.proofSectionSubtitle,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colors.onSurfaceVariant,
                                  height: 1.45,
                                ),
                              ),
                              const SizedBox(height: 12),
                              OutlinedButton.icon(
                                onPressed: isUploadingProof
                                    ? null
                                    : () async {
                                        final picked = await ImagePicker()
                                            .pickImage(
                                              source: ImageSource.gallery,
                                            );
                                        if (picked == null) {
                                          return;
                                        }
                                        setDialogState(() {
                                          isUploadingProof = true;
                                          pickedFileName = picked.name;
                                        });
                                        try {
                                          final storedFileName =
                                              await uploadService
                                                  .uploadXFile(
                                                    file: picked,
                                                    category: 'payment-proofs',
                                                  )
                                                  .then(
                                                    (value) => value.fileName,
                                                  );
                                          if (!context.mounted) {
                                            return;
                                          }
                                          if (sheetRootContext.mounted) {
                                            setDialogState(() {
                                              proofController.text =
                                                  storedFileName;
                                            });
                                          }
                                          ScaffoldMessenger.of(context)
                                            ..hideCurrentSnackBar()
                                            ..showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  texts.proofAttachedSuccess(
                                                    picked.name,
                                                  ),
                                                ),
                                              ),
                                            );
                                        } catch (error) {
                                          if (!context.mounted) {
                                            return;
                                          }
                                          ScaffoldMessenger.of(context)
                                            ..hideCurrentSnackBar()
                                            ..showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  texts.proofUploadFailed(
                                                    error,
                                                  ),
                                                ),
                                              ),
                                            );
                                        } finally {
                                          if (sheetRootContext.mounted) {
                                            setDialogState(() {
                                              isUploadingProof = false;
                                            });
                                          }
                                        }
                                      },
                                icon: isUploadingProof
                                    ? const SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.2,
                                        ),
                                      )
                                    : const Icon(
                                        Icons.attach_file_outlined,
                                        size: 18,
                                      ),
                                label: Text(
                                  isUploadingProof
                                      ? texts.attachingProofLabel
                                      : (pickedFileName ??
                                            texts.attachProofButton),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (proofController.text.trim().isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Text(
                                  texts.proofStoredLabel(
                                    proofController.text.trim(),
                                  ),
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: colors.onSurfaceVariant,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        LayoutBuilder(
                          builder: (context, constraints) {
                            final compact = constraints.maxWidth < 420;
                            if (compact) {
                              return Column(
                                children: [
                                  SizedBox(
                                    width: double.infinity,
                                    child: OutlinedButton(
                                      onPressed:
                                          isSubmitting || isUploadingProof
                                          ? null
                                          : () => Navigator.of(
                                              sheetRootContext,
                                            ).pop(),
                                      child: Text(texts.cancelButton),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  SizedBox(
                                    width: double.infinity,
                                    child: FilledButton(
                                      onPressed:
                                          isSubmitting || isUploadingProof
                                          ? null
                                          : () async {
                                              final parsedAmount =
                                                  int.tryParse(
                                                    amountController.text
                                                        .trim(),
                                                  ) ??
                                                  0;
                                              if (parsedAmount <= 0) {
                                                ScaffoldMessenger.of(context)
                                                  ..hideCurrentSnackBar()
                                                  ..showSnackBar(
                                                    SnackBar(
                                                      content: Text(
                                                        texts
                                                            .amountMustBePositive,
                                                      ),
                                                    ),
                                                  );
                                                return;
                                              }
                                              if (parsedAmount >
                                                  order.outstandingAmount) {
                                                ScaffoldMessenger.of(context)
                                                  ..hideCurrentSnackBar()
                                                  ..showSnackBar(
                                                    SnackBar(
                                                      content: Text(
                                                        texts.amountExceeded(
                                                          formatVnd(
                                                            order
                                                                .outstandingAmount,
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  );
                                                return;
                                              }

                                              if (parsedAmount >=
                                                  _DebtTexts
                                                      .largePaymentConfirmThreshold) {
                                                final confirmLargePayment =
                                                    await _confirmLargePayment(
                                                      context: context,
                                                      amount: parsedAmount,
                                                      orderId: order.id,
                                                      texts: texts,
                                                    );
                                                if (!context.mounted) {
                                                  return;
                                                }
                                                if (confirmLargePayment !=
                                                    true) {
                                                  return;
                                                }
                                              }

                                              setDialogState(
                                                () => isSubmitting = true,
                                              );
                                              final orderController =
                                                  OrderScope.of(context);
                                              final success =
                                                  await orderController
                                                      .recordPayment(
                                                        orderId: order.id,
                                                        amount: parsedAmount,
                                                        channel: channel,
                                                        note:
                                                            noteController.text
                                                                .trim()
                                                                .isEmpty
                                                            ? null
                                                            : noteController
                                                                  .text
                                                                  .trim(),
                                                        proofFileName:
                                                            proofController.text
                                                                .trim()
                                                                .isEmpty
                                                            ? null
                                                            : proofController
                                                                  .text
                                                                  .trim(),
                                                      );
                                              setDialogState(
                                                () => isSubmitting = false,
                                              );

                                              if (!context.mounted) {
                                                return;
                                              }
                                              if (!success) {
                                                ScaffoldMessenger.of(context)
                                                  ..hideCurrentSnackBar()
                                                  ..showSnackBar(
                                                    SnackBar(
                                                      content: Text(
                                                        orderControllerErrorMessage(
                                                          orderController
                                                              .lastActionMessage,
                                                          isEnglish:
                                                              texts.isEnglish,
                                                        ),
                                                      ),
                                                    ),
                                                  );
                                                return;
                                              }

                                              Navigator.of(
                                                sheetRootContext,
                                              ).pop();
                                              ScaffoldMessenger.of(context)
                                                ..hideCurrentSnackBar()
                                                ..showSnackBar(
                                                  SnackBar(
                                                    content: Text(
                                                      texts
                                                          .paymentRecordedSuccess(
                                                            amount: formatVnd(
                                                              parsedAmount,
                                                            ),
                                                            orderId: order.id,
                                                          ),
                                                    ),
                                                  ),
                                                );
                                            },
                                      child: isSubmitting
                                          ? const SizedBox(
                                              width: 18,
                                              height: 18,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2.4,
                                              ),
                                            )
                                          : Text(texts.confirmButton),
                                    ),
                                  ),
                                ],
                              );
                            }

                            return Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: isSubmitting || isUploadingProof
                                        ? null
                                        : () => Navigator.of(
                                            sheetRootContext,
                                          ).pop(),
                                    child: Text(texts.cancelButton),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: FilledButton(
                                    onPressed: isSubmitting || isUploadingProof
                                        ? null
                                        : () async {
                                            final parsedAmount =
                                                int.tryParse(
                                                  amountController.text.trim(),
                                                ) ??
                                                0;
                                            if (parsedAmount <= 0) {
                                              ScaffoldMessenger.of(context)
                                                ..hideCurrentSnackBar()
                                                ..showSnackBar(
                                                  SnackBar(
                                                    content: Text(
                                                      texts
                                                          .amountMustBePositive,
                                                    ),
                                                  ),
                                                );
                                              return;
                                            }
                                            if (parsedAmount >
                                                order.outstandingAmount) {
                                              ScaffoldMessenger.of(context)
                                                ..hideCurrentSnackBar()
                                                ..showSnackBar(
                                                  SnackBar(
                                                    content: Text(
                                                      texts.amountExceeded(
                                                        formatVnd(
                                                          order
                                                              .outstandingAmount,
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                );
                                              return;
                                            }

                                            if (parsedAmount >=
                                                _DebtTexts
                                                    .largePaymentConfirmThreshold) {
                                              final confirmLargePayment =
                                                  await _confirmLargePayment(
                                                    context: context,
                                                    amount: parsedAmount,
                                                    orderId: order.id,
                                                    texts: texts,
                                                  );
                                              if (!context.mounted) {
                                                return;
                                              }
                                              if (confirmLargePayment != true) {
                                                return;
                                              }
                                            }

                                            setDialogState(
                                              () => isSubmitting = true,
                                            );
                                            final orderController =
                                                OrderScope.of(context);
                                            final success =
                                                await orderController
                                                    .recordPayment(
                                                      orderId: order.id,
                                                      amount: parsedAmount,
                                                      channel: channel,
                                                      note:
                                                          noteController.text
                                                              .trim()
                                                              .isEmpty
                                                          ? null
                                                          : noteController.text
                                                                .trim(),
                                                      proofFileName:
                                                          proofController.text
                                                              .trim()
                                                              .isEmpty
                                                          ? null
                                                          : proofController.text
                                                                .trim(),
                                                    );
                                            setDialogState(
                                              () => isSubmitting = false,
                                            );

                                            if (!context.mounted) {
                                              return;
                                            }
                                            if (!success) {
                                              ScaffoldMessenger.of(context)
                                                ..hideCurrentSnackBar()
                                                ..showSnackBar(
                                                  SnackBar(
                                                    content: Text(
                                                      orderControllerErrorMessage(
                                                        orderController
                                                            .lastActionMessage,
                                                        isEnglish:
                                                            texts.isEnglish,
                                                      ),
                                                    ),
                                                  ),
                                                );
                                              return;
                                            }

                                            Navigator.of(
                                              sheetRootContext,
                                            ).pop();
                                            ScaffoldMessenger.of(context)
                                              ..hideCurrentSnackBar()
                                              ..showSnackBar(
                                                SnackBar(
                                                  content: Text(
                                                    texts
                                                        .paymentRecordedSuccess(
                                                          amount: formatVnd(
                                                            parsedAmount,
                                                          ),
                                                          orderId: order.id,
                                                        ),
                                                  ),
                                                ),
                                              );
                                          },
                                    child: isSubmitting
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2.4,
                                            ),
                                          )
                                        : Text(texts.confirmButton),
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );

    amountController.dispose();
    noteController.dispose();
    proofController.dispose();
  }

  Future<bool?> _confirmLargePayment({
    required BuildContext context,
    required int amount,
    required String orderId,
    required _DebtTexts texts,
  }) {
    return showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return RepaintBoundary(
          child: AlertDialog(
            scrollable: true,
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 20,
            ),
            title: Text(texts.largePaymentConfirmTitle),
            content: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Text(
                texts.largePaymentConfirmMessage(
                  amount: formatVnd(amount),
                  orderId: orderId,
                ),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: Text(texts.cancelButton),
              ),
              FilledButton(
                onPressed: () => Navigator.of(dialogContext).pop(true),
                child: Text(texts.continueButton),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _InfoStrip extends StatelessWidget {
  const _InfoStrip({required this.items});

  final List<_InfoStripItem> items;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 360;
        if (compact) {
          return Column(
            children: [
              for (var i = 0; i < items.length; i++) ...[
                _InfoStripCell(item: items[i]),
                if (i != items.length - 1) const SizedBox(height: 10),
              ],
            ],
          );
        }

        return Row(
          children: [
            for (var i = 0; i < items.length; i++) ...[
              Expanded(child: _InfoStripCell(item: items[i])),
              if (i != items.length - 1) const SizedBox(width: 10),
            ],
          ],
        );
      },
    );
  }
}

class _InfoStripItem {
  const _InfoStripItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;
}

class _InfoStripCell extends StatelessWidget {
  const _InfoStripCell({required this.item});

  final _InfoStripItem item;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: colors.surface,
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(item.icon, size: 18, color: colors.onSurfaceVariant),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.label,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  item.value,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final chipBg = colors.primaryContainer.withValues(alpha: 0.42);
    final chipText = colors.primary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: chipBg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: chipText.withValues(alpha: 0.22)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: chipText,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _PaymentHistoryCard extends StatelessWidget {
  const _PaymentHistoryCard({required this.payment, required this.texts});

  final DebtPaymentRecord payment;
  final _DebtTexts texts;

  IconData _iconForChannel(String channel) {
    final normalized = channel.toLowerCase();
    if (normalized.contains('bank transfer') ||
        normalized.contains('chuyển khoản')) {
      return Icons.account_balance_outlined;
    }
    if (normalized.contains('cash') ||
        normalized.contains('tiền mặt') ||
        normalized.contains('tien mat')) {
      return Icons.money_outlined;
    }
    if (normalized.contains('offset') ||
        normalized.contains('debt') ||
        normalized.contains('bù trừ') ||
        normalized.contains('bu tru')) {
      return Icons.swap_horiz_outlined;
    }
    return Icons.payments_outlined;
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final channel = texts.paymentChannelDisplay(payment.channel);

    return Semantics(
      container: true,
      label: texts.paymentHistorySemantics(
        orderId: payment.orderId,
        amount: formatVnd(payment.amount),
        channel: channel,
      ),
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: colors.outlineVariant.withValues(alpha: 0.6)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: colors.primaryContainer.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      _iconForChannel(channel),
                      size: 18,
                      color: colors.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          texts.orderPrefix(payment.orderId),
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colors.onSurfaceVariant,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          formatVnd(payment.amount),
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(
                                color: colors.primary,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                      ],
                    ),
                  ),
                  if (payment.proofFileName != null)
                    Tooltip(
                      message: payment.proofFileName!,
                      child: Icon(
                        Icons.attachment_outlined,
                        size: 20,
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _HistoryChip(
                    label: channel,
                    backgroundColor: colors.secondaryContainer.withValues(
                      alpha: 0.7,
                    ),
                    foregroundColor: colors.onSecondaryContainer,
                  ),
                  _HistoryChip(
                    label: formatDateTime(payment.paidAt),
                    backgroundColor: colors.surfaceContainerHighest.withValues(
                      alpha: 0.45,
                    ),
                    foregroundColor: colors.onSurfaceVariant,
                  ),
                ],
              ),
              if (payment.note != null && payment.note!.trim().isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  texts.noteValue(payment.note!.trim()),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _HistoryChip extends StatelessWidget {
  const _HistoryChip({
    required this.label,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  final String label;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: foregroundColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _EmptyStateCard extends StatelessWidget {
  const _EmptyStateCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: colors.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: colors.primaryContainer.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(16),
              ),
              alignment: Alignment.center,
              child: Icon(icon, size: 24, color: colors.onPrimaryContainer),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.onSurfaceVariant,
                height: 1.45,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DebtTexts {
  _DebtTexts({required this.isEnglish});

  static const int largePaymentConfirmThreshold = 50000000;

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Receivables' : 'Công nợ phải thu';

  String get heroTitle => isEnglish ? 'Track receivables' : 'Theo dõi công nợ';

  String get heroSubtitle => isEnglish
      ? 'Review outstanding orders, record incoming payments and monitor credit usage in one place.'
      : 'Theo dõi các đơn còn nợ, ghi nhận thanh toán và kiểm soát hạn mức công nợ tại một nơi.';

  String get insightPanelTitle =>
      isEnglish ? 'Receivable insights' : 'Tổng quan công nợ';

  String get insightPanelSubtitle => isEnglish
      ? 'Use these indicators to understand exposure, average debt size and payment activity.'
      : 'Dùng các chỉ số này để theo dõi mức dư nợ, quy mô công nợ trung bình và hoạt động thanh toán.';

  String get debtOrdersSectionTitle =>
      isEnglish ? 'Open receivable orders' : 'Đơn hàng còn phải thu';

  String get debtOrdersSectionSubtitle => isEnglish
      ? 'Completed credit orders that still have an unpaid receivable.'
      : 'Các đơn dùng phương thức công nợ vẫn còn số dư chưa thanh toán.';

  String get paymentHistorySectionTitle =>
      isEnglish ? 'Payment history' : 'Lịch sử thanh toán';

  String get paymentHistorySectionSubtitle => isEnglish
      ? 'Recorded payments for credit orders will appear here.'
      : 'Các khoản thanh toán đã ghi nhận cho đơn công nợ sẽ hiển thị tại đây.';

  String get debtOrdersEmptyTitle =>
      isEnglish ? 'No outstanding orders' : 'Không còn đơn nợ';

  String get debtOrdersEmptySubtitle => isEnglish
      ? 'All eligible orders are fully paid.'
      : 'Tất cả đơn đủ điều kiện đã được thanh toán hết.';

  String get paymentHistoryEmptyTitle =>
      isEnglish ? 'No payment history' : 'Chưa có lịch sử thanh toán';

  String get paymentHistoryEmptySubtitle => isEnglish
      ? 'Recorded payments will appear here.'
      : 'Các giao dịch ghi nhận thanh toán sẽ hiển thị tại đây.';

  String get totalDebtMetricLabel =>
      isEnglish ? 'Open receivable' : 'Công nợ phải thu';

  String get averageDebtMetricLabel =>
      isEnglish ? 'Average receivable / order' : 'Công nợ trung bình / đơn';

  String get recordedPaymentsMetricLabel =>
      isEnglish ? 'Recorded payments' : 'Lượt thanh toán đã ghi nhận';

  String recordedPaymentsValue(int count) =>
      isEnglish ? '$count entries' : '$count lượt';

  String get creditUtilizationLabel =>
      isEnglish ? 'Credit utilization' : 'Mức sử dụng hạn mức';

  String creditUtilizationDescription({
    required int creditLimit,
    required int ratioPercent,
  }) {
    if (creditLimit <= 0) {
      return isEnglish
          ? 'Credit limit has not been configured for this dealer profile yet.'
          : 'Hồ sơ đại lý hiện chưa được cấu hình hạn mức công nợ.';
    }
    return isEnglish
        ? 'Using $ratioPercent% of the configured credit limit.'
        : 'Đang sử dụng $ratioPercent% hạn mức công nợ đã cấu hình.';
  }

  String get metricUnavailableValue => isEnglish ? 'Unavailable' : 'Chưa có';

  String get orderDateLabel => isEnglish ? 'Order date' : 'Ngày đặt';

  String get paymentMethodLabel => isEnglish ? 'Payment method' : 'Phương thức';

  String get totalAmountLabel => isEnglish ? 'Order total' : 'Tổng đơn';

  String get paidAmountLabel => isEnglish ? 'Paid amount' : 'Đã thanh toán';

  String get viewOrderButton => isEnglish ? 'View order' : 'Xem đơn';

  String get recordPaymentButton =>
      isEnglish ? 'Record payment' : 'Ghi nhận thanh toán';

  String get recordPaymentDialogTitle =>
      isEnglish ? 'Record debt payment' : 'Ghi nhận thanh toán';

  String get paymentAmountLabel =>
      isEnglish ? 'Payment amount' : 'Số tiền thanh toán';

  String get paymentChannelLabel =>
      isEnglish ? 'Payment channel' : 'Kênh thanh toán';

  String get noteLabel => isEnglish ? 'Note' : 'Ghi chú';

  String get proofSectionTitle =>
      isEnglish ? 'Payment proof' : 'Chứng từ thanh toán';

  String get proofSectionSubtitle => isEnglish
      ? 'Attach an image file if you want to keep supporting proof for this payment entry.'
      : 'Đính kèm hình ảnh nếu bạn muốn lưu chứng từ hỗ trợ cho lần ghi nhận thanh toán này.';

  String get attachProofButton =>
      isEnglish ? 'Attach payment proof' : 'Đính kèm chứng từ';

  String get attachingProofLabel =>
      isEnglish ? 'Uploading proof...' : 'Đang tải chứng từ...';

  String proofStoredLabel(String fileName) =>
      isEnglish ? 'Stored proof: $fileName' : 'Chứng từ đã lưu: $fileName';

  String get cancelButton => isEnglish ? 'Cancel' : 'Hủy';

  String get confirmButton => isEnglish ? 'Confirm' : 'Xác nhận';

  String get continueButton => isEnglish ? 'Continue' : 'Tiếp tục';

  String get amountPreviewPlaceholder => '0 đ';

  String get amountMustBePositive =>
      isEnglish ? 'Amount must be greater than 0.' : 'Số tiền phải lớn hơn 0.';

  String get largePaymentConfirmTitle =>
      isEnglish ? 'Confirm large payment' : 'Xác nhận khoản thanh toán lớn';

  String get creditLimitLabel => isEnglish ? 'Credit limit' : 'Hạn mức công nợ';

  String creditLimitValue(int amount) {
    if (amount <= 0) {
      return isEnglish ? 'Not set' : 'Chưa cài đặt';
    }
    return formatVnd(amount);
  }

  String creditLimitHeroLabel(int amount) {
    if (amount <= 0) {
      return isEnglish ? 'Credit limit not set' : 'Chưa có hạn mức công nợ';
    }
    return isEnglish
        ? 'Credit limit ${formatVnd(amount)}'
        : 'Hạn mức ${formatVnd(amount)}';
  }

  String latestPaymentLabel(String value) =>
      isEnglish ? 'Latest payment $value' : 'Thanh toán gần nhất $value';

  String summarySemantics({required String amount, required int orderCount}) {
    if (isEnglish) {
      return 'Open receivable $amount across $orderCount orders.';
    }
    return 'Tổng công nợ $amount, gồm $orderCount đơn hàng.';
  }

  String debtCardSemantics({
    required String orderId,
    required String outstanding,
  }) {
    if (isEnglish) {
      return 'Order $orderId has outstanding amount $outstanding.';
    }
    return 'Đơn $orderId còn nợ $outstanding.';
  }

  String paymentHistorySemantics({
    required String orderId,
    required String amount,
    required String channel,
  }) {
    if (isEnglish) {
      return 'Payment $amount for order $orderId via $channel.';
    }
    return 'Thanh toán $amount cho đơn $orderId qua kênh $channel.';
  }

  String outstandingOrdersLabel(int count) {
    if (isEnglish) {
      return '$count outstanding orders';
    }
    return '$count đơn còn nợ';
  }

  String outstandingAmountLabel(int amount) {
    final value = formatVnd(amount);
    if (isEnglish) {
      return 'Outstanding: $value';
    }
    return 'Còn nợ: $value';
  }

  String paymentProgress({required String paid, required String total}) {
    if (isEnglish) {
      return 'Paid $paid / $total';
    }
    return 'Đã thanh toán $paid / $total';
  }

  String orderPrefix(String orderId) {
    if (isEnglish) {
      return 'Order $orderId';
    }
    return 'Đơn $orderId';
  }

  String noteValue(String note) {
    if (isEnglish) {
      return 'Note: $note';
    }
    return 'Ghi chú: $note';
  }

  String orderIdAndOutstanding({
    required String orderId,
    required String outstanding,
  }) {
    if (isEnglish) {
      return 'Order: $orderId\nOutstanding: $outstanding';
    }
    return 'Đơn: $orderId\nCòn nợ: $outstanding';
  }

  String maxAmountHint(String maxAmount) {
    if (isEnglish) {
      return 'Maximum $maxAmount';
    }
    return 'Tối đa $maxAmount';
  }

  String amountPreview(String value) {
    if (isEnglish) {
      return 'Formatted amount: $value';
    }
    return 'Số tiền đã định dạng: $value';
  }

  String amountExceeded(String maxAmount) {
    if (isEnglish) {
      return 'Amount cannot exceed $maxAmount.';
    }
    return 'Số tiền không được vượt quá $maxAmount.';
  }

  String paymentRecordedSuccess({
    required String amount,
    required String orderId,
  }) {
    if (isEnglish) {
      return 'Recorded payment $amount for order $orderId.';
    }
    return 'Đã ghi nhận thanh toán $amount cho đơn $orderId.';
  }

  String proofAttachedSuccess(String fileName) {
    if (isEnglish) {
      return 'Attached proof $fileName.';
    }
    return 'Đã đính kèm chứng từ $fileName.';
  }

  String proofUploadFailed(Object error) => isEnglish
      ? uploadServiceErrorMessage(error, isEnglish: true)
      : uploadServiceErrorMessage(error, isEnglish: false);

  String largePaymentConfirmMessage({
    required String amount,
    required String orderId,
  }) {
    if (isEnglish) {
      return 'You are recording a large payment of $amount for order $orderId. Continue?';
    }
    return 'Bạn đang ghi nhận khoản thanh toán lớn $amount cho đơn $orderId. Tiếp tục?';
  }

  String paymentStatusLabel(OrderPaymentStatus status) {
    if (isEnglish) {
      switch (status) {
        case OrderPaymentStatus.cancelled:
          return 'Cancelled';
        case OrderPaymentStatus.failed:
          return 'Failed';
        case OrderPaymentStatus.pending:
          return 'Unpaid';
        case OrderPaymentStatus.paid:
          return 'Paid';
        case OrderPaymentStatus.debtRecorded:
          return 'Open receivable';
      }
    }
    return status.label;
  }

  String paymentMethod(BuildContext context, OrderPaymentMethod method) =>
      method.localizedLabel(context);

  String paymentChannelDisplay(String channel) {
    if (!isEnglish) {
      return channel;
    }
    final normalized = channel.trim().toLowerCase();
    if (normalized.contains('bank transfer') ||
        normalized.contains('chuyển khoản')) {
      return 'Bank transfer';
    }
    if (normalized.contains('cash') ||
        normalized.contains('tiền mặt') ||
        normalized.contains('tien mat')) {
      return 'Cash';
    }
    if (normalized.contains('offset') ||
        normalized.contains('debt') ||
        normalized.contains('bù trừ') ||
        normalized.contains('bu tru')) {
      return 'Debt offset';
    }
    return channel;
  }

  String showAllPaymentsLabel(int count) =>
      isEnglish ? 'Show all ($count)' : 'Xem tất cả ($count)';

  List<String> get paymentChannels {
    if (isEnglish) {
      return const <String>['Bank transfer', 'Cash', 'Debt offset'];
    }
    return const <String>['Chuyển khoản', 'Tiền mặt', 'Bù trừ công nợ'];
  }
}
