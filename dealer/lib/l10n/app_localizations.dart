import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_vi.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('vi'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'4T HITEK Dealer'**
  String get appTitle;

  /// No description provided for @viewAction.
  ///
  /// In en, this message translates to:
  /// **'View'**
  String get viewAction;

  /// No description provided for @sessionExpiredMessage.
  ///
  /// In en, this message translates to:
  /// **'Your session has expired. Please sign in again.'**
  String get sessionExpiredMessage;

  /// No description provided for @welcomeTitle.
  ///
  /// In en, this message translates to:
  /// **'Welcome to 4T HITEK Dealer'**
  String get welcomeTitle;

  /// No description provided for @welcomeStepProducts.
  ///
  /// In en, this message translates to:
  /// **'1. Create orders quickly from the Products tab.'**
  String get welcomeStepProducts;

  /// No description provided for @welcomeStepOrders.
  ///
  /// In en, this message translates to:
  /// **'2. Track debt and status in the Orders tab.'**
  String get welcomeStepOrders;

  /// No description provided for @welcomeStepSearch.
  ///
  /// In en, this message translates to:
  /// **'3. Use global search to find orders and products instantly.'**
  String get welcomeStepSearch;

  /// No description provided for @getStarted.
  ///
  /// In en, this message translates to:
  /// **'Get started'**
  String get getStarted;

  /// No description provided for @tabProducts.
  ///
  /// In en, this message translates to:
  /// **'Products'**
  String get tabProducts;

  /// No description provided for @tabOrders.
  ///
  /// In en, this message translates to:
  /// **'Orders'**
  String get tabOrders;

  /// No description provided for @tabOverview.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get tabOverview;

  /// No description provided for @tabInventory.
  ///
  /// In en, this message translates to:
  /// **'Inventory'**
  String get tabInventory;

  /// No description provided for @tabAccount.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get tabAccount;

  /// No description provided for @retryAction.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retryAction;

  /// No description provided for @cancelAction.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancelAction;

  /// No description provided for @accountLogoutConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Confirm logout'**
  String get accountLogoutConfirmTitle;

  /// No description provided for @accountLogoutConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'You are about to log out. Your current cart data will be cleared. Do you want to continue?'**
  String get accountLogoutConfirmMessage;

  /// No description provided for @accountScreenTitle.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get accountScreenTitle;

  /// No description provided for @accountSignOutLoading.
  ///
  /// In en, this message translates to:
  /// **'Signing out...'**
  String get accountSignOutLoading;

  /// No description provided for @accountMenuSettingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Account settings'**
  String get accountMenuSettingsTitle;

  /// No description provided for @accountMenuSettingsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Update company profile, contacts, and shipping information.'**
  String get accountMenuSettingsSubtitle;

  /// No description provided for @accountMenuSupportTitle.
  ///
  /// In en, this message translates to:
  /// **'Support'**
  String get accountMenuSupportTitle;

  /// No description provided for @accountMenuSupportSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Contact support and submit product, order, or warranty requests.'**
  String get accountMenuSupportSubtitle;

  /// No description provided for @accountMenuWarrantyTitle.
  ///
  /// In en, this message translates to:
  /// **'Warranty center'**
  String get accountMenuWarrantyTitle;

  /// No description provided for @accountMenuWarrantySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Process serials, activate warranties, and review serial inventory.'**
  String get accountMenuWarrantySubtitle;

  /// No description provided for @accountMenuPreferencesTitle.
  ///
  /// In en, this message translates to:
  /// **'Appearance and language'**
  String get accountMenuPreferencesTitle;

  /// No description provided for @accountMenuPreferencesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Manage language and app preferences.'**
  String get accountMenuPreferencesSubtitle;

  /// No description provided for @accountLogoutAction.
  ///
  /// In en, this message translates to:
  /// **'Log out'**
  String get accountLogoutAction;

  /// No description provided for @accountEditProfileAction.
  ///
  /// In en, this message translates to:
  /// **'Edit profile'**
  String get accountEditProfileAction;

  /// No description provided for @accountVersionLabel.
  ///
  /// In en, this message translates to:
  /// **'Version {version}'**
  String accountVersionLabel(String version);

  /// No description provided for @accountContactLabel.
  ///
  /// In en, this message translates to:
  /// **'Contact person'**
  String get accountContactLabel;

  /// No description provided for @accountPhoneLabel.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get accountPhoneLabel;

  /// No description provided for @accountShippingLabel.
  ///
  /// In en, this message translates to:
  /// **'Shipping address'**
  String get accountShippingLabel;

  /// No description provided for @accountPolicyLabel.
  ///
  /// In en, this message translates to:
  /// **'Sales policy'**
  String get accountPolicyLabel;

  /// No description provided for @accountProfileLoadError.
  ///
  /// In en, this message translates to:
  /// **'Unable to load account profile.'**
  String get accountProfileLoadError;

  /// No description provided for @notificationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Notifications ({count})'**
  String notificationsTitle(int count);

  /// No description provided for @notificationsMarkAllReadTooltip.
  ///
  /// In en, this message translates to:
  /// **'Mark all as read'**
  String get notificationsMarkAllReadTooltip;

  /// No description provided for @notificationsEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No notifications yet'**
  String get notificationsEmptyTitle;

  /// No description provided for @notificationsEmptyMessage.
  ///
  /// In en, this message translates to:
  /// **'New updates will appear here when they arrive.'**
  String get notificationsEmptyMessage;

  /// No description provided for @notificationsMarkedAllReadMessage.
  ///
  /// In en, this message translates to:
  /// **'All notifications have been marked as read.'**
  String get notificationsMarkedAllReadMessage;

  /// No description provided for @notificationsMarkUnreadAction.
  ///
  /// In en, this message translates to:
  /// **'Mark as unread'**
  String get notificationsMarkUnreadAction;

  /// No description provided for @notificationsMarkedUnreadMessage.
  ///
  /// In en, this message translates to:
  /// **'Marked as unread.'**
  String get notificationsMarkedUnreadMessage;

  /// No description provided for @notificationsOpenLinkFailedMessage.
  ///
  /// In en, this message translates to:
  /// **'Unable to open the link.'**
  String get notificationsOpenLinkFailedMessage;

  /// No description provided for @notificationsTypeOrder.
  ///
  /// In en, this message translates to:
  /// **'Order'**
  String get notificationsTypeOrder;

  /// No description provided for @notificationsTypePromotion.
  ///
  /// In en, this message translates to:
  /// **'Promotion'**
  String get notificationsTypePromotion;

  /// No description provided for @notificationsTypeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get notificationsTypeSystem;

  /// No description provided for @notificationsRelatedViewOrder.
  ///
  /// In en, this message translates to:
  /// **'View order'**
  String get notificationsRelatedViewOrder;

  /// No description provided for @notificationsRelatedViewProducts.
  ///
  /// In en, this message translates to:
  /// **'View products'**
  String get notificationsRelatedViewProducts;

  /// No description provided for @notificationsRelatedViewSupport.
  ///
  /// In en, this message translates to:
  /// **'View support'**
  String get notificationsRelatedViewSupport;

  /// No description provided for @notificationsRelatedViewNotifications.
  ///
  /// In en, this message translates to:
  /// **'View notifications'**
  String get notificationsRelatedViewNotifications;

  /// No description provided for @notificationsRelatedOpenLink.
  ///
  /// In en, this message translates to:
  /// **'Open link'**
  String get notificationsRelatedOpenLink;

  /// No description provided for @notificationsRelatedOpenOverview.
  ///
  /// In en, this message translates to:
  /// **'Open overview'**
  String get notificationsRelatedOpenOverview;

  /// No description provided for @paymentMethodBankTransfer.
  ///
  /// In en, this message translates to:
  /// **'Bank Transfer'**
  String get paymentMethodBankTransfer;

  /// No description provided for @paymentMethodDebt.
  ///
  /// In en, this message translates to:
  /// **'Debt Payment'**
  String get paymentMethodDebt;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'vi'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'vi':
      return AppLocalizationsVi();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
