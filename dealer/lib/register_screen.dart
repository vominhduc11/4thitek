import 'package:flutter/material.dart';

import 'widgets/fade_slide_in.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _agencyController = TextEditingController();
  final _taxCodeController = TextEditingController();
  final _contactController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _agreedToTerms = false;
  bool _isSubmitting = false;
  bool _isSubmitted = false;
  String _submittedEmail = '';

  @override
  void dispose() {
    _agencyController.dispose();
    _taxCodeController.dispose();
    _contactController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
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
            child: _GlowOrb(
              size: 220,
              color: Color(0x66FFFFFF),
            ),
          ),
          const Positioned(
            left: -60,
            bottom: -30,
            child: _GlowOrb(
              size: 200,
              color: Color(0x33FFFFFF),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 32,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      FadeSlideIn(child: _RegisterHeader(theme: theme)),
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
          if (_isSubmitting) const _RegisterLoadingOverlay(),
        ],
      ),
    );
  }

  Widget _buildFormContent(ThemeData theme) {
    return Column(
      key: const ValueKey('register-form'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Th\u00f4ng tin \u0111\u1ea1i l\u00fd',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _agencyController,
          enabled: !_isSubmitting,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(
            labelText: 'T\u00ean \u0111\u1ea1i l\u00fd',
            prefixIcon: Icon(Icons.storefront_outlined),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _taxCodeController,
          enabled: !_isSubmitting,
          textInputAction: TextInputAction.next,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'M\u00e3 s\u1ed1 thu\u1ebf (n\u1ebfu c\u00f3)',
            prefixIcon: Icon(Icons.badge_outlined),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'Th\u00f4ng tin li\u00ean h\u1ec7',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _contactController,
          enabled: !_isSubmitting,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(
            labelText: 'H\u1ecd v\u00e0 t\u00ean ng\u01b0\u1eddi li\u00ean h\u1ec7',
            prefixIcon: Icon(Icons.person_outline),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _phoneController,
          enabled: !_isSubmitting,
          textInputAction: TextInputAction.next,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _emailController,
          enabled: !_isSubmitting,
          textInputAction: TextInputAction.next,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Email',
            prefixIcon: Icon(Icons.mail_outline),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          '\u0110\u1ecba ch\u1ec9',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _addressController,
          enabled: !_isSubmitting,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(
            labelText: '\u0110\u1ecba ch\u1ec9',
            prefixIcon: Icon(Icons.location_on_outlined),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _cityController,
          enabled: !_isSubmitting,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(
            labelText: 'T\u1ec9nh/Th\u00e0nh ph\u1ed1',
            prefixIcon: Icon(Icons.map_outlined),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'T\u00e0i kho\u1ea3n',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _passwordController,
          enabled: !_isSubmitting,
          obscureText: _obscurePassword,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: 'M\u1eadt kh\u1ea9u',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              onPressed: _isSubmitting
                  ? null
                  : () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
              icon: Icon(
                _obscurePassword
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
              ),
            ),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _confirmController,
          enabled: !_isSubmitting,
          obscureText: _obscureConfirm,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) async {
            if (!_isSubmitting) {
              await _handleSubmit();
            }
          },
          decoration: InputDecoration(
            labelText: 'X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              onPressed: _isSubmitting
                  ? null
                  : () {
                      setState(() {
                        _obscureConfirm = !_obscureConfirm;
                      });
                    },
              icon: Icon(
                _obscureConfirm
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Checkbox(
              value: _agreedToTerms,
              onChanged: _isSubmitting
                  ? null
                  : (value) {
                      setState(() {
                        _agreedToTerms = value ?? false;
                      });
                    },
            ),
            Expanded(
              child: Text(
                'T\u00f4i \u0111\u1ed3ng \u00fd v\u1edbi \u0111i\u1ec1u kho\u1ea3n \u0111\u0103ng k\u00fd \u0111\u1ea1i l\u00fd.',
                style: theme.textTheme.bodyMedium,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
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
                : const Text('G\u1eedi \u0111\u0103ng k\u00fd'),
          ),
        ),
        const SizedBox(height: 14),
        Center(
          child: TextButton(
            onPressed: _isSubmitting
                ? null
                : () {
                    Navigator.of(context).pop();
                  },
            child: const Text('\u0110\u00e3 c\u00f3 t\u00e0i kho\u1ea3n? \u0110\u0103ng nh\u1eadp'),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessContent(ThemeData theme) {
    return Column(
      key: const ValueKey('register-success'),
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
              Icons.verified_outlined,
              size: 34,
              color: theme.colorScheme.primary,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Y\u00eau c\u1ea7u \u0111\u0103ng k\u00fd \u0111\u00e3 g\u1eedi',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '4thitek s\u1ebd x\u00e1c minh th\u00f4ng tin v\u00e0 li\u00ean h\u1ec7 l\u1ea1i trong th\u1eddi gian s\u1edbm nh\u1ea5t.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: Colors.black54,
            height: 1.5,
          ),
        ),
        if (_submittedEmail.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            'Email \u0111\u0103ng k\u00fd: $_submittedEmail',
            style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54),
          ),
        ],
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _startNewRegistration,
            child: const Text('G\u1eedi \u0111\u0103ng k\u00fd m\u1edbi'),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
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

  void _startNewRegistration() {
    setState(() {
      _isSubmitted = false;
      _submittedEmail = '';
      _agencyController.clear();
      _taxCodeController.clear();
      _contactController.clear();
      _phoneController.clear();
      _emailController.clear();
      _addressController.clear();
      _cityController.clear();
      _passwordController.clear();
      _confirmController.clear();
      _agreedToTerms = false;
      _obscurePassword = true;
      _obscureConfirm = true;
    });
  }

  Future<void> _handleSubmit() async {
    if (_isSubmitting) {
      return;
    }

    final agency = _agencyController.text.trim();
    final contact = _contactController.text.trim();
    final phone = _phoneController.text.trim();
    final email = _emailController.text.trim();
    final address = _addressController.text.trim();
    final city = _cityController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    if (agency.isEmpty ||
        contact.isEmpty ||
        phone.isEmpty ||
        email.isEmpty ||
        address.isEmpty ||
        city.isEmpty ||
        password.isEmpty ||
        confirm.isEmpty) {
      _showSnackBar('Vui l\u00f2ng nh\u1eadp \u0111\u1ea7y \u0111\u1ee7 th\u00f4ng tin b\u1eaft bu\u1ed9c.');
      return;
    }
    if (!_agreedToTerms) {
      _showSnackBar('Vui l\u00f2ng \u0111\u1ed3ng \u00fd v\u1edbi \u0111i\u1ec1u kho\u1ea3n \u0111\u0103ng k\u00fd.');
      return;
    }
    if (!_isValidEmail(email)) {
      _showSnackBar('Email kh\u00f4ng h\u1ee3p l\u1ec7.');
      return;
    }
    if (!_isValidPhone(phone)) {
      _showSnackBar('S\u1ed1 \u0111i\u1ec7n tho\u1ea1i kh\u00f4ng h\u1ee3p l\u1ec7.');
      return;
    }
    if (password.length < 6) {
      _showSnackBar('M\u1eadt kh\u1ea9u c\u1ea7n t\u1ed1i thi\u1ec3u 6 k\u00fd t\u1ef1.');
      return;
    }
    if (password != confirm) {
      _showSnackBar('M\u1eadt kh\u1ea9u x\u00e1c nh\u1eadn kh\u00f4ng kh\u1edbp.');
      return;
    }

    setState(() => _isSubmitting = true);
    var shouldResetLoading = true;
    try {
      await Future.delayed(const Duration(seconds: 2));
      if (!mounted) {
        return;
      }

      shouldResetLoading = false;
      setState(() {
        _isSubmitting = false;
        _isSubmitted = true;
        _submittedEmail = email;
      });
    } finally {
      if (mounted && shouldResetLoading) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  bool _isValidPhone(String phone) {
    return RegExp(r'^[0-9+\s-]{8,}$').hasMatch(phone);
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

class _RegisterHeader extends StatelessWidget {
  const _RegisterHeader({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: Colors.white.withValues(alpha: 0.18),
            border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
          ),
          child: const Icon(
            Icons.how_to_reg_outlined,
            color: Colors.white,
            size: 28,
          ),
        ),
        const SizedBox(height: 18),
        Text(
          '\u0110\u0103ng k\u00fd \u0111\u1ea1i l\u00fd',
          style: theme.textTheme.headlineMedium?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'Ho\u00e0n t\u1ea5t th\u00f4ng tin \u0111\u1ec3 \u0111\u1ed9i ng\u0169 4thitek duy\u1ec7t v\u00e0 k\u00edch ho\u1ea1t t\u00e0i kho\u1ea3n.',
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
        ),
      ],
    );
  }
}

class _RegisterLoadingOverlay extends StatelessWidget {
  const _RegisterLoadingOverlay();

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
                Text('\u0110ang g\u1eedi \u0111\u0103ng k\u00fd...'),
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
