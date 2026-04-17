import 'dart:typed_data';

import 'package:flutter_file_dialog/flutter_file_dialog.dart';
import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';

class SupportAttachmentAsset {
  const SupportAttachmentAsset({
    required this.bytes,
    required this.dataUri,
    required this.mimeType,
  });

  final Uint8List bytes;
  final String dataUri;
  final String mimeType;
}

Future<String?> saveSupportAttachmentAssetToDevice({
  required SupportAttachmentAsset asset,
  String? preferredFileName,
  String? sourceUrl,
}) async {
  final fileName = resolveSupportAttachmentFileName(
    preferredFileName: preferredFileName,
    sourceUrl: sourceUrl,
    mimeType: asset.mimeType,
  );
  return FlutterFileDialog.saveFile(
    params: SaveFileDialogParams(data: asset.bytes, fileName: fileName),
  );
}

Future<SupportAttachmentAsset> loadSupportAttachmentAsset(
  String url, {
  AuthStorage? authStorage,
  http.Client? client,
}) async {
  final resolvedUrl = DealerApiConfig.resolveUploadUrl(url);
  if (resolvedUrl.trim().isEmpty) {
    throw ArgumentError.value(url, 'url', 'Attachment URL is empty');
  }

  final storage = authStorage ?? AuthStorage();
  final transport = DealerAuthClient(
    authStorage: storage,
    inner: client ?? http.Client(),
  );
  try {
    final token = await storage.readAccessToken();
    if (token == null || token.trim().isEmpty) {
      throw StateError('You need to sign in before opening attachments.');
    }

    final response = await transport.get(
      Uri.parse(resolvedUrl),
      headers: <String, String>{'accept': '*/*'},
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Attachment download failed (${response.statusCode})');
    }

    final bytes = Uint8List.fromList(response.bodyBytes);
    final mimeType = _resolveMimeType(
      response.headers['content-type'],
      resolvedUrl,
    );
    final dataUri = UriData.fromBytes(bytes, mimeType: mimeType).uri.toString();
    return SupportAttachmentAsset(
      bytes: bytes,
      dataUri: dataUri,
      mimeType: mimeType,
    );
  } finally {
    transport.close();
  }
}

String _resolveMimeType(String? rawContentType, String fallbackUrl) {
  final normalized = rawContentType?.split(';').first.trim().toLowerCase();
  if (normalized != null && normalized.isNotEmpty) {
    return normalized;
  }

  final fileName = _extractFileName(fallbackUrl)?.toLowerCase() ?? '';
  final extension = fileName.contains('.')
      ? fileName.substring(fileName.lastIndexOf('.') + 1)
      : '';
  return switch (extension) {
    'jpg' || 'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
    'pdf' => 'application/pdf',
    'txt' => 'text/plain',
    'json' => 'application/json',
    _ => 'application/octet-stream',
  };
}

String? _extractFileName(String value) {
  final normalized = value.trim();
  if (normalized.isEmpty) {
    return null;
  }
  final uri = Uri.tryParse(normalized);
  var path = uri?.path ?? normalized;
  if (path.isEmpty) {
    return null;
  }
  path = path.replaceAll('\\', '/').replaceAll(RegExp(r'/+$'), '');
  final segmentIndex = path.lastIndexOf('/');
  final segment = (segmentIndex >= 0 ? path.substring(segmentIndex + 1) : path)
      .trim();
  return segment.isEmpty ? null : segment;
}

String resolveSupportAttachmentFileName({
  String? preferredFileName,
  String? sourceUrl,
  String? mimeType,
}) {
  final mimeExtension = _extensionForMimeType(mimeType);
  final candidates = <String?>[
    preferredFileName,
    _extractFileName(sourceUrl ?? ''),
  ];
  for (final candidate in candidates) {
    final normalized = _sanitizeFileName(candidate);
    if (normalized == null || normalized.isEmpty) {
      continue;
    }
    if (normalized.contains('.')) {
      return normalized;
    }
    if (mimeExtension != null && mimeExtension.isNotEmpty) {
      return '$normalized.$mimeExtension';
    }
    return normalized;
  }
  return mimeExtension == null || mimeExtension.isEmpty
      ? 'attachment.bin'
      : 'attachment.$mimeExtension';
}

String? _sanitizeFileName(String? value) {
  final normalized = value?.trim();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  final fileName = normalized.split(RegExp(r'[\\/]+')).last;
  final sanitized = fileName.replaceAll(RegExp(r'[:*?"<>|]+'), '_');
  return sanitized.trim();
}

String? _extensionForMimeType(String? mimeType) {
  final normalized = mimeType?.split(';').first.trim().toLowerCase();
  if (normalized == null || normalized.isEmpty) {
    return null;
  }
  return switch (normalized) {
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
    'application/pdf' => 'pdf',
    'text/plain' => 'txt',
    'application/json' => 'json',
    'application/msword' => 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' =>
      'docx',
    'application/vnd.ms-excel' => 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' =>
      'xlsx',
    _ => null,
  };
}
