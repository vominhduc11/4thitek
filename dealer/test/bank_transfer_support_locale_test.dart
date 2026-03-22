import 'package:dealer_hub/bank_transfer_support.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Bank transfer fallback errors render English copy', () {
    expect(
      bankTransferLoadErrorMessage(
        const BankTransferException.unauthenticated(),
        isEnglish: true,
      ),
      'You need to sign in to view bank transfer information.',
    );
    expect(
      bankTransferLoadErrorMessage(
        const BankTransferException.invalidPayload(),
        isEnglish: true,
      ),
      'The system returned invalid bank transfer information.',
    );
    expect(
      bankTransferLoadErrorMessage(
        const BankTransferException.unavailable(),
        isEnglish: true,
      ),
      'Unable to load bank transfer information.',
    );
  });

  test('Bank transfer fallback errors render Vietnamese copy', () {
    expect(
      bankTransferLoadErrorMessage(
        const BankTransferException.unauthenticated(),
        isEnglish: false,
      ),
      'Bạn cần đăng nhập để xem thông tin chuyển khoản.',
    );
    expect(
      bankTransferLoadErrorMessage(
        const BankTransferException.invalidPayload(),
        isEnglish: false,
      ),
      'Hệ thống trả về thông tin chuyển khoản không hợp lệ.',
    );
    expect(
      bankTransferLoadErrorMessage(
        const BankTransferException.unavailable(),
        isEnglish: false,
      ),
      'Không thể tải thông tin chuyển khoản.',
    );
  });

  test('Bank transfer raw server errors are preserved', () {
    expect(
      bankTransferLoadErrorMessage(
        const BankTransferException('Sepay is disabled.'),
        isEnglish: true,
      ),
      'Sepay is disabled.',
    );
    expect(
      bankTransferLoadErrorMessage(
        const BankTransferException('He thong tam bao tri.'),
        isEnglish: false,
      ),
      'He thong tam bao tri.',
    );
  });
}
