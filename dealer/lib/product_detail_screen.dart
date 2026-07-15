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
import 'dealer_navigation.dart';
import 'dealer_routes.dart';
import 'file_reference.dart';
import 'global_search.dart';
import 'models.dart';
import 'product_catalog_controller.dart';
import 'utils.dart';
import 'widgets/cart_icon_button.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/lazy_network_image.dart';
import 'widgets/product_image.dart';
import 'widgets/skeleton_box.dart';

part 'product_detail_texts.dart';
part 'product_detail_quick_info.dart';
part 'product_detail_description.dart';
part 'product_detail_media.dart';
part 'product_detail_bottom_bar.dart';

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
      // Detail fetch failed: fall back to the cached product snapshot.
      return catalog.findById(baseProduct.id) ?? baseProduct;
    }
  }

  Future<void> _loadProductDetail() async {
    await Future.delayed(_detailApiLatency);
    if (!mounted) {
      return;
    }
    final detailedProduct = await _resolveLatestProductSnapshot(
      _currentProduct,
    );
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
      final latestProduct = await _resolveLatestProductSnapshot(
        _currentProduct,
      );
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

      final didAdd = await cart.add(latestProduct, quantity: addQuantity);
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
                      context.pushDealerCart();
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
      final latestProduct = await _resolveLatestProductSnapshot(
        _currentProduct,
      );
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

      final didAdd = await cart.add(latestProduct, quantity: addQuantity);
      if (!mounted) {
        return;
      }
      if (!didAdd) {
        _showMaxStockMessage();
        return;
      }
      context.pushDealerCheckout();
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
              scrollable: true,
              insetPadding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 20,
              ),
              title: Text(title),
              content: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      productName,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Text(texts.quantityRangeLabel(minQuantity, maxQuantity)),
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
    return product.videos.where((video) {
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
    final isWideLayout = width >= 980;
    final isLandscapePhone = isLandscape && !isTablet;
    final isVerticallyTight = !isTablet && (isLandscape || height < 640);
    final horizontalPadding = isTablet
        ? 28.0
        : isMidRange
        ? 24.0
        : isSmallMobile
        ? 16.0
        : 20.0;
    final contentMaxWidth = isWideLayout
        ? 1120.0
        : isTablet
        ? 760.0
        : isMidRange
        ? 640.0
        : double.infinity;
    final heroImageHeight = isWideLayout
        ? 320.0
        : isTablet
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
    final Widget heroSection = RepaintBoundary(
      child: Hero(
        tag: 'product-image-${_currentProduct.id}',
        child: ProductImage(
          product: _currentProduct,
          width: double.infinity,
          height: heroImageHeight,
          borderRadius: BorderRadius.circular(24),
          iconSize: heroIconSize,
        ),
      ),
    );
    final Widget headerSection = RepaintBoundary(
      child: Container(
        padding: EdgeInsets.all(headerCardPadding),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: colors.outlineVariant.withValues(alpha: 0.6),
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
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
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
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      texts.vatExcludedLabel,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      formatVnd(_currentProduct.price),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              texts.skuLabel(_currentProduct.sku),
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
            ),
            const SizedBox(height: 14),
            Text(
              _currentProduct.shortDescription,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
                height: 1.55,
              ),
            ),
          ],
        ),
      ),
    );
    final Widget quickInfoSection = RepaintBoundary(
      child: _QuickInfoSection(
        isTablet: isTablet,
        stock: _currentProduct.stock,
        remainingStock: remainingStock,
        quantityInCart: quantityInCart,
        warrantyMonths: _currentProduct.warrantyMonths,
        nextAddQuantity: suggestedAddQuantity,
      ),
    );

    return Scaffold(
      appBar: AppBar(
        leading: const DealerFallbackBackButton(
          fallbackPath: DealerRoutePath.home,
        ),
        title: BrandAppBarTitle(_currentProduct.name),
        actions: [
          const GlobalSearchIconButton(),
          CartIconButton(
            count: cart.totalItems,
            onPressed: () => context.pushDealerCart(),
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
                        if (isWideLayout)
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(child: heroSection),
                              SizedBox(width: heroToContentGap),
                              SizedBox(
                                width: 360,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    headerSection,
                                    SizedBox(height: sectionGap),
                                    quickInfoSection,
                                  ],
                                ),
                              ),
                            ],
                          )
                        else ...[
                          heroSection,
                          SizedBox(height: heroToContentGap),
                          headerSection,
                          SizedBox(height: sectionGap),
                          quickInfoSection,
                        ],
                        if (descriptionItems.isNotEmpty) ...[
                          SizedBox(height: sectionGap),
                          RepaintBoundary(
                            child: _DescriptionSection(
                              items: descriptionItems,
                              contentPadding: sectionCardPadding,
                            ),
                          ),
                        ],
                        if (videos.isNotEmpty) ...[
                          SizedBox(height: sectionGap),
                          RepaintBoundary(
                            child: _VideoSection(
                              videos: videos,
                              contentPadding: sectionCardPadding,
                            ),
                          ),
                        ],
                        if (_currentProduct.specifications.isNotEmpty) ...[
                          SizedBox(height: sectionGap),
                          RepaintBoundary(
                            child: Container(
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
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleSmall
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
                                                      textAlign:
                                                          TextAlign.right,
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
