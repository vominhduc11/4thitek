import 'package:dealer_hub/notification_controller.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Dealer realtime destinations use the canonical user queue contract', () {
    expect(dealerNotificationsRealtimeDestination, '/user/queue/notifications');
    expect(dealerOrderStatusRealtimeDestination, '/user/queue/order-status');
    expect(
      dealerNotificationFallbackRefreshInterval,
      const Duration(seconds: 45),
    );
  });

  test('Notification fallback refresh timer is cleaned up with lifecycle', () async {
    final controller = NotificationController();
    controller.enableFallbackRefreshForTesting();
    expect(controller.hasFallbackRefreshTimer, isTrue);

    await controller.clearSessionData();
    expect(controller.hasFallbackRefreshTimer, isFalse);

    controller.enableFallbackRefreshForTesting();
    expect(controller.hasFallbackRefreshTimer, isTrue);
    controller.dispose();
    expect(controller.hasFallbackRefreshTimer, isFalse);
  });

  test('Notification sync fallback error renders English copy', () {
    expect(
      notificationSyncErrorMessage(
        'notification.sync.unavailable',
        isEnglish: true,
      ),
      'Unable to sync notifications.',
    );
  });

  test('Notification sync fallback error renders Vietnamese copy', () {
    expect(
      notificationSyncErrorMessage(
        'notification.sync.unavailable',
        isEnglish: false,
      ),
      'Không thể đồng bộ thông báo.',
    );
  });

  test('Notification raw backend errors are preserved', () {
    expect(
      notificationSyncErrorMessage('Session expired.', isEnglish: true),
      'Session expired.',
    );
    expect(
      notificationSyncErrorMessage('Hệ thống đang bảo trì.', isEnglish: false),
      'Hệ thống đang bảo trì.',
    );
  });
}
