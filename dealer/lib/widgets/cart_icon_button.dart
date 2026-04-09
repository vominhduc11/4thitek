import 'package:flutter/material.dart';

class CartIconButton extends StatelessWidget {
  const CartIconButton({
    super.key,
    required this.count,
    required this.onPressed,
  });

  final int count;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final texts = _CartIconButtonTexts(
      isEnglish: Localizations.localeOf(context).languageCode == 'en',
    );
    final semanticLabel = count > 0
        ? texts.cartWithItemsLabel(count)
        : texts.emptyCartLabel;
    return Semantics(
      button: true,
      label: semanticLabel,
      child: ExcludeSemantics(
        child: IconButton(
          onPressed: onPressed,
          tooltip: texts.tooltip,
          icon: Badge(
            isLabelVisible: count > 0,
            label: Text(count > 99 ? '99+' : '$count'),
            child: const Icon(Icons.shopping_cart_outlined),
          ),
        ),
      ),
    );
  }
}

class _CartIconButtonTexts {
  const _CartIconButtonTexts({required this.isEnglish});

  final bool isEnglish;

  String get tooltip => isEnglish ? 'Cart' : 'Giỏ hàng';

  String cartWithItemsLabel(int count) =>
      isEnglish ? 'Cart, $count items' : 'Giỏ hàng, $count sản phẩm';

  String get emptyCartLabel =>
      isEnglish ? 'Cart, no items yet' : 'Giỏ hàng, chưa có sản phẩm';
}
