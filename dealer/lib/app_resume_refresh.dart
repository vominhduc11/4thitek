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

    final refreshFuture = _refreshIfNeededInternal();
    _inFlightRefresh = refreshFuture;
    try {
      await refreshFuture;
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

  Future<void> _refreshIfNeededInternal() async {
    if (!await _hasActiveSession()) {
      return;
    }
    if (_wasRefreshedRecently()) {
      return;
    }

    final pendingOrderMutation = orderController.pendingCriticalMutation;
    if (pendingOrderMutation != null) {
      await pendingOrderMutation;
      if (!await _hasActiveSession()) {
        return;
      }
      if (_wasRefreshedRecently()) {
        return;
      }
    }

    await _performRefresh();
    _lastRefreshAt = DateTime.now();
  }

  Future<bool> _hasActiveSession() async {
    final accessToken = await authStorage.readAccessToken();
    return accessToken != null && accessToken.isNotEmpty;
  }

  bool _wasRefreshedRecently() {
    final lastRefreshAt = _lastRefreshAt;
    if (lastRefreshAt == null) {
      return false;
    }
    return DateTime.now().difference(lastRefreshAt) < minRefreshInterval;
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
