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
}
