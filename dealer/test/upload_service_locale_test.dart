import 'package:dealer_hub/upload_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('resolveUploadServiceMessage maps unauthenticated in English', () {
    expect(
      resolveUploadServiceMessage(
        uploadServiceMessageToken(UploadMessageCode.unauthenticated),
        isEnglish: true,
      ),
      'You need to sign in before uploading files.',
    );
  });

  test('resolveUploadServiceMessage maps unauthenticated in Vietnamese', () {
    expect(
      resolveUploadServiceMessage(
        uploadServiceMessageToken(UploadMessageCode.unauthenticated),
        isEnglish: false,
      ),
      'Bạn cần đăng nhập trước khi tải tệp lên.',
    );
  });

  test('resolveUploadServiceMessage maps upload failed in English and Vietnamese', () {
    expect(
      resolveUploadServiceMessage(
        uploadServiceMessageToken(UploadMessageCode.uploadFailed),
        isEnglish: true,
      ),
      'Upload failed.',
    );
    expect(
      resolveUploadServiceMessage(
        uploadServiceMessageToken(UploadMessageCode.uploadFailed),
        isEnglish: false,
      ),
      'Tải lên thất bại.',
    );
  });

  test('uploadServiceErrorMessage preserves backend-provided message', () {
    expect(
      uploadServiceErrorMessage(
        const UploadException('Storage provider unavailable.'),
        isEnglish: false,
      ),
      'Storage provider unavailable.',
    );
  });
}
