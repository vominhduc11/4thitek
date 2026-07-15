import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import 'api_config.dart';
import 'auth_service.dart';
import 'auth_storage.dart';
import 'breakpoints.dart';
import 'forgot_password_screen.dart';
import 'session_bootstrap.dart';
import 'validation_utils.dart';
import 'widgets/animated_submit_button.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/glow_orb.dart';
import 'widgets/texture_layer.dart';

part 'login_screen_support.dart';
part 'login_screen_texts.dart';
part 'login_screen_widgets.dart';
part 'login_screen_card.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.initialErrorMessage, this.authService});

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
    final layout = _LoginLayoutSpec.fromContext(context);

    Widget buildFormColumn({required bool includeHeader}) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (includeHeader) ...[
            FadeSlideIn(
              child: _BrandHeader(
                theme: theme,
                logoHeight: layout.logoHeight,
                showSubtitle: layout.showBrandSubtitle,
              ),
            ),
            SizedBox(height: layout.brandToCardGap),
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
              isCompactLayout: layout.isVerticallyTight,
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
          if (layout.showRegisterPrompt) ...[
            SizedBox(height: layout.cardToPromptGap),
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
                  Color(0xFF07111A),
                  Color(0xFF0D2232),
                  Color(0xFF13456A),
                ],
              ),
            ),
          ),
          const Positioned.fill(
            child: IgnorePointer(
              child: Opacity(opacity: 0.07, child: TextureLayer()),
            ),
          ),
          Positioned(
            right: layout.isTablet ? -96 : (layout.isCompactVisual ? -56 : -80),
            top: layout.isTablet ? -60 : (layout.isCompactVisual ? -26 : -40),
            child: GlowOrb(
              size: layout.topOrbSize,
              color: const Color(0x2429ABE2),
            ),
          ),
          Positioned(
            left: layout.isTablet ? -90 : (layout.isCompactVisual ? -44 : -60),
            bottom: layout.isTablet
                ? -56
                : (layout.isCompactVisual ? -18 : -30),
            child: GlowOrb(
              size: layout.bottomOrbSize,
              color: const Color(0x1A0071BC),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              controller: _scrollController,
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: EdgeInsets.fromLTRB(
                layout.scrollHorizontalPadding,
                layout.scrollVerticalPadding,
                layout.scrollHorizontalPadding,
                layout.scrollVerticalPadding,
              ),
              child: Center(
                child: layout.isTablet
                    ? ConstrainedBox(
                        constraints: BoxConstraints(
                          maxWidth: layout.contentMaxWidth,
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Expanded(
                              child: FadeSlideIn(
                                child: _TabletBrandPanel(
                                  theme: theme,
                                  logoHeight: layout.logoHeight,
                                ),
                              ),
                            ),
                            const SizedBox(width: 28),
                            ConstrainedBox(
                              constraints: BoxConstraints(
                                maxWidth: layout.cardMaxWidth,
                              ),
                              child: buildFormColumn(includeHeader: false),
                            ),
                          ],
                        ),
                      )
                    : ConstrainedBox(
                        constraints: BoxConstraints(
                          maxWidth: layout.cardMaxWidth,
                        ),
                        child: buildFormColumn(includeHeader: true),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
