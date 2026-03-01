import 'package:flutter/material.dart';

import 'app_settings_controller.dart';

class AppPreferencesScreen extends StatelessWidget {
  const AppPreferencesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = AppSettingsScope.of(context);

    return AnimatedBuilder(
      animation: settings,
      builder: (context, _) {
        final isEnglish = settings.locale.languageCode == 'en';
        final title = isEnglish
            ? 'Appearance and language'
            : 'Giao dien va ngon ngu';
        final darkModeTitle = isEnglish ? 'Dark mode' : 'Che do toi';
        final darkModeSubtitle = isEnglish
            ? 'Switch between light and dark mode'
            : 'Chuyen doi giao dien sang va toi';
        final languageTitle = isEnglish ? 'Language' : 'Ngon ngu';
        final languageSubtitle = isEnglish
            ? 'Choose app language'
            : 'Chon ngon ngu ung dung';

        return Scaffold(
          appBar: AppBar(title: Text(title)),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: Color(0xFFE5EAF5)),
                ),
                child: Column(
                  children: [
                    SwitchListTile.adaptive(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 2,
                      ),
                      secondary: const Icon(Icons.dark_mode_outlined),
                      title: Text(darkModeTitle),
                      subtitle: Text(darkModeSubtitle),
                      value: settings.themeMode == ThemeMode.dark,
                      onChanged: (enabled) {
                        settings.setThemeMode(
                          enabled ? ThemeMode.dark : ThemeMode.light,
                        );
                      },
                    ),
                    const Divider(height: 0),
                    ListTile(
                      leading: const Icon(Icons.language_outlined),
                      title: Text(languageTitle),
                      subtitle: Text(languageSubtitle),
                      trailing: SegmentedButton<String>(
                        segments: const [
                          ButtonSegment<String>(value: 'vi', label: Text('VI')),
                          ButtonSegment<String>(value: 'en', label: Text('EN')),
                        ],
                        selected: <String>{settings.locale.languageCode},
                        onSelectionChanged: (selection) {
                          settings.setLocale(Locale(selection.first));
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
