import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'app_settings_controller.dart';
import 'auth_storage.dart';
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

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _isSubmitting = false;

  _ChangePasswordTexts get _texts => _ChangePasswordTexts(
    isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
  );

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    _service.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final texts = _texts;
    return Scaffold(
      appBar: AppBar(title: BrandAppBarTitle(texts.screenTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          FadeSlideIn(
            child: SectionCard(
              title: texts.sectionTitle,
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      texts.sectionDescription,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _currentPasswordController,
                      obscureText: _obscureCurrent,
                      enabled: !_isSubmitting,
                      decoration: InputDecoration(
                        labelText: texts.currentPasswordLabel,
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          onPressed: _isSubmitting
                              ? null
                              : () => setState(
                                  () => _obscureCurrent = !_obscureCurrent,
                                ),
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
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _newPasswordController,
                      obscureText: _obscureNew,
                      enabled: !_isSubmitting,
                      decoration: InputDecoration(
                        labelText: texts.newPasswordLabel,
                        helperText: texts.passwordHelper,
                        prefixIcon: const Icon(
                          Icons.enhanced_encryption_outlined,
                        ),
                        suffixIcon: IconButton(
                          onPressed: _isSubmitting
                              ? null
                              : () =>
                                    setState(() => _obscureNew = !_obscureNew),
                          icon: Icon(
                            _obscureNew
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                          ),
                        ),
                      ),
                      validator: (value) =>
                          _validateNewPassword(value, texts: texts),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _confirmPasswordController,
                      obscureText: _obscureConfirm,
                      enabled: !_isSubmitting,
                      decoration: InputDecoration(
                        labelText: texts.confirmPasswordLabel,
                        prefixIcon: const Icon(Icons.verified_user_outlined),
                        suffixIcon: IconButton(
                          onPressed: _isSubmitting
                              ? null
                              : () => setState(
                                  () => _obscureConfirm = !_obscureConfirm,
                                ),
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
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _handleSubmit,
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                ),
                              )
                            : Text(texts.submitAction),
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
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(texts.successMessage)));
      Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
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
      Uri.parse(DealerApiConfig.resolveUrl('/api/v1/dealer/password')),
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
      ? 'Use a strong password to keep your dealer account safe.'
      : 'Hãy dùng mật khẩu mạnh để bảo vệ tài khoản đại lý.';
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
}
