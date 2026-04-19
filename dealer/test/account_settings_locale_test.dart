import 'package:dealer_hub/account_settings_screen.dart';
import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/dealer_profile_storage.dart';
import 'package:dealer_hub/dealer_routes.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Account settings localizes initial load error in English', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(
      await _buildApp(
        const Locale('en'),
        child: AccountSettingsScreen(
          loadProfile: () async {
            throw DealerProfileStorageException(
              dealerProfileStorageMessageToken(
                DealerProfileStorageMessageCode.loadFailed,
              ),
            );
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Unable to load dealer profile.'), findsOneWidget);
  });

  testWidgets('Account settings root fallback confirms discard changes', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(
      await _buildRouterApp(
        const Locale('en'),
        child: AccountSettingsScreen(
          loadProfile: () async => _sampleProfile,
          saveProfile: (_) async {},
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextFormField).first, 'Dealer A updated');
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.home_outlined).first);
    await tester.pumpAndSettle();

    expect(find.byType(AlertDialog), findsOneWidget);
    expect(find.text('Unsaved changes'), findsWidgets);

    await tester.tap(find.text('Stay'));
    await tester.pumpAndSettle();

    expect(find.byType(AccountSettingsScreen), findsOneWidget);

    await tester.tap(find.byIcon(Icons.home_outlined).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Leave'));
    await tester.pumpAndSettle();

    expect(find.text('Home landing'), findsOneWidget);
  });
}

const DealerProfile _sampleProfile = DealerProfile(
  businessName: 'Đại lý A',
  contactName: 'Nguyen Van A',
  email: 'dealer@example.com',
  phone: '0901234567',
  addressLine: '123 Đường A',
  ward: 'Phường 1',
  district: 'Quận 1',
  city: 'TP HCM',
  country: 'Việt Nam',
  salesPolicy: 'Chính sách A',
  vatPercent: 8,
);

Future<Widget> _buildApp(Locale locale, {required Widget child}) async {
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
      home: child,
    ),
  );
}

Future<Widget> _buildRouterApp(Locale locale, {required Widget child}) async {
  final controller = AppSettingsController();
  await controller.setLocale(locale);

  return AppSettingsScope(
    controller: controller,
    child: MaterialApp.router(
      locale: locale,
      supportedLocales: const <Locale>[Locale('vi'), Locale('en')],
      localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: GoRouter(
        initialLocation: DealerRoutePath.accountSettings,
        routes: <RouteBase>[
          GoRoute(
            path: DealerRoutePath.accountSettings,
            builder: (context, state) => child,
          ),
          GoRoute(
            path: DealerRoutePath.home,
            builder: (context, state) =>
                const Scaffold(body: Text('Home landing')),
          ),
        ],
      ),
    ),
  );
}
