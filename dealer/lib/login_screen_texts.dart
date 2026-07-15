part of 'login_screen.dart';

_LoginTexts _loginTexts(BuildContext context) => _LoginTexts(
  isEnglish: Localizations.localeOf(context).languageCode == 'en',
);

class _LoginTexts {
  const _LoginTexts({required this.isEnglish});

  final bool isEnglish;

  String get brandSubtitle => isEnglish
      ? 'Sign in to manage orders, bank-transfer payments, inventory, and warranties with 4T HITEK.'
      : 'Đăng nhập để quản lý đơn hàng, thanh toán chuyển khoản, tồn kho và bảo hành cùng 4T HITEK.';
  String get brandPillOrders =>
      isEnglish ? 'Manage orders' : 'Quản lý đơn hàng';
  String get brandPillPayments =>
      isEnglish ? 'Track transfers' : 'Theo dõi chuyển khoản';
  String get brandPillWarranty =>
      isEnglish ? 'Process warranties' : 'Xử lý bảo hành';
  String get loginTitle => isEnglish ? 'Dealer sign in' : 'Đăng nhập đại lý';
  String get loginSubtitle => isEnglish
      ? 'Enter your email and password to continue.'
      : 'Nhập email và mật khẩu để tiếp tục.';
  String get emailLabel => 'Email';
  String get passwordLabel => isEnglish ? 'Password' : 'Mật khẩu';
  String get emailRequiredMessage =>
      isEnglish ? 'Email is required.' : 'Email không được để trống.';
  String get invalidEmailMessage =>
      isEnglish ? 'Email is invalid.' : 'Email không hợp lệ.';
  String get passwordRequiredMessage =>
      isEnglish ? 'Password is required.' : 'Mật khẩu không được để trống.';
  String get passwordMinLengthMessage => isEnglish
      ? 'Password must be at least 6 characters.'
      : 'Mật khẩu phải có ít nhất 6 ký tự.';
  String get passwordMinLengthHint =>
      isEnglish ? 'At least 6 characters' : 'Tối thiểu 6 ký tự';
  String get showPasswordTooltip =>
      isEnglish ? 'Show password' : 'Hiện mật khẩu';
  String get hidePasswordTooltip => isEnglish ? 'Hide password' : 'Ẩn mật khẩu';
  String authErrorSemanticsLabel(String message) =>
      isEnglish ? 'Login error: $message' : 'Lỗi đăng nhập: $message';
  String get forgotPasswordAction =>
      isEnglish ? 'Forgot password?' : 'Quên mật khẩu?';
  String get rememberEmailLabel =>
      isEnglish ? 'Remember email' : 'Ghi nhớ email';
  String get loginAction => isEnglish ? 'Sign in' : 'Đăng nhập';
  String get loggingInLabel =>
      isEnglish ? 'Signing in...' : 'Đang đăng nhập...';
  String get noAccountPrompt =>
      isEnglish ? 'No account yet? ' : 'Chưa có tài khoản? ';
  String get registerOnWebsiteAction =>
      isEnglish ? 'Register on website' : 'Đăng ký trên website';
  String get invalidCredentialsMessage => isEnglish
      ? 'Email or password is incorrect.'
      : 'Email hoặc mật khẩu không đúng.';
  String get cannotConnectServerMessage => isEnglish
      ? 'Unable to connect to the server. Please try again.'
      : 'Không thể kết nối máy chủ. Vui lòng thử lại.';
  String get loginFailedMessage => isEnglish
      ? 'Sign in failed. Please try again.'
      : 'Đăng nhập thất bại. Vui lòng thử lại.';
  String get cannotCreateSessionMessage => isEnglish
      ? 'Unable to create a login session. Please try again.'
      : 'Không thể tạo phiên đăng nhập. Vui lòng thử lại.';
  String get loginTimeoutMessage => isEnglish
      ? 'The sign-in request timed out. Please try again.'
      : 'Yêu cầu đăng nhập đã hết thời gian. Vui lòng thử lại.';
  String get unknownLoginErrorMessage => isEnglish
      ? 'An unknown error occurred. Please try again.'
      : 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
  String get cannotOpenRegistrationPageMessage => isEnglish
      ? 'Unable to open the dealer registration page on the website.'
      : 'Không thể mở trang đăng ký đại lý trên website.';
}
