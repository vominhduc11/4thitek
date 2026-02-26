enum LoginFailureType { invalidCredentials, network, unknown }

class LoginFailure {
  const LoginFailure({required this.type, required this.message});

  final LoginFailureType type;
  final String message;
}

class LoginResult {
  const LoginResult._({required this.isSuccess, this.email, this.failure});

  final bool isSuccess;
  final String? email;
  final LoginFailure? failure;

  factory LoginResult.success({required String email}) {
    return LoginResult._(isSuccess: true, email: email);
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
    final isValidAccount =
        expectedPassword != null && expectedPassword == password;

    if (!isValidAccount) {
      return LoginResult.failure(
        type: LoginFailureType.invalidCredentials,
        message: 'Email hoặc mật khẩu không đúng.',
      );
    }

    return LoginResult.success(email: normalizedEmail);
  }
}
