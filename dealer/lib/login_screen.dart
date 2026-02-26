import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'auth_service.dart';
import 'auth_storage.dart';
import 'forgot_password_screen.dart';
import 'home_shell.dart';
import 'widgets/brand_identity.dart';
import 'register_screen.dart';
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
  late final AuthService _authService;
  bool _obscurePassword = true;
  bool _rememberMe = false;
  bool _isLoggingIn = false;
  AutovalidateMode _autovalidateMode = AutovalidateMode.disabled;
  String? _authErrorMessage;

  @override
  void initState() {
    super.initState();
    _authService = const MockAuthService();
    _emailController.addListener(_clearAuthError);
    _passwordController.addListener(_clearAuthError);
    _loadRemembered();
  }

  @override
  void dispose() {
    _emailController.removeListener(_clearAuthError);
    _passwordController.removeListener(_clearAuthError);
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
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
                      FadeSlideIn(child: _BrandHeader(theme: theme)),
                      const SizedBox(height: 28),
                      FadeSlideIn(
                        delay: const Duration(milliseconds: 80),
                        child: _LoginCard(
                          theme: theme,
                          formKey: _formKey,
                          autovalidateMode: _autovalidateMode,
                          emailController: _emailController,
                          passwordController: _passwordController,
                          emailFocusNode: _emailFocusNode,
                          passwordFocusNode: _passwordFocusNode,
                          isLoading: _isLoggingIn,
                          obscurePassword: _obscurePassword,
                          onTogglePassword: () {
                            if (_isLoggingIn) {
                              return;
                            }
                            setState(
                              () => _obscurePassword = !_obscurePassword,
                            );
                          },
                          rememberMe: _rememberMe,
                          onRememberMeChanged: (value) {
                            if (_isLoggingIn) {
                              return;
                            }
                            setState(() => _rememberMe = value ?? false);
                          },
                          authErrorMessage: _authErrorMessage,
                          onSubmitFromKeyboard: () {
                            _handleLogin();
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
        ],
      ),
    );
  }

  Future<void> _handleLogin() async {
    if (_isLoggingIn) {
      return;
    }

    FocusScope.of(context).unfocus();
    final formState = _formKey.currentState;
    final isFormValid = formState?.validate() ?? false;
    if (!isFormValid) {
      final email = _emailController.text.trim();
      if (email.isEmpty || !_isValidEmail(email)) {
        _emailFocusNode.requestFocus();
      } else {
        _passwordFocusNode.requestFocus();
      }
      setState(() {
        _autovalidateMode = AutovalidateMode.onUserInteraction;
      });
      return;
    }

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    setState(() {
      _isLoggingIn = true;
      _authErrorMessage = null;
    });
    try {
      final result = await _authService.signIn(email: email, password: password);
      if (!mounted) {
        return;
      }
      if (!result.isSuccess) {
        _passwordFocusNode.requestFocus();
        setState(() {
          _authErrorMessage = result.failure?.message ?? 'Đăng nhập thất bại.';
        });
        return;
      }

      await _persistLogin(result.email ?? email);
      if (!mounted) {
        return;
      }

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const DealerHomeShell()),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoggingIn = false;
        });
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

  void _clearAuthError() {
    if (_authErrorMessage == null) {
      return;
    }
    setState(() => _authErrorMessage = null);
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
          'Đăng nhập để quản lý đơn nhập, công nợ và bảo hành cùng 4thitek.',
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

class _LoginCard extends StatelessWidget {
  const _LoginCard({
    required this.theme,
    required this.formKey,
    required this.autovalidateMode,
    required this.emailController,
    required this.passwordController,
    required this.emailFocusNode,
    required this.passwordFocusNode,
    required this.isLoading,
    required this.obscurePassword,
    required this.onTogglePassword,
    required this.rememberMe,
    required this.onRememberMeChanged,
    required this.authErrorMessage,
    required this.onSubmitFromKeyboard,
    required this.onLogin,
  });

  final ThemeData theme;
  final GlobalKey<FormState> formKey;
  final AutovalidateMode autovalidateMode;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final FocusNode emailFocusNode;
  final FocusNode passwordFocusNode;
  final bool isLoading;
  final bool obscurePassword;
  final VoidCallback onTogglePassword;
  final bool rememberMe;
  final ValueChanged<bool?> onRememberMeChanged;
  final String? authErrorMessage;
  final VoidCallback onSubmitFromKeyboard;
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
      child: AutofillGroup(
        child: Form(
          key: formKey,
          autovalidateMode: autovalidateMode,
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
                'Đăng nhập để xem bảng giá, tồn kho và theo dõi đơn hàng.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: Colors.black54,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 20),
              TextFormField(
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
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.mail_outline),
                ),
                validator: (value) {
                  final email = value?.trim() ?? '';
                  if (email.isEmpty) {
                    return 'Vui lòng nhập email.';
                  }
                  final isValidEmail = RegExp(
                    r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                  ).hasMatch(email);
                  if (!isValidEmail) {
                    return 'Email không hợp lệ.';
                  }
                  return null;
                },
                onFieldSubmitted: (_) => passwordFocusNode.requestFocus(),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: passwordController,
                focusNode: passwordFocusNode,
                enabled: !isLoading,
                obscureText: obscurePassword,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.password],
                autocorrect: false,
                enableSuggestions: false,
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
                validator: (value) {
                  final password = value ?? '';
                  if (password.isEmpty) {
                    return 'Vui lòng nhập mật khẩu.';
                  }
                  return null;
                },
                onFieldSubmitted: (_) => onSubmitFromKeyboard(),
              ),
              const SizedBox(height: 12),
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 12,
                runSpacing: 8,
                children: [
                  InkWell(
                    borderRadius: BorderRadius.circular(10),
                    onTap: isLoading
                        ? null
                        : () {
                            onRememberMeChanged(!rememberMe);
                          },
                    child: Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IgnorePointer(
                            child: Checkbox(
                              value: rememberMe,
                              onChanged: isLoading ? null : onRememberMeChanged,
                            ),
                          ),
                          Text(
                            'Ghi nhớ đăng nhập',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: isLoading
                        ? null
                        : () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) =>
                                    const ForgotPasswordScreen(),
                              ),
                            );
                          },
                    child: const Text('Quên mật khẩu?'),
                  ),
                ],
              ),
              if (authErrorMessage != null) ...[
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Text(
                    authErrorMessage!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFFB91C1C),
                    ),
                  ),
                ),
              ],
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
                            Text('Đang đăng nhập...'),
                          ],
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
