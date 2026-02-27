import 'package:flutter/material.dart';

import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  static const _primaryBlue = Color(0xFF0A67FF);
  static const _errorPink = Color(0xFFE11D48);
  static const _disabledBg = Color(0xFFE5E7EB);
  static const _disabledFg = Color(0xFF9CA3AF);

  final _formKey = GlobalKey<FormState>();
  final _agencyController = TextEditingController();
  final _taxCodeController = TextEditingController();
  final _contactController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _isFormValidNotifier = ValueNotifier<bool>(false);
  final _termsErrorNotifier = ValueNotifier<String?>(null);

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _agreedToTerms = false;
  bool _isSubmitting = false;
  bool _isSubmitted = false;
  String _submittedEmail = '';

  @override
  void initState() {
    super.initState();
    _agencyController.addListener(_onFormInputChanged);
    _contactController.addListener(_onFormInputChanged);
    _phoneController.addListener(_onFormInputChanged);
    _emailController.addListener(_onFormInputChanged);
    _addressController.addListener(_onFormInputChanged);
    _cityController.addListener(_onFormInputChanged);
    _passwordController.addListener(_onFormInputChanged);
    _confirmController.addListener(_onFormInputChanged);
  }

  @override
  void dispose() {
    _agencyController.removeListener(_onFormInputChanged);
    _contactController.removeListener(_onFormInputChanged);
    _phoneController.removeListener(_onFormInputChanged);
    _emailController.removeListener(_onFormInputChanged);
    _addressController.removeListener(_onFormInputChanged);
    _cityController.removeListener(_onFormInputChanged);
    _passwordController.removeListener(_onFormInputChanged);
    _confirmController.removeListener(_onFormInputChanged);

    _agencyController.dispose();
    _taxCodeController.dispose();
    _contactController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    _isFormValidNotifier.dispose();
    _termsErrorNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

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
          const Positioned(
            right: -80,
            top: -40,
            child: _GlowOrb(size: 220, color: Color(0x66FFFFFF)),
          ),
          const Positioned(
            left: -60,
            bottom: -30,
            child: _GlowOrb(size: 200, color: Color(0x33FFFFFF)),
          ),
          SafeArea(
            child: SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      FadeSlideIn(child: _RegisterHeader(theme: theme)),
                      const SizedBox(height: 24),
                      FadeSlideIn(
                        delay: const Duration(milliseconds: 80),
                        child: Container(
                          padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
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
                                : _buildFormContent(theme),
                          ),
                        ),
                      ),
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

  Widget _buildFormContent(ThemeData theme) {
    final inputTextStyle = theme.textTheme.bodyLarge?.copyWith(
      fontSize: 16,
      fontWeight: FontWeight.w500,
    );

    return Form(
      key: _formKey,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: Column(
        key: const ValueKey('register-form'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
              color: Colors.black54,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 24),
          _buildSectionTitle(theme, 'Thông tin đại lý'),
          const SizedBox(height: 16),
          _buildFieldLabel(theme, 'Tên đại lý'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _agencyController,
            enabled: !_isSubmitting,
            textInputAction: TextInputAction.next,
            style: inputTextStyle,
            decoration: _buildInputDecoration(icon: Icons.storefront_outlined),
            validator: (value) {
              if ((value ?? '').trim().isEmpty) {
                return 'Tên đại lý không được để trống';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildFieldLabel(theme, 'Mã số thuế (nếu có)'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _taxCodeController,
            enabled: !_isSubmitting,
            textInputAction: TextInputAction.next,
            keyboardType: TextInputType.number,
            style: inputTextStyle,
            decoration: _buildInputDecoration(icon: Icons.badge_outlined),
          ),
          const SizedBox(height: 24),
          _buildSectionTitle(theme, 'Thông tin liên hệ'),
          const SizedBox(height: 16),
          _buildFieldLabel(theme, 'Họ và tên người liên hệ'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _contactController,
            enabled: !_isSubmitting,
            textInputAction: TextInputAction.next,
            style: inputTextStyle,
            decoration: _buildInputDecoration(icon: Icons.person_outline),
            validator: (value) {
              if ((value ?? '').trim().isEmpty) {
                return 'Tên người liên hệ không được để trống';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildFieldLabel(theme, 'Số điện thoại'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _phoneController,
            enabled: !_isSubmitting,
            textInputAction: TextInputAction.next,
            keyboardType: TextInputType.phone,
            style: inputTextStyle,
            decoration: _buildInputDecoration(icon: Icons.phone_outlined),
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
          const SizedBox(height: 16),
          _buildFieldLabel(theme, 'Email'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _emailController,
            enabled: !_isSubmitting,
            textInputAction: TextInputAction.next,
            keyboardType: TextInputType.emailAddress,
            textCapitalization: TextCapitalization.none,
            autofillHints: const [AutofillHints.email, AutofillHints.username],
            autocorrect: false,
            enableSuggestions: false,
            style: inputTextStyle,
            decoration: _buildInputDecoration(icon: Icons.mail_outline),
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
          const SizedBox(height: 24),
          _buildSectionTitle(theme, 'Địa chỉ'),
          const SizedBox(height: 16),
          _buildFieldLabel(theme, 'Địa chỉ'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _addressController,
            enabled: !_isSubmitting,
            textInputAction: TextInputAction.next,
            style: inputTextStyle,
            decoration: _buildInputDecoration(icon: Icons.location_on_outlined),
            validator: (value) {
              if ((value ?? '').trim().isEmpty) {
                return 'Địa chỉ không được để trống';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildFieldLabel(theme, 'Tỉnh/Thành phố'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _cityController,
            enabled: !_isSubmitting,
            textInputAction: TextInputAction.next,
            style: inputTextStyle,
            decoration: _buildInputDecoration(icon: Icons.map_outlined),
            validator: (value) {
              if ((value ?? '').trim().isEmpty) {
                return 'Tỉnh/Thành phố không được để trống';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),
          _buildSectionTitle(theme, 'Tài khoản'),
          const SizedBox(height: 16),
          _buildFieldLabel(theme, 'Mật khẩu'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _passwordController,
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
                        setState(() => _obscurePassword = !_obscurePassword);
                      },
                tooltip: _obscurePassword ? 'Hiện mật khẩu' : 'Ẩn mật khẩu',
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
          const SizedBox(height: 16),
          _buildFieldLabel(theme, 'Xác nhận mật khẩu'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _confirmController,
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
                        setState(() => _obscureConfirm = !_obscureConfirm);
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
          const SizedBox(height: 16),
          ConstrainedBox(
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
                    color: _errorPink,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),
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
                  style: ButtonStyle(
                    minimumSize: const WidgetStatePropertyAll(Size(0, 48)),
                    backgroundColor: WidgetStateProperty.resolveWith<Color>((
                      states,
                    ) {
                      if (_isSubmitting) {
                        return _primaryBlue;
                      }
                      if (states.contains(WidgetState.disabled)) {
                        return _disabledBg;
                      }
                      return _primaryBlue;
                    }),
                    foregroundColor: WidgetStateProperty.resolveWith<Color>((
                      states,
                    ) {
                      if (_isSubmitting) {
                        return Colors.white;
                      }
                      if (states.contains(WidgetState.disabled)) {
                        return _disabledFg;
                      }
                      return Colors.white;
                    }),
                    elevation: const WidgetStatePropertyAll(0),
                    shape: WidgetStatePropertyAll(
                      RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    textStyle: const WidgetStatePropertyAll(
                      TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: TextButton(
              onPressed: _isSubmitting
                  ? null
                  : () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(
                minimumSize: const Size(44, 44),
                foregroundColor: _primaryBlue,
                textStyle: const TextStyle(
                  fontWeight: FontWeight.w700,
                  decoration: TextDecoration.underline,
                ),
              ),
              child: const Text('Đã có tài khoản? Đăng nhập'),
            ),
          ),
        ],
      ),
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
          '4thitek sẽ xác minh thông tin và liên hệ lại trong thời gian sớm nhất.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.black54,
            height: 1.5,
          ),
        ),
        if (_submittedEmail.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            'Email đăng ký: $_submittedEmail',
            style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54),
          ),
        ],
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _startNewRegistration,
            child: const Text('Gửi đăng ký mới'),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(),
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
        color: const Color(0xFF0F172A),
      ),
    );
  }

  Widget _buildFieldLabel(ThemeData theme, String text) {
    return Text(
      text,
      style: theme.textTheme.labelLarge?.copyWith(
        fontWeight: FontWeight.w600,
        color: const Color(0xFF0F172A),
      ),
    );
  }

  InputDecoration _buildInputDecoration({
    required IconData icon,
    Widget? suffixIcon,
  }) {
    final baseBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
    );
    return InputDecoration(
      prefixIcon: Icon(icon),
      suffixIcon: suffixIcon,
      isDense: true,
      constraints: const BoxConstraints(minHeight: 44),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      errorStyle: const TextStyle(
        color: _errorPink,
        fontSize: 13,
        fontWeight: FontWeight.w500,
        height: 1.2,
      ),
      border: baseBorder,
      enabledBorder: baseBorder,
      focusedBorder: baseBorder.copyWith(
        borderSide: const BorderSide(color: _primaryBlue, width: 1.6),
      ),
      errorBorder: baseBorder.copyWith(
        borderSide: const BorderSide(color: _errorPink, width: 1.3),
      ),
      focusedErrorBorder: baseBorder.copyWith(
        borderSide: const BorderSide(color: _errorPink, width: 1.6),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (_isSubmitting) {
      return;
    }

    FocusScope.of(context).unfocus();
    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) {
      return;
    }

    if (!_agreedToTerms) {
      _termsErrorNotifier.value = 'Vui lòng đồng ý với điều khoản đăng ký.';
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

  bool _isFormInputValid() {
    final agency = _agencyController.text.trim();
    final contact = _contactController.text.trim();
    final phone = _phoneController.text.trim();
    final email = _emailController.text.trim();
    final address = _addressController.text.trim();
    final city = _cityController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;
    final hasRequired =
        agency.isNotEmpty &&
        contact.isNotEmpty &&
        phone.isNotEmpty &&
        email.isNotEmpty &&
        address.isNotEmpty &&
        city.isNotEmpty &&
        password.isNotEmpty &&
        confirm.isNotEmpty;
    if (!hasRequired) {
      return false;
    }

    return _isValidPhone(phone) &&
        _isValidEmail(email) &&
        password.length >= 6 &&
        confirm == password &&
        _agreedToTerms;
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  bool _isValidPhone(String phone) {
    return RegExp(r'^[0-9+\s-]{8,}$').hasMatch(phone);
  }
}

class _RegisterHeader extends StatelessWidget {
  const _RegisterHeader({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const BrandLogoWordmark(height: 40),
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
    );
  }
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
