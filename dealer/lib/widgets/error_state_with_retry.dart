import 'package:flutter/material.dart';

class ErrorStateWithRetry extends StatelessWidget {
  const ErrorStateWithRetry({
    super.key,
    required this.message,
    required this.onRetry,
    this.title,
    this.retryLabel,
  });

  final String message;
  final VoidCallback onRetry;
  final String? title;
  final String? retryLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final label = retryLabel ?? (Localizations.localeOf(context).languageCode == 'en' ? 'Retry' : 'Thử lại');

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded, color: colors.error, size: 44),
            const SizedBox(height: 12),
            if (title != null) ...[
              Text(
                title!,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
            ],
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: Text(label),
            ),
          ],
        ),
      ),
    );
  }
}
