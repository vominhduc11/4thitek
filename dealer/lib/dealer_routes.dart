import 'return_request_service.dart';

class DealerRoutePath {
  const DealerRoutePath._();

  static const String launch = '/launch';
  static const String login = '/login';
  static const String home = '/home';
  static const String notifications = '/notifications';
  static const String products = '/products';
  static const String orders = '/orders';
  static const String returns = '/returns';
  static const String support = '/support';
  static const String inventory = '/inventory';
  static const String warranty = '/warranty';
  static const String warrantyExport = '/warranty/export';
  static const String accountSettings = '/account/settings';
  static const String accountPreferences = '/account/preferences';
  static const String accountChangePassword = '/account/change-password';
  static const String cart = '/cart';
  static const String checkout = '/checkout';

  static String productDetail(String productId) =>
      '$products/${Uri.encodeComponent(productId)}';

  static String orderDetail(String orderId) =>
      '$orders/${Uri.encodeComponent(orderId)}';

  static String returnDetail(int requestId) => '$returns/$requestId';

  static String supportWithTicket(int ticketId) => Uri(
    path: support,
    queryParameters: <String, String>{'ticketId': '$ticketId'},
  ).toString();

  static String createReturnRequest(
    String orderId, {
    int? prefilledSerialId,
    DealerReturnRequestType? returnType,
  }) {
    final queryParameters = <String, String>{
      if (prefilledSerialId != null) 'serialId': '$prefilledSerialId',
      if (returnType != null && returnType != DealerReturnRequestType.unknown)
        'type': returnType.apiValue,
    };
    return Uri(
      path: '/orders/${Uri.encodeComponent(orderId)}/returns/new',
      queryParameters: queryParameters.isEmpty ? null : queryParameters,
    ).toString();
  }

  static String warrantyActivation(
    String orderId, {
    String? prefilledSerial,
    String? prefilledProductId,
  }) {
    final queryParameters = <String, String>{
      if (prefilledSerial != null && prefilledSerial.trim().isNotEmpty)
        'serial': prefilledSerial.trim(),
      if (prefilledProductId != null && prefilledProductId.trim().isNotEmpty)
        'productId': prefilledProductId.trim(),
    };
    return Uri(
      path: '/warranty/activation/${Uri.encodeComponent(orderId)}',
      queryParameters: queryParameters.isEmpty ? null : queryParameters,
    ).toString();
  }

  static String inventoryWithFilter(String filter) => Uri(
    path: inventory,
    queryParameters: <String, String>{'filter': filter},
  ).toString();

  static String warrantyExportWithSerial(String serial) => Uri(
    path: warrantyExport,
    queryParameters: <String, String>{'serial': serial},
  ).toString();
}

String? normalizeDealerInternalRoute(String? rawLink) {
  final link = rawLink?.trim() ?? '';
  if (link.isEmpty) {
    return null;
  }

  final uri = Uri.tryParse(link);
  if (uri == null || uri.hasScheme) {
    return null;
  }

  final path = uri.path.trim();
  if (path.isEmpty || path == '/') {
    return DealerRoutePath.home;
  }

  final normalizedPath = switch (path) {
    '/account/support' || '/dealer/support' => DealerRoutePath.support,
    '/account/returns' || '/dealer/returns' => DealerRoutePath.returns,
    '/warranty-activation' => DealerRoutePath.warranty,
    _ => path,
  };

  final routeUri = Uri(
    path: normalizedPath,
    queryParameters: uri.queryParameters.isEmpty ? null : uri.queryParameters,
  );
  return routeUri.toString();
}

bool isDealerTopLevelRoute(String route) {
  final normalized = normalizeDealerInternalRoute(route) ?? route;
  return normalized == DealerRoutePath.home ||
      normalized == DealerRoutePath.products ||
      normalized == DealerRoutePath.orders ||
      normalized == DealerRoutePath.returns ||
      normalized == DealerRoutePath.notifications ||
      normalized == DealerRoutePath.support ||
      normalized == DealerRoutePath.inventory ||
      normalized == DealerRoutePath.warranty;
}
