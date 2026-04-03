import 'package:dealer_hub/app_settings_controller.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'AppSettingsController persists locale and removes legacy theme mode',
    () async {
      SharedPreferences.setMockInitialValues(<String, Object>{
        'app_theme_mode': 'light',
      });

      final controller = AppSettingsController();
      await controller.load();

      expect(controller.locale.languageCode, 'vi');
      final prefsAfterLoad = await SharedPreferences.getInstance();
      expect(prefsAfterLoad.containsKey('app_theme_mode'), isFalse);

      await controller.setLocale(const Locale('en'));

      final reloaded = AppSettingsController();
      await reloaded.load();

      expect(reloaded.locale.languageCode, 'en');
    },
  );
}
