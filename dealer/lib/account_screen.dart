import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'account_settings_screen.dart';
import 'app_preferences_screen.dart';
import 'auth_storage.dart';
import 'cart_controller.dart';
import 'change_password_screen.dart';
import 'dealer_profile_storage.dart';
import 'file_reference.dart';
import 'l10n/app_localizations.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'push_messaging_controller.dart';
import 'support_screen.dart';
import 'warranty_controller.dart';
import 'warranty_hub_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/notification_icon_button.dart';
import 'widgets/section_card.dart';
import 'widgets/skeleton_box.dart';

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

  Future<void> _loadProfile() async {
    if (!mounted) return;
    setState(() {
      _isProfileLoading = true;
      _profileError = null;
    });

    try {
      final profile = await loadDealerProfile();
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _profileError = null;
        _isProfileLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _profile = null;
        _profileError = error;
        _isProfileLoading = false;
      });
    }
  }

  Future<void> _loadAppVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      final version = info.version.trim();
      final buildNumber = info.buildNumber.trim();
      if (!mounted) return;
      setState(() {
        _appVersion = buildNumber.isEmpty ? version : '$version+$buildNumber';
      });
    } catch (_) {
      // Keep fallback value.
    }
  }

  Future<void> _openAccountSettings() async {
    if (_isLoggingOut) return;
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const AccountSettingsScreen()));
    if (!mounted) return;
    await _loadProfile();
  }

  Future<void> _openSupport() async {
    if (_isLoggingOut) return;
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const SupportScreen()));
  }

  Future<void> _openWarrantyHub() async {
    if (_isLoggingOut) return;
    await Future.wait<void>([
      OrderScope.of(context).refresh(),
      WarrantyScope.of(context).load(forceRefresh: true),
    ]);
    if (!mounted) return;
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const WarrantyHubScreen()));
  }

  Future<void> _openChangePassword() async {
    if (_isLoggingOut) return;
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const ChangePasswordScreen()));
  }

  Future<void> _openAppPreferences() async {
    if (_isLoggingOut) return;
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const AppPreferencesScreen()));
  }

  Future<bool?> _confirmLogout(AppLocalizations l10n) {
    final colors = Theme.of(context).colorScheme;
    return showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return RepaintBoundary(
          child: AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            title: Text(l10n.accountLogoutConfirmTitle),
            content: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Text(l10n.accountLogoutConfirmMessage),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: Text(l10n.cancelAction),
              ),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: colors.error,
                  foregroundColor: colors.onError,
                ),
                onPressed: () => Navigator.of(dialogContext).pop(true),
                child: Text(l10n.accountLogoutAction),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _handleLogout(AppLocalizations l10n) async {
    if (_isLoggingOut) return;
    final shouldLogout = await _confirmLogout(l10n);
    if (shouldLogout != true || !mounted) return;

    setState(() => _isLoggingOut = true);
    var shouldResetLoading = true;
    final pushMessagingController = PushMessagingScope.maybeOf(context);
    final cartController = CartScope.of(context);
    final orderController = OrderScope.of(context);
    final notificationController = NotificationScope.of(context);
    final warrantyController = WarrantyScope.of(context);

    try {
      await pushMessagingController?.unregisterCurrentToken();
      if (!mounted) return;
      await _authStorage.clearSession();
      if (!mounted) return;
      await clearDealerProfileCache();
      if (!mounted) return;
      await cartController.clear(syncRemote: false);
      if (!mounted) return;
      await orderController.clearSessionData();
      if (!mounted) return;
      await notificationController.clearSessionData();
      if (!mounted) return;
      await warrantyController.clearSessionData();
      if (!mounted) return;
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
    return trimmed.isEmpty ? 'D' : trimmed.substring(0, 1).toUpperCase();
  }

  ImageProvider<Object>? _avatarImage(String? avatarUrl) {
    return imageProviderFromReference(avatarUrl);
  }

  String? _profileErrorDetails(BuildContext context) {
    final error = _profileError;
    if (error == null) return null;
    final isEnglish = Localizations.localeOf(context).languageCode == 'en';
    final message = dealerProfileStorageErrorMessage(
      error,
      isEnglish: isEnglish,
    ).trim();
    return message.isEmpty ? null : message;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final width = MediaQuery.sizeOf(context).width;
    final isTablet = width >= 768;
    final isDesktop = width >= 1180;
    final contentMaxWidth = isDesktop ? 1240.0 : isTablet ? 960.0 : 760.0;
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
              onPressed: () => context.push('/notifications'),
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
                    ? _buildErrorView(context, l10n, profileErrorDetails, padding)
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

  Widget _buildContentView({
    required BuildContext context,
    required AppLocalizations l10n,
    required bool isEnglish,
    required bool isTablet,
    required bool isDesktop,
    required EdgeInsetsGeometry padding,
  }) {
    Widget wrap(Widget child) => RepaintBoundary(child: child);
    return RefreshIndicator.adaptive(
      key: const ValueKey('content'),
      onRefresh: _loadProfile,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: padding,
        children: [
          if (isDesktop)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 7,
                  child: Column(
                    children: [
                      wrap(_buildHeroCard(context, _profile!, isEnglish, false)),
                      const SizedBox(height: 18),
                      wrap(_buildProfileSection(context, _profile!, isEnglish, true, l10n)),
                    ],
                  ),
                ),
                const SizedBox(width: 18),
                Expanded(
                  flex: 5,
                  child: Column(
                    children: [
                      wrap(_buildActionsSection(isEnglish, true)),
                      const SizedBox(height: 18),
                      wrap(_buildSessionSection(context, isEnglish, l10n)),
                    ],
                  ),
                ),
              ],
            )
          else ...[
            wrap(_buildHeroCard(context, _profile!, isEnglish, true)),
            const SizedBox(height: 16),
            wrap(_buildProfileSection(context, _profile!, isEnglish, isTablet, l10n)),
            const SizedBox(height: 16),
            wrap(_buildActionsSection(isEnglish, isTablet)),
            const SizedBox(height: 16),
            wrap(_buildSessionSection(context, isEnglish, l10n)),
          ],
        ],
      ),
    );
  }

  Widget _buildLoadingView(
    BuildContext context,
    AppLocalizations l10n,
    EdgeInsetsGeometry padding,
  ) {
    return ListView(
      key: const ValueKey('loading'),
      physics: const AlwaysScrollableScrollPhysics(),
      padding: padding,
      children: [
        _buildHeroSkeleton(context),
        const SizedBox(height: 16),
        _buildSectionSkeleton(context, l10n.accountScreenTitle, 4),
        const SizedBox(height: 16),
        _buildSectionSkeleton(context, 'Tác vụ', 5),
        const SizedBox(height: 16),
        _buildSectionSkeleton(
          context,
          'Phiên làm việc',
          2,
          includeButtons: true,
        ),
      ],
    );
  }

  Widget _buildErrorView(
    BuildContext context,
    AppLocalizations l10n,
    String? details,
    EdgeInsetsGeometry padding,
  ) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final isEnglish = Localizations.localeOf(context).languageCode == 'en';

    return ListView(
      key: const ValueKey('error'),
      physics: const AlwaysScrollableScrollPhysics(),
      padding: padding,
      children: [
        const SizedBox(height: 40),
        Container(
          padding: const EdgeInsets.all(22),
          decoration: _panelDecoration(
            colors,
            radius: 24,
            background: colors.surfaceContainerHigh,
            borderColor: colors.error.withValues(alpha: 0.22),
          ),
          child: Column(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: colors.errorContainer.withValues(alpha: 0.9),
                ),
                child: Icon(
                  Icons.cloud_off_rounded,
                  color: colors.onErrorContainer,
                  size: 28,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                l10n.accountProfileLoadError,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                details?.trim().isNotEmpty == true
                    ? details!
                    : (isEnglish
                          ? 'Pull down or try again to load dealer information for this device.'
                          : 'Kéo xuống để làm mới hoặc thử lại để tải thông tin đại lý trên thiết bị này.'),
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colors.onSurfaceVariant,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _loadProfile,
                icon: const Icon(Icons.refresh_rounded),
                label: Text(l10n.retryAction),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHeroCard(
    BuildContext context,
    DealerProfile profile,
    bool isEnglish,
    bool isCompact,
  ) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final textTheme = theme.textTheme;
    final avatarImage = _avatarImage(profile.avatarUrl);
    final businessName = profile.businessName.trim().isEmpty
        ? 'Dealer account'
        : profile.businessName;

    final summary = Text(
      isEnglish
          ? 'Manage dealer identity, support access, and after-sales readiness in one place.'
          : 'Quản lý hồ sơ đại lý, hỗ trợ và trạng thái hậu mãi trong một nơi thống nhất.',
      style: textTheme.bodyMedium?.copyWith(
        color: colors.onSurfaceVariant,
        height: 1.45,
      ),
    );

    final contacts = Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        _contactChip(
          context,
          Icons.badge_outlined,
          profile.contactName.trim().isEmpty ? '-' : profile.contactName,
        ),
        _contactChip(
          context,
          Icons.email_outlined,
          profile.email.trim().isEmpty ? '-' : profile.email,
        ),
        _contactChip(
          context,
          Icons.phone_outlined,
          profile.phone.trim().isEmpty ? '-' : profile.phone,
        ),
      ],
    );

    final editButton = FilledButton.icon(
      onPressed: _isLoggingOut ? null : _openAccountSettings,
      icon: const Icon(Icons.edit_outlined),
      label: Text(AppLocalizations.of(context)!.accountEditProfileAction),
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, 50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
    );

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(isCompact ? 18 : 20),
      decoration: _panelDecoration(
        colors,
        radius: 24,
        gradient: [
          colors.surfaceContainerHigh.withValues(alpha: 0.98),
          colors.surfaceContainer.withValues(alpha: 0.94),
        ],
      ),
      child: isCompact
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 32,
                      backgroundColor: colors.surfaceContainerLow,
                      backgroundImage: avatarImage,
                      child: avatarImage == null
                          ? Text(
                              _avatarInitial(profile.businessName),
                              style: textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w900,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _metaChip(
                            context,
                            Icons.storefront_outlined,
                            isEnglish
                                ? 'Dealer workspace'
                                : 'Không gian đại lý',
                          ),
                          const SizedBox(height: 10),
                          Text(
                            businessName,
                            style: textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w900,
                              height: 1.08,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                summary,
                const SizedBox(height: 16),
                contacts,
                const SizedBox(height: 18),
                SizedBox(width: double.infinity, child: editButton),
              ],
            )
          : Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 38,
                  backgroundColor: colors.surfaceContainerLow,
                  backgroundImage: avatarImage,
                  child: avatarImage == null
                      ? Text(
                          _avatarInitial(profile.businessName),
                          style: textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w900,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _metaChip(
                        context,
                        Icons.storefront_outlined,
                        isEnglish ? 'Dealer workspace' : 'Không gian đại lý',
                      ),
                      const SizedBox(height: 10),
                      Text(
                        businessName,
                        style: textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w900,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 8),
                      summary,
                      const SizedBox(height: 16),
                      contacts,
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                ConstrainedBox(
                  constraints: const BoxConstraints(minWidth: 208),
                  child: editButton,
                ),
              ],
            ),
    );
  }

  Widget _buildProfileSection(
    BuildContext context,
    DealerProfile profile,
    bool isEnglish,
    bool isWide,
    AppLocalizations l10n,
  ) {
    final tiles = [
      _infoTile(context, Icons.badge_outlined, l10n.accountContactLabel, profile.contactName),
      _infoTile(context, Icons.email_outlined, 'Email', profile.email),
      _infoTile(context, Icons.phone_outlined, l10n.accountPhoneLabel, profile.phone),
      _infoTile(
        context,
        Icons.local_shipping_outlined,
        l10n.accountShippingLabel,
        profile.shippingAddress,
        maxLines: 4,
      ),
      _infoTile(
        context,
        Icons.policy_outlined,
        l10n.accountPolicyLabel,
        profile.salesPolicy,
        maxLines: 5,
      ),
    ];

    return SectionCard(
      title: isEnglish ? 'Dealer profile' : 'Hồ sơ đại lý',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionDescription(
            context,
            isEnglish
                ? 'Core business information used across ordering, support, and after-sales flows.'
                : 'Thông tin doanh nghiệp cốt lõi dùng xuyên suốt các luồng đặt hàng, hỗ trợ và hậu mãi.',
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final useTwoColumns = isWide && constraints.maxWidth >= 720;
              if (!useTwoColumns) return _tileColumn(tiles);
              final left = <Widget>[];
              final right = <Widget>[];
              for (var i = 0; i < tiles.length; i++) {
                (i.isEven ? left : right).add(tiles[i]);
              }
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: _tileColumn(left)),
                  const SizedBox(width: 12),
                  Expanded(child: _tileColumn(right)),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActionsSection(bool isEnglish, bool isWide) {
    final tiles = [
      _actionTile(
        Icons.manage_accounts_outlined,
        isEnglish ? 'Dealer profile' : 'Hồ sơ đại lý',
        isEnglish
            ? 'Update identity, avatar, contact, and sales details.'
            : 'Cập nhật hồ sơ, avatar, thông tin liên hệ và bán hàng.',
        _isLoggingOut ? null : _openAccountSettings,
      ),
      _actionTile(
        Icons.support_agent_outlined,
        isEnglish ? 'Support center' : 'Trung tâm hỗ trợ',
        isEnglish
            ? 'Open dealer support and rider assistance channels.'
            : 'Mở các kênh hỗ trợ đại lý và trợ giúp người đi phượt.',
        _isLoggingOut ? null : _openSupport,
      ),
      _actionTile(
        Icons.verified_user_outlined,
        isEnglish ? 'Warranty hub' : 'Trung tâm bảo hành',
        isEnglish
            ? 'Track after-sales and sync the latest warranty activity.'
            : 'Theo dõi hậu mãi và đồng bộ hoạt động bảo hành mới nhất.',
        _isLoggingOut ? null : _openWarrantyHub,
      ),
      _actionTile(
        Icons.lock_reset_outlined,
        isEnglish ? 'Security' : 'Bảo mật',
        isEnglish
            ? 'Protect account access and update your password.'
            : 'Bảo vệ quyền truy cập tài khoản và cập nhật mật khẩu.',
        _isLoggingOut ? null : _openChangePassword,
      ),
      _actionTile(
        Icons.tune_outlined,
        isEnglish ? 'Preferences' : 'Tùy chỉnh',
        isEnglish
            ? 'Adjust language and workspace preferences.'
            : 'Điều chỉnh ngôn ngữ và trải nghiệm sử dụng.',
        _isLoggingOut ? null : _openAppPreferences,
      ),
    ];

    Widget content;
    if (!isWide || tiles.length < 2) {
      content = _tileColumn(tiles);
    } else {
      final left = <Widget>[];
      final right = <Widget>[];
      for (var i = 0; i < tiles.length; i++) {
        (i.isEven ? left : right).add(tiles[i]);
      }
      content = Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _tileColumn(left)),
          const SizedBox(width: 12),
          Expanded(child: _tileColumn(right)),
        ],
      );
    }

    return SectionCard(
      title: isEnglish ? 'Quick actions' : 'Lối tắt tác vụ',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionDescription(
            context,
            isEnglish
                ? 'Shortcuts for support, warranty, security, and workspace preferences.'
                : 'Lối tắt cho hỗ trợ, bảo hành, bảo mật và tuỳ chỉnh không gian làm việc.',
          ),
          const SizedBox(height: 16),
          content,
        ],
      ),
    );
  }

  Widget _buildSessionSection(
    BuildContext context,
    bool isEnglish,
    AppLocalizations l10n,
  ) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final reloadButton = OutlinedButton.icon(
      onPressed: _isLoggingOut ? null : _loadProfile,
      icon: const Icon(Icons.refresh_rounded),
      label: Text(isEnglish ? 'Reload profile' : 'Tải lại hồ sơ'),
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, 50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
    );
    final logoutButton = FilledButton.icon(
      onPressed: _isLoggingOut ? null : () => _handleLogout(l10n),
      icon: const Icon(Icons.logout_rounded),
      label: Text(l10n.accountLogoutAction),
      style: FilledButton.styleFrom(
        backgroundColor: colors.error,
        foregroundColor: colors.onError,
        minimumSize: const Size(0, 50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
    );

    return SectionCard(
      title: isEnglish ? 'Device & session' : 'Thiết bị và phiên',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionDescription(
            context,
            isEnglish
                ? 'Review app status and sign out securely on this device.'
                : 'Kiểm tra trạng thái ứng dụng và đăng xuất an toàn trên thiết bị này.',
          ),
          const SizedBox(height: 16),
          _infoTile(
            context,
            Icons.memory_outlined,
            isEnglish ? 'App version' : 'Phiên bản ứng dụng',
            l10n.accountVersionLabel(_appVersion),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: _panelDecoration(
              colors,
              radius: 18,
              background: colors.surfaceContainerLow,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.shield_outlined, color: colors.primary, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    isEnglish
                        ? 'Signing out clears local dealer session data on this device.'
                        : 'Đăng xuất sẽ xoá dữ liệu phiên đại lý cục bộ trên thiết bị này.',
                    style: textTheme.bodyMedium?.copyWith(
                      color: colors.onSurfaceVariant,
                      height: 1.45,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth < 420) {
                return Column(
                  children: [
                    SizedBox(width: double.infinity, child: reloadButton),
                    const SizedBox(height: 12),
                    SizedBox(width: double.infinity, child: logoutButton),
                  ],
                );
              }
              return Row(
                children: [
                  Expanded(child: reloadButton),
                  const SizedBox(width: 12),
                  Expanded(child: logoutButton),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _sectionDescription(BuildContext context, String text) {
    final theme = Theme.of(context);
    return Text(
      text,
      style: theme.textTheme.bodyMedium?.copyWith(
        color: theme.colorScheme.onSurfaceVariant,
        height: 1.45,
      ),
    );
  }

  Widget _tileColumn(List<Widget> tiles) {
    return Column(
      children: [
        for (var i = 0; i < tiles.length; i++) ...[
          tiles[i],
          if (i != tiles.length - 1) const SizedBox(height: 12),
        ],
      ],
    );
  }

  Widget _infoTile(
    BuildContext context,
    IconData icon,
    String label,
    String value, {
    int maxLines = 1,
  }) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: _panelDecoration(
        colors,
        radius: 18,
        background: colors.surfaceContainerLow,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: colors.primaryContainer.withValues(alpha: 0.72),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: colors.onPrimaryContainer),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: colors.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  value.trim().isEmpty ? '-' : value,
                  maxLines: maxLines,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionTile(
    IconData icon,
    String title,
    String subtitle,
    VoidCallback? onTap,
  ) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: _panelDecoration(
            colors,
            radius: 18,
            background: colors.surfaceContainerLow,
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: colors.secondaryContainer.withValues(alpha: 0.72),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: colors.onSecondaryContainer),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Icon(
                Icons.chevron_right_rounded,
                size: 22,
                color: colors.onSurfaceVariant,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroSkeleton(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: _panelDecoration(
        colors,
        radius: 24,
        background: colors.surfaceContainerHigh,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Row(
            children: [
              SkeletonBox(
                width: 64,
                height: 64,
                borderRadius: BorderRadius.all(Radius.circular(999)),
              ),
              SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SkeletonBox(width: 124, height: 16),
                    SizedBox(height: 10),
                    SkeletonBox(width: 220, height: 24),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          SkeletonBox(width: double.infinity, height: 16),
          SizedBox(height: 10),
          SkeletonBox(width: 240, height: 16),
          SizedBox(height: 16),
          SkeletonBox(width: double.infinity, height: 50),
        ],
      ),
    );
  }

  Widget _buildSectionSkeleton(
    BuildContext context,
    String title,
    int rows, {
    bool includeButtons = false,
  }) {
    final colors = Theme.of(context).colorScheme;
    return SectionCard(
      title: title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SkeletonBox(width: double.infinity, height: 14),
          const SizedBox(height: 10),
          const SkeletonBox(width: 220, height: 14),
          const SizedBox(height: 16),
          for (var index = 0; index < rows; index++) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: _panelDecoration(
                colors,
                radius: 18,
                background: colors.surfaceContainerLow,
              ),
              child: const Row(
                children: [
                  SkeletonBox(
                    width: 42,
                    height: 42,
                    borderRadius: BorderRadius.all(Radius.circular(14)),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SkeletonBox(width: double.infinity, height: 14),
                        SizedBox(height: 8),
                        SkeletonBox(width: 180, height: 12),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (index != rows - 1) const SizedBox(height: 12),
          ],
          if (includeButtons) ...[
            const SizedBox(height: 16),
            const Row(
              children: [
                Expanded(child: SkeletonBox(width: double.infinity, height: 50)),
                SizedBox(width: 12),
                Expanded(child: SkeletonBox(width: double.infinity, height: 50)),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _metaChip(BuildContext context, IconData icon, String label) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: _panelDecoration(
        colors,
        radius: 999,
        background: colors.surfaceContainerLow.withValues(alpha: 0.95),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: colors.primary),
          const SizedBox(width: 8),
          Text(
            label,
            style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }

  Widget _contactChip(BuildContext context, IconData icon, String label) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 120, maxWidth: 280),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: _panelDecoration(
          colors,
          radius: 18,
          background: colors.surfaceContainerLow,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: colors.onSurfaceVariant),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  BoxDecoration _panelDecoration(
    ColorScheme colors, {
    required double radius,
    Color? background,
    Color? borderColor,
    List<Color>? gradient,
  }) {
    return BoxDecoration(
      color: gradient == null ? (background ?? colors.surfaceContainerHigh) : null,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(
        color: borderColor ?? colors.outlineVariant.withValues(alpha: 0.55),
      ),
      gradient: gradient == null
          ? null
          : LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: gradient,
            ),
      boxShadow: [
        BoxShadow(
          color: colors.shadow.withValues(alpha: 0.03),
          blurRadius: 16,
          offset: const Offset(0, 8),
        ),
      ],
    );
  }
}
