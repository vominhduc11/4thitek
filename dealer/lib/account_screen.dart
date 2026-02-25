import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'account_settings_screen.dart';
import 'auth_storage.dart';
import 'dealer_profile_storage.dart';
import 'login_screen.dart';
import 'support_screen.dart';
import 'widgets/fade_slide_in.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  bool _isLoggingOut = false;
  late Future<DealerProfile> _profileFuture;

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

      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(loggedInKey, false);
      await prefs.setBool(rememberMeKey, false);
      await prefs.remove(rememberEmailKey);
      if (!mounted) {
        return;
      }

      shouldResetLoading = false;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (context) => const LoginScreen(),
        ),
        (route) => false,
      );
    } finally {
      if (mounted && shouldResetLoading) {
        setState(() => _isLoggingOut = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tai khoan'),
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

              return ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                children: [
                  FadeSlideIn(
                    child: Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(18),
                        side: const BorderSide(color: Color(0xFFE5EAF5)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              profile.businessName,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Ma dai ly: ${profile.dealerCode}',
                              style: Theme.of(
                                context,
                              ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Nguoi lien he: ${profile.contactName}',
                              style: Theme.of(
                                context,
                              ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Email: ${profile.email}',
                              style: Theme.of(
                                context,
                              ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'SDT: ${profile.phone}',
                              style: Theme.of(
                                context,
                              ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Dia chi giao hang: ${profile.shippingAddress}',
                              style: Theme.of(
                                context,
                              ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Chinh sach: ${profile.salesPolicy}',
                              style: Theme.of(
                                context,
                              ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
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
                        side: const BorderSide(color: Color(0xFFE5EAF5)),
                      ),
                      child: Column(
                        children: [
                          ListTile(
                            leading: const Icon(Icons.settings_outlined),
                            title: const Text('Cai dat tai khoan'),
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
                            leading: const Icon(Icons.support_agent_outlined),
                            title: const Text('Ho tro'),
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
                              child: CircularProgressIndicator(strokeWidth: 2.5),
                            )
                          : const Text('Dang xuat'),
                    ),
                  ),
                ],
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
              color: Colors.white,
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
                Text('Dang dang xuat...'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
