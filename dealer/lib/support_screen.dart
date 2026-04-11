import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_settings_controller.dart';
import 'business_profile.dart';
import 'breakpoints.dart';
import 'notification_controller.dart';
import 'support_service.dart';
import 'upload_service.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';
import 'widgets/support_ticket_history.dart';

enum SupportCategory { order, warranty, product, payment, returnOrder, other }

enum SupportPriority { normal, high, urgent }

enum SupportComposerMode { create, followUp }

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key, this.supportService});

  final SupportService? supportService;

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _subjectController = TextEditingController();
  final _createMessageController = TextEditingController();
  final _followUpMessageController = TextEditingController();
  final _scrollController = ScrollController();
  final _ticketSummaryKey = GlobalKey();
  final _detailSectionKey = GlobalKey();
  final _composerSectionKey = GlobalKey();
  late final SupportService _supportService;

  SupportCategory _category = SupportCategory.order;
  SupportPriority _priority = SupportPriority.normal;
  int? _lastTicketNumericId;
  String? _lastTicketId;
  DateTime? _lastSubmittedAt;
  SupportCategory? _lastCategory;
  SupportPriority? _lastPriority;
  String? _lastStatus;
  String? _lastAdminUpdate;
  String? _latestTicketLoadErrorMessage;
  String? _ticketHistoryLoadErrorMessage;
  final List<DealerSupportTicketRecord> _ticketHistory = [];
  DealerSupportTicketRecord? _selectedTicketForReply;
  final _contextOrderCodeController = TextEditingController();
  final _contextTransactionCodeController = TextEditingController();
  final _contextPaidAmountController = TextEditingController();
  final _contextPaymentReferenceController = TextEditingController();
  final _contextSerialController = TextEditingController();
  final _contextReturnReasonController = TextEditingController();
  final List<SupportTicketAttachmentRecord> _createDraftAttachments = [];
  final Map<int, String> _followUpDraftsByTicketId = <int, String>{};
  final Map<int, List<SupportTicketAttachmentRecord>>
  _followUpAttachmentsByTicketId = <int, List<SupportTicketAttachmentRecord>>{};
  int _ticketPage = 0;
  bool _isHistoryLoading = false;
  bool _isLoadingMoreTickets = false;
  bool _hasMoreTickets = true;
  bool _isSubmitting = false;
  bool _isUploadingAttachment = false;
  int _handledSupportEventVersion = 0;
  SupportComposerMode _composerMode = SupportComposerMode.create;

  static const _hotline = BusinessProfile.contactPhone;
  static const _supportEmail = BusinessProfile.contactEmail;
  static const _subjectMax = 80;
  static const _messageMax = 1000;
  static const _subjectMin = 5;
  static const _messageMin = 20;

  @override
  void initState() {
    super.initState();
    _supportService = widget.supportService ?? SupportService();
    _loadLatestTicket();
    _loadTicketHistory();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final notificationController = NotificationScope.of(context);
    final version = notificationController.incomingSupportEventVersion;
    if (version != _handledSupportEventVersion) {
      _handledSupportEventVersion = version;
      _loadLatestTicket();
      _loadTicketHistory();
    }
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _createMessageController.dispose();
    _followUpMessageController.dispose();
    _contextOrderCodeController.dispose();
    _contextTransactionCodeController.dispose();
    _contextPaidAmountController.dispose();
    _contextPaymentReferenceController.dispose();
    _contextSerialController.dispose();
    _contextReturnReasonController.dispose();
    _scrollController.dispose();
    _cleanupPendingAttachments();
    _supportService.close();
    super.dispose();
  }

  Future<void> _loadLatestTicket() async {
    try {
      final ticket = await _supportService.fetchLatestTicket();
      if (!mounted) {
        return;
      }
      if (ticket == null) {
        setState(() => _latestTicketLoadErrorMessage = null);
        return;
      }
      setState(() => _latestTicketLoadErrorMessage = null);
      _applyTicket(ticket);
    } on SupportException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _latestTicketLoadErrorMessage = resolveSupportServiceMessage(
          error.message,
          isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
        );
      });
    }
  }

  void _applyTicket(DealerSupportTicketRecord ticket) {
    setState(() {
      _lastTicketNumericId = ticket.id;
      _lastTicketId = ticket.ticketCode;
      _lastSubmittedAt = ticket.createdAt;
      _lastCategory = _parseCategory(ticket.category);
      _lastPriority = _parsePriority(ticket.priority);
      _lastStatus = ticket.status;
      _lastAdminUpdate = _resolveLatestPublicAdminMessage(ticket);
      _selectedTicketForReply = _resolveSelectedTicket(ticket.id) ?? ticket;
      if (_composerMode == SupportComposerMode.followUp) {
        _followUpMessageController.text =
            _followUpDraftsByTicketId[ticket.id] ?? '';
      }
    });
  }

  Future<void> _loadTicketHistory({bool loadMore = false}) async {
    if (loadMore) {
      if (_isLoadingMoreTickets || !_hasMoreTickets) {
        return;
      }
      setState(() => _isLoadingMoreTickets = true);
    } else {
      setState(() => _isHistoryLoading = true);
    }

    try {
      final pageToLoad = loadMore ? _ticketPage + 1 : 0;
      final response = await _supportService.fetchTicketsPage(
        page: pageToLoad,
        size: 6,
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _ticketHistoryLoadErrorMessage = null;
        final previousSelectedId = _selectedTicketForReply?.id;
        if (!loadMore) {
          _ticketHistory
            ..clear()
            ..addAll(response.items);
        } else {
          _ticketHistory.addAll(response.items);
        }
        _ticketPage = response.page;
        _hasMoreTickets = response.page + 1 < response.totalPages;
        _selectedTicketForReply =
            _resolveSelectedTicket(previousSelectedId) ??
            _resolveSelectedTicket(_lastTicketNumericId) ??
            (_ticketHistory.isNotEmpty ? _ticketHistory.first : null);
        if (_composerMode == SupportComposerMode.followUp &&
            _selectedTicketForReply != null) {
          _followUpMessageController.text =
              _followUpDraftsByTicketId[_selectedTicketForReply!.id] ?? '';
        }
      });
    } on SupportException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _ticketHistoryLoadErrorMessage = resolveSupportServiceMessage(
          error.message,
          isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
        );
      });
    } finally {
      if (mounted) {
        setState(() {
          _isHistoryLoading = false;
          _isLoadingMoreTickets = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final appSettings = AppSettingsScope.of(context);
    final texts = _SupportTexts(
      isEnglish: appSettings.locale.languageCode == 'en',
    );
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isTablet = AppBreakpoints.isTablet(context);
    final isWideLayout = screenWidth >= 1080;
    final contentMaxWidth = isWideLayout
        ? 1180.0
        : isTablet
        ? 860.0
        : double.infinity;
    final selectedTicket = _selectedTicketForReply;

    final summarySection = RepaintBoundary(
      key: _ticketSummaryKey,
      child: FadeSlideIn(
        child: _SupportHeroSection(
          texts: texts,
          ticketCode: _lastTicketId,
          latestStatus: _lastStatus,
          latestAdminUpdate: _lastAdminUpdate,
          submittedAt: _lastSubmittedAt,
          categoryLabel: _lastCategory == null
              ? null
              : texts.categoryLabel(_lastCategory!),
          priorityLabel: _lastPriority == null
              ? null
              : texts.priorityLabel(_lastPriority!),
          slaLabel: texts.slaText(_lastPriority ?? _priority),
          hasLatestError: _latestTicketLoadErrorMessage != null,
          onRetryLatest: _loadLatestTicket,
          onCreateTicket: () =>
              _setComposerMode(SupportComposerMode.create, shouldScroll: true),
          onOpenReply: selectedTicket == null || _isTicketClosed(selectedTicket)
              ? null
              : () => _setComposerMode(
                  SupportComposerMode.followUp,
                  shouldScroll: true,
                ),
          onCallHotline: () => _launchHotline(_hotline, texts),
          onSendEmail: () => _launchSupportEmail(_supportEmail, texts),
          onCopyHotline: () =>
              _copyToClipboard(_hotline, message: texts.hotlineCopiedMessage),
          onCopyEmail: () => _copyToClipboard(
            _supportEmail,
            message: texts.supportEmailCopiedMessage,
          ),
        ),
      ),
    );

    final historySection = RepaintBoundary(
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 70),
        child: SectionCard(
          title: texts.ticketInboxTitle,
          child: SupportTicketHistory(
            isEnglish: texts.isEnglish,
            items: _ticketHistory,
            isLoading: _isHistoryLoading,
            isLoadingMore: _isLoadingMoreTickets,
            hasMore: _hasMoreTickets,
            selectedTicketId: selectedTicket?.id,
            onSelectTicket: _handleTicketSelected,
            onReplyToTicket: (ticket) =>
                _handleTicketSelected(ticket, switchToFollowUp: true),
            errorMessage: _ticketHistoryLoadErrorMessage == null
                ? null
                : texts.historyLoadWarning,
            onLoadMore: () => _loadTicketHistory(loadMore: true),
            onRetry: _loadTicketHistory,
            onCreateTicket: () => _setComposerMode(
              SupportComposerMode.create,
              shouldScroll: true,
            ),
          ),
        ),
      ),
    );

    final detailSection = RepaintBoundary(
      key: _detailSectionKey,
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 110),
        child: _buildTicketDetailSection(texts, selectedTicket),
      ),
    );

    final composerSection = RepaintBoundary(
      key: _composerSectionKey,
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 150),
        child: _buildComposerSection(texts, selectedTicket),
      ),
    );

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: BrandAppBarTitle(texts.screenTitle),
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: RefreshIndicator(
            onRefresh: _handleRefresh,
            child: ListView(
              key: const ValueKey<String>('support-scroll-view'),
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              children: isWideLayout
                  ? [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 5,
                            child: Column(
                              children: [
                                summarySection,
                                const SizedBox(height: 14),
                                historySection,
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            flex: 7,
                            child: Column(
                              children: [
                                detailSection,
                                const SizedBox(height: 14),
                                composerSection,
                                const SizedBox(height: 14),
                                _SupportGuideCard(texts: texts),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ]
                  : [
                      summarySection,
                      const SizedBox(height: 14),
                      historySection,
                      const SizedBox(height: 14),
                      detailSection,
                      const SizedBox(height: 14),
                      composerSection,
                      const SizedBox(height: 14),
                      _SupportGuideCard(texts: texts),
                    ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _scrollToTicketCard() async {
    if (!mounted) {
      return;
    }
    final targetContext = _ticketSummaryKey.currentContext;
    if (targetContext != null) {
      await Scrollable.ensureVisible(
        targetContext,
        duration: const Duration(milliseconds: 360),
        curve: Curves.easeOut,
      );
      return;
    }
    if (_scrollController.hasClients) {
      await _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 360),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _handleRefresh() async {
    await Future.wait<void>([_loadLatestTicket(), _loadTicketHistory()]);
  }

  Future<void> _scrollToComposeSection() async {
    if (!mounted) {
      return;
    }
    final targetContext = _composerSectionKey.currentContext;
    if (targetContext != null) {
      await Scrollable.ensureVisible(
        targetContext,
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOut,
      );
      return;
    }
    if (_scrollController.hasClients) {
      await _scrollController.animateTo(
        _scrollController.position.maxScrollExtent * 0.4,
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOut,
      );
    }
  }

  DealerSupportTicketRecord? _resolveSelectedTicket(int? ticketId) {
    if (ticketId == null) {
      return null;
    }
    for (final ticket in _ticketHistory) {
      if (ticket.id == ticketId) {
        return ticket;
      }
    }
    return null;
  }

  String? _resolveLatestPublicAdminMessage(DealerSupportTicketRecord ticket) {
    for (final message in ticket.messages.reversed) {
      if (!message.internalNote &&
          message.authorRole.trim().toLowerCase() == 'admin') {
        final normalized = message.message.trim();
        if (normalized.isNotEmpty) {
          return normalized;
        }
      }
    }
    return null;
  }

  void _handleTicketSelected(
    DealerSupportTicketRecord ticket, {
    bool switchToFollowUp = false,
  }) {
    _persistFollowUpDraftForSelectedTicket();
    setState(() {
      _selectedTicketForReply = ticket;
      if (switchToFollowUp && !_isTicketClosed(ticket)) {
        _composerMode = SupportComposerMode.followUp;
      }
      _followUpMessageController.text =
          _followUpDraftsByTicketId[ticket.id] ?? '';
    });
    if (switchToFollowUp) {
      final texts = _SupportTexts(
        isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
      );
      _showSnackBar(texts.replyTargetChangedMessage(ticket.ticketCode));
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToComposeSection();
      });
    }
  }

  void _setComposerMode(SupportComposerMode mode, {bool shouldScroll = false}) {
    _persistFollowUpDraftForSelectedTicket();
    if (mode == SupportComposerMode.followUp &&
        (_selectedTicketForReply == null ||
            _isTicketClosed(_selectedTicketForReply!))) {
      return;
    }
    setState(() {
      _composerMode = mode;
      if (mode == SupportComposerMode.followUp &&
          _selectedTicketForReply != null) {
        _followUpMessageController.text =
            _followUpDraftsByTicketId[_selectedTicketForReply!.id] ?? '';
      }
    });
    if (shouldScroll) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToComposeSection();
      });
    }
  }

  bool _isTicketClosed(DealerSupportTicketRecord ticket) =>
      ticket.status.trim().toLowerCase() == 'closed';

  void _persistFollowUpDraftForSelectedTicket() {
    final ticketId = _selectedTicketForReply?.id;
    if (ticketId == null) {
      return;
    }
    _followUpDraftsByTicketId[ticketId] = _followUpMessageController.text;
  }

  List<SupportTicketAttachmentRecord> _activeDraftAttachments() {
    if (_composerMode == SupportComposerMode.create) {
      return _createDraftAttachments;
    }
    final ticketId = _selectedTicketForReply?.id;
    if (ticketId == null) {
      return <SupportTicketAttachmentRecord>[];
    }
    return _followUpAttachmentsByTicketId.putIfAbsent(
      ticketId,
      () => <SupportTicketAttachmentRecord>[],
    );
  }

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
                    onPressed: _isSubmitting || _isUploadingAttachment
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
                        (attachment) => _DraftAttachmentChip(
                          attachment: attachment,
                          onRemove: _isSubmitting
                              ? null
                              : () => _removeDraftAttachment(attachment),
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
    DealerSupportTicketRecord? ticket,
  ) {
    if (ticket == null) {
      return SectionCard(
        title: texts.ticketDetailTitle,
        child: _TicketDetailEmptyState(
          title: texts.emptyDetailTitle,
          description: texts.emptyDetailDescription,
          ctaLabel: texts.startFirstTicketAction,
          onPressed: () =>
              _setComposerMode(SupportComposerMode.create, shouldScroll: true),
        ),
      );
    }

    final threadItems = _buildThreadItems(ticket);
    return SectionCard(
      title: texts.ticketDetailTitle,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _TicketHeadlineCard(
            ticket: ticket,
            texts: texts,
            onReply: _isTicketClosed(ticket)
                ? null
                : () => _setComposerMode(
                    SupportComposerMode.followUp,
                    shouldScroll: true,
                  ),
          ),
          if (ticket.contextData != null) ...[
            const SizedBox(height: 14),
            _TicketContextPanel(contextData: ticket.contextData!, texts: texts),
          ],
          const SizedBox(height: 16),
          Text(
            texts.threadTitle,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          ...threadItems.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _TicketThreadBubble(item: item, texts: texts),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComposerSection(
    _SupportTexts texts,
    DealerSupportTicketRecord? selectedTicket,
  ) {
    final isCreateMode = _composerMode == SupportComposerMode.create;
    final contextFields = _buildContextFields(texts);
    final canReply = selectedTicket != null && !_isTicketClosed(selectedTicket);
    return SectionCard(
      title: texts.composerTitle,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _ComposerModeSwitcher(
            texts: texts,
            mode: _composerMode,
            canReply: canReply,
            onModeSelected: _setComposerMode,
          ),
          const SizedBox(height: 16),
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
                message: selectedTicket == null
                    ? texts.selectTicketToReplyMessage
                    : texts.closedTicketReplyMessage,
              )
            else ...[
              TextField(
                controller: _followUpMessageController,
                keyboardType: TextInputType.multiline,
                textInputAction: TextInputAction.newline,
                textCapitalization: TextCapitalization.sentences,
                minLines: 4,
                maxLines: 8,
                maxLength: _messageMax,
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
                child: OutlinedButton.icon(
                  onPressed: _isSubmitting || _isUploadingAttachment
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

  Future<void> _handleAddAttachment(_SupportTexts texts) async {
    if (_composerMode == SupportComposerMode.followUp &&
        _selectedTicketForReply == null) {
      _showSnackBar(texts.selectTicketToReplyMessage);
      return;
    }
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked == null || !mounted) {
      return;
    }
    setState(() => _isUploadingAttachment = true);
    final uploadService = UploadService();
    try {
      final uploaded = await uploadService.uploadXFile(
        file: picked,
        category: 'support-tickets',
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _activeDraftAttachments().add(
          SupportTicketAttachmentRecord(
            url: uploaded.url,
            fileName: uploaded.fileName,
          ),
        );
      });
      _showSnackBar(texts.attachmentAddedMessage(picked.name));
    } catch (error) {
      _showSnackBar(texts.attachmentUploadFailed(error));
    } finally {
      uploadService.close();
      if (mounted) {
        setState(() => _isUploadingAttachment = false);
      }
    }
  }

  Future<void> _removeDraftAttachment(
    SupportTicketAttachmentRecord attachment,
  ) async {
    setState(() {
      _activeDraftAttachments().removeWhere(
        (item) => item.url == attachment.url,
      );
    });
    final uploadService = UploadService();
    try {
      await uploadService.deleteUrl(attachment.url);
    } catch (_) {
      // Keep the UI responsive even if cleanup fails.
    } finally {
      uploadService.close();
    }
  }

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
      _setComposerMode(SupportComposerMode.followUp);
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

  SupportCategory _parseCategory(String? raw) {
    switch ((raw ?? '').trim().toLowerCase()) {
      case 'order':
        return SupportCategory.order;
      case 'warranty':
        return SupportCategory.warranty;
      case 'product':
        return SupportCategory.product;
      case 'payment':
        return SupportCategory.payment;
      case 'return':
      case 'returnorder':
      case 'return_order':
      case 'return-order':
        return SupportCategory.returnOrder;
      case 'other':
      default:
        return SupportCategory.other;
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
    final pendingAttachments = <SupportTicketAttachmentRecord>[
      ..._createDraftAttachments,
      for (final attachments in _followUpAttachmentsByTicketId.values)
        ...attachments,
    ];
    if (pendingAttachments.isEmpty) {
      return;
    }
    final uploadService = UploadService();
    for (final attachment in List<SupportTicketAttachmentRecord>.from(
      pendingAttachments,
    )) {
      try {
        await uploadService.deleteUrl(attachment.url);
      } catch (_) {
        // Best-effort cleanup only.
      }
    }
    uploadService.close();
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
}

class _SupportTexts {
  const _SupportTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Support' : 'Hỗ trợ';
  String get quickContactTitle => isEnglish ? 'Quick contact' : 'Liên hệ nhanh';
  String get hotlineLabel => 'Hotline';
  String get emailLabel => 'Email';
  String get copyAction => isEnglish ? 'Copy' : 'Sao chép';
  String get hotlineCopiedMessage =>
      isEnglish ? 'Hotline number copied.' : 'Đã sao chép số hotline.';
  String get supportEmailCopiedMessage =>
      isEnglish ? 'Support email copied.' : 'Đã sao chép email hỗ trợ.';
  String copiedValueMessage(String value) =>
      isEnglish ? 'Copied $value' : 'Đã sao chép $value';
  String get callHotlineAction => isEnglish ? 'Call hotline' : 'Gọi hotline';
  String get sendEmailAction => isEnglish ? 'Send email' : 'Gửi email';
  String get supportHours => isEnglish
      ? 'Support hours: 8:00-18:00 (Mon-Sat)'
      : 'Thời gian hỗ trợ: 8:00-18:00 (T2-T7)';
  String get faqTitle =>
      isEnglish ? 'Frequently asked questions' : 'Câu hỏi thường gặp';
  String get recentRequestsTitle =>
      isEnglish ? 'Recent requests' : 'Yêu cầu gần đây';
  String get submitRequestTitle =>
      isEnglish ? 'Submit support request' : 'Gửi yêu cầu hỗ trợ';
  String get categoryFieldLabel =>
      isEnglish ? 'Request category' : 'Loại yêu cầu';
  String get categorySummaryLabel => isEnglish ? 'Category' : 'Loại yêu cầu';
  String get priorityFieldLabel => isEnglish ? 'Priority' : 'Mức độ ưu tiên';
  String get prioritySummaryLabel => isEnglish ? 'Priority' : 'Ưu tiên';
  String get subjectFieldLabel => isEnglish ? 'Subject' : 'Tiêu đề';
  String get descriptionFieldLabel => isEnglish ? 'Description' : 'Nội dung';
  String get descriptionHint => isEnglish
      ? 'Describe your issue, event time, and order/serial code if available.'
      : 'Mô tả vấn đề, thời điểm xảy ra, mã đơn/serial nếu có.';
  String get descriptionHelper => isEnglish
      ? 'The more details you share, the faster support can help.'
      : 'Thông tin càng chi tiết, đội hỗ trợ xử lý càng nhanh.';
  String expectedResponseTime(String sla) => isEnglish
      ? 'Expected response time: $sla'
      : 'Thời gian phản hồi dự kiến: $sla';
  String get submitRequestAction =>
      isEnglish ? 'Submit request' : 'Gửi yêu cầu';
  String get followUpAction => isEnglish
      ? 'Send follow-up to selected ticket'
      : 'Gửi bổ sung vào ticket gần nhất';
  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get cannotOpenDialerMessage => isEnglish
      ? 'Cannot open dialer. Number has been copied.'
      : 'Không mở được cuộc gọi. Đã sao chép số.';
  String get cannotOpenEmailAppMessage => isEnglish
      ? 'Cannot open email app. Address has been copied.'
      : 'Không mở được ứng dụng email. Đã sao chép địa chỉ.';
  String get confirmSubmitTitle =>
      isEnglish ? 'Confirm request' : 'Xác nhận gửi yêu cầu';
  String get confirmSubmitDescription => isEnglish
      ? 'Please review the request details before submitting.'
      : 'Vui lòng kiểm tra thông tin yêu cầu trước khi gửi.';
  String get latestTicketLoadWarning => isEnglish
      ? 'Unable to load the latest support status right now.'
      : 'Chưa thể tải trạng thái hỗ trợ mới nhất lúc này.';
  String get historyLoadWarning => isEnglish
      ? 'Unable to load support request history right now.'
      : 'Chưa thể tải lịch sử yêu cầu hỗ trợ lúc này.';
  String get statusSyncWarningTitle =>
      isEnglish ? 'Support status' : 'Trạng thái hỗ trợ';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get missingFieldsMessage => isEnglish
      ? 'Please enter both subject and description.'
      : 'Vui lòng nhập tiêu đề và nội dung.';
  String get messageOnlyRequiredMessage => isEnglish
      ? 'Please enter the follow-up message.'
      : 'Vui lòng nhập nội dung bổ sung.';
  String requestSubmittedMessage(String ticketCode) => isEnglish
      ? 'Request #$ticketCode has been submitted.'
      : 'Yêu cầu #$ticketCode đã được gửi.';
  String followUpSubmittedMessage(String ticketCode) => isEnglish
      ? 'Follow-up sent to ticket #$ticketCode.'
      : 'Đã gửi nội dung bổ sung vào ticket #$ticketCode.';
  String get requestSubmittedTitle =>
      isEnglish ? 'Request submitted' : 'Yêu cầu đã gửi';
  String get hideAction => isEnglish ? 'Hide' : 'Ẩn';
  String get ticketIdLabel => isEnglish ? 'Ticket ID' : 'Mã yêu cầu';
  String get submittedAtLabel => isEnglish ? 'Submitted at' : 'Thời gian gửi';
  String get responseSlaLabel => isEnglish ? 'Response SLA' : 'SLA phản hồi';
  String get statusSummaryLabel => isEnglish ? 'Status' : 'Trạng thái';
  String get adminReplyLabel =>
      isEnglish ? 'Latest admin update' : 'Cập nhật mới nhất từ admin';

  String categoryLabel(SupportCategory category) {
    switch (category) {
      case SupportCategory.order:
        return isEnglish ? 'Order' : 'Đơn hàng';
      case SupportCategory.warranty:
        return isEnglish ? 'Warranty / Serial' : 'Bao hanh / Serial';
      case SupportCategory.product:
        return isEnglish ? 'Product' : 'Sản phẩm';
      case SupportCategory.payment:
        return isEnglish ? 'Payment' : 'Thanh toán';
      case SupportCategory.returnOrder:
        return isEnglish ? 'Return' : 'Đổi trả hàng';
      case SupportCategory.other:
        return isEnglish ? 'Other' : 'Khác';
    }
  }

  String priorityLabel(SupportPriority priority) {
    switch (priority) {
      case SupportPriority.normal:
        return isEnglish ? 'Normal' : 'Bình thường';
      case SupportPriority.high:
        return isEnglish ? 'High' : 'Cao';
      case SupportPriority.urgent:
        return isEnglish ? 'Urgent' : 'Khẩn cấp';
    }
  }

  String slaText(SupportPriority priority) {
    switch (priority) {
      case SupportPriority.normal:
        return isEnglish ? '4-8 business hours' : '4-8 giờ làm việc';
      case SupportPriority.high:
        return isEnglish ? '2-4 business hours' : '2-4 giờ làm việc';
      case SupportPriority.urgent:
        return isEnglish ? '30-60 minutes' : '30-60 phút';
    }
  }

  String statusLabel(String status) {
    switch (status.trim().toLowerCase()) {
      case 'open':
        return isEnglish ? 'Open' : 'Mở';
      case 'in_progress':
        return isEnglish ? 'In progress' : 'Đang xử lý';
      case 'resolved':
        return isEnglish ? 'Resolved' : 'Đã xử lý';
      case 'closed':
        return isEnglish ? 'Closed' : 'Đóng';
      default:
        return status;
    }
  }

  List<_FaqItem> get faqItems => isEnglish
      ? const [
          _FaqItem(
            title: 'Cannot sign in',
            body:
                'Check your email, password, and internet connection before retrying.',
            icon: Icons.lock_outline,
          ),
          _FaqItem(
            title: 'Order status not updated',
            body:
                'The system may take 3-5 minutes to sync recent status changes.',
            icon: Icons.receipt_long_outlined,
          ),
          _FaqItem(
            title: 'Serial handling',
            body:
                'Prepare serial/IMEI and customer phone number for faster support.',
            icon: Icons.verified_outlined,
          ),
          _FaqItem(
            title: 'Payment reconciliation delay',
            body:
                'Bank transfer reconciliation can be delayed during peak periods.',
            icon: Icons.account_balance_wallet_outlined,
          ),
          _FaqItem(
            title: 'Warranty activation issue',
            body:
                'Verify purchase date and serial format before submitting warranty.',
            icon: Icons.shield_outlined,
          ),
        ]
      : const [
          _FaqItem(
            title: 'Không đăng nhập được',
            body:
                'Kiểm tra email, mật khẩu và đảm bảo thiết bị có kết nối mạng.',
            icon: Icons.lock_outline,
          ),
          _FaqItem(
            title: 'Đơn hàng chưa cập nhật',
            body:
                'Hệ thống có thể cần 3-5 phút để đồng bộ trạng thái đơn hàng.',
            icon: Icons.receipt_long_outlined,
          ),
          _FaqItem(
            title: 'Xử lý serial',
            body: 'Chuẩn bị serial/IMEI và số điện thoại để xử lý nhanh hơn.',
            icon: Icons.verified_outlined,
          ),
          _FaqItem(
            title: 'Đối soát thanh toán chậm',
            body:
                'Đối soát chuyển khoản có thể chậm hơn vào khung giờ cao điểm.',
            icon: Icons.account_balance_wallet_outlined,
          ),
          _FaqItem(
            title: 'Lỗi kích hoạt bảo hành',
            body:
                'Kiểm tra ngày mua và định dạng serial trước khi gửi yêu cầu.',
            icon: Icons.shield_outlined,
          ),
        ];
}

extension _SupportTextsValidationMessages on _SupportTexts {
  String subjectTooShortMessage(int minLength) => isEnglish
      ? 'Subject must be at least $minLength characters.'
      : 'Tiêu đề phải có ít nhất $minLength ký tự.';

  String messageTooShortMessage(int minLength) => isEnglish
      ? 'Description must be at least $minLength characters.'
      : 'Nội dung phải có ít nhất $minLength ký tự.';
}

extension _SupportTextsSupportExtras on _SupportTexts {
  String get supportCenterTitle =>
      isEnglish ? 'Dealer support center' : 'Trung tâm hỗ trợ đại lý';
  String get supportCenterDescription => isEnglish
      ? 'Track every support request in one place, review updates, and send follow-ups to the correct ticket.'
      : 'Theo dõi toàn bộ yêu cầu hỗ trợ tại một nơi, xem cập nhật mới nhất và gửi bổ sung đúng ticket cần xử lý.';
  String get statusSummaryTitle =>
      isEnglish ? 'Support status summary' : 'Tóm tắt trạng thái hỗ trợ';
  String statusSummarySubtitle(String ticketCode) => isEnglish
      ? 'Latest active ticket: #$ticketCode'
      : 'Ticket gần nhất đang theo dõi: #$ticketCode';
  String get noActiveTicketSummary => isEnglish
      ? 'No active ticket yet. Create a new request whenever you need support.'
      : 'Hiện chưa có ticket đang theo dõi. Bạn có thể tạo yêu cầu mới bất cứ lúc nào.';
  String get supportHoursLabel =>
      isEnglish ? 'Support hours' : 'Khung giờ hỗ trợ';
  String get startNewTicketAction =>
      isEnglish ? 'Create new ticket' : 'Tạo ticket mới';
  String get replyActiveTicketAction =>
      isEnglish ? 'Reply active ticket' : 'Phản hồi ticket đang chọn';
  String get ticketInboxTitle =>
      isEnglish ? 'Ticket inbox' : 'Danh sách ticket';
  String get ticketDetailTitle =>
      isEnglish ? 'Ticket detail' : 'Chi tiết ticket';
  String get emptyDetailTitle => isEnglish
      ? 'Choose a ticket to view the full thread'
      : 'Chọn một ticket để xem đầy đủ trao đổi';
  String get emptyDetailDescription => isEnglish
      ? 'Once you select a ticket, you will see its status, context, and conversation timeline here.'
      : 'Khi chọn một ticket, bạn sẽ xem được trạng thái, thông tin liên quan và toàn bộ diễn tiến trao đổi tại đây.';
  String get startFirstTicketAction =>
      isEnglish ? 'Create your first ticket' : 'Tạo ticket đầu tiên';
  String get threadTitle =>
      isEnglish ? 'Conversation thread' : 'Luồng trao đổi';
  String get rootMessageLabel =>
      isEnglish ? 'Original request' : 'Yêu cầu ban đầu';
  String threadAuthorLabel(String authorRole, String? authorName) {
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

  String get composerTitle =>
      isEnglish ? 'Create or follow up' : 'Tạo mới hoặc phản hồi';
  String get createModeLabel => isEnglish ? 'New request' : 'Yêu cầu mới';
  String get followUpModeLabel => isEnglish ? 'Follow-up' : 'Phản hồi ticket';
  String get newRequestModeTitle =>
      isEnglish ? 'Create a new support ticket' : 'Tạo ticket hỗ trợ mới';
  String get newRequestModeDescription => isEnglish
      ? 'Use this form for a brand-new issue. Your request will appear in the ticket inbox right after submission.'
      : 'Dùng biểu mẫu này khi bạn cần mở một yêu cầu mới. Ticket sẽ xuất hiện ngay trong danh sách sau khi gửi.';
  String get followUpModeTitle =>
      isEnglish ? 'Reply to the selected ticket' : 'Phản hồi ticket đang chọn';
  String get followUpModeUnavailable => isEnglish
      ? 'Select an active ticket from the list above to send more details.'
      : 'Hãy chọn một ticket đang mở ở phía trên để gửi thêm thông tin.';
  String get selectTicketToReplyMessage => isEnglish
      ? 'Please choose a ticket before sending a follow-up.'
      : 'Vui lòng chọn ticket trước khi gửi bổ sung.';
  String get closedTicketReplyMessage => isEnglish
      ? 'This ticket is already closed. Create a new ticket if you still need assistance.'
      : 'Ticket này đã đóng. Hãy tạo ticket mới nếu bạn vẫn cần hỗ trợ.';
  String get followUpFieldLabel =>
      isEnglish ? 'Follow-up message' : 'Nội dung bổ sung';
  String get followUpHint => isEnglish
      ? 'Share the latest update, evidence, or any extra details for this ticket.'
      : 'Mô tả cập nhật mới nhất, bổ sung bằng chứng hoặc thông tin cần làm rõ cho ticket này.';
  String get followUpHelper => isEnglish
      ? 'Your message will be added to the conversation thread of the selected ticket.'
      : 'Nội dung này sẽ được thêm vào luồng trao đổi của ticket đang chọn.';
  String get contextSectionTitle =>
      isEnglish ? 'Related information' : 'Thông tin liên quan';
  String get contextSectionDescription => isEnglish
      ? 'Add the order code, payment reference, serial, or return reason so support can handle the ticket faster.'
      : 'Bổ sung mã đơn, giao dịch, serial hoặc lý do trả hàng để đội hỗ trợ xử lý nhanh hơn.';
  String get contextSummaryTitle =>
      isEnglish ? 'Ticket context' : 'Thông tin liên quan';
  String get createdLabel => isEnglish ? 'Created' : 'Tạo lúc';
  String get resolvedLabel => isEnglish ? 'Resolved' : 'Đã xử lý';
  String get closedLabel => isEnglish ? 'Closed' : 'Đã đóng';
  String get quickTipsTitle =>
      isEnglish ? 'Quick tips before sending' : 'Gợi ý trước khi gửi';
  String get quickTipOneTitle => isEnglish
      ? 'Use the correct order or serial'
      : 'Chuẩn bị đúng mã đơn hoặc serial';
  String get quickTipOneBody => isEnglish
      ? 'Adding the right order code or serial helps support verify the issue much faster.'
      : 'Thêm đúng mã đơn hoặc serial giúp đội hỗ trợ xác minh vấn đề nhanh hơn.';
  String get quickTipTwoTitle =>
      isEnglish ? 'Attach evidence when possible' : 'Đính kèm hình ảnh nếu có';
  String get quickTipTwoBody => isEnglish
      ? 'Screenshots, payment proof, or serial labels usually shorten the processing time.'
      : 'Ảnh chụp màn hình, chứng từ chuyển khoản hoặc tem serial thường giúp rút ngắn thời gian xử lý.';
  String get quickTipThreeTitle => isEnglish
      ? 'Reply inside the same ticket'
      : 'Bổ sung ngay trong ticket cũ';
  String get quickTipThreeBody => isEnglish
      ? 'When support asks for more information, reply in the same ticket so the thread stays complete.'
      : 'Khi cần bổ sung thông tin, hãy phản hồi ngay trong ticket cũ để luồng trao đổi luôn đầy đủ.';
  String get replyThisTicketAction =>
      isEnglish ? 'Reply to this ticket' : 'Phản hồi ticket này';
  String followUpTargetLabel(String ticketCode, String subject) => isEnglish
      ? 'Reply target: #$ticketCode - $subject'
      : 'Đang phản hồi ticket #$ticketCode - $subject';

  String replyTargetChangedMessage(String ticketCode) => isEnglish
      ? 'Reply target changed to ticket #$ticketCode.'
      : 'Đã chuyển sang phản hồi ticket #$ticketCode.';

  String get orderCodeFieldLabel => isEnglish ? 'Order code' : 'Ma don hang';
  String get transactionCodeFieldLabel =>
      isEnglish ? 'Transaction code' : 'Ma giao dich';
  String get paidAmountFieldLabel =>
      isEnglish ? 'Paid amount' : 'So tien da chuyen';
  String get paymentReferenceFieldLabel =>
      isEnglish ? 'Payment reference' : 'Noi dung chuyen khoan';
  String get serialFieldLabel => 'Serial';
  String get returnReasonFieldLabel =>
      isEnglish ? 'Return reason' : 'Ly do tra hang';
  String get attachmentSectionLabel =>
      isEnglish ? 'Evidence / attachments' : 'Hình ảnh / chứng từ';
  String get addAttachmentAction =>
      isEnglish ? 'Add attachment' : 'Thêm tệp đính kèm';
  String get uploadingAttachmentLabel =>
      isEnglish ? 'Uploading...' : 'Đang tải...';
  String get attachmentHelper => isEnglish
      ? 'Attach screenshots or proof images to help support verify the issue faster.'
      : 'Đính kèm ảnh chụp màn hình hoặc chứng từ để đội hỗ trợ kiểm tra nhanh hơn.';
  String attachmentAddedMessage(String fileName) =>
      isEnglish ? 'Attached $fileName.' : 'Đã đính kèm $fileName.';
  String attachmentUploadFailed(Object error) =>
      uploadServiceErrorMessage(error, isEnglish: isEnglish);
}

class _TicketThreadItem {
  const _TicketThreadItem({
    required this.authorRole,
    required this.authorName,
    required this.message,
    required this.createdAt,
    required this.attachments,
    this.isRootMessage = false,
  });

  final String authorRole;
  final String? authorName;
  final String message;
  final DateTime createdAt;
  final List<SupportTicketAttachmentRecord> attachments;
  final bool isRootMessage;
}

class _SupportHeroSection extends StatelessWidget {
  const _SupportHeroSection({
    required this.texts,
    required this.ticketCode,
    required this.latestStatus,
    required this.latestAdminUpdate,
    required this.submittedAt,
    required this.categoryLabel,
    required this.priorityLabel,
    required this.slaLabel,
    required this.hasLatestError,
    required this.onRetryLatest,
    required this.onCreateTicket,
    required this.onCallHotline,
    required this.onSendEmail,
    required this.onCopyHotline,
    required this.onCopyEmail,
    this.onOpenReply,
  });

  final _SupportTexts texts;
  final String? ticketCode;
  final String? latestStatus;
  final String? latestAdminUpdate;
  final DateTime? submittedAt;
  final String? categoryLabel;
  final String? priorityLabel;
  final String slaLabel;
  final bool hasLatestError;
  final Future<void> Function() onRetryLatest;
  final VoidCallback onCreateTicket;
  final VoidCallback? onOpenReply;
  final VoidCallback onCallHotline;
  final VoidCallback onSendEmail;
  final VoidCallback onCopyHotline;
  final VoidCallback onCopyEmail;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final hasTicket = ticketCode != null && submittedAt != null;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: <Color>[
            colors.primary.withValues(alpha: 0.14),
            colors.surfaceContainerHigh,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.48),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              texts.supportCenterTitle,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              texts.supportCenterDescription,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colors.surface.withValues(alpha: 0.82),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: colors.outlineVariant.withValues(alpha: 0.42),
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
                              texts.statusSummaryTitle,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              hasTicket
                                  ? texts.statusSummarySubtitle(ticketCode!)
                                  : texts.noActiveTicketSummary,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (hasTicket && latestStatus != null)
                        _CompactStatusBadge(
                          label: texts.statusLabel(latestStatus!),
                          status: latestStatus!,
                        ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (hasTicket) ...[
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        _MetaPill(
                          label: texts.ticketIdLabel,
                          value: ticketCode!,
                        ),
                        _MetaPill(
                          label: texts.responseSlaLabel,
                          value: slaLabel,
                        ),
                        if (categoryLabel != null)
                          _MetaPill(
                            label: texts.categorySummaryLabel,
                            value: categoryLabel!,
                          ),
                        if (priorityLabel != null)
                          _MetaPill(
                            label: texts.prioritySummaryLabel,
                            value: priorityLabel!,
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '${texts.submittedAtLabel}: ${_formatDateTime(submittedAt!)}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                    if (latestAdminUpdate != null) ...[
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: colors.surfaceContainerLow,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              texts.adminReplyLabel,
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: colors.onSurfaceVariant,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              latestAdminUpdate!,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                height: 1.45,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ] else
                    Text(
                      texts.emptyDetailDescription,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                  if (hasLatestError) ...[
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: onRetryLatest,
                      icon: const Icon(Icons.refresh_rounded),
                      label: Text(texts.retryAction),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _QuickContactAction(
                  icon: Icons.phone_in_talk_outlined,
                  title: texts.hotlineLabel,
                  value: BusinessProfile.contactPhone,
                  primaryAction: texts.callHotlineAction,
                  secondaryAction: texts.copyAction,
                  onPrimaryTap: onCallHotline,
                  onSecondaryTap: onCopyHotline,
                ),
                _QuickContactAction(
                  icon: Icons.alternate_email_outlined,
                  title: texts.emailLabel,
                  value: BusinessProfile.contactEmail,
                  primaryAction: texts.sendEmailAction,
                  secondaryAction: texts.copyAction,
                  onPrimaryTap: onSendEmail,
                  onSecondaryTap: onCopyEmail,
                ),
                _QuickContactAction(
                  icon: Icons.schedule_outlined,
                  title: texts.supportHoursLabel,
                  value: texts.supportHours,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onCreateTicket,
                    icon: const Icon(Icons.add_circle_outline),
                    label: Text(texts.startNewTicketAction),
                  ),
                ),
                if (onOpenReply != null) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onOpenReply,
                      icon: const Icon(Icons.reply_outlined),
                      label: Text(texts.replyActiveTicketAction),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SupportGuideCard extends StatelessWidget {
  const _SupportGuideCard({required this.texts});

  final _SupportTexts texts;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: texts.quickTipsTitle,
      child: Column(
        children: [
          _FaqTile(
            item: _FaqItem(
              title: texts.quickTipOneTitle,
              body: texts.quickTipOneBody,
              icon: Icons.confirmation_number_outlined,
            ),
            showDivider: true,
          ),
          _FaqTile(
            item: _FaqItem(
              title: texts.quickTipTwoTitle,
              body: texts.quickTipTwoBody,
              icon: Icons.verified_outlined,
            ),
            showDivider: true,
          ),
          _FaqTile(
            item: _FaqItem(
              title: texts.quickTipThreeTitle,
              body: texts.quickTipThreeBody,
              icon: Icons.support_agent_outlined,
            ),
            showDivider: false,
          ),
        ],
      ),
    );
  }
}

class _TicketDetailEmptyState extends StatelessWidget {
  const _TicketDetailEmptyState({
    required this.title,
    required this.description,
    required this.ctaLabel,
    required this.onPressed,
  });

  final String title;
  final String description;
  final String ctaLabel;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          FilledButton.icon(
            onPressed: onPressed,
            icon: const Icon(Icons.add_circle_outline),
            label: Text(ctaLabel),
          ),
        ],
      ),
    );
  }
}

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
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Theme.of(context).colorScheme.surfaceContainerLowest,
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

class _TicketThreadBubble extends StatelessWidget {
  const _TicketThreadBubble({required this.item, required this.texts});

  final _TicketThreadItem item;
  final _SupportTexts texts;

  @override
  Widget build(BuildContext context) {
    final isAdmin = item.authorRole.trim().toLowerCase() == 'admin';
    final colors = Theme.of(context).colorScheme;
    return Align(
      alignment: isAdmin ? Alignment.centerLeft : Alignment.centerRight,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 540),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: isAdmin
                ? colors.surfaceContainerLow
                : colors.primary.withValues(alpha: 0.1),
            border: Border.all(
              color: isAdmin
                  ? colors.outlineVariant.withValues(alpha: 0.36)
                  : colors.primary.withValues(alpha: 0.22),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.isRootMessage
                    ? texts.rootMessageLabel
                    : texts.threadAuthorLabel(item.authorRole, item.authorName),
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: colors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                item.message,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(height: 1.48),
              ),
              if (item.attachments.isNotEmpty) ...[
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: item.attachments
                      .map(
                        (attachment) =>
                            _ThreadAttachmentCard(attachment: attachment),
                      )
                      .toList(growable: false),
                ),
              ],
              const SizedBox(height: 8),
              Text(
                _formatDateTime(item.createdAt),
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ThreadAttachmentCard extends StatelessWidget {
  const _ThreadAttachmentCard({required this.attachment});

  final SupportTicketAttachmentRecord attachment;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () async {
        final uri = Uri.tryParse(attachment.url);
        if (uri != null) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      },
      child: Container(
        constraints: const BoxConstraints(maxWidth: 220),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: Theme.of(context).colorScheme.surface,
          border: Border.all(
            color: Theme.of(
              context,
            ).colorScheme.outlineVariant.withValues(alpha: 0.45),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.attach_file_outlined, size: 18),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                attachment.fileName ?? attachment.url,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ComposerModeSwitcher extends StatelessWidget {
  const _ComposerModeSwitcher({
    required this.texts,
    required this.mode,
    required this.canReply,
    required this.onModeSelected,
  });

  final _SupportTexts texts;
  final SupportComposerMode mode;
  final bool canReply;
  final void Function(SupportComposerMode mode, {bool shouldScroll})
  onModeSelected;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Expanded(
            child: _ModeChoiceButton(
              label: texts.createModeLabel,
              selected: mode == SupportComposerMode.create,
              onTap: () => onModeSelected(
                SupportComposerMode.create,
                shouldScroll: false,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _ModeChoiceButton(
              label: texts.followUpModeLabel,
              selected: mode == SupportComposerMode.followUp,
              enabled: canReply,
              onTap: canReply
                  ? () => onModeSelected(
                      SupportComposerMode.followUp,
                      shouldScroll: false,
                    )
                  : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeChoiceButton extends StatelessWidget {
  const _ModeChoiceButton({
    required this.label,
    required this.selected,
    this.enabled = true,
    this.onTap,
  });

  final String label;
  final bool selected;
  final bool enabled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Material(
      color: selected
          ? colors.primary.withValues(alpha: 0.12)
          : Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: enabled ? onTap : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Center(
            child: Text(
              label,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w800,
                color: enabled
                    ? (selected ? colors.primary : colors.onSurface)
                    : colors.onSurfaceVariant,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ComposerBanner extends StatelessWidget {
  const _ComposerBanner({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: colors.primaryContainer,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: colors.onPrimaryContainer),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ContextFieldSection extends StatelessWidget {
  const _ContextFieldSection({
    required this.title,
    required this.description,
    required this.children,
  });

  final String title;
  final String description;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Theme.of(context).colorScheme.surfaceContainerLow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            description,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }
}

class _TicketReplyBlockedCard extends StatelessWidget {
  const _TicketReplyBlockedCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Theme.of(context).colorScheme.surfaceContainerLow,
      ),
      child: Text(
        message,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.45),
      ),
    );
  }
}

class _DraftAttachmentChip extends StatelessWidget {
  const _DraftAttachmentChip({required this.attachment, this.onRemove});

  final SupportTicketAttachmentRecord attachment;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 240),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: Theme.of(context).colorScheme.surface,
        border: Border.all(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.45),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.attach_file_outlined, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              attachment.fileName ?? attachment.url,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (onRemove != null) ...[
            const SizedBox(width: 8),
            InkWell(
              borderRadius: BorderRadius.circular(999),
              onTap: onRemove,
              child: const Padding(
                padding: EdgeInsets.all(2),
                child: Icon(Icons.close_rounded, size: 18),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final display = label.isEmpty ? value : '$label: $value';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: Theme.of(context).colorScheme.surface,
      ),
      child: Text(display, style: Theme.of(context).textTheme.bodySmall),
    );
  }
}

class _CompactStatusBadge extends StatelessWidget {
  const _CompactStatusBadge({required this.label, required this.status});

  final String label;
  final String status;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
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
        background = colorScheme.surface;
        foreground = colorScheme.onSurfaceVariant;
        break;
      default:
        background = colorScheme.primary.withValues(alpha: 0.14);
        foreground = colorScheme.primary;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelLarge?.copyWith(
          color: foreground,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _QuickContactAction extends StatelessWidget {
  const _QuickContactAction({
    required this.icon,
    required this.title,
    required this.value,
    this.primaryAction,
    this.secondaryAction,
    this.onPrimaryTap,
    this.onSecondaryTap,
  });

  final IconData icon;
  final String title;
  final String value;
  final String? primaryAction;
  final String? secondaryAction;
  final VoidCallback? onPrimaryTap;
  final VoidCallback? onSecondaryTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 220, maxWidth: 320),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: colors.surface.withValues(alpha: 0.82),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: colors.outlineVariant.withValues(alpha: 0.42),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: colors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              value,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            if (onPrimaryTap != null || onSecondaryTap != null) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (onPrimaryTap != null && primaryAction != null)
                    FilledButton.tonal(
                      onPressed: onPrimaryTap,
                      child: Text(primaryAction!),
                    ),
                  if (onSecondaryTap != null && secondaryAction != null)
                    OutlinedButton(
                      onPressed: onSecondaryTap,
                      child: Text(secondaryAction!),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

SupportPriority _parsePriorityStatic(String raw) {
  switch (raw.trim().toLowerCase()) {
    case 'urgent':
      return SupportPriority.urgent;
    case 'high':
      return SupportPriority.high;
    default:
      return SupportPriority.normal;
  }
}

String _formatDateTime(DateTime value) {
  final day = value.day.toString().padLeft(2, '0');
  final month = value.month.toString().padLeft(2, '0');
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '$day/$month/${value.year} $hour:$minute';
}

class _FaqItem {
  const _FaqItem({required this.title, required this.body, required this.icon});

  final String title;
  final String body;
  final IconData icon;
}

class _FaqTile extends StatelessWidget {
  const _FaqTile({required this.item, required this.showDivider});

  final _FaqItem item;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: colors.secondaryContainer.withValues(alpha: 0.72),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(item.icon, color: colors.onSecondaryContainer),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.body,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (showDivider) const Divider(height: 0),
      ],
    );
  }
}
