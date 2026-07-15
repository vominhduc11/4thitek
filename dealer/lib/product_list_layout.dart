part of 'product_list_screen.dart';

enum _ProductListDeviceClass { mobile, tablet, desktop }

class _ProductListAdaptiveLayout {
  const _ProductListAdaptiveLayout({
    required this.deviceClass,
    required this.viewportWidth,
    required this.shortestSide,
    required this.textScale,
    required this.maxContentWidth,
    required this.baseHorizontalPadding,
    required this.gridSpacing,
    required this.minGridTileWidth,
    required this.maxGridColumns,
    required this.futureFilterRailWidth,
    required this.contentSectionGap,
  });

  factory _ProductListAdaptiveLayout.fromContext(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final viewportWidth = size.width;
    final shortestSide = size.shortestSide;
    final textScale = MediaQuery.textScalerOf(context).scale(1).clamp(1.0, 1.8);

    if (viewportWidth >= AppBreakpoints.desktop) {
      const futureFilterRailWidth = 280.0;
      const contentSectionGap = 28.0;
      return _ProductListAdaptiveLayout(
        deviceClass: _ProductListDeviceClass.desktop,
        viewportWidth: viewportWidth,
        shortestSide: shortestSide,
        textScale: textScale,
        maxContentWidth: 1120 + futureFilterRailWidth + contentSectionGap,
        baseHorizontalPadding: 32,
        gridSpacing: 20,
        minGridTileWidth: 228,
        maxGridColumns: 6,
        futureFilterRailWidth: futureFilterRailWidth,
        contentSectionGap: contentSectionGap,
      );
    }

    if (viewportWidth >= 700 || shortestSide >= AppBreakpoints.phone) {
      return _ProductListAdaptiveLayout(
        deviceClass: _ProductListDeviceClass.tablet,
        viewportWidth: viewportWidth,
        shortestSide: shortestSide,
        textScale: textScale,
        maxContentWidth: _tabletListMaxContentWidth,
        baseHorizontalPadding: 24,
        gridSpacing: 16,
        minGridTileWidth: 220,
        maxGridColumns: 4,
        futureFilterRailWidth: 0,
        contentSectionGap: 24,
      );
    }

    return _ProductListAdaptiveLayout(
      deviceClass: _ProductListDeviceClass.mobile,
      viewportWidth: viewportWidth,
      shortestSide: shortestSide,
      textScale: textScale,
      maxContentWidth: double.infinity,
      baseHorizontalPadding: 16,
      gridSpacing: 12,
      minGridTileWidth: 248,
      maxGridColumns: 2,
      futureFilterRailWidth: 0,
      contentSectionGap: 16,
    );
  }

  final _ProductListDeviceClass deviceClass;
  final double viewportWidth;
  final double shortestSide;
  final double textScale;
  final double maxContentWidth;
  final double baseHorizontalPadding;
  final double gridSpacing;
  final double minGridTileWidth;
  final int maxGridColumns;
  final double futureFilterRailWidth;
  final double contentSectionGap;

  bool get isMobile => deviceClass == _ProductListDeviceClass.mobile;
  bool get isTablet => deviceClass != _ProductListDeviceClass.mobile;
  bool get isDesktop => deviceClass == _ProductListDeviceClass.desktop;
  bool get supportsFutureFilterRail => futureFilterRailWidth > 0;

  double get centeredHorizontalPadding {
    if (!maxContentWidth.isFinite) {
      return baseHorizontalPadding;
    }

    final availableWidth = viewportWidth - (baseHorizontalPadding * 2);
    if (availableWidth <= maxContentWidth) {
      return baseHorizontalPadding;
    }

    return baseHorizontalPadding + ((availableWidth - maxContentWidth) / 2);
  }

  double get stickyOuterTopPadding => isMobile ? 4 : 8;

  double get stickyOuterBottomPadding => isDesktop ? 16 : (isMobile ? 10 : 14);

  double resolveResultsBottomPadding({required double bottomSafeArea}) {
    if (isDesktop) {
      return 32;
    }
    if (isMobile) {
      return 104 + bottomSafeArea;
    }
    return 24;
  }

  double get filterRowHeight =>
      (isMobile ? 42 : 48) + ((textScale - 1) * (isMobile ? 10 : 12));

  double get filterSectionSpacing => isDesktop ? 12 : 10;

  double get summaryWidth => isDesktop ? 188 : 156;

  double get desktopSearchFieldWidth =>
      (viewportWidth * 0.26).clamp(320.0, 420.0).toDouble();

  double get stickyHeaderExtent {
    final bannerHeight = isMobile
        ? 34 + ((textScale - 1) * 8)
        : 44 + ((textScale - 1) * 10);
    final searchRowHeight = isMobile
        ? 48 + ((textScale - 1) * 10)
        : 48 + ((textScale - 1) * 10);
    final summaryRowHeight = 40 + ((textScale - 1) * 8);

    if (isMobile) {
      return stickyOuterTopPadding +
          stickyOuterBottomPadding +
          10 +
          bannerHeight +
          8 +
          searchRowHeight +
          8 +
          filterRowHeight +
          8 +
          summaryRowHeight +
          8;
    }

    if (isDesktop) {
      return stickyOuterTopPadding +
          stickyOuterBottomPadding +
          16 +
          math.max(bannerHeight, searchRowHeight) +
          filterSectionSpacing +
          filterRowHeight +
          14;
    }

    return stickyOuterTopPadding +
        stickyOuterBottomPadding +
        12 +
        bannerHeight +
        10 +
        searchRowHeight +
        10 +
        filterRowHeight +
        12;
  }

  _ProductGridGeometry resolveGridGeometry(double crossAxisExtent) {
    final minGridColumns = isMobile ? 1 : 2;
    final rawColumnCount =
        ((crossAxisExtent + gridSpacing) / (minGridTileWidth + gridSpacing))
            .floor();
    final crossAxisCount = rawColumnCount.clamp(minGridColumns, maxGridColumns);
    final itemWidth =
        (crossAxisExtent - ((crossAxisCount - 1) * gridSpacing)) /
        crossAxisCount;

    return _ProductGridGeometry(
      crossAxisCount: crossAxisCount,
      crossAxisSpacing: gridSpacing,
      mainAxisSpacing: gridSpacing,
      itemExtent: _resolveGridItemExtent(itemWidth),
    );
  }

  double _resolveGridItemExtent(double itemWidth) {
    if (isMobile) {
      final mediaExtent = math.max(0, (itemWidth - 28) / 1.56);
      const contentHeight = 184.0;
      return mediaExtent + contentHeight + ((textScale - 1) * 102);
    }

    final mediaExtent = math.max(
      0,
      (itemWidth - 32) * (itemWidth >= 300 ? 0.84 : 0.88),
    );
    final contentHeight = itemWidth >= 300 ? 204.0 : 216.0;
    return mediaExtent + contentHeight + ((textScale - 1) * 96);
  }
}

class _ProductGridGeometry {
  const _ProductGridGeometry({
    required this.crossAxisCount,
    required this.crossAxisSpacing,
    required this.mainAxisSpacing,
    required this.itemExtent,
  });

  final int crossAxisCount;
  final double crossAxisSpacing;
  final double mainAxisSpacing;
  final double itemExtent;
}

class _PinnedHeaderDelegate extends SliverPersistentHeaderDelegate {
  const _PinnedHeaderDelegate({
    required this.minExtent,
    required this.maxExtent,
    required this.child,
  });

  @override
  final double minExtent;

  @override
  final double maxExtent;

  final Widget child;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return SizedBox.expand(
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        decoration: BoxDecoration(
          boxShadow: overlapsContent
              ? [
                  BoxShadow(
                    color: Theme.of(
                      context,
                    ).shadowColor.withValues(alpha: 0.06),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: child,
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _PinnedHeaderDelegate oldDelegate) {
    return oldDelegate.child != child ||
        oldDelegate.minExtent != minExtent ||
        oldDelegate.maxExtent != maxExtent;
  }
}

class _ProductListStatePanel extends StatelessWidget {
  const _ProductListStatePanel({
    required this.icon,
    required this.title,
    required this.description,
    this.actions = const <Widget>[],
    this.compact = false,
  });

  final IconData icon;
  final String title;
  final String description;
  final List<Widget> actions;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: compact ? 360 : 380),
      child: Semantics(
        container: true,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: colors.outlineVariant.withValues(alpha: 0.55),
            ),
            boxShadow: [
              BoxShadow(
                color: theme.shadowColor.withValues(alpha: 0.03),
                blurRadius: 12,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Padding(
            padding: EdgeInsets.all(compact ? 18 : 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  icon,
                  size: compact ? 36 : 42,
                  color: colors.onSurfaceVariant,
                ),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colors.onSurfaceVariant,
                    height: 1.35,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (actions.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 8,
                    runSpacing: 8,
                    children: actions,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _InteractiveProductCardSurface extends StatefulWidget {
  const _InteractiveProductCardSurface({
    required this.borderRadius,
    required this.side,
    required this.onTap,
    required this.child,
  });

  final BorderRadius borderRadius;
  final BorderSide side;
  final VoidCallback onTap;
  final Widget child;

  @override
  State<_InteractiveProductCardSurface> createState() =>
      _InteractiveProductCardSurfaceState();
}

class _InteractiveProductCardSurfaceState
    extends State<_InteractiveProductCardSurface> {
  bool _isHovered = false;
  bool _isPressed = false;
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final highlight = _isHovered || _isFocused;
    final borderColor = highlight
        ? Color.lerp(widget.side.color, colors.primary, 0.38)!
        : widget.side.color;
    final shadowAlpha = _isPressed
        ? 0.02
        : highlight
        ? 0.06
        : 0.0;
    final translateY = _isPressed
        ? 0.0
        : _isHovered
        ? -1.0
        : 0.0;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 160),
      curve: Curves.easeOutCubic,
      transform: Matrix4.translationValues(0, translateY, 0),
      decoration: ShapeDecoration(
        color: theme.cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: widget.borderRadius,
          side: BorderSide(color: borderColor, width: widget.side.width),
        ),
        shadows: shadowAlpha == 0
            ? const <BoxShadow>[]
            : [
                BoxShadow(
                  color: theme.shadowColor.withValues(alpha: shadowAlpha),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(borderRadius: widget.borderRadius),
        child: InkWell(
          onTap: widget.onTap,
          onHover: (value) => setState(() => _isHovered = value),
          onHighlightChanged: (value) => setState(() => _isPressed = value),
          onFocusChange: (value) => setState(() => _isFocused = value),
          overlayColor: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.pressed)) {
              return colors.primary.withValues(alpha: 0.08);
            }
            if (states.contains(WidgetState.hovered) ||
                states.contains(WidgetState.focused)) {
              return colors.primary.withValues(alpha: 0.04);
            }
            return null;
          }),
          borderRadius: widget.borderRadius,
          child: widget.child,
        ),
      ),
    );
  }
}

class _ProductCardSkeleton extends StatelessWidget {
  const _ProductCardSkeleton({this.isGridLayout = false});

  final bool isGridLayout;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.all(isGridLayout ? 16 : 14),
        child: isGridLayout
            ? const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonBox(
                    width: double.infinity,
                    height: 172,
                    borderRadius: BorderRadius.all(Radius.circular(22)),
                  ),
                  SizedBox(height: 12),
                  SkeletonBox(width: double.infinity, height: 22),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: SkeletonBox(width: double.infinity, height: 16),
                      ),
                      SizedBox(width: 12),
                      SkeletonBox(width: 96, height: 28),
                    ],
                  ),
                  SizedBox(height: 12),
                  Row(
                    children: [
                      SkeletonBox(width: 84, height: 28),
                      SizedBox(width: 8),
                      SkeletonBox(width: 92, height: 28),
                    ],
                  ),
                  SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: SkeletonBox(width: double.infinity, height: 50),
                      ),
                      SizedBox(width: 10),
                      SkeletonBox(width: 50, height: 50),
                    ],
                  ),
                ],
              )
            : const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonBox(
                    width: double.infinity,
                    height: 176,
                    borderRadius: BorderRadius.all(Radius.circular(20)),
                  ),
                  SizedBox(height: 14),
                  SkeletonBox(width: double.infinity, height: 22),
                  SizedBox(height: 6),
                  SkeletonBox(width: 148, height: 14),
                  SizedBox(height: 14),
                  SkeletonBox(width: 96, height: 14),
                  SizedBox(height: 6),
                  SkeletonBox(width: 140, height: 24),
                  SizedBox(height: 12),
                  SkeletonBox(width: 122, height: 28),
                  SizedBox(height: 16),
                  SkeletonBox(width: double.infinity, height: 52),
                ],
              ),
      ),
    );
  }
}
