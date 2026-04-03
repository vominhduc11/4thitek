import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../business_profile.dart';

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
              BusinessProfile.brandName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontFamily: GoogleFonts.montserrat().fontFamily,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.18,
              ),
            ),
          ),
        );
      },
    );
  }
}

class BrandAppBarTitle extends StatelessWidget {
  const BrandAppBarTitle(
    this.title, {
    super.key,
    this.maxLines = 1,
    this.logoSize = 30,
    this.logoGap = 4,
  });

  final String title;
  final int maxLines;
  final double logoSize;
  final double logoGap;

  @override
  Widget build(BuildContext context) {
    final titleStyle = Theme.of(context).textTheme.titleLarge?.copyWith(
      fontWeight: FontWeight.w800,
      letterSpacing: -0.08,
    );

    return Row(
      children: [
        BrandLogoIcon(size: logoSize),
        SizedBox(width: logoGap),
        Expanded(
          child: Text(
            title,
            maxLines: maxLines,
            overflow: TextOverflow.ellipsis,
            style: titleStyle,
          ),
        ),
      ],
    );
  }
}
