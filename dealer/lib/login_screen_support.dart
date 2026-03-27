// ignore_for_file: invalid_use_of_protected_member

part of 'login_screen.dart';

class _LoginLayoutSpec {
  const _LoginLayoutSpec({
    required this.isTablet,
    required this.isCompactVisual,
    required this.isVerticallyTight,
    required this.cardMaxWidth,
    required this.contentMaxWidth,
    required this.topOrbSize,
    required this.bottomOrbSize,
    required this.scrollHorizontalPadding,
    required this.scrollVerticalPadding,
    required this.brandToCardGap,
    required this.cardToPromptGap,
    required this.logoHeight,
    required this.showBrandSubtitle,
    required this.showRegisterPrompt,
  });

  final bool isTablet;
  final bool isCompactVisual;
  final bool isVerticallyTight;
  final double cardMaxWidth;
  final double contentMaxWidth;
  final double topOrbSize;
  final double bottomOrbSize;
  final double scrollHorizontalPadding;
  final double scrollVerticalPadding;
  final double brandToCardGap;
  final double cardToPromptGap;
  final double logoHeight;
  final bool showBrandSubtitle;
  final bool showRegisterPrompt;

  factory _LoginLayoutSpec.fromContext(BuildContext context) {
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
    return _LoginLayoutSpec(
      isTablet: isTablet,
      isCompactVisual: isCompactVisual,
      isVerticallyTight: isVerticallyTight,
      cardMaxWidth: cardMaxWidth,
      contentMaxWidth: isTablet ? 1120.0 : cardMaxWidth,
      topOrbSize: isTablet ? 260.0 : (isCompactVisual ? 170.0 : 220.0),
      bottomOrbSize: isTablet ? 230.0 : (isCompactVisual ? 150.0 : 200.0),
      scrollHorizontalPadding: isTablet ? 28.0 : (isSmallMobile ? 14.0 : 20.0),
      scrollVerticalPadding: isVerticallyTight ? 14.0 : 28.0,
      brandToCardGap: isVerticallyTight ? 12.0 : 24.0,
      cardToPromptGap: isVerticallyTight ? 10.0 : 14.0,
      logoHeight: isTablet ? 52.0 : (isVerticallyTight ? 34.0 : 40.0),
      showBrandSubtitle: !(isLandscape && !isTablet),
      showRegisterPrompt: keyboardInset == 0 || isTablet,
    );
  }
}

extension _LoginScreenSupport on _LoginScreenState {
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
      SnackBar(content: Text(texts.cannotOpenRegistrationPageMessage)),
    );
  }
}
