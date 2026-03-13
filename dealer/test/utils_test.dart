import 'package:dealer_hub/utils.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parseApiDateTime converts UTC payloads to local time', () {
    final parsed = parseApiDateTime('2026-03-13T23:30:00Z');

    expect(parsed, DateTime.parse('2026-03-13T23:30:00Z').toLocal());
  });

  test('formatDateTime renders using local time', () {
    final utcValue = DateTime.parse('2026-03-13T23:30:00Z');
    final localValue = utcValue.toLocal();
    final expected =
        '${localValue.day.toString().padLeft(2, '0')}/${localValue.month.toString().padLeft(2, '0')}/${localValue.year} '
        '${localValue.hour.toString().padLeft(2, '0')}:${localValue.minute.toString().padLeft(2, '0')}';

    expect(formatDateTime(utcValue), expected);
  });
}
