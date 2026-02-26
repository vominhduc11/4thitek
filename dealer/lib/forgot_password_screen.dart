import 'package:flutter/material.dart';

import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  bool _isSubmitting = false;
  bool _isSubmitted = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
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
            child: Center(
              child: SingleChildScrollView(
                keyboardDismissBehavior:
                    ScrollViewKeyboardDismissBehavior.onDrag,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 32,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      FadeSlideIn(child: _ForgotHeader(theme: theme)),
                      const SizedBox(height: 22),
                      FadeSlideIn(
                        delay: const Duration(milliseconds: 80),
                        child: Container(
                          padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 28,
                                offset: const Offset(0, 16),
                              ),
                            ],
                          ),
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 250),
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
          if (_isSubmitting) const _ForgotLoadingOverlay(),
        ],
      ),
    );
  }

  Widget _buildFormContent(ThemeData theme) {
    return Column(
      key: const ValueKey('forgot-form'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '\u0110\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Nh\u1eadp email \u0111\u0103ng k\u00fd \u0111\u1ec3 nh\u1eadn li\u00ean k\u1ebft \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.black54,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 20),
        TextField(
          controller: _emailController,
          enabled: !_isSubmitting,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) async {
            if (!_isSubmitting) {
              await _handleSubmit();
            }
          },
          decoration: const InputDecoration(
            labelText: 'Email',
            prefixIcon: Icon(Icons.mail_outline),
          ),
        ),
        const SizedBox(height: 16),
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
                : const Text(
                    'G\u1eedi li\u00ean k\u1ebft \u0111\u1eb7t l\u1ea1i',
                  ),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: TextButton(
            onPressed: _isSubmitting
                ? null
                : () {
                    Navigator.of(context).pop();
                  },
            child: const Text('Quay l\u1ea1i \u0111\u0103ng nh\u1eadp'),
          ),
        ),
      ],
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
          'Ki\u1ec3m tra email',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'N\u1ebfu email t\u1ed3n t\u1ea1i trong h\u1ec7 th\u1ed1ng, ch\u00fang t\u00f4i \u0111\u00e3 g\u1eedi li\u00ean k\u1ebft \u0111\u1eb7t l\u1ea1i.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.black54,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Vui l\u00f2ng ki\u1ec3m tra c\u1ea3 th\u01b0 r\u00e1c (Spam).',
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
                : const Text('G\u1eedi l\u1ea1i li\u00ean k\u1ebft'),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isSubmitting
                ? null
                : () {
                    setState(() => _isSubmitted = false);
                  },
            child: const Text('D\u00f9ng email kh\u00e1c'),
          ),
        ),
        const SizedBox(height: 10),
        Center(
          child: TextButton(
            onPressed: _isSubmitting
                ? null
                : () {
                    Navigator.of(context).pop();
                  },
            child: const Text('Quay l\u1ea1i \u0111\u0103ng nh\u1eadp'),
          ),
        ),
      ],
    );
  }

  Future<void> _handleSubmit() async {
    if (_isSubmitting) {
      return;
    }

    final email = _emailController.text.trim();
    if (email.isEmpty) {
      _showSnackBar('Vui l\u00f2ng nh\u1eadp email.');
      return;
    }
    if (!_isValidEmail(email)) {
      _showSnackBar('Email kh\u00f4ng h\u1ee3p l\u1ec7.');
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
    }
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
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
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: Colors.white.withValues(alpha: 0.18),
            border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              BrandLogoIcon(size: 40),
              SizedBox(width: 12),
              BrandLogoWordmark(height: 30),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Text(
          'Qu\u00ean m\u1eadt kh\u1ea9u',
          style: theme.textTheme.headlineMedium?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 10),
        Text(
          'Ch\u00fang t\u00f4i s\u1ebd g\u1eedi h\u01b0\u1edbng d\u1eabn \u0111\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u qua email.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.white,
            shadows: const [
              Shadow(
                color: Color(0x55000000),
                blurRadius: 8,
                offset: Offset(0, 1),
              ),
            ],
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

class _ForgotLoadingOverlay extends StatelessWidget {
  const _ForgotLoadingOverlay();

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: ColoredBox(
        color: const Color(0x66000000),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(strokeWidth: 2.8),
                ),
                SizedBox(height: 12),
                Text(
                  '\u0110ang g\u1eedi li\u00ean k\u1ebft \u0111\u1eb7t l\u1ea1i...',
                ),
              ],
            ),
          ),
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
