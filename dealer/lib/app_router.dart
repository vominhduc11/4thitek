import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'home_shell.dart';
import 'login_screen.dart';
import 'notifications_screen.dart';
import 'widgets/brand_identity.dart';

GoRouter buildDealerRouter({
  required GlobalKey<NavigatorState> navigatorKey,
  required Future<bool> startupFuture,
}) {
  return GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: '/launch',
    routes: [
      GoRoute(
        path: '/',
        redirect: (context, state) => '/launch',
      ),
      GoRoute(
        path: '/launch',
        builder: (context, state) => _StartupGate(startupFuture: startupFuture),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginScreen(
          initialErrorMessage: state.uri.queryParameters['error'],
        ),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const DealerHomeShell(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
    ],
  );
}

class _StartupGate extends StatelessWidget {
  const _StartupGate({required this.startupFuture});

  final Future<bool> startupFuture;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: startupFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.done) {
          final destination = (snapshot.data ?? false) ? '/home' : '/login';
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (context.mounted) {
              context.go(destination);
            }
          });
        }

        return const _LaunchRouteScreen();
      },
    );
  }
}

class _LaunchRouteScreen extends StatelessWidget {
  const _LaunchRouteScreen();

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
