import 'package:dealer_hub/app_preferences_screen.dart';
import 'package:dealer_hub/app_settings_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('App preferences screen renders English language options', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final controller = AppSettingsController();
    await controller.setLocale(const Locale('en'));

    await tester.pumpWidget(
      AppSettingsScope(
        controller: controller,
        child: const MaterialApp(home: AppPreferencesScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Preferences'), findsOneWidget);
    expect(find.text('Language'), findsOneWidget);
    expect(find.text('Vietnamese'), findsOneWidget);
    expect(find.text('English'), findsOneWidget);
  });

  testWidgets('App preferences screen renders Vietnamese language options', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final controller = AppSettingsController();

    await tester.pumpWidget(
      AppSettingsScope(
        controller: controller,
        child: const MaterialApp(home: AppPreferencesScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Giao diện và ngôn ngữ'), findsOneWidget);
    expect(find.text('Ngôn ngữ'), findsOneWidget);
    expect(find.text('Tiếng Việt'), findsOneWidget);
    expect(find.text('Tiếng Anh'), findsOneWidget);
  });
}
