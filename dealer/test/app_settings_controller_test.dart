import 'package:dealer_hub/app_settings_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('AppSettingsController persists locale and theme mode', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    final controller = AppSettingsController();
    await controller.load();

    expect(controller.locale.languageCode, 'vi');
    expect(controller.themeMode, ThemeMode.light);

    await controller.setLocale(const Locale('en'));
    await controller.setThemeMode(ThemeMode.dark);

    final reloaded = AppSettingsController();
    await reloaded.load();

    expect(reloaded.locale.languageCode, 'en');
    expect(reloaded.themeMode, ThemeMode.dark);
  });
}
