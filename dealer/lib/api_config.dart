import 'package:flutter/foundation.dart';

class DealerApiConfig {
  static const String _rawApiOrigin = String.fromEnvironment('API_ORIGIN');
  static const String _rawApiVersion = String.fromEnvironment(
    'API_VERSION',
    defaultValue: '',
  );
  static const String _rawBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );
  static const String _rawWebSocketBaseUrl = String.fromEnvironment(
    'WS_BASE_URL',
  );
  static const String _rawPublicSiteBaseUrl = String.fromEnvironment(
    'PUBLIC_SITE_BASE_URL',
    defaultValue: 'https://4thitek.vn',
  );

  static String get baseUrl {
    final explicitOrigin = _sanitizeConfiguredApiOrigin(_rawApiOrigin);
    if (explicitOrigin.isNotEmpty) {
      return explicitOrigin;
    }

    final legacyBaseUrl = _sanitizeConfiguredApiOrigin(_rawBaseUrl);
    if (legacyBaseUrl.isNotEmpty) {
      return legacyBaseUrl;
    }

    return 'https://api.4thitek.vn';
  }

  static String get apiVersion {
    final explicitVersion = _normalizeApiVersion(_rawApiVersion);
    if (explicitVersion.isNotEmpty) {
      return explicitVersion;
    }

    final legacyVersion = _deriveApiVersionFromBaseUrl(_rawBaseUrl);
    if (legacyVersion.isNotEmpty) {
      return legacyVersion;
    }

    return 'v1';
  }

  static String get apiBasePath => '/api/$apiVersion';

  static String get apiBaseUrl => _resolveUrlWithBase(baseUrl, apiBasePath);

  static String get webSocketBaseUrl =>
      _sanitizeConfiguredApiOrigin(_rawWebSocketBaseUrl);

  static String get publicSiteBaseUrl {
    final normalized = _sanitizeConfiguredBaseUrl(_rawPublicSiteBaseUrl);
    return normalized.isEmpty ? 'https://4thitek.vn' : normalized;
  }

  static bool get isConfigured => baseUrl.isNotEmpty;

  static Uri get authLoginUri => resolveApiUri('/auth/login');

  static Uri get authRefreshUri => resolveApiUri('/auth/refresh');

  static String get webSocketEndpointUrl {
    final normalizedWebSocketBaseUrl = webSocketBaseUrl.trim();
    final effectiveBaseUrl = normalizedWebSocketBaseUrl.isEmpty
        ? baseUrl
        : normalizedWebSocketBaseUrl;
    if (effectiveBaseUrl.isEmpty) {
      return '';
    }
    return _resolveUrlWithBase(effectiveBaseUrl, '/ws');
  }

  static Uri get dealerRegistrationPageUri {
    final normalizedBaseUrl = publicSiteBaseUrl.trim().replaceFirst(
      RegExp(r'/$'),
      '',
    );
    return Uri.parse('$normalizedBaseUrl/become_our_reseller');
  }

  static Uri uploadUri(String category) => resolveApiUri('/upload/$category');

  static String apiPath(String path, {String? version}) {
    final trimmed = path.trim();
    final normalizedVersion = _normalizeApiVersion(version ?? '');
    final effectiveVersion = normalizedVersion.isEmpty
        ? apiVersion
        : normalizedVersion;
    final effectiveApiBasePath = '/api/$effectiveVersion';
    if (trimmed.isEmpty) {
      return effectiveApiBasePath;
    }
    if (trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:')) {
      return trimmed;
    }
    if (trimmed.startsWith('/api/')) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      return '$effectiveApiBasePath$trimmed';
    }
    return '$effectiveApiBasePath/$trimmed';
  }

  static String resolveApiUrl(String path, {String? version}) {
    return _resolveUrlWithBase(baseUrl, apiPath(path, version: version));
  }

  static Uri resolveApiUri(String path, {String? version}) =>
      Uri.parse(resolveApiUrl(path, version: version));

  static bool isResolvedApiUploadUrl(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      return false;
    }
    return trimmed.contains('$apiBasePath/upload/');
  }

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

  static String _sanitizeConfiguredBaseUrl(String value) {
    final trimmed = value.trim().replaceFirst(RegExp(r'/$'), '');
    if (trimmed.isEmpty) {
      return '';
    }

    final parsed = Uri.tryParse(trimmed);
    final host = parsed?.host.trim().toLowerCase() ?? '';
    if (host.isNotEmpty &&
        (host == 'example.com' || host.endsWith('.example.com'))) {
      return '';
    }

    return trimmed;
  }

  static String _sanitizeConfiguredApiOrigin(String value) {
    final sanitized = _sanitizeConfiguredBaseUrl(value);
    if (sanitized.isEmpty) {
      return '';
    }
    return sanitized.replaceFirst(
      RegExp(r'/api(?:/v[^/]+)?$', caseSensitive: false),
      '',
    );
  }

  static String _normalizeApiVersion(String value) {
    final trimmed = value
        .trim()
        .replaceFirst(RegExp(r'^/+'), '')
        .replaceFirst(RegExp(r'/+$'), '');
    if (trimmed.isEmpty) {
      return '';
    }
    if (RegExp(r'^\d+$').hasMatch(trimmed)) {
      return 'v$trimmed';
    }
    final lowered = trimmed.toLowerCase();
    if (RegExp(r'^v\d+$').hasMatch(lowered)) {
      return lowered;
    }
    return lowered.startsWith('v') ? lowered : 'v$lowered';
  }

  static String _deriveApiVersionFromBaseUrl(String value) {
    final sanitized = _sanitizeConfiguredBaseUrl(value);
    if (sanitized.isEmpty) {
      return '';
    }
    final match = RegExp(
      r'/api/(v[^/]+)$',
      caseSensitive: false,
    ).firstMatch(sanitized);
    if (match == null) {
      return sanitized.toLowerCase().endsWith('/api') ? 'v1' : '';
    }
    return _normalizeApiVersion(match.group(1) ?? '');
  }

  @visibleForTesting
  static String normalizeApiBaseUrlForTesting(String value) =>
      _sanitizeConfiguredApiOrigin(value);

  static const Map<String, String> jsonHeaders = <String, String>{
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}
