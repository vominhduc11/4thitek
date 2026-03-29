import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/utils.dart';
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

  test('resolveOrderControllerMessage localizes backend debt guard messages', () {
    expect(
      resolveOrderControllerMessage(
        'Debt payment is not available for this dealer',
        isEnglish: true,
      ),
      'This account has not been granted a credit limit yet.',
    );
    expect(
      resolveOrderControllerMessage('Credit limit exceeded', isEnglish: false),
      'Vuot han muc cong no. Vui long kiem tra lai tong cong no hien tai truoc khi dat don.',
    );
  });

  test('resolveOrderControllerMessage localizes partial debt payment threshold', () {
    expect(
      resolveOrderControllerMessage(
        'Payment amount must be at least 100000 VND unless it fully settles the outstanding balance',
        isEnglish: true,
      ),
      'Each partial debt payment must be at least ${formatVnd(100000)} unless it clears the remaining outstanding balance.',
    );
    expect(
      resolveOrderControllerMessage(
        'Payment amount must be at least 100000 VND unless it fully settles the outstanding balance',
        isEnglish: false,
      ),
      'Moi lan thanh toan cong no tung phan phai tu ${formatVnd(100000)} tro len, tru khi thanh toan het cong no con lai.',
    );
  });

  test('resolveOrderControllerMessage localizes stock conflict guidance', () {
    expect(
      resolveOrderControllerMessage(
        'Stock is being updated by another request; please retry',
        isEnglish: true,
      ),
      'Stock changed while your request was being processed. Please refresh and try again.',
    );
    expect(
      resolveOrderControllerMessage(
        'Insufficient stock for product Router AX',
        isEnglish: false,
      ),
      'Ton kho cua Router AX khong con du. Vui long lam moi va thu lai.',
    );
  });
}
