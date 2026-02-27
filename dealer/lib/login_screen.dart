import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'auth_service.dart';
import 'auth_storage.dart';
import 'forgot_password_screen.dart';
import 'home_shell.dart';
import 'register_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

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

  @override
  void initState() {
    super.initState();
    _authService = const MockAuthService();
    _authStorage = AuthStorage();
    _emailController.addListener(_onFormInputChanged);
    _passwordController.addListener(_onFormInputChanged);
    _emailFocusNode.addListener(_onEmailFocusChanged);
    _passwordFocusNode.addListener(_onPasswordFocusChanged);
    _loadRemembered();
  }

  @override
  void dispose() {
    _emailController.removeListener(_onFormInputChanged);
    _passwordController.removeListener(_onFormInputChanged);
    _emailFocusNode.removeListener(_onEmailFocusChanged);
    _passwordFocusNode.removeListener(_onPasswordFocusChanged);
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
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isCompact = screenWidth < 420;
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
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      FadeSlideIn(child: _BrandHeader(theme: theme)),
                      const SizedBox(height: 24),
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
                          isFormValidListenable: _isFormValidNotifier,
                          emailFieldErrorListenable: _emailFieldErrorNotifier,
                          passwordFieldErrorListenable:
                              _passwordFieldErrorNotifier,
                          passwordShakeTickListenable:
                              _passwordShakeTickNotifier,
                          obscurePassword: _obscurePassword,
                          onTogglePassword: _handleTogglePasswordVisibility,
                          rememberMe: _rememberMe,
                          onRememberMeChanged: (value) {
                            if (_isLoggingIn) {
                              return;
                            }
                            setState(() => _rememberMe = value ?? false);
                          },
                          authErrorListenable: _authErrorNotifier,
                          onSubmitFromKeyboard: _handleLogin,
                          onLogin: _handleLogin,
                          onForgotPassword: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) =>
                                    const ForgotPasswordScreen(),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 14),
                      FadeSlideIn(
                        delay: const Duration(milliseconds: 140),
                        child: _RegisterPrompt(
                          theme: theme,
                          isLoading: _isLoggingIn,
                          onRegister: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => const RegisterScreen(),
                              ),
                            );
                          },
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

  Future<void> _handleLogin() async {
    if (_isLoggingIn) {
      return;
    }

    FocusScope.of(context).unfocus();
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
            _handleInvalidCredentialFailure(
              type: LoginFailureType.invalidCredentials,
              message:
                  'Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang.',
            );
            break;
          case LoginFailureType.invalidEmail:
            _handleInvalidCredentialFailure(
              type: LoginFailureType.invalidEmail,
              message: 'Email kh\u00f4ng \u0111\u00fang.',
            );
            break;
          case LoginFailureType.invalidPassword:
            _handleInvalidCredentialFailure(
              type: LoginFailureType.invalidPassword,
              message: 'M\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang.',
            );
            break;
          case LoginFailureType.network:
            _clearCredentialFieldErrors();
            _authErrorNotifier.value =
                'Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i m\u00e1y ch\u1ee7. Vui l\u00f2ng th\u1eed l\u1ea1i.';
            break;
          case LoginFailureType.unknown:
            _clearCredentialFieldErrors();
            _authErrorNotifier.value =
                '\u0110\u0103ng nh\u1eadp th\u1ea5t b\u1ea1i. Vui l\u00f2ng th\u1eed l\u1ea1i.';
            break;
        }
        return;
      }

      final token = result.token;
      if (token == null || token.isEmpty) {
        _clearCredentialFieldErrors();
        _authErrorNotifier.value =
            'Kh\u00f4ng th\u1ec3 t\u1ea1o phi\u00ean \u0111\u0103ng nh\u1eadp. Vui l\u00f2ng th\u1eed l\u1ea1i.';
        return;
      }

      await _authStorage.persistLogin(
        rememberMe: _rememberMe,
        email: result.email ?? email,
        token: token,
      );
      _clearCredentialFieldErrors();
      if (!mounted) {
        return;
      }

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const DealerHomeShell()),
      );
    } on TimeoutException {
      _clearCredentialFieldErrors();
      _authErrorNotifier.value =
          'Y\u00eau c\u1ea7u \u0111\u0103ng nh\u1eadp h\u1ebft th\u1eddi gian. Vui l\u00f2ng th\u1eed l\u1ea1i.';
    } on Exception {
      _clearCredentialFieldErrors();
      _authErrorNotifier.value =
          'Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i m\u00e1y ch\u1ee7. Vui l\u00f2ng th\u1eed l\u1ea1i.';
    } catch (_) {
      _clearCredentialFieldErrors();
      _authErrorNotifier.value =
          '\u0110\u00e3 x\u1ea3y ra l\u1ed7i kh\u00f4ng x\u00e1c \u0111\u1ecbnh. Vui l\u00f2ng th\u1eed l\u1ea1i.';
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
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  bool _isValidPassword(String password) {
    return password.length >= 6;
  }

  void _handleInvalidCredentialFailure({
    required LoginFailureType type,
    required String message,
  }) {
    _applyCredentialFieldError(type: type, message: message);
    _authErrorNotifier.value = null;
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
        _emailFieldErrorNotifier.value = message;
        _emailFocusNode.requestFocus();
        break;
      case LoginFailureType.invalidPassword:
        _passwordFieldErrorNotifier.value = message;
        _passwordFocusNode.requestFocus();
        _passwordShakeTickNotifier.value = _passwordShakeTickNotifier.value + 1;
        break;
      case LoginFailureType.invalidCredentials:
        _emailFieldErrorNotifier.value = 'Email kh\u00f4ng \u0111\u00fang.';
        _passwordFieldErrorNotifier.value =
            'M\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang.';
        _passwordFocusNode.requestFocus();
        _passwordShakeTickNotifier.value = _passwordShakeTickNotifier.value + 1;
        break;
      case LoginFailureType.network:
      case LoginFailureType.unknown:
        break;
    }
  }

  void _onEmailFocusChanged() {
    if (_emailFocusNode.hasFocus) {
      _scrollToField(_emailFieldKey);
    }
  }

  void _onPasswordFocusChanged() {
    if (_passwordFocusNode.hasFocus) {
      _scrollToField(_passwordFieldKey);
    }
  }

  void _scrollToField(GlobalKey key) {
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
        alignment: 0.25,
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
}

class _BrandHeader extends StatelessWidget {
  const _BrandHeader({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const BrandLogoWordmark(height: 40),
        const SizedBox(height: 16),
        Text(
          '\u0110\u0103ng nh\u1eadp \u0111\u1ec3 qu\u1ea3n l\u00fd \u0111\u01a1n nh\u1eadp, c\u00f4ng n\u1ee3 v\u00e0 b\u1ea3o h\u00e0nh c\u00f9ng 4thitek.',
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
    required this.isFormValidListenable,
    required this.emailFieldErrorListenable,
    required this.passwordFieldErrorListenable,
    required this.passwordShakeTickListenable,
    required this.obscurePassword,
    required this.onTogglePassword,
    required this.rememberMe,
    required this.onRememberMeChanged,
    required this.authErrorListenable,
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
  final ValueNotifier<bool> isFormValidListenable;
  final ValueNotifier<String?> emailFieldErrorListenable;
  final ValueNotifier<String?> passwordFieldErrorListenable;
  final ValueNotifier<int> passwordShakeTickListenable;
  final bool obscurePassword;
  final VoidCallback onTogglePassword;
  final bool rememberMe;
  final ValueChanged<bool?> onRememberMeChanged;
  final ValueNotifier<String?> authErrorListenable;
  final VoidCallback onSubmitFromKeyboard;
  final Future<void> Function() onLogin;
  final VoidCallback onForgotPassword;

  static const _primaryBlue = Color(0xFF0A67FF);
  static const _errorPink = Color(0xFFE11D48);
  static const _disabledBg = Color(0xFFE5E7EB);
  static const _disabledFg = Color(0xFF9CA3AF);
  static const _labelColor = Color(0xFF0F172A);

  InputDecoration _buildInputDecoration({
    required IconData icon,
    Widget? suffixIcon,
    bool forceErrorBorder = false,
    String? forceErrorText,
  }) {
    final baseBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
    );
    final errorBorder = baseBorder.copyWith(
      borderSide: const BorderSide(color: _errorPink, width: 1.6),
    );
    return InputDecoration(
      prefixIcon: Icon(icon),
      suffixIcon: suffixIcon,
      errorText: forceErrorText,
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
      enabledBorder: forceErrorBorder ? errorBorder : baseBorder,
      focusedBorder: forceErrorBorder
          ? errorBorder
          : baseBorder.copyWith(
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

  Widget _buildFieldLabel({
    required String text,
    required FocusNode focusNode,
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
            color: focusNode.hasFocus ? _primaryBlue : _labelColor,
          ),
          child: Text(text),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final inputTextStyle = theme.textTheme.bodyLarge?.copyWith(
      fontSize: 16,
      fontWeight: FontWeight.w500,
    );

    return Container(
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
      child: AutofillGroup(
        child: Form(
          key: formKey,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '\u0110\u0103ng nh\u1eadp \u0111\u1ea1i l\u00fd',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Nh\u1eadp email v\u00e0 m\u1eadt kh\u1ea9u \u0111\u1ec3 ti\u1ebfp t\u1ee5c',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.black54,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              _buildFieldLabel(text: 'Email', focusNode: emailFocusNode),
              const SizedBox(height: 8),
              Container(
                key: emailFieldKey,
                child: ValueListenableBuilder<String?>(
                  valueListenable: emailFieldErrorListenable,
                  builder: (context, emailFieldError, _) {
                    return Semantics(
                      textField: true,
                      label: 'Email',
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
                          forceErrorBorder: emailFieldError != null,
                          forceErrorText: emailFieldError,
                        ),
                        validator: (value) {
                          final email = value?.trim() ?? '';
                          if (email.isEmpty) {
                            return 'Email kh\u00f4ng \u0111\u01b0\u1ee3c \u0111\u1ec3 tr\u1ed1ng';
                          }
                          final isValidEmail = RegExp(
                            r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                          ).hasMatch(email);
                          if (!isValidEmail) {
                            return 'Email kh\u00f4ng h\u1ee3p l\u1ec7';
                          }
                          return null;
                        },
                        onFieldSubmitted: (_) =>
                            passwordFocusNode.requestFocus(),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              _buildFieldLabel(
                text: 'M\u1eadt kh\u1ea9u',
                focusNode: passwordFocusNode,
              ),
              const SizedBox(height: 8),
              Container(
                key: passwordFieldKey,
                child: ValueListenableBuilder<String?>(
                  valueListenable: passwordFieldErrorListenable,
                  builder: (context, passwordFieldError, _) {
                    return ValueListenableBuilder<int>(
                      valueListenable: passwordShakeTickListenable,
                      builder: (context, shakeTick, _) {
                        final field = Semantics(
                          textField: true,
                          label: 'M\u1eadt kh\u1ea9u',
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
                              forceErrorBorder: passwordFieldError != null,
                              forceErrorText: passwordFieldError,
                              suffixIcon: IconButton(
                                onPressed: isLoading ? null : onTogglePassword,
                                tooltip: obscurePassword
                                    ? 'Hi\u1ec7n m\u1eadt kh\u1ea9u'
                                    : '\u1ea8n m\u1eadt kh\u1ea9u',
                                icon: AnimatedSwitcher(
                                  duration: const Duration(milliseconds: 160),
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
                                return 'M\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u01b0\u1ee3c \u0111\u1ec3 tr\u1ed1ng';
                              }
                              if (password.length < 6) {
                                return 'M\u1eadt kh\u1ea9u t\u1ed1i thi\u1ec3u 6 k\u00fd t\u1ef1';
                              }
                              return null;
                            },
                            onFieldSubmitted: (_) => onSubmitFromKeyboard(),
                          ),
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
                      label:
                          'L\u1ed7i \u0111\u0103ng nh\u1eadp: $authErrorMessage',
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFEF4444)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Padding(
                              padding: EdgeInsets.only(top: 1),
                              child: Icon(
                                Icons.error_outline,
                                size: 18,
                                color: Color(0xFFDC2626),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                authErrorMessage,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: const Color(0xFFDC2626),
                                  height: 1.35,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            TextButton(
                              onPressed: isLoading ? null : onForgotPassword,
                              style: TextButton.styleFrom(
                                minimumSize: const Size(44, 44),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                foregroundColor: const Color(0xFFDC2626),
                                textStyle: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              child: const Text(
                                'Qu\u00ean m\u1eadt kh\u1ea9u?',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 12,
                runSpacing: 8,
                children: [
                  ConstrainedBox(
                    constraints: const BoxConstraints(
                      minHeight: 44,
                      minWidth: 44,
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
                            mainAxisSize: MainAxisSize.min,
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
                              Text(
                                'Ghi nh\u1edb \u0111\u0103ng nh\u1eadp',
                                style: theme.textTheme.bodyMedium,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: isLoading ? null : onForgotPassword,
                    style: TextButton.styleFrom(
                      minimumSize: const Size(44, 44),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 8,
                      ),
                      foregroundColor: _primaryBlue,
                      textStyle: const TextStyle(
                        fontWeight: FontWeight.w700,
                        decoration: TextDecoration.underline,
                        decorationThickness: 1.2,
                      ),
                    ),
                    child: const Text('Qu\u00ean m\u1eadt kh\u1ea9u?'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ValueListenableBuilder<bool>(
                  valueListenable: isFormValidListenable,
                  builder: (context, isFormValid, _) {
                    final canSubmit = isFormValid && !isLoading;
                    return _AnimatedSubmitButton(
                      canSubmit: canSubmit,
                      isLoading: isLoading,
                      label: '\u0110\u0103ng nh\u1eadp',
                      onPressed: () async => onLogin(),
                      style: ButtonStyle(
                        minimumSize: const WidgetStatePropertyAll(Size(0, 48)),
                        backgroundColor: WidgetStateProperty.resolveWith<Color>(
                          (states) {
                            if (isLoading) {
                              return _primaryBlue;
                            }
                            if (states.contains(WidgetState.disabled)) {
                              return _disabledBg;
                            }
                            return _primaryBlue;
                          },
                        ),
                        foregroundColor: WidgetStateProperty.resolveWith<Color>(
                          (states) {
                            if (isLoading) {
                              return Colors.white;
                            }
                            if (states.contains(WidgetState.disabled)) {
                              return _disabledFg;
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
                      Text('\u0110ang \u0111\u0103ng nh\u1eadp...'),
                    ],
                  )
                : Text(widget.label),
          ),
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
    return Center(
      child: TextButton(
        onPressed: isLoading ? null : onRegister,
        child: Text.rich(
          TextSpan(
            text: 'Ch\u01b0a c\u00f3 t\u00e0i kho\u1ea3n? ',
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white),
            children: [
              TextSpan(
                text: '\u0110\u0103ng k\u00fd \u0111\u1ea1i l\u00fd',
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
