import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_spinbox/flutter_spinbox.dart';
import 'package:chewie/chewie.dart';
import 'package:video_player/video_player.dart';

import 'cart_controller.dart';
import 'checkout_screen.dart';
import 'cart_screen.dart';
import 'models.dart';
import 'utils.dart';
import 'widgets/cart_icon_button.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/lazy_network_image.dart';
import 'widgets/product_image.dart';
import 'widgets/skeleton_box.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key, required this.product});

  final Product product;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  static const double _tabletBreakpoint = 760;
  static const double _midRangeBreakpoint = 560;
  static const double _smallMobileBreakpoint = 360;
  static const Duration _detailApiLatency = Duration(milliseconds: 900);

  bool _isLoadingDetail = true;
  bool _isAddingToCart = false;
  bool _isBuyingNow = false;
  double _bottomBarHeight = 0;

  @override
  void initState() {
    super.initState();
    _simulateFetchProductDetail();
  }

  Future<void> _simulateFetchProductDetail() async {
    await Future.delayed(_detailApiLatency);
    if (!mounted) {
      return;
    }
    setState(() => _isLoadingDetail = false);
  }

  Future<void> _handleAddToCart(CartController cart) async {
    if (_isAddingToCart) {
      return;
    }
    final remainingStock = cart.remainingStockFor(widget.product);
    if (!widget.product.isOrderable || remainingStock <= 0) {
      _showMaxStockMessage();
      return;
    }
    final addQuantity = await _showAddQuantityDialog(
      title: 'Th\u00eam v\u00e0o gi\u1ecf',
      confirmLabel: 'Th\u00eam',
      productName: widget.product.name,
      maxQuantity: remainingStock,
      quantityInCart: cart.quantityFor(widget.product.id),
    );
    if (!mounted) {
      return;
    }
    if (addQuantity == null) {
      return;
    }
    if (!cart.canAdd(widget.product, quantity: addQuantity)) {
      _showMaxStockMessage();
      return;
    }

    setState(() => _isAddingToCart = true);
    try {
      final didAdd = await cart.addWithApiSimulation(
        widget.product,
        quantity: addQuantity,
      );
      if (!mounted) {
        return;
      }
      final messenger = ScaffoldMessenger.of(context);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            content: Text(
              didAdd
                  ? 'Đã thêm ${widget.product.name} (x$addQuantity) vào giỏ hàng'
                  : 'Sản phẩm đã đạt giới hạn tồn kho',
            ),
            action: didAdd
                ? SnackBarAction(
                    label: 'Xem giỏ',
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const CartScreen(),
                        ),
                      );
                    },
                  )
                : null,
          ),
        );
    } finally {
      if (mounted) {
        setState(() => _isAddingToCart = false);
      }
    }
  }

  Future<void> _handleBuyNow(CartController cart) async {
    if (_isBuyingNow) {
      return;
    }
    final remainingStock = cart.remainingStockFor(widget.product);
    if (!widget.product.isOrderable || remainingStock <= 0) {
      _showMaxStockMessage();
      return;
    }
    final addQuantity = await _showAddQuantityDialog(
      title: 'Mua ngay',
      confirmLabel: 'Ti\u1ebfp t\u1ee5c',
      productName: widget.product.name,
      maxQuantity: remainingStock,
      quantityInCart: cart.quantityFor(widget.product.id),
    );
    if (!mounted || addQuantity == null) {
      return;
    }
    if (!cart.canAdd(widget.product, quantity: addQuantity)) {
      _showMaxStockMessage();
      return;
    }

    setState(() => _isBuyingNow = true);
    try {
      final didAdd = await cart.addWithApiSimulation(
        widget.product,
        quantity: addQuantity,
      );
      if (!mounted) {
        return;
      }
      if (!didAdd) {
        _showMaxStockMessage();
        return;
      }
      Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (context) => const CheckoutScreen()));
    } finally {
      if (mounted) {
        setState(() => _isBuyingNow = false);
      }
    }
  }

  Future<int?> _showAddQuantityDialog({
    required String title,
    required String confirmLabel,
    required String productName,
    required int maxQuantity,
    required int quantityInCart,
  }) async {
    final minQuantity = widget.product.effectiveMinOrderQty;
    var selectedQuantity = minQuantity <= maxQuantity
        ? minQuantity
        : maxQuantity;
    final result = await showDialog<int>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(title),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    productName,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Text('Tối thiểu: $minQuantity  •  Tối đa: $maxQuantity'),
                  if (quantityInCart > 0) ...[
                    const SizedBox(height: 6),
                    Text(
                      'Bạn đã có $quantityInCart trong giỏ.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  SpinBox(
                    min: minQuantity.toDouble(),
                    max: maxQuantity.toDouble(),
                    value: selectedQuantity.toDouble(),
                    decimals: 0,
                    step: 1,
                    autofocus: true,
                    textInputAction: TextInputAction.done,
                    onChanged: (value) {
                      setDialogState(() {
                        selectedQuantity = value.round().clamp(
                          minQuantity,
                          maxQuantity,
                        );
                      });
                    },
                  ),
                  if (selectedQuantity == maxQuantity)
                    Text(
                      'Đã đạt tối đa theo tồn kho.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  if (selectedQuantity == minQuantity && minQuantity > 1)
                    Text(
                      'Số lượng tối thiểu: $minQuantity',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Hủy'),
                ),
                ElevatedButton(
                  onPressed: () =>
                      Navigator.of(dialogContext).pop(selectedQuantity),
                  child: Text(confirmLabel),
                ),
              ],
            );
          },
        );
      },
    );
    return result;
  }

  void _showMaxStockMessage() {
    final messenger = ScaffoldMessenger.of(context);
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(
            widget.product.isOrderable
                ? 'Sản phẩm đã hết hàng hoặc đã đạt giới hạn trong giỏ'
                : 'Sản phẩm tạm ngưng phân phối',
          ),
        ),
      );
  }

  String? _buildActionDisabledReason({
    required int remainingStock,
    required int suggestedAddQuantity,
  }) {
    if (!widget.product.isOrderable) {
      return 'Sản phẩm tạm ngưng phân phối';
    }
    if (remainingStock <= 0) {
      return 'Sản phẩm đã hết hàng';
    }
    if (suggestedAddQuantity <= 0) {
      return 'Đã đạt giới hạn số lượng trong giỏ';
    }
    return null;
  }

  List<ProductDescriptionItem> _buildVisibleDescriptionItems(Product product) {
    final items = product.effectiveDescriptions;
    return items.where((item) {
      final text = item.text?.trim() ?? '';
      final caption = item.caption?.trim() ?? '';
      final hasUrl = item.url?.trim().isNotEmpty == true;
      final hasGallery = item.gallery.any((url) => url.trim().isNotEmpty);
      return text.isNotEmpty || caption.isNotEmpty || hasUrl || hasGallery;
    }).toList();
  }

  List<ProductVideoItem> _buildVisibleVideos(Product product) {
    return product.effectiveVideos.where((video) {
      return video.title.trim().isNotEmpty ||
          video.url.trim().isNotEmpty ||
          (video.description?.trim().isNotEmpty ?? false);
    }).toList();
  }

  void _handleBottomBarHeightChanged(double height) {
    if (!mounted || (_bottomBarHeight - height).abs() < 0.5) {
      return;
    }
    setState(() => _bottomBarHeight = height);
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final cart = CartScope.of(context);
    final remainingStock = cart.remainingStockFor(widget.product);
    final quantityInCart = cart.quantityFor(widget.product.id);
    final suggestedAddQuantity = cart.suggestedAddQuantity(widget.product);
    final descriptionItems = _buildVisibleDescriptionItems(widget.product);
    final videos = _buildVisibleVideos(widget.product);
    final mediaQuery = MediaQuery.of(context);
    final screenSize = mediaQuery.size;
    final width = screenSize.width;
    final height = screenSize.height;
    final shortestSide = screenSize.shortestSide;
    final isLandscape = mediaQuery.orientation == Orientation.landscape;
    final isTablet = width >= _tabletBreakpoint && shortestSide >= 600;
    final isSmallMobile = width <= _smallMobileBreakpoint;
    final isMidRange = !isTablet && width >= _midRangeBreakpoint;
    final isLandscapePhone = isLandscape && !isTablet;
    final isVerticallyTight = !isTablet && (isLandscape || height < 640);
    final horizontalPadding = isTablet
        ? 28.0
        : isMidRange
        ? 24.0
        : isSmallMobile
        ? 16.0
        : 20.0;
    final contentMaxWidth = isTablet
        ? 760.0
        : isMidRange
        ? 640.0
        : double.infinity;
    final heroImageHeight = isTablet
        ? 280.0
        : isLandscapePhone
        ? 136.0
        : isSmallMobile
        ? 196.0
        : 220.0;
    final heroIconSize = isTablet
        ? 72.0
        : isLandscapePhone
        ? 58.0
        : 64.0;
    final heroToContentGap = isVerticallyTight ? 12.0 : 18.0;
    final sectionGap = isVerticallyTight ? 10.0 : 12.0;
    final sectionCardPadding = isTablet
        ? 18.0
        : isVerticallyTight
        ? 12.0
        : 14.0;
    final headerCardPadding = isTablet
        ? 20.0
        : isVerticallyTight
        ? 14.0
        : 16.0;
    final addToCartDisabledReason = _buildActionDisabledReason(
      remainingStock: remainingStock,
      suggestedAddQuantity: suggestedAddQuantity,
    );
    final buyNowDisabledReason = addToCartDisabledReason;
    final fallbackBarHeight = isSmallMobile
        ? 132.0
        : isTablet
        ? 110.0
        : 96.0;
    final measuredBarHeight = _bottomBarHeight > 0
        ? _bottomBarHeight
        : fallbackBarHeight + mediaQuery.padding.bottom;
    final contentBottomPadding = measuredBarHeight + 12;

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(widget.product.name),
        actions: [
          CartIconButton(
            count: cart.totalItems,
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const CartScreen()),
              );
            },
          ),
          const SizedBox(width: 6),
        ],
      ),
      bottomNavigationBar: _BottomBarHeightReporter(
        onHeightChanged: _handleBottomBarHeightChanged,
        child: _isLoadingDetail
            ? _BottomActionBarPlaceholder(
                isTablet: isTablet,
                isSmallMobile: isSmallMobile,
              )
            : _BottomActionBar(
                price: widget.product.price,
                remainingStock: remainingStock,
                quantityInCart: quantityInCart,
                minOrderQty: widget.product.effectiveMinOrderQty,
                isOrderable: widget.product.isOrderable,
                nextAddQuantity: suggestedAddQuantity,
                addToCartDisabledReason: addToCartDisabledReason,
                buyNowDisabledReason: buyNowDisabledReason,
                isTablet: isTablet,
                isSmallMobile: isSmallMobile,
                isAddingToCart: _isAddingToCart,
                isBuyingNow: _isBuyingNow,
                onAddToCart: suggestedAddQuantity > 0 && !_isAddingToCart
                    ? () => _handleAddToCart(cart)
                    : null,
                onBuyNow: suggestedAddQuantity > 0 && !_isBuyingNow
                    ? () => _handleBuyNow(cart)
                    : null,
              ),
      ),
      body: _isLoadingDetail
          ? _ProductDetailLoadingView(
              horizontalPadding: horizontalPadding,
              maxWidth: contentMaxWidth,
              heroImageHeight: heroImageHeight,
              bottomPadding: contentBottomPadding,
            )
          : Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: contentMaxWidth),
                child: SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(
                    horizontalPadding,
                    16,
                    horizontalPadding,
                    contentBottomPadding,
                  ),
                  child: FadeSlideIn(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Hero(
                          tag: 'product-image-${widget.product.id}',
                          child: ProductImage(
                            product: widget.product,
                            width: double.infinity,
                            height: heroImageHeight,
                            borderRadius: BorderRadius.circular(24),
                            iconSize: heroIconSize,
                          ),
                        ),
                        SizedBox(height: heroToContentGap),
                        Container(
                          padding: EdgeInsets.all(headerCardPadding),
                          decoration: BoxDecoration(
                            color: colors.surface,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: colors.outlineVariant.withValues(
                                alpha: 0.6,
                              ),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(
                                      widget.product.name,
                                      style: Theme.of(context)
                                          .textTheme
                                          .headlineSmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.w700,
                                          ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        'Giá đại lý',
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelSmall
                                            ?.copyWith(
                                              color: colors.onSurfaceVariant,
                                            ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Chưa gồm VAT',
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelSmall
                                            ?.copyWith(
                                              color: colors.onSurfaceVariant,
                                            ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        formatVnd(widget.product.price),
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleLarge
                                            ?.copyWith(
                                              fontWeight: FontWeight.w700,
                                              color: Theme.of(
                                                context,
                                              ).colorScheme.primary,
                                            ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'SKU: ${widget.product.sku}',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(color: colors.onSurfaceVariant),
                              ),
                              const SizedBox(height: 12),
                              _StockBadge(remainingStock: remainingStock),
                              const SizedBox(height: 14),
                              Text(
                                widget.product.shortDescription,
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(
                                      color: colors.onSurfaceVariant,
                                      height: 1.55,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: sectionGap),
                        _QuickInfoSection(
                          isTablet: isTablet,
                          stock: widget.product.stock,
                          remainingStock: remainingStock,
                          quantityInCart: quantityInCart,
                          minOrderQty: widget.product.effectiveMinOrderQty,
                          orderStep: widget.product.effectiveOrderStep,
                          warrantyMonths: widget.product.warrantyMonths,
                          nextAddQuantity: suggestedAddQuantity,
                          isOrderable: widget.product.isOrderable,
                        ),
                        if (descriptionItems.isNotEmpty) ...[
                          SizedBox(height: sectionGap),
                          _DescriptionSection(
                            items: descriptionItems,
                            contentPadding: sectionCardPadding,
                          ),
                        ],
                        if (videos.isNotEmpty) ...[
                          SizedBox(height: sectionGap),
                          _VideoSection(
                            videos: videos,
                            contentPadding: sectionCardPadding,
                          ),
                        ],
                        if (widget.product.specifications.isNotEmpty) ...[
                          SizedBox(height: sectionGap),
                          Container(
                            padding: EdgeInsets.all(sectionCardPadding),
                            decoration: BoxDecoration(
                              color: colors.surface,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: colors.outlineVariant.withValues(
                                  alpha: 0.6,
                                ),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Thông số kỹ thuật',
                                  style: Theme.of(context).textTheme.titleSmall
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 10),
                                ...widget.product.specifications
                                    .asMap()
                                    .entries
                                    .map((entry) {
                                      final index = entry.key;
                                      final spec = entry.value;
                                      final isLast =
                                          index ==
                                          widget.product.specifications.length -
                                              1;
                                      return Padding(
                                        padding: const EdgeInsets.only(
                                          bottom: 8,
                                        ),
                                        child: Column(
                                          children: [
                                            Row(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Expanded(
                                                  flex: 4,
                                                  child: Text(
                                                    spec.label,
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .bodySmall
                                                        ?.copyWith(
                                                          color: colors
                                                              .onSurfaceVariant,
                                                        ),
                                                  ),
                                                ),
                                                const SizedBox(width: 12),
                                                Expanded(
                                                  flex: 6,
                                                  child: Text(
                                                    spec.value,
                                                    textAlign: TextAlign.right,
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .bodySmall
                                                        ?.copyWith(
                                                          fontWeight:
                                                              FontWeight.w600,
                                                        ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            if (!isLast) ...[
                                              const SizedBox(height: 8),
                                              Divider(
                                                height: 1,
                                                color: colors.outlineVariant
                                                    .withValues(alpha: 0.5),
                                              ),
                                            ],
                                          ],
                                        ),
                                      );
                                    }),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}

enum _QuickInfoTone { neutral, info, success, warning, danger }

class _QuickInfoItemData {
  const _QuickInfoItemData({
    required this.label,
    required this.value,
    required this.icon,
    this.tone = _QuickInfoTone.neutral,
  });

  final String label;
  final String value;
  final IconData icon;
  final _QuickInfoTone tone;
}

class _QuickInfoPalette {
  const _QuickInfoPalette({
    required this.background,
    required this.border,
    required this.iconBackground,
    required this.iconColor,
    required this.valueColor,
  });

  final Color background;
  final Color border;
  final Color iconBackground;
  final Color iconColor;
  final Color valueColor;
}

_QuickInfoPalette _quickInfoPaletteFor(
  BuildContext context,
  _QuickInfoTone tone,
) {
  final colors = Theme.of(context).colorScheme;
  final isDark = Theme.of(context).brightness == Brightness.dark;
  switch (tone) {
    case _QuickInfoTone.info:
      return _QuickInfoPalette(
        background: colors.primary.withValues(alpha: isDark ? 0.18 : 0.08),
        border: colors.primary.withValues(alpha: isDark ? 0.34 : 0.2),
        iconBackground: colors.primary.withValues(alpha: isDark ? 0.26 : 0.14),
        iconColor: colors.primary,
        valueColor: colors.primary,
      );
    case _QuickInfoTone.success:
      return _QuickInfoPalette(
        background: colors.tertiary.withValues(alpha: isDark ? 0.2 : 0.12),
        border: colors.tertiary.withValues(alpha: isDark ? 0.34 : 0.2),
        iconBackground: colors.tertiary.withValues(alpha: isDark ? 0.28 : 0.18),
        iconColor: colors.tertiary,
        valueColor: colors.tertiary,
      );
    case _QuickInfoTone.warning:
      if (isDark) {
        return const _QuickInfoPalette(
          background: Color(0xFF4A3917),
          border: Color(0xFF6C4E16),
          iconBackground: Color(0xFF5C4518),
          iconColor: Color(0xFFF4D18A),
          valueColor: Color(0xFFF4D18A),
        );
      }
      return const _QuickInfoPalette(
        background: Color(0xFFFFF8EB),
        border: Color(0xFFFFE9C4),
        iconBackground: Color(0xFFFFF0D8),
        iconColor: Color(0xFFB26A00),
        valueColor: Color(0xFFA85F00),
      );
    case _QuickInfoTone.danger:
      return _QuickInfoPalette(
        background: colors.errorContainer.withValues(
          alpha: isDark ? 0.32 : 0.7,
        ),
        border: colors.error.withValues(alpha: isDark ? 0.4 : 0.24),
        iconBackground: colors.error.withValues(alpha: isDark ? 0.32 : 0.16),
        iconColor: colors.error,
        valueColor: colors.error,
      );
    case _QuickInfoTone.neutral:
      return _QuickInfoPalette(
        background: colors.surfaceContainerHighest.withValues(alpha: 0.4),
        border: colors.outlineVariant.withValues(alpha: 0.7),
        iconBackground: colors.secondaryContainer.withValues(alpha: 0.7),
        iconColor: colors.onSecondaryContainer,
        valueColor: colors.onSurface,
      );
  }
}

class _QuickInfoSection extends StatelessWidget {
  const _QuickInfoSection({
    required this.isTablet,
    required this.stock,
    required this.remainingStock,
    required this.quantityInCart,
    required this.minOrderQty,
    required this.orderStep,
    required this.warrantyMonths,
    required this.nextAddQuantity,
    required this.isOrderable,
  });

  final bool isTablet;
  final int stock;
  final int remainingStock;
  final int quantityInCart;
  final int minOrderQty;
  final int orderStep;
  final int warrantyMonths;
  final int nextAddQuantity;
  final bool isOrderable;

  _QuickInfoItemData _buildStatusItem() {
    if (!isOrderable) {
      return const _QuickInfoItemData(
        label: 'Trạng thái',
        value: 'Tạm dừng',
        icon: Icons.pause_circle_outline,
        tone: _QuickInfoTone.neutral,
      );
    }
    if (remainingStock <= 0) {
      return const _QuickInfoItemData(
        label: 'Trạng thái',
        value: 'Hết hàng',
        icon: Icons.cancel_outlined,
        tone: _QuickInfoTone.danger,
      );
    }
    if (remainingStock <= 10) {
      return const _QuickInfoItemData(
        label: 'Trạng thái',
        value: 'Sắp hết',
        icon: Icons.schedule_outlined,
        tone: _QuickInfoTone.warning,
      );
    }
    return const _QuickInfoItemData(
      label: 'Trạng thái',
      value: 'Còn hàng',
      icon: Icons.check_circle_outline,
      tone: _QuickInfoTone.success,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final canAddNow = isOrderable && nextAddQuantity > 0 && remainingStock > 0;
    final items = <_QuickInfoItemData>[
      _buildStatusItem(),
      _QuickInfoItemData(
        label: 'Tồn kho còn lại',
        value: '$remainingStock/$stock',
        icon: Icons.inventory_2_outlined,
        tone: remainingStock <= 0
            ? _QuickInfoTone.danger
            : remainingStock <= 10
            ? _QuickInfoTone.warning
            : _QuickInfoTone.info,
      ),
      _QuickInfoItemData(
        label: 'Thêm được ngay',
        value: canAddNow ? '$nextAddQuantity sản phẩm' : '--',
        icon: canAddNow
            ? Icons.add_shopping_cart_outlined
            : Icons.remove_shopping_cart_outlined,
        tone: canAddNow ? _QuickInfoTone.success : _QuickInfoTone.neutral,
      ),
      _QuickInfoItemData(
        label: 'Số lượng đặt',
        value: orderStep <= 1
            ? 'Tối thiểu $minOrderQty'
            : 'Tối thiểu $minOrderQty • Bước $orderStep',
        icon: Icons.edit_note_outlined,
      ),
      _QuickInfoItemData(
        label: 'Bảo hành',
        value: '$warrantyMonths tháng',
        icon: Icons.verified_outlined,
        tone: _QuickInfoTone.success,
      ),
    ];

    return Container(
      padding: EdgeInsets.all(isTablet ? 18 : 14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Thông tin nhanh',
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            'Chỉ số quan trọng để ra quyết định đặt hàng nhanh.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.35,
            ),
          ),
          if (quantityInCart > 0) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: colors.primaryContainer.withValues(alpha: 0.45),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: colors.primary.withValues(alpha: 0.24),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.shopping_cart_outlined,
                    size: 16,
                    color: colors.onPrimaryContainer,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Đã có $quantityInCart sản phẩm trong giỏ',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.onPrimaryContainer,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 10),
          LayoutBuilder(
            builder: (context, constraints) {
              final isVeryNarrow = constraints.maxWidth < 340;
              final columns = isVeryNarrow
                  ? 1
                  : constraints.maxWidth >= 620
                  ? 3
                  : 2;
              const spacing = 10.0;
              final tileWidth =
                  (constraints.maxWidth - spacing * (columns - 1)) / columns;
              return Wrap(
                spacing: spacing,
                runSpacing: spacing,
                children: items.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  final isLastOddTile =
                      columns == 2 &&
                      items.length.isOdd &&
                      index == items.length - 1;
                  return SizedBox(
                    width: isLastOddTile ? constraints.maxWidth : tileWidth,
                    child: _QuickInfoTile(item: item),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _QuickInfoTile extends StatelessWidget {
  const _QuickInfoTile({required this.item});

  final _QuickInfoItemData item;

  @override
  Widget build(BuildContext context) {
    final palette = _quickInfoPaletteFor(context, item.tone);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: palette.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: palette.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: palette.iconBackground,
                  shape: BoxShape.circle,
                ),
                child: Icon(item.icon, size: 14, color: palette.iconColor),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  item.value,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: palette.valueColor,
                    fontWeight: FontWeight.w700,
                    height: 1.2,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DescriptionSection extends StatelessWidget {
  const _DescriptionSection({
    required this.items,
    required this.contentPadding,
  });

  final List<ProductDescriptionItem> items;
  final double contentPadding;

  @override
  Widget build(BuildContext context) {
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
            'Mô tả chi tiết',
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          if (items.isEmpty)
            Text(
              'Chưa có mô tả chi tiết.',
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
        return Text(
          text,
          style: textTheme.bodyMedium?.copyWith(
            color: colors.onSurface,
            height: 1.55,
          ),
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

class _MediaPreview extends StatelessWidget {
  const _MediaPreview({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: LazyNetworkImage(
          url: url,
          fit: BoxFit.cover,
          placeholderBuilder: (context) => Container(
            color: colors.surfaceContainerHighest.withValues(alpha: 0.6),
            alignment: Alignment.center,
            child: const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
          errorBuilder: (context, error, stackTrace) => Container(
            color: colors.surfaceContainerHighest.withValues(alpha: 0.6),
            alignment: Alignment.center,
            child: Icon(
              Icons.broken_image_outlined,
              color: colors.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }
}

class _VideoSection extends StatelessWidget {
  const _VideoSection({required this.videos, required this.contentPadding});

  final List<ProductVideoItem> videos;
  final double contentPadding;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

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
            'Video sản phẩm',
            style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          if (videos.isEmpty)
            Text(
              'Chưa có video cho sản phẩm này.',
              style: textTheme.bodySmall?.copyWith(
                color: colors.onSurfaceVariant,
              ),
            )
          else
            ...videos.map(
              (video) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: colors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: colors.primary.withValues(alpha: 0.18),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.play_circle_outline, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            video.title.trim().isEmpty
                                ? 'Video'
                                : video.title.trim(),
                            style: textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (video.url.trim().isNotEmpty) ...[
                      const SizedBox(height: 10),
                      _InlineVideoPlayer(url: video.url.trim()),
                    ],
                    if (video.description?.trim().isNotEmpty ?? false) ...[
                      const SizedBox(height: 4),
                      Text(
                        video.description!.trim(),
                        style: textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _InlineVideoPlayer extends StatefulWidget {
  const _InlineVideoPlayer({required this.url});

  final String url;

  @override
  State<_InlineVideoPlayer> createState() => _InlineVideoPlayerState();
}

class _InlineVideoPlayerState extends State<_InlineVideoPlayer> {
  static const Duration _videoInitTimeout = Duration(seconds: 12);

  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _hasError = false;
  bool _isInitializing = false;
  bool _shouldLoad = false;
  String? _errorMessage;

  @override
  void didUpdateWidget(covariant _InlineVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url) {
      _disposeController();
      if (mounted) {
        setState(() {
          _hasError = false;
          _isInitializing = false;
          _shouldLoad = false;
          _errorMessage = null;
        });
      } else {
        _hasError = false;
        _isInitializing = false;
        _shouldLoad = false;
        _errorMessage = null;
      }
    }
  }

  void _requestLoad() {
    if (_shouldLoad || _isInitializing) {
      return;
    }
    setState(() => _shouldLoad = true);
    _initPlayer();
  }

  Future<void> _initPlayer() async {
    if (mounted) {
      setState(() {
        _isInitializing = true;
        _hasError = false;
        _errorMessage = null;
      });
    } else {
      _isInitializing = true;
      _hasError = false;
      _errorMessage = null;
    }

    final attempts = _buildAttemptUrls(widget.url);
    final errors = <String>[];

    for (final attemptUrl in attempts) {
      final uri = Uri.tryParse(attemptUrl);
      if (uri == null || (!uri.isScheme('http') && !uri.isScheme('https'))) {
        errors.add('Invalid URL: $attemptUrl');
        continue;
      }

      final controller = VideoPlayerController.networkUrl(uri);
      try {
        await controller.initialize().timeout(_videoInitTimeout);
        await controller.setLooping(false);
        final chewieController = ChewieController(
          videoPlayerController: controller,
          autoPlay: false,
          looping: false,
          showControlsOnInitialize: true,
          errorBuilder: (context, errorMessage) {
            return _VideoFallback(message: errorMessage, onRetry: _requestLoad);
          },
        );

        _videoController = controller;
        _chewieController = chewieController;
        if (mounted) {
          setState(() => _isInitializing = false);
        } else {
          _isInitializing = false;
        }
        return;
      } on TimeoutException {
        errors.add(
          '$attemptUrl -> timeout after ${_videoInitTimeout.inSeconds}s',
        );
        await controller.dispose();
      } catch (error) {
        errors.add('$attemptUrl -> $error');
        await controller.dispose();
      }
    }

    if (mounted) {
      setState(() {
        _isInitializing = false;
        _hasError = true;
        _errorMessage = errors.isEmpty
            ? 'Không tìm thấy video hợp lệ cho sản phẩm này.'
            : 'Không thể phát video lúc này. Vui lòng thử lại sau.';
      });
    } else {
      _isInitializing = false;
      _hasError = true;
    }
  }

  List<String> _buildAttemptUrls(String primaryUrl) {
    final urls = <String>[];
    final cleanedPrimary = primaryUrl.trim();
    if (cleanedPrimary.isNotEmpty) {
      urls.add(cleanedPrimary);
    }

    return urls.toSet().toList();
  }

  void _disposeController() {
    final chewieController = _chewieController;
    final videoController = _videoController;
    _chewieController = null;
    _videoController = null;
    chewieController?.dispose();
    videoController?.dispose();
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final videoController = _videoController;
    final chewieController = _chewieController;

    if (!_shouldLoad) {
      return _VideoDeferredPlaceholder(onTap: _requestLoad);
    }

    if (_hasError) {
      return _VideoFallback(message: _errorMessage, onRetry: _requestLoad);
    }

    if (_isInitializing ||
        videoController == null ||
        chewieController == null) {
      return const AspectRatio(
        aspectRatio: 16 / 9,
        child: Center(child: CircularProgressIndicator(strokeWidth: 2.2)),
      );
    }

    if (videoController.value.hasError) {
      return _VideoFallback(
        message: videoController.value.errorDescription,
        onRetry: _requestLoad,
      );
    }

    if (!videoController.value.isInitialized) {
      return const AspectRatio(
        aspectRatio: 16 / 9,
        child: Center(child: CircularProgressIndicator(strokeWidth: 2.2)),
      );
    }

    final aspect = videoController.value.aspectRatio == 0
        ? 16 / 9
        : videoController.value.aspectRatio;

    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: AspectRatio(
        aspectRatio: aspect,
        child: Chewie(controller: chewieController),
      ),
    );
  }
}

class _VideoFallback extends StatelessWidget {
  const _VideoFallback({this.message, this.onRetry});

  final String? message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline, size: 18, color: colors.onSurfaceVariant),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Không thể tải video trên thiết bị này.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                  ),
                ),
                if (message != null && message!.trim().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    message!,
                    maxLines: 6,
                    overflow: TextOverflow.fade,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
                if (onRetry != null) ...[
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh, size: 16),
                    label: const Text('Thử tải lại'),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VideoDeferredPlaceholder extends StatelessWidget {
  const _VideoDeferredPlaceholder({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Material(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.play_circle_fill, size: 38, color: colors.primary),
                const SizedBox(height: 8),
                Text(
                  'Nhấn để tải video',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StockBadge extends StatelessWidget {
  const _StockBadge({required this.remainingStock});

  final int remainingStock;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final style = Theme.of(context).textTheme.bodySmall;
    late final String label;
    late final Color textColor;
    late final Color background;
    if (remainingStock <= 0) {
      label = 'Hết hàng';
      textColor = colors.error;
      background = colors.errorContainer.withValues(
        alpha: isDark ? 0.42 : 0.82,
      );
    } else if (remainingStock <= 10) {
      label = 'Sắp hết: $remainingStock';
      textColor = colors.tertiary;
      background = colors.tertiaryContainer.withValues(
        alpha: isDark ? 0.46 : 0.82,
      );
    } else {
      label = 'Còn hàng: $remainingStock';
      textColor = colors.primary;
      background = colors.primaryContainer.withValues(
        alpha: isDark ? 0.4 : 0.8,
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            remainingStock <= 0
                ? Icons.error_outline
                : remainingStock <= 10
                ? Icons.schedule
                : Icons.check_circle_outline,
            size: 16,
            color: textColor,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: style?.copyWith(
              color: textColor,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomActionBar extends StatelessWidget {
  const _BottomActionBar({
    required this.price,
    required this.remainingStock,
    required this.quantityInCart,
    required this.minOrderQty,
    required this.isOrderable,
    required this.nextAddQuantity,
    required this.addToCartDisabledReason,
    required this.buyNowDisabledReason,
    required this.isTablet,
    required this.isSmallMobile,
    required this.isAddingToCart,
    required this.isBuyingNow,
    required this.onAddToCart,
    required this.onBuyNow,
  });

  final int price;
  final int remainingStock;
  final int quantityInCart;
  final int minOrderQty;
  final bool isOrderable;
  final int nextAddQuantity;
  final String? addToCartDisabledReason;
  final String? buyNowDisabledReason;
  final bool isTablet;
  final bool isSmallMobile;
  final bool isAddingToCart;
  final bool isBuyingNow;
  final VoidCallback? onAddToCart;
  final VoidCallback? onBuyNow;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final label = !isOrderable
        ? 'Ngưng phân phối'
        : remainingStock <= 0
        ? 'Hết hàng'
        : remainingStock <= 10
        ? 'Còn ít hàng'
        : 'Còn hàng';
    final labelColor = !isOrderable
        ? colors.onSurfaceVariant
        : remainingStock <= 0
        ? colors.error
        : remainingStock <= 10
        ? colors.tertiary
        : colors.primary;
    final helperTextColor = colors.onSurfaceVariant.withValues(
      alpha: isDark ? 0.9 : 0.95,
    );
    final shouldShowAddDisabledReason =
        addToCartDisabledReason != null && onAddToCart == null;
    final shouldShowBuyDisabledReason =
        buyNowDisabledReason != null && onBuyNow == null;
    final actionDisabledReason = shouldShowBuyDisabledReason
        ? buyNowDisabledReason
        : shouldShowAddDisabledReason
        ? addToCartDisabledReason
        : null;

    final addButton = OutlinedButton(
      onPressed: onAddToCart,
      child: isAddingToCart
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            )
          : const Text('Thêm vào giỏ'),
    );
    final buyButton = ElevatedButton(
      onPressed: onBuyNow,
      child: isBuyingNow
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            )
          : const Text('Mua ngay'),
    );
    final horizontalPadding = isTablet
        ? 28.0
        : isSmallMobile
        ? 16.0
        : 20.0;
    final topPadding = isTablet
        ? 14.0
        : isSmallMobile
        ? 10.0
        : 12.0;
    final bottomPadding = isTablet
        ? 16.0
        : isSmallMobile
        ? 12.0
        : 14.0;

    Widget buildPriceInfo() {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            formatVnd(price),
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 2),
          Text(
            'Chưa gồm VAT',
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(color: colors.onSurfaceVariant),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: labelColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (quantityInCart > 0) ...[
            const SizedBox(height: 2),
            Text(
              'Đã có $quantityInCart trong giỏ',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
          ] else if (isOrderable) ...[
            const SizedBox(height: 2),
            Text(
              minOrderQty > 1
                  ? 'Tối thiểu $minOrderQty sản phẩm'
                  : 'Số lượng linh hoạt',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      );
    }

    Widget buildActionControls() {
      return Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: shouldShowAddDisabledReason
                    ? Tooltip(
                        message: addToCartDisabledReason!,
                        child: addButton,
                      )
                    : addButton,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: shouldShowBuyDisabledReason
                    ? Tooltip(message: buyNowDisabledReason!, child: buyButton)
                    : buyButton,
              ),
            ],
          ),
          if (actionDisabledReason != null) ...[
            const SizedBox(height: 4),
            Text(
              actionDisabledReason,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: helperTextColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      );
    }

    return SafeArea(
      top: false,
      child: Container(
        padding: EdgeInsets.fromLTRB(
          horizontalPadding,
          topPadding,
          horizontalPadding,
          bottomPadding,
        ),
        decoration: BoxDecoration(
          color: colors.surface,
          boxShadow: [
            BoxShadow(
              color: Theme.of(context).shadowColor.withValues(alpha: 0.08),
              blurRadius: 18,
              offset: const Offset(0, -8),
            ),
          ],
        ),
        child: isSmallMobile
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  buildPriceInfo(),
                  const SizedBox(height: 8),
                  buildActionControls(),
                ],
              )
            : Row(
                children: [
                  Expanded(child: buildPriceInfo()),
                  const SizedBox(width: 12),
                  Expanded(flex: 2, child: buildActionControls()),
                ],
              ),
      ),
    );
  }
}

class _BottomActionBarPlaceholder extends StatelessWidget {
  const _BottomActionBarPlaceholder({
    required this.isTablet,
    required this.isSmallMobile,
  });

  final bool isTablet;
  final bool isSmallMobile;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final horizontalPadding = isTablet
        ? 28.0
        : isSmallMobile
        ? 16.0
        : 20.0;
    final topPadding = isTablet
        ? 14.0
        : isSmallMobile
        ? 10.0
        : 12.0;
    final bottomPadding = isTablet
        ? 16.0
        : isSmallMobile
        ? 12.0
        : 14.0;
    return SafeArea(
      top: false,
      child: Container(
        padding: EdgeInsets.fromLTRB(
          horizontalPadding,
          topPadding,
          horizontalPadding,
          bottomPadding,
        ),
        decoration: BoxDecoration(
          color: colors.surface,
          boxShadow: [
            BoxShadow(
              color: Theme.of(context).shadowColor.withValues(alpha: 0.08),
              blurRadius: 18,
              offset: const Offset(0, -8),
            ),
          ],
        ),
        child: isSmallMobile
            ? const Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  SkeletonBox(width: 120, height: 22),
                  SizedBox(height: 6),
                  SkeletonBox(width: 84, height: 12),
                  SizedBox(height: 4),
                  SkeletonBox(width: 140, height: 12),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: SkeletonBox(
                          width: double.infinity,
                          height: 40,
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                        ),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: SkeletonBox(
                          width: double.infinity,
                          height: 40,
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ],
              )
            : Row(
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SkeletonBox(width: 120, height: 22),
                        SizedBox(height: 6),
                        SkeletonBox(width: 84, height: 12),
                        SizedBox(height: 4),
                        SkeletonBox(width: 140, height: 12),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: Row(
                      children: const [
                        Expanded(
                          child: SkeletonBox(
                            width: double.infinity,
                            height: 40,
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                          ),
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: SkeletonBox(
                            width: double.infinity,
                            height: 40,
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _BottomBarHeightReporter extends StatefulWidget {
  const _BottomBarHeightReporter({
    required this.child,
    required this.onHeightChanged,
  });

  final Widget child;
  final ValueChanged<double> onHeightChanged;

  @override
  State<_BottomBarHeightReporter> createState() =>
      _BottomBarHeightReporterState();
}

class _BottomBarHeightReporterState extends State<_BottomBarHeightReporter> {
  double _lastHeight = -1;

  void _reportHeight() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      final height = context.size?.height;
      if (height == null || (height - _lastHeight).abs() < 0.5) {
        return;
      }
      _lastHeight = height;
      widget.onHeightChanged(height);
    });
  }

  @override
  Widget build(BuildContext context) {
    _reportHeight();
    return widget.child;
  }
}

class _ProductDetailLoadingView extends StatelessWidget {
  const _ProductDetailLoadingView({
    required this.horizontalPadding,
    required this.maxWidth,
    required this.heroImageHeight,
    required this.bottomPadding,
  });

  final double horizontalPadding;
  final double maxWidth;
  final double heroImageHeight;
  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            horizontalPadding,
            16,
            horizontalPadding,
            bottomPadding,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SkeletonBox(
                width: double.infinity,
                height: heroImageHeight,
                borderRadius: const BorderRadius.all(Radius.circular(24)),
              ),
              const SizedBox(height: 18),
              const SkeletonBox(width: 220, height: 28),
              const SizedBox(height: 10),
              const SkeletonBox(width: 120, height: 16),
              const SizedBox(height: 10),
              const SkeletonBox(width: 140, height: 24),
              const SizedBox(height: 16),
              const SkeletonBox(width: double.infinity, height: 16),
              const SizedBox(height: 8),
              const SkeletonBox(width: double.infinity, height: 16),
              const SizedBox(height: 8),
              const SkeletonBox(width: 280, height: 16),
              const SizedBox(height: 18),
              const SkeletonBox(width: 150, height: 16),
              const SizedBox(height: 6),
              const SkeletonBox(width: 300, height: 14),
              const SizedBox(height: 12),
              const Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  SkeletonBox(width: 150, height: 70),
                  SkeletonBox(width: 150, height: 70),
                  SkeletonBox(width: 150, height: 70),
                  SkeletonBox(width: 150, height: 70),
                  SkeletonBox(width: 150, height: 70),
                  SkeletonBox(width: 150, height: 70),
                ],
              ),
              const SizedBox(height: 18),
              const SkeletonBox(width: 180, height: 18),
              const SizedBox(height: 10),
              const SkeletonBox(width: double.infinity, height: 16),
              const SizedBox(height: 8),
              const SkeletonBox(width: double.infinity, height: 16),
              const SizedBox(height: 8),
              const SkeletonBox(width: 260, height: 16),
              const SizedBox(height: 16),
              const SkeletonBox(
                width: double.infinity,
                height: 190,
                borderRadius: BorderRadius.all(Radius.circular(16)),
              ),
              const SizedBox(height: 16),
              const SkeletonBox(width: 180, height: 18),
              const SizedBox(height: 10),
              const SkeletonBox(
                width: double.infinity,
                height: 128,
                borderRadius: BorderRadius.all(Radius.circular(16)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
