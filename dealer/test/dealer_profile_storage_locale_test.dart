import 'package:dealer_hub/dealer_profile_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('resolveDealerProfileStorageMessage maps load failure in English', () {
    expect(
      resolveDealerProfileStorageMessage(
        dealerProfileStorageMessageToken(
          DealerProfileStorageMessageCode.loadFailed,
        ),
        isEnglish: true,
      ),
      'Unable to load dealer profile.',
    );
  });

  test('resolveDealerProfileStorageMessage maps load failure in Vietnamese', () {
    expect(
      resolveDealerProfileStorageMessage(
        dealerProfileStorageMessageToken(
          DealerProfileStorageMessageCode.loadFailed,
        ),
        isEnglish: false,
      ),
      'Khong the tai ho so dai ly.',
    );
  });

  test('resolveDealerProfileStorageMessage maps unauthenticated save error', () {
    expect(
      resolveDealerProfileStorageMessage(
        dealerProfileStorageMessageToken(
          DealerProfileStorageMessageCode.unauthenticated,
        ),
        isEnglish: true,
      ),
      'You need to sign in before updating your profile.',
    );
    expect(
      resolveDealerProfileStorageMessage(
        dealerProfileStorageMessageToken(
          DealerProfileStorageMessageCode.unauthenticated,
        ),
        isEnglish: false,
      ),
      'Ban can dang nhap truoc khi cap nhat ho so.',
    );
  });

  test('dealerProfileStorageErrorMessage preserves backend-provided message', () {
    expect(
      dealerProfileStorageErrorMessage(
        const DealerProfileStorageException('Server says no.'),
        isEnglish: false,
      ),
      'Server says no.',
    );
  });
}
