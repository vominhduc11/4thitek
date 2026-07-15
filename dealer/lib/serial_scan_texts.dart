part of 'serial_scan_screen.dart';

class _SerialScanTexts {
  const _SerialScanTexts({required this.isEnglish});

  final bool isEnglish;

  String get clipboardEmptyMessage => serialScanErrorMessage(
    SerialScanErrorCode.clipboardEmpty,
    isEnglish: isEnglish,
  );
  String get noImageSelectedMessage => serialScanErrorMessage(
    SerialScanErrorCode.noImageSelected,
    isEnglish: isEnglish,
  );
  String get noCodeFoundInImageMessage => serialScanErrorMessage(
    SerialScanErrorCode.noCodeFoundInImage,
    isEnglish: isEnglish,
  );
  String get imagePickerUnavailableMessage => serialScanErrorMessage(
    SerialScanErrorCode.imagePickerUnavailable,
    isEnglish: isEnglish,
  );
  String get cannotReadSerialFromImageMessage => serialScanErrorMessage(
    SerialScanErrorCode.cannotReadSerialFromImage,
    isEnglish: isEnglish,
  );
  String get cannotRestartCameraMessage => serialScanErrorMessage(
    SerialScanErrorCode.cannotRestartCamera,
    isEnglish: isEnglish,
  );
  String get cannotStartCameraMessage => serialScanErrorMessage(
    SerialScanErrorCode.cannotStartCamera,
    isEnglish: isEnglish,
  );
  String get enterSerialPromptMessage => serialScanErrorMessage(
    SerialScanErrorCode.enterSerialPrompt,
    isEnglish: isEnglish,
  );

  String get screenTitle =>
      isEnglish ? 'Scan QR / Barcode' : 'Quét QR / Barcode';
  String get fromImageTooltip => isEnglish ? 'Scan from image' : 'Quét từ ảnh';
  String get turnOffFlashlightTooltip =>
      isEnglish ? 'Turn off flashlight' : 'Tắt đèn pin';
  String get turnOnFlashlightTooltip =>
      isEnglish ? 'Turn on flashlight' : 'Bật đèn pin';
  String get switchCameraTooltip => isEnglish ? 'Switch camera' : 'Đổi camera';
  String get cameraPermissionDeniedMessage => serialScanErrorMessage(
    SerialScanErrorCode.cameraPermissionDenied,
    isEnglish: isEnglish,
  );
  String get cameraAccessErrorMessage => serialScanErrorMessage(
    SerialScanErrorCode.cameraAccessError,
    isEnglish: isEnglish,
  );
  String get cameraErrorTitle =>
      isEnglish ? 'Cannot access camera' : 'Không thể truy cập camera';
  String get cameraLoadingStatus =>
      isEnglish ? 'Starting camera...' : 'Đang khởi động camera...';
  String get cameraReadyStatus => isEnglish
      ? 'Scanning... Keep the code inside the frame.'
      : 'Đang quét mã. Giữ mã trong khung.';
  String get manualTitle => isEnglish
      ? 'Cannot scan? Enter manually'
      : 'Không quét được? Nhập thủ công';
  String get manualDescription => isEnglish
      ? 'Paste or type serial when camera cannot read the code.'
      : 'Dán hoặc nhập serial nếu camera không đọc được mã.';
  String get manualHint => isEnglish ? 'Enter serial...' : 'Nhập serial...';
  String get submitSerialTooltip =>
      isEnglish ? 'Submit serial' : 'Xác nhận serial';
  String get clearSerialTooltip => isEnglish ? 'Clear input' : 'Xóa nội dung';
  String get pasteSerialTooltip =>
      isEnglish ? 'Paste from clipboard' : 'Dán từ clipboard';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get scannerAreaLabel =>
      isEnglish ? 'Camera scan frame' : 'Khung quét camera';
  String get scannerAreaHint => isEnglish
      ? 'Align QR or barcode within the frame.'
      : 'Đưa mã QR hoặc barcode vào trong khung.';
  String get statusBannerSemantics =>
      isEnglish ? 'Scan status' : 'Trạng thái quét';
  String get manualSectionSemanticsLabel => isEnglish
      ? 'Manual serial input section'
      : 'Khu vực nhập serial thủ công';
  String get manualSectionSemanticsHint => isEnglish
      ? 'Type, paste, or submit serial manually.'
      : 'Nhập, dán hoặc xác nhận serial thủ công.';
  String get manualFieldSemanticsLabel =>
      isEnglish ? 'Serial text input' : 'Ô nhập serial';
}
