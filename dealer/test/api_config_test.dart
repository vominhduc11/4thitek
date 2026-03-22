import 'package:dealer_hub/api_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('DealerApiConfig falls back to production API base URL', () {
    expect(DealerApiConfig.baseUrl, 'https://api.4thitek.vn');
    expect(DealerApiConfig.isConfigured, isTrue);
    expect(
      DealerApiConfig.authLoginUri,
      Uri.parse('https://api.4thitek.vn/api/v1/auth/login'),
    );
  });
}
