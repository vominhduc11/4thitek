import 'package:dealer_hub/auth_storage.dart';
import 'package:dealer_hub/cart_controller.dart';
import 'package:dealer_hub/notification_controller.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/push_messaging_controller.dart';
import 'package:dealer_hub/session_bootstrap.dart';
import 'package:dealer_hub/warranty_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('bootstrapSessionScopes loads every scope after sign-in', (
    tester,
  ) async {
    final authStorage = _FakeAuthStorage();
    final cart = _FakeCartController(authStorage: authStorage);
    final order = _FakeOrderController(authStorage: authStorage);
    final warranty = _FakeWarrantyController(authStorage: authStorage);
    final notification = _FakeNotificationController(authStorage: authStorage);
    final push = _FakePushMessagingController(authStorage: authStorage);

    addTearDown(cart.dispose);
    addTearDown(order.dispose);
    addTearDown(warranty.dispose);
    addTearDown(notification.dispose);
    addTearDown(push.dispose);

    await tester.pumpWidget(
      MaterialApp(
        home: CartScope(
          controller: cart,
          child: OrderScope(
            controller: order,
            child: WarrantyScope(
              controller: warranty,
              child: NotificationScope(
                controller: notification,
                child: PushMessagingScope(
                  controller: push,
                  child: Builder(
                    builder: (context) {
                      return ElevatedButton(
                        onPressed: () => bootstrapSessionScopes(context),
                        child: const Text('bootstrap'),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('bootstrap'));
    await tester.pumpAndSettle();

    expect(cart.loadCount, 1);
    expect(order.loadForceRefresh, isTrue);
    expect(warranty.loadForceRefresh, isTrue);
    expect(notification.loadForceRefresh, isTrue);
    expect(push.initializeCount, 1);
    expect(push.refreshRegistrationCount, 1);
  });
}

class _FakeAuthStorage extends AuthStorage {
  @override
  Future<String?> readAccessToken() async => 'dealer-token';
}

class _FakeCartController extends CartController {
  _FakeCartController({required super.authStorage});

  int loadCount = 0;

  @override
  Future<void> load() async => loadCount += 1;
}

class _FakeOrderController extends OrderController {
  _FakeOrderController({required super.authStorage});

  bool? loadForceRefresh;

  @override
  Future<void> load({bool forceRefresh = false}) async =>
      loadForceRefresh = forceRefresh;
}

class _FakeWarrantyController extends WarrantyController {
  _FakeWarrantyController({required super.authStorage});

  bool? loadForceRefresh;

  @override
  Future<void> load({bool forceRefresh = false}) async =>
      loadForceRefresh = forceRefresh;
}

class _FakeNotificationController extends NotificationController {
  _FakeNotificationController({required super.authStorage});

  bool? loadForceRefresh;

  @override
  Future<void> load({bool forceRefresh = false}) async =>
      loadForceRefresh = forceRefresh;
}

class _FakePushMessagingController extends PushMessagingController {
  _FakePushMessagingController({required AuthStorage authStorage})
    : super(authStorage: authStorage, enabled: false);

  int initializeCount = 0;
  int refreshRegistrationCount = 0;

  @override
  Future<void> initialize() async => initializeCount += 1;

  @override
  Future<void> refreshRegistration() async => refreshRegistrationCount += 1;
}
