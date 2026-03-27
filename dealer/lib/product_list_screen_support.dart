// ignore_for_file: invalid_use_of_protected_member

part of 'product_list_screen.dart';

extension _ProductListScreenSupport on _ProductListScreenState {
  void _handleCatalogChanged() {
    final catalog = _productCatalog;
    if (!mounted ||
        catalog == null ||
        catalog.isLoading ||
        _isManuallyRefreshingCatalog ||
        _suppressedCatalogLoadCount > 0) {
      return;
    }
    final nextSnapshot = _catalogSummarySnapshot(catalog);
    if (_catalogSnapshot == nextSnapshot) {
      return;
    }
    _catalogSnapshot = nextSnapshot;
    _catalogRefreshDebounce?.cancel();
    _catalogRefreshDebounce = Timer(const Duration(milliseconds: 120), () {
      if (!mounted) {
        return;
      }
      _refreshProducts();
    });
  }

  Future<void> _refreshCatalog() async {
    _isManuallyRefreshingCatalog = true;
    try {
      _catalogRefreshDebounce?.cancel();
      await _productCatalog?.load(forceRefresh: true);
      final catalog = _productCatalog;
      if (catalog != null) {
        _catalogSnapshot = _catalogSummarySnapshot(catalog);
      }
      if (!mounted) {
        return;
      }
      _refreshProducts();
    } finally {
      _isManuallyRefreshingCatalog = false;
    }
  }

  void _retryLoadProducts() {
    unawaited(_refreshCatalog());
  }

  void _refreshProducts() {
    _queryRevision++;
    _pagingController.refresh();
  }

  String _catalogSummarySnapshot(ProductCatalogController catalog) {
    return Object.hash(
      catalog.errorMessage,
      catalog.products.length,
      Object.hashAll(
        catalog.products.map(
          (product) => Object.hash(
            product.id,
            product.name,
            product.sku,
            product.shortDescription,
            product.price,
            product.stock,
            product.warrantyMonths,
            product.imageUrl,
          ),
        ),
      ),
    ).toString();
  }

  Future<Product> _resolveLatestProductSnapshot(Product baseProduct) async {
    final catalog = _productCatalog ?? ProductCatalogScope.maybeOf(context);
    if (catalog == null) {
      return baseProduct;
    }
    // The paginated list endpoint is not cached server-side, so products already
    // in the catalog have fresh stock data. Prefer them over fetchDetail, which
    // hits a cached endpoint and can return stale stock values.
    final fresh = catalog.findById(baseProduct.id);
    if (fresh != null) {
      return fresh;
    }
    try {
      return await catalog.fetchDetail(baseProduct.id);
    } catch (_) {
      return baseProduct;
    }
  }

  Future<void> _handleAddToCart(
    CartController cart,
    Product product, {
    bool openQuantityDialog = false,
  }) async {
    if (_addingProductIds.contains(product.id) ||
        cart.isSyncingProduct(product.id)) {
      return;
    }
    setState(() => _addingProductIds.add(product.id));
    try {
      final latestProduct = await _resolveLatestProductSnapshot(product);
      if (!mounted) {
        return;
      }

      final remainingStock = cart.remainingStockFor(latestProduct);
      if (remainingStock <= 0) {
        _showCartLimitSnackBar();
        return;
      }

      final quickQuantity = cart.suggestedAddQuantity(latestProduct);
      if (quickQuantity <= 0) {
        _showCartLimitSnackBar();
        return;
      }

      final addQuantity = openQuantityDialog
          ? await _promptQuantity(
              latestProduct,
              remainingStock,
              initialQuantity: quickQuantity,
            )
          : quickQuantity;

      if (!mounted) {
        return;
      }
      if (addQuantity == null) {
        return;
      }
      if (!cart.canAdd(latestProduct, quantity: addQuantity)) {
        _showCartLimitSnackBar();
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
        // Server rejected the add (e.g. serial pool exhausted but product.stock
        // was stale). Refresh the list so the UI shows the authoritative stock.
        _refreshProducts();
        _showCartLimitSnackBar();
        return;
      }
      HapticFeedback.lightImpact();
      _showAddedToCartSnackBar(addQuantity);
    } finally {
      if (mounted) {
        setState(() => _addingProductIds.remove(product.id));
      }
    }
  }

  void _showAddedToCartSnackBar(int quantity) {
    if (!mounted) {
      return;
    }
    final texts = _productListTexts(context);
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        content: Text(texts.addedToCartMessage(quantity)),
        action: SnackBarAction(
          label: texts.backToCartAction,
          onPressed: () {
            Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => const CartScreen()));
          },
        ),
      ),
    );
  }

  void _showCartLimitSnackBar() {
    if (!mounted) {
      return;
    }
    final texts = _productListTexts(context);
    final message = texts.isEnglish
        ? 'Product is out of stock or the cart limit has been reached.'
        : 'San pham da het hang hoac da dat gioi han trong gio.';
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(behavior: SnackBarBehavior.floating, content: Text(message)),
    );
  }

  Future<int?> _promptQuantity(
    Product product,
    int maxQuantity, {
    required int initialQuantity,
  }) {
    final texts = _productListTexts(context);
    final minQty = 1;
    final safeInitial = initialQuantity.clamp(minQty, maxQuantity);
    var selected = safeInitial <= maxQuantity ? safeInitial : maxQuantity;
    return showDialog<int>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(texts.chooseQuantityDialogTitle),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(product.name, maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 12),
              SpinBox(
                min: minQty.toDouble(),
                max: maxQuantity.toDouble(),
                value: selected.toDouble(),
                step: 1,
                decimals: 0,
                autofocus: true,
                onChanged: (val) =>
                    selected = val.round().clamp(minQty, maxQuantity),
              ),
              const SizedBox(height: 8),
              Text(
                texts.quantityRangeLabel(minQty, maxQuantity),
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
              onPressed: () => Navigator.of(dialogContext).pop(selected),
              child: Text(texts.addAction),
            ),
          ],
        );
      },
    );
  }
}
