class DealerApiConfig {
  static const String baseUrl = String.fromEnvironment('API_BASE_URL');
  static const String webSocketBaseUrl = String.fromEnvironment(
    'WS_BASE_URL',
  );
  static const String publicSiteBaseUrl = String.fromEnvironment(
    'PUBLIC_SITE_BASE_URL',
    defaultValue: 'https://4thitek.vn',
  );

  static bool get isConfigured => baseUrl.trim().isNotEmpty;

  static Uri get authLoginUri => Uri.parse('$baseUrl/api/auth/login');

  static Uri get authRefreshUri => Uri.parse('$baseUrl/api/auth/refresh');

  static String get webSocketEndpointUrl {
    final normalizedWebSocketBaseUrl = webSocketBaseUrl.trim();
    final effectiveBaseUrl = normalizedWebSocketBaseUrl.isEmpty
        ? baseUrl
        : normalizedWebSocketBaseUrl;
    return _resolveUrlWithBase(effectiveBaseUrl, '/ws');
  }

  static Uri get dealerRegistrationPageUri {
    final normalizedBaseUrl = publicSiteBaseUrl.trim().replaceFirst(
      RegExp(r'/$'),
      '',
    );
    return Uri.parse('$normalizedBaseUrl/become_our_reseller');
  }

  static Uri uploadUri(String category) =>
      Uri.parse('$baseUrl/api/upload/$category');

  static String resolveUrl(String path) {
    return _resolveUrlWithBase(baseUrl, path);
  }

  static String _resolveUrlWithBase(String base, String path) {
    final trimmed = path.trim();
    if (trimmed.isEmpty ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:')) {
      return trimmed;
    }
    final normalizedBase = base.trim().replaceFirst(RegExp(r'/$'), '');
    if (trimmed.startsWith('/')) {
      return '$normalizedBase$trimmed';
    }
    return '$normalizedBase/$trimmed';
  }

  static const Map<String, String> jsonHeaders = <String, String>{
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}
