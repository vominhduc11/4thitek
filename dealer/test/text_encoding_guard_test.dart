import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('source files keep valid Vietnamese UTF-8 text', () async {
    final sourceDir = Directory('lib');
    expect(sourceDir.existsSync(), isTrue, reason: 'Missing lib/ directory.');

    const mojibakeFingerprints = <String>[
      'Ã',
      'áº',
      'á»',
      'á¼',
      'á¸',
      'Ä‘',
      'Æ°',
      'â€™',
      'â€œ',
      'â€',
      'â€“',
      'â€”',
      'â‚«',
      '�',
    ];

    final brokenCharPattern = RegExp(r'[\u00C0-\u1EF9]\?[\u00C0-\u1EF9]|\?\?');
    final stringLiteralPattern = RegExp(
      r"""('([^'\\]|\\.)*'|"([^"\\]|\\.)*")""",
    );

    final violations = <String>[];
    final dartFiles =
        sourceDir
            .listSync(recursive: true)
            .whereType<File>()
            .where((file) => file.path.endsWith('.dart'))
            .toList()
          ..sort((a, b) => a.path.compareTo(b.path));

    for (final file in dartFiles) {
      final bytes = file.readAsBytesSync();
      late final String content;
      try {
        content = utf8.decode(bytes);
      } on FormatException {
        violations.add('${file.path}: file is not valid UTF-8.');
        continue;
      }

      final lines = const LineSplitter().convert(content);
      for (var i = 0; i < lines.length; i++) {
        final line = lines[i];
        for (final marker in mojibakeFingerprints) {
          if (line.contains(marker)) {
            violations.add('${file.path}:${i + 1} contains "$marker".');
            break;
          }
        }

        for (final match in stringLiteralPattern.allMatches(line)) {
          var literal = match.group(0) ?? '';
          if (literal.length < 2) {
            continue;
          }
          literal = literal.substring(1, literal.length - 1);
          if (literal == '?') {
            continue;
          }
          if (brokenCharPattern.hasMatch(literal)) {
            violations.add(
              '${file.path}:${i + 1} has suspicious text "$literal".',
            );
            break;
          }
        }
      }
    }

    expect(violations, isEmpty, reason: violations.join('\n'));
  });
}
