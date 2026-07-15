typedef MessagePair = (String en, String vi);

/// Shared mechanism for the enum+token+resolve+errorMessage pattern used
/// across the service/controller layer. Callers supply their own
/// domain-specific token -> (en, vi) map; only the switch+ternary boilerplate
/// is shared here, never message content across domains.
String resolveMessageCode({
  required String? message,
  required Map<String, MessagePair> messages,
  required bool isEnglish,
  MessagePair? fallback,
  String? Function(String raw, {required bool isEnglish})? dynamicResolver,
}) {
  final normalized = message?.trim();
  if (normalized == null || normalized.isEmpty) {
    if (fallback != null) {
      return isEnglish ? fallback.$1 : fallback.$2;
    }
    return message ?? '';
  }

  final pair = messages[normalized];
  if (pair != null) {
    return isEnglish ? pair.$1 : pair.$2;
  }

  if (dynamicResolver != null) {
    final dynamicMessage = dynamicResolver(normalized, isEnglish: isEnglish);
    if (dynamicMessage != null) {
      return dynamicMessage;
    }
  }

  return normalized;
}
