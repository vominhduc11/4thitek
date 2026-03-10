// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Vietnamese (`vi`).
class AppLocalizationsVi extends AppLocalizations {
  AppLocalizationsVi([String locale = 'vi']) : super(locale);

  @override
  String get appTitle => '4thitek Dealer Hub';

  @override
  String get viewAction => 'Xem';

  @override
  String get sessionExpiredMessage =>
      'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

  @override
  String get welcomeTitle => 'Chào mừng đến 4thitek Dealer Hub';

  @override
  String get welcomeStepProducts => '1. Tạo đơn nhanh trong tab Sản phẩm.';

  @override
  String get welcomeStepOrders =>
      '2. Theo dõi công nợ và trạng thái trong tab Đơn hàng.';

  @override
  String get welcomeStepSearch =>
      '3. Dùng tìm kiếm toàn cục để tra đơn và sản phẩm tức thì.';

  @override
  String get getStarted => 'Bắt đầu';

  @override
  String get tabProducts => 'Sản phẩm';

  @override
  String get tabOrders => 'Đơn hàng';

  @override
  String get tabOverview => 'Tổng quan';

  @override
  String get tabInventory => 'Kho';

  @override
  String get tabAccount => 'Tài khoản';
}
