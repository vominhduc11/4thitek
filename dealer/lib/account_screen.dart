import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'account_settings_screen.dart';
import 'app_preferences_screen.dart';
import 'auth_storage.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'change_password_screen.dart';
import 'dealer_profile_storage.dart';
import 'file_reference.dart';
import 'global_search.dart';
import 'l10n/app_localizations.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'push_messaging_controller.dart';
import 'support_screen.dart';
import 'warranty_hub_screen.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/notification_icon_button.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  final _authStorage = AuthStorage();

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

  Future<void> _loadProfile() async {
    setState(() {
      _isProfileLoading = true;
      _profileError = null;
    });
    try {
      final profile = await loadDealerProfile();
      if (!mounted) {
        return;
      }
      setState(() {
        _profile = profile;
        _isProfileLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _profileError = error;
        _isProfileLoading = false;
      });
    }
  }

  Future<void> _openAccountSettings() async {
    if (_isLoggingOut) {
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const AccountSettingsScreen()),
    );
    if (!mounted) {
      return;
    }
    await _loadProfile();
  }

  Future<void> _openSupport() async {
    if (_isLoggingOut) {
      return;
    }
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (context) => const SupportScreen()));
  }

  Future<void> _openWarrantyHub() async {
    if (_isLoggingOut) {
      return;
    }
    await Future.wait<void>([
      OrderScope.of(context).refresh(),
      WarrantyScope.of(context).load(forceRefresh: true),
    ]);
    if (!mounted) {
      return;
    }
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (context) => const WarrantyHubScreen()));
  }

  Future<void> _openChangePassword() async {
    if (_isLoggingOut) {
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const ChangePasswordScreen()),
    );
  }

  Future<void> _openAppPreferences() async {
    if (_isLoggingOut) {
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const AppPreferencesScreen()),
    );
  }

  Future<void> _loadAppVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      final version = info.version.trim();
      final buildNumber = info.buildNumber.trim();
      if (!mounted) {
        return;
      }
      setState(() {
        _appVersion = buildNumber.isEmpty ? version : '$version+$buildNumber';
      });
    } catch (_) {
      // Keep fallback when runtime package metadata is unavailable.
    }
  }

  Future<bool?> _confirmLogout(AppLocalizations l10n) {
    return showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(l10n.accountLogoutConfirmTitle),
          content: Text(l10n.accountLogoutConfirmMessage),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(l10n.cancelAction),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error,
                foregroundColor: Theme.of(context).colorScheme.onError,
              ),
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(l10n.accountLogoutAction),
            ),
          ],
        );
      },
    );
  }

  Future<void> _handleLogout(AppLocalizations l10n) async {
    if (_isLoggingOut) {
      return;
    }
    final shouldLogout = await _confirmLogout(l10n);
    if (shouldLogout != true || !mounted) {
      return;
    }

    setState(() => _isLoggingOut = true);
    var shouldResetLoading = true;
    try {
      await Future.delayed(const Duration(milliseconds: 600));
      await PushMessagingScope.maybeOf(context)?.unregisterCurrentToken();
      if (!mounted) {
        return;
      }
      await _authStorage.clearSession();
      if (!mounted) {
        return;
      }
      await clearDealerProfileCache();
      if (!mounted) {
        return;
      }
      await CartScope.of(context).clear(syncRemote: false);
      if (!mounted) {
        return;
      }
      await OrderScope.of(context).clearSessionData();
      if (!mounted) {
        return;
      }
      await NotificationScope.of(context).clearSessionData();
      if (!mounted) {
        return;
      }
      await WarrantyScope.of(context).clearSessionData();
      if (!mounted) {
        return;
      }

      shouldResetLoading = false;
      context.go('/login');
    } finally {
      if (mounted && shouldResetLoading) {
        setState(() => _isLoggingOut = false);
      }
    }
  }

  String _avatarInitial(String businessName) {
    final trimmed = businessName.trim();
    if (trimmed.isEmpty) {
      return 'D';
    }
    return trimmed.substring(0, 1).toUpperCase();
  }

  Widget _buildAvatar(DealerProfile profile, ColorScheme colors) {
    final imageProvider = imageProviderFromReference(profile.avatarUrl);
    if (imageProvider != null) {
      return CircleAvatar(
        radius: 26,
        backgroundColor: colors.primaryContainer,
        backgroundImage: imageProvider,
      );
    }

    return CircleAvatar(
      radius: 26,
      backgroundColor: colors.primaryContainer,
      child: Text(
        _avatarInitial(profile.businessName),
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
          color: colors.onPrimaryContainer,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colors = Theme.of(context).colorScheme;
    final isTablet = AppBreakpoints.isTablet(context);
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;

    final screenTitle = l10n.accountScreenTitle;
    final loadingLabel = l10n.accountSignOutLoading;
    final menuSettingsTitle = l10n.accountMenuSettingsTitle;
    final menuSettingsSubtitle = l10n.accountMenuSettingsSubtitle;
    final menuSupportTitle = l10n.accountMenuSupportTitle;
    final menuSupportSubtitle = l10n.accountMenuSupportSubtitle;
    final menuWarrantyTitle = l10n.accountMenuWarrantyTitle;
    final menuWarrantySubtitle = l10n.accountMenuWarrantySubtitle;
    final menuPreferencesTitle = l10n.accountMenuPreferencesTitle;
    final menuPreferencesSubtitle = l10n.accountMenuPreferencesSubtitle;
    final isEnglish = Localizations.localeOf(context).languageCode == 'en';
    final menuChangePasswordTitle = isEnglish
        ? 'Change password'
        : 'Đổi mật khẩu';
    final menuChangePasswordSubtitle = isEnglish
        ? 'Update your sign-in password'
        : 'Cập nhật mật khẩu đăng nhập';
    final logoutLabel = l10n.accountLogoutAction;
    final editProfileLabel = l10n.accountEditProfileAction;
    final versionLabel = l10n.accountVersionLabel(_appVersion);
    final contactLabel = l10n.accountContactLabel;
    final emailLabel = 'Email';
    final phoneLabel = l10n.accountPhoneLabel;
    final shippingLabel = l10n.accountShippingLabel;
    final policyLabel = l10n.accountPolicyLabel;
    final profileErrorTitle = l10n.accountProfileLoadError;
    final retryLabel = l10n.retryAction;

    Widget buildBody() {
      if (_isProfileLoading) {
        return const Center(child: CircularProgressIndicator());
      }

      if (_profileError != null || _profile == null) {
        return Center(
          child: Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
              side: BorderSide(
                color: colors.outlineVariant.withValues(alpha: 0.6),
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.error_outline, color: colors.error, size: 28),
                  const SizedBox(height: 10),
                  Text(
                    profileErrorTitle,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: _loadProfile,
                    child: Text(retryLabel),
                  ),
                ],
              ),
            ),
          ),
        );
      }

      final profile = _profile!;
      final profileRows = <Widget>[
        _ProfileValueRow(label: contactLabel, value: profile.contactName),
        const SizedBox(height: 10),
        _ProfileValueRow(label: emailLabel, value: profile.email),
        const SizedBox(height: 10),
        _ProfileValueRow(label: phoneLabel, value: profile.phone),
        const SizedBox(height: 10),
        _ProfileValueRow(
          label: shippingLabel,
          value: profile.shippingAddress,
          maxLines: 2,
        ),
      ];

      final policyWidget = _ProfileValueRow(
        label: policyLabel,
        value: profile.salesPolicy,
        maxLines: 2,
      );

      return ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          FadeSlideIn(
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: _isLoggingOut ? null : _openAccountSettings,
              child: Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                  side: BorderSide(
                    color: colors.outlineVariant.withValues(alpha: 0.6),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildAvatar(profile, colors),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  profile.businessName,
                                  style: Theme.of(context).textTheme.titleLarge
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            tooltip: editProfileLabel,
                            onPressed: _isLoggingOut
                                ? null
                                : _openAccountSettings,
                            icon: const Icon(Icons.edit_outlined),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Divider(
                        height: 1,
                        color: colors.outlineVariant.withValues(alpha: 0.6),
                      ),
                      const SizedBox(height: 12),
                      if (isTablet)
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: profileRows,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(child: policyWidget),
                          ],
                        )
                      else
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ...profileRows,
                            const SizedBox(height: 10),
                            policyWidget,
                          ],
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          FadeSlideIn(
            delay: const Duration(milliseconds: 80),
            child: Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
                side: BorderSide(
                  color: colors.outlineVariant.withValues(alpha: 0.6),
                ),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.settings_outlined),
                    title: Text(menuSettingsTitle),
                    subtitle: Text(menuSettingsSubtitle),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: _isLoggingOut ? null : _openAccountSettings,
                  ),
                  const Divider(height: 0),
                  ListTile(
                    leading: const Icon(Icons.support_agent_outlined),
                    title: Text(menuSupportTitle),
                    subtitle: Text(menuSupportSubtitle),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: _isLoggingOut ? null : _openSupport,
                  ),
                  const Divider(height: 0),
                  ListTile(
                    leading: const Icon(Icons.verified_user_outlined),
                    title: Text(menuWarrantyTitle),
                    subtitle: Text(menuWarrantySubtitle),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: _isLoggingOut ? null : _openWarrantyHub,
                  ),
                  const Divider(height: 0),
                  ListTile(
                    leading: const Icon(Icons.lock_reset_outlined),
                    title: Text(menuChangePasswordTitle),
                    subtitle: Text(menuChangePasswordSubtitle),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: _isLoggingOut ? null : _openChangePassword,
                  ),
                  const Divider(height: 0),
                  ListTile(
                    leading: const Icon(Icons.palette_outlined),
                    title: Text(menuPreferencesTitle),
                    subtitle: Text(menuPreferencesSubtitle),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: _isLoggingOut ? null : _openAppPreferences,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          FadeSlideIn(
            delay: const Duration(milliseconds: 140),
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: colors.error,
                side: BorderSide(color: colors.error.withValues(alpha: 0.55)),
              ),
              onPressed: _isLoggingOut ? null : () => _handleLogout(l10n),
              child: _isLoggingOut
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(colors.error),
                      ),
                    )
                  : Text(logoutLabel),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            versionLabel,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(screenTitle),
        actions: [
          const GlobalSearchIconButton(),
          NotificationIconButton(
            count: NotificationScope.of(context).unreadCount,
            onPressed: () {
              context.push('/notifications');
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: contentMaxWidth),
              child: buildBody(),
            ),
          ),
          if (_isLoggingOut) _LogoutLoadingOverlay(message: loadingLabel),
        ],
      ),
    );
  }
}

class _ProfileValueRow extends StatelessWidget {
  const _ProfileValueRow({
    required this.label,
    required this.value,
    this.maxLines = 1,
  });

  final String label;
  final String value;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 3,
          child: Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 4,
          child: Text(
            value,
            maxLines: maxLines,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.right,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

class _LogoutLoadingOverlay extends StatelessWidget {
  const _LogoutLoadingOverlay({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: ColoredBox(
        color: const Color(0x66000000),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(strokeWidth: 2.8),
                ),
                const SizedBox(height: 12),
                Text(message),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
