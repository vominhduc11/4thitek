import 'package:flutter/material.dart';

import '../support_service.dart';
import '../support_screen_diagnostics.dart';
import 'skeleton_box.dart';

class SupportTicketHistory extends StatelessWidget {
  const SupportTicketHistory({
    super.key,
    required this.isEnglish,
    required this.items,
    required this.isLoading,
    required this.isLoadingMore,
    required this.hasMore,
    this.errorMessage,
    this.selectedTicketId,
    this.onSelectTicket,
    required this.onLoadMore,
    this.onRetry,
    this.onCreateTicket,
    this.dense = false,
  });

  final bool isEnglish;
  final List<DealerSupportTicketRecord> items;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? errorMessage;
  final int? selectedTicketId;
  final ValueChanged<DealerSupportTicketRecord>? onSelectTicket;
  final Future<void> Function() onLoadMore;
  final Future<void> Function()? onRetry;
  final VoidCallback? onCreateTicket;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    SupportScreenDiagnostics.instance.recordSupportHistoryBuild();
    final texts = _SupportHistoryTexts(isEnglish: isEnglish);
    final colors = Theme.of(context).colorScheme;

    if (isLoading && items.isEmpty) {
      return const Column(
        children: [
          _HistorySkeletonCard(),
          SizedBox(height: 12),
          _HistorySkeletonCard(),
          SizedBox(height: 12),
          _HistorySkeletonCard(),
        ],
      );
    }

    if (items.isEmpty) {
      return _HistoryStateCard(
        icon: Icons.support_agent_outlined,
        title: texts.emptyTitle,
        message: texts.emptyMessage,
        foregroundColor: colors.onSurface,
        backgroundColor: colors.surfaceContainerHighest.withValues(alpha: 0.6),
        actionLabel: onCreateTicket == null
            ? null
            : texts.createFirstTicketLabel,
        onAction: onCreateTicket == null ? null : () async => onCreateTicket!(),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (errorMessage != null) ...[
          _HistoryStateCard(
            icon: Icons.error_outline_rounded,
            title: texts.errorTitle,
            message: errorMessage!,
            foregroundColor: colors.onErrorContainer,
            backgroundColor: colors.errorContainer.withValues(alpha: 0.62),
            onAction: onRetry,
            actionLabel: onRetry == null ? null : texts.retryLabel,
          ),
          const SizedBox(height: 12),
        ],
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: colors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Text(
            texts.inboxHelper,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.4,
            ),
          ),
        ),
        const SizedBox(height: 12),
        for (final item in items) ...[
          _HistoryCard(
            item: item,
            texts: texts,
            dense: dense,
            isSelected: item.id == selectedTicketId,
            onSelect: onSelectTicket == null
                ? null
                : () => onSelectTicket!(item),
          ),
          const SizedBox(height: 12),
        ],
        if (hasMore)
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: isLoadingMore ? null : onLoadMore,
              child: isLoadingMore
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        const SizedBox(width: 10),
                        Text(texts.loadingMoreLabel),
                      ],
                    )
                  : Text(texts.loadMoreLabel),
            ),
          ),
      ],
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({
    required this.item,
    required this.texts,
    required this.isSelected,
    required this.dense,
    this.onSelect,
  });

  final DealerSupportTicketRecord item;
  final _SupportHistoryTexts texts;
  final bool isSelected;
  final bool dense;
  final VoidCallback? onSelect;

  @override
  Widget build(BuildContext context) {
    SupportScreenDiagnostics.instance.recordSupportHistoryCardBuild();
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final latestAdminMessage = _resolveLatestAdminMessage(item);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onSelect,
        child: Container(
          width: double.infinity,
          padding: EdgeInsets.all(dense ? 14 : 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: isSelected
                  ? colors.primary
                  : colors.outlineVariant.withValues(alpha: 0.45),
              width: isSelected ? 1.5 : 1,
            ),
            color: isSelected
                ? colors.primary.withValues(alpha: 0.07)
                : colors.surfaceContainerLowest,
            boxShadow: isSelected && !dense
                ? [
                    BoxShadow(
                      color: colors.primary.withValues(alpha: 0.08),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ]
                : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.subject,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          texts.ticketCodeLabel(item.ticketCode),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  _StatusChip(status: item.status, texts: texts),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _MetaChip(
                    icon: Icons.schedule_outlined,
                    label: texts.lastUpdatedLabel(
                      _formatDateTime(item.updatedAt),
                    ),
                  ),
                  if (isSelected)
                    _MetaChip(
                      icon: Icons.check_circle_outline,
                      label: texts.selectedLabel,
                      highlighted: true,
                    ),
                ],
              ),
              if (latestAdminMessage != null) ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    color: colors.surfaceContainerLow,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.mark_email_read_outlined,
                        size: 16,
                        color: colors.primary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          texts.adminPreviewLabel(latestAdminMessage),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall?.copyWith(
                            height: 1.4,
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 14),
              Row(
                children: [
                  if (onSelect != null)
                    OutlinedButton.icon(
                      onPressed: onSelect,
                      icon: const Icon(Icons.visibility_outlined, size: 18),
                      label: Text(texts.viewDetailsLabel),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _formatDateTime(DateTime value) {
    final day = value.day.toString().padLeft(2, '0');
    final month = value.month.toString().padLeft(2, '0');
    final hour = value.hour.toString().padLeft(2, '0');
    final minute = value.minute.toString().padLeft(2, '0');
    return '$day/$month/${value.year} $hour:$minute';
  }

  static String? _resolveLatestAdminMessage(DealerSupportTicketRecord item) {
    for (final message in item.messages.reversed) {
      if (message.internalNote ||
          message.authorRole.trim().toLowerCase() != 'admin') {
        continue;
      }
      final normalized = message.message.trim();
      if (normalized.isNotEmpty) {
        return normalized;
      }
    }
    return null;
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({
    required this.icon,
    required this.label,
    this.highlighted = false,
  });

  final IconData icon;
  final String label;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: highlighted
            ? colors.primary.withValues(alpha: 0.12)
            : colors.surface,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 14,
            color: highlighted ? colors.primary : colors.onSurfaceVariant,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: highlighted ? colors.primary : null,
              fontWeight: highlighted ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryStateCard extends StatelessWidget {
  const _HistoryStateCard({
    required this.icon,
    required this.title,
    required this.message,
    required this.foregroundColor,
    required this.backgroundColor,
    this.onAction,
    this.actionLabel,
  });

  final IconData icon;
  final String title;
  final String message;
  final Color foregroundColor;
  final Color backgroundColor;
  final Future<void> Function()? onAction;
  final String? actionLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        color: backgroundColor,
        border: Border.all(color: foregroundColor.withValues(alpha: 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: foregroundColor),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: foregroundColor,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: foregroundColor.withValues(alpha: 0.9),
              height: 1.45,
            ),
          ),
          if (onAction != null && actionLabel != null) ...[
            const SizedBox(height: 14),
            OutlinedButton.icon(
              onPressed: onAction,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: Text(actionLabel!),
            ),
          ],
        ],
      ),
    );
  }
}

class _HistorySkeletonCard extends StatelessWidget {
  const _HistorySkeletonCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        color: Theme.of(
          context,
        ).colorScheme.surfaceContainerHighest.withValues(alpha: 0.45),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: SkeletonBox(
                  width: double.infinity,
                  height: 16,
                  borderRadius: BorderRadius.all(Radius.circular(10)),
                ),
              ),
              SizedBox(width: 12),
              SkeletonBox(
                width: 88,
                height: 28,
                borderRadius: BorderRadius.all(Radius.circular(999)),
              ),
            ],
          ),
          SizedBox(height: 12),
          SkeletonBox(
            width: 140,
            height: 14,
            borderRadius: BorderRadius.all(Radius.circular(10)),
          ),
          SizedBox(height: 12),
          SkeletonBox(
            width: double.infinity,
            height: 14,
            borderRadius: BorderRadius.all(Radius.circular(10)),
          ),
          SizedBox(height: 8),
          SkeletonBox(
            width: 220,
            height: 14,
            borderRadius: BorderRadius.all(Radius.circular(10)),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status, required this.texts});

  final String status;
  final _SupportHistoryTexts texts;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    Color background;
    Color foreground;
    switch (status.trim().toLowerCase()) {
      case 'resolved':
        background = const Color(0xFF163624);
        foreground = const Color(0xFF71E2A0);
        break;
      case 'in_progress':
        background = const Color(0xFF3A2C11);
        foreground = const Color(0xFFF7D46B);
        break;
      case 'closed':
        background = scheme.surface;
        foreground = scheme.onSurfaceVariant;
        break;
      default:
        background = scheme.primary.withValues(alpha: 0.14);
        foreground = scheme.primary;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: background,
      ),
      child: Text(
        texts.statusLabel(status),
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: foreground,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _SupportHistoryTexts {
  const _SupportHistoryTexts({required this.isEnglish});

  final bool isEnglish;

  String get emptyTitle =>
      isEnglish ? 'No support requests yet' : 'Chưa có yêu cầu hỗ trợ';
  String get emptyMessage => isEnglish
      ? 'Create your first request to start tracking support updates here.'
      : 'Tạo yêu cầu đầu tiên để theo dõi phản hồi hỗ trợ tại đây.';
  String get createFirstTicketLabel =>
      isEnglish ? 'Create first request' : 'Tạo yêu cầu đầu tiên';
  String get errorTitle => isEnglish
      ? 'Could not load request list'
      : 'Không thể tải danh sách yêu cầu';
  String get retryLabel => isEnglish ? 'Retry' : 'Thử lại';
  String get loadMoreLabel =>
      isEnglish ? 'Load more requests' : 'Xem thêm yêu cầu';
  String get loadingMoreLabel =>
      isEnglish ? 'Loading more...' : 'Đang tải thêm...';
  String get activeLabel => isEnglish ? 'Request selected' : 'Yêu cầu đang xem';
  String get selectedLabel => isEnglish ? 'Viewing' : 'Đang xem';
  String get viewDetailsLabel => isEnglish ? 'View details' : 'Xem chi tiết';
  String adminPreviewLabel(String message) => isEnglish
      ? 'Latest support update: $message'
      : 'Cập nhật mới nhất từ hỗ trợ: $message';
  String get inboxHelper => isEnglish
      ? 'Select a request to review the full conversation and add more details in the right place.'
      : 'Chọn một yêu cầu để xem toàn bộ trao đổi và bổ sung thông tin đúng chỗ.';

  String ticketCodeLabel(String ticketCode) =>
      isEnglish ? 'Request #$ticketCode' : 'Mã yêu cầu #$ticketCode';

  String lastUpdatedLabel(String value) =>
      isEnglish ? 'Updated $value' : 'Cập nhật $value';

  String statusLabel(String status) {
    switch (status.trim().toLowerCase()) {
      case 'resolved':
        return isEnglish ? 'Resolved' : 'Đã xử lý xong';
      case 'in_progress':
        return isEnglish ? 'In progress' : 'Đang xử lý';
      case 'closed':
        return isEnglish ? 'Closed' : 'Đã kết thúc';
      case 'open':
      default:
        return isEnglish ? 'Open' : 'Mới gửi';
    }
  }
}
