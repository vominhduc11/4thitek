import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../dealer_routes.dart';

class DealerFallbackBackButton extends StatelessWidget {
  const DealerFallbackBackButton({
    super.key,
    this.fallbackPath = DealerRoutePath.home,
    this.onFallbackPressed,
  });

  final String fallbackPath;
  final FutureOr<void> Function()? onFallbackPressed;

  @override
  Widget build(BuildContext context) {
    final navigator = Navigator.of(context);
    final canPop = navigator.canPop();
    final isHomeFallback = fallbackPath == DealerRoutePath.home;
    final tooltip = canPop
        ? MaterialLocalizations.of(context).backButtonTooltip
        : (isHomeFallback ? 'Back to home' : 'Back');

    return IconButton(
      tooltip: tooltip,
      onPressed: canPop
          ? () => navigator.maybePop()
          : () {
              final fallback = onFallbackPressed;
              if (fallback != null) {
                final result = fallback();
                if (result is Future<void>) {
                  unawaited(result);
                }
                return;
              }
              context.go(fallbackPath);
            },
      icon: Icon(
        canPop
            ? Icons.arrow_back_rounded
            : (isHomeFallback ? Icons.home_outlined : Icons.arrow_back_rounded),
      ),
    );
  }
}
