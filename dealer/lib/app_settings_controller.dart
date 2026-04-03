import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppSettingsController extends ChangeNotifier {
  static const _legacyThemeModeKey = 'app_theme_mode';
  static const _localeCodeKey = 'app_locale_code';

  Locale _locale = const Locale('vi');

  Locale get locale => _locale;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    // Legacy migration: theme mode is removed and the app is now dark-only.
    if (prefs.containsKey(_legacyThemeModeKey)) {
      await prefs.remove(_legacyThemeModeKey);
    }
    _locale = _decodeLocale(prefs.getString(_localeCodeKey));
    notifyListeners();
  }

  Future<void> setLocale(Locale locale) async {
    final languageCode = _normalizeLanguageCode(locale.languageCode);
    if (_locale.languageCode == languageCode) {
      return;
    }
    _locale = Locale(languageCode);
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localeCodeKey, languageCode);
  }
}

Locale _decodeLocale(String? raw) {
  final languageCode = _normalizeLanguageCode(raw);
  return Locale(languageCode);
}

String _normalizeLanguageCode(String? raw) {
  final code = (raw ?? '').trim().toLowerCase();
  if (code == 'en') {
    return 'en';
  }
  return 'vi';
}

class AppSettingsScope extends InheritedNotifier<AppSettingsController> {
  const AppSettingsScope({
    super.key,
    required AppSettingsController controller,
    required super.child,
  }) : super(notifier: controller);

  static AppSettingsController of(BuildContext context) {
    final scope = context
        .dependOnInheritedWidgetOfExactType<AppSettingsScope>();
    assert(scope != null, 'AppSettingsScope not found in widget tree.');
    return scope!.notifier!;
  }
}
