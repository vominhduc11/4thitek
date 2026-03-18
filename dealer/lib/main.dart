import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_router.dart';
import 'app_settings_controller.dart';
import 'auth_storage.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'dealer_profile_storage.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'product_catalog_controller.dart';
import 'l10n/app_localizations.dart';
import 'warranty_controller.dart';

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
  late final GoRouter _router;
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  final GlobalKey<ScaffoldMessengerState> _scaffoldMessengerKey =
      GlobalKey<ScaffoldMessengerState>();
  bool _isHandlingExpiredSession = false;
  int _handledSessionEventVersion = 0;
  int _handledIncomingNoticeVersion = 0;

  @override
  void initState() {
    super.initState();
    _authStorage = AuthStorage();
    _productCatalogController = ProductCatalogController(authStorage: _authStorage);
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
      onOrderStatusEvent: _orderController.applyOrderStatusEvent,
    );
    _authStorage.sessionEvents.addListener(_handleSessionEvent);
    _notificationController.incomingNoticeEvents.addListener(
      _handleIncomingNoticeEvent,
    );
    _startupFuture = _bootstrap();
    _router = buildDealerRouter(
      navigatorKey: _navigatorKey,
      startupFuture: _startupFuture,
    );
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

  AppLocalizations? _localizationsOrNull() {
    final currentContext = _navigatorKey.currentContext;
    if (currentContext == null) {
      return null;
    }
    return AppLocalizations.of(currentContext);
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

    final l10n = _localizationsOrNull();
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(notice.title),
          duration: const Duration(seconds: 4),
          action: SnackBarAction(
            label: l10n?.viewAction ?? 'Xem',
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

      final sessionMessage = _authStorage.lastSessionEventMessage?.trim();
      final l10n = _localizationsOrNull();
      final message =
          sessionMessage != null && sessionMessage.isNotEmpty
              ? sessionMessage
              : (l10n?.sessionExpiredMessage ??
                    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

      _router.go('/login?error=${Uri.encodeComponent(message)}');
    } finally {
      _isHandlingExpiredSession = false;
    }
  }

  void _openNotificationsCenter() {
    _router.push('/notifications');
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
                    return MaterialApp.router(
                      routerConfig: _router,
                      scaffoldMessengerKey: _scaffoldMessengerKey,
                      debugShowCheckedModeBanner: false,
                      title: '4thitek Dealer Hub',
                      builder: (context, child) {
                        final mq = MediaQuery.of(context);
                        final scale = mq.textScaler.scale(1).clamp(0.85, 1.3);
                        return MediaQuery(
                          data: mq.copyWith(
                            textScaler: TextScaler.linear(scale),
                          ),
                          child: child!,
                        );
                      },
                      onGenerateTitle: (context) =>
                          AppLocalizations.of(context)?.appTitle ??
                          '4thitek Dealer Hub',
                      theme: _buildLightTheme(),
                      darkTheme: _buildDarkTheme(),
                      themeMode: _appSettingsController.themeMode,
                      locale: _appSettingsController.locale,
                      localizationsDelegates: const [
                        AppLocalizations.delegate,
                        GlobalMaterialLocalizations.delegate,
                        GlobalWidgetsLocalizations.delegate,
                        GlobalCupertinoLocalizations.delegate,
                      ],
                      supportedLocales: AppLocalizations.supportedLocales,
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
          borderSide: BorderSide(color: colorScheme.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colorScheme.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colorScheme.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colorScheme.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colorScheme.error, width: 1.5),
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
          side: BorderSide(color: colorScheme.outlineVariant),
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
          borderSide: BorderSide(color: colorScheme.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colorScheme.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colorScheme.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colorScheme.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: colorScheme.error, width: 1.5),
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
          side: BorderSide(color: colorScheme.outline),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      checkboxTheme: CheckboxThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
    );
  }
}
