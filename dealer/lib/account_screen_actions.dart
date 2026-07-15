// ignore_for_file: invalid_use_of_protected_member

part of 'account_screen.dart';

extension _AccountScreenActions on _AccountScreenState {
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
    await context.pushDealerAccountSettings();
    if (!mounted) return;
    await _loadProfile();
  }

  Future<void> _openSupport() async {
    if (_isLoggingOut) return;
    await context.pushDealerSupport();
  }

  Future<void> _openReturns() async {
    if (_isLoggingOut) return;
    await context.pushDealerReturns();
  }

  Future<void> _openWarrantyHub() async {
    if (_isLoggingOut) return;
    await Future.wait<void>([
      OrderScope.of(context).refresh(),
      WarrantyScope.of(context).load(forceRefresh: true),
    ]);
    if (!mounted) return;
    await context.pushDealerWarrantyHub();
  }

  Future<void> _openChangePassword() async {
    if (_isLoggingOut) return;
    await context.pushDealerChangePassword();
  }

  Future<void> _openAppPreferences() async {
    if (_isLoggingOut) return;
    await context.pushDealerAccountPreferences();
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
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 20,
            ),
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
      context.goToDealerLogin();
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
}
