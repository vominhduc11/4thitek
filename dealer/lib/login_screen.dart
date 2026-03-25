import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api_config.dart';
import 'auth_service.dart';
import 'auth_storage.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'forgot_password_screen.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'validation_utils.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

_LoginTexts _loginTexts(BuildContext context) => _LoginTexts(
  isEnglish: Localizations.localeOf(context).languageCode == 'en',
);

class LoginScreen extends StatefulWidget {
  const LoginScreen({
    super.key,
    this.initialErrorMessage,
    this.authService,
  });

  final String? initialErrorMessage;
  final AuthService? authService;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();
  final _scrollController = ScrollController();
  final _emailFieldKey = GlobalKey();
  final _passwordFieldKey = GlobalKey();
  final _submitButtonKey = GlobalKey();
  final _isFormValidNotifier = ValueNotifier<bool>(false);
  final _authErrorNotifier = ValueNotifier<String?>(null);
  final _emailFieldErrorNotifier = ValueNotifier<String?>(null);
  final _passwordFieldErrorNotifier = ValueNotifier<String?>(null);
  final _passwordShakeTickNotifier = ValueNotifier<int>(0);
  late final AuthService _authService;
  late final AuthStorage _authStorage;

  bool _obscurePassword = true;
  bool _rememberMe = false;
  bool _isLoggingIn = false;
  bool _emailFormatValidationEnabled = false;

  @override
  void initState() {
    super.initState();
    _authService = widget.authService ?? RemoteAuthService();
    _authStorage = AuthStorage();
    _emailController.addListener(_onFormInputChanged);
    _passwordController.addListener(_onFormInputChanged);
    _emailFocusNode.addListener(_onEmailFocusChanged);
    _passwordFocusNode.addListener(_onPasswordFocusChanged);
    _authErrorNotifier.addListener(_onAuthErrorChanged);
    final initialErrorMessage = widget.initialErrorMessage?.trim();
    if (initialErrorMessage != null && initialErrorMessage.isNotEmpty) {
      _authErrorNotifier.value = initialErrorMessage;
    }
    _loadRemembered();
  }

  @override
  void dispose() {
    _emailController.removeListener(_onFormInputChanged);
    _passwordController.removeListener(_onFormInputChanged);
    _emailFocusNode.removeListener(_onEmailFocusChanged);
    _passwordFocusNode.removeListener(_onPasswordFocusChanged);
    _authErrorNotifier.removeListener(_onAuthErrorChanged);
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    _scrollController.dispose();
    _isFormValidNotifier.dispose();
    _authErrorNotifier.dispose();
    _emailFieldErrorNotifier.dispose();
    _passwordFieldErrorNotifier.dispose();
    _passwordShakeTickNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final mediaSize = MediaQuery.sizeOf(context);
    final screenWidth = mediaSize.width;
    final screenHeight = mediaSize.height;
    final orientation = MediaQuery.orientationOf(context);
    final keyboardInset = MediaQuery.viewInsetsOf(context).bottom;

    const mobileCardMaxWidth = 420.0;
    const tabletCardMaxWidth = 560.0;
    final isTablet = mediaSize.shortestSide >= AppBreakpoints.phone;
    final isLandscape = orientation == Orientation.landscape;
    final isSmallMobile = screenWidth < 360;
    final isCompactVisual =
        screenWidth <= mobileCardMaxWidth || (isLandscape && !isTablet);
    final isVerticallyTight = (isLandscape && !isTablet) || screenHeight < 680;
    final cardMaxWidth = isTablet ? tabletCardMaxWidth : mobileCardMaxWidth;
    final contentMaxWidth = isTablet ? 1120.0 : cardMaxWidth;

    final topOrbSize = isTablet ? 260.0 : (isCompactVisual ? 170.0 : 220.0);
    final bottomOrbSize = isTablet ? 230.0 : (isCompactVisual ? 150.0 : 200.0);
    final scrollHorizontalPadding = isTablet
        ? 28.0
        : (isSmallMobile ? 14.0 : 20.0);
    final scrollVerticalPadding = isVerticallyTight ? 14.0 : 28.0;
    final brandToCardGap = isVerticallyTight ? 12.0 : 24.0;
    final cardToPromptGap = isVerticallyTight ? 10.0 : 14.0;
    final logoHeight = isTablet ? 52.0 : (isVerticallyTight ? 34.0 : 40.0);
    final showBrandSubtitle = !(isLandscape && !isTablet);
    final showRegisterPrompt = keyboardInset == 0 || isTablet;

    Widget buildFormColumn({required bool includeHeader}) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (includeHeader) ...[
            FadeSlideIn(
              child: _BrandHeader(
                theme: theme,
                logoHeight: logoHeight,
                showSubtitle: showBrandSubtitle,
              ),
            ),
            SizedBox(height: brandToCardGap),
          ],
          FadeSlideIn(
            delay: const Duration(milliseconds: 80),
            child: _LoginCard(
              theme: theme,
              formKey: _formKey,
              emailController: _emailController,
              passwordController: _passwordController,
              emailFocusNode: _emailFocusNode,
              passwordFocusNode: _passwordFocusNode,
              emailFieldKey: _emailFieldKey,
              passwordFieldKey: _passwordFieldKey,
              isLoading: _isLoggingIn,
              isCompactLayout: isVerticallyTight,
              isFormValidListenable: _isFormValidNotifier,
              emailFieldErrorListenable: _emailFieldErrorNotifier,
              passwordFieldErrorListenable: _passwordFieldErrorNotifier,
              passwordShakeTickListenable: _passwordShakeTickNotifier,
              obscurePassword: _obscurePassword,
              onTogglePassword: _handleTogglePasswordVisibility,
              rememberMe: _rememberMe,
              onRememberMeChanged: (value) {
                if (_isLoggingIn) {
                  return;
                }
                setState(() => _rememberMe = value ?? false);
              },
              shouldValidateEmailFormat: _emailFormatValidationEnabled,
              authErrorListenable: _authErrorNotifier,
              submitButtonKey: _submitButtonKey,
              onSubmitFromKeyboard: _handleLogin,
              onLogin: _handleLogin,
              onForgotPassword: () {
                final initialEmail = _emailController.text.trim();
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) =>
                        ForgotPasswordScreen(initialEmail: initialEmail),
                  ),
                );
              },
            ),
          ),
          if (showRegisterPrompt) ...[
            SizedBox(height: cardToPromptGap),
            FadeSlideIn(
              delay: const Duration(milliseconds: 140),
              child: _RegisterPrompt(
                theme: theme,
                isLoading: _isLoggingIn,
                onRegister: () {
                  _openDealerRegistrationPage().catchError(
                    (Object e) => debugPrint('Could not launch URL: $e'),
                  );
                },
              ),
            ),
          ],
        ],
      );
    }

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                stops: [0.0, 0.55, 1.0],
                colors: [
                  Color(0xFF1E40AF),
                  Color(0xFF2563EB),
                  Color(0xFFD6E6FF),
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
            right: isTablet ? -96 : (isCompactVisual ? -56 : -80),
            top: isTablet ? -60 : (isCompactVisual ? -26 : -40),
            child: _GlowOrb(size: topOrbSize, color: const Color(0x66FFFFFF)),
          ),
          Positioned(
            left: isTablet ? -90 : (isCompactVisual ? -44 : -60),
            bottom: isTablet ? -56 : (isCompactVisual ? -18 : -30),
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
                scrollHorizontalPadding,
                scrollVerticalPadding,
                scrollHorizontalPadding,
                scrollVerticalPadding,
              ),
              child: Center(
                child: isTablet
                    ? ConstrainedBox(
                        constraints: BoxConstraints(maxWidth: contentMaxWidth),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Expanded(
                              child: FadeSlideIn(
                                child: _TabletBrandPanel(
                                  theme: theme,
                                  logoHeight: logoHeight,
                                ),
                              ),
                            ),
                            const SizedBox(width: 28),
                            ConstrainedBox(
                              constraints: BoxConstraints(
                                maxWidth: cardMaxWidth,
                              ),
                              child: buildFormColumn(includeHeader: false),
                            ),
                          ],
                        ),
                      )
                    : ConstrainedBox(
                        constraints: BoxConstraints(maxWidth: cardMaxWidth),
                        child: buildFormColumn(includeHeader: true),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLogin() async {
    final texts = _loginTexts(context);
    if (_isLoggingIn) {
      return;
    }

    FocusScope.of(context).unfocus();
    if (!_emailFormatValidationEnabled) {
      setState(() {
        _emailFormatValidationEnabled = true;
      });
    }
    final isFormValid = _formKey.currentState?.validate() ?? false;
    if (!isFormValid) {
      final email = _emailController.text.trim();
      if (email.isEmpty || !_isValidEmail(email)) {
        _emailFocusNode.requestFocus();
      } else {
        _passwordFocusNode.requestFocus();
      }
      return;
    }

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    setState(() {
      _isLoggingIn = true;
    });
    _authErrorNotifier.value = null;
    _clearCredentialFieldErrors();

    try {
      final result = await _authService.signIn(
        email: email,
        password: password,
      );
      if (!mounted) {
        return;
      }

      if (!result.isSuccess) {
        final failureType = result.failure?.type ?? LoginFailureType.unknown;
        switch (failureType) {
          case LoginFailureType.invalidCredentials:
          case LoginFailureType.invalidEmail:
          case LoginFailureType.invalidPassword:
          case LoginFailureType.conflict:
            _handleInvalidCredentialFailure(
              type: LoginFailureType.invalidCredentials,
              message: texts.invalidCredentialsMessage,
            );
            break;
          case LoginFailureType.network:
            _clearCredentialFieldErrors();
            _authErrorNotifier.value = result.failure?.message == null
                ? texts.cannotConnectServerMessage
                : resolveAuthServiceMessage(
                    result.failure?.message,
                    isEnglish: texts.isEnglish,
                  );
            break;
          case LoginFailureType.unknown:
            _clearCredentialFieldErrors();
            _authErrorNotifier.value = result.failure?.message == null
                ? texts.loginFailedMessage
                : resolveAuthServiceMessage(
                    result.failure?.message,
                    isEnglish: texts.isEnglish,
                  );
            break;
        }
        return;
      }

      final token = result.accessToken;
      if (token == null || token.isEmpty) {
        _clearCredentialFieldErrors();
        _authErrorNotifier.value = texts.cannotCreateSessionMessage;
        return;
      }

      await _authStorage.persistLogin(
        rememberMe: _rememberMe,
        email: result.email ?? email,
        accessToken: token,
        refreshToken: result.refreshToken,
      );
      if (!mounted) {
        return;
      }
      await CartScope.of(context).load();
      if (!mounted) {
        return;
      }
      await OrderScope.of(context).load(forceRefresh: true);
      if (!mounted) {
        return;
      }
      await WarrantyScope.of(context).load(forceRefresh: true);
      if (!mounted) {
        return;
      }
      await NotificationScope.of(context).load(forceRefresh: true);
      _clearCredentialFieldErrors();
      if (!mounted) {
        return;
      }

      context.go('/home');
    } on TimeoutException {
      _clearCredentialFieldErrors();
      _authErrorNotifier.value = texts.loginTimeoutMessage;
    } on Exception {
      _clearCredentialFieldErrors();
      _authErrorNotifier.value = texts.cannotConnectServerMessage;
    } catch (_) {
      _clearCredentialFieldErrors();
      _authErrorNotifier.value = texts.unknownLoginErrorMessage;
    } finally {
      if (mounted) {
        setState(() {
          _isLoggingIn = false;
        });
        _isFormValidNotifier.value = _isFormInputValid();
      }
    }
  }

  Future<void> _loadRemembered() async {
    final remembered = await _authStorage.readRememberedLogin();
    if (remembered.rememberMe && remembered.email.isNotEmpty) {
      _emailController.text = remembered.email;
    } else {
      _emailController.clear();
    }

    if (!mounted) {
      return;
    }

    setState(() {
      _rememberMe = remembered.rememberMe;
    });
    _isFormValidNotifier.value = _isFormInputValid();
  }

  void _onFormInputChanged() {
    final isValid = _isFormInputValid();
    final shouldClearAuthError = _authErrorNotifier.value != null;
    final shouldClearFieldErrors =
        _emailFieldErrorNotifier.value != null ||
        _passwordFieldErrorNotifier.value != null;
    if (_isFormValidNotifier.value == isValid && !shouldClearAuthError) {
      if (!shouldClearFieldErrors) {
        return;
      }
    }

    _isFormValidNotifier.value = isValid;
    if (shouldClearFieldErrors) {
      _clearCredentialFieldErrors();
    }
    if (shouldClearAuthError) {
      _authErrorNotifier.value = null;
    }
  }

  bool _isFormInputValid() {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    return _isValidEmail(email) && _isValidPassword(password);
  }

  bool _isValidEmail(String email) {
    return isValidEmailAddress(email);
  }

  bool _isValidPassword(String password) {
    return password.length >= 6;
  }

  void _handleInvalidCredentialFailure({
    required LoginFailureType type,
    required String message,
  }) {
    _applyCredentialFieldError(type: type, message: message);
  }

  void _clearCredentialFieldErrors() {
    _emailFieldErrorNotifier.value = null;
    _passwordFieldErrorNotifier.value = null;
  }

  void _applyCredentialFieldError({
    required LoginFailureType type,
    required String message,
  }) {
    _clearCredentialFieldErrors();
    switch (type) {
      case LoginFailureType.invalidEmail:
        _authErrorNotifier.value = null;
        _emailFieldErrorNotifier.value = message;
        _emailFocusNode.requestFocus();
        break;
      case LoginFailureType.invalidPassword:
        _authErrorNotifier.value = null;
        _passwordFieldErrorNotifier.value = message;
        _passwordFocusNode.requestFocus();
        _passwordShakeTickNotifier.value = _passwordShakeTickNotifier.value + 1;
        break;
      case LoginFailureType.invalidCredentials:
      case LoginFailureType.conflict:
        _authErrorNotifier.value = message;
        _passwordFocusNode.requestFocus();
        break;
      case LoginFailureType.network:
      case LoginFailureType.unknown:
        break;
    }
  }

  void _onEmailFocusChanged() {
    if (_emailFocusNode.hasFocus) {
      _scrollToField(_emailFieldKey);
      return;
    }

    if (!_emailFormatValidationEnabled) {
      setState(() {
        _emailFormatValidationEnabled = true;
      });
      _formKey.currentState?.validate();
    }
  }

  void _onPasswordFocusChanged() {
    if (_passwordFocusNode.hasFocus) {
      _scrollToField(_passwordFieldKey);
    }
  }

  void _onAuthErrorChanged() {
    if (_authErrorNotifier.value == null) {
      return;
    }
    _scrollToField(_submitButtonKey, alignment: 0.92);
  }

  void _scrollToField(GlobalKey key, {double alignment = 0.25}) {
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

  void _handleTogglePasswordVisibility() {
    if (_isLoggingIn) {
      return;
    }

    final selection = _passwordController.selection;
    setState(() {
      _obscurePassword = !_obscurePassword;
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }

      final textLength = _passwordController.text.length;
      final hasSelection = selection.start >= 0 && selection.end >= 0;
      final safeStart = hasSelection
          ? math.max(0, math.min(selection.start, textLength))
          : textLength;
      final safeEnd = hasSelection
          ? math.max(0, math.min(selection.end, textLength))
          : textLength;

      _passwordController.selection = TextSelection(
        baseOffset: safeStart,
        extentOffset: safeEnd,
      );
    });
  }

  Future<void> _openDealerRegistrationPage() async {
    final texts = _loginTexts(context);
    final launched = await launchUrl(
      DealerApiConfig.dealerRegistrationPageUri,
      mode: LaunchMode.externalApplication,
    );
    if (!mounted || launched) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(texts.cannotOpenRegistrationPageMessage),
      ),
    );
  }
}

class _BrandHeader extends StatelessWidget {
  const _BrandHeader({
    required this.theme,
    this.logoHeight = 40,
    this.showSubtitle = true,
    this.alignment = CrossAxisAlignment.center,
    this.textAlign = TextAlign.center,
  });

  final ThemeData theme;
  final double logoHeight;
  final bool showSubtitle;
  final CrossAxisAlignment alignment;
  final TextAlign textAlign;

  @override
  Widget build(BuildContext context) {
    final texts = _loginTexts(context);
    return Column(
      crossAxisAlignment: alignment,
      children: [
        BrandLogoWordmark(height: logoHeight),
        if (showSubtitle) ...[
          const SizedBox(height: 16),
          Text(
            texts.brandSubtitle,
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
            textAlign: textAlign,
          ),
        ],
      ],
    );
  }
}

class _TabletBrandPanel extends StatelessWidget {
  const _TabletBrandPanel({required this.theme, required this.logoHeight});

  final ThemeData theme;
  final double logoHeight;

  @override
  Widget build(BuildContext context) {
    final texts = _loginTexts(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _BrandHeader(
            theme: theme,
            logoHeight: logoHeight,
            alignment: CrossAxisAlignment.start,
            textAlign: TextAlign.left,
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _BrandPill(
                icon: Icons.inventory_2_outlined,
                text: texts.brandPillOrders,
              ),
              _BrandPill(
                icon: Icons.account_balance_wallet_outlined,
                text: texts.brandPillDebt,
              ),
              _BrandPill(
                icon: Icons.verified_user_outlined,
                text: texts.brandPillWarranty,
              ),
            ],
          ),
          /*
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: const [
              _BrandPill(
                icon: Icons.inventory_2_outlined,
                text: 'Quản lý đơn nhập',
              ),
              _BrandPill(
                icon: Icons.account_balance_wallet_outlined,
                text: 'Theo dõi công nợ',
              ),
              _BrandPill(
                icon: Icons.verified_user_outlined,
                text: 'Xử lý bảo hành',
              ),
            ],
          ),
          */
        ],
      ),
    );
  }
}

class _BrandPill extends StatelessWidget {
  const _BrandPill({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.32)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: Colors.white),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                text,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoginCard extends StatelessWidget {
  // ignore: prefer_const_constructors_in_immutables
  _LoginCard({
    required this.theme,
    required this.formKey,
    required this.emailController,
    required this.passwordController,
    required this.emailFocusNode,
    required this.passwordFocusNode,
    required this.emailFieldKey,
    required this.passwordFieldKey,
    required this.isLoading,
    required this.isCompactLayout,
    required this.isFormValidListenable,
    required this.emailFieldErrorListenable,
    required this.passwordFieldErrorListenable,
    required this.passwordShakeTickListenable,
    required this.obscurePassword,
    required this.onTogglePassword,
    required this.rememberMe,
    required this.onRememberMeChanged,
    required this.shouldValidateEmailFormat,
    required this.authErrorListenable,
    required this.submitButtonKey,
    required this.onSubmitFromKeyboard,
    required this.onLogin,
    required this.onForgotPassword,
  });

  final ThemeData theme;
  final GlobalKey<FormState> formKey;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final FocusNode emailFocusNode;
  final FocusNode passwordFocusNode;
  final GlobalKey emailFieldKey;
  final GlobalKey passwordFieldKey;
  final bool isLoading;
  final bool isCompactLayout;
  final ValueNotifier<bool> isFormValidListenable;
  final ValueNotifier<String?> emailFieldErrorListenable;
  final ValueNotifier<String?> passwordFieldErrorListenable;
  final ValueNotifier<int> passwordShakeTickListenable;
  final bool obscurePassword;
  final VoidCallback onTogglePassword;
  final bool rememberMe;
  final ValueChanged<bool?> onRememberMeChanged;
  final bool shouldValidateEmailFormat;
  final ValueNotifier<String?> authErrorListenable;
  final GlobalKey submitButtonKey;
  final VoidCallback onSubmitFromKeyboard;
  final Future<void> Function() onLogin;
  final VoidCallback onForgotPassword;

  InputDecoration _buildInputDecoration({
    required IconData icon,
    required Color borderColor,
    required Color focusedBorderColor,
    required Color errorColor,
    Widget? suffixIcon,
    bool forceErrorBorder = false,
    String? forceErrorText,
  }) {
    final baseBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: borderColor),
    );
    final errorBorder = baseBorder.copyWith(
      borderSide: BorderSide(color: errorColor, width: 1.6),
    );
    return InputDecoration(
      prefixIcon: Icon(icon),
      suffixIcon: suffixIcon,
      errorText: forceErrorText,
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
      enabledBorder: forceErrorBorder ? errorBorder : baseBorder,
      focusedBorder: forceErrorBorder
          ? errorBorder
          : baseBorder.copyWith(
              borderSide: BorderSide(color: focusedBorderColor, width: 1.6),
            ),
      errorBorder: baseBorder.copyWith(
        borderSide: BorderSide(color: errorColor, width: 1.3),
      ),
      focusedErrorBorder: baseBorder.copyWith(
        borderSide: BorderSide(color: errorColor, width: 1.6),
      ),
    );
  }

  Widget _buildFieldLabel({
    required String text,
    required FocusNode focusNode,
    required Color focusedColor,
    required Color defaultColor,
  }) {
    final baseStyle =
        theme.textTheme.labelLarge ?? const TextStyle(fontSize: 14);
    return AnimatedBuilder(
      animation: focusNode,
      builder: (context, _) {
        return AnimatedDefaultTextStyle(
          duration: const Duration(milliseconds: 130),
          curve: Curves.easeOut,
          style: baseStyle.copyWith(
            fontWeight: FontWeight.w600,
            color: focusNode.hasFocus ? focusedColor : defaultColor,
          ),
          child: Text(text),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final texts = _loginTexts(context);
    final colorScheme = theme.colorScheme;
    final primaryActionColor = colorScheme.primary;
    final borderColor = colorScheme.outlineVariant;
    final errorColor = colorScheme.error;
    final labelColor = colorScheme.onSurface.withValues(alpha: 0.84);
    final errorContainerColor = colorScheme.errorContainer;
    final onErrorContainerColor = colorScheme.onErrorContainer;
    final errorBorderColor = errorColor.withValues(alpha: 0.5);
    final disabledBg = Color.alphaBlend(
      colorScheme.onSurface.withValues(alpha: 0.08),
      colorScheme.surface,
    );
    final disabledFg = colorScheme.onSurface.withValues(alpha: 0.45);
    final cardPadding = isCompactLayout
        ? const EdgeInsets.fromLTRB(16, 16, 16, 12)
        : const EdgeInsets.fromLTRB(20, 20, 20, 16);
    final introGap = isCompactLayout ? 6.0 : 8.0;
    final sectionStartGap = isCompactLayout ? 16.0 : 24.0;
    final labelGap = isCompactLayout ? 6.0 : 8.0;
    final sectionGap = isCompactLayout ? 12.0 : 16.0;
    final inputTextStyle = theme.textTheme.bodyLarge?.copyWith(
      fontSize: isCompactLayout ? 15 : 16,
      fontWeight: FontWeight.w500,
    );

    return Container(
      padding: cardPadding,
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
      child: AutofillGroup(
        child: Form(
          key: formKey,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                texts.loginTitle,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              SizedBox(height: introGap),
              Text(
                texts.loginSubtitle,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  height: 1.5,
                ),
              ),
              SizedBox(height: sectionStartGap),
              _buildFieldLabel(
                text: texts.emailLabel,
                focusNode: emailFocusNode,
                focusedColor: primaryActionColor,
                defaultColor: labelColor,
              ),
              SizedBox(height: labelGap),
              Container(
                key: emailFieldKey,
                child: ValueListenableBuilder<String?>(
                  valueListenable: emailFieldErrorListenable,
                  builder: (context, emailFieldError, _) {
                    return Semantics(
                      textField: true,
                      label: texts.emailLabel,
                      child: TextFormField(
                        controller: emailController,
                        focusNode: emailFocusNode,
                        enabled: !isLoading,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        textCapitalization: TextCapitalization.none,
                        autofillHints: const [
                          AutofillHints.username,
                          AutofillHints.email,
                        ],
                        autocorrect: false,
                        enableSuggestions: false,
                        style: inputTextStyle,
                        decoration: _buildInputDecoration(
                          icon: Icons.mail_outline,
                          borderColor: borderColor,
                          focusedBorderColor: primaryActionColor,
                          errorColor: errorColor,
                          forceErrorBorder: emailFieldError != null,
                          forceErrorText: emailFieldError,
                        ),
                        validator: (value) {
                          return validateEmailAddress(
                            value,
                            emptyMessage: texts.emailRequiredMessage,
                            invalidMessage: texts.invalidEmailMessage,
                            showFormatError:
                                shouldValidateEmailFormat ||
                                !emailFocusNode.hasFocus,
                          );
                        },
                        onFieldSubmitted: (_) =>
                            passwordFocusNode.requestFocus(),
                      ),
                    );
                  },
                ),
              ),
              SizedBox(height: sectionGap),
              _buildFieldLabel(
                text: texts.passwordLabel,
                focusNode: passwordFocusNode,
                focusedColor: primaryActionColor,
                defaultColor: labelColor,
              ),
              SizedBox(height: labelGap),
              Container(
                key: passwordFieldKey,
                child: ValueListenableBuilder<String?>(
                  valueListenable: passwordFieldErrorListenable,
                  builder: (context, passwordFieldError, _) {
                    return ValueListenableBuilder<int>(
                      valueListenable: passwordShakeTickListenable,
                      builder: (context, shakeTick, _) {
                        final shouldShowPasswordHint =
                            passwordFieldError == null &&
                            passwordController.text.length < 6;
                        final field = Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Semantics(
                              textField: true,
                              label: texts.passwordLabel,
                              child: TextFormField(
                                controller: passwordController,
                                focusNode: passwordFocusNode,
                                enabled: !isLoading,
                                obscureText: obscurePassword,
                                textInputAction: TextInputAction.done,
                                autofillHints: const [AutofillHints.password],
                                autocorrect: false,
                                enableSuggestions: false,
                                style: inputTextStyle,
                                decoration: _buildInputDecoration(
                                  icon: Icons.lock_outline,
                                  borderColor: borderColor,
                                  focusedBorderColor: primaryActionColor,
                                  errorColor: errorColor,
                                  forceErrorBorder: passwordFieldError != null,
                                  forceErrorText: passwordFieldError,
                                  suffixIcon: IconButton(
                                    onPressed: isLoading
                                        ? null
                                        : onTogglePassword,
                                    tooltip: obscurePassword
                                        ? texts.showPasswordTooltip
                                        : texts.hidePasswordTooltip,
                                    icon: AnimatedSwitcher(
                                      duration: const Duration(
                                        milliseconds: 160,
                                      ),
                                      switchInCurve: Curves.easeOut,
                                      switchOutCurve: Curves.easeOut,
                                      transitionBuilder: (child, animation) {
                                        return FadeTransition(
                                          opacity: animation,
                                          child: RotationTransition(
                                            turns: Tween<double>(
                                              begin: 0.9,
                                              end: 1,
                                            ).animate(animation),
                                            child: child,
                                          ),
                                        );
                                      },
                                      child: Icon(
                                        obscurePassword
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined,
                                        key: ValueKey<bool>(obscurePassword),
                                      ),
                                    ),
                                  ),
                                ),
                                validator: (value) {
                                  final password = value ?? '';
                                  if (password.isEmpty) {
                                    return texts.passwordRequiredMessage;
                                  }
                                  if (password.length < 6) {
                                    return texts.passwordMinLengthMessage;
                                  }
                                  return null;
                                },
                                onFieldSubmitted: (_) => onSubmitFromKeyboard(),
                              ),
                            ),
                            AnimatedSwitcher(
                              duration: const Duration(milliseconds: 140),
                              child: shouldShowPasswordHint
                                  ? Padding(
                                      key: const ValueKey<String>(
                                        'password_hint',
                                      ),
                                      padding: const EdgeInsets.only(
                                        top: 6,
                                        left: 12,
                                      ),
                                      child: Text(
                                        texts.passwordMinLengthHint,
                                        style: theme.textTheme.bodySmall
                                            ?.copyWith(
                                              color: theme
                                                  .colorScheme
                                                  .onSurfaceVariant,
                                            ),
                                      ),
                                    )
                                  : const SizedBox.shrink(),
                            ),
                          ],
                        );
                        if (shakeTick == 0) {
                          return field;
                        }

                        return TweenAnimationBuilder<double>(
                          key: ValueKey<int>(shakeTick),
                          tween: Tween(begin: 0, end: 1),
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeOut,
                          builder: (context, value, child) {
                            final damping = 1 - value;
                            final offsetX =
                                math.sin(value * math.pi * 6) * 7 * damping;
                            return Transform.translate(
                              offset: Offset(offsetX, 0),
                              child: child,
                            );
                          },
                          child: field,
                        );
                      },
                    );
                  },
                ),
              ),
              ValueListenableBuilder<String?>(
                valueListenable: authErrorListenable,
                builder: (context, authErrorMessage, _) {
                  if (authErrorMessage == null) {
                    return const SizedBox.shrink();
                  }
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Semantics(
                      container: true,
                      liveRegion: true,
                      label: texts.authErrorSemanticsLabel(authErrorMessage),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: errorContainerColor,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: errorBorderColor),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: EdgeInsets.only(top: 1),
                              child: Icon(
                                Icons.error_outline,
                                size: 18,
                                color: onErrorContainerColor,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                authErrorMessage,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: onErrorContainerColor,
                                  height: 1.35,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            TextButton(
                              onPressed: isLoading ? null : onForgotPassword,
                              style: TextButton.styleFrom(
                                minimumSize: const Size(48, 48),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                foregroundColor: onErrorContainerColor,
                                textStyle: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              child: Text(texts.forgotPasswordAction),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
              SizedBox(height: sectionGap),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(
                        minHeight: 48,
                        minWidth: 48,
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: isLoading
                              ? null
                              : () {
                                  onRememberMeChanged(!rememberMe);
                                },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 6,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                IgnorePointer(
                                  child: Checkbox(
                                    value: rememberMe,
                                    onChanged: isLoading
                                        ? null
                                        : onRememberMeChanged,
                                  ),
                                ),
                                const SizedBox(width: 2),
                                Flexible(
                                  child: Text(
                                    texts.rememberEmailLabel,
                                    overflow: TextOverflow.ellipsis,
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
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: isLoading ? null : onForgotPassword,
                    style: TextButton.styleFrom(
                      minimumSize: const Size(48, 48),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 8,
                      ),
                      foregroundColor: primaryActionColor,
                      textStyle: const TextStyle(
                        fontWeight: FontWeight.w700,
                        decoration: TextDecoration.underline,
                        decorationThickness: 1.2,
                      ),
                    ),
                    child: Text(texts.forgotPasswordAction),
                  ),
                ],
              ),
              SizedBox(height: sectionGap),
              SizedBox(
                key: submitButtonKey,
                width: double.infinity,
                child: ValueListenableBuilder<bool>(
                  valueListenable: isFormValidListenable,
                  builder: (context, isFormValid, _) {
                    final canSubmit = isFormValid && !isLoading;
                    return _AnimatedSubmitButton(
                      canSubmit: canSubmit,
                      isLoading: isLoading,
                      label: texts.loginAction,
                      onPressed: () async => onLogin(),
                      style: ButtonStyle(
                        minimumSize: const WidgetStatePropertyAll(Size(0, 48)),
                        backgroundColor: WidgetStateProperty.resolveWith<Color>(
                          (states) {
                            if (isLoading) {
                              return primaryActionColor;
                            }
                            if (states.contains(WidgetState.disabled)) {
                              return disabledBg;
                            }
                            return primaryActionColor;
                          },
                        ),
                        foregroundColor: WidgetStateProperty.resolveWith<Color>(
                          (states) {
                            if (isLoading) {
                              return Colors.white;
                            }
                            if (states.contains(WidgetState.disabled)) {
                              return disabledFg;
                            }
                            return Colors.white;
                          },
                        ),
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
    required this.onPressed,
    required this.style,
  });

  final bool canSubmit;
  final bool isLoading;
  final String label;
  final Future<void> Function() onPressed;
  final ButtonStyle style;

  @override
  State<_AnimatedSubmitButton> createState() => _AnimatedSubmitButtonState();
}

class _AnimatedSubmitButtonState extends State<_AnimatedSubmitButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final texts = _loginTexts(context);
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
                    Text(texts.loggingInLabel),
                  ],
                )
              : Text(widget.label),
        ),
      ),
    );
  }
}

class _RegisterPrompt extends StatelessWidget {
  const _RegisterPrompt({
    required this.theme,
    required this.isLoading,
    required this.onRegister,
  });

  final ThemeData theme;
  final bool isLoading;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    final texts = _loginTexts(context);
    final backgroundColor = theme.brightness == Brightness.dark
        ? Colors.white.withValues(alpha: 0.16)
        : Colors.black.withValues(alpha: 0.24);
    final borderColor = Colors.white.withValues(
      alpha: theme.brightness == Brightness.dark ? 0.24 : 0.34,
    );

    return Center(
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: borderColor),
        ),
        child: TextButton(
          onPressed: isLoading ? null : onRegister,
          style: TextButton.styleFrom(
            minimumSize: const Size(48, 48),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            foregroundColor: Colors.white,
          ),
          child: Text.rich(
            TextSpan(
              text: texts.noAccountPrompt,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.white,
                height: 1.2,
              ),
              children: [
                TextSpan(
                  text: texts.registerOnWebsiteAction,
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
      ),
    );
  }
}

class _LoginTexts {
  const _LoginTexts({required this.isEnglish});

  final bool isEnglish;

  String get brandSubtitle => isEnglish
      ? 'Sign in to manage orders, debt, and warranties with 4thitek.'
      : 'Dang nhap de quan ly don nhap, cong no va bao hanh cung 4thitek.';
  String get brandPillOrders =>
      isEnglish ? 'Manage orders' : 'Quan ly don nhap';
  String get brandPillDebt =>
      isEnglish ? 'Track debt' : 'Theo doi cong no';
  String get brandPillWarranty =>
      isEnglish ? 'Process warranties' : 'Xu ly bao hanh';
  String get loginTitle => isEnglish ? 'Dealer sign in' : 'Dang nhap dai ly';
  String get loginSubtitle => isEnglish
      ? 'Enter your email and password to continue.'
      : 'Nhap email va mat khau de tiep tuc';
  String get emailLabel => 'Email';
  String get passwordLabel => isEnglish ? 'Password' : 'Mat khau';
  String get emailRequiredMessage => isEnglish
      ? 'Email is required.'
      : 'Email khong duoc de trong';
  String get invalidEmailMessage =>
      isEnglish ? 'Email is invalid.' : 'Email khong hop le';
  String get passwordRequiredMessage => isEnglish
      ? 'Password is required.'
      : 'Mat khau khong duoc de trong';
  String get passwordMinLengthMessage => isEnglish
      ? 'Password must be at least 6 characters.'
      : 'Mat khau toi thieu 6 ky tu';
  String get passwordMinLengthHint => isEnglish
      ? 'At least 6 characters'
      : 'Toi thieu 6 ky tu';
  String get showPasswordTooltip =>
      isEnglish ? 'Show password' : 'Hien mat khau';
  String get hidePasswordTooltip =>
      isEnglish ? 'Hide password' : 'An mat khau';
  String authErrorSemanticsLabel(String message) => isEnglish
      ? 'Login error: $message'
      : 'Loi dang nhap: $message';
  String get forgotPasswordAction => isEnglish
      ? 'Forgot password?'
      : 'Quen mat khau?';
  String get rememberEmailLabel => isEnglish
      ? 'Remember email'
      : 'Ghi nho email';
  String get loginAction => isEnglish ? 'Sign in' : 'Dang nhap';
  String get loggingInLabel =>
      isEnglish ? 'Signing in...' : 'Dang dang nhap...';
  String get noAccountPrompt =>
      isEnglish ? 'No account yet? ' : 'Chua co tai khoan? ';
  String get registerOnWebsiteAction => isEnglish
      ? 'Register on website'
      : 'Dang ky tren website';
  String get invalidCredentialsMessage => isEnglish
      ? 'Email or password is incorrect.'
      : 'Email hoac mat khau khong dung.';
  String get cannotConnectServerMessage => isEnglish
      ? 'Unable to connect to the server. Please try again.'
      : 'Khong the ket noi may chu. Vui long thu lai.';
  String get loginFailedMessage => isEnglish
      ? 'Sign in failed. Please try again.'
      : 'Dang nhap that bai. Vui long thu lai.';
  String get cannotCreateSessionMessage => isEnglish
      ? 'Unable to create a login session. Please try again.'
      : 'Khong the tao phien dang nhap. Vui long thu lai.';
  String get loginTimeoutMessage => isEnglish
      ? 'The sign-in request timed out. Please try again.'
      : 'Yeu cau dang nhap het thoi gian. Vui long thu lai.';
  String get unknownLoginErrorMessage => isEnglish
      ? 'An unknown error occurred. Please try again.'
      : 'Da xay ra loi khong xac dinh. Vui long thu lai.';
  String get cannotOpenRegistrationPageMessage => isEnglish
      ? 'Unable to open the dealer registration page on the website.'
      : 'Khong the mo trang dang ky dai ly tren website.';
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
