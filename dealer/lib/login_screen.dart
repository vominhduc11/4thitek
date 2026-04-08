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

part 'login_screen_support.dart';

_LoginTexts _loginTexts(BuildContext context) => _LoginTexts(
  isEnglish: Localizations.localeOf(context).languageCode == 'en',
);

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
              child: Opacity(opacity: 0.07, child: _TextureLayer()),
            ),
          ),
          Positioned(
            right: layout.isTablet ? -96 : (layout.isCompactVisual ? -56 : -80),
            top: layout.isTablet ? -60 : (layout.isCompactVisual ? -26 : -40),
            child: _GlowOrb(
              size: layout.topOrbSize,
              color: const Color(0x2429ABE2),
            ),
          ),
          Positioned(
            left: layout.isTablet ? -90 : (layout.isCompactVisual ? -44 : -60),
            bottom: layout.isTablet
                ? -56
                : (layout.isCompactVisual ? -18 : -30),
            child: _GlowOrb(
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
              color: const Color(0xFFE9F0F4),
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
                text: texts.brandPillPayments,
              ),
              _BrandPill(
                icon: Icons.verified_user_outlined,
                text: texts.brandPillWarranty,
              ),
            ],
          ),
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
        color: const Color(0x1A29ABE2),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0x4D29ABE2)),
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
                  color: const Color(0xFFECEDEE),
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
    final borderColor = const Color(0x4D29ABE2);
    final textColor = const Color(0xFFECEDEE);

    return Center(
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color(0x1A29ABE2),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: borderColor),
        ),
        child: TextButton(
          onPressed: isLoading ? null : onRegister,
          style: TextButton.styleFrom(
            minimumSize: const Size(48, 48),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            foregroundColor: textColor,
          ),
          child: Text.rich(
            TextSpan(
              text: texts.noAccountPrompt,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: textColor,
                height: 1.2,
              ),
              children: [
                TextSpan(
                  text: texts.registerOnWebsiteAction,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: textColor,
                    fontWeight: FontWeight.w700,
                    decoration: TextDecoration.underline,
                    decorationColor: textColor,
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
