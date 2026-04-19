import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'account_screen.dart';
import 'breakpoints.dart';
import 'dashboard_screen.dart';
import 'inventory_screen.dart';
import 'l10n/app_localizations.dart';
import 'orders_screen.dart';
import 'product_list_screen.dart';
import 'widgets/brand_identity.dart';

class DealerHomeShell extends StatefulWidget {
  const DealerHomeShell({super.key});

  @override
  State<DealerHomeShell> createState() => _DealerHomeShellState();
}

class _DealerHomeShellState extends State<DealerHomeShell> {
  // v1: initial 5-tab overview. Bump to v2 if onboarding content changes significantly.
  static const _onboardingSeenKey = 'onboarding_seen_v1';

  int _currentIndex = 0;
  final PageStorageBucket _pageStorageBucket = PageStorageBucket();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _maybeShowOnboarding();
    });
  }

  void _switchToTab(int index) {
    if (_currentIndex == index) {
      return;
    }
    setState(() => _currentIndex = index);
  }

  Future<void> _maybeShowOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    final seen = prefs.getBool(_onboardingSeenKey) ?? false;
    if (seen || !mounted) {
      return;
    }

    final l10n = AppLocalizations.of(context)!;
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        final colors = Theme.of(dialogContext).colorScheme;
        final isEnglish =
            Localizations.localeOf(dialogContext).languageCode == 'en';
        return RepaintBoundary(
          child: AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(28),
            ),
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 20,
            ),
            titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
            contentPadding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
            actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            title: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: colors.primaryContainer.withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    Icons.dashboard_customize_outlined,
                    color: colors.onPrimaryContainer,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(child: Text(l10n.welcomeTitle)),
              ],
            ),
            content: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isEnglish
                          ? '4T HITEK Dealer is tuned for the daily workflow of active dealers.'
                          : '4T HITEK Dealer được tối ưu cho luồng tác vụ hằng ngày của đại lý.',
                      style: Theme.of(dialogContext).textTheme.bodyMedium
                          ?.copyWith(
                            color: colors.onSurfaceVariant,
                            height: 1.45,
                          ),
                    ),
                    const SizedBox(height: 16),
                    _OnboardingStepTile(
                      icon: Icons.shopping_bag_outlined,
                      message: l10n.welcomeStepProducts,
                    ),
                    const SizedBox(height: 10),
                    _OnboardingStepTile(
                      icon: Icons.receipt_long_outlined,
                      message: l10n.welcomeStepOrders,
                    ),
                    const SizedBox(height: 10),
                    _OnboardingStepTile(
                      icon: Icons.search_rounded,
                      message: l10n.welcomeStepSearch,
                    ),
                  ],
                ),
              ),
            ),
            actions: [
              FilledButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: Text(l10n.getStarted),
              ),
            ],
          ),
        );
      },
    );

    await prefs.setBool(_onboardingSeenKey, true);
  }

  List<_TabItem> _buildTabs(AppLocalizations l10n) {
    return [
      _TabItem(
        label: l10n.tabProducts,
        icon: Icons.storefront_outlined,
        activeIcon: Icons.storefront,
        widget: const ProductListScreen(
          key: PageStorageKey('tab-products'),
          showFallbackNavigation: false,
        ),
      ),
      _TabItem(
        label: l10n.tabOrders,
        icon: Icons.receipt_long_outlined,
        activeIcon: Icons.receipt_long,
        widget: OrdersScreen(
          key: const PageStorageKey('tab-orders'),
          onSwitchTab: _switchToTab,
          showFallbackNavigation: false,
        ),
      ),
      _TabItem(
        label: l10n.tabOverview,
        icon: Icons.dashboard_outlined,
        activeIcon: Icons.dashboard,
        widget: DashboardScreen(
          key: const PageStorageKey('tab-dashboard'),
          onSwitchTab: _switchToTab,
        ),
      ),
      _TabItem(
        label: l10n.tabInventory,
        icon: Icons.inventory_2_outlined,
        activeIcon: Icons.inventory_2,
        widget: const InventoryScreen(
          key: PageStorageKey('tab-inventory'),
          showFallbackNavigation: false,
        ),
      ),
      _TabItem(
        label: l10n.tabAccount,
        icon: Icons.person_outline,
        activeIcon: Icons.person,
        widget: const AccountScreen(key: PageStorageKey('tab-account')),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final tabs = _buildTabs(l10n);
    final safeIndex = _currentIndex >= tabs.length
        ? tabs.length - 1
        : _currentIndex;
    final shellBody = PageStorage(
      bucket: _pageStorageBucket,
      child: IndexedStack(
        index: safeIndex,
        children: tabs.map((tab) => tab.widget).toList(),
      ),
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth >= AppBreakpoints.desktop;
        final useExtendedRail =
            constraints.maxWidth >= AppBreakpoints.railExtended;
        final isEnglish = Localizations.localeOf(context).languageCode == 'en';
        if (isDesktop) {
          final colors = Theme.of(context).colorScheme;
          return Scaffold(
            body: Row(
              children: [
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 12, 0, 12),
                    child: Container(
                      width: useExtendedRail ? 244 : 96,
                      decoration: BoxDecoration(
                        color: colors.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(
                          color: colors.outlineVariant.withValues(alpha: 0.52),
                        ),
                      ),
                      child: Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 18, 16, 12),
                            child: useExtendedRail
                                ? Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const BrandLogoWordmark(height: 28),
                                      const SizedBox(height: 10),
                                      Text(
                                        isEnglish
                                            ? 'Dealer control surface'
                                            : 'Không gian điều phối đại lý',
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelMedium
                                            ?.copyWith(
                                              color: colors.onSurfaceVariant,
                                              fontWeight: FontWeight.w700,
                                            ),
                                      ),
                                    ],
                                  )
                                : const Center(child: BrandLogoIcon(size: 34)),
                          ),
                          Expanded(
                            child: NavigationRail(
                              backgroundColor: Colors.transparent,
                              selectedIndex: safeIndex,
                              useIndicator: true,
                              indicatorShape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(18),
                              ),
                              labelType: useExtendedRail
                                  ? NavigationRailLabelType.none
                                  : NavigationRailLabelType.all,
                              minWidth: 84,
                              minExtendedWidth: 220,
                              extended: useExtendedRail,
                              groupAlignment: -0.78,
                              onDestinationSelected: _switchToTab,
                              destinations: tabs
                                  .map(
                                    (tab) => NavigationRailDestination(
                                      icon: Icon(tab.icon),
                                      selectedIcon: Icon(
                                        tab.activeIcon,
                                        color: colors.primary,
                                      ),
                                      label: Text(tab.label),
                                    ),
                                  )
                                  .toList(),
                            ),
                          ),
                          Padding(
                            padding: EdgeInsets.fromLTRB(
                              useExtendedRail ? 16 : 10,
                              8,
                              useExtendedRail ? 16 : 10,
                              16,
                            ),
                            child: Container(
                              width: double.infinity,
                              padding: EdgeInsets.symmetric(
                                horizontal: useExtendedRail ? 12 : 8,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: colors.primaryContainer.withValues(
                                  alpha: 0.42,
                                ),
                                borderRadius: BorderRadius.circular(18),
                              ),
                              child: Row(
                                mainAxisAlignment: useExtendedRail
                                    ? MainAxisAlignment.start
                                    : MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.route_outlined,
                                    size: 18,
                                    color: colors.primary,
                                  ),
                                  if (useExtendedRail) ...[
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        isEnglish
                                            ? '4T HITEK Dealer'
                                            : 'Trung tâm Dealer 4T HITEK',
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelLarge
                                            ?.copyWith(
                                              fontWeight: FontWeight.w800,
                                            ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(child: shellBody),
              ],
            ),
          );
        }

        return Scaffold(
          body: shellBody,
          bottomNavigationBar: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
              child: _MobileBottomNavigationBar(
                tabs: tabs,
                currentIndex: safeIndex,
                onDestinationSelected: _switchToTab,
              ),
            ),
          ),
        );
      },
    );
  }
}

class _TabItem {
  const _TabItem({
    required this.label,
    required this.icon,
    required this.activeIcon,
    required this.widget,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
  final Widget widget;
}

class _OnboardingStepTile extends StatelessWidget {
  const _OnboardingStepTile({required this.icon, required this.message});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.46),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: colors.primaryContainer.withValues(alpha: 0.74),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 18, color: colors.onPrimaryContainer),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(message)),
        ],
      ),
    );
  }
}

class _MobileBottomNavigationBar extends StatelessWidget {
  const _MobileBottomNavigationBar({
    required this.tabs,
    required this.currentIndex,
    required this.onDestinationSelected,
  });

  final List<_TabItem> tabs;
  final int currentIndex;
  final ValueChanged<int> onDestinationSelected;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final mediaQuery = MediaQuery.of(context);
    final scale = mediaQuery.textScaler.scale(1);
    final navigationTextScaler = scale.isFinite && scale > 1.1
        ? const TextScaler.linear(1.1)
        : mediaQuery.textScaler;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow.withValues(alpha: 0.98),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.56),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.14),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: MediaQuery(
          data: mediaQuery.copyWith(textScaler: navigationTextScaler),
          child: NavigationBar(
            height: 68,
            selectedIndex: currentIndex,
            backgroundColor: colors.surfaceContainerLow.withValues(alpha: 0.98),
            labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
            onDestinationSelected: onDestinationSelected,
            destinations: [
              for (final tab in tabs)
                NavigationDestination(
                  icon: Icon(tab.icon),
                  selectedIcon: Icon(tab.activeIcon),
                  label: tab.label,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
