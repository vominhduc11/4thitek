import 'package:dealer_hub/validation_utils.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('validateVietnamPhoneNumber matches backend regex', () {
    expect(
      validateVietnamPhoneNumber(
        '0901234567',
        emptyMessage: 'required',
        invalidMessage: 'invalid',
      ),
      isNull,
    );
    expect(
      validateVietnamPhoneNumber(
        '1234567890',
        emptyMessage: 'required',
        invalidMessage: 'invalid',
      ),
      'invalid',
    );
    expect(
      validateVietnamPhoneNumber(
        '090123456',
        emptyMessage: 'required',
        invalidMessage: 'invalid',
      ),
      'invalid',
    );
  });
}
