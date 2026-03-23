import 'package:dealer_hub/dealer_routes.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('normalizeDealerInternalRoute', () {
    test('maps empty root path to home', () {
      expect(normalizeDealerInternalRoute('/'), DealerRoutePath.home);
    });

    test('maps legacy support routes to support screen', () {
      expect(
        normalizeDealerInternalRoute('/dealer/support'),
        DealerRoutePath.support,
      );
      expect(
        normalizeDealerInternalRoute('/account/support'),
        DealerRoutePath.support,
      );
    });

    test('preserves order detail routes', () {
      expect(
        normalizeDealerInternalRoute('/orders/ABC-1'),
        '/orders/ABC-1',
      );
    });

    test('maps legacy warranty activation landing route to warranty hub', () {
      expect(
        normalizeDealerInternalRoute('/warranty-activation'),
        DealerRoutePath.warranty,
      );
    });

    test('returns null for external links', () {
      expect(
        normalizeDealerInternalRoute('https://example.com/orders/ABC-1'),
        isNull,
      );
    });
  });

  group('isDealerTopLevelRoute', () {
    test('identifies top level routes correctly', () {
      expect(isDealerTopLevelRoute(DealerRoutePath.home), isTrue);
      expect(isDealerTopLevelRoute(DealerRoutePath.support), isTrue);
      expect(isDealerTopLevelRoute('/orders/ABC-1'), isFalse);
      expect(isDealerTopLevelRoute('/warranty/export'), isFalse);
    });
  });
}
