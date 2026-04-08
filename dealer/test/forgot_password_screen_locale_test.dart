import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/auth_service.dart';
import 'package:dealer_hub/forgot_password_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Forgot password screen localizes auth service error in English', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(
      await _buildApp(
        const Locale('en'),
        authService: _FakeAuthService(
          resetResult: PasswordResetRequestResult.failure(
            type: LoginFailureType.network,
            message: authServiceMessageToken(
              AuthMessageCode.serverUnavailable,
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField), 'dealer@example.com');
    await tester.pumpAndSettle();
    await tester.tap(find.byType(ElevatedButton).first);
    await tester.pumpAndSettle();

    expect(
      find.text('Unable to connect to the server. Please try again.'),
      findsOneWidget,
    );
  });

  testWidgets(
    'Forgot password screen localizes auth service error in Vietnamese',
    (WidgetTester tester) async {
      SharedPreferences.setMockInitialValues(<String, Object>{});

      await tester.pumpWidget(
        await _buildApp(
          const Locale('vi'),
          authService: _FakeAuthService(
            resetResult: PasswordResetRequestResult.failure(
              type: LoginFailureType.network,
              message: authServiceMessageToken(
                AuthMessageCode.serverUnavailable,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField), 'dealer@example.com');
      await tester.pumpAndSettle();
      await tester.tap(find.byType(ElevatedButton).first);
      await tester.pumpAndSettle();

      expect(
        find.text('Không thể kết nối máy chủ. Vui lòng thử lại.'),
        findsOneWidget,
      );
    },
  );
}

Future<Widget> _buildApp(Locale locale, {required AuthService authService}) async {
  final controller = AppSettingsController();
  await controller.setLocale(locale);

  return AppSettingsScope(
    controller: controller,
    child: MaterialApp(
      locale: locale,
      supportedLocales: const <Locale>[Locale('vi'), Locale('en')],
      localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: ForgotPasswordScreen(authService: authService),
    ),
  );
}

class _FakeAuthService implements AuthService {
  _FakeAuthService({this.resetResult});

  final PasswordResetRequestResult? resetResult;

  @override
  Future<PasswordResetRequestResult> requestPasswordReset({
    required String email,
  }) async {
    return resetResult ??
        PasswordResetRequestResult.failure(
          type: LoginFailureType.unknown,
          message: 'unexpected',
        );
  }

  @override
  Future<LoginResult> signIn({
    required String email,
    required String password,
  }) async {
    throw UnimplementedError();
  }
}
