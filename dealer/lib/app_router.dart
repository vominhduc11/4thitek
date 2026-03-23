import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'account_settings_screen.dart';
import 'app_preferences_screen.dart';
import 'cart_screen.dart';
import 'change_password_screen.dart';
import 'checkout_screen.dart';
import 'dealer_routes.dart';
import 'debt_tracking_screen.dart';
import 'home_shell.dart';
import 'inventory_screen.dart';
import 'login_screen.dart';
import 'notifications_screen.dart';
import 'order_detail_screen.dart';
import 'orders_screen.dart';
import 'product_catalog_controller.dart';
import 'product_detail_screen.dart';
import 'product_list_screen.dart';
import 'support_screen.dart';
import 'warranty_activation_screen.dart';
import 'warranty_export_screen.dart';
import 'warranty_hub_screen.dart';
import 'widgets/brand_identity.dart';

GoRouter buildDealerRouter({
  required GlobalKey<NavigatorState> navigatorKey,
  required Future<bool> startupFuture,
}) {
  return GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: '/launch',
    routes: [
      GoRoute(
        path: '/',
        redirect: (context, state) => '/launch',
      ),
      GoRoute(
        path: '/launch',
        builder: (context, state) => _StartupGate(startupFuture: startupFuture),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginScreen(
          initialErrorMessage: state.uri.queryParameters['error'],
        ),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const DealerHomeShell(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/products',
        builder: (context, state) => const ProductListScreen(),
      ),
      GoRoute(
        path: '/products/:productId',
        builder: (context, state) => _ProductDetailRouteScreen(
          productId: state.pathParameters['productId'] ?? '',
        ),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/orders/:orderId',
        builder: (context, state) => OrderDetailScreen(
          orderId: state.pathParameters['orderId'] ?? '',
        ),
      ),
      GoRoute(
        path: '/support',
        builder: (context, state) => const SupportScreen(),
      ),
      GoRoute(
        path: '/inventory',
        builder: (context, state) => InventoryScreen(
          initialStockFilter: switch (
            state.uri.queryParameters['filter']?.trim().toLowerCase()
          ) {
            'instock' || 'in-stock' => InventoryStockFilter.inStock,
            'low' || 'low-stock' => InventoryStockFilter.lowStock,
            'out' || 'out-of-stock' => InventoryStockFilter.outOfStock,
            _ => InventoryStockFilter.all,
          },
        ),
      ),
      GoRoute(
        path: '/debt',
        builder: (context, state) => const DebtTrackingScreen(),
      ),
      GoRoute(
        path: '/warranty',
        builder: (context, state) => const WarrantyHubScreen(),
      ),
      GoRoute(
        path: '/warranty/export',
        builder: (context, state) => WarrantyExportScreen(
          prefilledSerial: state.uri.queryParameters['serial'],
        ),
      ),
      GoRoute(
        path: '/warranty/activation/:orderId',
        builder: (context, state) => WarrantyActivationScreen(
          orderId: state.pathParameters['orderId'] ?? '',
          prefilledSerial: state.uri.queryParameters['serial'],
          prefilledProductId: state.uri.queryParameters['productId'],
        ),
      ),
      GoRoute(
        path: '/account/settings',
        builder: (context, state) => const AccountSettingsScreen(),
      ),
      GoRoute(
        path: '/account/preferences',
        builder: (context, state) => const AppPreferencesScreen(),
      ),
      GoRoute(
        path: '/account/change-password',
        builder: (context, state) => const ChangePasswordScreen(),
      ),
      GoRoute(
        path: '/cart',
        builder: (context, state) => const CartScreen(),
      ),
      GoRoute(
        path: '/checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),
    ],
  );
}

class _StartupGate extends StatelessWidget {
  const _StartupGate({required this.startupFuture});

  final Future<bool> startupFuture;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: startupFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.done) {
          final destination = (snapshot.data ?? false) ? '/home' : '/login';
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (context.mounted) {
              context.go(destination);
            }
          });
        }

        return const _LaunchRouteScreen();
      },
    );
  }
}

class _LaunchRouteScreen extends StatelessWidget {
  const _LaunchRouteScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            BrandLogoIcon(size: 88),
            SizedBox(height: 14),
            BrandLogoWordmark(height: 34),
            SizedBox(height: 22),
            SizedBox(
              width: 30,
              height: 30,
              child: CircularProgressIndicator(strokeWidth: 2.8),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProductDetailRouteScreen extends StatefulWidget {
  const _ProductDetailRouteScreen({required this.productId});

  final String productId;

  @override
  State<_ProductDetailRouteScreen> createState() =>
      _ProductDetailRouteScreenState();
}

class _ProductDetailRouteScreenState extends State<_ProductDetailRouteScreen> {
  Future<dynamic>? _loadFuture;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _loadFuture ??= _loadProduct();
  }

  Future<dynamic> _loadProduct() async {
    final catalog = ProductCatalogScope.maybeOf(context);
    final existing = catalog?.findById(widget.productId);
    if (existing != null) {
      return existing;
    }
    return await catalog?.fetchDetail(widget.productId);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<dynamic>(
      future: _loadFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const _LaunchRouteScreen();
        }

        final product = snapshot.data;
        if (product == null) {
          return const _RouteNotFoundScreen();
        }
        return ProductDetailScreen(product: product);
      },
    );
  }
}

class _RouteNotFoundScreen extends StatelessWidget {
  const _RouteNotFoundScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('4thitek')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.search_off_outlined, size: 52),
              const SizedBox(height: 12),
              Text(
                'Khong tim thay noi dung.',
                textAlign: TextAlign.center,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 10),
              FilledButton(
                onPressed: () => context.go(DealerRoutePath.home),
                child: const Text('Quay ve trang chinh'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
