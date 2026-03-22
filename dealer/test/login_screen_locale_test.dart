import 'package:dealer_hub/auth_service.dart';
import 'package:dealer_hub/login_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Login screen renders English copy', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(_buildApp(const Locale('en')));
    await tester.pumpAndSettle();

    expect(find.text('Dealer sign in'), findsOneWidget);
    expect(find.text('Remember email'), findsOneWidget);
    expect(find.text('Forgot password?'), findsWidgets);
    expect(find.text('Sign in'), findsOneWidget);
  });

  testWidgets('Login screen renders Vietnamese copy', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(_buildApp(const Locale('vi')));
    await tester.pumpAndSettle();

    expect(find.text('Dang nhap dai ly'), findsOneWidget);
    expect(find.text('Ghi nho email'), findsOneWidget);
    expect(find.text('Quen mat khau?'), findsWidgets);
    expect(find.text('Dang nhap'), findsOneWidget);
  });

  testWidgets('Login screen localizes auth service error in English', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(
      _buildApp(
        const Locale('en'),
        authService: _FakeAuthService(
          loginResult: LoginResult.failure(
            type: LoginFailureType.network,
            message: authServiceMessageToken(
              AuthMessageCode.serverUnavailable,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byType(TextFormField).at(0),
      'dealer@example.com',
    );
    await tester.enterText(find.byType(TextFormField).at(1), 'secret1');
    await tester.pumpAndSettle();
    await tester.tap(find.byType(ElevatedButton).first);
    await tester.pumpAndSettle();

    expect(
      find.text('Unable to connect to the server. Please try again.'),
      findsOneWidget,
    );
  });

  testWidgets('Login screen localizes auth service error in Vietnamese', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(
      _buildApp(
        const Locale('vi'),
        authService: _FakeAuthService(
          loginResult: LoginResult.failure(
            type: LoginFailureType.network,
            message: authServiceMessageToken(
              AuthMessageCode.serverUnavailable,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byType(TextFormField).at(0),
      'dealer@example.com',
    );
    await tester.enterText(find.byType(TextFormField).at(1), 'secret1');
    await tester.pumpAndSettle();
    await tester.tap(find.byType(ElevatedButton).first);
    await tester.pumpAndSettle();

    expect(
      find.text('Khong the ket noi may chu. Vui long thu lai.'),
      findsOneWidget,
    );
  });
}

Widget _buildApp(Locale locale, {AuthService? authService}) {
  return MaterialApp(
    locale: locale,
    supportedLocales: const <Locale>[Locale('vi'), Locale('en')],
    localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ],
    home: LoginScreen(authService: authService),
  );
}

class _FakeAuthService implements AuthService {
  _FakeAuthService({this.loginResult});

  final LoginResult? loginResult;

  @override
  Future<LoginResult> signIn({
    required String email,
    required String password,
  }) async {
    return loginResult ??
        LoginResult.failure(
          type: LoginFailureType.unknown,
          message: 'unexpected',
        );
  }

  @override
  Future<PasswordResetRequestResult> requestPasswordReset({
    required String email,
  }) async {
    throw UnimplementedError();
  }
}
