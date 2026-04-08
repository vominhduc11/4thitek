import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import 'breakpoints.dart';
import 'dealer_routes.dart';
import 'dashboard_screen.dart';
import 'global_search.dart';
import 'l10n/app_localizations.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'orders_screen.dart';
import 'product_list_screen.dart';
import 'utils.dart';
import 'warranty_hub_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

enum _NoticeDetailAction { markUnread, openRelated }

class _NotificationsScreenState extends State<NotificationsScreen> {
  static const double _tabletMaxWidth = 640;
  static const double _desktopMaxWidth = 760;

  String _notificationError(String error) {
    return notificationSyncErrorMessage(
      error,
      isEnglish: Localizations.localeOf(context).languageCode == 'en',
    );
  }

  @override
  Widget build(BuildContext context) {
    final notificationController = NotificationScope.of(context);
    final l10n = AppLocalizations.of(context)!;
    final notices = List.of(notificationController.notices)
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    final unreadCount = notificationController.unreadCount;
    final hasUnread = unreadCount > 0;
    final isTablet = AppBreakpoints.isTablet(context);
    final isDesktop =
        MediaQuery.sizeOf(context).width >= AppBreakpoints.desktop;
    final contentMaxWidth = isDesktop
        ? _desktopMaxWidth
        : isTablet
        ? _tabletMaxWidth
        : double.infinity;

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(l10n.notificationsTitle(notices.length)),
        actions: [
          IconButton(
            tooltip: l10n.notificationsMarkAllReadTooltip,
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
                : ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    children: [
                      FadeSlideIn(
                        child: _buildSummaryPanel(
                          context,
                          l10n: l10n,
                          noticeCount: notices.length,
                          unreadCount: unreadCount,
                          hasUnread: hasUnread,
                          notificationController: notificationController,
                        ),
                      ),
                      const SizedBox(height: 12),
                      for (var index = 0; index < notices.length; index++) ...[
                        Builder(
                          builder: (context) {
                            final notice = notices[index];
                            final shouldAnimate = index < 6;
                            final isRead = notificationController.isRead(
                              notice.id,
                            );
                            final colorScheme = Theme.of(context).colorScheme;
                            final cardColor = isRead
                                ? colorScheme.surfaceContainerHighest
                                      .withValues(alpha: 0.35)
                                : colorScheme.surface;
                            final borderColor = colorScheme.outlineVariant
                                .withValues(alpha: isRead ? 0.45 : 0.7);

                            return FadeSlideIn(
                              animate: shouldAnimate,
                              delay: shouldAnimate
                                  ? Duration(milliseconds: 20 * index)
                                  : Duration.zero,
                              child: RepaintBoundary(
                                child: Card(
                                  color: cardColor,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(18),
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
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleSmall
                                          ?.copyWith(
                                            fontWeight: isRead
                                                ? FontWeight.w600
                                                : FontWeight.w700,
                                          ),
                                    ),
                                    subtitle: Padding(
                                      padding: const EdgeInsets.only(top: 6),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
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
                                                      ? colorScheme
                                                            .onSurfaceVariant
                                                      : colorScheme.onSurface,
                                                ),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            formatRelativeTime(
                                              notice.createdAt,
                                            ),
                                            style: Theme.of(context)
                                                .textTheme
                                                .labelSmall
                                                ?.copyWith(
                                                  color: colorScheme
                                                      .onSurfaceVariant,
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
                              ),
                            );
                          },
                        ),
                        if (index != notices.length - 1)
                          const SizedBox(height: 10),
                      ],
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryPanel(
    BuildContext context, {
    required AppLocalizations l10n,
    required int noticeCount,
    required int unreadCount,
    required bool hasUnread,
    required NotificationController notificationController,
  }) {
    final isEnglish = Localizations.localeOf(context).languageCode == 'en';
    final colors = Theme.of(context).colorScheme;

    return SectionCard(
      title: l10n.notificationsTitle(noticeCount),
      subtitle: hasUnread
          ? (isEnglish
                ? 'Prioritize unread updates so orders, payments, and warranty tasks do not slip.'
                : 'Ưu tiên xử lý thông báo mới để không bỏ lỡ đơn hàng, công nợ và bảo hành.')
          : (isEnglish
                ? 'All notices are up to date. Pull down anytime to sync new activity.'
                : 'Tất cả thông báo đã được cập nhật. Kéo xuống bất kỳ lúc nào để đồng bộ hoạt động mới.'),
      icon: hasUnread
          ? Icons.notifications_active_outlined
          : Icons.done_all_outlined,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _NoticeMetricChip(
                icon: Icons.mark_email_unread_outlined,
                label: isEnglish ? 'Unread' : 'Chưa đọc',
                value: '$unreadCount',
              ),
              _NoticeMetricChip(
                icon: Icons.inventory_2_outlined,
                label: isEnglish ? 'Total notices' : 'Tổng thông báo',
                value: '$noticeCount',
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: colors.primaryContainer.withValues(alpha: 0.24),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: colors.outlineVariant.withValues(alpha: 0.34),
              ),
            ),
            child: Text(
              hasUnread
                  ? (isEnglish
                        ? 'Unread notices stay highlighted with a blue indicator until you open or confirm them.'
                        : 'Thông báo chưa đọc sẽ được giữ trạng thái nổi bật bằng chấm xanh cho đến khi bạn mở hoặc xác nhận.')
                  : (isEnglish
                        ? 'Notification history remains available here for quick review and operational follow-up.'
                        : 'Lịch sử thông báo vẫn được lưu tại đây để tra cứu nhanh và theo dõi vận hành.'),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
                height: 1.45,
              ),
            ),
          ),
          if (hasUnread) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton.tonalIcon(
                onPressed: () => _markAllAsRead(notificationController),
                icon: const Icon(Icons.done_all_outlined),
                label: Text(l10n.notificationsMarkAllReadTooltip),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isEnglish = Localizations.localeOf(context).languageCode == 'en';
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(28, 56, 28, 24),
      children: [
        SectionCard(
          title: l10n.notificationsEmptyTitle,
          subtitle: isEnglish
              ? 'Updates about orders, promotions, warranty actions, and system changes will appear here.'
              : 'Các cập nhật về đơn hàng, khuyến mãi, bảo hành và thay đổi hệ thống sẽ xuất hiện tại đây.',
          icon: Icons.notifications_none_rounded,
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Text(
                l10n.notificationsEmptyMessage,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 18),
              OutlinedButton.icon(
                onPressed: () {
                  NotificationScope.of(context).refresh();
                },
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: Text(
                  Localizations.localeOf(context).languageCode == 'en'
                      ? 'Refresh'
                      : 'Làm mới',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _markAllAsRead(
    NotificationController notificationController,
  ) async {
    final l10n = AppLocalizations.of(context)!;
    final error = await notificationController.markAllAsRead();
    if (!mounted) {
      return;
    }
    if (error != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(_notificationError(error))));
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(l10n.notificationsMarkedAllReadMessage)),
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
      ).showSnackBar(SnackBar(content: Text(_notificationError(readError))));
    }

    final action = await showModalBottomSheet<_NoticeDetailAction>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      requestFocus: true,
      builder: (sheetContext) {
        final l10n = AppLocalizations.of(sheetContext)!;
        final colorScheme = Theme.of(sheetContext).colorScheme;
        final content = RepaintBoundary(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final compactActions = constraints.maxWidth < 420;
                final markUnreadButton = OutlinedButton.icon(
                  onPressed: () => Navigator.of(
                    sheetContext,
                  ).pop(_NoticeDetailAction.markUnread),
                  icon: const Icon(Icons.mark_email_unread_outlined),
                  label: Text(l10n.notificationsMarkUnreadAction),
                );
                final openRelatedButton = FilledButton.icon(
                  onPressed: () => Navigator.of(
                    sheetContext,
                  ).pop(_NoticeDetailAction.openRelated),
                  icon: const Icon(Icons.open_in_new),
                  label: Text(_relatedActionLabel(notice)),
                );

                return SingleChildScrollView(
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
                              _noticeTypeLabel(l10n, notice.type),
                              style: Theme.of(sheetContext).textTheme.labelLarge
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text(
                        notice.title,
                        style: Theme.of(sheetContext).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        notice.message,
                        style: Theme.of(sheetContext).textTheme.bodyMedium
                            ?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                              height: 1.45,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        formatDateTime(notice.createdAt),
                        style: Theme.of(sheetContext).textTheme.labelSmall
                            ?.copyWith(color: colorScheme.onSurfaceVariant),
                      ),
                      const SizedBox(height: 18),
                      if (compactActions) ...[
                        SizedBox(
                          width: double.infinity,
                          child: markUnreadButton,
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: openRelatedButton,
                        ),
                      ] else
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [markUnreadButton, openRelatedButton],
                        ),
                    ],
                  ),
                );
              },
            ),
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
          ).showSnackBar(SnackBar(content: Text(_notificationError(error))));
          break;
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.notificationsMarkedUnreadMessage,
            ),
          ),
        );
        break;
      case _NoticeDetailAction.openRelated:
        await _openRelatedContent(notice);
        break;
    }
  }

  Future<void> _openRelatedContent(DistributorNotice notice) async {
    if (await _openNoticeLink(notice.deepLink)) {
      return;
    }
    if (await _openNoticeLink(notice.link)) {
      return;
    }

    final destination = switch (notice.type) {
      NoticeType.order => const OrdersScreen(),
      NoticeType.promotion => const ProductListScreen(),
      NoticeType.warranty => const WarrantyHubScreen(),
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
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.notificationsOpenLinkFailedMessage,
            ),
          ),
        );
      }
      return launched;
    }

    final normalizedRoute = normalizeDealerInternalRoute(link);
    if (normalizedRoute == null) {
      return false;
    }
    if (!mounted) {
      return true;
    }

    if (isDealerTopLevelRoute(normalizedRoute)) {
      context.go(normalizedRoute);
    } else {
      await context.push(normalizedRoute);
    }
    return true;
  }

  String _noticeTypeLabel(AppLocalizations l10n, NoticeType type) {
    switch (type) {
      case NoticeType.order:
        return l10n.notificationsTypeOrder;
      case NoticeType.promotion:
        return l10n.notificationsTypePromotion;
      case NoticeType.warranty:
        return Localizations.localeOf(context).languageCode == 'en'
            ? 'Warranty'
            : 'Bảo hành';
      case NoticeType.system:
        return l10n.notificationsTypeSystem;
    }
  }

  String _relatedActionLabel(DistributorNotice notice) {
    final l10n = AppLocalizations.of(context)!;
    final link = (notice.deepLink ?? notice.link)?.trim() ?? '';
    if (link.startsWith('/orders')) {
      return l10n.notificationsRelatedViewOrder;
    }
    if (link.startsWith('/products')) {
      return l10n.notificationsRelatedViewProducts;
    }
    if (link == '/account/support' ||
        link == '/dealer/support' ||
        link == '/support') {
      return l10n.notificationsRelatedViewSupport;
    }
    if (link.startsWith('/warranty')) {
      return Localizations.localeOf(context).languageCode == 'en'
          ? 'View warranty'
          : 'Xem bảo hành';
    }
    if (link.startsWith('/notifications')) {
      return l10n.notificationsRelatedViewNotifications;
    }
    if (link.isNotEmpty) {
      return l10n.notificationsRelatedOpenLink;
    }

    switch (notice.type) {
      case NoticeType.order:
        return l10n.notificationsRelatedViewOrder;
      case NoticeType.promotion:
        return l10n.notificationsRelatedViewProducts;
      case NoticeType.warranty:
        return Localizations.localeOf(context).languageCode == 'en'
            ? 'View warranty'
            : 'Xem bảo hành';
      case NoticeType.system:
        return l10n.notificationsRelatedOpenOverview;
    }
  }
}

class _NoticeMetricChip extends StatelessWidget {
  const _NoticeMetricChip({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.42),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: colors.primary),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: colors.onSurfaceVariant,
                ),
              ),
              Text(
                value,
                style: Theme.of(
                  context,
                ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
              ),
            ],
          ),
        ],
      ),
    );
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
      NoticeType.warranty => colorScheme.secondary,
      NoticeType.system => colorScheme.secondary,
    };
    final icon = switch (type) {
      NoticeType.order => Icons.local_shipping_outlined,
      NoticeType.promotion => Icons.campaign_outlined,
      NoticeType.warranty => Icons.verified_outlined,
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
