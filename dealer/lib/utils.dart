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

int parseInt(Object? value, {int fallback = 0}) {
  if (value is int) {
    return value;
  }
  if (value is double) {
    return value.round();
  }
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

int parsePrice(Object? value, {int fallback = 0}) {
  if (value is int) {
    return value;
  }
  if (value is double) {
    return value.round();
  }
  return double.tryParse(value?.toString() ?? '')?.round() ?? fallback;
}

int? parseOptionalInt(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is num) {
    return value.round();
  }
  final normalized = value.toString().trim();
  if (normalized.isEmpty) {
    return null;
  }
  return num.tryParse(normalized)?.round();
}

String? normalizeString(Object? value) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? null : text;
}
