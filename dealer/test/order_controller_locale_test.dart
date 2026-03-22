import 'package:dealer_hub/order_controller.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('resolveOrderControllerMessage maps internal fallback in English', () {
    expect(
      resolveOrderControllerMessage(
        orderControllerMessageToken(OrderMessageCode.unauthenticated),
        isEnglish: true,
      ),
      'You need to sign in before managing orders.',
    );
    expect(
      resolveOrderControllerMessage(
        orderControllerMessageToken(OrderMessageCode.paymentFailed),
        isEnglish: true,
      ),
      'Unable to record the payment. Please check again.',
    );
  });

  test('resolveOrderControllerMessage maps internal fallback in Vietnamese', () {
    expect(
      resolveOrderControllerMessage(
        orderControllerMessageToken(OrderMessageCode.apiNotConfigured),
        isEnglish: false,
      ),
      'API don hang chua duoc cau hinh.',
    );
    expect(
      resolveOrderControllerMessage(
        orderControllerMessageToken(OrderMessageCode.statusUpdateFailed),
        isEnglish: false,
      ),
      'Khong the cap nhat trang thai don hang. Vui long thu lai.',
    );
  });

  test('orderControllerErrorMessage preserves backend-provided message', () {
    expect(
      orderControllerErrorMessage(
        const OrderControllerException('Order already completed.'),
        isEnglish: false,
      ),
      'Order already completed.',
    );
  });
}
