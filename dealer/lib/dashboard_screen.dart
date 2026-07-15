import 'dart:async';
import 'dart:math' as math;

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dealer_navigation.dart';
import 'global_search.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'widgets/notification_icon_button.dart';
import 'utils.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/skeleton_box.dart';
import 'inventory_screen.dart';

part 'dashboard_screen_support.dart';
part 'dashboard_texts.dart';
part 'dashboard_summary_cards.dart';
part 'dashboard_overview_cards.dart';
part 'dashboard_revenue_chart.dart';
part 'dashboard_order_widgets.dart';
part 'dashboard_inventory_widgets.dart';
part 'dashboard_common_widgets.dart';
part 'dashboard_activation_trend_chart.dart';
part 'dashboard_warranty_donut_chart.dart';
part 'dashboard_top_customer.dart';

const _lowStockAlertThreshold = kLowStockThreshold;
const _mobileBreakpoint = AppBreakpoints.phone;
const _tabletBreakpoint = AppBreakpoints.tablet;
const _desktopBreakpoint = AppBreakpoints.desktop;
const _overviewCompactBreakpoint = 480.0;
const _donutStackBreakpoint = 600.0;
const _maxDashboardContentWidth = 1280.0;
const _dashboardCardRadius = 20.0;
const _dashboardCardPadding = 18.0;
const _dashboardSectionSpacing = 16.0;
const _dashboardCompactSpacing = 12.0;
const _dashboardGridSpacing = 12.0;

Color _dashboardMutedText(BuildContext context) =>
    Theme.of(context).colorScheme.onSurfaceVariant;

ShapeBorder _dashboardCardShape(
  BuildContext context, {
  double radius = _dashboardCardRadius,
  Color? borderColor,
  double borderWidth = 1,
}) {
  return RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(radius),
    side: BorderSide(
      color:
          borderColor ??
          Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.6),
      width: borderWidth,
    ),
  );
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    this.onSwitchTab,
    this.onOpenPendingOrders,
  });

  final ValueChanged<int>? onSwitchTab;
  final VoidCallback? onOpenPendingOrders;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  _DashboardLoadState _loadState = _DashboardLoadState.loading;
  String? _loadErrorMessage;
  String? _syncWarningMessage;
  _DashboardTimeFilter _timeFilter = _DashboardTimeFilter.month;
  DateTime _selectedPeriod = DateTime.now();

  // Snapshot cache avoids recomputation when inputs have not changed.
  _DashboardSnapshot? _cachedSnapshot;
  List<Order>? _lastSnapshotOrders;
  List<WarrantyActivationRecord>? _lastSnapshotActivations;
  _DashboardTimeFilter? _lastSnapshotFilter;
  DateTime? _lastSnapshotPeriod;
  int _snapshotComputeToken = 0;
  List<_DashboardLowStockItem>? _cachedLowStockProducts;
  List<Order>? _lastLowStockOrders;
  List<WarrantyActivationRecord>? _lastLowStockActivations;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        unawaited(_loadDashboardState());
      }
    });
  }

  Future<void> _loadDashboardState({bool showLoadingState = true}) async {
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final loadErrorMessage = texts.loadErrorMessage;
    final orderController = OrderScope.of(context);
    final warrantyController = WarrantyScope.of(context);
    if (showLoadingState && mounted) {
      setState(() {
        _loadState = _DashboardLoadState.loading;
        _loadErrorMessage = null;
        _syncWarningMessage = null;
      });
    }

    await Future.wait<void>([
      orderController.refresh(),
      warrantyController.load(forceRefresh: true),
    ]);
    if (!mounted) {
      return;
    }

    final warnings = <String>{};
    if (orderController.lastActionMessage != null) {
      warnings.add(
        orderControllerErrorMessage(
          orderController.lastActionMessage,
          isEnglish: texts.isEnglish,
        ),
      );
    }
    if (warrantyController.lastSyncMessage != null) {
      warnings.add(
        warrantySyncErrorMessage(
          warrantyController.lastSyncMessage,
          isEnglish: texts.isEnglish,
        ),
      );
    }
    final warningMessage = warnings.isEmpty ? null : warnings.join('\n');
    final shouldShowError =
        orderController.orders.isEmpty &&
        warrantyController.activations.isEmpty &&
        warnings.isNotEmpty;

    setState(() {
      _cachedSnapshot = null;
      _lastSnapshotOrders = null;
      _lastSnapshotActivations = null;
      _lastSnapshotFilter = null;
      _lastSnapshotPeriod = null;
      _cachedLowStockProducts = null;
      _lastLowStockOrders = null;
      _lastLowStockActivations = null;
      _syncWarningMessage = warningMessage;
      _loadState = shouldShowError
          ? _DashboardLoadState.error
          : _DashboardLoadState.ready;
      _loadErrorMessage = shouldShowError
          ? (warningMessage ?? loadErrorMessage)
          : null;
    });
  }

  Future<void> _recomputeSnapshotAsync(_DashboardSnapshotArgs args) async {
    final token = ++_snapshotComputeToken;
    final snapshot = await compute(_computeDashboardSnapshotIsolate, args);
    if (!mounted || token != _snapshotComputeToken) return;
    setState(() => _cachedSnapshot = snapshot);
  }

  void _openCreateOrderFlow() {
    if (widget.onSwitchTab != null) {
      widget.onSwitchTab!(0);
      return;
    }
    context.pushDealerProducts();
  }

  void _openInventoryScreen() {
    if (widget.onSwitchTab != null) {
      widget.onSwitchTab!(3);
      return;
    }
    context.pushDealerInventory();
  }

  void _openLowStockInventoryScreen() {
    context.pushDealerInventory(filter: InventoryStockFilter.lowStock);
  }

  void _openOrdersScreen() {
    if (widget.onSwitchTab != null) {
      widget.onSwitchTab!(1);
      return;
    }
    context.pushDealerOrders();
  }

  void _openPendingOrdersScreen() {
    if (widget.onOpenPendingOrders != null) {
      widget.onOpenPendingOrders!();
      return;
    }
    context.pushDealerOrders();
  }

  void _openOrderDetail(String orderId) {
    context.pushDealerOrderDetail(orderId);
  }

  Future<void> _openWarrantyHub() async {
    await Future.wait<void>([
      OrderScope.of(context).refresh(),
      WarrantyScope.of(context).load(forceRefresh: true),
    ]);
    if (!mounted) {
      return;
    }
    context.pushDealerWarrantyHub();
  }

  @override
  Widget build(BuildContext context) {
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final orderController = OrderScope.of(context);
    final warrantyCtrl = WarrantyScope.of(context);
    final snapshotOrdersForLowStock = orderController.orders;
    final snapshotActivationsForLowStock = warrantyCtrl.activations;
    if (_cachedLowStockProducts == null ||
        !identical(_lastLowStockOrders, snapshotOrdersForLowStock) ||
        !identical(_lastLowStockActivations, snapshotActivationsForLowStock)) {
      _lastLowStockOrders = snapshotOrdersForLowStock;
      _lastLowStockActivations = snapshotActivationsForLowStock;
      _cachedLowStockProducts = _buildLowStockProducts(
        orderController: orderController,
        warrantyController: warrantyCtrl,
      );
    }
    final lowStockProducts = _cachedLowStockProducts!;
    final now = DateTime.now();
    final snapshotOrders = orderController.orders;
    final snapshotActivations = warrantyCtrl.activations;
    if (_cachedSnapshot == null ||
        !identical(_lastSnapshotOrders, snapshotOrders) ||
        !identical(_lastSnapshotActivations, snapshotActivations) ||
        _lastSnapshotFilter != _timeFilter ||
        _lastSnapshotPeriod != _selectedPeriod) {
      _lastSnapshotOrders = snapshotOrders;
      _lastSnapshotActivations = snapshotActivations;
      _lastSnapshotFilter = _timeFilter;
      _lastSnapshotPeriod = _selectedPeriod;
      if (snapshotOrders.length > 500) {
        unawaited(
          _recomputeSnapshotAsync(
            _DashboardSnapshotArgs(
              orders: snapshotOrders,
              activations: snapshotActivations,
              timeFilter: _timeFilter,
              selectedPeriod: _selectedPeriod,
              now: now,
              isEnglish: texts.isEnglish,
            ),
          ),
        );
      } else {
        _cachedSnapshot = _buildDashboardSnapshot(
          orders: snapshotOrders,
          activations: snapshotActivations,
          timeFilter: _timeFilter,
          selectedPeriod: _selectedPeriod,
          now: now,
          isEnglish: texts.isEnglish,
        );
      }
    }
    if (_cachedSnapshot == null) {
      return const _DashboardLoadingView(horizontalPadding: 16);
    }
    final snapshot = _cachedSnapshot!;
    final periodAnchor = snapshot.periodAnchor;
    final periodOrders = snapshot.periodOrders;
    final monthlyRevenue = snapshot.monthlyRevenue;
    final activationWindowDays = snapshot.activationWindowDays;
    final activationSeries = snapshot.activationSeries;
    final warrantyActivationSeries = snapshot.warrantyActivationSeries;
    final warrantyRanges = snapshot.warrantyRanges;
    final showWarrantyStatusCard = _shouldShowWarrantyStatusCard(
      warrantyActivationSeries,
    );
    final periodContextLabel = snapshot.periodContextLabel;
    final periodRevenue = snapshot.periodRevenue;
    final periodOrderCount = snapshot.periodOrderCount;
    final periodCompletedOrderCount = snapshot.periodCompletedOrderCount;
    final totalOutstandingAmount = snapshot.totalOutstandingAmount;
    final unreadNotificationCount =
        context
            .dependOnInheritedWidgetOfExactType<NotificationScope>()
            ?.notifier
            ?.unreadCount ??
        0;
    final periodUnitLabel = snapshot.periodUnitLabel;
    final dashboardLoadErrorMessage = texts.loadErrorMessage;
    final syncSummary = texts.dashboardSourceSummary(
      orderController.lastRemoteSyncAt == null
          ? null
          : formatDateTime(orderController.lastRemoteSyncAt!),
      warrantyCtrl.lastRemoteSyncAt == null
          ? null
          : formatDateTime(warrantyCtrl.lastRemoteSyncAt!),
    );
    final primaryTrackingCards = <Widget>[
      FadeSlideIn(
        delay: const Duration(milliseconds: 110),
        child: RepaintBoundary(
          child: _RevenueChartCard(
            data: monthlyRevenue,
            focusMonth: periodAnchor.month,
            displayYear: periodAnchor.year,
            onCreateOrder: _openCreateOrderFlow,
          ),
        ),
      ),
      FadeSlideIn(
        delay: const Duration(milliseconds: 115),
        child: RepaintBoundary(
          child: _OrderStatusDistributionCard(
            orders: periodOrders,
            onCreateOrder: _openCreateOrderFlow,
          ),
        ),
      ),
    ];
    final secondaryTrackingCards = <Widget>[
      FadeSlideIn(
        delay: const Duration(milliseconds: 125),
        child: RepaintBoundary(
          child: _LowStockPanel(
            products: lowStockProducts,
            onOpenInventory: _openInventoryScreen,
            onOpenLowStockInventory: _openLowStockInventoryScreen,
          ),
        ),
      ),
      FadeSlideIn(
        delay: const Duration(milliseconds: 130),
        child: RepaintBoundary(
          child: _ActivationTrendCard(
            data: activationSeries,
            windowDays: activationWindowDays,
          ),
        ),
      ),
      if (showWarrantyStatusCard)
        FadeSlideIn(
          delay: const Duration(milliseconds: 135),
          child: RepaintBoundary(
            child: _WarrantyStatusDonutCard(
              activations: warrantyActivationSeries,
              ranges: warrantyRanges,
              initialRange: warrantyRanges.last,
            ),
          ),
        ),
    ];

    final screenSize = MediaQuery.sizeOf(context);
    final screenWidth = screenSize.width;
    final isMobile = screenWidth < _mobileBreakpoint;
    final canMoveNextPeriod = _dashboardCanMoveToNextPeriod(
      periodAnchor,
      _timeFilter,
      now,
    );
    final horizontalPadding = screenWidth >= _desktopBreakpoint
        ? 24.0
        : isMobile
        ? 16.0
        : 20.0;
    final listBottomPadding = 24.0;
    final sectionSpacing = isMobile
        ? _dashboardCompactSpacing
        : _dashboardSectionSpacing;
    final timeFilterLabel = _timeFilter == _DashboardTimeFilter.month
        ? texts.filterByMonthLabel
        : texts.filterByQuarterLabel;
    Widget buildInsightGrid(List<Widget> cards) {
      return LayoutBuilder(
        builder: (context, constraints) {
          final cols = constraints.maxWidth >= _desktopBreakpoint
              ? 3
              : constraints.maxWidth >= _tabletBreakpoint
              ? 2
              : 1;
          final childWidth =
              (constraints.maxWidth - (cols - 1) * _dashboardGridSpacing) /
              cols;
          return Wrap(
            spacing: _dashboardGridSpacing,
            runSpacing: _dashboardGridSpacing,
            children: cards
                .map((card) => SizedBox(width: childWidth, child: card))
                .toList(growable: false),
          );
        },
      );
    }

    final Widget content;
    if (_loadState == _DashboardLoadState.loading) {
      content = _DashboardLoadingView(horizontalPadding: horizontalPadding);
    } else if (_loadState == _DashboardLoadState.error) {
      content = _DashboardErrorView(
        title: texts.dashboardErrorTitle,
        message: _loadErrorMessage ?? dashboardLoadErrorMessage,
        description: texts.dashboardErrorDescription,
        ctaLabel: texts.retryAction,
        ctaSemanticLabel: texts.retryDashboardSemantic,
        onRetry: () => unawaited(_loadDashboardState()),
        horizontalPadding: horizontalPadding,
      );
    } else {
      content = RefreshIndicator(
        onRefresh: () => _loadDashboardState(showLoadingState: false),
        child: ListView(
          key: const PageStorageKey<String>('dashboard-scroll'),
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(
            horizontalPadding,
            sectionSpacing,
            horizontalPadding,
            listBottomPadding,
          ),
          children: [
            FadeSlideIn(
              child: RepaintBoundary(
                child: _DashboardPeriodHeaderCard(
                  periodContextLabel: periodContextLabel,
                  filterLabel: timeFilterLabel,
                  compactPeriodLabel: _periodCompactLabelFor(
                    periodAnchor,
                    _timeFilter,
                  ),
                  summary: syncSummary,
                  previousLabel: texts.previousPeriodLabel,
                  nextLabel: texts.nextPeriodLabel,
                  onPreviousPeriod: _moveToPreviousPeriod,
                  onOpenTimeFilter: _openTimeFilterSheet,
                  onNextPeriod: canMoveNextPeriod ? _moveToNextPeriod : null,
                  warningMessage: _syncWarningMessage,
                ),
              ),
            ),
            SizedBox(height: sectionSpacing),
            FadeSlideIn(
              child: RepaintBoundary(
                child: _OverviewCard(
                  totalOutstandingAmount: totalOutstandingAmount,
                  periodRevenue: periodRevenue,
                  periodOrders: periodOrderCount,
                  periodCompletedOrders: periodCompletedOrderCount,
                  periodUnitLabel: periodUnitLabel,
                  contextLabel: periodContextLabel,
                  texts: texts,
                ),
              ),
            ),
            SizedBox(height: sectionSpacing),
            FadeSlideIn(
              delay: const Duration(milliseconds: 70),
              child: RepaintBoundary(
                child: _DashboardQuickActionsCard(
                  onCreateOrder: _openCreateOrderFlow,
                  onOpenInventory: _openInventoryScreen,
                  onOpenWarrantyHub: _openWarrantyHub,
                  title: texts.quickActionsTitle,
                  subtitle: texts.quickActionsSubtitle,
                  createOrderLabel: texts.createOrderLabel,
                  inventoryLabel: texts.inventoryLabel,
                  warrantyLabel: texts.warrantyLabel,
                ),
              ),
            ),
            SizedBox(height: sectionSpacing),
            FadeSlideIn(
              delay: const Duration(milliseconds: 95),
              child: _SectionTitle(
                title: texts.trackingSectionTitle,
                subtitle: texts.trackingSectionSubtitle,
              ),
            ),
            const SizedBox(height: 8),
            if (isMobile) ...[
              ...primaryTrackingCards.map(
                (card) => Padding(
                  padding: const EdgeInsets.only(
                    bottom: _dashboardCompactSpacing,
                  ),
                  child: card,
                ),
              ),
              _DashboardExpandableInsights(
                title: texts.mobileInsightsTitle,
                subtitle: texts.mobileInsightsSubtitle,
                children: secondaryTrackingCards,
              ),
            ] else ...[
              buildInsightGrid(primaryTrackingCards),
              SizedBox(height: sectionSpacing),
              _DashboardExpandableInsights(
                storageKey: 'dashboard-desktop-insights',
                title: texts.secondaryInsightsTitle,
                subtitle: texts.secondaryInsightsSubtitle,
                children: secondaryTrackingCards,
              ),
            ],
            SizedBox(height: sectionSpacing),
            FadeSlideIn(
              delay: const Duration(milliseconds: 140),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isCompactHeader = constraints.maxWidth < 360;
                  final pendingCount = periodOrders
                      .where((o) => o.status == OrderStatus.pending)
                      .length;
                  final hasPending = pendingCount > 0;
                  final actionButton = TextButton.icon(
                    onPressed: _openOrdersScreen,
                    style: TextButton.styleFrom(
                      minimumSize: const Size(48, 48),
                      visualDensity: VisualDensity.compact,
                      foregroundColor: Theme.of(context).colorScheme.primary,
                    ),
                    icon: const Icon(Icons.open_in_new_rounded, size: 16),
                    label: Text(texts.viewAllAction),
                  );
                  final pendingButton = hasPending
                      ? FilledButton.tonalIcon(
                          onPressed: _openPendingOrdersScreen,
                          style: FilledButton.styleFrom(
                            minimumSize: const Size(0, 36),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            visualDensity: VisualDensity.compact,
                          ),
                          icon: const Icon(
                            Icons.pending_actions_rounded,
                            size: 16,
                          ),
                          label: Text(texts.pendingOrdersAction(pendingCount)),
                        )
                      : null;

                  if (periodOrders.isEmpty) {
                    return _SectionTitle(
                      title: texts.recentOrdersTitle,
                      subtitle: texts.recentOrdersSubtitle,
                    );
                  }
                  if (isCompactHeader) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _SectionTitle(
                          title: texts.recentOrdersTitle,
                          subtitle: texts.recentOrdersSubtitle,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            if (pendingButton != null) ...[
                              pendingButton,
                              const SizedBox(width: 8),
                            ],
                            actionButton,
                          ],
                        ),
                      ],
                    );
                  }
                  return Row(
                    children: [
                      Expanded(
                        child: _SectionTitle(
                          title: texts.recentOrdersTitle,
                          subtitle: texts.recentOrdersSubtitle,
                        ),
                      ),
                      if (pendingButton != null) ...[
                        pendingButton,
                        const SizedBox(width: 8),
                      ],
                      actionButton,
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            if (periodOrders.isEmpty)
              _EmptyCard(
                title: texts.recentOrdersTitle,
                message: texts.recentOrdersEmptyMessage,
                description: texts.recentOrdersEmptyDescription,
                icon: Icons.receipt_long_outlined,
                ctaLabel: texts.createOrderAction,
                ctaSemanticLabel: texts.createOrderSemanticLabel,
                ctaIcon: Icons.add_shopping_cart_outlined,
                onCtaPressed: _openCreateOrderFlow,
              )
            else ...[
              ...() {
                // Pending orders first, then others sorted by newest
                final pending = periodOrders
                    .where((o) => o.status == OrderStatus.pending)
                    .toList(growable: false);
                final others = periodOrders
                    .where((o) => o.status != OrderStatus.pending)
                    .toList(growable: false);
                final sorted = [...pending, ...others].take(5).toList();
                return sorted.asMap().entries.map((entry) {
                  final index = entry.key;
                  final order = entry.value;
                  final shouldAnimate = index < 4;
                  return FadeSlideIn(
                    animate: shouldAnimate,
                    delay: shouldAnimate
                        ? Duration(milliseconds: 170 + 30 * index)
                        : Duration.zero,
                    child: Padding(
                      padding: EdgeInsets.only(
                        bottom: index == math.min(sorted.length, 5) - 1
                            ? 0
                            : 10,
                      ),
                      child: RepaintBoundary(
                        child: _RecentOrderCard(
                          order: order,
                          onTap: () => _openOrderDetail(order.id),
                          processLabel: texts.processOrderLabel,
                        ),
                      ),
                    ),
                  );
                });
              }(),
            ],
          ],
        ),
      );
    }

    final mediaQuery = MediaQuery.of(context);
    final textScale = mediaQuery.textScaler.scale(1);
    final dashboardTextScaler = textScale.isFinite && textScale > 1.4
        ? const TextScaler.linear(1.4)
        : mediaQuery.textScaler;

    return MediaQuery(
      data: mediaQuery.copyWith(textScaler: dashboardTextScaler),
      child: Scaffold(
        appBar: AppBar(
          title: BrandAppBarTitle(texts.appBarTitle, logoSize: 30, logoGap: 4),
          actions: [
            const GlobalSearchIconButton(),
            NotificationIconButton(
              count: unreadNotificationCount,
              onPressed: () {
                context.pushDealerNotifications();
              },
            ),
          ],
        ),
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              maxWidth: _maxDashboardContentWidth,
            ),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: KeyedSubtree(key: ValueKey(_loadState), child: content),
            ),
          ),
        ),
      ),
    );
  }

  void _moveToPreviousPeriod() {
    setState(() {
      _selectedPeriod = _dashboardPreviousPeriodStartForFilter(
        _selectedPeriod,
        _timeFilter,
      );
    });
  }

  void _moveToNextPeriod() {
    final now = DateTime.now();
    final periodAnchor = _dashboardNormalizePeriodAnchorForFilter(
      _selectedPeriod,
      _timeFilter,
      now: now,
    );
    if (!_dashboardCanMoveToNextPeriod(periodAnchor, _timeFilter, now)) {
      return;
    }
    setState(() {
      _selectedPeriod = _dashboardNextPeriodStartForFilter(
        periodAnchor,
        _timeFilter,
      );
    });
  }

  Future<void> _openTimeFilterSheet() async {
    final selection = await _showDashboardTimeFilterSheet(
      context: context,
      initialFilter: _timeFilter,
      selectedPeriod: _selectedPeriod,
      texts: _DashboardTexts(
        isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
      ),
    );
    if (!mounted || selection == null) {
      return;
    }
    setState(() {
      _timeFilter = selection.filter;
      _selectedPeriod = selection.period;
    });
  }
}
