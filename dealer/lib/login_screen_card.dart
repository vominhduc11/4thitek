part of 'login_screen.dart';

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
                    return AnimatedSubmitButton(
                      canSubmit: canSubmit,
                      isLoading: isLoading,
                      label: texts.loginAction,
                      loadingLabel: texts.loggingInLabel,
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
