import 'package:flutter/material.dart';

class ResponsiveHeroCard extends StatelessWidget {
  const ResponsiveHeroCard({
    super.key,
    required this.leading,
    this.trailingBadge,
    required this.title,
    required this.subtitle,
    this.footerChips = const [],
    this.compactHeaderGap = 16,
  });

  final Widget leading;
  final Widget? trailingBadge;
  final String title;
  final String subtitle;
  final List<Widget> footerChips;
  final double compactHeaderGap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colors.surfaceContainerHigh.withValues(alpha: 0.98),
            colors.surfaceContainer.withValues(alpha: 0.94),
          ],
        ),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.55),
        ),
        boxShadow: [
          BoxShadow(
            color: colors.shadow.withValues(alpha: 0.03),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 620;
                final header = Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: colors.onSurface,
                        height: 1.15,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      subtitle,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                  ],
                );

                if (compact) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          leading,
                          if (trailingBadge != null) ...[
                            const SizedBox(width: 14),
                            Expanded(child: trailingBadge!),
                          ],
                        ],
                      ),
                      SizedBox(height: compactHeaderGap),
                      header,
                    ],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    leading,
                    const SizedBox(width: 16),
                    Expanded(child: header),
                    if (trailingBadge != null) ...[
                      const SizedBox(width: 12),
                      trailingBadge!,
                    ],
                  ],
                );
              },
            ),
            if (footerChips.isNotEmpty) ...[
              const SizedBox(height: 18),
              Wrap(spacing: 10, runSpacing: 10, children: footerChips),
            ],
          ],
        ),
      ),
    );
  }
}
