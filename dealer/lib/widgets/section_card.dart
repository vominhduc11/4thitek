import 'package:flutter/material.dart';

class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.title,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.subtitle,
    this.icon,
    this.action,
  });

  final String title;
  final Widget child;
  final EdgeInsetsGeometry padding;
  final String? subtitle;
  final IconData? icon;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final hasSubtitle = subtitle != null && subtitle!.trim().isNotEmpty;
    final accentBackground = Color.alphaBlend(
      colors.primary.withValues(alpha: 0.16),
      colors.surfaceContainerHighest,
    );

    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: colors.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color.alphaBlend(
                colors.primary.withValues(alpha: 0.08),
                colors.surfaceContainerHigh,
              ),
              colors.surfaceContainer.withValues(alpha: 0.96),
            ],
          ),
        ),
        child: Padding(
          padding: padding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 6,
                    height: hasSubtitle ? 36 : 24,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [colors.primary, colors.secondary],
                      ),
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (icon != null) ...[
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: accentBackground,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: colors.outlineVariant.withValues(
                                  alpha: 0.32,
                                ),
                              ),
                            ),
                            child: Icon(icon, size: 18, color: colors.primary),
                          ),
                          const SizedBox(width: 12),
                        ],
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.1,
                                ),
                              ),
                              if (hasSubtitle) ...[
                                const SizedBox(height: 4),
                                Text(
                                  subtitle!,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: colors.onSurfaceVariant,
                                    height: 1.45,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (action != null) ...[
                          const SizedBox(width: 12),
                          action!,
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              SizedBox(height: hasSubtitle ? 16 : 14),
              child,
            ],
          ),
        ),
      ),
    );
  }
}
