import 'package:dealer_hub/auth_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('resolveAuthServiceMessage maps internal auth fallback in English', () {
    expect(
      resolveAuthServiceMessage(
        authServiceMessageToken(AuthMessageCode.serverUnavailable),
        isEnglish: true,
      ),
      'Unable to connect to the server. Please try again.',
    );
  });

  test('resolveAuthServiceMessage maps internal auth fallback in Vietnamese', () {
    expect(
      resolveAuthServiceMessage(
        authServiceMessageToken(AuthMessageCode.serverUnavailable),
        isEnglish: false,
      ),
      'Không thể kết nối máy chủ. Vui lòng thử lại.',
    );
  });

  test('resolveAuthServiceMessage maps password reset success fallback', () {
    expect(
      resolveAuthServiceMessage(
        authServiceMessageToken(AuthMessageCode.passwordResetLinkSent),
        isEnglish: true,
      ),
      'If the email exists in our system, a password reset link has been sent.',
    );
    expect(
      resolveAuthServiceMessage(
        authServiceMessageToken(AuthMessageCode.passwordResetLinkSent),
        isEnglish: false,
      ),
      'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại.',
    );
  });

  test('resolveAuthServiceMessage preserves backend-provided message', () {
    expect(
      resolveAuthServiceMessage('Server says no.', isEnglish: false),
      'Server says no.',
    );
  });
}
