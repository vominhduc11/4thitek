import 'package:flutter/material.dart';

import '../support_service.dart';
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
    required this.onLoadMore,
    this.onRetry,
  });

  final bool isEnglish;
  final List<DealerSupportTicketRecord> items;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? errorMessage;
  final Future<void> Function() onLoadMore;
  final Future<void> Function()? onRetry;

  @override
  Widget build(BuildContext context) {
    final texts = _SupportHistoryTexts(isEnglish: isEnglish);
    final colors = Theme.of(context).colorScheme;

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
        if (isLoading && items.isEmpty)
          const Column(
            children: [
              _HistorySkeletonCard(),
              SizedBox(height: 12),
              _HistorySkeletonCard(),
            ],
          )
        else if (items.isEmpty)
          _HistoryStateCard(
            icon: Icons.support_agent_outlined,
            title: texts.emptyTitle,
            message: texts.emptyMessage,
            foregroundColor: colors.onSurface,
            backgroundColor: colors.surfaceContainerHighest.withValues(
              alpha: 0.6,
            ),
          )
        else
          Column(
            children: [
              for (final item in items) ...[
                _HistoryCard(item: item, texts: texts),
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
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(texts.loadingMoreLabel),
                            ],
                          )
                        : Text(texts.loadMoreLabel),
                  ),
                ),
            ],
          ),
      ],
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.item, required this.texts});

  final DealerSupportTicketRecord item;
  final _SupportHistoryTexts texts;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.45),
        ),
        color: theme.colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.45,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.subject,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              _StatusChip(status: item.status, texts: texts),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${texts.ticketLabel}: ${item.ticketCode}',
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: 6),
          Text(
            item.message,
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.45),
          ),
          if (item.messages.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              texts.threadLabel,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            ...item.messages
                .where((message) => !message.internalNote)
                .map(
                  (message) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          texts.messageAuthorLabel(
                            message.authorRole,
                            message.authorName,
                          ),
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          message.message,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            height: 1.45,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
          ] else if (item.adminReply != null && item.adminReply!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              texts.adminReplyLabel,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              item.adminReply!,
              style: theme.textTheme.bodyMedium?.copyWith(height: 1.45),
            ),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 6,
            children: [
              _InfoPill(label: texts.priorityLabel, value: item.priority),
              _InfoPill(
                label: texts.createdLabel,
                value: _formatDateTime(item.createdAt),
              ),
              if (item.resolvedAt != null)
                _InfoPill(
                  label: texts.resolvedLabel,
                  value: _formatDateTime(item.resolvedAt!),
                ),
              if (item.closedAt != null)
                _InfoPill(
                  label: texts.closedLabel,
                  value: _formatDateTime(item.closedAt!),
                ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDateTime(DateTime value) {
    final day = value.day.toString().padLeft(2, '0');
    final month = value.month.toString().padLeft(2, '0');
    final hour = value.hour.toString().padLeft(2, '0');
    final minute = value.minute.toString().padLeft(2, '0');
    return '$day/$month/${value.year} $hour:$minute';
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
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
        borderRadius: BorderRadius.circular(18),
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
            width: 120,
            height: 14,
            borderRadius: BorderRadius.all(Radius.circular(10)),
          ),
          SizedBox(height: 10),
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

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: Theme.of(context).colorScheme.surface,
      ),
      child: Text(
        '$label: $value',
        style: Theme.of(context).textTheme.bodySmall,
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
    switch (status) {
      case 'RESOLVED':
        background = const Color(0xFF163624);
        foreground = const Color(0xFF71E2A0);
        break;
      case 'IN_PROGRESS':
        background = const Color(0xFF3A2C11);
        foreground = const Color(0xFFBDF919);
        break;
      case 'CLOSED':
        background = scheme.surface;
        foreground = scheme.onSurfaceVariant;
        break;
      case 'OPEN':
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

  String get errorTitle =>
      isEnglish ? 'Unable to load history' : 'Không tải được lịch sử';
  String get emptyTitle =>
      isEnglish ? 'No support requests yet' : 'Chưa có yêu cầu hỗ trợ';
  String get emptyMessage => isEnglish
      ? 'Your recent support requests will appear here.'
      : 'Các yêu cầu hỗ trợ gần đây sẽ xuất hiện tại đây.';
  String get loadMoreLabel => isEnglish ? 'Load more' : 'Xem thêm';
  String get loadingMoreLabel => isEnglish ? 'Loading...' : 'Đang tải...';
  String get retryLabel => isEnglish ? 'Retry' : 'Thử lại';
  String get ticketLabel => isEnglish ? 'Ticket' : 'Mã';
  String get adminReplyLabel => isEnglish ? 'Admin reply' : 'Phản hồi';
  String get threadLabel => isEnglish ? 'Conversation' : 'Hội thoại';
  String get priorityLabel => isEnglish ? 'Priority' : 'Ưu tiên';
  String get createdLabel => isEnglish ? 'Created' : 'Tạo lúc';
  String get resolvedLabel => isEnglish ? 'Resolved' : 'Xử lý';
  String get closedLabel => isEnglish ? 'Closed' : 'Đóng';

  String messageAuthorLabel(String role, String? authorName) {
    final fallback = switch (role.trim().toLowerCase()) {
      'dealer' => isEnglish ? 'Dealer' : 'Đại lý',
      'admin' => 'Admin',
      _ => isEnglish ? 'System' : 'Hệ thống',
    };
    final resolvedName = authorName?.trim();
    if (resolvedName == null || resolvedName.isEmpty) {
      return fallback;
    }
    return '$fallback • $resolvedName';
  }

  String statusLabel(String status) {
    switch (status) {
      case 'RESOLVED':
        return isEnglish ? 'Resolved' : 'Đã xử lý';
      case 'IN_PROGRESS':
        return isEnglish ? 'In progress' : 'Đang xử lý';
      case 'CLOSED':
        return isEnglish ? 'Closed' : 'Đóng';
      case 'OPEN':
      default:
        return isEnglish ? 'Open' : 'Mở';
    }
  }
}
