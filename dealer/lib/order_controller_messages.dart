part of 'order_controller.dart';

enum OrderMessageCode {
  apiNotConfigured,
  unauthenticated,
  invalidOrderPayload,
  invalidOrdersPayload,
  invalidCreateOrderPayload,
  createOrderFailed,
  statusUpdateFailed,
  paymentFailed,
  syncFailed,
}

const String _orderMessageTokenPrefix = 'order.message.';
const String _stockConflictMessage =
    'Stock is being updated by another request; please retry';
const String _optimisticConflictMessage =
    'The record was modified by another request; please retry';
const String _roundedPaymentAmountMessage =
    'Payment amount must round to at least 1 VND';
final RegExp _insufficientStockPattern = RegExp(
  r'^Insufficient stock for product (.+)$',
);

String orderControllerMessageToken(OrderMessageCode code) =>
    '$_orderMessageTokenPrefix${code.name}';

String? _resolveDynamicOrderMessage(
  String normalized, {
  required bool isEnglish,
}) {
  final insufficientStockMatch = _insufficientStockPattern.firstMatch(
    normalized,
  );
  if (insufficientStockMatch != null) {
    final productName = insufficientStockMatch.group(1)?.trim();
    if (productName == null || productName.isEmpty) {
      return isEnglish
          ? 'Insufficient stock. Please refresh and try again.'
          : 'Tồn kho không còn đủ. Vui lòng làm mới và thử lại.';
    }
    return isEnglish
        ? 'Insufficient stock for $productName. Please refresh and try again.'
        : 'Tồn kho của $productName không còn đủ. Vui lòng làm mới và thử lại.';
  }

  switch (normalized) {
    case _stockConflictMessage:
    case _optimisticConflictMessage:
      return isEnglish
          ? 'Stock changed while your request was being processed. Please refresh and try again.'
          : 'Tồn kho vừa thay đổi trong lúc xử lý. Vui lòng làm mới và thử lại.';
    case _roundedPaymentAmountMessage:
      return isEnglish
          ? 'The rounded payment amount must be at least 1 VND.'
          : 'Số tiền sau khi làm tròn phải từ 1 VND trở lên.';
    default:
      return null;
  }
}

String resolveOrderControllerMessage(
  String? message, {
  required bool isEnglish,
}) {
  final normalized = message?.trim();
  final dynamicMessage = normalized == null
      ? null
      : _resolveDynamicOrderMessage(normalized, isEnglish: isEnglish);
  if (normalized == null || normalized.isEmpty) {
    return isEnglish
        ? 'Unable to sync order data.'
        : 'Không thể đồng bộ dữ liệu đơn hàng.';
  }

  switch (normalized) {
    case 'order.message.apiNotConfigured':
      return isEnglish
          ? 'Order API is not configured.'
          : 'API đơn hàng chưa được cấu hình.';
    case 'order.message.unauthenticated':
      return isEnglish
          ? 'You need to sign in before managing orders.'
          : 'Bạn cần đăng nhập trước khi thao tác đơn hàng.';
    case 'order.message.invalidOrderPayload':
      return isEnglish
          ? 'Order data is invalid.'
          : 'Dữ liệu đơn hàng không hợp lệ.';
    case 'order.message.invalidOrdersPayload':
      return isEnglish
          ? 'Orders data is invalid.'
          : 'Dữ liệu danh sách đơn hàng không hợp lệ.';
    case 'order.message.invalidCreateOrderPayload':
      return isEnglish
          ? 'Created order data is invalid.'
          : 'Dữ liệu đơn hàng vừa tạo không hợp lệ.';
    case 'order.message.createOrderFailed':
      return isEnglish
          ? 'Unable to create the order. Please try again.'
          : 'Không thể tạo đơn hàng. Vui lòng thử lại.';
    case 'order.message.statusUpdateFailed':
      return isEnglish
          ? 'Unable to update the order status. Please try again.'
          : 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.';
    case 'order.message.paymentFailed':
      return isEnglish
          ? 'Unable to record the payment. Please check again.'
          : 'Không thể ghi nhận thanh toán. Vui lòng kiểm tra lại.';
    case 'order.message.syncFailed':
      return isEnglish
          ? 'Unable to sync order data.'
          : 'Không thể đồng bộ dữ liệu đơn hàng.';
    default:
      if (dynamicMessage != null) {
        return dynamicMessage;
      }
      return normalized;
  }
}

String orderControllerErrorMessage(Object? error, {required bool isEnglish}) {
  final message = switch (error) {
    OrderControllerException() => error.message,
    String() => error,
    _ => error?.toString(),
  };
  return resolveOrderControllerMessage(message, isEnglish: isEnglish);
}

class OrderControllerException implements Exception {
  const OrderControllerException(this.message);

  final String message;

  @override
  String toString() => message;
}
