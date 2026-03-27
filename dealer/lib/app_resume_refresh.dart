import 'auth_storage.dart';
import 'cart_controller.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'product_catalog_controller.dart';
import 'push_messaging_controller.dart';
import 'warranty_controller.dart';

class AppResumeRefreshCoordinator {
  AppResumeRefreshCoordinator({
    required this.authStorage,
    required this.cartController,
    required this.orderController,
    required this.warrantyController,
    required this.productCatalogController,
    required this.notificationController,
    required this.pushMessagingController,
    this.minRefreshInterval = const Duration(seconds: 45),
  });

  final AuthStorage authStorage;
  final CartController cartController;
  final OrderController orderController;
  final WarrantyController warrantyController;
  final ProductCatalogController productCatalogController;
  final NotificationController notificationController;
  final PushMessagingController pushMessagingController;
  final Duration minRefreshInterval;

  DateTime? _lastRefreshAt;
  Future<void>? _inFlightRefresh;

  Future<void> refreshIfNeeded() async {
    final inFlightRefresh = _inFlightRefresh;
    if (inFlightRefresh != null) {
      return inFlightRefresh;
    }

    final accessToken = await authStorage.readAccessToken();
    if (accessToken == null || accessToken.isEmpty) {
      return;
    }

    final now = DateTime.now();
    final lastRefreshAt = _lastRefreshAt;
    if (lastRefreshAt != null &&
        now.difference(lastRefreshAt) < minRefreshInterval) {
      return;
    }

    final refreshFuture = _performRefresh();
    _inFlightRefresh = refreshFuture;
    try {
      await refreshFuture;
      _lastRefreshAt = DateTime.now();
    } finally {
      if (identical(_inFlightRefresh, refreshFuture)) {
        _inFlightRefresh = null;
      }
    }
  }

  void markFreshNow() {
    _lastRefreshAt = DateTime.now();
  }

  void reset() {
    _lastRefreshAt = null;
    _inFlightRefresh = null;
  }

  Future<void> _performRefresh() async {
    await Future.wait<void>([
      productCatalogController.load(forceRefresh: true),
      cartController.load(),
      notificationController.refresh(),
      orderController.refresh(),
      warrantyController.load(forceRefresh: true),
      pushMessagingController.refreshRegistration(),
    ]);
  }
}
