import 'package:dealer_hub/login_screen.dart';
import 'package:dealer_hub/main.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('App opens login screen', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      'remember_me': false,
      'logged_in': false,
    });
    await tester.pumpWidget(const DealerApp());
    await tester.pumpAndSettle();

    expect(find.byType(LoginScreen), findsOneWidget);
  });
}
