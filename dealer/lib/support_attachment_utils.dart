const Set<String> _imageExtensions = <String>{
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
};

bool isLikelyImageAttachment({String? fileName, String? url}) {
  if (_looksLikeImage(fileName)) {
    return true;
  }
  return _looksLikeImage(url);
}

bool _looksLikeImage(String? value) {
  final normalized = value?.trim().toLowerCase();
  if (normalized == null || normalized.isEmpty) {
    return false;
  }
  if (normalized.startsWith('data:image/')) {
    return true;
  }
  if (normalized.contains('mime=image/') ||
      normalized.contains('content-type=image/') ||
      normalized.contains('format=jpg') ||
      normalized.contains('format=jpeg') ||
      normalized.contains('format=png') ||
      normalized.contains('format=webp') ||
      normalized.contains('format=gif') ||
      normalized.contains('/image/') ||
      normalized.contains('/images/')) {
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
  final extension = path.substring(dotIndex + 1);
  return _imageExtensions.contains(extension);
}
