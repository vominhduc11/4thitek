import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'api_config.dart';

enum AuthMessageCode {
  apiNotConfigured,
  loginSessionUnavailable,
  requestTimeout,
  serverUnavailable,
  requestFailed,
  passwordResetLinkSent,
}

const String _authMessageTokenPrefix = 'auth.message.';

String authServiceMessageToken(AuthMessageCode code) =>
    '$_authMessageTokenPrefix${code.name}';

String resolveAuthServiceMessage(String? message, {required bool isEnglish}) {
  final normalized = message?.trim();
  if (normalized == null || normalized.isEmpty) {
    return isEnglish ? 'Request failed.' : 'Yêu cầu thất bại.';
  }

  switch (normalized) {
    case 'auth.message.apiNotConfigured':
      return isEnglish
          ? 'API base URL is not configured for the dealer app.'
          : 'Chưa cấu hình API_BASE_URL cho dealer app.';
    case 'auth.message.loginSessionUnavailable':
      return isEnglish
          ? 'Unable to create a login session.'
          : 'Không thể tạo phiên đăng nhập.';
    case 'auth.message.requestTimeout':
      return isEnglish
          ? 'The request timed out. Please try again.'
          : 'Yêu cầu hết thời gian. Vui lòng thử lại.';
    case 'auth.message.serverUnavailable':
      return isEnglish
          ? 'Unable to connect to the server. Please try again.'
          : 'Không thể kết nối máy chủ. Vui lòng thử lại.';
    case 'auth.message.requestFailed':
      return isEnglish ? 'Request failed.' : 'Yêu cầu thất bại.';
    case 'auth.message.passwordResetLinkSent':
      return isEnglish
          ? 'If the email exists in our system, a password reset link has been sent.'
          : 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại.';
    default:
      return normalized;
  }
}

enum LoginFailureType {
  invalidCredentials,
  invalidEmail,
  invalidPassword,
  conflict,
  network,
  unknown,
}

class LoginFailure {
  const LoginFailure({required this.type, required this.message});

  final LoginFailureType type;
  final String message;
}

class LoginResult {
  const LoginResult._({
    required this.isSuccess,
    this.email,
    this.accessToken,
    this.refreshToken,
    this.failure,
  });

  final bool isSuccess;
  final String? email;
  final String? accessToken;
  final String? refreshToken;
  final LoginFailure? failure;

  factory LoginResult.success({
    required String email,
    required String accessToken,
    String? refreshToken,
  }) {
    return LoginResult._(
      isSuccess: true,
      email: email,
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  factory LoginResult.failure({
    required LoginFailureType type,
    required String message,
  }) {
    return LoginResult._(
      isSuccess: false,
      failure: LoginFailure(type: type, message: message),
    );
  }
}

class PasswordResetRequestResult {
  const PasswordResetRequestResult._({
    required this.isSuccess,
    this.message,
    this.failure,
  });

  final bool isSuccess;
  final String? message;
  final LoginFailure? failure;

  factory PasswordResetRequestResult.success({String? message}) {
    return PasswordResetRequestResult._(isSuccess: true, message: message);
  }

  factory PasswordResetRequestResult.failure({
    required LoginFailureType type,
    required String message,
  }) {
    return PasswordResetRequestResult._(
      isSuccess: false,
      failure: LoginFailure(type: type, message: message),
    );
  }
}

abstract class AuthService {
  Future<LoginResult> signIn({required String email, required String password});

  Future<PasswordResetRequestResult> requestPasswordReset({
    required String email,
  });
}

class RemoteAuthService implements AuthService {
  RemoteAuthService({
    http.Client? client,
    this.timeout = const Duration(seconds: 12),
  }) : _client = client ?? http.Client();

  final http.Client _client;
  final Duration timeout;

  @override
  Future<LoginResult> signIn({
    required String email,
    required String password,
  }) async {
    if (!DealerApiConfig.isConfigured) {
      return LoginResult.failure(
        type: LoginFailureType.network,
        message: authServiceMessageToken(AuthMessageCode.apiNotConfigured),
      );
    }
    try {
      final response = await _client
          .post(
            DealerApiConfig.authLoginUri,
            headers: DealerApiConfig.jsonHeaders,
            body: jsonEncode(<String, String>{
              'username': email.trim().toLowerCase(),
              'password': password,
            }),
          )
          .timeout(timeout);

      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        return LoginResult.failure(
          type: _mapFailureType(response.statusCode),
          message: _extractErrorMessage(payload),
        );
      }

      final data = _extractDataMap(payload);
      final accessToken = data['accessToken']?.toString() ?? '';
      final refreshToken = data['refreshToken']?.toString();
      final userMap = data['user'] is Map<String, dynamic>
          ? data['user'] as Map<String, dynamic>
          : const <String, dynamic>{};
      final username =
          userMap['username']?.toString() ?? email.trim().toLowerCase();

      if (accessToken.isEmpty) {
        return LoginResult.failure(
          type: LoginFailureType.unknown,
          message: authServiceMessageToken(
            AuthMessageCode.loginSessionUnavailable,
          ),
        );
      }

      return LoginResult.success(
        email: username,
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
    } on TimeoutException {
      return LoginResult.failure(
        type: LoginFailureType.network,
        message: authServiceMessageToken(AuthMessageCode.requestTimeout),
      );
    } on Exception {
      return LoginResult.failure(
        type: LoginFailureType.network,
        message: authServiceMessageToken(AuthMessageCode.serverUnavailable),
      );
    }
  }

  @override
  Future<PasswordResetRequestResult> requestPasswordReset({
    required String email,
  }) async {
    if (!DealerApiConfig.isConfigured) {
      return PasswordResetRequestResult.failure(
        type: LoginFailureType.network,
        message: authServiceMessageToken(AuthMessageCode.apiNotConfigured),
      );
    }
    try {
      final response = await _client
          .post(
            DealerApiConfig.resolveApiUri('/auth/forgot-password'),
            headers: DealerApiConfig.jsonHeaders,
            body: jsonEncode(<String, String>{
              'email': email.trim().toLowerCase(),
            }),
          )
          .timeout(timeout);

      final payload = _decodeBody(response.body);
      if (response.statusCode >= 400) {
        return PasswordResetRequestResult.failure(
          type: _mapFailureType(response.statusCode),
          message: _extractErrorMessage(payload),
        );
      }

      return PasswordResetRequestResult.success(
        message: _extractSuccessMessage(
          payload,
          authServiceMessageToken(AuthMessageCode.passwordResetLinkSent),
        ),
      );
    } on TimeoutException {
      return PasswordResetRequestResult.failure(
        type: LoginFailureType.network,
        message: authServiceMessageToken(AuthMessageCode.requestTimeout),
      );
    } on Exception {
      return PasswordResetRequestResult.failure(
        type: LoginFailureType.network,
        message: authServiceMessageToken(AuthMessageCode.serverUnavailable),
      );
    }
  }

  Map<String, dynamic> _decodeBody(String body) {
    if (body.trim().isEmpty) {
      return const <String, dynamic>{};
    }
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    return const <String, dynamic>{};
  }

  Map<String, dynamic> _extractDataMap(Map<String, dynamic> payload) {
    final raw = payload['data'];
    if (raw is Map<String, dynamic>) {
      return raw;
    }
    return const <String, dynamic>{};
  }

  String _extractErrorMessage(Map<String, dynamic> payload) {
    final error = payload['error']?.toString();
    if (error != null && error.trim().isNotEmpty) {
      return error.trim();
    }
    return authServiceMessageToken(AuthMessageCode.requestFailed);
  }

  String _extractSuccessMessage(Map<String, dynamic> payload, String fallback) {
    final data = payload['data']?.toString();
    if (data != null && data.trim().isNotEmpty) {
      return data.trim();
    }
    return fallback;
  }

  LoginFailureType _mapFailureType(int statusCode) {
    if (statusCode == 400 || statusCode == 401) {
      return LoginFailureType.invalidCredentials;
    }
    if (statusCode == 409) {
      return LoginFailureType.conflict;
    }
    if (statusCode >= 500) {
      return LoginFailureType.network;
    }
    return LoginFailureType.unknown;
  }
}
