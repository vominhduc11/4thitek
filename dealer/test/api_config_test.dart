import 'package:dealer_hub/api_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('DealerApiConfig falls back to production API base URL', () {
    expect(DealerApiConfig.baseUrl, 'https://api.4thitek.vn');
    expect(DealerApiConfig.isConfigured, isTrue);
    expect(DealerApiConfig.apiVersion, 'v1');
    expect(DealerApiConfig.apiBaseUrl, 'https://api.4thitek.vn/api/v1');
    expect(
      DealerApiConfig.authLoginUri,
      Uri.parse('https://api.4thitek.vn/api/v1/auth/login'),
    );
  });

  test(
    'DealerApiConfig normalizes configured API URLs with legacy suffixes',
    () {
      expect(
        DealerApiConfig.normalizeApiBaseUrlForTesting(
          'https://api.4thitek.vn/api',
        ),
        'https://api.4thitek.vn',
      );
      expect(
        DealerApiConfig.normalizeApiBaseUrlForTesting(
          'https://api.4thitek.vn/api/v1',
        ),
        'https://api.4thitek.vn',
      );
      expect(
        DealerApiConfig.normalizeApiBaseUrlForTesting('https://api.4thitek.vn'),
        'https://api.4thitek.vn',
      );
    },
  );

  test('DealerApiConfig builds versioned API paths from origin + version', () {
    expect(DealerApiConfig.apiPath('/dealer/orders'), '/api/v1/dealer/orders');
    expect(
      DealerApiConfig.resolveApiUrl('/dealer/orders'),
      'https://api.4thitek.vn/api/v1/dealer/orders',
    );
    expect(
      DealerApiConfig.resolveApiUri('/dealer/orders'),
      Uri.parse('https://api.4thitek.vn/api/v1/dealer/orders'),
    );
    expect(
      DealerApiConfig.apiPath('/dealer/orders', version: 'v3'),
      '/api/v3/dealer/orders',
    );
    expect(
      DealerApiConfig.resolveApiUrl('/dealer/orders', version: 'v3'),
      'https://api.4thitek.vn/api/v3/dealer/orders',
    );
  });

  test(
    'DealerApiConfig resolves legacy support attachment keys to upload endpoint URLs',
    () {
      expect(
        DealerApiConfig.resolveUploadUrl(
          'support/evidence/dealers/1/9d0e914f-proof.jpg',
        ),
        'https://api.4thitek.vn/api/v1/upload/support/evidence/dealers/1/9d0e914f-proof.jpg',
      );
    },
  );

  test(
    'DealerApiConfig rewrites uploads-prefixed support attachment keys to the authenticated upload endpoint',
    () {
      expect(
        DealerApiConfig.resolveUploadUrl(
          '/uploads/support/evidence/1/638c7523-2267-4c58-b7aa-dd94042fe9e1.png',
        ),
        'https://api.4thitek.vn/api/v1/upload/support/evidence/1/638c7523-2267-4c58-b7aa-dd94042fe9e1.png',
      );
    },
  );

  test('DealerApiConfig keeps products/blog keys under /uploads', () {
    expect(
      DealerApiConfig.resolveUploadUrl('products/catalog/hero.png'),
      'https://api.4thitek.vn/uploads/products/catalog/hero.png',
    );
  });
}
