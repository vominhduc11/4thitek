// ignore_for_file: invalid_use_of_protected_member

part of 'account_screen.dart';

extension _AccountScreenViews on _AccountScreenState {
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
                      wrap(
                        _buildHeroCard(context, _profile!, isEnglish, false),
                      ),
                      const SizedBox(height: 18),
                      wrap(
                        _buildProfileSection(
                          context,
                          _profile!,
                          isEnglish,
                          true,
                          l10n,
                        ),
                      ),
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
            wrap(
              _buildProfileSection(
                context,
                _profile!,
                isEnglish,
                isTablet,
                l10n,
              ),
            ),
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
      _infoTile(
        context,
        Icons.badge_outlined,
        l10n.accountContactLabel,
        profile.contactName,
      ),
      _infoTile(context, Icons.email_outlined, 'Email', profile.email),
      _infoTile(
        context,
        Icons.phone_outlined,
        l10n.accountPhoneLabel,
        profile.phone,
      ),
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
            ? 'Open dealer support and operational assistance channels.'
            : 'Mở các kênh hỗ trợ đại lý và trợ giúp vận hành.',
        _isLoggingOut ? null : _openSupport,
      ),
      _actionTile(
        Icons.assignment_return_outlined,
        isEnglish ? 'Returns' : 'Đổi trả',
        isEnglish
            ? 'Review return requests and follow the latest processing status.'
            : 'Theo dõi yêu cầu đổi trả và trạng thái xử lý mới nhất.',
        _isLoggingOut ? null : _openReturns,
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
}
