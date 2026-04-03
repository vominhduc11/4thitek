// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => '4thitek Dealer Hub';

  @override
  String get viewAction => 'View';

  @override
  String get sessionExpiredMessage =>
      'Your session has expired. Please sign in again.';

  @override
  String get welcomeTitle => 'Welcome to 4thitek Dealer Hub';

  @override
  String get welcomeStepProducts =>
      '1. Create orders quickly from the Products tab.';

  @override
  String get welcomeStepOrders => '2. Track debt and status in the Orders tab.';

  @override
  String get welcomeStepSearch =>
      '3. Use global search to find orders and products instantly.';

  @override
  String get getStarted => 'Get started';

  @override
  String get tabProducts => 'Products';

  @override
  String get tabOrders => 'Orders';

  @override
  String get tabOverview => 'Overview';

  @override
  String get tabInventory => 'Inventory';

  @override
  String get tabAccount => 'Account';

  @override
  String get retryAction => 'Retry';

  @override
  String get cancelAction => 'Cancel';

  @override
  String get accountLogoutConfirmTitle => 'Confirm logout';

  @override
  String get accountLogoutConfirmMessage =>
      'You are about to log out. Your current cart data will be cleared. Do you want to continue?';

  @override
  String get accountScreenTitle => 'Account';

  @override
  String get accountSignOutLoading => 'Signing out...';

  @override
  String get accountMenuSettingsTitle => 'Account settings';

  @override
  String get accountMenuSettingsSubtitle =>
      'Update company profile, contacts, and shipping information.';

  @override
  String get accountMenuSupportTitle => 'Support';

  @override
  String get accountMenuSupportSubtitle =>
      'Contact support and submit product, order, or warranty requests.';

  @override
  String get accountMenuWarrantyTitle => 'Warranty center';

  @override
  String get accountMenuWarrantySubtitle =>
      'Process serials, activate warranties, and review serial inventory.';

  @override
  String get accountMenuPreferencesTitle => 'Appearance and language';

  @override
  String get accountMenuPreferencesSubtitle =>
      'Manage language and app preferences.';

  @override
  String get accountLogoutAction => 'Log out';

  @override
  String get accountEditProfileAction => 'Edit profile';

  @override
  String accountVersionLabel(String version) {
    return 'Version $version';
  }

  @override
  String get accountContactLabel => 'Contact person';

  @override
  String get accountPhoneLabel => 'Phone';

  @override
  String get accountShippingLabel => 'Shipping address';

  @override
  String get accountPolicyLabel => 'Sales policy';

  @override
  String get accountProfileLoadError => 'Unable to load account profile.';

  @override
  String notificationsTitle(int count) {
    return 'Notifications ($count)';
  }

  @override
  String get notificationsMarkAllReadTooltip => 'Mark all as read';

  @override
  String get notificationsEmptyTitle => 'No notifications yet';

  @override
  String get notificationsEmptyMessage =>
      'New updates will appear here when they arrive.';

  @override
  String get notificationsMarkedAllReadMessage =>
      'All notifications have been marked as read.';

  @override
  String get notificationsMarkUnreadAction => 'Mark as unread';

  @override
  String get notificationsMarkedUnreadMessage => 'Marked as unread.';

  @override
  String get notificationsOpenLinkFailedMessage => 'Unable to open the link.';

  @override
  String get notificationsTypeOrder => 'Order';

  @override
  String get notificationsTypePromotion => 'Promotion';

  @override
  String get notificationsTypeSystem => 'System';

  @override
  String get notificationsRelatedViewOrder => 'View order';

  @override
  String get notificationsRelatedViewProducts => 'View products';

  @override
  String get notificationsRelatedViewSupport => 'View support';

  @override
  String get notificationsRelatedViewNotifications => 'View notifications';

  @override
  String get notificationsRelatedOpenLink => 'Open link';

  @override
  String get notificationsRelatedOpenOverview => 'Open overview';

  @override
  String get paymentMethodBankTransfer => 'Bank Transfer';

  @override
  String get paymentMethodDebt => 'Debt Payment';
}
