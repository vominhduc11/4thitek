import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

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
    this.selectedTicketId,
    this.onSelectTicket,
    this.onReplyToTicket,
    required this.onLoadMore,
    this.onRetry,
  });

  final bool isEnglish;
  final List<DealerSupportTicketRecord> items;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final String? errorMessage;
  final int? selectedTicketId;
  final ValueChanged<DealerSupportTicketRecord>? onSelectTicket;
  final ValueChanged<DealerSupportTicketRecord>? onReplyToTicket;
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
                _HistoryCard(
                  item: item,
                  texts: texts,
                  isSelected: item.id == selectedTicketId,
                  onSelect: onSelectTicket == null
                      ? null
                      : () => onSelectTicket!(item),
                  onReply: onReplyToTicket == null
                      ? null
                      : () => onReplyToTicket!(item),
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
  const _HistoryCard({
    required this.item,
    required this.texts,
    required this.isSelected,
    this.onSelect,
    this.onReply,
  });

  final DealerSupportTicketRecord item;
  final _SupportHistoryTexts texts;
  final bool isSelected;
  final VoidCallback? onSelect;
  final VoidCallback? onReply;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onSelect,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isSelected
                  ? theme.colorScheme.primary
                  : theme.colorScheme.outlineVariant.withValues(alpha: 0.45),
            ),
            color: isSelected
                ? theme.colorScheme.primary.withValues(alpha: 0.08)
                : theme.colorScheme.surfaceContainerHighest.withValues(
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
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Text(
                    '${texts.ticketLabel}: ${item.ticketCode}',
                    style: theme.textTheme.bodySmall,
                  ),
                  if (isSelected)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(999),
                        color: theme.colorScheme.primary.withValues(
                          alpha: 0.14,
                        ),
                      ),
                      child: Text(
                        texts.activeLabel,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                item.message,
                style: theme.textTheme.bodyMedium?.copyWith(height: 1.45),
              ),
              if (item.contextData != null) ...[
                const SizedBox(height: 10),
                _ContextSummary(contextData: item.contextData!, texts: texts),
              ],
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
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _ThreadEntry(message: message, texts: texts),
                      ),
                    ),
              ],
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 6,
                children: [
                  _InfoPill(
                    label: texts.priorityLabel,
                    value: texts.priorityValue(item.priority),
                  ),
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
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 8,
                children: [
                  if (onSelect != null)
                    OutlinedButton.icon(
                      onPressed: onSelect,
                      icon: const Icon(Icons.visibility_outlined, size: 18),
                      label: Text(texts.viewDetailsLabel),
                    ),
                  if (onReply != null &&
                      item.status.trim().toLowerCase() != 'closed')
                    FilledButton.tonalIcon(
                      onPressed: onReply,
                      icon: const Icon(Icons.reply_outlined, size: 18),
                      label: Text(texts.replyThisTicketLabel),
                    ),
                ],
              ),
            ],
          ),
        ),
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

class _ThreadEntry extends StatelessWidget {
  const _ThreadEntry({required this.message, required this.texts});

  final SupportTicketMessageRecord message;
  final _SupportHistoryTexts texts;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isAdmin = message.authorRole.trim().toLowerCase() == 'admin';
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: isAdmin
            ? theme.colorScheme.primary.withValues(alpha: 0.08)
            : theme.colorScheme.surface,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            texts.messageAuthorLabel(message.authorRole, message.authorName),
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            message.message,
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.45),
          ),
          if (message.attachments.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: message.attachments
                  .map((attachment) => _AttachmentChip(attachment: attachment))
                  .toList(growable: false),
            ),
          ],
          const SizedBox(height: 6),
          Text(
            _formatDateTime(message.createdAt),
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
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

class _AttachmentChip extends StatelessWidget {
  const _AttachmentChip({required this.attachment});

  final SupportTicketAttachmentRecord attachment;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () async {
        final uri = Uri.tryParse(attachment.url);
        if (uri != null) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      },
      child: Container(
        constraints: const BoxConstraints(maxWidth: 220),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
          ),
          color: theme.colorScheme.surface,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.attach_file_outlined, size: 16),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                attachment.fileName ?? attachment.url,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.bodySmall,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContextSummary extends StatelessWidget {
  const _ContextSummary({required this.contextData, required this.texts});

  final SupportTicketContextRecord contextData;
  final _SupportHistoryTexts texts;

  @override
  Widget build(BuildContext context) {
    final entries = <String>[
      if (contextData.orderCode != null)
        '${texts.orderCodeLabel}: ${contextData.orderCode}',
      if (contextData.transactionCode != null)
        '${texts.transactionCodeLabel}: ${contextData.transactionCode}',
      if (contextData.paidAmount != null)
        '${texts.paidAmountLabel}: ${contextData.paidAmount}',
      if (contextData.paymentReference != null)
        '${texts.paymentReferenceLabel}: ${contextData.paymentReference}',
      if (contextData.serial != null)
        '${texts.serialLabel}: ${contextData.serial}',
      if (contextData.returnReason != null)
        '${texts.returnReasonLabel}: ${contextData.returnReason}',
    ];
    if (entries.isEmpty) {
      return const SizedBox.shrink();
    }
    final theme = Theme.of(context);
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: entries
          .map(
            (entry) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                color: theme.colorScheme.surface,
              ),
              child: Text(entry, style: theme.textTheme.bodySmall),
            ),
          )
          .toList(growable: false),
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
    switch (status.trim().toLowerCase()) {
      case 'resolved':
        background = const Color(0xFF163624);
        foreground = const Color(0xFF71E2A0);
        break;
      case 'in_progress':
        background = const Color(0xFF3A2C11);
        foreground = const Color(0xFFBDF919);
        break;
      case 'closed':
        background = scheme.surface;
        foreground = scheme.onSurfaceVariant;
        break;
      case 'open':
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
      ? 'Your recent support requests will appear here.'
      : 'Các yêu cầu hỗ trợ gần đây của bạn sẽ hiển thị ở đây.';
  String get errorTitle => isEnglish
      ? 'Could not load support history'
      : 'Không thể tải lịch sử hỗ trợ';
  String get retryLabel => isEnglish ? 'Retry' : 'Thử lại';
  String get threadLabel => isEnglish ? 'Conversation' : 'Trao đổi';
  String get ticketLabel => isEnglish ? 'Ticket' : 'Mã ticket';
  String get priorityLabel => isEnglish ? 'Priority' : 'Mức ưu tiên';
  String get createdLabel => isEnglish ? 'Created' : 'Tạo lúc';
  String get resolvedLabel => isEnglish ? 'Resolved' : 'Đã xử lý';
  String get closedLabel => isEnglish ? 'Closed' : 'Đã đóng';
  String get loadMoreLabel =>
      isEnglish ? 'Load more requests' : 'Xem thêm yêu cầu';
  String get loadingMoreLabel =>
      isEnglish ? 'Loading more...' : 'Đang tải thêm...';
  String get activeLabel => isEnglish ? 'Active' : 'Đang chọn';
  String get viewDetailsLabel => isEnglish ? 'View details' : 'Xem chi tiết';
  String get replyThisTicketLabel =>
      isEnglish ? 'Reply to this ticket' : 'Gửi bổ sung vào ticket này';
  String get orderCodeLabel => isEnglish ? 'Order code' : 'Mã đơn hàng';
  String get transactionCodeLabel =>
      isEnglish ? 'Transaction code' : 'Mã giao dịch';
  String get paidAmountLabel => isEnglish ? 'Paid amount' : 'Số tiền đã chuyển';
  String get paymentReferenceLabel =>
      isEnglish ? 'Payment reference' : 'Nội dung chuyển khoản';
  String get serialLabel => 'Serial';
  String get returnReasonLabel =>
      isEnglish ? 'Return reason' : 'Lý do trả hàng';

  String statusLabel(String status) {
    switch (status.trim().toLowerCase()) {
      case 'resolved':
        return isEnglish ? 'Resolved' : 'Đã xử lý';
      case 'in_progress':
        return isEnglish ? 'In progress' : 'Đang xử lý';
      case 'closed':
        return isEnglish ? 'Closed' : 'Đã đóng';
      case 'open':
      default:
        return isEnglish ? 'Open' : 'Đang mở';
    }
  }

  String priorityValue(String priority) {
    switch (priority.trim().toLowerCase()) {
      case 'urgent':
        return isEnglish ? 'Urgent' : 'Khẩn cấp';
      case 'high':
        return isEnglish ? 'High' : 'Cao';
      case 'normal':
      default:
        return isEnglish ? 'Normal' : 'Bình thường';
    }
  }

  String messageAuthorLabel(String authorRole, String? authorName) {
    switch (authorRole.trim().toLowerCase()) {
      case 'admin':
        return authorName?.trim().isNotEmpty == true
            ? authorName!.trim()
            : (isEnglish ? 'Admin support' : 'Hỗ trợ viên');
      case 'dealer':
        return authorName?.trim().isNotEmpty == true
            ? authorName!.trim()
            : (isEnglish ? 'You' : 'Bạn');
      default:
        return authorName?.trim().isNotEmpty == true
            ? authorName!.trim()
            : (isEnglish ? 'System' : 'Hệ thống');
    }
  }
}
