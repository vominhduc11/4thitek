import 'package:flutter/widgets.dart';

class AppBreakpoints {
  const AppBreakpoints._();

  // Primary breakpoint based on shortest side for consistent orientation behavior.
  static const double phone = 600.0;
  static const double tablet = 900.0;
  static const double desktop = 1200.0;
  static const double railExtended = 1320.0;

  static bool isTablet(BuildContext context) {
    return MediaQuery.sizeOf(context).shortestSide >= phone;
  }

  static bool isPhone(BuildContext context) {
    return MediaQuery.sizeOf(context).shortestSide < phone;
  }
}
