import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppSettingsController extends ChangeNotifier {
  static const _themeModeKey = 'app_theme_mode';
  static const _localeCodeKey = 'app_locale_code';

  ThemeMode _themeMode = ThemeMode.light;
  Locale _locale = const Locale('vi');

  ThemeMode get themeMode => _themeMode;
  Locale get locale => _locale;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _themeMode = _decodeThemeMode(prefs.getString(_themeModeKey));
    _locale = _decodeLocale(prefs.getString(_localeCodeKey));
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) {
      return;
    }
    _themeMode = mode;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeModeKey, _encodeThemeMode(mode));
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

ThemeMode _decodeThemeMode(String? raw) {
  switch (raw) {
    case 'dark':
      return ThemeMode.dark;
    case 'light':
    default:
      return ThemeMode.light;
  }
}

String _encodeThemeMode(ThemeMode mode) {
  switch (mode) {
    case ThemeMode.dark:
      return 'dark';
    case ThemeMode.light:
    case ThemeMode.system:
      return 'light';
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
