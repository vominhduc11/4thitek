// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Vietnamese (`vi`).
class AppLocalizationsVi extends AppLocalizations {
  AppLocalizationsVi([String locale = 'vi']) : super(locale);

  @override
  String get appTitle => '4T HITEK Dealer';

  @override
  String get viewAction => 'Xem';

  @override
  String get sessionExpiredMessage =>
      'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

  @override
  String get welcomeTitle => 'Chào mừng đến 4T HITEK Dealer';

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

  @override
  String get retryAction => 'Thử lại';

  @override
  String get cancelAction => 'Hủy';

  @override
  String get accountLogoutConfirmTitle => 'Xác nhận đăng xuất';

  @override
  String get accountLogoutConfirmMessage =>
      'Bạn sắp đăng xuất. Dữ liệu giỏ hàng hiện tại sẽ bị xóa. Bạn có muốn tiếp tục không?';

  @override
  String get accountScreenTitle => 'Tài khoản';

  @override
  String get accountSignOutLoading => 'Đang đăng xuất...';

  @override
  String get accountMenuSettingsTitle => 'Cài đặt tài khoản';

  @override
  String get accountMenuSettingsSubtitle =>
      'Cập nhật thông tin đại lý, liên hệ và địa chỉ giao hàng.';

  @override
  String get accountMenuSupportTitle => 'Hỗ trợ';

  @override
  String get accountMenuSupportSubtitle =>
      'Liên hệ hỗ trợ và gửi yêu cầu đơn hàng, sản phẩm, bảo hành.';

  @override
  String get accountMenuWarrantyTitle => 'Trung tâm bảo hành';

  @override
  String get accountMenuWarrantySubtitle =>
      'Xử lý serial, kích hoạt bảo hành và xem kho serial.';

  @override
  String get accountMenuPreferencesTitle => 'Giao diện và ngôn ngữ';

  @override
  String get accountMenuPreferencesSubtitle =>
      'Quản lý ngôn ngữ và thiết lập ứng dụng.';

  @override
  String get accountLogoutAction => 'Đăng xuất';

  @override
  String get accountEditProfileAction => 'Sửa hồ sơ';

  @override
  String accountVersionLabel(String version) {
    return 'Phiên bản $version';
  }

  @override
  String get accountContactLabel => 'Người liên hệ';

  @override
  String get accountPhoneLabel => 'Số điện thoại';

  @override
  String get accountShippingLabel => 'Địa chỉ giao hàng';

  @override
  String get accountPolicyLabel => 'Chính sách';

  @override
  String get accountProfileLoadError => 'Không thể tải dữ liệu tài khoản.';

  @override
  String notificationsTitle(int count) {
    return 'Thông báo ($count)';
  }

  @override
  String get notificationsMarkAllReadTooltip => 'Đánh dấu tất cả đã đọc';

  @override
  String get notificationsEmptyTitle => 'Chưa có thông báo nào';

  @override
  String get notificationsEmptyMessage =>
      'Thông báo mới sẽ xuất hiện tại đây khi có cập nhật.';

  @override
  String get notificationsMarkedAllReadMessage =>
      'Đã đánh dấu tất cả là đã đọc.';

  @override
  String get notificationsMarkUnreadAction => 'Đánh dấu chưa đọc';

  @override
  String get notificationsMarkedUnreadMessage => 'Đã đánh dấu là chưa đọc.';

  @override
  String get notificationsOpenLinkFailedMessage => 'Không mở được liên kết.';

  @override
  String get notificationsTypeOrder => 'Đơn hàng';

  @override
  String get notificationsTypePromotion => 'Khuyến mãi';

  @override
  String get notificationsTypeSystem => 'Hệ thống';

  @override
  String get notificationsRelatedViewOrder => 'Xem đơn hàng';

  @override
  String get notificationsRelatedViewProducts => 'Xem sản phẩm';

  @override
  String get notificationsRelatedViewSupport => 'Xem hỗ trợ';

  @override
  String get notificationsRelatedViewNotifications => 'Xem thông báo';

  @override
  String get notificationsRelatedOpenLink => 'Mở liên kết';

  @override
  String get notificationsRelatedOpenOverview => 'Mở tổng quan';

  @override
  String get paymentMethodBankTransfer => 'Chuyển khoản ngân hàng';

  @override
  String get paymentMethodDebt => 'Ghi nhận công nợ';
}
