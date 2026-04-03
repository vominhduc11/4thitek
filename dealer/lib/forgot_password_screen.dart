import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app_settings_controller.dart';
import 'auth_service.dart';
import 'breakpoints.dart';
import 'validation_utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key, this.initialEmail, this.authService});

  final String? initialEmail;
  final AuthService? authService;

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
  late final AuthService _authService;

  bool _isSubmitting = false;
  bool _isSubmitted = false;
  bool _emailValidationEnabled = false;
  String _submittedEmail = '';
  int _resendCooldownSeconds = 0;
  Timer? _resendCooldownTimer;

  _ForgotPasswordTexts get _texts => _ForgotPasswordTexts(
    isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
  );

  @override
  void initState() {
    super.initState();
    _authService = widget.authService ?? RemoteAuthService();
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
    final texts = _texts;
    final theme = Theme.of(context);
    final mediaSize = MediaQuery.sizeOf(context);
    final screenWidth = mediaSize.width;
    final screenHeight = mediaSize.height;
    final isTablet = mediaSize.shortestSide >= AppBreakpoints.phone;
    final isWideLayout = screenWidth >= 980;
    final isCompact = screenWidth <= 420;
    final isShortHeight = screenHeight <= 700;
    final cardMaxWidth = isTablet ? 480.0 : 420.0;
    final contentMaxWidth = isWideLayout ? 1040.0 : cardMaxWidth;
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
    final Widget headerSection = RepaintBoundary(
      child: FadeSlideIn(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: _ForgotHeader(
            theme: theme,
            isCompact: isCompact,
            isTablet: isTablet,
            texts: texts,
          ),
        ),
      ),
    );
    final Widget cardSection = RepaintBoundary(
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 80),
        child: Container(
          padding: EdgeInsets.fromLTRB(
            cardHorizontalPadding,
            cardTopPadding,
            cardHorizontalPadding,
            cardBottomPadding,
          ),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.48),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 28,
                offset: const Offset(0, 14),
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
    );

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
                  Color(0xFF07111A),
                  Color(0xFF0D2232),
                  Color(0xFF13456A),
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
            child: _GlowOrb(size: topOrbSize, color: const Color(0x2429ABE2)),
          ),
          Positioned(
            left: bottomOrbLeft,
            bottom: bottomOrbBottom,
            child: _GlowOrb(
              size: bottomOrbSize,
              color: const Color(0x1A0071BC),
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
                  constraints: BoxConstraints(maxWidth: contentMaxWidth),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      FadeSlideIn(
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Semantics(
                            button: true,
                            label: texts.backToLoginAction,
                            child: IconButton(
                              onPressed: _isSubmitting
                                  ? null
                                  : () => Navigator.of(context).pop(),
                              tooltip: texts.backToLoginAction,
                              style: IconButton.styleFrom(
                                minimumSize: const Size(48, 48),
                                foregroundColor: const Color(0xFFECEDEE),
                                backgroundColor: const Color(0x1A29ABE2),
                              ),
                              icon: const Icon(Icons.arrow_back_rounded),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(height: backToHeaderGap),
                      if (isWideLayout)
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(top: 28),
                                child: Align(
                                  alignment: Alignment.topLeft,
                                  child: headerSection,
                                ),
                              ),
                            ),
                            SizedBox(width: headerToCardGap),
                            SizedBox(width: cardMaxWidth, child: cardSection),
                          ],
                        )
                      else ...[
                        headerSection,
                        SizedBox(height: headerToCardGap),
                        cardSection,
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

  Widget _buildFormContent(ThemeData theme) {
    final texts = _texts;
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
              texts.screenTitle,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              texts.formDescription,
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
                  child: Text(texts.emailLabel),
                );
              },
            ),
            const SizedBox(height: 8),
            Semantics(
              textField: true,
              label: texts.emailFieldSemantic,
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
                    return texts.emptyEmailMessage;
                  }
                  final shouldShowFormatError =
                      _emailValidationEnabled || !_emailFocusNode.hasFocus;
                  if (!_isValidEmail(email) && shouldShowFormatError) {
                    return texts.invalidEmailMessage;
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
                    label: texts.submitSemantic,
                    child: _AnimatedSubmitButton(
                      canSubmit: canSubmit,
                      isLoading: _isSubmitting,
                      label: texts.submitAction,
                      loadingLabel: texts.submittingLabel,
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
                label: texts.backToLoginAction,
                child: TextButton(
                  onPressed: _isSubmitting
                      ? null
                      : () => Navigator.of(context).pop(),
                  style: TextButton.styleFrom(
                    minimumSize: const Size(48, 48),
                    foregroundColor: primaryActionColor,
                    textStyle: const TextStyle(
                      fontWeight: FontWeight.w700,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                  child: Text(texts.backToLoginAction),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccessContent(ThemeData theme) {
    final texts = _texts;
    final colorScheme = theme.colorScheme;
    final canResend = !_isSubmitting && _resendCooldownSeconds == 0;
    final resendButtonLabel = _resendCooldownSeconds > 0
        ? texts.resendCooldownLabel(_resendCooldownSeconds)
        : texts.resendLinkAction;

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
          texts.checkEmailTitle,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          texts.checkEmailDescription,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
        if (_submittedEmail.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            texts.sentToLabel(_submittedEmail),
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
        const SizedBox(height: 6),
        Text(
          texts.spamHint,
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          texts.linkValidityHint,
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
            label: texts.submitSemantic,
            child: ElevatedButton(
              onPressed: canResend ? _handleSubmit : null,
              style: _buildPrimaryButtonStyle(theme),
              child: _isSubmitting
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
                        Text(texts.submittingLabel),
                      ],
                    )
                  : Text(resendButtonLabel),
            ),
          ),
        ),
        if (_resendCooldownSeconds > 0) ...[
          const SizedBox(height: 8),
          Text(
            texts.cooldownHint,
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
            label: texts.useDifferentEmailAction,
            child: OutlinedButton(
              onPressed: _isSubmitting ? null : _handleUseDifferentEmail,
              style: _buildOutlineButtonStyle(theme),
              child: Text(texts.useDifferentEmailAction),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: Semantics(
            button: true,
            label: texts.backToLoginAction,
            child: TextButton(
              onPressed: _isSubmitting
                  ? null
                  : () => Navigator.of(context).pop(),
              style: TextButton.styleFrom(
                minimumSize: const Size(48, 48),
                foregroundColor: colorScheme.primary,
                textStyle: const TextStyle(
                  fontWeight: FontWeight.w700,
                  decoration: TextDecoration.underline,
                ),
              ),
              child: Text(texts.backToLoginAction),
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
      constraints: const BoxConstraints(minHeight: 48),
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
    final texts = _texts;
    if (_isSubmitting) {
      return;
    }
    if (_resendCooldownSeconds > 0) {
      _showErrorSnackbar(
        texts.recentlyRequestedMessage(_resendCooldownSeconds),
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
      final result = await _authService.requestPasswordReset(
        email: targetEmail,
      );
      if (!result.isSuccess) {
        final message = result.failure?.message;
        _showErrorSnackbar(
          message == null
              ? texts.cannotSendLinkMessage
              : resolveAuthServiceMessage(message, isEnglish: texts.isEnglish),
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
        final message = result.message;
        _showSuccessSnackbar(
          message == null
              ? texts.resentLinkMessage(_submittedEmail)
              : resolveAuthServiceMessage(message, isEnglish: texts.isEnglish),
        );
      }
    } on TimeoutException {
      _showErrorSnackbar(texts.timeoutMessage);
    } on Exception {
      _showErrorSnackbar(texts.networkRetryMessage);
    } catch (_) {
      _showErrorSnackbar(texts.unexpectedErrorMessage);
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
    return isValidEmailAddress(email);
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

class _ForgotPasswordTexts {
  const _ForgotPasswordTexts({required this.isEnglish});

  final bool isEnglish;

  String get backToLoginAction =>
      isEnglish ? 'Back to login' : 'Quay lại đăng nhập';
  String get screenTitle => isEnglish ? 'Reset password' : 'Đặt lại mật khẩu';
  String get formDescription => isEnglish
      ? 'Enter your registered email to receive a password reset link.'
      : 'Nhập email đăng ký để nhận liên kết đặt lại mật khẩu.';
  String get emailLabel => 'Email';
  String get emailFieldSemantic =>
      isEnglish ? 'Password reset email' : 'Email đặt lại mật khẩu';
  String get emptyEmailMessage =>
      isEnglish ? 'Email cannot be empty.' : 'Email không được để trống';
  String get invalidEmailMessage =>
      isEnglish ? 'Invalid email address.' : 'Email không hợp lệ';
  String get submitSemantic =>
      isEnglish ? 'Send password reset link' : 'Gửi liên kết đặt lại mật khẩu';
  String get submitAction =>
      isEnglish ? 'Send reset link' : 'Gửi liên kết đặt lại';
  String get submittingLabel =>
      isEnglish ? 'Sending link...' : 'Đang gửi liên kết...';
  String resendCooldownLabel(int seconds) =>
      isEnglish ? 'Resend in ${seconds}s' : 'Gửi lại sau ${seconds}s';
  String get resendLinkAction => isEnglish ? 'Resend link' : 'Gửi lại liên kết';
  String get checkEmailTitle =>
      isEnglish ? 'Check your email' : 'Kiểm tra email';
  String get checkEmailDescription => isEnglish
      ? 'If the email exists in the system, we have sent a reset link.'
      : 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại.';
  String sentToLabel(String email) =>
      isEnglish ? 'Sent to: $email' : 'Đã gửi đến: $email';
  String get spamHint => isEnglish
      ? 'Please also check your Spam folder.'
      : 'Vui lòng kiểm tra cả thư rác (Spam).';
  String get linkValidityHint => isEnglish
      ? 'The link is valid for 30 minutes.'
      : 'Liên kết có hiệu lực trong 30 phút.';
  String get cooldownHint => isEnglish
      ? 'Please wait to avoid sending too many requests in a short time.'
      : 'Vui lòng đợi để tránh gửi quá nhiều yêu cầu trong thời gian ngắn.';
  String get useDifferentEmailAction =>
      isEnglish ? 'Use a different email' : 'Dùng email khác';
  String recentlyRequestedMessage(int seconds) => isEnglish
      ? 'You already requested a resend. Please try again in $seconds seconds.'
      : 'Bạn vừa yêu cầu gửi lại. Vui lòng thử lại sau $seconds giây.';
  String get cannotSendLinkMessage => isEnglish
      ? 'Unable to send the link right now. Please try again.'
      : 'Không thể gửi liên kết lúc này. Vui lòng thử lại.';
  String resentLinkMessage(String email) => isEnglish
      ? 'A new reset link has been sent to $email.'
      : 'Đã gửi lại liên kết đặt lại đến $email.';
  String get timeoutMessage => isEnglish
      ? 'The request timed out. Please try again.'
      : 'Yêu cầu đang quá tải, vui lòng thử lại.';
  String get networkRetryMessage => isEnglish
      ? 'Unable to send the link right now. Please check your connection and try again.'
      : 'Không thể gửi liên kết lúc này. Vui lòng kiểm tra kết nối và thử lại.';
  String get unexpectedErrorMessage => isEnglish
      ? 'Something went wrong. Please try again.'
      : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  String get headerCompactSubtitle => isEnglish
      ? 'Enter your email to receive a password reset link.'
      : 'Nhập email để nhận liên kết đặt lại mật khẩu.';
  String get headerSubtitle => isEnglish
      ? 'We will send password reset instructions to your email.'
      : 'Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu qua email.';
}

class _ForgotHeader extends StatelessWidget {
  const _ForgotHeader({
    required this.theme,
    required this.isCompact,
    required this.isTablet,
    required this.texts,
  });

  final ThemeData theme;
  final bool isCompact;
  final bool isTablet;
  final _ForgotPasswordTexts texts;

  @override
  Widget build(BuildContext context) {
    final logoHeight = isTablet ? 52.0 : 40.0;
    final subtitle = isCompact
        ? texts.headerCompactSubtitle
        : texts.headerSubtitle;
    final subtitleTopGap = isCompact ? 12.0 : 16.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        BrandLogoWordmark(height: logoHeight),
        SizedBox(height: subtitleTopGap),
        Text(
          subtitle,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: const Color(0xFFE9F0F4),
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
    final paint = Paint()..color = const Color(0x4029ABE2);
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
