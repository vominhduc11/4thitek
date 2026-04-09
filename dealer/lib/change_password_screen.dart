import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'app_settings_controller.dart';
import 'auth_storage.dart';
import 'breakpoints.dart';
import 'dealer_auth_client.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _service = _ChangePasswordService();
  late final Listenable _formInputListenable;

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isSubmitting = false;

  _ChangePasswordTexts get _texts => _ChangePasswordTexts(
    isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
  );

  @override
  void initState() {
    super.initState();
    _formInputListenable = Listenable.merge([
      _currentPasswordController,
      _newPasswordController,
      _confirmPasswordController,
    ]);
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _service.dispose();
    super.dispose();
  }

  bool get _hasCurrentPassword =>
      _currentPasswordController.text.trim().isNotEmpty;
  bool get _hasNewPassword => _newPasswordController.text.trim().isNotEmpty;
  bool get _hasConfirmPassword =>
      _confirmPasswordController.text.trim().isNotEmpty;

  bool get _ruleMinLength => _newPasswordController.text.trim().length >= 8;
  bool get _ruleUppercase =>
      RegExp(r'[A-Z]').hasMatch(_newPasswordController.text.trim());
  bool get _ruleLowercase =>
      RegExp(r'[a-z]').hasMatch(_newPasswordController.text.trim());
  bool get _ruleNumber =>
      RegExp(r'\d').hasMatch(_newPasswordController.text.trim());
  bool get _ruleDifferentFromCurrent =>
      _newPasswordController.text.trim().isNotEmpty &&
      _newPasswordController.text.trim() !=
          _currentPasswordController.text.trim();
  bool get _ruleConfirmMatches =>
      _confirmPasswordController.text.isNotEmpty &&
      _confirmPasswordController.text == _newPasswordController.text;

  int get _fulfilledRuleCount {
    final rules = [
      _ruleMinLength,
      _ruleUppercase,
      _ruleLowercase,
      _ruleNumber,
      _ruleDifferentFromCurrent,
      _ruleConfirmMatches,
    ];
    return rules.where((item) => item).length;
  }

  InputDecoration _inputDecoration({
    required String labelText,
    required Widget prefixIcon,
    Widget? suffixIcon,
    String? helperText,
  }) {
    final colors = Theme.of(context).colorScheme;
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: BorderSide(
        color: colors.outlineVariant.withValues(alpha: 0.7),
      ),
    );

    return InputDecoration(
      labelText: labelText,
      helperText: helperText,
      helperMaxLines: 2,
      filled: true,
      fillColor: colors.surfaceContainerHighest.withValues(alpha: 0.22),
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      border: border,
      enabledBorder: border,
      disabledBorder: border,
      focusedBorder: border.copyWith(
        borderSide: BorderSide(color: colors.primary, width: 1.4),
      ),
      errorBorder: border.copyWith(
        borderSide: BorderSide(color: colors.error, width: 1.1),
      ),
      focusedErrorBorder: border.copyWith(
        borderSide: BorderSide(color: colors.error, width: 1.4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final texts = _texts;
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isTablet = AppBreakpoints.isTablet(context);
    final isDesktopWide = screenWidth >= 1100;
    final useTwoColumn = screenWidth >= 720;
    final contentMaxWidth = isDesktopWide
        ? 1180.0
        : isTablet
        ? 920.0
        : 720.0;

    final currentField = TextFormField(
      controller: _currentPasswordController,
      obscureText: _obscureCurrent,
      enabled: !_isSubmitting,
      autofillHints: const [AutofillHints.password],
      textInputAction: TextInputAction.next,
      decoration: _inputDecoration(
        labelText: texts.currentPasswordLabel,
        prefixIcon: const Icon(Icons.lock_outline),
        suffixIcon: IconButton(
          onPressed: _isSubmitting
              ? null
              : () => setState(() => _obscureCurrent = !_obscureCurrent),
          icon: Icon(
            _obscureCurrent
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
          ),
        ),
      ),
      validator: (value) {
        if ((value ?? '').trim().isEmpty) {
          return texts.currentPasswordRequired;
        }
        return null;
      },
    );

    final newField = TextFormField(
      controller: _newPasswordController,
      obscureText: _obscureNew,
      enabled: !_isSubmitting,
      autofillHints: const [AutofillHints.newPassword],
      textInputAction: TextInputAction.next,
      decoration: _inputDecoration(
        labelText: texts.newPasswordLabel,
        helperText: texts.passwordHelper,
        prefixIcon: const Icon(Icons.enhanced_encryption_outlined),
        suffixIcon: IconButton(
          onPressed: _isSubmitting
              ? null
              : () => setState(() => _obscureNew = !_obscureNew),
          icon: Icon(
            _obscureNew
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
          ),
        ),
      ),
      validator: (value) => _validateNewPassword(value, texts: texts),
    );

    final confirmField = TextFormField(
      controller: _confirmPasswordController,
      obscureText: _obscureConfirm,
      enabled: !_isSubmitting,
      autofillHints: const [AutofillHints.newPassword],
      textInputAction: TextInputAction.done,
      onFieldSubmitted: (_) {
        if (!_isSubmitting) {
          _handleSubmit();
        }
      },
      decoration: _inputDecoration(
        labelText: texts.confirmPasswordLabel,
        prefixIcon: const Icon(Icons.verified_user_outlined),
        suffixIcon: IconButton(
          onPressed: _isSubmitting
              ? null
              : () => setState(() => _obscureConfirm = !_obscureConfirm),
          icon: Icon(
            _obscureConfirm
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
          ),
        ),
      ),
      validator: (value) {
        if ((value ?? '').isEmpty) {
          return texts.confirmPasswordRequired;
        }
        if (value != _newPasswordController.text) {
          return texts.passwordMismatch;
        }
        return null;
      },
    );

    final formSection = RepaintBoundary(
      child: FadeSlideIn(
        child: SectionCard(
          title: texts.sectionTitle,
          padding: const EdgeInsets.all(18),
          child: AutofillGroup(
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    texts.sectionDescription,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colors.onSurfaceVariant,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 16),
                  currentField,
                  const SizedBox(height: 14),
                  if (useTwoColumn)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: newField),
                        const SizedBox(width: 14),
                        Expanded(child: confirmField),
                      ],
                    )
                  else ...[
                    newField,
                    const SizedBox(height: 14),
                    confirmField,
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );

    final bodyContent = AnimatedBuilder(
      animation: _formInputListenable,
      builder: (context, _) {
        final ruleProgressLabel = texts.ruleProgressLabel(
          _fulfilledRuleCount,
          6,
        );
        final statusLabel = _fulfilledRuleCount == 6 && _hasCurrentPassword
            ? texts.readyToSubmitLabel
            : texts.incompleteLabel;

        final heroSection = RepaintBoundary(
          child: FadeSlideIn(
            child: _ChangePasswordHeroCard(
              title: texts.heroTitle,
              subtitle: texts.heroSubtitle,
              progressLabel: ruleProgressLabel,
              statusLabel: statusLabel,
            ),
          ),
        );

        final rulesSection = RepaintBoundary(
          child: FadeSlideIn(
            delay: const Duration(milliseconds: 80),
            child: SectionCard(
              title: texts.requirementsTitle,
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    texts.requirementsSubtitle,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colors.onSurfaceVariant,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _PasswordRuleTile(
                    icon: Icons.straighten_outlined,
                    label: texts.ruleMinLength,
                    isPassed: _ruleMinLength,
                  ),
                  const SizedBox(height: 10),
                  _PasswordRuleTile(
                    icon: Icons.text_format_outlined,
                    label: texts.ruleUpperLower,
                    isPassed: _ruleUppercase && _ruleLowercase,
                  ),
                  const SizedBox(height: 10),
                  _PasswordRuleTile(
                    icon: Icons.pin_outlined,
                    label: texts.ruleNumber,
                    isPassed: _ruleNumber,
                  ),
                  const SizedBox(height: 10),
                  _PasswordRuleTile(
                    icon: Icons.compare_arrows_outlined,
                    label: texts.ruleDifferent,
                    isPassed: _ruleDifferentFromCurrent,
                  ),
                  const SizedBox(height: 10),
                  _PasswordRuleTile(
                    icon: Icons.task_alt_outlined,
                    label: texts.ruleConfirmMatch,
                    isPassed: _ruleConfirmMatches,
                  ),
                ],
              ),
            ),
          ),
        );

        final actionSection = RepaintBoundary(
          child: FadeSlideIn(
            delay: const Duration(milliseconds: 140),
            child: _ChangePasswordActionPanel(
              title: texts.actionPanelTitle,
              subtitle: texts.actionPanelSubtitle,
              progressLabel: texts.progressLabel,
              progressValue: ruleProgressLabel,
              progressFraction: _fulfilledRuleCount / 6,
              statusLabel: texts.statusLabel,
              statusValue: statusLabel,
              isReady: _fulfilledRuleCount == 6 && _hasCurrentPassword,
              currentPasswordLabel: texts.currentPasswordShortLabel,
              currentPasswordValue: _hasCurrentPassword
                  ? texts.enteredValue
                  : texts.missingValue,
              newPasswordLabel: texts.newPasswordShortLabel,
              newPasswordValue: _hasNewPassword
                  ? texts.enteredValue
                  : texts.missingValue,
              confirmPasswordLabel: texts.confirmPasswordShortLabel,
              confirmPasswordValue: _hasConfirmPassword
                  ? texts.enteredValue
                  : texts.missingValue,
              submitAction: texts.submitAction,
              isSubmitting: _isSubmitting,
              onSubmit: _handleSubmit,
            ),
          ),
        );

        if (isDesktopWide) {
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
            children: [
              heroSection,
              const SizedBox(height: 18),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 7,
                    child: Column(
                      children: [
                        formSection,
                        const SizedBox(height: 16),
                        rulesSection,
                      ],
                    ),
                  ),
                  const SizedBox(width: 18),
                  Expanded(flex: 5, child: actionSection),
                ],
              ),
            ],
          );
        }

        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          children: [
            heroSection,
            const SizedBox(height: 16),
            formSection,
            const SizedBox(height: 16),
            rulesSection,
            const SizedBox(height: 16),
            actionSection,
          ],
        );
      },
    );

    return Scaffold(
      backgroundColor: colors.surface,
      appBar: AppBar(
        title: BrandAppBarTitle(texts.screenTitle),
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: bodyContent,
        ),
      ),
    );
  }

  String? _validateNewPassword(
    String? value, {
    required _ChangePasswordTexts texts,
  }) {
    final password = (value ?? '').trim();
    if (password.isEmpty) {
      return texts.newPasswordRequired;
    }
    if (password.length < 8) {
      return texts.passwordTooShort;
    }
    if (!RegExp(r'[A-Z]').hasMatch(password) ||
        !RegExp(r'[a-z]').hasMatch(password) ||
        !RegExp(r'\d').hasMatch(password)) {
      return texts.passwordWeak;
    }
    if (password == _currentPasswordController.text.trim()) {
      return texts.passwordMustDiffer;
    }
    return null;
  }

  Future<void> _handleSubmit() async {
    final texts = _texts;
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await _service.changePassword(
        currentPassword: _currentPasswordController.text,
        newPassword: _newPasswordController.text,
      );
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(texts.successMessage)));
      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(
              resolveChangePasswordErrorMessage(
                error,
                isEnglish: texts.isEnglish,
              ),
            ),
          ),
        );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
}

String resolveChangePasswordErrorMessage(
  Object error, {
  required bool isEnglish,
}) {
  final raw = switch (error) {
    _ChangePasswordException() => error.message,
    _ => error.toString().trim(),
  };
  final normalized = raw.trim();
  if (normalized.isEmpty) {
    return isEnglish
        ? 'Unable to change password right now.'
        : 'Chưa thể đổi mật khẩu lúc này.';
  }
  final lower = normalized.toLowerCase();
  if (lower.contains('current password')) {
    return isEnglish
        ? 'The current password is incorrect.'
        : 'Mật khẩu hiện tại không đúng.';
  }
  if (lower.contains('uppercase') ||
      lower.contains('lowercase') ||
      lower.contains('at least 8 characters')) {
    return isEnglish
        ? 'The new password must be at least 8 characters and include uppercase, lowercase, and a number.'
        : 'Mật khẩu mới phải có ít nhất 8 ký tự và gồm chữ hoa, chữ thường, cùng một chữ số.';
  }
  return normalized;
}

class _ChangePasswordService {
  _ChangePasswordService({AuthStorage? authStorage, http.Client? client})
    : _authStorage = authStorage ?? AuthStorage() {
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: client ?? http.Client(),
    );
  }

  final AuthStorage _authStorage;
  late final http.Client _client;

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final token = await _authStorage.readAccessToken();
    if (token == null || token.trim().isEmpty) {
      throw const _ChangePasswordException('Unauthenticated request');
    }

    final response = await _client.patch(
      DealerApiConfig.resolveApiUri('/dealer/password'),
      headers: <String, String>{
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${token.trim()}',
      },
      body: jsonEncode(<String, String>{
        'currentPassword': currentPassword.trim(),
        'newPassword': newPassword.trim(),
      }),
    );

    final payload = _decodePayload(response.body);
    if (response.statusCode >= 400) {
      throw _ChangePasswordException(
        payload['error']?.toString().trim().isNotEmpty == true
            ? payload['error']!.toString().trim()
            : 'Unable to change password right now.',
      );
    }
  }

  Map<String, dynamic> _decodePayload(String body) {
    if (body.trim().isEmpty) {
      return const <String, dynamic>{};
    }
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    return const <String, dynamic>{};
  }

  void dispose() {
    _client.close();
  }
}

class _ChangePasswordException implements Exception {
  const _ChangePasswordException(this.message);

  final String message;

  @override
  String toString() => message;
}

class _ChangePasswordTexts {
  const _ChangePasswordTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Change password' : 'Đổi mật khẩu';
  String get sectionTitle => isEnglish ? 'Security' : 'Bảo mật';

  String get sectionDescription => isEnglish
      ? 'Enter your current password, choose a stronger replacement and confirm it before updating.'
      : 'Nhập mật khẩu hiện tại, chọn mật khẩu mạnh hơn và xác nhận lại trước khi cập nhật.';

  String get heroTitle =>
      isEnglish ? 'Protect your account' : 'Tăng cường bảo mật tài khoản';

  String get heroSubtitle => isEnglish
      ? 'Use a strong password to keep your dealer account safer across sign-in and sensitive actions.'
      : 'Sử dụng mật khẩu mạnh để bảo vệ tốt hơn tài khoản đại lý trong đăng nhập và các thao tác nhạy cảm.';

  String get currentPasswordLabel =>
      isEnglish ? 'Current password' : 'Mật khẩu hiện tại';

  String get newPasswordLabel => isEnglish ? 'New password' : 'Mật khẩu mới';

  String get confirmPasswordLabel =>
      isEnglish ? 'Confirm new password' : 'Xác nhận mật khẩu mới';

  String get passwordHelper => isEnglish
      ? 'At least 8 characters, including uppercase, lowercase, and a number.'
      : 'Ít nhất 8 ký tự, gồm chữ hoa, chữ thường và một chữ số.';

  String get currentPasswordRequired => isEnglish
      ? 'Please enter the current password.'
      : 'Vui lòng nhập mật khẩu hiện tại.';

  String get newPasswordRequired => isEnglish
      ? 'Please enter a new password.'
      : 'Vui lòng nhập mật khẩu mới.';

  String get confirmPasswordRequired => isEnglish
      ? 'Please confirm the new password.'
      : 'Vui lòng xác nhận mật khẩu mới.';

  String get passwordTooShort => isEnglish
      ? 'The new password must be at least 8 characters.'
      : 'Mật khẩu mới phải có ít nhất 8 ký tự.';

  String get passwordWeak => isEnglish
      ? 'The new password must include uppercase, lowercase, and a number.'
      : 'Mật khẩu mới phải gồm chữ hoa, chữ thường và một chữ số.';

  String get passwordMismatch => isEnglish
      ? 'The confirmation password does not match.'
      : 'Mật khẩu xác nhận không khớp.';

  String get passwordMustDiffer => isEnglish
      ? 'The new password must be different from the current password.'
      : 'Mật khẩu mới phải khác mật khẩu hiện tại.';

  String get submitAction =>
      isEnglish ? 'Update password' : 'Cập nhật mật khẩu';

  String get successMessage => isEnglish
      ? 'Password updated successfully.'
      : 'Đã cập nhật mật khẩu thành công.';

  String get requirementsTitle =>
      isEnglish ? 'Password requirements' : 'Yêu cầu mật khẩu';

  String get requirementsSubtitle => isEnglish
      ? 'Your new password should satisfy the following security rules.'
      : 'Mật khẩu mới cần đáp ứng các quy tắc bảo mật sau.';

  String get ruleMinLength =>
      isEnglish ? 'At least 8 characters' : 'Ít nhất 8 ký tự';

  String get ruleUpperLower => isEnglish
      ? 'Include uppercase and lowercase letters'
      : 'Bao gồm chữ hoa và chữ thường';

  String get ruleNumber =>
      isEnglish ? 'Include at least one number' : 'Bao gồm ít nhất một chữ số';

  String get ruleDifferent => isEnglish
      ? 'Different from current password'
      : 'Khác với mật khẩu hiện tại';

  String get ruleConfirmMatch => isEnglish
      ? 'Confirmation matches the new password'
      : 'Mật khẩu xác nhận khớp với mật khẩu mới';

  String get actionPanelTitle =>
      isEnglish ? 'Review and submit' : 'Kiểm tra và cập nhật';

  String get actionPanelSubtitle => isEnglish
      ? 'Review the form status before sending the password update request.'
      : 'Kiểm tra trạng thái biểu mẫu trước khi gửi yêu cầu cập nhật mật khẩu.';

  String get progressLabel =>
      isEnglish ? 'Security checks' : 'Điều kiện bảo mật';

  String ruleProgressLabel(int completed, int total) =>
      isEnglish ? '$completed / $total passed' : '$completed / $total đã đạt';

  String get statusLabel => isEnglish ? 'Status' : 'Trạng thái';

  String get readyToSubmitLabel =>
      isEnglish ? 'Ready to update' : 'Sẵn sàng cập nhật';

  String get incompleteLabel => isEnglish ? 'Incomplete' : 'Chưa hoàn tất';

  String get currentPasswordShortLabel =>
      isEnglish ? 'Current password' : 'Mật khẩu hiện tại';

  String get newPasswordShortLabel =>
      isEnglish ? 'New password' : 'Mật khẩu mới';

  String get confirmPasswordShortLabel =>
      isEnglish ? 'Confirmation' : 'Xác nhận';

  String get enteredValue => isEnglish ? 'Entered' : 'Đã nhập';

  String get missingValue => isEnglish ? 'Missing' : 'Chưa nhập';
}

class _ChangePasswordHeroCard extends StatelessWidget {
  const _ChangePasswordHeroCard({
    required this.title,
    required this.subtitle,
    required this.progressLabel,
    required this.statusLabel,
  });

  final String title;
  final String subtitle;
  final String progressLabel;
  final String statusLabel;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colors.surfaceContainerHigh.withValues(alpha: 0.98),
            colors.surfaceContainer.withValues(alpha: 0.94),
          ],
        ),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.55),
        ),
        boxShadow: [
          BoxShadow(
            color: colors.shadow.withValues(alpha: 0.03),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 620;
                final iconShell = Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: colors.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Icon(
                    Icons.security_outlined,
                    color: colors.onSurface,
                    size: 28,
                  ),
                );

                final header = Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: colors.onSurface,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      subtitle,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                  ],
                );

                if (compact) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [iconShell, const SizedBox(height: 14), header],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    iconShell,
                    const SizedBox(width: 16),
                    Expanded(child: header),
                  ],
                );
              },
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _HeroInfoChip(
                  icon: Icons.rule_folder_outlined,
                  label: progressLabel,
                ),
                _HeroInfoChip(
                  icon: Icons.task_alt_outlined,
                  label: statusLabel,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroInfoChip extends StatelessWidget {
  const _HeroInfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: colors.onSurfaceVariant),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _PasswordRuleTile extends StatelessWidget {
  const _PasswordRuleTile({
    required this.icon,
    required this.label,
    required this.isPassed,
  });

  final IconData icon;
  final String label;
  final bool isPassed;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final accent = isPassed ? colors.primary : colors.onSurfaceVariant;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isPassed
            ? colors.primaryContainer.withValues(alpha: 0.28)
            : colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isPassed
              ? colors.primary.withValues(alpha: 0.45)
              : colors.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isPassed ? Icons.check_circle_outline : icon,
            color: accent,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: accent,
                fontWeight: isPassed ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChangePasswordActionPanel extends StatelessWidget {
  const _ChangePasswordActionPanel({
    required this.title,
    required this.subtitle,
    required this.progressLabel,
    required this.progressValue,
    required this.progressFraction,
    required this.statusLabel,
    required this.statusValue,
    required this.isReady,
    required this.currentPasswordLabel,
    required this.currentPasswordValue,
    required this.newPasswordLabel,
    required this.newPasswordValue,
    required this.confirmPasswordLabel,
    required this.confirmPasswordValue,
    required this.submitAction,
    required this.isSubmitting,
    required this.onSubmit,
  });

  final String title;
  final String subtitle;
  final String progressLabel;
  final String progressValue;
  final double progressFraction;
  final String statusLabel;
  final String statusValue;
  final bool isReady;
  final String currentPasswordLabel;
  final String currentPasswordValue;
  final String newPasswordLabel;
  final String newPasswordValue;
  final String confirmPasswordLabel;
  final String confirmPasswordValue;
  final String submitAction;
  final bool isSubmitting;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final clampedProgress = progressFraction.clamp(0.0, 1.0).toDouble();

    return SectionCard(
      title: title,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              color: colors.surfaceContainerLow,
              border: Border.all(
                color: colors.outlineVariant.withValues(alpha: 0.5),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ActionSummaryRow(label: progressLabel, value: progressValue),
                const SizedBox(height: 10),
                _ActionSummaryRow(label: statusLabel, value: statusValue),
                const SizedBox(height: 14),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: clampedProgress,
                    minHeight: 8,
                    backgroundColor: colors.surface.withValues(alpha: 0.55),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isReady ? colors.primary : colors.secondary,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isReady
                        ? colors.primaryContainer.withValues(alpha: 0.72)
                        : colors.surface.withValues(alpha: 0.72),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: isReady
                          ? colors.primary.withValues(alpha: 0.36)
                          : colors.outlineVariant.withValues(alpha: 0.4),
                    ),
                  ),
                  child: Text(
                    statusValue,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: isReady
                          ? colors.onPrimaryContainer
                          : colors.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          _ActionSummaryRow(
            label: currentPasswordLabel,
            value: currentPasswordValue,
          ),
          const SizedBox(height: 10),
          _ActionSummaryRow(label: newPasswordLabel, value: newPasswordValue),
          const SizedBox(height: 10),
          _ActionSummaryRow(
            label: confirmPasswordLabel,
            value: confirmPasswordValue,
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: isSubmitting ? null : onSubmit,
              icon: isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2.4),
                    )
                  : const Icon(Icons.lock_reset_outlined),
              label: Text(submitAction),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionSummaryRow extends StatelessWidget {
  const _ActionSummaryRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return LayoutBuilder(
      builder: (context, constraints) {
        final shouldStack = constraints.maxWidth < 260;
        if (shouldStack) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                value,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          );
        }

        return Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.onSurfaceVariant,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Flexible(
              child: Text(
                value,
                textAlign: TextAlign.right,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        );
      },
    );
  }
}
