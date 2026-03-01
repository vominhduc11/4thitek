import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'account_screen.dart';
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
  static const _desktopNavBreakpoint = 1024.0;

  int _currentIndex = 2;

  List<_TabItem> _buildTabs(bool isEnglish) {
    return [
      _TabItem(
        label: isEnglish ? 'Products' : 'San pham',
        icon: Icons.storefront_outlined,
        activeIcon: Icons.storefront,
        widget: const ProductListScreen(),
      ),
      _TabItem(
        label: isEnglish ? 'Orders' : 'Don hang',
        icon: Icons.receipt_long_outlined,
        activeIcon: Icons.receipt_long,
        widget: const OrdersScreen(),
      ),
      _TabItem(
        label: isEnglish ? 'Overview' : 'Tong quan',
        icon: Icons.dashboard_outlined,
        activeIcon: Icons.dashboard,
        widget: const DashboardScreen(),
      ),
      _TabItem(
        label: isEnglish ? 'Inventory' : 'Kho',
        icon: Icons.inventory_2_outlined,
        activeIcon: Icons.inventory_2,
        widget: const InventoryScreen(),
      ),
      _TabItem(
        label: isEnglish ? 'Account' : 'Tai khoan',
        icon: Icons.person_outline,
        activeIcon: Icons.person,
        widget: const AccountScreen(),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final appSettings = AppSettingsScope.of(context);
    final isEnglish = appSettings.locale.languageCode == 'en';
    final tabs = _buildTabs(isEnglish);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colorScheme = Theme.of(context).colorScheme;

    final safeIndex = _currentIndex >= tabs.length
        ? tabs.length - 1
        : _currentIndex;
    final shellBody = IndexedStack(
      index: safeIndex,
      children: tabs.map((tab) => tab.widget).toList(),
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth >= _desktopNavBreakpoint;
        final useExtendedRail = constraints.maxWidth >= 1320;
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
                    onDestinationSelected: (index) {
                      setState(() => _currentIndex = index);
                    },
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
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: safeIndex,
            type: BottomNavigationBarType.fixed,
            showSelectedLabels: true,
            showUnselectedLabels: false,
            selectedItemColor: isDark
                ? colorScheme.primary
                : const Color(0xFF1D4ED8),
            unselectedItemColor: isDark
                ? colorScheme.onSurfaceVariant
                : const Color(0xFF64748B),
            selectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 12,
            ),
            unselectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 11,
            ),
            selectedIconTheme: const IconThemeData(size: 26),
            unselectedIconTheme: const IconThemeData(size: 22),
            backgroundColor: isDark ? colorScheme.surface : Colors.white,
            onTap: (index) {
              setState(() => _currentIndex = index);
            },
            items: tabs
                .map(
                  (tab) => BottomNavigationBarItem(
                    icon: Icon(tab.icon),
                    activeIcon: Icon(tab.activeIcon),
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
