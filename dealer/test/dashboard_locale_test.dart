import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/dashboard_screen.dart';
import 'package:dealer_hub/order_controller.dart';
import 'package:dealer_hub/warranty_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test(
    'Dashboard month snapshot uses 30-day activation window and 7/30 warranty ranges',
    () {
      final snapshot = debugDashboardWarrantyWindowFor(
        filter: DashboardTimeFilterDebug.month,
        selectedPeriod: DateTime(2026, 3, 15),
        now: DateTime(2026, 3, 29),
      );

      expect(snapshot.activationWindowDays, 30);
      expect(snapshot.warrantyRanges, <int>[7, 30]);
    },
  );

  test(
    'Dashboard quarter snapshot uses 90-day activation window and 7/30/90 warranty ranges',
    () {
      final snapshot = debugDashboardWarrantyWindowFor(
        filter: DashboardTimeFilterDebug.quarter,
        selectedPeriod: DateTime(2026, 3, 15),
        now: DateTime(2026, 3, 29),
      );

      expect(snapshot.activationWindowDays, 90);
      expect(snapshot.warrantyRanges, <int>[7, 30, 90]);
    },
  );

  testWidgets('Dashboard renders English warranty unavailable state', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    _configureView(tester);

    await tester.pumpWidget(await _buildApp(const Locale('en')));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(find.text('Serial status'), findsNothing);
    expect(find.text('Unavailable'), findsNothing);
  });

  testWidgets('Dashboard renders Vietnamese warranty unavailable state', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    _configureView(tester);

    await tester.pumpWidget(await _buildApp(const Locale('vi')));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(find.text('Tr\u1ea1ng th\u00e1i serial'), findsNothing);
    expect(
      find.textContaining('Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u'),
      findsNothing,
    );
  });
}

Future<Widget> _buildApp(Locale locale) async {
  final settingsController = AppSettingsController();
  await settingsController.setLocale(locale);

  return AppSettingsScope(
    controller: settingsController,
    child: MaterialApp(
      locale: locale,
      supportedLocales: const <Locale>[Locale('vi'), Locale('en')],
      localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: WarrantyScope(
        controller: _FakeWarrantyController(),
        child: OrderScope(
          controller: _FakeOrderController(),
          child: const DashboardScreen(),
        ),
      ),
    ),
  );
}

class _FakeOrderController extends OrderController {
  @override
  Future<void> refresh() async {}
}

class _FakeWarrantyController extends WarrantyController {
  @override
  Future<void> load({bool forceRefresh = false}) async {}
}

void _configureView(WidgetTester tester) {
  final view = tester.view;
  view.devicePixelRatio = 1.0;
  view.physicalSize = const Size(1280, 1800);
  addTearDown(() {
    view.resetPhysicalSize();
    view.resetDevicePixelRatio();
  });
}
