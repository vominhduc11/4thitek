final RegExp _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
final RegExp _vietnamPhonePattern = RegExp(r'^0\d{9}$');

bool isValidEmailAddress(String email) {
  return _emailPattern.hasMatch(email.trim());
}

bool isValidVietnamPhoneNumber(String phone) {
  return _vietnamPhonePattern.hasMatch(phone.trim());
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

String? validateVietnamPhoneNumber(
  String? value, {
  required String emptyMessage,
  required String invalidMessage,
  bool allowEmpty = false,
}) {
  final phone = (value ?? '').trim();
  if (phone.isEmpty) {
    return allowEmpty ? null : emptyMessage;
  }
  return isValidVietnamPhoneNumber(phone) ? null : invalidMessage;
}
