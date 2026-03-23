import 'package:flutter/material.dart';

import '../support_service.dart';

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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (errorMessage != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: Theme.of(
                context,
              ).colorScheme.errorContainer.withValues(alpha: 0.45),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  errorMessage!,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (onRetry != null) ...[
                  const SizedBox(height: 10),
                  OutlinedButton(
                    onPressed: onRetry,
                    child: Text(texts.retryLabel),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (isLoading && items.isEmpty)
          const Center(child: CircularProgressIndicator())
        else if (items.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
            ),
            child: Text(texts.emptyMessage),
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
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.45),
        ),
        color: Theme.of(
          context,
        ).colorScheme.surfaceContainerHighest.withValues(alpha: 0.45),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.subject,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              _StatusChip(status: item.status, texts: texts),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${texts.ticketLabel}: ${item.ticketCode}',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 6),
          Text(item.message),
          if (item.adminReply != null && item.adminReply!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              texts.adminReplyLabel,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(item.adminReply!),
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
        background = Colors.green.withValues(alpha: 0.16);
        foreground = Colors.green.shade700;
        break;
      case 'IN_PROGRESS':
        background = Colors.orange.withValues(alpha: 0.16);
        foreground = Colors.orange.shade800;
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

  String get emptyMessage =>
      isEnglish ? 'No support requests yet.' : 'Chưa có yêu cầu hỗ trợ nào.';
  String get loadMoreLabel => isEnglish ? 'Load more' : 'Xem thêm';
  String get retryLabel => isEnglish ? 'Retry' : 'Thử lại';
  String get ticketLabel => isEnglish ? 'Ticket' : 'Mã';
  String get adminReplyLabel => isEnglish ? 'Admin reply' : 'Phản hồi';
  String get priorityLabel => isEnglish ? 'Priority' : 'Ưu tiên';
  String get createdLabel => isEnglish ? 'Created' : 'Tạo lúc';
  String get resolvedLabel => isEnglish ? 'Resolved' : 'Xử lý';
  String get closedLabel => isEnglish ? 'Closed' : 'Đóng';

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
