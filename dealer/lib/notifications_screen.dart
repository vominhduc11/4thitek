import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'breakpoints.dart';
import 'dashboard_screen.dart';
import 'global_search.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'order_detail_screen.dart';
import 'orders_screen.dart';
import 'product_list_screen.dart';
import 'support_screen.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

enum _NoticeDetailAction { markUnread, openRelated }

class _NotificationsScreenState extends State<NotificationsScreen> {
  static const double _tabletMaxWidth = 640;

  @override
  Widget build(BuildContext context) {
    final notificationController = NotificationScope.of(context);
    final notices = List.of(notificationController.notices)
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    final hasUnread = notificationController.unreadCount > 0;
    final isTablet = AppBreakpoints.isTablet(context);
    final contentMaxWidth = isTablet ? _tabletMaxWidth : double.infinity;

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle('Thông báo (${notices.length})'),
        actions: [
          IconButton(
            tooltip: 'Đánh dấu tất cả đã đọc',
            onPressed: hasUnread
                ? () async => _markAllAsRead(notificationController)
                : null,
            icon: const Icon(Icons.done_all_outlined),
          ),
          const GlobalSearchIconButton(),
        ],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: RefreshIndicator(
            onRefresh: notificationController.refresh,
            child: notices.isEmpty
                ? _buildEmptyState(context)
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    itemCount: notices.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final notice = notices[index];
                      final isRead = notificationController.isRead(notice.id);
                      final colorScheme = Theme.of(context).colorScheme;
                      final cardColor = isRead
                          ? colorScheme.surfaceContainerHighest.withValues(
                              alpha: 0.35,
                            )
                          : colorScheme.surface;
                      final borderColor = colorScheme.outlineVariant.withValues(
                        alpha: isRead ? 0.45 : 0.7,
                      );

                      return FadeSlideIn(
                        delay: Duration(milliseconds: 20 * index),
                        child: Card(
                          color: cardColor,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: borderColor),
                          ),
                          child: ListTile(
                            onTap: () => _openNoticeDetail(notice),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 10,
                            ),
                            leading: _NoticeTypeAvatar(
                              type: notice.type,
                              isRead: isRead,
                            ),
                            title: Text(
                              notice.title,
                              style: Theme.of(context).textTheme.titleSmall
                                  ?.copyWith(
                                    fontWeight: isRead
                                        ? FontWeight.w600
                                        : FontWeight.w700,
                                  ),
                            ),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    notice.message,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(
                                          color: isRead
                                              ? colorScheme.onSurfaceVariant
                                              : colorScheme.onSurface,
                                        ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    formatRelativeTime(notice.createdAt),
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelSmall
                                        ?.copyWith(
                                          color: colorScheme.onSurfaceVariant,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                            trailing: isRead
                                ? null
                                : Container(
                                    width: 10,
                                    height: 10,
                                    decoration: BoxDecoration(
                                      color: colorScheme.primary,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(28, 56, 28, 24),
      children: [
        const Icon(Icons.notifications_none, size: 56),
        const SizedBox(height: 10),
        Text(
          'Chưa có thông báo nào',
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 6),
        Text(
          'Thông báo mới sẽ xuất hiện tại đây khi có cập nhật.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  Future<void> _markAllAsRead(
    NotificationController notificationController,
  ) async {
    final error = await notificationController.markAllAsRead();
    if (!mounted) {
      return;
    }
    if (error != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error)));
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đã đánh dấu tất cả là đã đọc.')),
    );
  }

  Future<void> _openNoticeDetail(DistributorNotice notice) async {
    final notificationController = NotificationScope.of(context);
    final readError = await notificationController.markRead(notice.id);
    if (!mounted) {
      return;
    }
    if (readError != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(readError)));
    }

    final action = await showModalBottomSheet<_NoticeDetailAction>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      requestFocus: true,
      builder: (sheetContext) {
        final colorScheme = Theme.of(sheetContext).colorScheme;
        final content = Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _NoticeTypeAvatar(type: notice.type, isRead: false),
                  const SizedBox(width: 10),
                  Flexible(
                    child: Text(
                      _noticeTypeLabel(notice.type),
                      style: Theme.of(sheetContext).textTheme.labelLarge
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                notice.title,
                style: Theme.of(
                  sheetContext,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 10),
              Text(
                notice.message,
                style: Theme.of(sheetContext).textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                formatDateTime(notice.createdAt),
                style: Theme.of(sheetContext).textTheme.labelSmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 18),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: () => Navigator.of(
                      sheetContext,
                    ).pop(_NoticeDetailAction.markUnread),
                    icon: const Icon(Icons.mark_email_unread_outlined),
                    label: const Text('Đánh dấu chưa đọc'),
                  ),
                  FilledButton.icon(
                    onPressed: () => Navigator.of(
                      sheetContext,
                    ).pop(_NoticeDetailAction.openRelated),
                    icon: const Icon(Icons.open_in_new),
                    label: Text(_relatedActionLabel(notice)),
                  ),
                ],
              ),
            ],
          ),
        );

        return SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: _tabletMaxWidth),
              child: content,
            ),
          ),
        );
      },
    );

    if (!mounted || action == null) {
      return;
    }

    switch (action) {
      case _NoticeDetailAction.markUnread:
        final error = await notificationController.markUnread(notice.id);
        if (!mounted) {
          return;
        }
        if (error != null) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(error)));
          break;
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã đánh dấu là chưa đọc.')),
        );
        break;
      case _NoticeDetailAction.openRelated:
        await _openRelatedContent(notice);
        break;
    }
  }

  Future<void> _openRelatedContent(DistributorNotice notice) async {
    if (await _openNoticeLink(notice.link)) {
      return;
    }

    final destination = switch (notice.type) {
      NoticeType.order => const OrdersScreen(),
      NoticeType.promotion => const ProductListScreen(),
      NoticeType.system => const DashboardScreen(),
    };

    if (!mounted) {
      return;
    }

    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => destination));
  }

  Future<bool> _openNoticeLink(String? rawLink) async {
    final link = rawLink?.trim() ?? '';
    if (link.isEmpty) {
      return false;
    }

    final uri = Uri.tryParse(link);
    if (uri == null) {
      return false;
    }

    if (uri.hasScheme) {
      final launched = await launchUrl(uri, mode: LaunchMode.platformDefault);
      if (!launched && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('KhĂ´ng má»Ÿ Ä‘Æ°á»£c liĂªn káº¿t.')),
        );
      }
      return launched;
    }

    final path = uri.path;
    final orderId =
        uri.pathSegments.length >= 2 && uri.pathSegments.first == 'orders'
        ? uri.pathSegments[1]
        : null;
    final destination = path == '/orders'
        ? const OrdersScreen()
        : orderId != null && orderId.isNotEmpty
        ? OrderDetailScreen(orderId: orderId)
        : path == '/products' || path.startsWith('/products/')
        ? const ProductListScreen()
        : path == '/account/support' ||
              path == '/dealer/support' ||
              path == '/support'
        ? const SupportScreen()
        : path == '/notifications'
        ? const NotificationsScreen()
        : path == '/home' || path == '/'
        ? const DashboardScreen()
        : null;

    if (destination == null) {
      return false;
    }
    if (!mounted) {
      return true;
    }

    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => destination));
    return true;
  }

  String _noticeTypeLabel(NoticeType type) {
    switch (type) {
      case NoticeType.order:
        return 'Đơn hàng';
      case NoticeType.promotion:
        return 'Khuyến mãi';
      case NoticeType.system:
        return 'Hệ thống';
    }
  }

  String _relatedActionLabel(DistributorNotice notice) {
    final link = notice.link?.trim() ?? '';
    if (link.startsWith('/orders')) {
      return 'Xem Ä‘Æ¡n hĂ ng';
    }
    if (link.startsWith('/products')) {
      return 'Xem sáº£n pháº©m';
    }
    if (link == '/account/support' ||
        link == '/dealer/support' ||
        link == '/support') {
      return 'Xem há»— trá»£';
    }
    if (link.startsWith('/notifications')) {
      return 'Xem thĂ´ng bĂ¡o';
    }
    if (link.isNotEmpty) {
      return 'Má»Ÿ liĂªn káº¿t';
    }

    switch (notice.type) {
      case NoticeType.order:
        return 'Xem đơn hàng';
      case NoticeType.promotion:
        return 'Xem sản phẩm';
      case NoticeType.system:
        return 'Mở tổng quan';
    }
  }
}

class _NoticeTypeAvatar extends StatelessWidget {
  const _NoticeTypeAvatar({required this.type, required this.isRead});

  final NoticeType type;
  final bool isRead;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final tint = switch (type) {
      NoticeType.order => colorScheme.primary,
      NoticeType.promotion => colorScheme.tertiary,
      NoticeType.system => colorScheme.secondary,
    };
    final icon = switch (type) {
      NoticeType.order => Icons.local_shipping_outlined,
      NoticeType.promotion => Icons.campaign_outlined,
      NoticeType.system => Icons.build_outlined,
    };
    final backgroundColor = tint.withValues(alpha: isRead ? 0.1 : 0.18);
    final iconColor = isRead ? tint.withValues(alpha: 0.8) : tint;

    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(color: backgroundColor, shape: BoxShape.circle),
      child: Icon(icon, size: 18, color: iconColor),
    );
  }
}
