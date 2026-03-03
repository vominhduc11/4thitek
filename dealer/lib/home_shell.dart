import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'account_screen.dart';
import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dashboard_screen.dart';
import 'inventory_screen.dart';
import 'orders_screen.dart';
import 'product_list_screen.dart';
import 'widgets/brand_identity.dart';

class DealerHomeShell extends StatefulWidget {
  const DealerHomeShell({super.key});

  @override
  State<DealerHomeShell> createState() => _DealerHomeShellState();
}

class _DealerHomeShellState extends State<DealerHomeShell> {
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

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Chào mừng đến 4thitek Dealer Hub'),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('1. Tạo đơn nhanh trong tab Sản phẩm.'),
              SizedBox(height: 6),
              Text('2. Theo dõi công nợ và trạng thái trong tab Đơn hàng.'),
              SizedBox(height: 6),
              Text('3. Dùng tìm kiếm toàn cục để tra đơn/sản phẩm tức thì.'),
            ],
          ),
          actions: [
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Bắt đầu'),
            ),
          ],
        );
      },
    );

    await prefs.setBool(_onboardingSeenKey, true);
  }

  List<_TabItem> _buildTabs(bool isEnglish) {
    return [
      _TabItem(
        label: isEnglish ? 'Products' : 'Sản phẩm',
        icon: Icons.storefront_outlined,
        activeIcon: Icons.storefront,
        widget: const ProductListScreen(key: PageStorageKey('tab-products')),
      ),
      _TabItem(
        label: isEnglish ? 'Orders' : 'Đơn hàng',
        icon: Icons.receipt_long_outlined,
        activeIcon: Icons.receipt_long,
        widget: OrdersScreen(
          key: const PageStorageKey('tab-orders'),
          onSwitchTab: _switchToTab,
        ),
      ),
      _TabItem(
        label: isEnglish ? 'Overview' : 'Tổng quan',
        icon: Icons.dashboard_outlined,
        activeIcon: Icons.dashboard,
        widget: DashboardScreen(
          key: const PageStorageKey('tab-dashboard'),
          onSwitchTab: _switchToTab,
        ),
      ),
      _TabItem(
        label: isEnglish ? 'Inventory' : 'Kho',
        icon: Icons.inventory_2_outlined,
        activeIcon: Icons.inventory_2,
        widget: const InventoryScreen(key: PageStorageKey('tab-inventory')),
      ),
      _TabItem(
        label: isEnglish ? 'Account' : 'Tài khoản',
        icon: Icons.person_outline,
        activeIcon: Icons.person,
        widget: const AccountScreen(key: PageStorageKey('tab-account')),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final appSettings = AppSettingsScope.of(context);
    final isEnglish = appSettings.locale.languageCode == 'en';
    final tabs = _buildTabs(isEnglish);
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
        if (isDesktop) {
          return Scaffold(
            body: Row(
              children: [
                SafeArea(
                  child: NavigationRail(
                    selectedIndex: safeIndex,
                    useIndicator: true,
                    leading: Padding(
                      padding: const EdgeInsets.fromLTRB(8, 6, 8, 18),
                      child: useExtendedRail
                          ? const BrandLogoWordmark(height: 26)
                          : const BrandLogoIcon(size: 30),
                    ),
                    labelType: useExtendedRail
                        ? NavigationRailLabelType.none
                        : NavigationRailLabelType.all,
                    minWidth: 84,
                    minExtendedWidth: 220,
                    extended: useExtendedRail,
                    onDestinationSelected: _switchToTab,
                    destinations: tabs
                        .map(
                          (tab) => NavigationRailDestination(
                            icon: Icon(tab.icon),
                            selectedIcon: Icon(
                              tab.activeIcon,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            label: Text(tab.label),
                          ),
                        )
                        .toList(),
                  ),
                ),
                const VerticalDivider(width: 1),
                Expanded(child: shellBody),
              ],
            ),
          );
        }

        return Scaffold(
          body: shellBody,
          bottomNavigationBar: NavigationBar(
            selectedIndex: safeIndex,
            onDestinationSelected: _switchToTab,
            destinations: tabs
                .map(
                  (tab) => NavigationDestination(
                    icon: Icon(tab.icon),
                    selectedIcon: Icon(tab.activeIcon),
                    label: tab.label,
                  ),
                )
                .toList(),
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
