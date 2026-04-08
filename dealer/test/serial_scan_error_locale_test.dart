import 'package:dealer_hub/serial_scan_screen.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('serialScanErrorMessage maps generic image read failure in English', () {
    expect(
      serialScanErrorMessage(
        SerialScanErrorCode.cannotReadSerialFromImage,
        isEnglish: true,
      ),
      'Cannot read serial from image. Please try again.',
    );
  });

  test('serialScanErrorMessage maps generic image read failure in Vietnamese', () {
    expect(
      serialScanErrorMessage(
        SerialScanErrorCode.cannotReadSerialFromImage,
        isEnglish: false,
      ),
      'Không thể đọc mã từ ảnh. Vui lòng thử lại.',
    );
  });

  test('serialScanPhotoLibraryErrorMessage maps permission denied', () {
    expect(
      serialScanPhotoLibraryErrorMessage(
        platformCode: 'photo_access_denied',
        isEnglish: true,
      ),
      'Photo library permission denied. Please allow permission and try again.',
    );
    expect(
      serialScanPhotoLibraryErrorMessage(
        platformCode: 'photo_access_denied',
        isEnglish: false,
      ),
      'Không có quyền truy cập thư viện ảnh. Hãy cấp quyền rồi thử lại.',
    );
  });

  test('serialScanPhotoLibraryErrorMessage maps already active', () {
    expect(
      serialScanPhotoLibraryErrorMessage(
        platformCode: 'already_active',
        isEnglish: true,
      ),
      'Photo picker is already open. Please wait a moment.',
    );
    expect(
      serialScanPhotoLibraryErrorMessage(
        platformCode: 'already_active',
        isEnglish: false,
      ),
      'Thư viện ảnh đang mở. Vui lòng chờ trong giây lát.',
    );
  });

  test('serialScanPhotoLibraryErrorMessage maps generic fallback', () {
    expect(
      serialScanPhotoLibraryErrorMessage(
        platformCode: 'unexpected_native_error',
        isEnglish: true,
      ),
      'Cannot open photo library. Please try again.',
    );
    expect(
      serialScanPhotoLibraryErrorMessage(
        platformCode: 'unexpected_native_error',
        isEnglish: false,
      ),
      'Không thể mở thư viện ảnh. Vui lòng thử lại.',
    );
  });
}
