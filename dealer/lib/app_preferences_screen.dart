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
            : 'Giao diện và ngôn ngữ';
        final themeTitle = isEnglish ? 'Theme mode' : 'Chế độ giao diện';
        final themeSubtitle = isEnglish
            ? 'Choose how the app follows light, dark, or system theme'
            : 'Chọn giao diện sáng, tối hoặc theo hệ thống';
        final languageTitle = isEnglish ? 'Language' : 'Ngôn ngữ';
        final languageSubtitle = isEnglish
            ? 'Choose app language'
            : 'Chọn ngôn ngữ ứng dụng';

        String themeLabel(ThemeMode mode) {
          if (isEnglish) {
            return switch (mode) {
              ThemeMode.system => 'System',
              ThemeMode.light => 'Light',
              ThemeMode.dark => 'Dark',
            };
          }
          return switch (mode) {
            ThemeMode.system => 'Hệ thống',
            ThemeMode.light => 'Sáng',
            ThemeMode.dark => 'Tối',
          };
        }

        return Scaffold(
          appBar: AppBar(title: Text(title)),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: Theme.of(
                      context,
                    ).colorScheme.outlineVariant.withValues(alpha: 0.6),
                  ),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.dark_mode_outlined),
                      title: Text(themeTitle),
                      subtitle: Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(themeSubtitle),
                            const SizedBox(height: 10),
                            SegmentedButton<ThemeMode>(
                              segments: [
                                ButtonSegment<ThemeMode>(
                                  value: ThemeMode.system,
                                  label: Text(themeLabel(ThemeMode.system)),
                                  icon: const Icon(Icons.smartphone_outlined),
                                ),
                                ButtonSegment<ThemeMode>(
                                  value: ThemeMode.light,
                                  label: Text(themeLabel(ThemeMode.light)),
                                  icon: const Icon(Icons.light_mode_outlined),
                                ),
                                ButtonSegment<ThemeMode>(
                                  value: ThemeMode.dark,
                                  label: Text(themeLabel(ThemeMode.dark)),
                                  icon: const Icon(Icons.dark_mode_outlined),
                                ),
                              ],
                              selected: <ThemeMode>{settings.themeMode},
                              onSelectionChanged: (selection) {
                                settings.setThemeMode(selection.first);
                              },
                            ),
                          ],
                        ),
                      ),
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
