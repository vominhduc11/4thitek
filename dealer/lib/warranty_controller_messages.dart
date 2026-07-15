part of 'warranty_controller.dart';

enum WarrantySerialValidationErrorCode {
  invalidSerial,
  notImported,
  wrongProduct,
  wrongOrder,
  alreadyActivated,
  invalidOrderState,
}

String warrantySerialValidationMessage(
  WarrantySerialValidationErrorCode code, {
  required bool isEnglish,
  required String serial,
  String? productName,
  String? actualOrderId,
  String? expectedOrderId,
}) {
  switch (code) {
    case WarrantySerialValidationErrorCode.invalidSerial:
      return isEnglish ? 'Serial is invalid.' : 'Serial không hợp lệ.';
    case WarrantySerialValidationErrorCode.notImported:
      return isEnglish
          ? 'Serial $serial is not available in inventory.'
          : 'Serial $serial chưa được nhập kho.';
    case WarrantySerialValidationErrorCode.wrongProduct:
      return isEnglish
          ? 'Serial $serial does not belong to product $productName.'
          : 'Serial $serial không thuộc sản phẩm $productName.';
    case WarrantySerialValidationErrorCode.wrongOrder:
      return isEnglish
          ? 'Serial $serial belongs to order $actualOrderId, not order $expectedOrderId.'
          : 'Serial $serial thuộc đơn $actualOrderId, không thuộc đơn $expectedOrderId.';
    case WarrantySerialValidationErrorCode.alreadyActivated:
      return isEnglish
          ? 'Serial $serial was already activated.'
          : 'Serial $serial đã được kích hoạt trước đó.';
    case WarrantySerialValidationErrorCode.invalidOrderState:
      return isEnglish
          ? 'Serial $serial is not linked to a completed order yet.'
          : 'Serial $serial chưa thuộc đơn đã hoàn thành.';
  }
}

enum WarrantySyncMessageCode {
  apiNotConfigured,
  unauthenticated,
  invalidSerialPayload,
  invalidWarrantyPayload,
  serialSyncFailed,
  remoteSerialNotFound,
  activationFailed,
  syncFailed,
}

const String _warrantySyncMessageTokenPrefix = 'warranty.sync.message.';

String warrantySyncMessageToken(WarrantySyncMessageCode code) =>
    '$_warrantySyncMessageTokenPrefix${code.name}';

String resolveWarrantySyncMessage(String? message, {required bool isEnglish}) {
  final normalized = message?.trim();
  if (normalized == null || normalized.isEmpty) {
    return isEnglish
        ? 'Unable to sync warranty data.'
        : 'Không thể đồng bộ dữ liệu bảo hành.';
  }

  switch (normalized) {
    case 'warranty.sync.message.apiNotConfigured':
      return isEnglish
          ? 'Warranty API is not configured.'
          : 'API bảo hành chưa được cấu hình.';
    case 'warranty.sync.message.unauthenticated':
      return isEnglish
          ? 'You need to sign in before activating warranty.'
          : 'Bạn cần đăng nhập trước khi kích hoạt bảo hành.';
    case 'warranty.sync.message.invalidSerialPayload':
      return isEnglish
          ? 'Serial inventory data is invalid.'
          : 'Dữ liệu serial tồn kho không hợp lệ.';
    case 'warranty.sync.message.invalidWarrantyPayload':
      return isEnglish
          ? 'Warranty activation data is invalid.'
          : 'Dữ liệu kích hoạt bảo hành không hợp lệ.';
    case 'warranty.sync.message.serialSyncFailed':
      return isEnglish
          ? 'Unable to sync serial inventory.'
          : 'Không thể đồng bộ serial tồn kho.';
    case 'warranty.sync.message.remoteSerialNotFound':
      return isEnglish
          ? 'The selected serial is not available for warranty activation.'
          : 'Serial đã chọn không sẵn sàng để kích hoạt bảo hành.';
    case 'warranty.sync.message.activationFailed':
      return isEnglish
          ? 'Unable to activate warranty. Please try again.'
          : 'Không thể kích hoạt bảo hành. Vui lòng thử lại.';
    case 'warranty.sync.message.syncFailed':
      return isEnglish
          ? 'Unable to sync warranty data.'
          : 'Không thể đồng bộ dữ liệu bảo hành.';
    default:
      return normalized;
  }
}

String warrantySyncErrorMessage(Object? error, {required bool isEnglish}) {
  final message = switch (error) {
    WarrantySyncException() => error.message,
    String() => error,
    _ => error?.toString(),
  };
  return resolveWarrantySyncMessage(message, isEnglish: isEnglish);
}

class WarrantySyncException implements Exception {
  const WarrantySyncException(this.message);

  final String message;

  @override
  String toString() => message;
}
