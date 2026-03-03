import 'package:flutter/material.dart';

import 'account_settings_screen.dart';
import 'app_preferences_screen.dart';
import 'auth_storage.dart';
import 'dealer_profile_storage.dart';
import 'login_screen.dart';
import 'notification_controller.dart';
import 'notifications_screen.dart';
import 'widgets/notification_icon_button.dart';
import 'support_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  bool _isLoggingOut = false;
  late Future<DealerProfile> _profileFuture;
  final _authStorage = AuthStorage();

  @override
  void initState() {
    super.initState();
    _profileFuture = loadDealerProfile();
  }

  void _reloadProfile() {
    setState(() {
      _profileFuture = loadDealerProfile();
    });
  }

  Future<void> _handleLogout() async {
    if (_isLoggingOut) {
      return;
    }

    setState(() => _isLoggingOut = true);
    var shouldResetLoading = true;
    try {
      await Future.delayed(const Duration(seconds: 1));

      await _authStorage.clearSession();
      if (!mounted) {
        return;
      }

      shouldResetLoading = false;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
    } finally {
      if (mounted && shouldResetLoading) {
        setState(() => _isLoggingOut = false);
      }
    }
  }

  Future<void> _openAppPreferences() async {
    if (_isLoggingOut) {
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const AppPreferencesScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isTablet = MediaQuery.sizeOf(context).shortestSide >= 600;
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;
    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Tài khoản'),
        actions: [
          NotificationIconButton(
            count: NotificationScope.of(context).unreadCount,
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          FutureBuilder<DealerProfile>(
            future: _profileFuture,
            builder: (context, snapshot) {
              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }
              final profile = snapshot.data!;

              return Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: contentMaxWidth),
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                    children: [
                      FadeSlideIn(
                        child: Card(
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                            side: BorderSide(
                              color: colors.outlineVariant.withValues(
                                alpha: 0.6,
                              ),
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  profile.businessName,
                                  style: Theme.of(context).textTheme.titleMedium
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Mã đại lý: ${profile.dealerCode}',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Người liên hệ: ${profile.contactName}',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Email: ${profile.email}',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'SĐT: ${profile.phone}',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Địa chỉ giao hàng: ${profile.shippingAddress}',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Chính sách: ${profile.salesPolicy}',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                ),
                              ],
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
                              color: colors.outlineVariant.withValues(
                                alpha: 0.6,
                              ),
                            ),
                          ),
                          child: Column(
                            children: [
                              ListTile(
                                leading: const Icon(Icons.settings_outlined),
                                title: const Text('Cài đặt tài khoản'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: _isLoggingOut
                                    ? null
                                    : () async {
                                        await Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                const AccountSettingsScreen(),
                                          ),
                                        );
                                        _reloadProfile();
                                      },
                              ),
                              const Divider(height: 0),
                              ListTile(
                                leading: const Icon(
                                  Icons.support_agent_outlined,
                                ),
                                title: const Text('Hỗ trợ'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: _isLoggingOut
                                    ? null
                                    : () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                const SupportScreen(),
                                          ),
                                        );
                                      },
                              ),
                              const Divider(height: 0),
                              ListTile(
                                leading: const Icon(Icons.palette_outlined),
                                title: const Text('Giao diện và ngôn ngữ'),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: _isLoggingOut
                                    ? null
                                    : _openAppPreferences,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      FadeSlideIn(
                        delay: const Duration(milliseconds: 140),
                        child: OutlinedButton(
                          onPressed: _isLoggingOut ? null : _handleLogout,
                          child: _isLoggingOut
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                  ),
                                )
                              : const Text('Đăng xuất'),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          if (_isLoggingOut) const _LogoutLoadingOverlay(),
        ],
      ),
    );
  }
}

class _LogoutLoadingOverlay extends StatelessWidget {
  const _LogoutLoadingOverlay();

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
            child: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(strokeWidth: 2.8),
                ),
                SizedBox(height: 12),
                Text('Đang đăng xuất...'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
