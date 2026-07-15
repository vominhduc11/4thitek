part of 'product_detail_screen.dart';

class _DescriptionSection extends StatelessWidget {
  const _DescriptionSection({
    required this.items,
    required this.contentPadding,
  });

  final List<ProductDescriptionItem> items;
  final double contentPadding;

  @override
  Widget build(BuildContext context) {
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: EdgeInsets.all(contentPadding),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            texts.detailedDescriptionTitle,
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          if (items.isEmpty)
            Text(
              texts.noDetailedDescriptionMessage,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
            )
          else
            ...items.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _DescriptionItemView(item: item),
              ),
            ),
        ],
      ),
    );
  }
}

class _DescriptionItemView extends StatelessWidget {
  const _DescriptionItemView({required this.item});

  final ProductDescriptionItem item;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final text = item.text?.trim() ?? '';
    final caption = item.caption?.trim() ?? '';
    final url = item.url?.trim() ?? '';
    final gallery = item.gallery
        .map((entry) => entry.trim())
        .where((entry) => entry.isNotEmpty)
        .toList();

    switch (item.type) {
      case ProductDescriptionType.title:
        if (text.isEmpty) {
          return const SizedBox.shrink();
        }
        return Text(
          text,
          style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
        );
      case ProductDescriptionType.description:
        if (text.isEmpty) {
          return const SizedBox.shrink();
        }
        return Html(
          data: text,
          style: {
            'body': Style(
              margin: Margins.zero,
              padding: HtmlPaddings.zero,
              fontSize: FontSize(textTheme.bodyMedium?.fontSize ?? 14),
              lineHeight: const LineHeight(1.55),
              color: colors.onSurface,
            ),
            'p': Style(margin: Margins.only(bottom: 8)),
            'h1': Style(
              fontSize: FontSize(textTheme.headlineSmall?.fontSize ?? 22),
              fontWeight: FontWeight.w700,
              margin: Margins.only(bottom: 8, top: 12),
            ),
            'h2': Style(
              fontSize: FontSize(textTheme.titleLarge?.fontSize ?? 18),
              fontWeight: FontWeight.w700,
              margin: Margins.only(bottom: 8, top: 12),
            ),
            'h3': Style(
              fontSize: FontSize(textTheme.titleMedium?.fontSize ?? 16),
              fontWeight: FontWeight.w700,
              margin: Margins.only(bottom: 6, top: 10),
            ),
            'hr': Style(
              border: Border(
                top: BorderSide(color: colors.outlineVariant, width: 1.5),
              ),
              margin: Margins.symmetric(vertical: 12),
            ),
            'strong': Style(fontWeight: FontWeight.w700),
            'a': Style(color: colors.primary),
            'ul': Style(margin: Margins.only(bottom: 8, left: 16)),
            'ol': Style(margin: Margins.only(bottom: 8, left: 16)),
            'li': Style(margin: Margins.only(bottom: 4)),
          },
        );
      case ProductDescriptionType.image:
        if (url.isEmpty && caption.isEmpty) {
          return const SizedBox.shrink();
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (url.isNotEmpty) _MediaPreview(url: url),
            if (caption.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                caption,
                style: textTheme.bodySmall?.copyWith(
                  color: colors.onSurfaceVariant,
                ),
              ),
            ],
          ],
        );
      case ProductDescriptionType.gallery:
        if (gallery.isEmpty && caption.isEmpty) {
          return const SizedBox.shrink();
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (gallery.isNotEmpty)
              LayoutBuilder(
                builder: (context, constraints) {
                  final columns = constraints.maxWidth >= 560 ? 3 : 2;
                  const spacing = 8.0;
                  final tileWidth =
                      (constraints.maxWidth - spacing * (columns - 1)) /
                      columns;
                  return Wrap(
                    spacing: spacing,
                    runSpacing: spacing,
                    children: gallery
                        .map(
                          (imageUrl) => SizedBox(
                            width: tileWidth,
                            child: _MediaPreview(url: imageUrl),
                          ),
                        )
                        .toList(),
                  );
                },
              ),
            if (caption.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                caption,
                style: textTheme.bodySmall?.copyWith(
                  color: colors.onSurfaceVariant,
                ),
              ),
            ],
          ],
        );
      case ProductDescriptionType.video:
        if (url.isEmpty && caption.isEmpty && text.isEmpty) {
          return const SizedBox.shrink();
        }
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: colors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: colors.primary.withValues(alpha: 0.18)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.play_circle_outline, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (text.isNotEmpty)
                      Text(
                        text,
                        style: textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    if (caption.isNotEmpty)
                      Text(
                        caption,
                        style: textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    if (url.isNotEmpty)
                      Text(
                        url,
                        style: textTheme.labelSmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
    }
  }
}
