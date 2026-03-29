import 'dart:async';

import 'package:dealer_hub/app_resume_refresh.dart';
import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/notification_controller.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/product_catalog_controller.dart';
import 'package:dealer_hub/push_messaging_controller.dart';
import 'package:dealer_hub/warranty_controller.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'resume refresh waits for pending order mutation and dedupes concurrent calls',
    () async {
      final authStorage = _FakeAuthStorage(token: 'dealer-token');
      final cartController = _FakeCartController(authStorage: authStorage);
      final orderController = _FakeOrderController(authStorage: authStorage);
      final warrantyController = _FakeWarrantyController(
        authStorage: authStorage,
      );
      final productCatalogController = _FakeProductCatalogController(
        authStorage: authStorage,
      );
      final notificationController = _FakeNotificationController(
        authStorage: authStorage,
      );
      final pushMessagingController = _FakePushMessagingController(
        authStorage: authStorage,
      );
      final coordinator = AppResumeRefreshCoordinator(
        authStorage: authStorage,
        cartController: cartController,
        orderController: orderController,
        warrantyController: warrantyController,
        productCatalogController: productCatalogController,
        notificationController: notificationController,
        pushMessagingController: pushMessagingController,
      );
      final pendingMutation = Completer<void>();
      orderController.pendingCriticalMutationFuture = pendingMutation.future;

      addTearDown(cartController.dispose);
      addTearDown(orderController.dispose);
      addTearDown(warrantyController.dispose);
      addTearDown(productCatalogController.dispose);
      addTearDown(notificationController.dispose);
      addTearDown(pushMessagingController.dispose);

      final first = coordinator.refreshIfNeeded();
      final second = coordinator.refreshIfNeeded();
      await Future<void>.delayed(Duration.zero);

      expect(productCatalogController.loadCount, 0);
      expect(cartController.loadCount, 0);
      expect(notificationController.refreshCount, 0);
      expect(orderController.refreshCount, 0);
      expect(warrantyController.loadCount, 0);
      expect(pushMessagingController.refreshRegistrationCount, 0);

      pendingMutation.complete();
      await Future.wait<void>([first, second]);

      expect(productCatalogController.loadCount, 1);
      expect(cartController.loadCount, 1);
      expect(notificationController.refreshCount, 1);
      expect(orderController.refreshCount, 1);
      expect(warrantyController.loadCount, 1);
      expect(pushMessagingController.refreshRegistrationCount, 1);
    },
  );

  test('resume refresh is throttled after a successful refresh', () async {
    final authStorage = _FakeAuthStorage(token: 'dealer-token');
    final cartController = _FakeCartController(authStorage: authStorage);
    final orderController = _FakeOrderController(authStorage: authStorage);
    final warrantyController = _FakeWarrantyController(
      authStorage: authStorage,
    );
    final productCatalogController = _FakeProductCatalogController(
      authStorage: authStorage,
    );
    final notificationController = _FakeNotificationController(
      authStorage: authStorage,
    );
    final pushMessagingController = _FakePushMessagingController(
      authStorage: authStorage,
    );
    final coordinator = AppResumeRefreshCoordinator(
      authStorage: authStorage,
      cartController: cartController,
      orderController: orderController,
      warrantyController: warrantyController,
      productCatalogController: productCatalogController,
      notificationController: notificationController,
      pushMessagingController: pushMessagingController,
      minRefreshInterval: const Duration(minutes: 5),
    );

    addTearDown(cartController.dispose);
    addTearDown(orderController.dispose);
    addTearDown(warrantyController.dispose);
    addTearDown(productCatalogController.dispose);
    addTearDown(notificationController.dispose);
    addTearDown(pushMessagingController.dispose);

    await coordinator.refreshIfNeeded();
    await coordinator.refreshIfNeeded();

    expect(productCatalogController.loadCount, 1);
    expect(cartController.loadCount, 1);
    expect(notificationController.refreshCount, 1);
    expect(orderController.refreshCount, 1);
    expect(warrantyController.loadCount, 1);
    expect(pushMessagingController.refreshRegistrationCount, 1);
  });
}

class _FakeAuthStorage extends AuthStorage {
  _FakeAuthStorage({this.token});

  final String? token;
  final ValueNotifier<int> _sessionEvents = ValueNotifier<int>(0);

  @override
  ValueListenable<int> get sessionEvents => _sessionEvents;

  @override
  Future<String?> readAccessToken() async => token;
}

class _FakeCartController extends CartController {
  _FakeCartController({required AuthStorage authStorage})
    : super(authStorage: authStorage);

  int loadCount = 0;

  @override
  Future<void> load() async {
    loadCount += 1;
  }
}

class _FakeOrderController extends OrderController {
  _FakeOrderController({required AuthStorage authStorage})
    : super(authStorage: authStorage);

  int refreshCount = 0;
  Future<void>? pendingCriticalMutationFuture;

  @override
  Future<void>? get pendingCriticalMutation => pendingCriticalMutationFuture;

  @override
  Future<void> refresh() async {
    refreshCount += 1;
  }
}

class _FakeWarrantyController extends WarrantyController {
  _FakeWarrantyController({required AuthStorage authStorage})
    : super(authStorage: authStorage);

  int loadCount = 0;

  @override
  Future<void> load({bool forceRefresh = false}) async {
    loadCount += 1;
  }
}

class _FakeProductCatalogController extends ProductCatalogController {
  _FakeProductCatalogController({required AuthStorage authStorage})
    : super(authStorage: authStorage);

  int loadCount = 0;

  @override
  Future<void> load({bool forceRefresh = false}) async {
    loadCount += 1;
  }
}

class _FakeNotificationController extends NotificationController {
  _FakeNotificationController({required AuthStorage authStorage})
    : super(authStorage: authStorage);

  int refreshCount = 0;

  @override
  Future<void> refresh() async {
    refreshCount += 1;
  }
}

class _FakePushMessagingController extends PushMessagingController {
  _FakePushMessagingController({required AuthStorage authStorage})
    : super(authStorage: authStorage, enabled: false);

  int refreshRegistrationCount = 0;

  @override
  Future<void> refreshRegistration() async {
    refreshRegistrationCount += 1;
  }
}
