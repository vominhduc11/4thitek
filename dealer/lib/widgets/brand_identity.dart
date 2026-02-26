import 'package:flutter/material.dart';

class BrandAssets {
  const BrandAssets._();

  static const logoIcon = 'assets/images/logo.png';
  static const logoWordmark = 'assets/images/logo-4t.png';
}

class BrandLogoIcon extends StatelessWidget {
  const BrandLogoIcon({super.key, this.size = 24});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      BrandAssets.logoIcon,
      width: size,
      height: size,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) {
        return SizedBox(
          width: size,
          height: size,
          child: Icon(
            Icons.storefront_outlined,
            size: size * 0.75,
            color: Theme.of(context).colorScheme.primary,
          ),
        );
      },
    );
  }
}

class BrandLogoWordmark extends StatelessWidget {
  const BrandLogoWordmark({super.key, this.height = 24, this.width});

  final double height;
  final double? width;

  @override
  Widget build(BuildContext context) {
    final resolvedWidth = width ?? (height * 3.0);
    return Image.asset(
      BrandAssets.logoWordmark,
      width: resolvedWidth,
      height: height,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) {
        return SizedBox(
          width: resolvedWidth,
          height: height,
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              '4THITEK',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ),
        );
      },
    );
  }
}

class BrandAppBarTitle extends StatelessWidget {
  const BrandAppBarTitle(this.title, {super.key, this.maxLines = 1});

  final String title;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const BrandLogoIcon(size: 22),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            title,
            maxLines: maxLines,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
