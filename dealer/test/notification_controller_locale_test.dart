import 'package:dealer_hub/notification_controller.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
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
      'Khong the dong bo thong bao.',
    );
  });

  test('Notification raw backend errors are preserved', () {
    expect(
      notificationSyncErrorMessage('Session expired.', isEnglish: true),
      'Session expired.',
    );
    expect(
      notificationSyncErrorMessage('He thong dang bao tri.', isEnglish: false),
      'He thong dang bao tri.',
    );
  });
}
