import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:flutter_spinbox/flutter_spinbox.dart';
import 'package:chewie/chewie.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'checkout_screen.dart';
import 'cart_screen.dart';
import 'file_reference.dart';
import 'global_search.dart';
import 'models.dart';
import 'product_catalog_controller.dart';
import 'utils.dart';
import 'widgets/cart_icon_button.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/lazy_network_image.dart';
import 'widgets/product_image.dart';
import 'widgets/skeleton_box.dart';

_ProductDetailTexts _productDetailTexts(BuildContext context) =>
    _ProductDetailTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key, required this.product});

  final Product product;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  static const double _midRangeBreakpoint = 560;
  static const double _smallMobileBreakpoint = 360;
  static const Duration _detailApiLatency = Duration(milliseconds: 400);

  late Product _product;
  bool _didStartDetailLoad = false;
  bool _isLoadingDetail = true;
  bool _isAddingToCart = false;
  bool _isBuyingNow = false;
  double _bottomBarHeight = 0;

  @override
  void initState() {
    super.initState();
    _product = widget.product;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_didStartDetailLoad) {
      return;
    }
    _didStartDetailLoad = true;
    unawaited(_loadProductDetail());
  }

  Product get _currentProduct => _product;

  Future<Product> _resolveLatestProductSnapshot(Product baseProduct) async {
    final catalog = ProductCatalogScope.maybeOf(context);
    if (catalog == null) {
      return baseProduct;
    }
    try {
      return await catalog.fetchDetail(baseProduct.id);
    } catch (_) {
      return catalog.findById(baseProduct.id) ?? baseProduct;
    }
  }

  Future<void> _loadProductDetail() async {
    await Future.delayed(_detailApiLatency);
    if (!mounted) {
      return;
    }
    final detailedProduct = await _resolveLatestProductSnapshot(_currentProduct);
    if (!mounted) {
      return;
    }
    setState(() {
      _product = detailedProduct;
      _isLoadingDetail = false;
    });
  }

  Future<void> _handleAddToCart(CartController cart) async {
    final texts = _productDetailTexts(context);
    if (_isAddingToCart || cart.isSyncingProduct(_currentProduct.id)) {
      return;
    }
    setState(() => _isAddingToCart = true);
    try {
      final latestProduct = await _resolveLatestProductSnapshot(_currentProduct);
      if (!mounted) {
        return;
      }
      setState(() => _product = latestProduct);

      final remainingStock = cart.remainingStockFor(latestProduct);
      if (remainingStock <= 0) {
        _showMaxStockMessage();
        return;
      }

      final addQuantity = await _showAddQuantityDialog(
        title: texts.addToCartTitle,
        confirmLabel: texts.addToCartAction,
        productName: latestProduct.name,
        maxQuantity: remainingStock,
        quantityInCart: cart.quantityFor(latestProduct.id),
      );
      if (!mounted) {
        return;
      }
      if (addQuantity == null) {
        return;
      }
      if (!cart.canAdd(latestProduct, quantity: addQuantity)) {
        _showMaxStockMessage();
        return;
      }

      final didAdd = await cart.addWithApiSimulation(
        latestProduct,
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
                  ? texts.addedToCartMessage(latestProduct.name, addQuantity)
                  : texts.stockLimitReachedMessage,
            ),
            action: didAdd
                ? SnackBarAction(
                    label: texts.viewCartAction,
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
    final texts = _productDetailTexts(context);
    if (_isBuyingNow || cart.isSyncingProduct(_currentProduct.id)) {
      return;
    }
    setState(() => _isBuyingNow = true);
    try {
      final latestProduct = await _resolveLatestProductSnapshot(_currentProduct);
      if (!mounted) {
        return;
      }
      setState(() => _product = latestProduct);

      final remainingStock = cart.remainingStockFor(latestProduct);
      if (remainingStock <= 0) {
        _showMaxStockMessage();
        return;
      }

      final addQuantity = await _showAddQuantityDialog(
        title: texts.buyNowTitle,
        confirmLabel: texts.continueAction,
        productName: latestProduct.name,
        maxQuantity: remainingStock,
        quantityInCart: cart.quantityFor(latestProduct.id),
      );
      if (!mounted || addQuantity == null) {
        return;
      }
      if (!cart.canAdd(latestProduct, quantity: addQuantity)) {
        _showMaxStockMessage();
        return;
      }

      final didAdd = await cart.addWithApiSimulation(
        latestProduct,
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
    final texts = _productDetailTexts(context);
    final minQuantity = 1;
    var selectedQuantity = minQuantity <= maxQuantity
        ? minQuantity
        : maxQuantity;
    final result = await showDialog<int>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
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
                  Text(
                    texts.quantityRangeLabel(minQuantity, maxQuantity),
                  ),
                  if (quantityInCart > 0) ...[
                    const SizedBox(height: 6),
                    Text(
                      texts.quantityInCartMessage(quantityInCart),
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
                      texts.maximumByStockMessage,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  if (selectedQuantity == minQuantity && minQuantity > 1)
                    Text(
                      texts.minimumQuantityMessage(minQuantity),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: Text(texts.cancelAction),
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
    final texts = _productDetailTexts(context);
    final messenger = ScaffoldMessenger.of(context);
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text(texts.maxStockMessage),
        ),
      );
  }

  String? _buildActionDisabledReason({
    required int remainingStock,
    required int suggestedAddQuantity,
    required bool isSyncingProduct,
  }) {
    final texts = _productDetailTexts(context);
    if (isSyncingProduct) {
      return texts.syncingCartMessage;
    }
    if (remainingStock <= 0) {
      return texts.outOfStockMessage;
    }
    if (suggestedAddQuantity <= 0) {
      return texts.cartLimitReachedMessage;
    }
    if (isSyncingProduct) {
      return 'Đang đồng bộ giỏ hàng cho sản phẩm này';
    }
    if (remainingStock <= 0) {
      return 'S\u1ea3n ph\u1ea9m \u0111\u00e3 h\u1ebft h\u00e0ng';
    }
    if (suggestedAddQuantity <= 0) {
      return '\u0110\u00e3 \u0111\u1ea1t gi\u1edbi h\u1ea1n s\u1ed1 l\u01b0\u1ee3ng trong gi\u1ecf';
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
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    final cart = CartScope.of(context);
    final isSyncingProduct = cart.isSyncingProduct(_currentProduct.id);
    final remainingStock = cart.remainingStockFor(_currentProduct);
    final quantityInCart = cart.quantityFor(_currentProduct.id);
    final suggestedAddQuantity = cart.suggestedAddQuantity(_currentProduct);
    final descriptionItems = _buildVisibleDescriptionItems(_currentProduct);
    final videos = _buildVisibleVideos(_currentProduct);
    final mediaQuery = MediaQuery.of(context);
    final screenSize = mediaQuery.size;
    final width = screenSize.width;
    final height = screenSize.height;
    final shortestSide = screenSize.shortestSide;
    final isLandscape = mediaQuery.orientation == Orientation.landscape;
    final isTablet = shortestSide >= AppBreakpoints.phone;
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
      isSyncingProduct: isSyncingProduct,
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
        title: BrandAppBarTitle(_currentProduct.name),
        actions: [
          const GlobalSearchIconButton(),
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
                price: _currentProduct.price,
                remainingStock: remainingStock,
                quantityInCart: quantityInCart,
                nextAddQuantity: suggestedAddQuantity,
                addToCartDisabledReason: addToCartDisabledReason,
                buyNowDisabledReason: buyNowDisabledReason,
                isTablet: isTablet,
                isSmallMobile: isSmallMobile,
                isAddingToCart: _isAddingToCart,
                isBuyingNow: _isBuyingNow,
                isSyncingProduct: isSyncingProduct,
                onAddToCart:
                    suggestedAddQuantity > 0 &&
                        !_isAddingToCart &&
                        !isSyncingProduct
                    ? () => _handleAddToCart(cart)
                    : null,
                onBuyNow:
                    suggestedAddQuantity > 0 &&
                        !_isBuyingNow &&
                        !isSyncingProduct
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
                          tag: 'product-image-${_currentProduct.id}',
                          child: ProductImage(
                            product: _currentProduct,
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
                                      _currentProduct.name,
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
                                        texts.dealerPriceLabel,
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelSmall
                                            ?.copyWith(
                                              color: colors.onSurfaceVariant,
                                            ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        texts.vatExcludedLabel,
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelSmall
                                            ?.copyWith(
                                              color: colors.onSurfaceVariant,
                                            ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        formatVnd(_currentProduct.price),
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
                                texts.skuLabel(_currentProduct.sku),
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(color: colors.onSurfaceVariant),
                              ),
                              const SizedBox(height: 12),
                              _StockBadge(remainingStock: remainingStock),
                              const SizedBox(height: 14),
                              Text(
                                _currentProduct.shortDescription,
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
                          stock: _currentProduct.stock,
                          remainingStock: remainingStock,
                          quantityInCart: quantityInCart,
                          warrantyMonths: _currentProduct.warrantyMonths,
                          nextAddQuantity: suggestedAddQuantity,
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
                        if (_currentProduct.specifications.isNotEmpty) ...[
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
                                  texts.technicalSpecsTitle,
                                  style: Theme.of(context).textTheme.titleSmall
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 10),
                                ..._currentProduct.specifications
                                    .asMap()
                                    .entries
                                    .map((entry) {
                                      final index = entry.key;
                                      final spec = entry.value;
                                      final isLast =
                                          index ==
                                          _currentProduct
                                                  .specifications
                                                  .length -
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
    required this.warrantyMonths,
    required this.nextAddQuantity,
  });

  final bool isTablet;
  final int stock;
  final int remainingStock;
  final int quantityInCart;
  final int warrantyMonths;
  final int nextAddQuantity;

  _QuickInfoItemData _buildStatusItem(_ProductDetailTexts texts) {
    if (remainingStock <= 0) {
      return _QuickInfoItemData(
        label: texts.statusLabel,
        value: texts.outOfStockShortLabel,
        icon: Icons.cancel_outlined,
        tone: _QuickInfoTone.danger,
      );
    }
    if (remainingStock <= 10) {
      return _QuickInfoItemData(
        label: texts.statusLabel,
        value: texts.lowStockShortLabel,
        icon: Icons.schedule_outlined,
        tone: _QuickInfoTone.warning,
      );
    }
    return _QuickInfoItemData(
      label: texts.statusLabel,
      value: texts.inStockShortLabel,
      icon: Icons.check_circle_outline,
      tone: _QuickInfoTone.success,
    );
  }

  @override
  Widget build(BuildContext context) {
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    final canAddNow = nextAddQuantity > 0 && remainingStock > 0;
    final items = <_QuickInfoItemData>[
      _buildStatusItem(texts),
      _QuickInfoItemData(
        label: texts.stockLabel,
        value: quantityInCart > 0 ? '$remainingStock/$stock' : '$stock',
        icon: Icons.inventory_2_outlined,
        tone: remainingStock <= 0
            ? _QuickInfoTone.danger
            : remainingStock <= 10
            ? _QuickInfoTone.warning
            : _QuickInfoTone.info,
      ),
      _QuickInfoItemData(
        label: texts.readyToAddLabel,
        value: canAddNow ? texts.readyToAddValue(nextAddQuantity) : '--',
        icon: canAddNow
            ? Icons.add_shopping_cart_outlined
            : Icons.remove_shopping_cart_outlined,
        tone: canAddNow ? _QuickInfoTone.success : _QuickInfoTone.neutral,
      ),
      _QuickInfoItemData(
        label: texts.warrantyLabel,
        value: texts.warrantyMonthsValue(warrantyMonths),
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
            texts.quickInfoTitle,
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            texts.quickInfoDescription,
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
                      texts.quantityInCartBanner(quantityInCart),
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

class _MediaPreview extends StatelessWidget {
  const _MediaPreview({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final resolvedUrl = resolveFileReference(url);
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: LazyNetworkImage(
          url: resolvedUrl,
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
    final texts = _productDetailTexts(context);
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
            texts.productVideosTitle,
            style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          if (videos.isEmpty)
            Text(
              texts.noProductVideosMessage,
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
                                ? texts.defaultVideoTitle
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

bool _isYouTubeVideoUrl(String rawUrl) {
  final resolved = resolveFileReference(rawUrl).trim();
  final uri = Uri.tryParse(resolved);
  if (uri == null) {
    return false;
  }
  final host = uri.host.toLowerCase();
  return host.contains('youtube.com') || host.contains('youtu.be');
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
    final texts = _productDetailTexts(context);
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
            ? texts.invalidProductVideoMessage
            : texts.cannotPlayVideoNowMessage;
      });
    } else {
      _isInitializing = false;
      _hasError = true;
    }
  }

  List<String> _buildAttemptUrls(String primaryUrl) {
    final urls = <String>[];
    final cleanedPrimary = resolveFileReference(primaryUrl).trim();
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
    if (_isYouTubeVideoUrl(widget.url)) {
      return _VideoExternalLink(url: widget.url);
    }

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

class _VideoExternalLink extends StatelessWidget {
  const _VideoExternalLink({required this.url});

  final String url;

  Future<void> _open(BuildContext context) async {
    final texts = _productDetailTexts(context);
    final messenger = ScaffoldMessenger.maybeOf(context);
    final resolved = resolveFileReference(url).trim();
    final uri = Uri.tryParse(resolved);
    if (uri == null) {
      messenger?.showSnackBar(
        SnackBar(content: Text(texts.invalidVideoLinkMessage)),
      );
      return;
    }
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched) {
      messenger?.showSnackBar(
        SnackBar(content: Text(texts.cannotOpenVideoNowMessage)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isYouTube = _isYouTubeVideoUrl(url);
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isYouTube ? Icons.smart_display_outlined : Icons.open_in_new,
                size: 18,
                color: colors.onSurfaceVariant,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isYouTube
                      ? texts.youtubeExternalOpenMessage
                      : texts.videoExternalOpenMessage,
                  style: textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () => _open(context),
            icon: const Icon(Icons.open_in_new, size: 16),
            label: Text(
              isYouTube ? texts.openOnYoutubeAction : texts.openVideoAction,
            ),
          ),
        ],
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
    final texts = _productDetailTexts(context);
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
                  texts.cannotLoadVideoOnDeviceMessage,
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
                    label: Text(texts.retryLoadAction),
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
    final texts = _productDetailTexts(context);
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
                  texts.tapToLoadVideoMessage,
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
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final style = Theme.of(context).textTheme.bodySmall;
    late final String label;
    late final Color textColor;
    late final Color background;
    if (remainingStock <= 0) {
      label = texts.outOfStockShortLabel;
      textColor = colors.error;
      background = colors.errorContainer.withValues(
        alpha: isDark ? 0.42 : 0.82,
      );
    } else if (remainingStock <= 10) {
      label = texts.lowStockBadge(remainingStock);
      textColor = colors.tertiary;
      background = colors.tertiaryContainer.withValues(
        alpha: isDark ? 0.46 : 0.82,
      );
    } else {
      label = texts.inStockBadge(remainingStock);
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
    required this.nextAddQuantity,
    required this.addToCartDisabledReason,
    required this.buyNowDisabledReason,
    required this.isTablet,
    required this.isSmallMobile,
    required this.isAddingToCart,
    required this.isBuyingNow,
    required this.isSyncingProduct,
    required this.onAddToCart,
    required this.onBuyNow,
  });

  final int price;
  final int remainingStock;
  final int quantityInCart;
  final int nextAddQuantity;
  final String? addToCartDisabledReason;
  final String? buyNowDisabledReason;
  final bool isTablet;
  final bool isSmallMobile;
  final bool isAddingToCart;
  final bool isBuyingNow;
  final bool isSyncingProduct;
  final VoidCallback? onAddToCart;
  final VoidCallback? onBuyNow;

  @override
  Widget build(BuildContext context) {
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final label = remainingStock <= 0
        ? texts.outOfStockShortLabel
        : remainingStock <= 10
        ? texts.lowStockCompactLabel
        : texts.inStockShortLabel;
    final labelColor = remainingStock <= 0
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
      child: isAddingToCart || isSyncingProduct
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            )
          : Text(texts.addToCartTitle),
    );
    final buyButton = ElevatedButton(
      onPressed: onBuyNow,
      child: isBuyingNow || isSyncingProduct
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            )
          : Text(texts.buyNowTitle),
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
            texts.vatExcludedLabel,
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
              texts.quantityInCartSummary(quantityInCart),
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
          ] else if (remainingStock > 0) ...[
            const SizedBox(height: 2),
            Text(
              texts.flexibleQuantityLabel,
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

class _ProductDetailTexts {
  const _ProductDetailTexts({required this.isEnglish});

  final bool isEnglish;

  String get addToCartTitle => isEnglish ? 'Add to cart' : 'Them vao gio';
  String get addToCartAction => isEnglish ? 'Add' : 'Them';
  String get buyNowTitle => isEnglish ? 'Buy now' : 'Mua ngay';
  String get continueAction => isEnglish ? 'Continue' : 'Tiep tuc';
  String get cancelAction => isEnglish ? 'Cancel' : 'Huy';
  String get viewCartAction => isEnglish ? 'View cart' : 'Mo gio hang';
  String get dealerPriceLabel => isEnglish ? 'Dealer price' : 'Gia dai ly';
  String get vatExcludedLabel =>
      isEnglish ? 'Excludes VAT' : 'Chua gom VAT';
  String skuLabel(String sku) => 'SKU: $sku';
  String get technicalSpecsTitle =>
      isEnglish ? 'Technical specifications' : 'Thong so ky thuat';
  String get syncingCartMessage => isEnglish
      ? 'Cart is syncing for this product.'
      : 'Gio hang dang dong bo cho san pham nay.';
  String get outOfStockMessage =>
      isEnglish ? 'This product is out of stock.' : 'San pham da het hang.';
  String get cartLimitReachedMessage => isEnglish
      ? 'Cart quantity limit has been reached.'
      : 'Da dat gioi han so luong trong gio.';
  String get stockLimitReachedMessage => isEnglish
      ? 'Product has reached the stock limit.'
      : 'San pham da dat gioi han ton kho.';
  String get maxStockMessage => isEnglish
      ? 'Product is out of stock or the cart limit has been reached.'
      : 'San pham da het hang hoac da dat gioi han trong gio.';
  String addedToCartMessage(String productName, int quantity) => isEnglish
      ? 'Added $productName (x$quantity) to cart.'
      : 'Da them $productName (x$quantity) vao gio hang.';
  String quantityRangeLabel(int minQuantity, int maxQuantity) => isEnglish
      ? 'Minimum: $minQuantity • Maximum: $maxQuantity'
      : 'Toi thieu: $minQuantity • Toi da: $maxQuantity';
  String quantityInCartMessage(int quantity) => isEnglish
      ? 'You already have $quantity in the cart.'
      : 'Ban da co $quantity trong gio.';
  String minimumQuantityMessage(int quantity) => isEnglish
      ? 'Minimum quantity: $quantity'
      : 'So luong toi thieu: $quantity';
  String get maximumByStockMessage => isEnglish
      ? 'Maximum quantity reached based on stock.'
      : 'Da dat toi da theo ton kho.';
  String get statusLabel => isEnglish ? 'Status' : 'Trang thai';
  String get outOfStockShortLabel =>
      isEnglish ? 'Out of stock' : 'Het hang';
  String get lowStockShortLabel => isEnglish ? 'Low stock' : 'Sap het';
  String get inStockShortLabel => isEnglish ? 'In stock' : 'Con hang';
  String get lowStockCompactLabel =>
      isEnglish ? 'Limited stock' : 'Con it hang';
  String lowStockBadge(int remainingStock) => isEnglish
      ? 'Low stock: $remainingStock'
      : 'Sap het: $remainingStock';
  String inStockBadge(int remainingStock) => isEnglish
      ? 'In stock: $remainingStock'
      : 'Con hang: $remainingStock';
  String get stockLabel => isEnglish ? 'Stock' : 'Ton kho';
  String get readyToAddLabel =>
      isEnglish ? 'Ready to add' : 'Them duoc ngay';
  String readyToAddValue(int quantity) =>
      isEnglish ? '$quantity products' : '$quantity san pham';
  String get warrantyLabel => isEnglish ? 'Warranty' : 'Bao hanh';
  String warrantyMonthsValue(int months) =>
      isEnglish ? '$months months' : '$months thang';
  String get quickInfoTitle =>
      isEnglish ? 'Quick information' : 'Thong tin nhanh';
  String get quickInfoDescription => isEnglish
      ? 'Key indicators to make ordering decisions faster.'
      : 'Chi so quan trong de ra quyet dinh dat hang nhanh.';
  String quantityInCartBanner(int quantity) => isEnglish
      ? '$quantity products are already in your cart.'
      : 'Da co $quantity san pham trong gio';
  String get detailedDescriptionTitle =>
      isEnglish ? 'Detailed description' : 'Mo ta chi tiet';
  String get noDetailedDescriptionMessage => isEnglish
      ? 'No detailed description is available yet.'
      : 'Chua co mo ta chi tiet.';
  String get productVideosTitle =>
      isEnglish ? 'Product videos' : 'Video san pham';
  String get noProductVideosMessage => isEnglish
      ? 'No videos are available for this product yet.'
      : 'Chua co video cho san pham nay.';
  String get defaultVideoTitle => isEnglish ? 'Video' : 'Video';
  String get invalidProductVideoMessage => isEnglish
      ? 'No valid video was found for this product.'
      : 'Khong tim thay video hop le cho san pham nay.';
  String get cannotPlayVideoNowMessage => isEnglish
      ? 'Cannot play this video right now. Please try again later.'
      : 'Khong the phat video luc nay. Vui long thu lai sau.';
  String get invalidVideoLinkMessage =>
      isEnglish ? 'The video link is invalid.' : 'Link video khong hop le.';
  String get cannotOpenVideoNowMessage => isEnglish
      ? 'Cannot open the video right now.'
      : 'Khong the mo video luc nay.';
  String get youtubeExternalOpenMessage => isEnglish
      ? 'This YouTube video will open outside the app.'
      : 'Video YouTube se mo ben ngoai ung dung.';
  String get videoExternalOpenMessage => isEnglish
      ? 'This video will open outside the app.'
      : 'Video nay se mo ben ngoai ung dung.';
  String get openOnYoutubeAction =>
      isEnglish ? 'Open on YouTube' : 'Mo tren YouTube';
  String get openVideoAction => isEnglish ? 'Open video' : 'Mo video';
  String get cannotLoadVideoOnDeviceMessage => isEnglish
      ? 'This device cannot load the video.'
      : 'Khong the tai video tren thiet bi nay.';
  String get retryLoadAction => isEnglish ? 'Retry' : 'Thu tai lai';
  String get tapToLoadVideoMessage => isEnglish
      ? 'Tap to load video'
      : 'Nhan de tai video';
  String quantityInCartSummary(int quantity) => isEnglish
      ? '$quantity already in cart'
      : 'Da co $quantity trong gio';
  String get flexibleQuantityLabel =>
      isEnglish ? 'Flexible quantity' : 'So luong linh hoat';
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
