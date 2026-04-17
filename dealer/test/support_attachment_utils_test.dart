import 'package:dealer_hub/support_attachment_utils.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('detects image by filename extension', () {
    expect(
      isLikelyImageAttachment(fileName: 'evidence.PNG', url: null),
      isTrue,
    );
  });

  test('detects image by url hint', () {
    expect(
      isLikelyImageAttachment(
        fileName: null,
        url: 'https://cdn.example.com/upload?id=1&mime=image/jpeg',
      ),
      isTrue,
    );
  });

  test('falls back to non-image when not enough evidence', () {
    expect(
      isLikelyImageAttachment(
        fileName: 'statement.pdf',
        url: 'https://cdn.example.com/files/statement.pdf',
      ),
      isFalse,
    );
  });
}
