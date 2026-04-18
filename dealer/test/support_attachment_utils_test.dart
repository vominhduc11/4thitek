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

  test('detects video by content type and extension', () {
    expect(
      isLikelyVideoAttachment(
        fileName: 'clip.webm',
        url: 'https://cdn.example.com/uploads/clip.webm',
        contentType: 'video/webm',
      ),
      isTrue,
    );
  });

  test('detects document by content type and extension', () {
    expect(
      isLikelyDocumentAttachment(
        fileName: 'proof.pdf',
        url: 'https://cdn.example.com/uploads/proof.pdf',
        contentType: 'application/pdf',
      ),
      isTrue,
    );
  });
}
