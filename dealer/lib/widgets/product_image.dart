import 'package:flutter/material.dart';

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
    this.iconSize = 24,
  });

  final Product product;
  final double width;
  final double height;
  final BorderRadius borderRadius;
  final BoxFit fit;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final imageUrl = product.imageUrl?.trim().isNotEmpty == true
        ? product.imageUrl!.trim()
        : _buildProductImageUrl(product.id);
    return ClipRRect(
      borderRadius: borderRadius,
      child: Container(
        width: width,
        height: height,
        color: const Color(0xFFEFF3FB),
        child: LazyNetworkImage(
          url: imageUrl,
          width: width,
          height: height,
          fit: fit,
          filterQuality: FilterQuality.medium,
          placeholderBuilder: (context) => _fallback(),
          errorBuilder: (context, error, stackTrace) => _fallback(),
        ),
      ),
    );
  }

  Widget _fallback() {
    return Center(
      child: Icon(
        Icons.headphones_outlined,
        size: iconSize,
        color: const Color(0xFF4A5977),
      ),
    );
  }
}

String _buildProductImageUrl(String productId) {
  return 'https://picsum.photos/seed/dealer-$productId/800/800';
}
