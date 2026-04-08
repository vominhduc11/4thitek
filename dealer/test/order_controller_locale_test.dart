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
      'API đơn hàng chưa được cấu hình.',
    );
    expect(
      resolveOrderControllerMessage(
        orderControllerMessageToken(OrderMessageCode.statusUpdateFailed),
        isEnglish: false,
      ),
      'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.',
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

  test('resolveOrderControllerMessage preserves bank-transfer-only guard message', () {
    expect(
      resolveOrderControllerMessage(
        'Only BANK_TRANSFER is supported',
        isEnglish: true,
      ),
      'Only BANK_TRANSFER is supported',
    );
    expect(
      resolveOrderControllerMessage(
        'Only BANK_TRANSFER is supported',
        isEnglish: false,
      ),
      'Only BANK_TRANSFER is supported',
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
      'Tồn kho của Router AX không còn đủ. Vui lòng làm mới và thử lại.',
    );
  });
}
