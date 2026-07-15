import 'dart:convert';

import 'package:dealer_hub/api_client_helpers.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('buildAuthorizedHeaders', () {
    test('produces Accept + Bearer authorization headers', () {
      final headers = buildAuthorizedHeaders('abc123');

      expect(headers, {
        'Accept': 'application/json',
        'Authorization': 'Bearer abc123',
      });
    });
  });

  group('buildAuthorizedJsonHeaders', () {
    test('adds JSON content type on top of authorized headers', () {
      final headers = buildAuthorizedJsonHeaders('abc123');

      expect(headers, {
        'Accept': 'application/json',
        'Authorization': 'Bearer abc123',
        'Content-Type': 'application/json',
      });
    });
  });

  group('decodeJsonBody', () {
    test('decodes a JSON object into a string-keyed map', () {
      final decoded = decodeJsonBody('{"a":1,"b":"x"}');

      expect(decoded, {'a': 1, 'b': 'x'});
    });

    test('returns an empty const map for blank input', () {
      expect(decodeJsonBody(''), isEmpty);
      expect(decodeJsonBody('   '), isEmpty);
    });

    test('returns an empty map when the payload is not a JSON object', () {
      expect(decodeJsonBody('[1,2,3]'), isEmpty);
      expect(decodeJsonBody('"plain string"'), isEmpty);
      expect(decodeJsonBody('42'), isEmpty);
    });

    test('throws on malformed JSON', () {
      expect(() => decodeJsonBody('{not json'), throwsFormatException);
    });
  });

  group('decodeJsonBytes', () {
    test('decodes UTF-8 bytes preserving Vietnamese diacritics', () {
      final bytes = utf8.encode('{"message":"Đã thanh toán"}');

      final decoded = decodeJsonBytes(bytes);

      expect(decoded['message'], 'Đã thanh toán');
    });

    test('returns an empty map for empty bytes', () {
      expect(decodeJsonBytes(const <int>[]), isEmpty);
    });
  });
}
