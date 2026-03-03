import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'breakpoints.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  static const _totalSteps = 3;
  static const _stepTitles = <String>[
    'Thông tin đại lý',
    'Liên hệ và địa chỉ',
    'Tài khoản',
  ];
  static const _vnProvinces = <String>[
    'An Giang',
    'Bà Rịa - Vũng Tàu',
    'Bạc Liêu',
    'Bắc Giang',
    'Bắc Kạn',
    'Bắc Ninh',
    'Bến Tre',
    'Bình Dương',
    'Bình Định',
    'Bình Phước',
    'Bình Thuận',
    'Cà Mau',
    'Cao Bằng',
    'Cần Thơ',
    'Đà Nẵng',
    'Đắk Lắk',
    'Đắk Nông',
    'Điện Biên',
    'Đồng Nai',
    'Đồng Tháp',
    'Gia Lai',
    'Hà Giang',
    'Hà Nam',
    'Hà Nội',
    'Hà Tĩnh',
    'Hải Dương',
    'Hải Phòng',
    'Hậu Giang',
    'Hòa Bình',
    'Hưng Yên',
    'Khánh Hòa',
    'Kiên Giang',
    'Kon Tum',
    'Lai Châu',
    'Lâm Đồng',
    'Lạng Sơn',
    'Lào Cai',
    'Long An',
    'Nam Định',
    'Nghệ An',
    'Ninh Bình',
    'Ninh Thuận',
    'Phú Thọ',
    'Phú Yên',
    'Quảng Bình',
    'Quảng Nam',
    'Quảng Ngãi',
    'Quảng Ninh',
    'Quảng Trị',
    'Sóc Trăng',
    'Sơn La',
    'Tây Ninh',
    'Thái Bình',
    'Thái Nguyên',
    'Thanh Hóa',
    'Huế',
    'Tiền Giang',
    'TP Hồ Chí Minh',
    'Trà Vinh',
    'Tuyên Quang',
    'Vĩnh Long',
    'Vĩnh Phúc',
    'Yên Bái',
  ];

  final _formKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();
  final _formTopKey = GlobalKey();
  final _termsKey = GlobalKey();
  final _confirmFieldStateKey = GlobalKey<FormFieldState<String>>();
  final _agencyController = TextEditingController();
  final _taxCodeController = TextEditingController();
  final _contactController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _agencyFocusNode = FocusNode();
  final _taxCodeFocusNode = FocusNode();
  final _contactFocusNode = FocusNode();
  final _phoneFocusNode = FocusNode();
  final _emailFocusNode = FocusNode();
  final _addressFocusNode = FocusNode();
  final _cityFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();
  final _confirmFocusNode = FocusNode();
  final _agencyFieldKey = GlobalKey();
  final _taxCodeFieldKey = GlobalKey();
  final _contactFieldKey = GlobalKey();
  final _phoneFieldKey = GlobalKey();
  final _emailFieldKey = GlobalKey();
  final _addressFieldKey = GlobalKey();
  final _cityFieldKey = GlobalKey();
  final _passwordFieldKey = GlobalKey();
  final _confirmFieldKey = GlobalKey();
  final _isFormValidNotifier = ValueNotifier<bool>(false);
  final _termsErrorNotifier = ValueNotifier<String?>(null);

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _agreedToTerms = false;
  bool _isSubmitting = false;
  bool _isSubmitted = false;
  int _currentStep = 0;
  String _submittedEmail = '';

  @override
  void initState() {
    super.initState();
    _agencyController.addListener(_onFormInputChanged);
    _taxCodeController.addListener(_onFormInputChanged);
    _contactController.addListener(_onFormInputChanged);
    _phoneController.addListener(_onFormInputChanged);
    _emailController.addListener(_onFormInputChanged);
    _addressController.addListener(_onFormInputChanged);
    _cityController.addListener(_onFormInputChanged);
    _passwordController.addListener(_onFormInputChanged);
    _passwordController.addListener(_onPasswordChanged);
    _confirmController.addListener(_onFormInputChanged);

    _agencyFocusNode.addListener(_onFieldFocusChanged);
    _taxCodeFocusNode.addListener(_onFieldFocusChanged);
    _contactFocusNode.addListener(_onFieldFocusChanged);
    _phoneFocusNode.addListener(_onFieldFocusChanged);
    _emailFocusNode.addListener(_onFieldFocusChanged);
    _addressFocusNode.addListener(_onFieldFocusChanged);
    _cityFocusNode.addListener(_onFieldFocusChanged);
    _passwordFocusNode.addListener(_onFieldFocusChanged);
    _confirmFocusNode.addListener(_onFieldFocusChanged);
  }

  @override
  void dispose() {
    _agencyController.removeListener(_onFormInputChanged);
    _taxCodeController.removeListener(_onFormInputChanged);
    _contactController.removeListener(_onFormInputChanged);
    _phoneController.removeListener(_onFormInputChanged);
    _emailController.removeListener(_onFormInputChanged);
    _addressController.removeListener(_onFormInputChanged);
    _cityController.removeListener(_onFormInputChanged);
    _passwordController.removeListener(_onFormInputChanged);
    _passwordController.removeListener(_onPasswordChanged);
    _confirmController.removeListener(_onFormInputChanged);

    _agencyFocusNode.removeListener(_onFieldFocusChanged);
    _taxCodeFocusNode.removeListener(_onFieldFocusChanged);
    _contactFocusNode.removeListener(_onFieldFocusChanged);
    _phoneFocusNode.removeListener(_onFieldFocusChanged);
    _emailFocusNode.removeListener(_onFieldFocusChanged);
    _addressFocusNode.removeListener(_onFieldFocusChanged);
    _cityFocusNode.removeListener(_onFieldFocusChanged);
    _passwordFocusNode.removeListener(_onFieldFocusChanged);
    _confirmFocusNode.removeListener(_onFieldFocusChanged);

    _agencyController.dispose();
    _taxCodeController.dispose();
    _contactController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    _agencyFocusNode.dispose();
    _taxCodeFocusNode.dispose();
    _contactFocusNode.dispose();
    _phoneFocusNode.dispose();
    _emailFocusNode.dispose();
    _addressFocusNode.dispose();
    _cityFocusNode.dispose();
    _passwordFocusNode.dispose();
    _confirmFocusNode.dispose();
    _scrollController.dispose();
    _isFormValidNotifier.dispose();
    _termsErrorNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenSize = MediaQuery.sizeOf(context);
    final screenWidth = screenSize.width;
    final isTablet = screenSize.shortestSide >= AppBreakpoints.phone;
    final isLandscape =
        MediaQuery.orientationOf(context) == Orientation.landscape;
    const compactMaxWidth = 420.0;
    final cardMaxWidth = isTablet ? 560.0 : compactMaxWidth;
    final isCompact = screenWidth <= compactMaxWidth;
    final horizontalPadding = isLandscape ? 16.0 : 20.0;
    final verticalPadding = isLandscape ? 16.0 : 28.0;
    final cardHorizontalPadding = isLandscape ? 16.0 : 20.0;
    final cardTopPadding = isLandscape ? 16.0 : 20.0;
    final cardBottomPadding = isLandscape ? 12.0 : 16.0;
    final headerBottomGap = isLandscape ? 12.0 : 24.0;
    final headerLogoHeight = isTablet
        ? 46.0
        : isLandscape
        ? 34.0
        : 40.0;
    final topOrbSize = isCompact ? 170.0 : 220.0;
    final bottomOrbSize = isCompact ? 150.0 : 200.0;

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                stops: [0.0, 0.45, 1.0],
                colors: [
                  Color(0xFF1D4ED8),
                  Color(0xFF2563EB),
                  Color(0xFFDBEAFE),
                ],
              ),
            ),
          ),
          const Positioned.fill(
            child: IgnorePointer(
              child: Opacity(opacity: 0.07, child: _TextureLayer()),
            ),
          ),
          Positioned(
            right: isCompact ? -56 : -80,
            top: isCompact ? -26 : -40,
            child: _GlowOrb(size: topOrbSize, color: const Color(0x66FFFFFF)),
          ),
          Positioned(
            left: isCompact ? -44 : -60,
            bottom: isCompact ? -18 : -30,
            child: _GlowOrb(
              size: bottomOrbSize,
              color: const Color(0x33FFFFFF),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              controller: _scrollController,
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: EdgeInsets.fromLTRB(
                horizontalPadding,
                verticalPadding,
                horizontalPadding,
                verticalPadding,
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: cardMaxWidth),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      FadeSlideIn(
                        child: _RegisterHeader(
                          theme: theme,
                          showSubtitle: !isLandscape,
                          logoHeight: headerLogoHeight,
                        ),
                      ),
                      SizedBox(height: headerBottomGap),
                      FadeSlideIn(
                        delay: const Duration(milliseconds: 80),
                        child: Container(
                          padding: EdgeInsets.fromLTRB(
                            cardHorizontalPadding,
                            cardTopPadding,
                            cardHorizontalPadding,
                            cardBottomPadding,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surface,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 24,
                                offset: const Offset(0, 12),
                              ),
                            ],
                          ),
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 220),
                            child: _isSubmitted
                                ? _buildSuccessContent(theme)
                                : _buildFormContent(
                                    theme,
                                    isLandscape: isLandscape,
                                  ),
                          ),
                        ),
                      ),
                      if (!_isSubmitted) ...[
                        const SizedBox(height: 14),
                        FadeSlideIn(
                          delay: const Duration(milliseconds: 140),
                          child: _LoginPrompt(
                            theme: theme,
                            isLoading: _isSubmitting,
                            onLogin: () => Navigator.of(context).pop(),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormContent(ThemeData theme, {required bool isLandscape}) {
    final inputTextStyle = theme.textTheme.bodyLarge?.copyWith(
      fontSize: 16,
      fontWeight: FontWeight.w500,
    );
    final introBottomGap = isLandscape ? 12.0 : 20.0;
    final sectionGap = isLandscape ? 16.0 : 24.0;
    final fieldGap = isLandscape ? 12.0 : 16.0;
    final labelGap = isLandscape ? 6.0 : 8.0;
    final beforeActionsGap = isLandscape ? 12.0 : 16.0;

    return AutofillGroup(
      child: Form(
        key: _formKey,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: Column(
          key: const ValueKey('register-form'),
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(key: _formTopKey),
            Text(
              'Đăng ký đại lý',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Hoàn tất thông tin để đội ngũ 4thitek duyệt và kích hoạt tài khoản.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                height: 1.5,
              ),
            ),
            SizedBox(height: introBottomGap),
            _buildStepIndicator(theme),
            SizedBox(height: introBottomGap),
            if (_currentStep == 0) ...[
              _buildSectionTitle(theme, 'Thông tin đại lý'),
              SizedBox(height: fieldGap),
              _buildFieldLabel(theme, 'Tên đại lý'),
              SizedBox(height: labelGap),
              _buildAnchoredField(
                anchorKey: _agencyFieldKey,
                semanticsLabel: 'Tên đại lý',
                child: TextFormField(
                  controller: _agencyController,
                  focusNode: _agencyFocusNode,
                  enabled: !_isSubmitting,
                  textInputAction: TextInputAction.next,
                  textCapitalization: TextCapitalization.words,
                  style: inputTextStyle,
                  decoration: _buildInputDecoration(
                    icon: Icons.storefront_outlined,
                  ),
                  onFieldSubmitted: (_) => _taxCodeFocusNode.requestFocus(),
                  validator: (value) {
                    if ((value ?? '').trim().isEmpty) {
                      return 'Tên đại lý không được để trống';
                    }
                    return null;
                  },
                ),
              ),
              SizedBox(height: fieldGap),
              _buildFieldLabel(theme, 'Mã số thuế', isRequired: false),
              SizedBox(height: labelGap),
              _buildAnchoredField(
                anchorKey: _taxCodeFieldKey,
                semanticsLabel: 'Mã số thuế',
                child: TextFormField(
                  controller: _taxCodeController,
                  focusNode: _taxCodeFocusNode,
                  enabled: !_isSubmitting,
                  textInputAction: TextInputAction.done,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(13),
                  ],
                  maxLength: 13,
                  style: inputTextStyle,
                  decoration: _buildInputDecoration(
                    icon: Icons.badge_outlined,
                  ).copyWith(counterText: ''),
                  onFieldSubmitted: (_) => _handleNextStep(),
                  validator: (value) {
                    final taxCode = (value ?? '').trim();
                    if (taxCode.isEmpty) {
                      return null;
                    }
                    if (taxCode.length != 10 && taxCode.length != 13) {
                      return 'Mã số thuế phải có 10 hoặc 13 chữ số';
                    }
                    return null;
                  },
                ),
              ),
              SizedBox(height: sectionGap),
            ],
            if (_currentStep == 1) ...[
              _buildSectionTitle(theme, 'Thông tin liên hệ'),
              SizedBox(height: fieldGap),
              _buildFieldLabel(theme, 'Họ và tên người liên hệ'),
              SizedBox(height: labelGap),
              _buildAnchoredField(
                anchorKey: _contactFieldKey,
                semanticsLabel: 'Họ và tên người liên hệ',
                child: TextFormField(
                  controller: _contactController,
                  focusNode: _contactFocusNode,
                  enabled: !_isSubmitting,
                  textInputAction: TextInputAction.next,
                  textCapitalization: TextCapitalization.words,
                  autofillHints: const [AutofillHints.name],
                  style: inputTextStyle,
                  decoration: _buildInputDecoration(icon: Icons.person_outline),
                  onFieldSubmitted: (_) => _phoneFocusNode.requestFocus(),
                  validator: (value) {
                    if ((value ?? '').trim().isEmpty) {
                      return 'Tên người liên hệ không được để trống';
                    }
                    return null;
                  },
                ),
              ),
              SizedBox(height: fieldGap),
              _buildFieldLabel(theme, 'Số điện thoại'),
              SizedBox(height: labelGap),
              _buildAnchoredField(
                anchorKey: _phoneFieldKey,
                semanticsLabel: 'Số điện thoại',
                child: TextFormField(
                  controller: _phoneController,
                  focusNode: _phoneFocusNode,
                  enabled: !_isSubmitting,
                  textInputAction: TextInputAction.next,
                  keyboardType: TextInputType.phone,
                  autofillHints: const [AutofillHints.telephoneNumber],
                  style: inputTextStyle,
                  decoration: _buildInputDecoration(icon: Icons.phone_outlined),
                  onFieldSubmitted: (_) => _emailFocusNode.requestFocus(),
                  validator: (value) {
                    final phone = (value ?? '').trim();
                    if (phone.isEmpty) {
                      return 'Số điện thoại không được để trống';
                    }
                    if (!_isValidPhone(phone)) {
                      return 'Số điện thoại không hợp lệ';
                    }
                    return null;
                  },
                ),
              ),
              SizedBox(height: fieldGap),
              _buildFieldLabel(theme, 'Email'),
              SizedBox(height: labelGap),
              _buildAnchoredField(
                anchorKey: _emailFieldKey,
                semanticsLabel: 'Email',
                child: TextFormField(
                  controller: _emailController,
                  focusNode: _emailFocusNode,
                  enabled: !_isSubmitting,
                  textInputAction: TextInputAction.next,
                  keyboardType: TextInputType.emailAddress,
                  textCapitalization: TextCapitalization.none,
                  autofillHints: const [
                    AutofillHints.email,
                    AutofillHints.username,
                  ],
                  autocorrect: false,
                  enableSuggestions: false,
                  style: inputTextStyle,
                  decoration: _buildInputDecoration(icon: Icons.mail_outline),
                  onFieldSubmitted: (_) => _addressFocusNode.requestFocus(),
                  validator: (value) {
                    final email = (value ?? '').trim();
                    if (email.isEmpty) {
                      return 'Email không được để trống';
                    }
                    if (!_isValidEmail(email)) {
                      return 'Email không hợp lệ';
                    }
                    return null;
                  },
                ),
              ),
              SizedBox(height: sectionGap),
              _buildSectionTitle(theme, 'Địa chỉ'),
              SizedBox(height: fieldGap),
              _buildFieldLabel(theme, 'Địa chỉ'),
              SizedBox(height: labelGap),
              _buildAnchoredField(
                anchorKey: _addressFieldKey,
                semanticsLabel: 'Địa chỉ',
                child: TextFormField(
                  controller: _addressController,
                  focusNode: _addressFocusNode,
                  enabled: !_isSubmitting,
                  textInputAction: TextInputAction.next,
                  textCapitalization: TextCapitalization.sentences,
                  autofillHints: const [AutofillHints.fullStreetAddress],
                  style: inputTextStyle,
                  decoration: _buildInputDecoration(
                    icon: Icons.location_on_outlined,
                  ),
                  onFieldSubmitted: (_) => _cityFocusNode.requestFocus(),
                  validator: (value) {
                    if ((value ?? '').trim().isEmpty) {
                      return 'Địa chỉ không được để trống';
                    }
                    return null;
                  },
                ),
              ),
              SizedBox(height: fieldGap),
              _buildFieldLabel(theme, 'Tỉnh/Thành phố'),
              SizedBox(height: labelGap),
              _buildAnchoredField(
                anchorKey: _cityFieldKey,
                semanticsLabel: 'Tỉnh/Thành phố',
                isTextField: false,
                child: DropdownButtonFormField<String>(
                  initialValue: _cityController.text.isEmpty
                      ? null
                      : _cityController.text,
                  focusNode: _cityFocusNode,
                  isExpanded: true,
                  items: _vnProvinces
                      .map(
                        (province) => DropdownMenuItem<String>(
                          value: province,
                          child: Text(
                            province,
                            overflow: TextOverflow.ellipsis,
                            style: inputTextStyle,
                          ),
                        ),
                      )
                      .toList(),
                  decoration: _buildInputDecoration(
                    icon: Icons.map_outlined,
                  ).copyWith(hintText: 'Chọn Tỉnh/Thành phố'),
                  onChanged: _isSubmitting
                      ? null
                      : (value) {
                          _cityController.text = value ?? '';
                          _onFormInputChanged();
                        },
                  validator: (value) {
                    final city = (value ?? '').trim();
                    if (city.isEmpty) {
                      return 'Tỉnh/Thành phố không được để trống';
                    }
                    if (!_isValidCity(city)) {
                      return 'Vui lòng chọn Tỉnh/Thành phố hợp lệ';
                    }
                    return null;
                  },
                ),
              ),
              SizedBox(height: sectionGap),
            ],
            if (_currentStep == 2) ...[
              _buildSectionTitle(theme, 'Tài khoản'),
              SizedBox(height: fieldGap),
              _buildFieldLabel(theme, 'Mật khẩu'),
              SizedBox(height: labelGap),
              _buildAnchoredField(
                anchorKey: _passwordFieldKey,
                semanticsLabel: 'Mật khẩu',
                child: TextFormField(
                  controller: _passwordController,
                  focusNode: _passwordFocusNode,
                  enabled: !_isSubmitting,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.newPassword],
                  autocorrect: false,
                  enableSuggestions: false,
                  style: inputTextStyle,
                  decoration: _buildInputDecoration(
                    icon: Icons.lock_outline,
                    suffixIcon: IconButton(
                      onPressed: _isSubmitting
                          ? null
                          : () {
                              setState(
                                () => _obscurePassword = !_obscurePassword,
                              );
                            },
                      tooltip: _obscurePassword
                          ? 'Hiện mật khẩu'
                          : 'Ẩn mật khẩu',
                      icon: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 160),
                        transitionBuilder: (child, animation) =>
                            FadeTransition(opacity: animation, child: child),
                        child: Icon(
                          _obscurePassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          key: ValueKey<bool>(_obscurePassword),
                        ),
                      ),
                    ),
                  ),
                  onFieldSubmitted: (_) => _confirmFocusNode.requestFocus(),
                  validator: (value) {
                    final password = value ?? '';
                    if (password.isEmpty) {
                      return 'Mật khẩu không được để trống';
                    }
                    if (password.length < 6) {
                      return 'Mật khẩu tối thiểu 6 ký tự';
                    }
                    return null;
                  },
                ),
              ),
              SizedBox(height: fieldGap),
              _buildFieldLabel(theme, 'Xác nhận mật khẩu'),
              SizedBox(height: labelGap),
              _buildAnchoredField(
                anchorKey: _confirmFieldKey,
                semanticsLabel: 'Xác nhận mật khẩu',
                child: TextFormField(
                  key: _confirmFieldStateKey,
                  controller: _confirmController,
                  focusNode: _confirmFocusNode,
                  enabled: !_isSubmitting,
                  obscureText: _obscureConfirm,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.newPassword],
                  autocorrect: false,
                  enableSuggestions: false,
                  style: inputTextStyle,
                  onFieldSubmitted: (_) async {
                    if (!_isSubmitting) {
                      await _handleSubmit();
                    }
                  },
                  decoration: _buildInputDecoration(
                    icon: Icons.lock_outline,
                    suffixIcon: IconButton(
                      onPressed: _isSubmitting
                          ? null
                          : () {
                              setState(
                                () => _obscureConfirm = !_obscureConfirm,
                              );
                            },
                      tooltip: _obscureConfirm
                          ? 'Hiện mật khẩu xác nhận'
                          : 'Ẩn mật khẩu xác nhận',
                      icon: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 160),
                        transitionBuilder: (child, animation) =>
                            FadeTransition(opacity: animation, child: child),
                        child: Icon(
                          _obscureConfirm
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          key: ValueKey<bool>(_obscureConfirm),
                        ),
                      ),
                    ),
                  ),
                  validator: (value) {
                    final confirm = value ?? '';
                    if (confirm.isEmpty) {
                      return 'Xác nhận mật khẩu không được để trống';
                    }
                    if (confirm != _passwordController.text) {
                      return 'Mật khẩu xác nhận không khớp';
                    }
                    return null;
                  },
                ),
              ),
              SizedBox(height: fieldGap),
              Semantics(
                container: true,
                label: 'Đồng ý điều khoản đăng ký đại lý',
                checked: _agreedToTerms,
                child: ConstrainedBox(
                  key: _termsKey,
                  constraints: const BoxConstraints(minHeight: 44),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: _isSubmitting
                          ? null
                          : () {
                              setState(() => _agreedToTerms = !_agreedToTerms);
                              _onFormInputChanged();
                            },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 6,
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            IgnorePointer(
                              child: Checkbox(
                                value: _agreedToTerms,
                                onChanged: _isSubmitting
                                    ? null
                                    : (value) {
                                        setState(
                                          () => _agreedToTerms = value ?? false,
                                        );
                                        _onFormInputChanged();
                                      },
                              ),
                            ),
                            Expanded(
                              child: Text(
                                'Tôi đồng ý với điều khoản đăng ký đại lý.',
                                style: theme.textTheme.bodyMedium,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              ValueListenableBuilder<String?>(
                valueListenable: _termsErrorNotifier,
                builder: (context, termsError, _) {
                  if (termsError == null) {
                    return const SizedBox.shrink();
                  }
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      termsError,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.error,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  );
                },
              ),
            ],
            SizedBox(height: beforeActionsGap),
            _buildStepActions(),
          ],
        ),
      ),
    );
  }

  Widget _buildStepIndicator(ThemeData theme) {
    final colorScheme = theme.colorScheme;
    final primaryColor = colorScheme.primary;
    final activeStepBg = Color.alphaBlend(
      primaryColor.withValues(alpha: 0.08),
      colorScheme.surface,
    );
    final completeStepBg = Color.alphaBlend(
      primaryColor.withValues(alpha: 0.16),
      colorScheme.surface,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(_totalSteps, (index) {
            final isActive = index == _currentStep;
            final isComplete = index < _currentStep;
            final bgColor = isActive
                ? activeStepBg
                : isComplete
                ? completeStepBg
                : colorScheme.surfaceContainerHighest;
            final borderColor = isActive || isComplete
                ? primaryColor.withValues(alpha: isActive ? 0.45 : 0.25)
                : colorScheme.outlineVariant;
            final titleColor = isActive || isComplete
                ? primaryColor
                : colorScheme.onSurfaceVariant;

            return Expanded(
              child: Container(
                margin: EdgeInsets.only(
                  right: index == _totalSteps - 1 ? 0 : 8,
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Bước ${index + 1}',
                      style: theme.textTheme.labelMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: titleColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _stepTitles[index],
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: (_currentStep + 1) / _totalSteps,
            minHeight: 6,
            backgroundColor: colorScheme.surfaceContainerHighest,
            valueColor: AlwaysStoppedAnimation<Color>(primaryColor),
          ),
        ),
      ],
    );
  }

  Widget _buildStepActions() {
    final isFinalStep = _currentStep == _totalSteps - 1;
    final showBackStep = _currentStep > 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (!isFinalStep)
          SizedBox(
            width: double.infinity,
            child: _AnimatedSubmitButton(
              canSubmit: !_isSubmitting,
              isLoading: false,
              label: 'Tiếp tục',
              loadingLabel: 'Đang xử lý...',
              onPressed: _handleNextStep,
              style: _buildPrimaryButtonStyle(),
            ),
          )
        else
          SizedBox(
            width: double.infinity,
            child: ValueListenableBuilder<bool>(
              valueListenable: _isFormValidNotifier,
              builder: (context, isFormValid, _) {
                final canSubmit = isFormValid && !_isSubmitting;
                return _AnimatedSubmitButton(
                  canSubmit: canSubmit,
                  isLoading: _isSubmitting,
                  label: 'Gửi đăng ký',
                  loadingLabel: 'Đang gửi đăng ký...',
                  onPressed: _handleSubmit,
                  style: _buildPrimaryButtonStyle(),
                );
              },
            ),
          ),
        if (showBackStep) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: _isSubmitting ? null : _handlePreviousStep,
              style: _buildOutlineButtonStyle(),
              child: const Text('Quay lại bước trước'),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildSuccessContent(ThemeData theme) {
    return Column(
      key: const ValueKey('register-success'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Center(
          child: Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.verified_outlined,
              size: 34,
              color: theme.colorScheme.primary,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Yêu cầu đăng ký đã gửi',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '4thitek sẽ xác minh thông tin và liên hệ lại trong vòng 1-2 ngày làm việc.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
            height: 1.5,
          ),
        ),
        if (_submittedEmail.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            'Email đăng ký: $_submittedEmail',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
        const SizedBox(height: 8),
        Text(
          'Lưu ý: gửi lại sẽ tạo yêu cầu mới và có thể bị trùng hồ sơ.',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _startNewRegistration,
            style: _buildPrimaryButtonStyle(),
            child: const Text('Gửi lại với thông tin khác'),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(),
            style: _buildOutlineButtonStyle(),
            child: const Text('Quay lại đăng nhập'),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(ThemeData theme, String text) {
    return Text(
      text,
      style: theme.textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w700,
        color: theme.colorScheme.onSurface,
      ),
    );
  }

  Widget _buildFieldLabel(
    ThemeData theme,
    String text, {
    bool isRequired = true,
  }) {
    final baseStyle = theme.textTheme.labelLarge?.copyWith(
      fontWeight: FontWeight.w600,
      color: theme.colorScheme.onSurface,
    );

    if (!isRequired) {
      return Text.rich(
        TextSpan(
          text: text,
          style: baseStyle,
          children: [
            TextSpan(
              text: ' (không bắt buộc)',
              style: baseStyle?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    return Text.rich(
      TextSpan(
        text: text,
        style: baseStyle,
        children: [
          TextSpan(
            text: ' *',
            style: baseStyle?.copyWith(
              color: theme.colorScheme.error,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnchoredField({
    required GlobalKey anchorKey,
    required String semanticsLabel,
    bool isTextField = true,
    required Widget child,
  }) {
    return Container(
      key: anchorKey,
      child: Semantics(
        textField: isTextField,
        label: semanticsLabel,
        child: child,
      ),
    );
  }

  ButtonStyle _buildPrimaryButtonStyle() {
    final colorScheme = Theme.of(context).colorScheme;
    final disabledBg = Color.alphaBlend(
      colorScheme.onSurface.withValues(alpha: 0.08),
      colorScheme.surface,
    );
    final disabledFg = colorScheme.onSurface.withValues(alpha: 0.45);

    return ButtonStyle(
      minimumSize: const WidgetStatePropertyAll(Size(0, 48)),
      backgroundColor: WidgetStateProperty.resolveWith<Color>((states) {
        if (_isSubmitting) {
          return colorScheme.primary;
        }
        if (states.contains(WidgetState.disabled)) {
          return disabledBg;
        }
        return colorScheme.primary;
      }),
      foregroundColor: WidgetStateProperty.resolveWith<Color>((states) {
        if (_isSubmitting) {
          return Colors.white;
        }
        if (states.contains(WidgetState.disabled)) {
          return disabledFg;
        }
        return Colors.white;
      }),
      elevation: const WidgetStatePropertyAll(0),
      shape: WidgetStatePropertyAll(
        RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      textStyle: const WidgetStatePropertyAll(
        TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    );
  }

  ButtonStyle _buildOutlineButtonStyle() {
    final primaryColor = Theme.of(context).colorScheme.primary;

    return OutlinedButton.styleFrom(
      minimumSize: const Size(0, 48),
      foregroundColor: primaryColor,
      side: BorderSide(color: primaryColor, width: 1.2),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
    );
  }

  InputDecoration _buildInputDecoration({
    required IconData icon,
    Widget? suffixIcon,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    final baseBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: colorScheme.outlineVariant),
    );
    return InputDecoration(
      prefixIcon: Icon(icon),
      suffixIcon: suffixIcon,
      isDense: true,
      constraints: const BoxConstraints(minHeight: 44),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      errorStyle: TextStyle(
        color: colorScheme.error,
        fontSize: 13,
        fontWeight: FontWeight.w500,
        height: 1.2,
      ),
      border: baseBorder,
      enabledBorder: baseBorder,
      focusedBorder: baseBorder.copyWith(
        borderSide: BorderSide(color: colorScheme.primary, width: 1.6),
      ),
      errorBorder: baseBorder.copyWith(
        borderSide: BorderSide(color: colorScheme.error, width: 1.3),
      ),
      focusedErrorBorder: baseBorder.copyWith(
        borderSide: BorderSide(color: colorScheme.error, width: 1.6),
      ),
    );
  }

  Future<void> _handleNextStep() async {
    if (_isSubmitting || _currentStep >= _totalSteps - 1) {
      return;
    }

    FocusScope.of(context).unfocus();
    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) {
      _focusFirstInvalidFieldForCurrentStep();
      return;
    }

    setState(() => _currentStep += 1);
    _scrollToFormTop();
  }

  void _handlePreviousStep() {
    if (_isSubmitting || _currentStep == 0) {
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() => _currentStep -= 1);
    _scrollToFormTop();
  }

  Future<void> _handleSubmit() async {
    if (_isSubmitting) {
      return;
    }

    FocusScope.of(context).unfocus();
    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) {
      _focusFirstInvalidFieldForCurrentStep();
      return;
    }

    if (!_agreedToTerms) {
      _termsErrorNotifier.value = 'Vui lòng đồng ý với điều khoản đăng ký.';
      _scrollToField(_termsKey);
      return;
    }

    if (!_isStepOneValid()) {
      setState(() => _currentStep = 0);
      _scrollToFormTop();
      return;
    }
    if (!_isStepTwoValid()) {
      setState(() => _currentStep = 1);
      _scrollToFormTop();
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await Future.delayed(const Duration(seconds: 2));
      if (!mounted) {
        return;
      }
      setState(() {
        _isSubmitting = false;
        _isSubmitted = true;
        _submittedEmail = _emailController.text.trim();
      });
    } finally {
      if (mounted && _isSubmitting) {
        setState(() => _isSubmitting = false);
      }
      _isFormValidNotifier.value = _isFormInputValid();
    }
  }

  void _startNewRegistration() {
    setState(() {
      _isSubmitted = false;
      _currentStep = 0;
      _submittedEmail = '';
      _agencyController.clear();
      _taxCodeController.clear();
      _contactController.clear();
      _phoneController.clear();
      _emailController.clear();
      _addressController.clear();
      _cityController.clear();
      _passwordController.clear();
      _confirmController.clear();
      _agreedToTerms = false;
      _obscurePassword = true;
      _obscureConfirm = true;
    });
    _termsErrorNotifier.value = null;
    _isFormValidNotifier.value = false;
  }

  void _onFormInputChanged() {
    _isFormValidNotifier.value = _isFormInputValid();
    if (_agreedToTerms && _termsErrorNotifier.value != null) {
      _termsErrorNotifier.value = null;
    }
  }

  void _onPasswordChanged() {
    if (_confirmController.text.isEmpty) {
      return;
    }
    _confirmFieldStateKey.currentState?.validate();
  }

  void _onFieldFocusChanged() {
    if (_agencyFocusNode.hasFocus) {
      _scrollToField(_agencyFieldKey);
      return;
    }
    if (_taxCodeFocusNode.hasFocus) {
      _scrollToField(_taxCodeFieldKey);
      return;
    }
    if (_contactFocusNode.hasFocus) {
      _scrollToField(_contactFieldKey);
      return;
    }
    if (_phoneFocusNode.hasFocus) {
      _scrollToField(_phoneFieldKey);
      return;
    }
    if (_emailFocusNode.hasFocus) {
      _scrollToField(_emailFieldKey);
      return;
    }
    if (_addressFocusNode.hasFocus) {
      _scrollToField(_addressFieldKey);
      return;
    }
    if (_cityFocusNode.hasFocus) {
      _scrollToField(_cityFieldKey);
      return;
    }
    if (_passwordFocusNode.hasFocus) {
      _scrollToField(_passwordFieldKey);
      return;
    }
    if (_confirmFocusNode.hasFocus) {
      _scrollToField(_confirmFieldKey);
    }
  }

  void _scrollToFormTop() {
    _scrollToField(_formTopKey, alignment: 0.12);
  }

  void _scrollToField(GlobalKey key, {double alignment = 0.24}) {
    final fieldContext = key.currentContext;
    if (fieldContext == null) {
      return;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      Scrollable.ensureVisible(
        fieldContext,
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        alignment: alignment,
      );
    });
  }

  void _focusFirstInvalidFieldForCurrentStep() {
    if (_currentStep == 0) {
      if (_agencyController.text.trim().isEmpty) {
        _agencyFocusNode.requestFocus();
      }
      return;
    }

    if (_currentStep == 1) {
      final contact = _contactController.text.trim();
      final phone = _phoneController.text.trim();
      final email = _emailController.text.trim();
      final address = _addressController.text.trim();
      final city = _cityController.text.trim();

      if (contact.isEmpty) {
        _contactFocusNode.requestFocus();
        return;
      }
      if (phone.isEmpty || !_isValidPhone(phone)) {
        _phoneFocusNode.requestFocus();
        return;
      }
      if (email.isEmpty || !_isValidEmail(email)) {
        _emailFocusNode.requestFocus();
        return;
      }
      if (address.isEmpty) {
        _addressFocusNode.requestFocus();
        return;
      }
      if (city.isEmpty || !_isValidCity(city)) {
        _cityFocusNode.requestFocus();
      }
      return;
    }

    final password = _passwordController.text;
    final confirm = _confirmController.text;
    if (password.isEmpty || password.length < 6) {
      _passwordFocusNode.requestFocus();
      return;
    }
    if (confirm.isEmpty || confirm != password) {
      _confirmFocusNode.requestFocus();
      return;
    }
    if (!_agreedToTerms) {
      _termsErrorNotifier.value = 'Vui lòng đồng ý với điều khoản đăng ký.';
      _scrollToField(_termsKey);
    }
  }

  bool _isFormInputValid() {
    return _isStepOneValid() &&
        _isStepTwoValid() &&
        _isStepThreeValid() &&
        _agreedToTerms;
  }

  bool _isStepOneValid() {
    final agency = _agencyController.text.trim();
    return agency.isNotEmpty;
  }

  bool _isStepTwoValid() {
    final contact = _contactController.text.trim();
    final phone = _phoneController.text.trim();
    final email = _emailController.text.trim();
    final address = _addressController.text.trim();
    final city = _cityController.text.trim();
    final hasRequired =
        contact.isNotEmpty &&
        phone.isNotEmpty &&
        email.isNotEmpty &&
        address.isNotEmpty &&
        city.isNotEmpty;
    if (!hasRequired) {
      return false;
    }
    return _isValidPhone(phone) && _isValidEmail(email) && _isValidCity(city);
  }

  bool _isStepThreeValid() {
    final password = _passwordController.text;
    final confirm = _confirmController.text;
    return password.length >= 6 && confirm.isNotEmpty && confirm == password;
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  bool _isValidPhone(String phone) {
    return RegExp(r'^[+]?[0-9][0-9\s-]{7,}$').hasMatch(phone);
  }

  bool _isValidCity(String city) {
    return _vnProvinces.contains(city);
  }
}

class _RegisterHeader extends StatelessWidget {
  const _RegisterHeader({
    required this.theme,
    required this.showSubtitle,
    required this.logoHeight,
  });

  final ThemeData theme;
  final bool showSubtitle;
  final double logoHeight;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        BrandLogoWordmark(height: logoHeight),
        if (showSubtitle) ...[
          const SizedBox(height: 16),
          Text(
            'Hoàn tất thông tin để đội ngũ 4thitek duyệt và kích hoạt tài khoản.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.white,
              shadows: const [
                Shadow(
                  color: Color(0x55000000),
                  blurRadius: 8,
                  offset: Offset(0, 1),
                ),
              ],
              height: 1.45,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }
}

class _LoginPrompt extends StatelessWidget {
  const _LoginPrompt({
    required this.theme,
    required this.isLoading,
    required this.onLogin,
  });

  final ThemeData theme;
  final bool isLoading;
  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: TextButton(
        onPressed: isLoading ? null : onLogin,
        child: Text.rich(
          TextSpan(
            text: 'Đã có tài khoản? ',
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white),
            children: [
              TextSpan(
                text: 'Đăng nhập',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  decoration: TextDecoration.underline,
                  decorationColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AnimatedSubmitButton extends StatefulWidget {
  const _AnimatedSubmitButton({
    required this.canSubmit,
    required this.isLoading,
    required this.label,
    required this.loadingLabel,
    required this.onPressed,
    required this.style,
  });

  final bool canSubmit;
  final bool isLoading;
  final String label;
  final String loadingLabel;
  final Future<void> Function() onPressed;
  final ButtonStyle style;

  @override
  State<_AnimatedSubmitButton> createState() => _AnimatedSubmitButtonState();
}

class _AnimatedSubmitButtonState extends State<_AnimatedSubmitButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: widget.canSubmit
          ? (_) {
              if (!_isPressed) {
                setState(() => _isPressed = true);
              }
            }
          : null,
      onPointerUp: (_) {
        if (_isPressed) {
          setState(() => _isPressed = false);
        }
      },
      onPointerCancel: (_) {
        if (_isPressed) {
          setState(() => _isPressed = false);
        }
      },
      child: AnimatedScale(
        scale: _isPressed ? 0.98 : 1,
        duration: const Duration(milliseconds: 90),
        curve: Curves.easeOut,
        child: Semantics(
          button: true,
          enabled: widget.canSubmit,
          child: ElevatedButton(
            onPressed: widget.canSubmit
                ? () async {
                    await widget.onPressed();
                  }
                : null,
            style: widget.style,
            child: widget.isLoading
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.2,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(widget.loadingLabel),
                    ],
                  )
                : Text(widget.label),
          ),
        ),
      ),
    );
  }
}

class _TextureLayer extends StatelessWidget {
  const _TextureLayer();

  @override
  Widget build(BuildContext context) {
    return const RepaintBoundary(
      child: CustomPaint(painter: _TexturePainter(), child: SizedBox.expand()),
    );
  }
}

class _TexturePainter extends CustomPainter {
  const _TexturePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0x66FFFFFF);
    const spacing = 22.0;
    const radius = 0.9;
    var row = 0;

    for (double y = 0; y <= size.height + spacing; y += spacing, row++) {
      final offsetX = row.isEven ? 0.0 : spacing * 0.5;
      for (double x = -spacing; x <= size.width + spacing; x += spacing) {
        canvas.drawCircle(Offset(x + offsetX, y), radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _GlowOrb extends StatelessWidget {
  const _GlowOrb({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.6),
            blurRadius: 60,
            spreadRadius: 12,
          ),
        ],
      ),
    );
  }
}
