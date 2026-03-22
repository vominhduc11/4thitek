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

  testWidgets('Dashboard renders English warranty range labels', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    _configureView(tester);

    await tester.pumpWidget(await _buildApp(const Locale('en')));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(_warrantyRangeLabels(tester), <String>['7 days', '30 days']);
  });

  testWidgets('Dashboard renders Vietnamese warranty range labels', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    _configureView(tester);

    await tester.pumpWidget(await _buildApp(const Locale('vi')));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(
      _warrantyRangeLabels(tester),
      <String>['7 ng\u00E0y', '30 ng\u00E0y'],
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

List<String> _warrantyRangeLabels(WidgetTester tester) {
  final selector = tester
      .widgetList<SegmentedButton<int>>(
        find.byWidgetPredicate(
          (widget) =>
              widget is SegmentedButton<int> &&
              widget.segments.length == 2 &&
              widget.segments.any((segment) => segment.value == 7) &&
              widget.segments.any((segment) => segment.value == 30),
        ),
      )
      .single;

  return selector.segments
      .map((segment) => (segment.label as Text).data ?? '')
      .toList(growable: false);
}
