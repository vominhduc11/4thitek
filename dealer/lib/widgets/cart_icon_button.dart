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
    final semanticLabel = count > 0
        ? 'Giỏ hàng, $count sản phẩm'
        : 'Giỏ hàng, chưa có sản phẩm';
    return Semantics(
      button: true,
      label: semanticLabel,
      child: ExcludeSemantics(
        child: IconButton(
          onPressed: onPressed,
          tooltip: 'Giỏ hàng',
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
