import 'package:flutter/material.dart';

import '../file_reference.dart';
import '../models.dart';
import 'lazy_network_image.dart';

class ProductImage extends StatelessWidget {
  const ProductImage({
    super.key,
    required this.product,
    required this.width,
    required this.height,
    required this.borderRadius,
    this.fit = BoxFit.cover,
    this.contentPadding = EdgeInsets.zero,
    this.iconSize = 24,
    this.showSurfaceDecoration = true,
  });

  final Product product;
  final double width;
  final double height;
  final BorderRadius borderRadius;
  final BoxFit fit;
  final EdgeInsetsGeometry contentPadding;
  final double iconSize;
  final bool showSurfaceDecoration;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final imageUrl = product.imageUrl?.trim().isNotEmpty == true
        ? resolveFileReference(product.imageUrl!.trim())
        : null;
    final imageContent = SizedBox(
      width: width,
      height: height,
      child: imageUrl == null
          ? _fallback(context)
          : Padding(
              padding: contentPadding,
              child: LazyNetworkImage(
                url: imageUrl,
                width: width,
                height: height,
                fit: fit,
                filterQuality: FilterQuality.medium,
                placeholderBuilder: (context) => _fallback(context),
                errorBuilder: (context, error, stackTrace) =>
                    _fallback(context),
              ),
            ),
    );
    return ClipRRect(
      borderRadius: borderRadius,
      child: showSurfaceDecoration
          ? DecoratedBox(
              decoration: BoxDecoration(
                color: colors.surfaceContainerLow,
                border: Border.all(
                  color: colors.outlineVariant.withValues(alpha: 0.4),
                ),
              ),
              child: imageContent,
            )
          : imageContent,
    );
  }

  Widget _fallback(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [colors.surfaceContainerHigh, colors.surfaceContainerLow],
        ),
      ),
      child: Center(
        child: Icon(
          Icons.headphones_outlined,
          size: iconSize,
          color: colors.primary.withValues(alpha: 0.92),
        ),
      ),
    );
  }
}
