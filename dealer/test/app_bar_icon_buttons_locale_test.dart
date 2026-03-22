import 'package:dealer_hub/widgets/cart_icon_button.dart';
import 'package:dealer_hub/widgets/notification_icon_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App bar icon buttons render English tooltip and semantics', (
    WidgetTester tester,
  ) async {
    final semantics = tester.ensureSemantics();

    await tester.pumpWidget(_buildApp(const Locale('en')));
    await tester.pumpAndSettle();

    expect(find.byTooltip('Cart'), findsOneWidget);
    expect(find.bySemanticsLabel('Cart, 3 items'), findsOneWidget);
    expect(find.byTooltip('Notifications'), findsOneWidget);
    expect(
      find.bySemanticsLabel('Notifications, no unread notifications'),
      findsOneWidget,
    );

    semantics.dispose();
  });

  testWidgets('App bar icon buttons render Vietnamese tooltip and semantics', (
    WidgetTester tester,
  ) async {
    final semantics = tester.ensureSemantics();

    await tester.pumpWidget(_buildApp(const Locale('vi')));
    await tester.pumpAndSettle();

    expect(find.byTooltip('Giỏ hàng'), findsOneWidget);
    expect(find.bySemanticsLabel('Giỏ hàng, 3 sản phẩm'), findsOneWidget);
    expect(find.byTooltip('Thông báo'), findsOneWidget);
    expect(
      find.bySemanticsLabel('Thông báo, không có thông báo chưa đọc'),
      findsOneWidget,
    );

    semantics.dispose();
  });
}

Widget _buildApp(Locale locale) {
  return MaterialApp(
    locale: locale,
    supportedLocales: const <Locale>[Locale('vi'), Locale('en')],
    localizationsDelegates: const <LocalizationsDelegate<dynamic>>[
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ],
    home: Scaffold(
      appBar: AppBar(
        actions: <Widget>[
          CartIconButton(count: 3, onPressed: () {}),
          NotificationIconButton(count: 0, onPressed: () {}),
        ],
      ),
    ),
  );
}
