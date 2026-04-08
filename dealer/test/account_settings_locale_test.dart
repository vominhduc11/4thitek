import 'package:dealer_hub/account_settings_screen.dart';
import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/dealer_profile_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
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

  testWidgets('Account settings localizes save error in Vietnamese', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});

    await tester.pumpWidget(
      await _buildApp(
        const Locale('vi'),
        child: AccountSettingsScreen(
          loadProfile: () async => _sampleProfile,
          saveProfile: (profile) async {
            throw DealerProfileStorageException(
              dealerProfileStorageMessageToken(
                DealerProfileStorageMessageCode.saveFailed,
              ),
            );
          },
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.text('Lưu thay đổi'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.enterText(
      find.byType(TextFormField).first,
      'Đại lý A cập nhật',
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Lưu thay đổi'), warnIfMissed: false);
    await tester.pumpAndSettle();

    expect(find.text('Không thể lưu hồ sơ đại lý.'), findsOneWidget);
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
