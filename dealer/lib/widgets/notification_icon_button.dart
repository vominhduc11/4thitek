import 'package:flutter/material.dart';

class NotificationIconButton extends StatelessWidget {
  const NotificationIconButton({
    super.key,
    required this.count,
    required this.onPressed,
  });

  final int count;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final semanticLabel = count > 0
        ? 'Thông báo, $count chưa đọc'
        : 'Thông báo, không có thông báo chưa đọc';
    return Semantics(
      button: true,
      label: semanticLabel,
      child: ExcludeSemantics(
        child: IconButton(
          onPressed: onPressed,
          tooltip: 'Thông báo',
          icon: Badge(
            isLabelVisible: count > 0,
            label: Text(count > 99 ? '99+' : '$count'),
            child: const Icon(Icons.notifications_outlined),
          ),
        ),
      ),
    );
  }
}
