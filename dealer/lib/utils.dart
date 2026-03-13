String formatVnd(int amount) {
  final digits = amount.toString();
  final formatted = digits.replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
    (match) => '${match[1]}.',
  );
  return '$formatted ₫';
}

DateTime? parseApiDateTime(Object? value) {
  final raw = value?.toString().trim() ?? '';
  if (raw.isEmpty) {
    return null;
  }
  final parsed = DateTime.tryParse(raw);
  if (parsed == null) {
    return null;
  }
  return parsed.toLocal();
}

String formatDate(DateTime value) {
  final localValue = value.toLocal();
  return '${_twoDigits(localValue.day)}/${_twoDigits(localValue.month)}/${localValue.year}';
}

String formatDateTime(DateTime value) {
  final localValue = value.toLocal();
  return '${formatDate(localValue)} ${_twoDigits(localValue.hour)}:${_twoDigits(localValue.minute)}';
}

String formatRelativeTime(DateTime value, {DateTime? now}) {
  final current = (now ?? DateTime.now()).toLocal();
  final target = value.toLocal();
  final diff = current.difference(target);

  if (diff.isNegative) {
    return formatDateTime(target);
  }
  if (diff.inMinutes < 1) {
    return 'vừa xong';
  }
  if (diff.inHours < 1) {
    return '${diff.inMinutes} phút trước';
  }
  if (diff.inDays < 1) {
    return '${diff.inHours} giờ trước';
  }

  final currentDate = DateTime(current.year, current.month, current.day);
  final targetDate = DateTime(target.year, target.month, target.day);
  final dayDiff = currentDate.difference(targetDate).inDays;

  if (dayDiff == 1) {
    return 'hôm qua ${_twoDigits(target.hour)}:${_twoDigits(target.minute)}';
  }
  if (dayDiff < 7) {
    return '$dayDiff ngày trước';
  }
  return formatDateTime(target);
}

String _twoDigits(int value) {
  return value.toString().padLeft(2, '0');
}
