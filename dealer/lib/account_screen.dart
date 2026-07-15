import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'auth_storage.dart';
import 'cart_controller.dart';
import 'dealer_navigation.dart';
import 'dealer_profile_storage.dart';
import 'file_reference.dart';
import 'l10n/app_localizations.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'push_messaging_controller.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/notification_icon_button.dart';
import 'widgets/section_card.dart';
import 'widgets/skeleton_box.dart';

part 'account_screen_actions.dart';
part 'account_screen_views.dart';
part 'account_screen_widgets.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  final AuthStorage _authStorage = AuthStorage();

  bool _isLoggingOut = false;
  bool _isProfileLoading = true;
  DealerProfile? _profile;
  Object? _profileError;
  String _appVersion = '--';

  @override
  void initState() {
    super.initState();
    _loadProfile();
    _loadAppVersion();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final width = MediaQuery.sizeOf(context).width;
    final isTablet = width >= 768;
    final isDesktop = width >= 1180;
    final contentMaxWidth = isDesktop
        ? 1240.0
        : isTablet
        ? 960.0
        : 760.0;
    final isEnglish = Localizations.localeOf(context).languageCode == 'en';
    final profileErrorDetails = _profileErrorDetails(context);
    final padding = EdgeInsets.fromLTRB(
      isDesktop ? 24 : 16,
      isDesktop ? 24 : 16,
      isDesktop ? 24 : 16,
      28,
    );

    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        backgroundColor: colors.surface,
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
        titleSpacing: 12,
        title: BrandAppBarTitle(l10n.accountScreenTitle),
        actions: [
          IconButton(
            tooltip: isEnglish ? 'Reload profile' : 'Tải lại hồ sơ',
            onPressed: _isLoggingOut ? null : _loadProfile,
            icon: const Icon(Icons.refresh_rounded),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: NotificationIconButton(
              count: NotificationScope.of(context).unreadCount,
              onPressed: () => context.pushDealerNotifications(),
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: contentMaxWidth),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                child: _isProfileLoading
                    ? _buildLoadingView(context, l10n, padding)
                    : (_profileError != null || _profile == null)
                    ? _buildErrorView(
                        context,
                        l10n,
                        profileErrorDetails,
                        padding,
                      )
                    : _buildContentView(
                        context: context,
                        l10n: l10n,
                        isEnglish: isEnglish,
                        isTablet: isTablet,
                        isDesktop: isDesktop,
                        padding: padding,
                      ),
              ),
            ),
          ),
          if (_isLoggingOut)
            Positioned.fill(
              child: ColoredBox(
                color: colors.scrim.withValues(alpha: 0.24),
                child: Center(
                  child: RepaintBoundary(
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 320),
                      padding: const EdgeInsets.all(22),
                      decoration: _panelDecoration(
                        colors,
                        radius: 24,
                        background: colors.surface,
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(
                            width: 28,
                            height: 28,
                            child: CircularProgressIndicator(strokeWidth: 2.6),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            l10n.accountSignOutLoading,
                            textAlign: TextAlign.center,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
