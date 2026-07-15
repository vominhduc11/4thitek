// ignore_for_file: invalid_use_of_protected_member

part of 'support_screen.dart';

extension _SupportScreenActions on _SupportScreenState {
  void _copyToClipboard(String value, {String? message}) {
    Clipboard.setData(ClipboardData(text: value));
    final texts = _SupportTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    _showSnackBar(message ?? texts.copiedValueMessage(value));
  }

  Future<void> _launchHotline(String phone, _SupportTexts texts) async {
    final normalizedPhone = phone.replaceAll(RegExp(r'\s+'), '');
    final uri = Uri(scheme: 'tel', path: normalizedPhone);
    if (await launchUrl(uri)) {
      return;
    }
    _copyToClipboard(phone, message: texts.cannotOpenDialerMessage);
  }

  Future<void> _launchSupportEmail(String email, _SupportTexts texts) async {
    final uri = Uri(scheme: 'mailto', path: email);
    if (await launchUrl(uri)) {
      return;
    }
    _copyToClipboard(email, message: texts.cannotOpenEmailAppMessage);
  }

  Future<bool?> _confirmSubmit(_SupportTexts texts) {
    final subject = _subjectController.text.trim();
    final category = texts.categoryLabel(_category);
    final priority = texts.priorityLabel(_priority);
    return showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return RepaintBoundary(
          child: AlertDialog(
            scrollable: true,
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 20,
            ),
            title: Text(texts.confirmSubmitTitle),
            content: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(texts.confirmSubmitDescription),
                  const SizedBox(height: 10),
                  Text('${texts.subjectFieldLabel}: $subject'),
                  const SizedBox(height: 4),
                  Text('${texts.categorySummaryLabel}: $category'),
                  const SizedBox(height: 4),
                  Text('${texts.prioritySummaryLabel}: $priority'),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: Text(texts.cancelAction),
              ),
              FilledButton(
                key: const ValueKey<String>('support-confirm-submit-button'),
                onPressed: () => Navigator.of(dialogContext).pop(true),
                child: Text(texts.submitRequestAction),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _handleSubmit(_SupportTexts texts) async {
    final subject = _subjectController.text.trim();
    final message = _createMessageController.text.trim();

    if (subject.isEmpty || message.isEmpty) {
      _showSnackBar(texts.missingFieldsMessage);
      return;
    }
    if (subject.length < _subjectMin) {
      _showSnackBar(texts.subjectTooShortMessage(_subjectMin));
      return;
    }
    if (message.length < _messageMin) {
      _showSnackBar(texts.messageTooShortMessage(_messageMin));
      return;
    }

    final shouldSubmit = await _confirmSubmit(texts);
    if (shouldSubmit != true) {
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final ticket = await _supportService.submitTicket(
        category: _toRemoteCategory(_category),
        priority: _toRemotePriority(_priority),
        subject: subject,
        message: message,
        contextData: _buildContextData(),
        attachments: List<SupportTicketAttachmentRecord>.from(
          _createDraftAttachments,
        ),
      );
      _applyTicket(ticket);
      _loadTicketHistory();
      _showSnackBar(texts.requestSubmittedMessage(ticket.ticketCode));
      _subjectController.clear();
      _createMessageController.clear();
      _clearContextDraft();
      _clearCreateDraftAttachments();
      _setViewingMode();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToTicketCard();
      });
    } on SupportException catch (error) {
      _showSnackBar(
        resolveSupportServiceMessage(error.message, isEnglish: texts.isEnglish),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _handleFollowUp(_SupportTexts texts) async {
    final ticket = _selectedTicketForReply;
    final message = _followUpMessageController.text.trim();
    if (ticket == null) {
      _showSnackBar(texts.latestTicketLoadWarning);
      return;
    }
    if (message.isEmpty) {
      _showSnackBar(texts.messageOnlyRequiredMessage);
      return;
    }
    if (message.length < _messageMin) {
      _showSnackBar(texts.messageTooShortMessage(_messageMin));
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final updatedTicket = await _supportService.submitTicketMessage(
        ticketId: ticket.id,
        message: message,
        attachments: List<SupportTicketAttachmentRecord>.from(
          _followUpAttachmentsByTicketId[ticket.id] ??
              const <SupportTicketAttachmentRecord>[],
        ),
      );
      _applyTicket(updatedTicket);
      _loadTicketHistory();
      _followUpMessageController.clear();
      _followUpDraftsByTicketId.remove(ticket.id);
      _clearFollowUpDraftAttachments(ticket.id);
      _showSnackBar(texts.followUpSubmittedMessage(updatedTicket.ticketCode));
      _setViewingMode();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToTicketCard();
      });
    } on SupportException catch (error) {
      _showSnackBar(
        resolveSupportServiceMessage(error.message, isEnglish: texts.isEnglish),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  String _toRemoteCategory(SupportCategory category) {
    switch (category) {
      case SupportCategory.order:
        return 'order';
      case SupportCategory.warranty:
        return 'warranty';
      case SupportCategory.product:
        return 'product';
      case SupportCategory.payment:
        return 'payment';
      case SupportCategory.returnOrder:
        return 'returnOrder';
      case SupportCategory.other:
        return 'other';
    }
  }

  String _toRemotePriority(SupportPriority priority) {
    switch (priority) {
      case SupportPriority.normal:
        return 'NORMAL';
      case SupportPriority.high:
        return 'HIGH';
      case SupportPriority.urgent:
        return 'URGENT';
    }
  }

  SupportPriority _parsePriority(String? raw) {
    switch ((raw ?? '').trim().toLowerCase()) {
      case 'high':
        return SupportPriority.high;
      case 'urgent':
        return SupportPriority.urgent;
      case 'normal':
      default:
        return SupportPriority.normal;
    }
  }

  SupportTicketContextRecord? _buildContextData() {
    final paidAmount = num.tryParse(_contextPaidAmountController.text.trim());
    final contextData = SupportTicketContextRecord(
      orderCode: _contextOrderCodeController.text.trim(),
      transactionCode: _contextTransactionCodeController.text.trim(),
      paidAmount: paidAmount,
      paymentReference: _contextPaymentReferenceController.text.trim(),
      serial: _contextSerialController.text.trim(),
      returnReason: _contextReturnReasonController.text.trim(),
    );
    return contextData.isEmpty ? null : contextData;
  }

  void _clearContextDraft() {
    _contextOrderCodeController.clear();
    _contextTransactionCodeController.clear();
    _contextPaidAmountController.clear();
    _contextPaymentReferenceController.clear();
    _contextSerialController.clear();
    _contextReturnReasonController.clear();
  }

  void _clearCreateDraftAttachments() {
    if (!mounted) {
      return;
    }
    setState(() => _createDraftAttachments.clear());
  }

  void _clearFollowUpDraftAttachments(int ticketId) {
    if (!mounted) {
      return;
    }
    setState(() {
      _followUpAttachmentsByTicketId.remove(ticketId);
    });
  }

  Future<void> _cleanupPendingAttachments() async {
    final attachments = <SupportTicketAttachmentRecord>[
      ..._createDraftAttachments,
      ..._followUpAttachmentsByTicketId.values.expand((items) => items),
    ];
    if (attachments.isEmpty) {
      return;
    }
    final uploadService = _createUploadService();
    try {
      for (final attachment in attachments) {
        try {
          final mediaAssetId = attachment.id;
          if (mediaAssetId != null && mediaAssetId > 0) {
            await uploadService.deleteMediaAsset(mediaAssetId);
          } else {
            await uploadService.deleteUrl(attachment.url);
          }
        } catch (_) {
          // Best-effort cleanup on exit.
        }
      }
    } finally {
      uploadService.close();
    }
  }

  Widget _buildCounter(
    BuildContext context, {
    required int currentLength,
    required bool isFocused,
    int? maxLength,
  }) {
    if (maxLength == null) {
      return const SizedBox.shrink();
    }
    final color = isFocused
        ? Theme.of(context).colorScheme.primary
        : Theme.of(context).colorScheme.onSurfaceVariant;
    final style = Theme.of(context).textTheme.bodySmall?.copyWith(color: color);

    return Text('$currentLength / $maxLength', style: style);
  }

  void _showSnackBar(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _downloadAttachment(
    SupportTicketAttachmentRecord attachment,
    SupportAttachmentAsset asset,
    _SupportTexts texts,
  ) async {
    try {
      final savedPath = await saveSupportAttachmentAssetToDevice(
        asset: asset,
        preferredFileName: attachment.fileName,
        sourceUrl: attachment.accessUrl ?? attachment.url,
      );
      if (!mounted || savedPath == null) {
        return;
      }
      _showSnackBar(
        texts.attachmentDownloadedMessage(
          attachment.fileName ?? attachment.url,
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      _showSnackBar(texts.attachmentDownloadFailedMessage(error));
    }
  }
}
