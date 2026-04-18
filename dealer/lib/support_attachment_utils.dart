const Set<String> _imageExtensions = <String>{
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
};
const Set<String> _videoExtensions = <String>{'mp4', 'webm'};
const Set<String> _documentExtensions = <String>{'pdf'};
const Set<String> _imageQueryKeys = <String>{
  'mime',
  'content-type',
  'contenttype',
  'response-content-type',
};
const Set<String> _imageFormatQueryKeys = <String>{
  'format',
  'ext',
  'extension',
};

bool isLikelyImageAttachment({String? fileName, String? url}) {
  if (_looksLikeImage(fileName)) {
    return true;
  }
  return _looksLikeImage(url);
}

bool isLikelyVideoAttachment({
  String? fileName,
  String? url,
  String? contentType,
}) {
  final normalizedType = contentType?.trim().toLowerCase();
  if (normalizedType != null && normalizedType.startsWith('video/')) {
    return true;
  }
  return _looksLikeVideo(fileName) || _looksLikeVideo(url);
}

bool isLikelyDocumentAttachment({
  String? fileName,
  String? url,
  String? contentType,
}) {
  final normalizedType = contentType?.trim().toLowerCase();
  if (normalizedType == 'application/pdf') {
    return true;
  }
  return _looksLikeDocument(fileName) || _looksLikeDocument(url);
}

bool _looksLikeImage(String? value) {
  final normalized = value?.trim().toLowerCase();
  if (normalized == null || normalized.isEmpty) {
    return false;
  }
  if (normalized.startsWith('data:image/')) {
    return true;
  }

  final uri = Uri.tryParse(normalized);
  if (uri != null) {
    for (final entry in uri.queryParameters.entries) {
      final key = entry.key.trim().toLowerCase();
      final queryValue = entry.value.trim().toLowerCase();
      if (_imageQueryKeys.contains(key) && queryValue.startsWith('image/')) {
        return true;
      }
      if (_imageFormatQueryKeys.contains(key) &&
          _imageExtensions.contains(queryValue)) {
        return true;
      }
    }
  }

  final path = (uri?.path.isNotEmpty == true ? uri!.path : normalized)
      .split('?')
      .first
      .split('#')
      .first;
  if (path.contains('/image/') || path.contains('/images/')) {
    return true;
  }
  final dotIndex = path.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex == path.length - 1) {
    return false;
  }
  final extension = path.substring(dotIndex + 1);
  return _imageExtensions.contains(extension);
}

bool _looksLikeVideo(String? value) {
  final normalized = value?.trim().toLowerCase();
  if (normalized == null || normalized.isEmpty) {
    return false;
  }
  if (normalized.startsWith('video/')) {
    return true;
  }
  final uri = Uri.tryParse(normalized);
  final path = (uri?.path.isNotEmpty == true ? uri!.path : normalized)
      .split('?')
      .first
      .split('#')
      .first;
  final dotIndex = path.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex == path.length - 1) {
    return false;
  }
  return _videoExtensions.contains(path.substring(dotIndex + 1));
}

bool _looksLikeDocument(String? value) {
  final normalized = value?.trim().toLowerCase();
  if (normalized == null || normalized.isEmpty) {
    return false;
  }
  if (normalized == 'application/pdf') {
    return true;
  }
  final uri = Uri.tryParse(normalized);
  final path = (uri?.path.isNotEmpty == true ? uri!.path : normalized)
      .split('?')
      .first
      .split('#')
      .first;
  final dotIndex = path.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex == path.length - 1) {
    return false;
  }
  return _documentExtensions.contains(path.substring(dotIndex + 1));
}
