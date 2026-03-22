import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';

import 'api_config.dart';
import 'auth_storage.dart';

String resolveFileReference(String reference) {
  final trimmed = reference.trim();
  if (trimmed.isEmpty) {
    return trimmed;
  }
  if (trimmed.startsWith('data:') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (!DealerApiConfig.isConfigured) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return '${DealerApiConfig.baseUrl}$trimmed';
  }
  return '${DealerApiConfig.baseUrl}/$trimmed';
}

ImageProvider<Object>? imageProviderFromReference(String? reference) {
  final trimmed = reference?.trim() ?? '';
  if (trimmed.isEmpty) {
    return null;
  }

  if (trimmed.startsWith('data:')) {
    final commaIndex = trimmed.indexOf(',');
    if (commaIndex <= 0 || commaIndex + 1 >= trimmed.length) {
      return null;
    }
    final bytes = base64Decode(trimmed.substring(commaIndex + 1));
    return MemoryImage(bytes);
  }

  final resolved = resolveFileReference(trimmed);
  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return NetworkImage(resolved, headers: authHeadersForResolvedUrl(resolved));
  }

  return null;
}

Map<String, String>? authHeadersForResolvedUrl(String? resolvedUrl) {
  final trimmed = resolvedUrl?.trim() ?? '';
  if (trimmed.isEmpty || !trimmed.contains('/api/v1/upload/')) {
    return null;
  }

  final token = AuthStorage.currentAccessToken?.trim();
  if (token == null || token.isEmpty) {
    return null;
  }

  return <String, String>{HttpHeaders.authorizationHeader: 'Bearer $token'};
}
