part of 'support_screen.dart';

class _TicketHeadlineCard extends StatelessWidget {
  const _TicketHeadlineCard({
    required this.ticket,
    required this.texts,
    this.onReply,
  });

  final DealerSupportTicketRecord ticket;
  final _SupportTexts texts;
  final VoidCallback? onReply;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.45),
        ),
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
                      texts.replyActiveTicketAction,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: colors.primary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      ticket.subject,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '#${ticket.ticketCode}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              _CompactStatusBadge(
                label: texts.statusLabel(ticket.status),
                status: ticket.status,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _MetaPill(
                label: texts.prioritySummaryLabel,
                value: texts.priorityLabel(
                  _parsePriorityStatic(ticket.priority),
                ),
              ),
              _MetaPill(
                label: texts.createdLabel,
                value: _formatDateTime(ticket.createdAt),
              ),
              if (ticket.resolvedAt != null)
                _MetaPill(
                  label: texts.resolvedLabel,
                  value: _formatDateTime(ticket.resolvedAt!),
                ),
              if (ticket.closedAt != null)
                _MetaPill(
                  label: texts.closedLabel,
                  value: _formatDateTime(ticket.closedAt!),
                ),
            ],
          ),
          if (onReply != null) ...[
            const SizedBox(height: 14),
            Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton.icon(
                key: const ValueKey<String>('support-detail-followup-button'),
                onPressed: onReply,
                icon: const Icon(Icons.reply_outlined),
                label: Text(texts.replyThisTicketAction),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TicketContextPanel extends StatelessWidget {
  const _TicketContextPanel({required this.contextData, required this.texts});

  final SupportTicketContextRecord contextData;
  final _SupportTexts texts;

  @override
  Widget build(BuildContext context) {
    final entries = <String>[
      if (contextData.orderCode != null)
        '${texts.orderCodeFieldLabel}: ${contextData.orderCode}',
      if (contextData.transactionCode != null)
        '${texts.transactionCodeFieldLabel}: ${contextData.transactionCode}',
      if (contextData.paidAmount != null)
        '${texts.paidAmountFieldLabel}: ${contextData.paidAmount}',
      if (contextData.paymentReference != null)
        '${texts.paymentReferenceFieldLabel}: ${contextData.paymentReference}',
      if (contextData.serial != null)
        '${texts.serialFieldLabel}: ${contextData.serial}',
      if (contextData.returnReason != null)
        '${texts.returnReasonFieldLabel}: ${contextData.returnReason}',
    ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Theme.of(context).colorScheme.surfaceContainerLowest,
        border: Border.all(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.28),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            texts.contextSummaryTitle,
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: entries
                .map((entry) => _MetaPill(label: '', value: entry))
                .toList(growable: false),
          ),
        ],
      ),
    );
  }
}

class _LinkedReturnTicketCard extends StatelessWidget {
  const _LinkedReturnTicketCard({
    required this.contextData,
    required this.texts,
  });

  final SupportTicketContextRecord contextData;
  final _SupportTexts texts;

  @override
  Widget build(BuildContext context) {
    final returnRequestId = contextData.returnRequestId;
    if (returnRequestId == null || returnRequestId <= 0) {
      return const SizedBox.shrink();
    }
    final returnCode = contextData.returnRequestCode?.trim().isNotEmpty == true
        ? contextData.returnRequestCode!.trim()
        : '#$returnRequestId';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Theme.of(context).colorScheme.surfaceContainerLowest,
        border: Border.all(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.28),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            texts.linkedReturnCardTitle,
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _MetaPill(label: texts.returnCodeLabel, value: returnCode),
              if (contextData.returnStatus != null)
                _MetaPill(
                  label: texts.returnStatusLabel,
                  value: contextData.returnStatus!,
                ),
              if (contextData.orderCode != null)
                _MetaPill(
                  label: texts.orderCodeFieldLabel,
                  value: contextData.orderCode!,
                ),
            ],
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.pushDealerReturnDetail(returnRequestId),
            icon: const Icon(Icons.assignment_return_outlined),
            label: Text(texts.openLinkedReturnAction),
          ),
        ],
      ),
    );
  }
}

class _TicketThreadBubble extends StatelessWidget {
  const _TicketThreadBubble({
    required this.item,
    required this.texts,
    required this.onDownload,
  });

  final _TicketThreadItem item;
  final _SupportTexts texts;
  final Future<void> Function(
    SupportTicketAttachmentRecord attachment,
    SupportAttachmentAsset asset,
    _SupportTexts texts,
  )
  onDownload;

  @override
  Widget build(BuildContext context) {
    final isAdmin = item.authorRole.trim().toLowerCase() == 'admin';
    final colors = Theme.of(context).colorScheme;
    final roleLabel = texts.threadRoleLabel(
      item.authorRole,
      isRootMessage: item.isRootMessage,
    );
    return Align(
      alignment: isAdmin ? Alignment.centerLeft : Alignment.centerRight,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width >= 720 ? 540 : 360,
        ),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: isAdmin
                ? colors.surfaceContainerLow
                : colors.primary.withValues(alpha: 0.09),
            border: Border.all(
              color: isAdmin
                  ? colors.outlineVariant.withValues(alpha: 0.36)
                  : colors.primary.withValues(alpha: 0.22),
            ),
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
                          item.isRootMessage
                              ? texts.rootMessageLabel
                              : texts.threadAuthorLabel(
                                  item.authorRole,
                                  item.authorName,
                                ),
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: colors.onSurface,
                              ),
                        ),
                        const SizedBox(height: 4),
                        _MetaPill(label: '', value: roleLabel),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    _formatDateTime(item.createdAt),
                    textAlign: TextAlign.right,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                item.message,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(height: 1.55),
              ),
              if (item.attachments.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  texts.attachmentSectionLabel,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: colors.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: item.attachments
                      .map(
                        (attachment) => _ThreadAttachmentPreview(
                          attachment: attachment,
                          openLabel: texts.openAttachmentAction,
                          downloadLabel: texts.downloadAttachmentAction,
                          onDownload: (attachment, asset) =>
                              onDownload(attachment, asset, texts),
                        ),
                      )
                      .toList(growable: false),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ThreadAttachmentPreview extends StatelessWidget {
  const _ThreadAttachmentPreview({
    required this.attachment,
    this.openLabel,
    this.downloadLabel,
    this.onDownload,
  });

  final SupportTicketAttachmentRecord attachment;
  final String? openLabel;
  final String? downloadLabel;
  final Future<void> Function(
    SupportTicketAttachmentRecord attachment,
    SupportAttachmentAsset asset,
  )?
  onDownload;

  @override
  Widget build(BuildContext context) {
    return _AttachmentPreviewCard(
      attachment: attachment,
      openLabel: openLabel,
      downloadLabel: downloadLabel,
      onDownload: onDownload,
      previewHeight: 136,
      semanticLabel: 'Xem tệp đính kèm',
      thumbnailWidth: 220,
    );
  }
}
