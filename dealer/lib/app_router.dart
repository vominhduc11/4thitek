import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'account_settings_screen.dart';
import 'app_preferences_screen.dart';
import 'business_profile.dart';
import 'cart_screen.dart';
import 'change_password_screen.dart';
import 'checkout_screen.dart';
import 'dealer_routes.dart';
import 'home_shell.dart';
import 'inventory_screen.dart';
import 'login_screen.dart';
import 'notifications_screen.dart';
import 'order_detail_screen.dart';
import 'orders_screen.dart';
import 'product_catalog_controller.dart';
import 'product_detail_screen.dart';
import 'product_list_screen.dart';
import 'return_create_screen.dart';
import 'return_detail_screen.dart';
import 'returns_screen.dart';
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
      GoRoute(path: '/', redirect: (context, state) => '/launch'),
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
        builder: (context, state) {
          final productId = state.pathParameters['productId'];
          if (productId == null || productId.isEmpty) {
            return const ProductListScreen();
          }
          return _ProductDetailRouteScreen(productId: productId);
        },
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/orders/:orderId/returns/new',
        builder: (context, state) {
          final orderId = state.pathParameters['orderId'];
          if (orderId == null || orderId.isEmpty) {
            return const OrdersScreen();
          }
          return DealerReturnCreateScreen(
            orderId: orderId,
            prefilledSerialId: int.tryParse(
              state.uri.queryParameters['serialId'] ?? '',
            ),
          );
        },
      ),
      GoRoute(
        path: '/orders/:orderId',
        builder: (context, state) {
          final orderId = state.pathParameters['orderId'];
          if (orderId == null || orderId.isEmpty) {
            return const OrdersScreen();
          }
          return OrderDetailScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: '/returns',
        builder: (context, state) => const DealerReturnsScreen(),
      ),
      GoRoute(
        path: '/returns/:requestId',
        builder: (context, state) {
          final requestId = int.tryParse(
            state.pathParameters['requestId'] ?? '',
          );
          if (requestId == null || requestId <= 0) {
            return const DealerReturnsScreen();
          }
          return DealerReturnDetailScreen(requestId: requestId);
        },
      ),
      GoRoute(
        path: '/support',
        builder: (context, state) => SupportScreen(
          initialTicketId: int.tryParse(
            state.uri.queryParameters['ticketId'] ?? '',
          ),
        ),
      ),
      GoRoute(
        path: '/inventory',
        builder: (context, state) => InventoryScreen(
          initialStockFilter: switch (state.uri.queryParameters['filter']
              ?.trim()
              .toLowerCase()) {
            'instock' || 'in-stock' => InventoryStockFilter.inStock,
            'low' || 'low-stock' => InventoryStockFilter.lowStock,
            'out' || 'out-of-stock' => InventoryStockFilter.outOfStock,
            _ => InventoryStockFilter.all,
          },
        ),
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
        builder: (context, state) {
          final orderId = state.pathParameters['orderId'];
          if (orderId == null || orderId.isEmpty) {
            return const WarrantyHubScreen();
          }
          return WarrantyActivationScreen(
            orderId: orderId,
            prefilledSerial: state.uri.queryParameters['serial'],
            prefilledProductId: state.uri.queryParameters['productId'],
          );
        },
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
      GoRoute(path: '/cart', builder: (context, state) => const CartScreen()),
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
    final colors = Theme.of(context).colorScheme;
    final isEnglish = Localizations.localeOf(context).languageCode == 'en';
    final statusLabel = isEnglish
        ? 'Preparing the dealer workspace...'
        : 'Đang chuẩn bị không gian làm việc cho đại lý...';
    return Scaffold(
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              colors.surfaceContainerLow,
              colors.surface,
              const Color(0xFF07111A),
            ],
          ),
        ),
        child: Center(
          child: RepaintBoundary(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Container(
                padding: const EdgeInsets.fromLTRB(28, 24, 28, 24),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  color: colors.surfaceContainer.withValues(alpha: 0.9),
                  border: Border.all(
                    color: colors.outlineVariant.withValues(alpha: 0.85),
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const BrandLogoIcon(size: 88),
                    const SizedBox(height: 14),
                    const BrandLogoWordmark(height: 34),
                    const SizedBox(height: 18),
                    Text(
                      statusLabel,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 18),
                    const SizedBox(
                      width: 30,
                      height: 30,
                      child: CircularProgressIndicator(strokeWidth: 2.8),
                    ),
                  ],
                ),
              ),
            ),
          ),
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
    final isEnglish = Localizations.localeOf(context).languageCode == 'en';
    final title = isEnglish ? 'Content not found' : 'Không tìm thấy nội dung';
    final message = isEnglish
        ? 'The destination may have changed or is no longer available.'
        : 'Điểm đến có thể đã thay đổi hoặc hiện không còn khả dụng.';
    final actionLabel = isEnglish ? 'Back to home' : 'Quay về trang chính';
    final secondaryActionLabel = isEnglish
        ? 'Open catalog'
        : 'Mở danh mục sản phẩm';

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle(BusinessProfile.brandName)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: RepaintBoundary(
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  color: Theme.of(context).colorScheme.surfaceContainer,
                  border: Border.all(
                    color: Theme.of(
                      context,
                    ).colorScheme.outlineVariant.withValues(alpha: 0.8),
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Theme.of(
                          context,
                        ).colorScheme.primaryContainer.withValues(alpha: 0.65),
                      ),
                      child: Icon(
                        Icons.search_off_outlined,
                        size: 32,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      title,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      message,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      alignment: WrapAlignment.center,
                      children: [
                        FilledButton.icon(
                          onPressed: () => context.go(DealerRoutePath.home),
                          icon: const Icon(Icons.home_outlined),
                          label: Text(actionLabel),
                        ),
                        OutlinedButton.icon(
                          onPressed: () => context.go(DealerRoutePath.products),
                          icon: const Icon(Icons.storefront_outlined),
                          label: Text(secondaryActionLabel),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
