import 'package:dealer_hub/message_resolver.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const messages = <String, MessagePair>{
    'domain.message.invalid': ('Invalid data.', 'Dữ liệu không hợp lệ.'),
  };
  const MessagePair fallback = ('Something went wrong.', 'Đã có lỗi xảy ra.');

  group('resolveMessageCode - known tokens', () {
    test('returns the English variant when isEnglish is true', () {
      final resolved = resolveMessageCode(
        message: 'domain.message.invalid',
        messages: messages,
        isEnglish: true,
      );

      expect(resolved, 'Invalid data.');
    });

    test('returns the Vietnamese variant with diacritics when not English', () {
      final resolved = resolveMessageCode(
        message: 'domain.message.invalid',
        messages: messages,
        isEnglish: false,
      );

      expect(resolved, 'Dữ liệu không hợp lệ.');
    });

    test('trims surrounding whitespace before matching a token', () {
      final resolved = resolveMessageCode(
        message: '  domain.message.invalid  ',
        messages: messages,
        isEnglish: true,
      );

      expect(resolved, 'Invalid data.');
    });
  });

  group('resolveMessageCode - blank input', () {
    test('uses the localized fallback when a fallback is provided', () {
      expect(
        resolveMessageCode(
          message: '   ',
          messages: messages,
          isEnglish: true,
          fallback: fallback,
        ),
        'Something went wrong.',
      );
      expect(
        resolveMessageCode(
          message: null,
          messages: messages,
          isEnglish: false,
          fallback: fallback,
        ),
        'Đã có lỗi xảy ra.',
      );
    });

    test('returns the original value when no fallback is provided', () {
      expect(
        resolveMessageCode(message: null, messages: messages, isEnglish: true),
        '',
      );
      expect(
        resolveMessageCode(message: '', messages: messages, isEnglish: true),
        '',
      );
    });
  });

  group('resolveMessageCode - unknown tokens', () {
    test('falls back to the dynamic resolver when the token is unmapped', () {
      final resolved = resolveMessageCode(
        message: 'stock:42',
        messages: messages,
        isEnglish: true,
        dynamicResolver: (raw, {required bool isEnglish}) {
          if (raw.startsWith('stock:')) {
            final qty = raw.substring('stock:'.length);
            return isEnglish ? 'Only $qty left.' : 'Chỉ còn $qty.';
          }
          return null;
        },
      );

      expect(resolved, 'Only 42 left.');
    });

    test('returns the normalized message when nothing else matches', () {
      final resolved = resolveMessageCode(
        message: '  A human readable server message  ',
        messages: messages,
        isEnglish: true,
      );

      expect(resolved, 'A human readable server message');
    });

    test(
      'returns the normalized message when the dynamic resolver declines',
      () {
        final resolved = resolveMessageCode(
          message: 'unmatched.token',
          messages: messages,
          isEnglish: false,
          dynamicResolver: (raw, {required bool isEnglish}) => null,
        );

        expect(resolved, 'unmatched.token');
      },
    );
  });
}
