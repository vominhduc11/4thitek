import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'auth_service.dart';
import 'breakpoints.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key, this.initialEmail});

  final String? initialEmail;

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  static const String _resendCooldownUntilKey =
      'forgot_password_resend_cooldown_until';
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _emailFocusNode = FocusNode();
  final _isFormValidNotifier = ValueNotifier<bool>(false);
  final AuthService _authService = RemoteAuthService();

  bool _isSubmitting = false;
  bool _isSubmitted = false;
  bool _emailValidationEnabled = false;
  String _submittedEmail = '';
  int _resendCooldownSeconds = 0;
  Timer? _resendCooldownTimer;

  @override
  void initState() {
    super.initState();
    final initialEmail = widget.initialEmail?.trim() ?? '';
    if (initialEmail.isNotEmpty) {
      _emailController.text = initialEmail;
      _emailController.selection = TextSelection.collapsed(
        offset: initialEmail.length,
      );
    }
    _emailController.addListener(_onFormInputChanged);
    _emailFocusNode.addListener(_onEmailFocusChanged);
    _isFormValidNotifier.value = _isFormInputValid();
    unawaited(_restoreResendCooldown());
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      _emailFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _emailController.removeListener(_onFormInputChanged);
    _emailFocusNode.removeListener(_onEmailFocusChanged);
    _resendCooldownTimer?.cancel();
    _emailController.dispose();
    _emailFocusNode.dispose();
    _isFormValidNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final mediaSize = MediaQuery.sizeOf(context);
    final screenWidth = mediaSize.width;
    final screenHeight = mediaSize.height;
    final isTablet = mediaSize.shortestSide >= AppBreakpoints.phone;
    final isCompact = screenWidth <= 420;
    final isShortHeight = screenHeight <= 700;
    final cardMaxWidth = isTablet ? 480.0 : 420.0;
    final topOrbSize = isTablet ? 250.0 : (isCompact ? 170.0 : 220.0);
    final bottomOrbSize = isTablet ? 220.0 : (isCompact ? 150.0 : 200.0);
    final horizontalPadding = isCompact ? 16.0 : (isTablet ? 28.0 : 20.0);
    final verticalPadding = isShortHeight ? 16.0 : (isTablet ? 32.0 : 28.0);
    final headerToCardGap = isShortHeight ? 18.0 : 24.0;
    final backToHeaderGap = isShortHeight ? 8.0 : 12.0;
    final cardHorizontalPadding = isCompact ? 16.0 : (isTablet ? 24.0 : 20.0);
    final cardTopPadding = isCompact ? 18.0 : (isTablet ? 24.0 : 20.0);
    final cardBottomPadding = isCompact ? 14.0 : 16.0;
    final topOrbRight = isTablet ? -96.0 : (isCompact ? -56.0 : -80.0);
    final topOrbTop = isTablet ? -60.0 : (isCompact ? -26.0 : -40.0);
    final bottomOrbLeft = isTablet ? -88.0 : (isCompact ? -44.0 : -60.0);
    final bottomOrbBottom = isTablet ? -52.0 : (isCompact ? -18.0 : -30.0);

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
            right: topOrbRight,
            top: topOrbTop,
            child: _GlowOrb(size: topOrbSize, color: const Color(0x66FFFFFF)),
          ),
          Positioned(
            left: bottomOrbLeft,
            bottom: bottomOrbBottom,
            child: _GlowOrb(
              size: bottomOrbSize,
              color: const Color(0x33FFFFFF),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
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
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Semantics(
                            button: true,
                            label: 'Quay lại đăng nhập',
                            child: IconButton(
                              onPressed: _isSubmitting
                                  ? null
                                  : () => Navigator.of(context).pop(),
                              tooltip: 'Quay lại đăng nhập',
                              style: IconButton.styleFrom(
                                minimumSize: const Size(44, 44),
                                foregroundColor: Colors.white,
                                backgroundColor: Colors.white.withValues(
                                  alpha: 0.14,
                                ),
                              ),
                              icon: const Icon(Icons.arrow_back_rounded),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: backToHeaderGap),
                      FadeSlideIn(
                        child: _ForgotHeader(
                          theme: theme,
                          isCompact: isCompact,
                          isTablet: isTablet,
                        ),
                      ),
                      SizedBox(height: headerToCardGap),
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
    final colorScheme = theme.colorScheme;
    final primaryActionColor = colorScheme.primary;
    final labelColor = colorScheme.onSurface.withValues(alpha: 0.84);
    final inputTextStyle = theme.textTheme.bodyLarge?.copyWith(
      fontSize: 16,
      fontWeight: FontWeight.w500,
    );

    return AutofillGroup(
      child: Form(
        key: _formKey,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: Column(
          key: const ValueKey('forgot-form'),
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Đặt lại mật khẩu',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Nhập email đăng ký để nhận liên kết đặt lại mật khẩu.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            AnimatedBuilder(
              animation: _emailFocusNode,
              builder: (context, _) {
                return AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 130),
                  curve: Curves.easeOut,
                  style: (theme.textTheme.labelLarge ?? const TextStyle())
                      .copyWith(
                        fontWeight: FontWeight.w600,
                        color: _emailFocusNode.hasFocus
                            ? primaryActionColor
                            : labelColor,
                      ),
                  child: const Text('Email'),
                );
              },
            ),
            const SizedBox(height: 8),
            Semantics(
              textField: true,
              label: 'Email đặt lại mật khẩu',
              child: TextFormField(
                controller: _emailController,
                focusNode: _emailFocusNode,
                enabled: !_isSubmitting,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.done,
                textCapitalization: TextCapitalization.none,
                autofillHints: const [
                  AutofillHints.email,
                  AutofillHints.username,
                ],
                autocorrect: false,
                enableSuggestions: false,
                style: inputTextStyle,
                onFieldSubmitted: (_) async {
                  if (!_isSubmitting) {
                    await _handleSubmit();
                  }
                },
                decoration: _buildInputDecoration(
                  theme: theme,
                  icon: Icons.mail_outline,
                ),
                validator: (value) {
                  final email = (value ?? '').trim();
                  if (email.isEmpty) {
                    return 'Email không được để trống';
                  }
                  final shouldShowFormatError =
                      _emailValidationEnabled || !_emailFocusNode.hasFocus;
                  if (!_isValidEmail(email) && shouldShowFormatError) {
                    return 'Email không hợp lệ';
                  }
                  return null;
                },
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ValueListenableBuilder<bool>(
                valueListenable: _isFormValidNotifier,
                builder: (context, isFormValid, _) {
                  final canSubmit = isFormValid && !_isSubmitting;
                  return Semantics(
                    button: true,
                    label: 'Gửi liên kết đặt lại mật khẩu',
                    child: _AnimatedSubmitButton(
                      canSubmit: canSubmit,
                      isLoading: _isSubmitting,
                      label: 'Gửi liên kết đặt lại',
                      loadingLabel: 'Đang gửi liên kết...',
                      onPressed: _handleSubmit,
                      style: _buildPrimaryButtonStyle(theme),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Semantics(
                button: true,
                label: 'Quay lại đăng nhập',
                child: TextButton(
                  onPressed: _isSubmitting
                      ? null
                      : () => Navigator.of(context).pop(),
                  style: TextButton.styleFrom(
                    minimumSize: const Size(44, 44),
                    foregroundColor: primaryActionColor,
                    textStyle: const TextStyle(
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                  child: const Text('Quay lại đăng nhập'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessContent(ThemeData theme) {
    final colorScheme = theme.colorScheme;
    final canResend = !_isSubmitting && _resendCooldownSeconds == 0;
    final resendButtonLabel = _resendCooldownSeconds > 0
        ? 'Gửi lại sau ${_resendCooldownSeconds}s'
        : 'Gửi lại liên kết';

    return Column(
      key: const ValueKey('forgot-success'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Align(
          alignment: Alignment.center,
          child: Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: colorScheme.primary.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.mark_email_read_outlined,
              size: 34,
              color: colorScheme.primary,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Kiểm tra email',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
        if (_submittedEmail.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            'Đã gửi đến: $_submittedEmail',
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
        const SizedBox(height: 6),
        Text(
          'Vui lòng kiểm tra cả thư rác (Spam).',
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          'Liên kết có hiệu lực trong 30 phút.',
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: Semantics(
            button: true,
            label: 'Gửi lại liên kết đặt lại mật khẩu',
            child: ElevatedButton(
              onPressed: canResend ? _handleSubmit : null,
              style: _buildPrimaryButtonStyle(theme),
              child: _isSubmitting
                  ? const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.2,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(width: 10),
                        Text('Đang gửi liên kết...'),
                      ],
                    )
                  : Text(resendButtonLabel),
            ),
          ),
        ),
        if (_resendCooldownSeconds > 0) ...[
          const SizedBox(height: 8),
          Text(
            'Vui lòng đợi để tránh gửi quá nhiều yêu cầu trong thời gian ngắn.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: Semantics(
            button: true,
            label: 'Dùng email khác',
            child: OutlinedButton(
              onPressed: _isSubmitting ? null : _handleUseDifferentEmail,
              style: _buildOutlineButtonStyle(theme),
              child: const Text('Dùng email khác'),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: Semantics(
            button: true,
            label: 'Quay lại đăng nhập',
            child: TextButton(
              onPressed: _isSubmitting
                  ? null
                  : () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(
                minimumSize: const Size(44, 44),
                foregroundColor: colorScheme.primary,
                textStyle: const TextStyle(
                  fontWeight: FontWeight.w700,
                  decoration: TextDecoration.underline,
                ),
              ),
              child: const Text('Quay lại đăng nhập'),
            ),
          ),
        ),
      ],
    );
  }

  ButtonStyle _buildPrimaryButtonStyle(ThemeData theme) {
    final colorScheme = theme.colorScheme;
    final primaryActionColor = colorScheme.primary;
    final disabledBg = Color.lerp(
      colorScheme.onSurface.withValues(alpha: 0.08),
      colorScheme.surface,
      0.35,
    )!;
    final disabledFg = colorScheme.onSurface.withValues(alpha: 0.45);

    return ButtonStyle(
      minimumSize: const WidgetStatePropertyAll(Size(0, 48)),
      backgroundColor: WidgetStateProperty.resolveWith<Color>((states) {
        if (_isSubmitting) {
          return primaryActionColor;
        }
        if (states.contains(WidgetState.disabled)) {
          return disabledBg;
        }
        return primaryActionColor;
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

  ButtonStyle _buildOutlineButtonStyle(ThemeData theme) {
    final colorScheme = theme.colorScheme;
    return OutlinedButton.styleFrom(
      minimumSize: const Size(0, 48),
      foregroundColor: colorScheme.primary,
      side: BorderSide(color: colorScheme.primary, width: 1.2),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
    );
  }

  InputDecoration _buildInputDecoration({
    required ThemeData theme,
    required IconData icon,
  }) {
    final colorScheme = theme.colorScheme;
    final borderColor = colorScheme.outlineVariant;
    final primaryActionColor = colorScheme.primary;
    final errorColor = colorScheme.error;

    final baseBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: borderColor),
    );

    return InputDecoration(
      prefixIcon: Icon(icon),
      isDense: true,
      constraints: const BoxConstraints(minHeight: 44),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      errorStyle: TextStyle(
        color: errorColor,
        fontSize: 13,
        fontWeight: FontWeight.w500,
        height: 1.2,
      ),
      border: baseBorder,
      enabledBorder: baseBorder,
      focusedBorder: baseBorder.copyWith(
        borderSide: BorderSide(color: primaryActionColor, width: 1.6),
      ),
      errorBorder: baseBorder.copyWith(
        borderSide: BorderSide(color: errorColor, width: 1.3),
      ),
      focusedErrorBorder: baseBorder.copyWith(
        borderSide: BorderSide(color: errorColor, width: 1.6),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (_isSubmitting) {
      return;
    }
    if (_resendCooldownSeconds > 0) {
      _showErrorSnackbar(
        'Bạn vừa yêu cầu gửi lại. Vui lòng thử lại sau $_resendCooldownSeconds giây.',
      );
      return;
    }

    final isResend = _isSubmitted;
    final targetEmail = _emailController.text.trim();

    if (!_isSubmitted) {
      FocusScope.of(context).unfocus();
    }
    if (!_emailValidationEnabled) {
      setState(() {
        _emailValidationEnabled = true;
      });
    }
    final isValid = _isSubmitted
        ? _isFormInputValid()
        : (_formKey.currentState?.validate() ?? false);
    if (!isValid) {
      _emailFocusNode.requestFocus();
      return;
    }

    setState(() {
      _isSubmitting = true;
      if (!isResend) {
        _submittedEmail = targetEmail;
      }
    });
    try {
      final result = await _authService.requestPasswordReset(email: targetEmail);
      if (!result.isSuccess) {
        _showErrorSnackbar(
          result.failure?.message ??
              'Không thể gửi liên kết lúc này. Vui lòng thử lại.',
        );
        return;
      }
      if (!mounted) {
        return;
      }
      setState(() {
        _isSubmitted = true;
        _submittedEmail = targetEmail;
      });
      _startResendCooldown();
      if (isResend) {
        _showSuccessSnackbar(
          result.message ?? 'Đã gửi lại liên kết đặt lại đến $_submittedEmail.',
        );
      }
    } on TimeoutException {
      _showErrorSnackbar('Yêu cầu đang quá tải, vui lòng thử lại.');
    } on Exception {
      _showErrorSnackbar(
        'Không thể gửi liên kết lúc này. Vui lòng kiểm tra kết nối và thử lại.',
      );
    } catch (_) {
      _showErrorSnackbar('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
      _isFormValidNotifier.value = _isFormInputValid();
    }
  }

  void _startResendCooldown({int seconds = 60}) {
    _resendCooldownTimer?.cancel();
    if (!mounted) {
      return;
    }
    final cooldownUntil = DateTime.now().add(Duration(seconds: seconds));
    unawaited(_saveCooldownUntil(cooldownUntil));
    setState(() => _resendCooldownSeconds = seconds);
    _resendCooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendCooldownSeconds <= 1) {
        timer.cancel();
        unawaited(_clearPersistedCooldown());
        setState(() => _resendCooldownSeconds = 0);
        return;
      }
      setState(() => _resendCooldownSeconds -= 1);
    });
  }

  void _showSuccessSnackbar(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
      );
  }

  void _showErrorSnackbar(String message) {
    if (!mounted) {
      return;
    }
    final colorScheme = Theme.of(context).colorScheme;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            message,
            style: TextStyle(color: colorScheme.onErrorContainer),
          ),
          behavior: SnackBarBehavior.floating,
          backgroundColor: colorScheme.errorContainer,
        ),
      );
  }

  void _handleUseDifferentEmail() {
    if (_isSubmitting) {
      return;
    }

    _resendCooldownTimer?.cancel();
    unawaited(_clearPersistedCooldown());
    setState(() {
      _isSubmitted = false;
      _emailValidationEnabled = false;
      _submittedEmail = '';
      _resendCooldownSeconds = 0;
      _emailController.clear();
    });
    _onFormInputChanged();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _emailFocusNode.requestFocus();
      }
    });
  }

  void _onFormInputChanged() {
    _isFormValidNotifier.value = _isFormInputValid();
  }

  void _onEmailFocusChanged() {
    if (_emailFocusNode.hasFocus) {
      return;
    }
    if (!_emailValidationEnabled) {
      setState(() {
        _emailValidationEnabled = true;
      });
    }
    _formKey.currentState?.validate();
  }

  bool _isFormInputValid() {
    final email = _emailController.text.trim();
    return email.isNotEmpty && _isValidEmail(email);
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  Future<void> _restoreResendCooldown() async {
    final prefs = await SharedPreferences.getInstance();
    final rawExpiry = prefs.getInt(_resendCooldownUntilKey);
    if (rawExpiry == null) {
      return;
    }

    final remainingSeconds = DateTime.fromMillisecondsSinceEpoch(
      rawExpiry,
    ).difference(DateTime.now()).inSeconds;
    if (remainingSeconds <= 0) {
      await prefs.remove(_resendCooldownUntilKey);
      return;
    }
    if (!mounted) {
      return;
    }
    _startResendCooldown(seconds: remainingSeconds);
  }

  Future<void> _saveCooldownUntil(DateTime value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_resendCooldownUntilKey, value.millisecondsSinceEpoch);
  }

  Future<void> _clearPersistedCooldown() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_resendCooldownUntilKey);
  }
}

class _ForgotHeader extends StatelessWidget {
  const _ForgotHeader({
    required this.theme,
    required this.isCompact,
    required this.isTablet,
  });

  final ThemeData theme;
  final bool isCompact;
  final bool isTablet;

  @override
  Widget build(BuildContext context) {
    final logoHeight = isTablet ? 52.0 : 40.0;
    final subtitle = isCompact
        ? 'Nhập email để nhận liên kết đặt lại mật khẩu.'
        : 'Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu qua email.';
    final subtitleTopGap = isCompact ? 12.0 : 16.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        BrandLogoWordmark(height: logoHeight),
        SizedBox(height: subtitleTopGap),
        Text(
          subtitle,
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
