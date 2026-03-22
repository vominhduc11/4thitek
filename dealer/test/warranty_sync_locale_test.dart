import 'package:dealer_hub/warranty_controller.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Warranty sync messages render English copy', () {
    expect(
      resolveWarrantySyncMessage(
        warrantySyncMessageToken(WarrantySyncMessageCode.remoteSerialNotFound),
        isEnglish: true,
      ),
      'The selected serial is not available for warranty activation.',
    );
    expect(
      resolveWarrantySyncMessage(
        warrantySyncMessageToken(WarrantySyncMessageCode.activationFailed),
        isEnglish: true,
      ),
      'Unable to activate warranty. Please try again.',
    );
  });

  test('Warranty sync messages render Vietnamese copy', () {
    expect(
      resolveWarrantySyncMessage(
        warrantySyncMessageToken(WarrantySyncMessageCode.remoteSerialNotFound),
        isEnglish: false,
      ),
      'Serial da chon khong san sang de kich hoat bao hanh.',
    );
    expect(
      resolveWarrantySyncMessage(
        warrantySyncMessageToken(WarrantySyncMessageCode.activationFailed),
        isEnglish: false,
      ),
      'Khong the kich hoat bao hanh. Vui long thu lai.',
    );
  });

  test('Warranty sync error helper resolves exception tokens', () {
    expect(
      warrantySyncErrorMessage(
        WarrantySyncException(
          warrantySyncMessageToken(WarrantySyncMessageCode.serialSyncFailed),
        ),
        isEnglish: true,
      ),
      'Unable to sync serial inventory.',
    );
    expect(
      warrantySyncErrorMessage(
        WarrantySyncException(
          warrantySyncMessageToken(WarrantySyncMessageCode.unauthenticated),
        ),
        isEnglish: false,
      ),
      'Ban can dang nhap truoc khi kich hoat bao hanh.',
    );
  });

  test('Warranty sync error helper preserves raw backend messages', () {
    expect(
      warrantySyncErrorMessage(
        const WarrantySyncException('Serial SN-001 is already active.'),
        isEnglish: true,
      ),
      'Serial SN-001 is already active.',
    );
  });
}
