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
    final texts = _NotificationIconButtonTexts(
      isEnglish: Localizations.localeOf(context).languageCode == 'en',
    );
    final semanticLabel = count > 0
        ? texts.unreadNotificationsLabel(count)
        : texts.emptyNotificationsLabel;
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
            child: const Icon(Icons.notifications_outlined),
          ),
        ),
      ),
    );
  }
}

class _NotificationIconButtonTexts {
  const _NotificationIconButtonTexts({required this.isEnglish});

  final bool isEnglish;

  String get tooltip => isEnglish ? 'Notifications' : 'Thông báo';

  String unreadNotificationsLabel(int count) =>
      isEnglish ? 'Notifications, $count unread' : 'Thông báo, $count chưa đọc';

  String get emptyNotificationsLabel => isEnglish
      ? 'Notifications, no unread notifications'
      : 'Thông báo, không có thông báo chưa đọc';
}
