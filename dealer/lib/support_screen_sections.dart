// ignore_for_file: invalid_use_of_protected_member

part of 'support_screen.dart';

extension _SupportScreenSections on _SupportScreenState {
  List<Widget> _buildContextFields(_SupportTexts texts) {
    final fields = <Widget>[];
    if (_category == SupportCategory.order ||
        _category == SupportCategory.payment ||
        _category == SupportCategory.returnOrder) {
      fields.add(
        TextField(
          controller: _contextOrderCodeController,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: texts.orderCodeFieldLabel,
            prefixIcon: const Icon(Icons.receipt_long_outlined),
          ),
        ),
      );
    }
    if (_category == SupportCategory.payment) {
      if (fields.isNotEmpty) {
        fields.add(const SizedBox(height: 14));
      }
      fields.add(
        TextField(
          controller: _contextTransactionCodeController,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: texts.transactionCodeFieldLabel,
            prefixIcon: const Icon(Icons.payments_outlined),
          ),
        ),
      );
      fields.add(const SizedBox(height: 14));
      fields.add(
        TextField(
          controller: _contextPaidAmountController,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: texts.paidAmountFieldLabel,
            prefixIcon: const Icon(Icons.attach_money_outlined),
          ),
        ),
      );
      fields.add(const SizedBox(height: 14));
      fields.add(
        TextField(
          controller: _contextPaymentReferenceController,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: texts.paymentReferenceFieldLabel,
            prefixIcon: const Icon(Icons.notes_outlined),
          ),
        ),
      );
    }
    if (_category == SupportCategory.warranty ||
        _category == SupportCategory.product) {
      if (fields.isNotEmpty) {
        fields.add(const SizedBox(height: 14));
      }
      fields.add(
        TextField(
          controller: _contextSerialController,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: texts.serialFieldLabel,
            prefixIcon: const Icon(Icons.qr_code_2_outlined),
          ),
        ),
      );
    }
    if (_category == SupportCategory.returnOrder) {
      if (fields.isNotEmpty) {
        fields.add(const SizedBox(height: 14));
      }
      fields.add(
        TextField(
          controller: _contextReturnReasonController,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: texts.returnReasonFieldLabel,
            prefixIcon: const Icon(Icons.assignment_return_outlined),
          ),
        ),
      );
    }
    return fields;
  }

  Widget _buildAttachmentComposer(_SupportTexts texts) {
    final attachments = _activeDraftAttachments();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: Theme.of(context).colorScheme.surfaceContainerLow,
            border: Border.all(
              color: Theme.of(
                context,
              ).colorScheme.outlineVariant.withValues(alpha: 0.45),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      texts.attachmentSectionLabel,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  OutlinedButton.icon(
                    onPressed:
                        _isSubmitting ||
                            _isUploadingAttachment ||
                            _isDeletingAttachment
                        ? null
                        : () => _handleAddAttachment(texts),
                    icon: _isUploadingAttachment
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2.2),
                          )
                        : const Icon(Icons.attach_file_outlined, size: 18),
                    label: Text(
                      _isUploadingAttachment
                          ? texts.uploadingAttachmentLabel
                          : texts.addAttachmentAction,
                    ),
                  ),
                ],
              ),
              if (_isUploadingAttachment &&
                  _attachmentUploadProgress != null) ...[
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    minHeight: 8,
                    value: (_attachmentUploadProgress! / 100)
                        .clamp(0.0, 1.0)
                        .toDouble(),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_attachmentUploadProgress!.toStringAsFixed(0)}%',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Text(
                texts.attachmentHelper,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              if (attachments.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: attachments
                      .map(
                        (attachment) => _DraftAttachmentPreview(
                          attachment: attachment,
                          openLabel: texts.openAttachmentAction,
                          downloadLabel: texts.downloadAttachmentAction,
                          onDownload: (attachment, asset) =>
                              _downloadAttachment(attachment, asset, texts),
                          onRemove:
                              _isSubmitting ||
                                  _isUploadingAttachment ||
                                  _isDeletingAttachment
                              ? null
                              : () => unawaited(
                                  _removeDraftAttachment(attachment),
                                ),
                        ),
                      )
                      .toList(growable: false),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTicketDetailSection(
    _SupportTexts texts,
    DealerSupportTicketRecord? ticket, {
    required bool dense,
  }) {
    if (ticket == null) {
      return SectionCard(
        dense: dense,
        title: texts.ticketDetailTitle,
        child: _TicketDetailEmptyState(
          title: texts.emptyDetailTitle,
          description: texts.emptyDetailDescription,
          ctaLabel: texts.startFirstTicketAction,
          onPressed: () => _openCreateComposer(shouldScroll: true),
        ),
      );
    }

    final threadItems = _buildThreadItems(ticket);
    return SectionCard(
      dense: dense,
      title: texts.ticketDetailTitle,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _TicketHeadlineCard(
            ticket: ticket,
            texts: texts,
            onReply: _isTicketClosed(ticket)
                ? null
                : () => _openFollowUpComposer(shouldScroll: true),
          ),
          if (ticket.contextData != null) ...[
            const SizedBox(height: 14),
            _TicketContextPanel(contextData: ticket.contextData!, texts: texts),
          ],
          if (ticket.contextData?.returnRequestId != null) ...[
            const SizedBox(height: 14),
            _LinkedReturnTicketCard(
              contextData: ticket.contextData!,
              texts: texts,
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Text(
                  texts.threadTitle,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              _MetaPill(
                label: '',
                value: texts.threadCountLabel(threadItems.length),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Column(
              children: threadItems
                  .map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _TicketThreadBubble(
                        item: item,
                        texts: texts,
                        onDownload: _downloadAttachment,
                      ),
                    ),
                  )
                  .toList(growable: false),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComposerSection(
    _SupportTexts texts,
    DealerSupportTicketRecord? selectedTicket, {
    required bool dense,
  }) {
    final isCreateMode = _interactionMode == SupportInteractionMode.creating;
    final contextFields = _buildContextFields(texts);
    final canReply = selectedTicket != null && !_isTicketClosed(selectedTicket);
    return SectionCard(
      dense: dense,
      title: isCreateMode ? texts.submitRequestTitle : texts.followUpModeTitle,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed:
                  _isSubmitting ||
                      _isUploadingAttachment ||
                      _isDeletingAttachment
                  ? null
                  : _setViewingMode,
              icon: const Icon(Icons.visibility_off_outlined, size: 18),
              label: Text(texts.hideAction),
            ),
          ),
          const SizedBox(height: 10),
          if (isCreateMode) ...[
            _ComposerBanner(
              icon: Icons.add_circle_outline,
              title: texts.newRequestModeTitle,
              description: texts.newRequestModeDescription,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<SupportCategory>(
              initialValue: _category,
              decoration: InputDecoration(
                labelText: texts.categoryFieldLabel,
                prefixIcon: const Icon(Icons.category_outlined),
              ),
              items: SupportCategory.values
                  .map(
                    (item) => DropdownMenuItem(
                      value: item,
                      child: Text(texts.categoryLabel(item)),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value == null) {
                  return;
                }
                setState(() => _category = value);
                _clearContextDraft();
              },
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<SupportPriority>(
              initialValue: _priority,
              decoration: InputDecoration(
                labelText: texts.priorityFieldLabel,
                prefixIcon: const Icon(Icons.flag_outlined),
              ),
              items: SupportPriority.values
                  .map(
                    (item) => DropdownMenuItem(
                      value: item,
                      child: Text(texts.priorityLabel(item)),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value == null) {
                  return;
                }
                setState(() => _priority = value);
              },
            ),
            if (contextFields.isNotEmpty) ...[
              const SizedBox(height: 16),
              _ContextFieldSection(
                title: texts.contextSectionTitle,
                description: texts.contextSectionDescription,
                children: contextFields,
              ),
            ],
            const SizedBox(height: 16),
            TextField(
              controller: _subjectController,
              textInputAction: TextInputAction.next,
              textCapitalization: TextCapitalization.sentences,
              maxLength: _subjectMax,
              buildCounter: _buildCounter,
              decoration: InputDecoration(
                labelText: texts.subjectFieldLabel,
                prefixIcon: const Icon(Icons.subject_outlined),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _createMessageController,
              keyboardType: TextInputType.multiline,
              textInputAction: TextInputAction.newline,
              textCapitalization: TextCapitalization.sentences,
              minLines: 5,
              maxLines: 9,
              maxLength: _messageMax,
              scrollPhysics: const NeverScrollableScrollPhysics(),
              buildCounter: _buildCounter,
              decoration: InputDecoration(
                labelText: texts.descriptionFieldLabel,
                hintText: texts.descriptionHint,
                helperText: texts.descriptionHelper,
                alignLabelWithHint: true,
                prefixIcon: const Icon(Icons.chat_bubble_outline),
              ),
            ),
            const SizedBox(height: 12),
            _buildAttachmentComposer(texts),
            const SizedBox(height: 12),
            Text(
              texts.expectedResponseTime(texts.slaText(_priority)),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                key: const ValueKey<String>('support-submit-button'),
                onPressed: _isSubmitting ? null : () => _handleSubmit(texts),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2.5),
                      )
                    : Text(texts.submitRequestAction),
              ),
            ),
          ] else ...[
            _ComposerBanner(
              icon: Icons.reply_outlined,
              title: texts.followUpModeTitle,
              description: selectedTicket == null
                  ? texts.followUpModeUnavailable
                  : texts.followUpTargetLabel(
                      selectedTicket.ticketCode,
                      selectedTicket.subject,
                    ),
            ),
            const SizedBox(height: 16),
            if (!canReply)
              _TicketReplyBlockedCard(
                title: selectedTicket == null
                    ? texts.followUpModeUnavailableTitle
                    : texts.closedTicketReplyTitle,
                message: selectedTicket == null
                    ? texts.selectTicketToReplyMessage
                    : texts.closedTicketReplyMessage,
              )
            else ...[
              _SelectedReplyTargetCard(texts: texts, ticket: selectedTicket),
              const SizedBox(height: 14),
              TextField(
                controller: _followUpMessageController,
                keyboardType: TextInputType.multiline,
                textInputAction: TextInputAction.newline,
                textCapitalization: TextCapitalization.sentences,
                minLines: 4,
                maxLines: 8,
                maxLength: _messageMax,
                scrollPhysics: const NeverScrollableScrollPhysics(),
                buildCounter: _buildCounter,
                onChanged: (_) => _persistFollowUpDraftForSelectedTicket(),
                decoration: InputDecoration(
                  labelText: texts.followUpFieldLabel,
                  hintText: texts.followUpHint,
                  helperText: texts.followUpHelper,
                  alignLabelWithHint: true,
                  prefixIcon: const Icon(Icons.reply_outlined),
                ),
              ),
              const SizedBox(height: 12),
              _buildAttachmentComposer(texts),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed:
                      _isSubmitting ||
                          _isUploadingAttachment ||
                          _isDeletingAttachment
                      ? null
                      : () => _handleFollowUp(texts),
                  icon: const Icon(Icons.send_outlined),
                  label: Text(texts.followUpAction),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  List<_TicketThreadItem> _buildThreadItems(DealerSupportTicketRecord ticket) {
    final thread = <_TicketThreadItem>[];
    final rootMessage = ticket.message.trim();
    final hasRootMessage = ticket.messages.any(
      (message) =>
          !message.internalNote &&
          message.authorRole.trim().toLowerCase() == 'dealer' &&
          message.message.trim() == rootMessage,
    );
    if (rootMessage.isNotEmpty && !hasRootMessage) {
      thread.add(
        _TicketThreadItem(
          authorRole: 'dealer',
          authorName: null,
          message: rootMessage,
          createdAt: ticket.createdAt,
          attachments: const <SupportTicketAttachmentRecord>[],
          isRootMessage: true,
        ),
      );
    }
    for (final message in ticket.messages) {
      if (message.internalNote) {
        continue;
      }
      thread.add(
        _TicketThreadItem(
          authorRole: message.authorRole,
          authorName: message.authorName,
          message: message.message,
          createdAt: message.createdAt,
          attachments: message.attachments,
        ),
      );
    }
    return thread;
  }
}
