part of 'cart_screen.dart';

class _CartTexts {
  const _CartTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Cart' : 'Giỏ hàng';

  String get heroTitle => isEnglish ? 'Review your cart' : 'Kiểm tra giỏ hàng';

  String get heroSubtitle => isEnglish
      ? 'Adjust quantities, review discounts and continue to checkout when everything looks right.'
      : 'Điều chỉnh số lượng, xem chiết khấu và tiếp tục thanh toán khi mọi thứ đã sẵn sàng.';

  String get overviewTitle =>
      isEnglish ? 'Cart overview' : 'Tổng quan giỏ hàng';

  String get overviewSubtitle => isEnglish
      ? 'Review the order quickly, then continue checking line items below.'
      : 'Xem nhanh tổng quan đơn hàng, sau đó rà soát từng sản phẩm ở phía dưới.';

  String get itemsSectionTitle =>
      isEnglish ? 'Items in cart' : 'Sản phẩm trong giỏ';

  String get itemsSectionSubtitle => isEnglish
      ? 'Update quantities or remove any item before proceeding.'
      : 'Điều chỉnh số lượng hoặc xóa sản phẩm trước khi tiếp tục thanh toán.';

  String get subtotalLabel => isEnglish ? 'Subtotal' : 'Tạm tính';

  String discountLabel(int percent) =>
      isEnglish ? 'Discount ($percent%)' : 'Chiết khấu ($percent%)';

  String get afterDiscountLabel =>
      isEnglish ? 'After discount' : 'Sau giảm giá';

  String vatLabel(int percent) => 'VAT ($percent%)';

  String get totalPaymentLabel =>
      isEnglish ? 'Total payment' : 'Tổng thanh toán';

  String get summaryTitle => isEnglish ? 'Order summary' : 'Tóm tắt đơn hàng';

  String get summarySubtitle => isEnglish
      ? 'Review pricing and checkout availability before placing the order.'
      : 'Kiểm tra giá trị đơn hàng và khả năng thanh toán trước khi đặt hàng.';

  String itemCountLabel(int count) =>
      isEnglish ? '$count items' : '$count sản phẩm';

  String get checkoutButton =>
      isEnglish ? 'Proceed to checkout' : 'Tiếp tục thanh toán';

  String get syncingCheckoutButton =>
      isEnglish ? 'Syncing cart...' : 'Đang đồng bộ giỏ hàng...';

  String get readyCheckoutHint => isEnglish
      ? 'Cart is ready for checkout.'
      : 'Giỏ hàng đã sẵn sàng để thanh toán.';

  String get checkoutUnavailableHint => isEnglish
      ? 'No available products for checkout.'
      : 'Không có sản phẩm khả dụng để thanh toán.';

  String get syncingBeforeCheckoutHint => isEnglish
      ? 'Wait for cart sync to finish before checkout.'
      : 'Vui lòng chờ đồng bộ giỏ hàng hoàn tất trước khi thanh toán.';

  String get swipeDeleteHint => isEnglish
      ? 'Use the delete button for instant removal, or swipe left and confirm to avoid accidental deletion.'
      : 'Bạn có thể dùng nút xóa để bỏ ngay, hoặc vuốt sang trái rồi xác nhận để tránh xóa nhầm.';

  String removedFromCart(String productName) => isEnglish
      ? 'Removed $productName from cart'
      : 'Đã xóa $productName khỏi giỏ';

  String get syncCartFailed => isEnglish
      ? 'Could not sync cart. Please try again.'
      : 'Không thể đồng bộ giỏ hàng. Vui lòng thử lại.';

  String get undoAction => isEnglish ? 'Undo' : 'Hoàn tác';

  String get deleteTooltip => isEnglish ? 'Remove from cart' : 'Xóa khỏi giỏ';
  String get swipeDeleteAffordance =>
      isEnglish ? 'Review delete' : 'Xác nhận xóa';
  String get swipeDeleteConfirmTitle =>
      isEnglish ? 'Remove item from cart?' : 'Xóa sản phẩm khỏi giỏ?';
  String swipeDeleteConfirmMessage(String productName) => isEnglish
      ? 'This swipe will remove $productName from the cart. You can still undo it from the snackbar right after.'
      : 'Thao tác vuốt này sẽ xóa $productName khỏi giỏ. Bạn vẫn có thể hoàn tác ngay sau đó từ thanh thông báo.';
  String get keepItemAction => isEnglish ? 'Keep item' : 'Giữ lại';
  String get confirmDeleteAction => isEnglish ? 'Delete item' : 'Xóa sản phẩm';

  String cartItemSemantics(String productName) =>
      isEnglish ? 'Cart item $productName' : 'Mục giỏ hàng $productName';

  String get cartItemHint => isEnglish
      ? 'Swipe left and confirm to remove'
      : 'Vuốt sang trái rồi xác nhận để xóa';

  String lineTotalLabel(String amount) =>
      isEnglish ? 'Line total: $amount' : 'Tổng dòng: $amount';

  String skuLabel(String sku) => 'SKU: $sku';

  String get maxStockReached =>
      isEnglish ? 'Reached maximum stock' : 'Đã đạt tồn kho tối đa';

  String get syncingItemHint =>
      isEnglish ? 'Syncing quantity...' : 'Đang đồng bộ số lượng...';

  String get discontinuedProduct => isEnglish
      ? 'Product is temporarily unavailable'
      : 'Sản phẩm tạm ngưng phân phối';

  String get readyStatusLabel =>
      isEnglish ? 'Ready to review' : 'Sẵn sàng kiểm tra';

  String get syncingStatusLabel =>
      isEnglish ? 'Cart syncing' : 'Đang đồng bộ giỏ hàng';

  String buyMoreHint({
    required int remainingQuantity,
    required int targetPercent,
  }) {
    if (isEnglish) {
      return 'Buy $remainingQuantity more products to get $targetPercent% off.';
    }
    return 'Mua thêm $remainingQuantity sản phẩm để giảm $targetPercent%.';
  }

  String get emptyTitle =>
      isEnglish ? 'Your cart is empty' : 'Giỏ hàng đang trống';

  String get emptySubtitle => isEnglish
      ? 'Add products to start placing your order.'
      : 'Hãy thêm sản phẩm để bắt đầu đặt hàng.';

  String get continueShoppingButton =>
      isEnglish ? 'Continue shopping' : 'Tiếp tục mua hàng';
}
