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
        final texts = _AppPreferencesTexts(isEnglish: isEnglish);

        final screenWidth = MediaQuery.sizeOf(context).width;
        final isTablet = AppBreakpoints.isTablet(context);
        final isDesktopWide = screenWidth >= 1100;
        final contentMaxWidth = isDesktopWide
            ? 1180.0
            : isTablet
            ? 900.0
            : 720.0;

        final appearanceSection = FadeSlideIn(
          child: SectionCard(
            title: texts.appearanceTitle,
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  texts.appearanceSubtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 16),
                _SummaryInfoTile(
                  icon: Icons.dark_mode_outlined,
                  label: texts.appearanceModeLabel,
                  value: texts.darkModeFixedLabel,
                ),
              ],
            ),
          ),
        );

        final languageSection = FadeSlideIn(
          delay: const Duration(milliseconds: 80),
          child: SectionCard(
            title: texts.languageTitle,
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  texts.languageSubtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 16),
                _PreferenceGroupHeader(
                  icon: Icons.language_outlined,
                  title: texts.languageOptionsTitle,
                  subtitle: texts.languageOptionsSubtitle,
                ),
                const SizedBox(height: 12),
                _PreferenceOptionTile<String>(
                  isSelected: settings.locale.languageCode == 'vi',
                  value: 'vi',
                  label: texts.languageOptionLabel('vi'),
                  description: texts.languageOptionDescription('vi'),
                  leadingIcon: Icons.translate_outlined,
                  trailing: _CompactStatusPill(
                    label: texts.activeModeLabel(
                      settings.locale.languageCode == 'vi',
                    ),
                    isActive: settings.locale.languageCode == 'vi',
                  ),
                  onTap: () => settings.setLocale(const Locale('vi')),
                ),
                const SizedBox(height: 10),
                _PreferenceOptionTile<String>(
                  isSelected: settings.locale.languageCode == 'en',
                  value: 'en',
                  label: texts.languageOptionLabel('en'),
                  description: texts.languageOptionDescription('en'),
                  leadingIcon: Icons.g_translate_outlined,
                  trailing: _CompactStatusPill(
                    label: texts.activeModeLabel(
                      settings.locale.languageCode == 'en',
                    ),
                    isActive: settings.locale.languageCode == 'en',
                  ),
                  onTap: () => settings.setLocale(const Locale('en')),
                ),
              ],
            ),
          ),
        );

        final summarySection = FadeSlideIn(
          delay: const Duration(milliseconds: 140),
          child: _PreferencesSummaryPanel(
            title: texts.summaryTitle,
            subtitle: texts.summarySubtitle,
            appearanceLabel: texts.summaryAppearanceLabel,
            appearanceValue: texts.darkModeFixedLabel,
            languageLabel: texts.summaryLanguageLabel,
            languageValue: texts.languageOptionLabel(
              settings.locale.languageCode,
            ),
          ),
        );

        return Scaffold(
          backgroundColor: Theme.of(context).colorScheme.surface,
          appBar: AppBar(
            title: BrandAppBarTitle(texts.screenTitle),
            surfaceTintColor: Colors.transparent,
            scrolledUnderElevation: 0,
          ),
          body: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: contentMaxWidth),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                children: [
                  FadeSlideIn(
                    child: _PreferencesHeroCard(
                      title: texts.heroTitle,
                      subtitle: texts.heroSubtitle,
                      appearanceValue: texts.darkModeFixedLabel,
                      languageValue: texts.languageOptionLabel(
                        settings.locale.languageCode,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (isDesktopWide)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 7,
                          child: Column(
                            children: [
                              appearanceSection,
                              const SizedBox(height: 16),
                              languageSection,
                            ],
                          ),
                        ),
                        const SizedBox(width: 18),
                        Expanded(flex: 5, child: summarySection),
                      ],
                    )
                  else ...[
                    appearanceSection,
                    const SizedBox(height: 16),
                    languageSection,
                    const SizedBox(height: 16),
                    summarySection,
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _AppPreferencesTexts {
  const _AppPreferencesTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Preferences' : 'Thiết lập ứng dụng';

  String get heroTitle => isEnglish
      ? 'Personalize your experience'
      : 'Tùy chỉnh trải nghiệm sử dụng';

  String get heroSubtitle => isEnglish
      ? 'Manage language preferences while the app keeps a consistent dark interface.'
      : 'Quản lý ngôn ngữ sử dụng trong khi ứng dụng luôn giữ giao diện tối nhất quán.';

  String get appearanceTitle => isEnglish ? 'Appearance' : 'Giao diện';

  String get appearanceSubtitle => isEnglish
      ? 'Dealer Hub now uses one optimized dark mode for consistent readability across all devices.'
      : 'Dealer Hub hiện dùng một giao diện tối tối ưu để đảm bảo khả năng đọc nhất quán trên mọi thiết bị.';

  String get appearanceModeLabel =>
      isEnglish ? 'Theme mode' : 'Chế độ hiển thị';

  String get darkModeFixedLabel => isEnglish ? 'Dark (fixed)' : 'Tối (cố định)';

  String get languageTitle => isEnglish ? 'Language' : 'Ngôn ngữ';

  String get languageSubtitle => isEnglish
      ? 'Choose the language used across the app.'
      : 'Chọn ngôn ngữ sử dụng trong toàn bộ ứng dụng.';

  String get languageOptionsTitle =>
      isEnglish ? 'Language options' : 'Tùy chọn ngôn ngữ';

  String get languageOptionsSubtitle => isEnglish
      ? 'Switch the app language instantly without restarting.'
      : 'Chuyển ngôn ngữ ứng dụng ngay lập tức mà không cần khởi động lại.';

  String get summaryTitle =>
      isEnglish ? 'Current settings' : 'Thiết lập hiện tại';

  String get summarySubtitle => isEnglish
      ? 'A quick summary of the preferences currently applied in the app.'
      : 'Tóm tắt nhanh các thiết lập hiện đang được áp dụng trong ứng dụng.';

  String get summaryAppearanceLabel =>
      isEnglish ? 'Appearance mode' : 'Chế độ giao diện';

  String get summaryLanguageLabel =>
      isEnglish ? 'Selected language' : 'Ngôn ngữ đã chọn';

  String activeModeLabel(bool isActive) => isEnglish
      ? (isActive ? 'Active' : 'Available')
      : (isActive ? 'Đang dùng' : 'Có thể chọn');

  String languageOptionLabel(String languageCode) {
    if (isEnglish) {
      return switch (languageCode) {
        'vi' => 'Vietnamese',
        'en' => 'English',
        _ => languageCode,
      };
    }
    return switch (languageCode) {
      'vi' => 'Tiếng Việt',
      'en' => 'Tiếng Anh',
      _ => languageCode,
    };
  }

  String languageOptionDescription(String languageCode) {
    if (isEnglish) {
      return switch (languageCode) {
        'vi' => 'Use Vietnamese labels and messages across the app.',
        'en' => 'Use English labels and messages across the app.',
        _ => languageCode,
      };
    }
    return switch (languageCode) {
      'vi' => 'Sử dụng tiếng Việt cho nhãn và thông báo trong ứng dụng.',
      'en' => 'Sử dụng tiếng Anh cho nhãn và thông báo trong ứng dụng.',
      _ => languageCode,
    };
  }
}

class _PreferencesHeroCard extends StatelessWidget {
  const _PreferencesHeroCard({
    required this.title,
    required this.subtitle,
    required this.appearanceValue,
    required this.languageValue,
  });

  final String title;
  final String subtitle;
  final String appearanceValue;
  final String languageValue;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colors.surfaceContainerHigh.withValues(alpha: 0.98),
            colors.surfaceContainer.withValues(alpha: 0.94),
          ],
        ),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.55),
        ),
        boxShadow: [
          BoxShadow(
            color: colors.shadow.withValues(alpha: 0.03),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 620;

                final header = Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: colors.onSurface,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      subtitle,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                  ],
                );

                final iconShell = Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: colors.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Icon(
                    Icons.tune_outlined,
                    color: colors.onSurface,
                    size: 28,
                  ),
                );

                if (compact) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [iconShell, const SizedBox(height: 14), header],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    iconShell,
                    const SizedBox(width: 16),
                    Expanded(child: header),
                  ],
                );
              },
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _PreferenceHeroChip(
                  icon: Icons.dark_mode_outlined,
                  label: appearanceValue,
                ),
                _PreferenceHeroChip(
                  icon: Icons.language_outlined,
                  label: languageValue,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PreferenceHeroChip extends StatelessWidget {
  const _PreferenceHeroChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.5),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: colors.onSurfaceVariant),
          const SizedBox(width: 8),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 200),
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _PreferenceGroupHeader extends StatelessWidget {
  const _PreferenceGroupHeader({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: colors.primaryContainer.withValues(alpha: 0.55),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, size: 20, color: colors.onPrimaryContainer),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colors.onSurfaceVariant,
                  height: 1.45,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PreferenceOptionTile<T> extends StatelessWidget {
  const _PreferenceOptionTile({
    required this.isSelected,
    required this.value,
    required this.label,
    required this.description,
    required this.leadingIcon,
    required this.onTap,
    this.trailing,
  });

  final bool isSelected;
  final T value;
  final String label;
  final String description;
  final IconData leadingIcon;
  final VoidCallback onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Material(
      color: colors.surface,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isSelected
                  ? colors.primary.withValues(alpha: 0.65)
                  : colors.outlineVariant.withValues(alpha: 0.35),
              width: isSelected ? 1.4 : 1.0,
            ),
            color: isSelected
                ? colors.primaryContainer.withValues(alpha: 0.26)
                : colors.surface,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Icon(
                  isSelected
                      ? Icons.radio_button_checked
                      : Icons.radio_button_off,
                  size: 20,
                  color: isSelected
                      ? colors.primary
                      : colors.onSurfaceVariant.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(width: 2),
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: colors.secondaryContainer.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(leadingIcon, color: colors.onSecondaryContainer),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              if (trailing != null) ...[const SizedBox(width: 10), trailing!],
            ],
          ),
        ),
      ),
    );
  }
}

class _CompactStatusPill extends StatelessWidget {
  const _CompactStatusPill({required this.label, required this.isActive});

  final String label;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final background = isActive
        ? colors.primary.withValues(alpha: 0.14)
        : colors.surfaceContainerHighest.withValues(alpha: 0.42);
    final foreground = isActive ? colors.primary : colors.onSurfaceVariant;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: background,
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: foreground,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _PreferencesSummaryPanel extends StatelessWidget {
  const _PreferencesSummaryPanel({
    required this.title,
    required this.subtitle,
    required this.appearanceLabel,
    required this.appearanceValue,
    required this.languageLabel,
    required this.languageValue,
  });

  final String title;
  final String subtitle;
  final String appearanceLabel;
  final String appearanceValue;
  final String languageLabel;
  final String languageValue;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return SectionCard(
      title: title,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 16),
          _SummaryInfoTile(
            icon: Icons.dark_mode_outlined,
            label: appearanceLabel,
            value: appearanceValue,
          ),
          const SizedBox(height: 12),
          _SummaryInfoTile(
            icon: Icons.language_outlined,
            label: languageLabel,
            value: languageValue,
          ),
        ],
      ),
    );
  }
}

class _SummaryInfoTile extends StatelessWidget {
  const _SummaryInfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: colors.primaryContainer.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, size: 20, color: colors.onPrimaryContainer),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: colors.onSurfaceVariant),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}
