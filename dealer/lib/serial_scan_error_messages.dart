part of 'serial_scan_screen.dart';

enum SerialScanErrorCode {
  clipboardEmpty,
  noImageSelected,
  noCodeFoundInImage,
  imagePickerUnavailable,
  photoLibraryPermissionDenied,
  photoPickerAlreadyOpen,
  cannotOpenPhotoLibrary,
  cannotReadSerialFromImage,
  cannotRestartCamera,
  cannotStartCamera,
  enterSerialPrompt,
  cameraPermissionDenied,
  cameraAccessError,
}

String serialScanErrorMessage(
  SerialScanErrorCode code, {
  required bool isEnglish,
}) {
  switch (code) {
    case SerialScanErrorCode.clipboardEmpty:
      return isEnglish
          ? 'Clipboard has no serial text to paste.'
          : 'Clipboard không có dữ liệu serial để dán.';
    case SerialScanErrorCode.noImageSelected:
      return isEnglish
          ? 'No image selected for scanning.'
          : 'Bạn chưa chọn ảnh để quét.';
    case SerialScanErrorCode.noCodeFoundInImage:
      return isEnglish
          ? 'No QR or barcode found in the selected image.'
          : 'Không tìm thấy mã QR hoặc barcode trong ảnh.';
    case SerialScanErrorCode.imagePickerUnavailable:
      return isEnglish
          ? 'Image picker is unavailable. Please restart the app.'
          : 'Chức năng chọn ảnh chưa sẵn sàng. Hãy khởi động lại app.';
    case SerialScanErrorCode.photoLibraryPermissionDenied:
      return isEnglish
          ? 'Photo library permission denied. Please allow permission and try again.'
          : 'Không có quyền truy cập thư viện ảnh. Hãy cấp quyền rồi thử lại.';
    case SerialScanErrorCode.photoPickerAlreadyOpen:
      return isEnglish
          ? 'Photo picker is already open. Please wait a moment.'
          : 'Thư viện ảnh đang mở. Vui lòng chờ trong giây lát.';
    case SerialScanErrorCode.cannotOpenPhotoLibrary:
      return isEnglish
          ? 'Cannot open photo library. Please try again.'
          : 'Không thể mở thư viện ảnh. Vui lòng thử lại.';
    case SerialScanErrorCode.cannotReadSerialFromImage:
      return isEnglish
          ? 'Cannot read serial from image. Please try again.'
          : 'Không thể đọc mã từ ảnh. Vui lòng thử lại.';
    case SerialScanErrorCode.cannotRestartCamera:
      return isEnglish
          ? 'Cannot restart camera. Please try again.'
          : 'Không thể khởi động lại camera. Vui lòng thử lại.';
    case SerialScanErrorCode.cannotStartCamera:
      return isEnglish
          ? 'Cannot start camera. Please try again.'
          : 'Không thể khởi động camera. Vui lòng thử lại.';
    case SerialScanErrorCode.enterSerialPrompt:
      return isEnglish
          ? 'Please enter serial or QR content.'
          : 'Vui lòng nhập serial hoặc mã QR.';
    case SerialScanErrorCode.cameraPermissionDenied:
      return isEnglish
          ? 'Camera permission is denied. Open app settings and enable camera access.'
          : 'Quyền camera đang bị từ chối. Hãy vào cài đặt ứng dụng và bật lại quyền.';
    case SerialScanErrorCode.cameraAccessError:
      return isEnglish
          ? 'Cannot access camera. Please check and try again.'
          : 'Không thể truy cập camera. Hãy kiểm tra lại và thử lại.';
  }
}

String serialScanPhotoLibraryErrorMessage({
  required String platformCode,
  required bool isEnglish,
}) {
  final normalized = platformCode.trim().toLowerCase();
  if (normalized.contains('denied')) {
    return serialScanErrorMessage(
      SerialScanErrorCode.photoLibraryPermissionDenied,
      isEnglish: isEnglish,
    );
  }
  if (normalized.contains('already_active')) {
    return serialScanErrorMessage(
      SerialScanErrorCode.photoPickerAlreadyOpen,
      isEnglish: isEnglish,
    );
  }
  return serialScanErrorMessage(
    SerialScanErrorCode.cannotOpenPhotoLibrary,
    isEnglish: isEnglish,
  );
}
