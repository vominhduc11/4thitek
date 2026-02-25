import 'package:flutter/material.dart';

import 'account_screen.dart';
import 'dashboard_screen.dart';
import 'orders_screen.dart';
import 'product_list_screen.dart';
import 'warranty_hub_screen.dart';

class DealerHomeShell extends StatefulWidget {
  const DealerHomeShell({super.key});

  @override
  State<DealerHomeShell> createState() => _DealerHomeShellState();
}

class _DealerHomeShellState extends State<DealerHomeShell> {
  static const _desktopNavBreakpoint = 1024.0;

  int _currentIndex = 2;

  static const List<_TabItem> _tabs = [
    _TabItem(
      label: 'San pham',
      icon: Icons.storefront_outlined,
      widget: ProductListScreen(),
    ),
    _TabItem(
      label: 'Don hang',
      icon: Icons.receipt_long_outlined,
      widget: OrdersScreen(),
    ),
    _TabItem(
      label: 'Tong quan',
      icon: Icons.dashboard_outlined,
      widget: DashboardScreen(),
    ),
    _TabItem(
      label: 'Bao hanh',
      icon: Icons.verified_outlined,
      widget: WarrantyHubScreen(),
    ),
    _TabItem(
      label: 'Tai khoan',
      icon: Icons.person_outline,
      widget: AccountScreen(),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final safeIndex = _currentIndex >= _tabs.length
        ? _tabs.length - 1
        : _currentIndex;
    final shellBody = IndexedStack(
      index: safeIndex,
      children: _tabs.map((tab) => tab.widget).toList(),
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
                    labelType: useExtendedRail
                        ? NavigationRailLabelType.none
                        : NavigationRailLabelType.all,
                    minWidth: 84,
                    minExtendedWidth: 220,
                    extended: useExtendedRail,
                    onDestinationSelected: (index) {
                      setState(() => _currentIndex = index);
                    },
                    destinations: _tabs
                        .map(
                          (tab) => NavigationRailDestination(
                            icon: Icon(tab.icon),
                            selectedIcon: Icon(
                              tab.icon,
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
            showUnselectedLabels: true,
            selectedIconTheme: const IconThemeData(size: 28),
            unselectedIconTheme: const IconThemeData(size: 22),
            onTap: (index) {
              setState(() => _currentIndex = index);
            },
            items: _tabs
                .map(
                  (tab) => BottomNavigationBarItem(
                    icon: Icon(tab.icon),
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
    required this.widget,
  });

  final String label;
  final IconData icon;
  final Widget widget;
}
