String formatVnd(int amount) {
  final digits = amount.toString();
  final formatted = digits.replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
    (match) => '${match[1]}.',
  );
  return '$formatted ₫';
}

String formatDate(DateTime value) {
  return '${_twoDigits(value.day)}/${_twoDigits(value.month)}/${value.year}';
}

String formatDateTime(DateTime value) {
  return '${formatDate(value)} ${_twoDigits(value.hour)}:${_twoDigits(value.minute)}';
}

String _twoDigits(int value) {
  return value.toString().padLeft(2, '0');
}
