part of 'product_detail_screen.dart';

class _ProductDetailTexts {
  const _ProductDetailTexts({required this.isEnglish});

  final bool isEnglish;

  String get addToCartTitle => isEnglish ? 'Add to cart' : 'Thêm vào giỏ';
  String get addToCartAction => isEnglish ? 'Add' : 'Thêm';
  String get buyNowTitle => isEnglish ? 'Buy now' : 'Mua ngay';
  String get continueAction => isEnglish ? 'Continue' : 'Tiếp tục';
  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get viewCartAction => isEnglish ? 'View cart' : 'Mở giỏ hàng';
  String get dealerPriceLabel => isEnglish ? 'Dealer price' : 'Giá đại lý';
  String get vatExcludedLabel => isEnglish ? 'Excludes VAT' : 'Chưa gồm VAT';
  String skuLabel(String sku) => 'SKU: $sku';
  String get technicalSpecsTitle =>
      isEnglish ? 'Technical specifications' : 'Thông số kỹ thuật';
  String get syncingCartMessage => isEnglish
      ? 'Cart is syncing for this product.'
      : 'Giỏ hàng đang đồng bộ cho sản phẩm này.';
  String get outOfStockMessage =>
      isEnglish ? 'This product is out of stock.' : 'Sản phẩm đã hết hàng.';
  String get cartLimitReachedMessage => isEnglish
      ? 'Cart quantity limit has been reached.'
      : 'Đã đạt giới hạn số lượng trong giỏ.';
  String get stockLimitReachedMessage => isEnglish
      ? 'Product has reached the stock limit.'
      : 'Sản phẩm đã đạt giới hạn tồn kho.';
  String get maxStockMessage => isEnglish
      ? 'Product is out of stock or the cart limit has been reached.'
      : 'Sản phẩm đã hết hàng hoặc đã đạt giới hạn trong giỏ.';
  String addedToCartMessage(String productName, int quantity) => isEnglish
      ? 'Added $productName (x$quantity) to cart.'
      : 'Đã thêm $productName (x$quantity) vào giỏ hàng.';
  String quantityRangeLabel(int minQuantity, int maxQuantity) => isEnglish
      ? 'Minimum: $minQuantity • Maximum: $maxQuantity'
      : 'Tối thiểu: $minQuantity • Tối đa: $maxQuantity';
  String quantityInCartMessage(int quantity) => isEnglish
      ? 'You already have $quantity in the cart.'
      : 'Bạn đã có $quantity trong giỏ.';
  String minimumQuantityMessage(int quantity) => isEnglish
      ? 'Minimum quantity: $quantity'
      : 'Số lượng tối thiểu: $quantity';
  String get maximumByStockMessage => isEnglish
      ? 'Maximum quantity reached based on stock.'
      : 'Đã đạt tối đa theo tồn kho.';
  String get statusLabel => isEnglish ? 'Status' : 'Trạng thái';
  String get outOfStockShortLabel => isEnglish ? 'Out of stock' : 'Hết hàng';
  String get lowStockShortLabel => isEnglish ? 'Low stock' : 'Sắp hết';
  String get inStockShortLabel => isEnglish ? 'In stock' : 'Còn hàng';
  String get lowStockCompactLabel =>
      isEnglish ? 'Limited stock' : 'Còn ít hàng';
  String lowStockBadge(int remainingStock) =>
      isEnglish ? 'Low stock: $remainingStock' : 'Sắp hết: $remainingStock';
  String inStockBadge(int remainingStock) =>
      isEnglish ? 'In stock: $remainingStock' : 'Còn hàng: $remainingStock';
  String get stockLabel => isEnglish ? 'Stock' : 'Tồn kho';
  String get readyToAddLabel => isEnglish ? 'Ready to add' : 'Thêm được ngay';
  String readyToAddValue(int quantity) =>
      isEnglish ? '$quantity products' : '$quantity sản phẩm';
  String get warrantyLabel => isEnglish ? 'Warranty' : 'Bảo hành';
  String warrantyMonthsValue(int months) =>
      isEnglish ? '$months months' : '$months tháng';
  String get quickInfoTitle =>
      isEnglish ? 'Quick information' : 'Thông tin nhanh';
  String get quickInfoDescription => isEnglish
      ? 'Key indicators to make ordering decisions faster.'
      : 'Chỉ số quan trọng để ra quyết định đặt hàng nhanh.';
  String quantityInCartBanner(int quantity) => isEnglish
      ? '$quantity products are already in your cart.'
      : 'Đã có $quantity sản phẩm trong giỏ';
  String get detailedDescriptionTitle =>
      isEnglish ? 'Detailed description' : 'Mô tả chi tiết';
  String get noDetailedDescriptionMessage => isEnglish
      ? 'No detailed description is available yet.'
      : 'Chưa có mô tả chi tiết.';
  String get productVideosTitle =>
      isEnglish ? 'Product videos' : 'Video sản phẩm';
  String get noProductVideosMessage => isEnglish
      ? 'No videos are available for this product yet.'
      : 'Chưa có video cho sản phẩm này.';
  String get defaultVideoTitle => isEnglish ? 'Video' : 'Video';
  String get invalidProductVideoMessage => isEnglish
      ? 'No valid video was found for this product.'
      : 'Không tìm thấy video hợp lệ cho sản phẩm này.';
  String get cannotPlayVideoNowMessage => isEnglish
      ? 'Cannot play this video right now. Please try again later.'
      : 'Không thể phát video lúc này. Vui lòng thử lại sau.';
  String get invalidVideoLinkMessage =>
      isEnglish ? 'The video link is invalid.' : 'Link video không hợp lệ.';
  String get cannotOpenVideoNowMessage => isEnglish
      ? 'Cannot open the video right now.'
      : 'Không thể mở video lúc này.';
  String get youtubeExternalOpenMessage => isEnglish
      ? 'This YouTube video will open outside the app.'
      : 'Video YouTube sẽ mở bên ngoài ứng dụng.';
  String get videoExternalOpenMessage => isEnglish
      ? 'This video will open outside the app.'
      : 'Video này sẽ mở bên ngoài ứng dụng.';
  String get openOnYoutubeAction =>
      isEnglish ? 'Open on YouTube' : 'Mở trên YouTube';
  String get openVideoAction => isEnglish ? 'Open video' : 'Mở video';
  String get cannotLoadVideoOnDeviceMessage => isEnglish
      ? 'This device cannot load the video.'
      : 'Không thể tải video trên thiết bị này.';
  String get retryLoadAction => isEnglish ? 'Retry' : 'Thử tải lại';
  String get tapToLoadVideoMessage =>
      isEnglish ? 'Tap to load video' : 'Nhấn để tải video';
  String quantityInCartSummary(int quantity) =>
      isEnglish ? '$quantity already in cart' : 'Đã có $quantity trong giỏ';
  String get flexibleQuantityLabel =>
      isEnglish ? 'Flexible quantity' : 'Số lượng linh hoạt';
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
