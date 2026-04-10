import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_router.dart';
import 'app_resume_refresh.dart';
import 'app_settings_controller.dart';
import 'auth_storage.dart';
import 'business_profile.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'dealer_routes.dart';
import 'dealer_profile_storage.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'product_catalog_controller.dart';
import 'push_messaging_controller.dart';
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
  const DealerApp({super.key, this.enablePushMessaging = true});

  final bool enablePushMessaging;

  @override
  State<DealerApp> createState() => _DealerAppState();
}

class _DealerAppState extends State<DealerApp> with WidgetsBindingObserver {
  late final CartController _cartController;
  late final OrderController _orderController;
  late final WarrantyController _warrantyController;
  late final ProductCatalogController _productCatalogController;
  late final AppSettingsController _appSettingsController;
  late final NotificationController _notificationController;
  late final PushMessagingController _pushMessagingController;
  late final AuthStorage _authStorage;
  late final AppResumeRefreshCoordinator _resumeRefreshCoordinator;
  late final Future<bool> _startupFuture;
  late final GoRouter _router;
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  final GlobalKey<ScaffoldMessengerState> _scaffoldMessengerKey =
      GlobalKey<ScaffoldMessengerState>();
  bool _isHandlingExpiredSession = false;
  int _handledSessionEventVersion = 0;
  int _handledIncomingNoticeVersion = 0;
  int _handledPushOpenEventVersion = 0;
  bool _bootstrapDone = false;
  String? _pendingPushRoute;

  @override
  void initState() {
    super.initState();
    _authStorage = AuthStorage();
    _productCatalogController = ProductCatalogController(
      authStorage: _authStorage,
    );
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
      orderLookup: _orderController.findById,
      productLookup: _productCatalogController.findById,
    );
    _appSettingsController = AppSettingsController();
    _notificationController = NotificationController(
      authStorage: _authStorage,
      onOrderSignal: _orderController.refresh,
      onOrderStatusEvent:
          (orderCode, status, paymentStatus, {int? paidAmount}) =>
              _orderController.applyOrderStatusEvent(
                orderCode,
                status,
                paymentStatus,
                paidAmount: paidAmount,
              ),
    );
    _pushMessagingController = PushMessagingController(
      authStorage: _authStorage,
      onNotificationSignal: _notificationController.refresh,
      onOrderSignal: _orderController.refresh,
      enabled: widget.enablePushMessaging,
    );
    _resumeRefreshCoordinator = AppResumeRefreshCoordinator(
      authStorage: _authStorage,
      cartController: _cartController,
      orderController: _orderController,
      warrantyController: _warrantyController,
      productCatalogController: _productCatalogController,
      notificationController: _notificationController,
      pushMessagingController: _pushMessagingController,
    );
    _authStorage.sessionEvents.addListener(_handleSessionEvent);
    _notificationController.incomingNoticeEvents.addListener(
      _handleIncomingNoticeEvent,
    );
    _pushMessagingController.openMessageEvents.addListener(
      _handlePushOpenEvent,
    );
    WidgetsBinding.instance.addObserver(this);
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
      _pushMessagingController.initialize(),
    ]);
    _bootstrapDone = true;
    final shouldAutoLogin = await _authStorage.shouldAutoLogin();
    if (shouldAutoLogin) {
      _resumeRefreshCoordinator.markFreshNow();
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => _flushPendingPushRoute(),
      );
    }
    return shouldAutoLogin;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed || !_bootstrapDone) {
      return;
    }
    unawaited(_resumeRefreshCoordinator.refreshIfNeeded());
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
    WidgetsBinding.instance.removeObserver(this);
    _authStorage.sessionEvents.removeListener(_handleSessionEvent);
    _notificationController.incomingNoticeEvents.removeListener(
      _handleIncomingNoticeEvent,
    );
    _pushMessagingController.openMessageEvents.removeListener(
      _handlePushOpenEvent,
    );
    _cartController.dispose();
    _orderController.dispose();
    _warrantyController.dispose();
    _productCatalogController.dispose();
    _appSettingsController.dispose();
    _notificationController.dispose();
    _pushMessagingController.dispose();
    super.dispose();
  }

  void _handleSessionEvent() {
    final currentVersion = _authStorage.sessionEventVersion;
    if (currentVersion == _handledSessionEventVersion) {
      return;
    }
    _handledSessionEventVersion = currentVersion;

    if (_authStorage.lastSessionEvent == AuthSessionEventType.expired) {
      _resumeRefreshCoordinator.reset();
      unawaited(_handleExpiredSession());
      return;
    }
    if (_authStorage.lastSessionEvent == AuthSessionEventType.signedIn) {
      _resumeRefreshCoordinator.markFreshNow();
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => _flushPendingPushRoute(),
      );
      return;
    }
    if (_authStorage.lastSessionEvent == AuthSessionEventType.loggedOut) {
      _resumeRefreshCoordinator.reset();
    }
  }

  void _handlePushOpenEvent() {
    final currentVersion = _pushMessagingController.openMessageEventVersion;
    if (currentVersion == _handledPushOpenEventVersion) {
      return;
    }
    _handledPushOpenEventVersion = currentVersion;
    final route = _pushMessagingController.consumePendingRoute();
    if (route == null || route.isEmpty) {
      return;
    }
    _pendingPushRoute = route;
    _flushPendingPushRoute();
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
            onPressed: () => _openNoticeDestination(notice),
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
      _productCatalogController.reset();
      if (!mounted) {
        return;
      }

      final sessionMessage = _authStorage.lastSessionEventMessage?.trim();
      final l10n = _localizationsOrNull();
      final message = sessionMessage != null && sessionMessage.isNotEmpty
          ? sessionMessage
          : (l10n?.sessionExpiredMessage ??
                'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

      _router.go('/login?error=${Uri.encodeComponent(message)}');
    } finally {
      _isHandlingExpiredSession = false;
    }
  }

  void _openNotificationsCenter() {
    _router.push(DealerRoutePath.notifications);
  }

  void _flushPendingPushRoute() {
    if (!mounted || !_bootstrapDone) {
      return;
    }
    final route = _pendingPushRoute;
    if (route == null || route.isEmpty) {
      return;
    }
    if (AuthStorage.currentAccessToken == null) {
      return;
    }
    _pendingPushRoute = null;
    if (isDealerTopLevelRoute(route)) {
      _router.go(route);
      return;
    }
    _router.push(route);
  }

  void _openNoticeDestination(DistributorNotice notice) {
    final normalizedRoute = normalizeDealerInternalRoute(
      notice.deepLink ?? notice.link,
    );
    if (normalizedRoute == null) {
      _openNotificationsCenter();
      return;
    }
    if (isDealerTopLevelRoute(normalizedRoute)) {
      _router.go(normalizedRoute);
      return;
    }
    _router.push(normalizedRoute);
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
            child: PushMessagingScope(
              controller: _pushMessagingController,
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
                        title: BusinessProfile.dealerAppName,
                        builder: (context, child) {
                          final mq = MediaQuery.of(context);
                          final scale = mq.textScaler.scale(1);
                          final appTextScaler = scale.isFinite && scale > 1.6
                              ? const TextScaler.linear(1.6)
                              : mq.textScaler;
                          return MediaQuery(
                            data: mq.copyWith(textScaler: appTextScaler),
                            child: child!,
                          );
                        },
                        onGenerateTitle: (context) =>
                            AppLocalizations.of(context)?.appTitle ??
                            BusinessProfile.dealerAppName,
                        theme: _buildDarkTheme(),
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
      ),
    );
  }

  ThemeData _buildDarkTheme() {
    const scaffoldColor = Color(0xFF07111A);
    const cardRadius = 22.0;
    const colorScheme = ColorScheme(
      brightness: Brightness.dark,
      primary: Color(0xFF29ABE2),
      onPrimary: Color(0xFFF7FBFF),
      primaryContainer: Color(0xFF0F3554),
      onPrimaryContainer: Color(0xFFF7FBFF),
      secondary: Color(0xFF0071BC),
      onSecondary: Color(0xFFF7FBFF),
      secondaryContainer: Color(0xFF112B42),
      onSecondaryContainer: Color(0xFFE8F4FB),
      tertiary: Color(0xFF05A7AF),
      onTertiary: Color(0xFFF7FBFF),
      tertiaryContainer: Color(0xFF123941),
      onTertiaryContainer: Color(0xFFE6FBFB),
      error: Color(0xFFFF7D92),
      onError: Color(0xFF24060D),
      errorContainer: Color(0xFF4D1622),
      onErrorContainer: Color(0xFFFFD9E0),
      surface: Color(0xFF0A141E),
      onSurface: Color(0xFFF7FBFF),
      surfaceContainerLowest: Color(0xFF061019),
      surfaceContainerLow: Color(0xFF0C1925),
      surfaceContainer: Color(0xFF10202E),
      surfaceContainerHigh: Color(0xFF152736),
      surfaceContainerHighest: Color(0xFF1B3042),
      onSurfaceVariant: Color(0xFF9FB8CA),
      outline: Color(0xFF335369),
      outlineVariant: Color(0xFF1E3447),
      shadow: Color(0xFF000000),
      scrim: Color(0xCC000000),
      inverseSurface: Color(0xFFF1F8FD),
      onInverseSurface: Color(0xFF102131),
      inversePrimary: Color(0xFF0071BC),
      surfaceTint: Color(0xFF29ABE2),
    );
    final baseTextTheme =
        GoogleFonts.sourceSans3TextTheme(
          ThemeData(brightness: Brightness.dark).textTheme,
        ).apply(
          bodyColor: colorScheme.onSurface,
          displayColor: colorScheme.onSurface,
        );
    final displayTextTheme = GoogleFonts.montserratTextTheme(baseTextTheme);

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: scaffoldColor,
      canvasColor: scaffoldColor,
      splashFactory: InkSparkle.splashFactory,
      textTheme: baseTextTheme.copyWith(
        displayLarge: displayTextTheme.displayLarge?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.8,
        ),
        displayMedium: displayTextTheme.displayMedium?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.6,
        ),
        displaySmall: displayTextTheme.displaySmall?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.45,
        ),
        headlineMedium: displayTextTheme.headlineMedium?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.35,
        ),
        headlineSmall: baseTextTheme.headlineSmall?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.32,
        ),
        titleLarge: baseTextTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w800,
          letterSpacing: -0.14,
        ),
        titleMedium: baseTextTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w700,
          letterSpacing: -0.04,
        ),
        bodyLarge: baseTextTheme.bodyLarge?.copyWith(height: 1.42),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(height: 1.45),
        labelLarge: baseTextTheme.labelLarge?.copyWith(
          fontWeight: FontWeight.w700,
          letterSpacing: 0.16,
        ),
        labelMedium: baseTextTheme.labelMedium?.copyWith(
          fontWeight: FontWeight.w700,
          letterSpacing: 0.14,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Color.alphaBlend(
          colorScheme.primary.withValues(alpha: 0.06),
          scaffoldColor,
        ),
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: baseTextTheme.titleLarge?.copyWith(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.12,
        ),
      ),
      cardTheme: CardThemeData(
        color: colorScheme.surfaceContainer,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(cardRadius),
          side: BorderSide(
            color: colorScheme.outlineVariant.withValues(alpha: 0.9),
          ),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: colorScheme.surfaceContainerHigh,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
          side: BorderSide(
            color: colorScheme.outlineVariant.withValues(alpha: 0.9),
          ),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colorScheme.surfaceContainerLow,
        surfaceTintColor: Colors.transparent,
        dragHandleColor: colorScheme.outline,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: colorScheme.surfaceContainerHighest,
        contentTextStyle: baseTextTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurface,
        ),
        actionTextColor: colorScheme.primary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(
            color: colorScheme.outlineVariant.withValues(alpha: 0.85),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colorScheme.surfaceContainerLow,
        hintStyle: baseTextTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurfaceVariant,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: colorScheme.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: colorScheme.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: colorScheme.primary, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: colorScheme.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: BorderSide(color: colorScheme.error, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: ButtonStyle(
          minimumSize: const WidgetStatePropertyAll(Size(44, 44)),
          padding: const WidgetStatePropertyAll(EdgeInsets.all(10)),
          shape: WidgetStatePropertyAll(
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          foregroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.disabled)) {
              return colorScheme.onSurfaceVariant.withValues(alpha: 0.55);
            }
            return colorScheme.onSurface;
          }),
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.disabled)) {
              return colorScheme.surfaceContainerLow.withValues(alpha: 0.45);
            }
            if (states.contains(WidgetState.pressed)) {
              return colorScheme.primaryContainer.withValues(alpha: 0.88);
            }
            if (states.contains(WidgetState.hovered) ||
                states.contains(WidgetState.focused)) {
              return colorScheme.surfaceContainerHigh;
            }
            return colorScheme.surfaceContainerLow.withValues(alpha: 0.88);
          }),
          overlayColor: WidgetStatePropertyAll(
            colorScheme.primary.withValues(alpha: 0.08),
          ),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          minimumSize: const Size(0, 54),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          textStyle: TextStyle(
            fontFamily: GoogleFonts.sourceSans3().fontFamily,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          disabledBackgroundColor: colorScheme.surfaceContainerHighest,
          disabledForegroundColor: colorScheme.onSurfaceVariant,
          minimumSize: const Size(0, 54),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          textStyle: TextStyle(
            fontFamily: GoogleFonts.sourceSans3().fontFamily,
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 54),
          foregroundColor: colorScheme.onSurface,
          backgroundColor: colorScheme.surfaceContainerLow.withValues(
            alpha: 0.4,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          side: BorderSide(color: colorScheme.outline),
          textStyle: TextStyle(
            fontFamily: GoogleFonts.sourceSans3().fontFamily,
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: colorScheme.primary,
          textStyle: TextStyle(
            fontFamily: GoogleFonts.sourceSans3().fontFamily,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        backgroundColor: colorScheme.surfaceContainerLow,
        side: BorderSide(
          color: colorScheme.outlineVariant.withValues(alpha: 0.9),
        ),
        selectedColor: colorScheme.primaryContainer.withValues(alpha: 0.9),
        labelStyle: baseTextTheme.labelMedium?.copyWith(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w600,
        ),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: ButtonStyle(
          padding: const WidgetStatePropertyAll(
            EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          ),
          backgroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return colorScheme.primaryContainer.withValues(alpha: 0.95);
            }
            return colorScheme.surfaceContainerLow;
          }),
          foregroundColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return colorScheme.onPrimaryContainer;
            }
            return colorScheme.onSurfaceVariant;
          }),
          side: WidgetStatePropertyAll(
            BorderSide(
              color: colorScheme.outlineVariant.withValues(alpha: 0.9),
            ),
          ),
          shape: WidgetStatePropertyAll(
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          ),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 74,
        backgroundColor: colorScheme.surfaceContainerLow.withValues(
          alpha: 0.98,
        ),
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.black.withValues(alpha: 0.16),
        indicatorColor: colorScheme.primaryContainer.withValues(alpha: 0.95),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return baseTextTheme.labelSmall?.copyWith(
            color: selected
                ? colorScheme.onPrimaryContainer
                : colorScheme.onSurfaceVariant,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: selected
                ? colorScheme.onPrimaryContainer
                : colorScheme.onSurfaceVariant,
            size: 22,
          );
        }),
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: colorScheme.surfaceContainerLow.withValues(
          alpha: 0.96,
        ),
        indicatorColor: colorScheme.primaryContainer.withValues(alpha: 0.95),
        selectedIconTheme: IconThemeData(color: colorScheme.onPrimaryContainer),
        unselectedIconTheme: IconThemeData(
          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.92),
        ),
        selectedLabelTextStyle: baseTextTheme.labelMedium?.copyWith(
          color: colorScheme.onPrimaryContainer,
          fontWeight: FontWeight.w700,
        ),
        unselectedLabelTextStyle: baseTextTheme.labelMedium?.copyWith(
          color: colorScheme.onSurfaceVariant,
          fontWeight: FontWeight.w600,
        ),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: colorScheme.surfaceContainerHigh,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(
            color: colorScheme.outlineVariant.withValues(alpha: 0.9),
          ),
        ),
        textStyle: baseTextTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurface,
        ),
      ),
      dividerTheme: DividerThemeData(
        color: colorScheme.outlineVariant.withValues(alpha: 0.7),
        thickness: 1,
        space: 1,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: colorScheme.primary,
        circularTrackColor: colorScheme.surfaceContainerHighest,
        linearTrackColor: colorScheme.surfaceContainerHighest,
      ),
      checkboxTheme: CheckboxThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),
    );
  }
}
