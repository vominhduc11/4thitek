import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

class AppPreferencesScreen extends StatelessWidget {
  const AppPreferencesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = AppSettingsScope.of(context);

    return AnimatedBuilder(
      animation: settings,
      builder: (context, _) {
        final isEnglish = settings.locale.languageCode == 'en';
        final isTablet = AppBreakpoints.isTablet(context);
        final contentMaxWidth = isTablet ? 760.0 : double.infinity;

        final screenTitle = isEnglish ? 'Preferences' : 'Giao diện và ngôn ngữ';
        final themeTitle = isEnglish ? 'Theme mode' : 'Chế độ giao diện';
        final themeSubtitle = isEnglish
            ? 'Choose how the app follows light, dark, or system appearance.'
            : 'Chọn giao diện sáng, tối hoặc theo hệ thống.';
        final languageTitle = isEnglish ? 'Language' : 'Ngôn ngữ';
        final languageSubtitle = isEnglish
            ? 'Choose the language used across the app.'
            : 'Chọn ngôn ngữ sử dụng trong ứng dụng.';
        final previewTitle = isEnglish
            ? 'Theme preview'
            : 'Xem trước giao diện';

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

        final brightness = MediaQuery.platformBrightnessOf(context);
        final effectiveMode = settings.themeMode == ThemeMode.system
            ? (brightness == Brightness.dark ? ThemeMode.dark : ThemeMode.light)
            : settings.themeMode;
        final previewSurface = effectiveMode == ThemeMode.dark
            ? const Color(0xFF121212)
            : const Color(0xFFFFFFFF);
        final previewOnSurface = effectiveMode == ThemeMode.dark
            ? const Color(0xFFE6E6E6)
            : const Color(0xFF1A1A1A);

        return Scaffold(
          appBar: AppBar(title: BrandAppBarTitle(screenTitle)),
          body: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: contentMaxWidth),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                children: [
                  FadeSlideIn(
                    child: SectionCard(
                      title: themeTitle,
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
                          const SizedBox(height: 14),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Theme.of(context)
                                  .colorScheme
                                  .surfaceContainerHighest
                                  .withValues(alpha: 0.35),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: Theme.of(
                                  context,
                                ).colorScheme.outlineVariant,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  previewTitle,
                                  style: Theme.of(context).textTheme.labelLarge,
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: previewSurface,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.outlineVariant,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              isEnglish
                                                  ? 'Sample heading'
                                                  : 'Tiêu đề mẫu',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleSmall
                                                  ?.copyWith(
                                                    color: previewOnSurface,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              isEnglish
                                                  ? 'Example body text for current mode.'
                                                  : 'Văn bản mô phỏng theo giao diện hiện tại.',
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(
                                                    color: previewOnSurface
                                                        .withValues(alpha: 0.8),
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Icon(
                                        effectiveMode == ThemeMode.dark
                                            ? Icons.dark_mode
                                            : Icons.light_mode,
                                        color: previewOnSurface,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  FadeSlideIn(
                    delay: const Duration(milliseconds: 80),
                    child: SectionCard(
                      title: languageTitle,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(languageSubtitle),
                          const SizedBox(height: 10),
                          SegmentedButton<String>(
                            segments: const [
                              ButtonSegment<String>(
                                value: 'vi',
                                label: Text('Tiếng Việt'),
                              ),
                              ButtonSegment<String>(
                                value: 'en',
                                label: Text('English'),
                              ),
                            ],
                            selected: <String>{settings.locale.languageCode},
                            onSelectionChanged: (selection) {
                              settings.setLocale(Locale(selection.first));
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
