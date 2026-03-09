import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_settings_controller.dart';
import 'auth_storage.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'dealer_profile_storage.dart';
import 'home_shell.dart';
import 'login_screen.dart';
import 'notification_controller.dart';
import 'notifications_screen.dart';
import 'order_controller.dart';
import 'product_catalog_controller.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final view = WidgetsBinding.instance.platformDispatcher.views.first;
  final shortestSide = view.physicalSize.shortestSide / view.devicePixelRatio;
  if (shortestSide < AppBreakpoints.phone) {
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
  } else {
    await SystemChrome.setPreferredOrientations(const <DeviceOrientation>[]);
  }
  runApp(const DealerApp());
}

class DealerApp extends StatefulWidget {
  const DealerApp({super.key});

  @override
  State<DealerApp> createState() => _DealerAppState();
}

class _DealerAppState extends State<DealerApp> {
  late final CartController _cartController;
  late final OrderController _orderController;
  late final WarrantyController _warrantyController;
  late final ProductCatalogController _productCatalogController;
  late final AppSettingsController _appSettingsController;
  late final NotificationController _notificationController;
  late final AuthStorage _authStorage;
  late final Future<bool> _startupFuture;
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  final GlobalKey<ScaffoldMessengerState> _scaffoldMessengerKey =
      GlobalKey<ScaffoldMessengerState>();
  bool _isHandlingExpiredSession = false;
  int _handledSessionEventVersion = 0;
  int _handledIncomingNoticeVersion = 0;

  @override
  void initState() {
    super.initState();
    _productCatalogController = ProductCatalogController();
    _authStorage = AuthStorage();
    _cartController = CartController(
      productLookup: _productCatalogController.findById,
      authStorage: _authStorage,
    );
    _orderController = OrderController(
      productLookup: _productCatalogController.findById,
      authStorage: _authStorage,
    );
    _warrantyController = WarrantyController(
      authStorage: _authStorage,
      orderCodeForRemoteId: _orderController.orderCodeForRemoteId,
      remoteOrderIdForOrderCode: _orderController.remoteOrderIdForOrderCode,
      orderLookup: _orderController.findById,
      productLookup: _productCatalogController.findById,
    );
    _appSettingsController = AppSettingsController();
    _notificationController = NotificationController(
      authStorage: _authStorage,
      onOrderSignal: _orderController.refresh,
    );
    _authStorage.sessionEvents.addListener(_handleSessionEvent);
    _notificationController.incomingNoticeEvents.addListener(
      _handleIncomingNoticeEvent,
    );
    _startupFuture = _bootstrap();
  }

  Future<bool> _bootstrap() async {
    await _appSettingsController.load();
    await _productCatalogController.load();
    await _orderController.load();
    await Future.wait<void>([
      _cartController.load(),
      _warrantyController.load(),
      _notificationController.load(),
    ]);
    return _authStorage.shouldAutoLogin();
  }

  @override
  void dispose() {
    _authStorage.sessionEvents.removeListener(_handleSessionEvent);
    _notificationController.incomingNoticeEvents.removeListener(
      _handleIncomingNoticeEvent,
    );
    _cartController.dispose();
    _orderController.dispose();
    _warrantyController.dispose();
    _productCatalogController.dispose();
    _appSettingsController.dispose();
    _notificationController.dispose();
    super.dispose();
  }

  void _handleSessionEvent() {
    final currentVersion = _authStorage.sessionEventVersion;
    if (currentVersion == _handledSessionEventVersion) {
      return;
    }
    _handledSessionEventVersion = currentVersion;

    if (_authStorage.lastSessionEvent == AuthSessionEventType.expired) {
      unawaited(_handleExpiredSession());
    }
  }

  void _handleIncomingNoticeEvent() {
    final currentVersion = _notificationController.incomingNoticeEventVersion;
    if (currentVersion == _handledIncomingNoticeVersion) {
      return;
    }
    _handledIncomingNoticeVersion = currentVersion;

    final notice = _notificationController.latestIncomingNotice;
    if (notice == null || !mounted) {
      return;
    }

    final messenger = _scaffoldMessengerKey.currentState;
    if (messenger == null) {
      return;
    }

    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(notice.title),
          duration: const Duration(seconds: 4),
          action: SnackBarAction(
            label: 'Xem',
            onPressed: _openNotificationsCenter,
          ),
        ),
      );
  }

  Future<void> _handleExpiredSession() async {
    if (_isHandlingExpiredSession) {
      return;
    }
    _isHandlingExpiredSession = true;
    try {
      await clearDealerProfileCache();
      await _cartController.clear(syncRemote: false, rollbackOnFailure: false);
      await _orderController.clearSessionData();
      await _notificationController.clearSessionData();
      await _warrantyController.clearSessionData();
      if (!mounted) {
        return;
      }

      final navigator = _navigatorKey.currentState;
      if (navigator == null) {
        return;
      }

      final sessionMessage = _authStorage.lastSessionEventMessage?.trim();

      navigator.pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (context) => LoginScreen(
            initialErrorMessage:
                sessionMessage != null && sessionMessage.isNotEmpty
                ? sessionMessage
                : 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          ),
        ),
        (route) => false,
      );
    } finally {
      _isHandlingExpiredSession = false;
    }
  }

  void _openNotificationsCenter() {
    final navigator = _navigatorKey.currentState;
    if (navigator == null) {
      return;
    }
    navigator.push(
      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ProductCatalogScope(
      controller: _productCatalogController,
      child: CartScope(
        controller: _cartController,
        child: OrderScope(
          controller: _orderController,
          child: WarrantyScope(
            controller: _warrantyController,
            child: NotificationScope(
              controller: _notificationController,
              child: AppSettingsScope(
                controller: _appSettingsController,
                child: AnimatedBuilder(
                  animation: _appSettingsController,
                  builder: (context, _) {
                    return MaterialApp(
                      navigatorKey: _navigatorKey,
                      scaffoldMessengerKey: _scaffoldMessengerKey,
                      debugShowCheckedModeBanner: false,
                      title: '4thitek Dealer Hub',
                      theme: _buildLightTheme(),
                      darkTheme: _buildDarkTheme(),
                      themeMode: _appSettingsController.themeMode,
                      locale: _appSettingsController.locale,
                      localizationsDelegates: const [
                        GlobalMaterialLocalizations.delegate,
                        GlobalWidgetsLocalizations.delegate,
                        GlobalCupertinoLocalizations.delegate,
                      ],
                      supportedLocales: const [Locale('vi'), Locale('en')],
                      home: FutureBuilder<bool>(
                        future: _startupFuture,
                        builder: (context, snapshot) {
                          if (snapshot.connectionState !=
                              ConnectionState.done) {
                            return const _LaunchScreen();
                          }

                          final shouldAutoLogin = snapshot.data ?? false;
                          if (shouldAutoLogin) {
                            return const DealerHomeShell();
                          }
                          return const LoginScreen();
                        },
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  ThemeData _buildLightTheme() {
    const seedColor = Color(0xFF2563EB);
    final colorScheme = ColorScheme.fromSeed(
      seedColor: seedColor,
      brightness: Brightness.light,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: const Color(0xFFF2F5FB),
      textTheme: GoogleFonts.beVietnamProTextTheme(),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFDC2626)),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: seedColor,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          side: const BorderSide(color: Color(0xFFCBD5E1)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      checkboxTheme: CheckboxThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
    );
  }

  ThemeData _buildDarkTheme() {
    const seedColor = Color(0xFF2563EB);
    final colorScheme = ColorScheme.fromSeed(
      seedColor: seedColor,
      brightness: Brightness.dark,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: const Color(0xFF0F172A),
      textTheme: GoogleFonts.beVietnamProTextTheme(
        ThemeData(brightness: Brightness.dark).textTheme,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF1E293B),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFF334155)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFF334155)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFDC2626)),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFDC2626), width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: seedColor,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          side: const BorderSide(color: Color(0xFF334155)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      checkboxTheme: CheckboxThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
    );
  }
}

class _LaunchScreen extends StatelessWidget {
  const _LaunchScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            BrandLogoIcon(size: 88),
            SizedBox(height: 14),
            BrandLogoWordmark(height: 34),
            SizedBox(height: 22),
            SizedBox(
              width: 30,
              height: 30,
              child: CircularProgressIndicator(strokeWidth: 2.8),
            ),
          ],
        ),
      ),
    );
  }
}
