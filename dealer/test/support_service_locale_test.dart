import 'package:dealer_hub/support_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('resolveSupportServiceMessage maps internal fallback in English', () {
    expect(
      resolveSupportServiceMessage(
        supportServiceMessageToken(SupportMessageCode.syncFailed),
        isEnglish: true,
      ),
      'Unable to sync support request.',
    );
  });

  test('resolveSupportServiceMessage maps internal fallback in Vietnamese', () {
    expect(
      resolveSupportServiceMessage(
        supportServiceMessageToken(SupportMessageCode.syncFailed),
        isEnglish: false,
      ),
      'Khong the dong bo yeu cau ho tro.',
    );
  });

  test('resolveSupportServiceMessage preserves backend-provided message', () {
    expect(
      resolveSupportServiceMessage('Support is overloaded.', isEnglish: false),
      'Support is overloaded.',
    );
  });
}
