import 'package:flutter/material.dart';

import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  static const _primaryBlue = Color(0xFF0A67FF);
  static const _errorPink = Color(0xFFE11D48);
  static const _disabledBg = Color(0xFFE5E7EB);
  static const _disabledFg = Color(0xFF9CA3AF);

  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _emailFocusNode = FocusNode();
  final _isFormValidNotifier = ValueNotifier<bool>(false);

  bool _isSubmitting = false;
  bool _isSubmitted = false;

  @override
  void initState() {
    super.initState();
    _emailController.addListener(_onFormInputChanged);
  }

  @override
  void dispose() {
    _emailController.removeListener(_onFormInputChanged);
    _emailController.dispose();
    _emailFocusNode.dispose();
    _isFormValidNotifier.dispose();
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
                      FadeSlideIn(child: _ForgotHeader(theme: theme)),
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
              color: Colors.black54,
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
                          ? _primaryBlue
                          : const Color(0xFF0F172A),
                    ),
                child: const Text('Email'),
              );
            },
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: _emailController,
            focusNode: _emailFocusNode,
            enabled: !_isSubmitting,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            textCapitalization: TextCapitalization.none,
            autofillHints: const [AutofillHints.email, AutofillHints.username],
            autocorrect: false,
            enableSuggestions: false,
            style: inputTextStyle,
            onFieldSubmitted: (_) async {
              if (!_isSubmitting) {
                await _handleSubmit();
              }
            },
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
                  label: 'Gửi liên kết đặt lại',
                  loadingLabel: 'Đang gửi liên kết...',
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
              child: const Text('Quay lại đăng nhập'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessContent(ThemeData theme) {
    return Column(
      key: const ValueKey('forgot-success'),
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
              Icons.mark_email_read_outlined,
              size: 34,
              color: theme.colorScheme.primary,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Kiểm tra email',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.black54,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Vui lòng kiểm tra cả thư rác (Spam).',
          style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _handleSubmit,
            child: _isSubmitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2.5),
                  )
                : const Text('Gửi lại liên kết'),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isSubmitting
                ? null
                : () {
                    setState(() => _isSubmitted = false);
                    _onFormInputChanged();
                  },
            child: const Text('Dùng email khác'),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: TextButton(
            onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(),
            child: const Text('Quay lại đăng nhập'),
          ),
        ),
      ],
    );
  }

  InputDecoration _buildInputDecoration({required IconData icon}) {
    final baseBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
    );
    return InputDecoration(
      prefixIcon: Icon(icon),
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

    if (!_isSubmitted) {
      FocusScope.of(context).unfocus();
    }
    final isValid = _isSubmitted
        ? _isFormInputValid()
        : (_formKey.currentState?.validate() ?? false);
    if (!isValid) {
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await Future.delayed(const Duration(seconds: 2));
      if (!mounted) {
        return;
      }
      setState(() => _isSubmitted = true);
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
      _isFormValidNotifier.value = _isFormInputValid();
    }
  }

  void _onFormInputChanged() {
    _isFormValidNotifier.value = _isFormInputValid();
  }

  bool _isFormInputValid() {
    final email = _emailController.text.trim();
    return email.isNotEmpty && _isValidEmail(email);
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }
}

class _ForgotHeader extends StatelessWidget {
  const _ForgotHeader({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const BrandLogoWordmark(height: 40),
        const SizedBox(height: 16),
        Text(
          'Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu qua email.',
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
