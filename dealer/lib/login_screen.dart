import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'auth_storage.dart';
import 'forgot_password_screen.dart';
import 'home_shell.dart';
import 'register_screen.dart';
import 'widgets/fade_slide_in.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _rememberMe = true;
  bool _isLoggingIn = false;

  @override
  void initState() {
    super.initState();
    _loadRemembered();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
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
                      FadeSlideIn(child: _BrandHeader(theme: theme)),
                      const SizedBox(height: 28),
                      FadeSlideIn(
                        delay: const Duration(milliseconds: 80),
                        child: _LoginCard(
                          theme: theme,
                          emailController: _emailController,
                          passwordController: _passwordController,
                          isLoading: _isLoggingIn,
                          obscurePassword: _obscurePassword,
                          onTogglePassword: () {
                            if (_isLoggingIn) {
                              return;
                            }
                            setState(() => _obscurePassword = !_obscurePassword);
                          },
                          rememberMe: _rememberMe,
                          onRememberMeChanged: (value) {
                            if (_isLoggingIn) {
                              return;
                            }
                            setState(() => _rememberMe = value ?? false);
                          },
                          onLogin: _handleLogin,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (_isLoggingIn) const _LoginLoadingOverlay(),
        ],
      ),
    );
  }

  Future<void> _handleLogin() async {
    if (_isLoggingIn) {
      return;
    }

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      _showSnackBar('Vui lòng nhập email và mật khẩu.');
      return;
    }
    if (!_isValidEmail(email)) {
      _showSnackBar('Email không hợp lệ.');
      return;
    }

    const demoEmail = 'duc123@gmail.com';
    const demoPassword = '123456';
    if (email != demoEmail || password != demoPassword) {
      _showSnackBar('Email hoặc mật khẩu không đúng.');
      return;
    }

    setState(() => _isLoggingIn = true);
    var shouldResetLoading = true;
    try {
      await Future.delayed(const Duration(seconds: 2));
      await _persistLogin(email);
      if (!mounted) {
        return;
      }

      shouldResetLoading = false;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => const DealerHomeShell(),
        ),
      );
    } finally {
      if (mounted && shouldResetLoading) {
        setState(() => _isLoggingIn = false);
      }
    }
  }

  Future<void> _loadRemembered() async {
    final prefs = await SharedPreferences.getInstance();
    final remember = prefs.getBool(rememberMeKey) ?? false;
    final email = prefs.getString(rememberEmailKey) ?? '';

    if (!mounted) {
      return;
    }

    setState(() {
      _rememberMe = remember;
      if (remember && email.isNotEmpty) {
        _emailController.text = email;
      } else {
        _emailController.clear();
      }
    });
  }

  Future<void> _persistLogin(String email) async {
    final prefs = await SharedPreferences.getInstance();
    if (_rememberMe) {
      await prefs.setBool(rememberMeKey, true);
      await prefs.setBool(loggedInKey, true);
      await prefs.setString(rememberEmailKey, email);
    } else {
      await prefs.setBool(rememberMeKey, false);
      await prefs.remove(loggedInKey);
      await prefs.remove(rememberEmailKey);
    }
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}

class _BrandHeader extends StatelessWidget {
  const _BrandHeader({required this.theme});

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
            Icons.storefront_outlined,
            color: Colors.white,
            size: 28,
          ),
        ),
        const SizedBox(height: 18),
        Text(
          'Đăng nhập để mua sỉ tai nghe SCS trực tiếp từ nhà phân phối 4thitek.',
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

class _LoginCard extends StatelessWidget {
  const _LoginCard({
    required this.theme,
    required this.emailController,
    required this.passwordController,
    required this.isLoading,
    required this.obscurePassword,
    required this.onTogglePassword,
    required this.rememberMe,
    required this.onRememberMeChanged,
    required this.onLogin,
  });

  final ThemeData theme;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final bool isLoading;
  final bool obscurePassword;
  final VoidCallback onTogglePassword;
  final bool rememberMe;
  final ValueChanged<bool?> onRememberMeChanged;
  final Future<void> Function() onLogin;

  @override
  Widget build(BuildContext context) {
    return Container(
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Đăng nhập đại lý',
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Đăng nhập để xem giá sỉ, tồn kho và đặt hàng tai nghe SCS.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.black54,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: emailController,
            enabled: !isLoading,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.mail_outline),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: passwordController,
            enabled: !isLoading,
            obscureText: obscurePassword,
            textInputAction: TextInputAction.done,
            decoration: InputDecoration(
              labelText: 'Mật khẩu',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                onPressed: isLoading ? null : onTogglePassword,
                icon: Icon(
                  obscurePassword
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 8,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Checkbox(
                    value: rememberMe,
                    onChanged: isLoading ? null : onRememberMeChanged,
                  ),
                  Text(
                    'Ghi nhớ đăng nhập',
                    style: theme.textTheme.bodyMedium,
                  ),
                ],
              ),
              TextButton(
                onPressed: isLoading
                    ? null
                    : () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => const ForgotPasswordScreen(),
                          ),
                        );
                      },
                child: const Text('Quên mật khẩu?'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isLoading
                  ? null
                  : () async {
                      await onLogin();
                    },
              child: isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2.5),
                    )
                  : const Text('Đăng nhập'),
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: TextButton(
              onPressed: isLoading
                  ? null
                  : () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const RegisterScreen(),
                        ),
                      );
                    },
              child: Text.rich(
                TextSpan(
                  text: 'Chưa có tài khoản? ',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: Colors.black54,
                  ),
                  children: [
                    TextSpan(
                      text: 'Đăng ký đại lý',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

}

class _LoginLoadingOverlay extends StatelessWidget {
  const _LoginLoadingOverlay();

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
                Text('\u0110ang \u0111\u0103ng nh\u1eadp...'),
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
