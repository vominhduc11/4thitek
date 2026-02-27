enum LoginFailureType {
  invalidCredentials,
  invalidEmail,
  invalidPassword,
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
    this.token,
    this.failure,
  });

  final bool isSuccess;
  final String? email;
  final String? token;
  final LoginFailure? failure;

  factory LoginResult.success({required String email, required String token}) {
    return LoginResult._(isSuccess: true, email: email, token: token);
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

abstract class AuthService {
  Future<LoginResult> signIn({required String email, required String password});
}

class MockAuthService implements AuthService {
  const MockAuthService({this.latency = const Duration(milliseconds: 650)});

  final Duration latency;

  // Keep mock accounts in one place so UI does not depend on hardcoded credentials.
  static const Map<String, String> _mockAccounts = {
    'daily.hn@4thitek.vn': '123456',
    'duc123@gmail.com': '123456',
  };

  @override
  Future<LoginResult> signIn({
    required String email,
    required String password,
  }) async {
    await Future.delayed(latency);

    final normalizedEmail = email.trim().toLowerCase();
    final expectedPassword = _mockAccounts[normalizedEmail];
    if (expectedPassword == null) {
      final isKnownPassword = _mockAccounts.values.contains(password);
      if (!isKnownPassword) {
        return LoginResult.failure(
          type: LoginFailureType.invalidCredentials,
          message:
              'Email v\u00e0 m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang.',
        );
      }
      return LoginResult.failure(
        type: LoginFailureType.invalidEmail,
        message: 'Email kh\u00f4ng \u0111\u00fang.',
      );
    }
    if (expectedPassword != password) {
      return LoginResult.failure(
        type: LoginFailureType.invalidPassword,
        message: 'M\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang.',
      );
    }

    final mockToken =
        'mock_${normalizedEmail.hashCode.abs()}_${DateTime.now().millisecondsSinceEpoch}';
    return LoginResult.success(email: normalizedEmail, token: mockToken);
  }
}
