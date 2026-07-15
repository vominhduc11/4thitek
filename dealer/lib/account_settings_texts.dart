part of 'account_settings_screen.dart';

class _AccountSettingsTexts {
  const _AccountSettingsTexts({required this.isEnglish});

  final bool isEnglish;

  String loadProfileFailed(Object error) => isEnglish
      ? dealerProfileStorageErrorMessage(error, isEnglish: true)
      : dealerProfileStorageErrorMessage(error, isEnglish: false);

  String get avatarUpdatedMessage => isEnglish
      ? 'Avatar updated. Save changes to keep it.'
      : 'Đã cập nhật avatar. Nhấn Lưu để xác nhận.';

  String avatarUploadFailed(Object error) => isEnglish
      ? uploadServiceErrorMessage(error, isEnglish: true)
      : uploadServiceErrorMessage(error, isEnglish: false);

  String get avatarRemovedMessage => isEnglish
      ? 'Avatar removed. Save changes to confirm.'
      : 'Đã xóa avatar. Nhấn Lưu để xác nhận.';

  String get unsavedChangesTitle =>
      isEnglish ? 'Unsaved changes' : 'Có thay đổi chưa lưu';

  String get unsavedChangesDescription => isEnglish
      ? 'You have unsaved changes. Do you want to leave this screen?'
      : 'Bạn có thay đổi chưa lưu. Bạn có muốn thoát màn hình này không?';

  String get stayAction => isEnglish ? 'Stay' : 'Ở lại';
  String get leaveAction => isEnglish ? 'Leave' : 'Thoát';

  String get resetFieldsTitle => isEnglish ? 'Reset fields' : 'Đặt lại dữ liệu';

  String get resetFieldsDescription => isEnglish
      ? 'Reset editable fields to default values?'
      : 'Đặt lại các trường có thể chỉnh sửa về giá trị mặc định?';

  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get resetAction => isEnglish ? 'Reset' : 'Đặt lại';

  String get defaultsAppliedMessage => isEnglish
      ? 'Default values applied. Press Save to confirm.'
      : 'Đã áp dụng giá trị mặc định. Nhấn Lưu để xác nhận.';

  String get emailRequiredMessage =>
      isEnglish ? 'Please enter your email.' : 'Vui lòng nhập email.';

  String get invalidEmailMessage =>
      isEnglish ? 'Invalid email format.' : 'Email không hợp lệ.';

  String get phoneRequiredMessage => isEnglish
      ? 'Please enter your phone number.'
      : 'Vui lòng nhập số điện thoại.';

  String get invalidPhoneMessage => isEnglish
      ? 'Phone number must be 10 digits and start with 0.'
      : 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.';

  String get reviewHighlightedFieldsMessage => isEnglish
      ? 'Please review the highlighted fields.'
      : 'Vui lòng kiểm tra các trường đang báo lỗi.';

  String saveProfileFailed(Object error) => isEnglish
      ? dealerProfileStorageErrorMessage(error, isEnglish: true)
      : dealerProfileStorageErrorMessage(error, isEnglish: false);

  String get profileSavedMessage =>
      isEnglish ? 'Profile saved successfully.' : 'Đã lưu thông tin tài khoản.';

  String get backAction => isEnglish ? 'Back' : 'Quay lại';

  String get screenTitle =>
      isEnglish ? 'Account settings' : 'Cài đặt tài khoản';

  String get resetTooltip =>
      isEnglish ? 'Reset to defaults' : 'Đặt lại mặc định';

  String get saveActionShort => isEnglish ? 'Save' : 'Lưu';

  String get avatarTitle => isEnglish ? 'Avatar' : 'Ảnh đại diện';

  String get avatarHint => isEnglish
      ? 'Upload a dealer avatar to make your profile easier to recognize across account, support and order screens.'
      : 'Tải ảnh đại diện để hồ sơ đại lý dễ nhận diện hơn trên các màn tài khoản, hỗ trợ và đơn hàng.';

  String get uploadAvatarLabel => isEnglish ? 'Upload avatar' : 'Tải avatar';

  String get replaceAvatarLabel => isEnglish ? 'Replace avatar' : 'Đổi avatar';

  String get removeAvatarLabel => isEnglish ? 'Remove avatar' : 'Xóa avatar';

  String get avatarUploadedBadge =>
      isEnglish ? 'Custom avatar ready' : 'Đã có avatar riêng';

  String get avatarDefaultBadge =>
      isEnglish ? 'Using default avatar' : 'Đang dùng avatar mặc định';

  String get companyTitle =>
      isEnglish ? 'Business information' : 'Thông tin doanh nghiệp';

  String get companySubtitle => isEnglish
      ? 'Primary identity information shown across dealer-facing flows.'
      : 'Thông tin nhận diện chính của doanh nghiệp hiển thị xuyên suốt các luồng dành cho đại lý.';

  String get shippingTitle =>
      isEnglish ? 'Shipping and contact' : 'Địa chỉ giao hàng và liên hệ';

  String get shippingSubtitle => isEnglish
      ? 'Contact channels and delivery address used for coordination and order fulfillment.'
      : 'Thông tin liên hệ và địa chỉ giao hàng dùng cho phối hợp xử lý và giao nhận đơn hàng.';

  String get addressLineLabel =>
      isEnglish ? 'Street address' : 'Số nhà, tên đường';

  String get wardLabel => isEnglish ? 'Ward / Commune' : 'Phường / Xã';

  String get districtLabel => isEnglish ? 'District' : 'Quận / Huyện';

  String get cityLabel => isEnglish ? 'Province / City' : 'Tỉnh / Thành phố';

  String get countryLabel => isEnglish ? 'Country' : 'Quốc gia';

  String get policyTitle => isEnglish ? 'Sales policy' : 'Chính sách bán hàng';

  String get policySubtitle => isEnglish
      ? 'Summarize sales terms, commitments or dealer-specific notes used in commercial communication.'
      : 'Tóm tắt điều khoản bán hàng, cam kết hoặc ghi chú riêng của đại lý dùng trong giao tiếp thương mại.';

  String get saveLabel => isEnglish ? 'Save changes' : 'Lưu thay đổi';

  String get businessLabel =>
      isEnglish ? 'Business / dealer name' : 'Tên doanh nghiệp / đại lý';

  String get contactLabel => isEnglish ? 'Contact person' : 'Người liên hệ';

  String get emailLabel => 'Email';

  String get phoneLabel => isEnglish ? 'Phone number' : 'Số điện thoại';

  String get policyLabel =>
      isEnglish ? 'Policy details' : 'Nội dung chính sách';

  String get businessNameRequiredMessage => isEnglish
      ? 'Please enter business name.'
      : 'Vui lòng nhập tên doanh nghiệp.';

  String get contactRequiredMessage => isEnglish
      ? 'Please enter contact person.'
      : 'Vui lòng nhập người liên hệ.';

  String get addressLineRequiredMessage => isEnglish
      ? 'Please enter street address.'
      : 'Vui lòng nhập số nhà, tên đường.';

  String get cityRequiredMessage => isEnglish
      ? 'Please enter province / city.'
      : 'Vui lòng nhập tỉnh / thành phố.';

  String get policyRequiredMessage => isEnglish
      ? 'Please enter policy details.'
      : 'Vui lòng nhập nội dung chính sách.';

  String get overviewSubtitle => isEnglish
      ? 'Manage dealer identity, avatar, shipping details and policy in one place.'
      : 'Quản lý hồ sơ đại lý, avatar, địa chỉ giao hàng và chính sách tại một nơi.';

  String get unsavedBadge =>
      isEnglish ? 'Unsaved changes' : 'Có thay đổi chưa lưu';

  String get savedBadge =>
      isEnglish ? 'All changes saved' : 'Mọi thay đổi đã được lưu';

  String get actionPanelTitle =>
      isEnglish ? 'Save and review' : 'Kiểm tra và lưu';

  String get actionPanelSubtitle => isEnglish
      ? 'Review the current editing status before saving your profile.'
      : 'Kiểm tra trạng thái chỉnh sửa hiện tại trước khi lưu hồ sơ.';

  String get changeStatusLabel =>
      isEnglish ? 'Change status' : 'Trạng thái chỉnh sửa';

  String get pendingChangesValue => isEnglish ? 'Pending save' : 'Đang chờ lưu';

  String get savedChangesValue => isEnglish ? 'Saved' : 'Đã lưu';

  String get pendingDescription => isEnglish
      ? 'You still have local changes that have not been confirmed yet.'
      : 'Bạn vẫn còn thay đổi cục bộ chưa được xác nhận lưu.';

  String get savedDescription => isEnglish
      ? 'Profile values on screen are already in sync with the saved version.'
      : 'Dữ liệu trên màn hình đã đồng bộ với phiên bản đã lưu.';

  String get profileProgressLabel =>
      isEnglish ? 'Main fields' : 'Trường thông tin chính';

  String fieldsProgressLabel(int completed, int total) => isEnglish
      ? '$completed / $total completed'
      : '$completed / $total đã nhập';

  String get avatarStatusLabel =>
      isEnglish ? 'Avatar status' : 'Trạng thái avatar';

  String get vatLabel => isEnglish ? 'VAT' : 'VAT';

  String get emptyValuePlaceholder =>
      isEnglish ? 'Not updated yet' : 'Chưa cập nhật';
}
