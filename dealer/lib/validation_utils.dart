final RegExp _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

bool isValidEmailAddress(String email) {
  return _emailPattern.hasMatch(email.trim());
}

String? validateRequiredText(String? value, {required String message}) {
  if ((value ?? '').trim().isEmpty) {
    return message;
  }
  return null;
}

String? validateEmailAddress(
  String? value, {
  required String emptyMessage,
  required String invalidMessage,
  bool allowEmpty = false,
  bool showFormatError = true,
}) {
  final email = (value ?? '').trim();
  if (email.isEmpty) {
    return allowEmpty ? null : emptyMessage;
  }
  if (!showFormatError) {
    return null;
  }
  return isValidEmailAddress(email) ? null : invalidMessage;
}
