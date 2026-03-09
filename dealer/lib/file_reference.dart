import 'dart:convert';

import 'package:flutter/material.dart';

import 'api_config.dart';

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
    return NetworkImage(resolved);
  }

  return null;
}
