import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_settings_controller.dart';
import 'business_profile.dart';
import 'breakpoints.dart';
import 'notification_controller.dart';
import 'support_service.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';
import 'widgets/support_ticket_history.dart';

enum SupportCategory { order, warranty, product, payment, returnOrder, other }

enum SupportPriority { normal, high, urgent }

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key, this.supportService});

  final SupportService? supportService;

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _ticketCardKey = GlobalKey();
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
  int _ticketPage = 0;
  bool _isHistoryLoading = false;
  bool _isLoadingMoreTickets = false;
  bool _hasMoreTickets = true;
  bool _isSubmitting = false;
  int _handledSupportEventVersion = 0;

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
    _messageController.dispose();
    _scrollController.dispose();
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
        if (!loadMore) {
          _ticketHistory
            ..clear()
            ..addAll(response.items);
        } else {
          _ticketHistory.addAll(response.items);
        }
        _ticketPage = response.page;
        _hasMoreTickets = response.page + 1 < response.totalPages;
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
    final faqItems = texts.faqItems;

    final quickContactSection = RepaintBoundary(
      child: FadeSlideIn(
        child: SectionCard(
          title: texts.quickContactTitle,
          child: Column(
            children: [
              _ContactTile(
                icon: Icons.phone_outlined,
                label: texts.hotlineLabel,
                value: _hotline,
                copyTooltip: texts.copyAction,
                onCopy: () => _copyToClipboard(
                  _hotline,
                  message: texts.hotlineCopiedMessage,
                ),
              ),
              const Divider(height: 0),
              _ContactTile(
                icon: Icons.mail_outline,
                label: texts.emailLabel,
                value: _supportEmail,
                copyTooltip: texts.copyAction,
                onCopy: () => _copyToClipboard(
                  _supportEmail,
                  message: texts.supportEmailCopiedMessage,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 8,
                children: [
                  OutlinedButton.icon(
                    onPressed: () => _launchHotline(_hotline, texts),
                    icon: const Icon(Icons.phone_in_talk_outlined),
                    label: Text(texts.callHotlineAction),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _launchSupportEmail(_supportEmail, texts),
                    icon: const Icon(Icons.alternate_email_outlined),
                    label: Text(texts.sendEmailAction),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  texts.supportHours,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    final faqSection = RepaintBoundary(
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 60),
        child: SectionCard(
          title: texts.faqTitle,
          child: Column(
            children: [
              for (var i = 0; i < faqItems.length; i++)
                _FaqTile(
                  item: faqItems[i],
                  showDivider: i != faqItems.length - 1,
                ),
            ],
          ),
        ),
      ),
    );

    final statusSection = _lastTicketId != null && _lastSubmittedAt != null
        ? RepaintBoundary(
            child: FadeSlideIn(
              key: _ticketCardKey,
              delay: const Duration(milliseconds: 90),
              child: _StatusCard(
                ticketId: _lastTicketId!,
                submittedAt: _lastSubmittedAt!,
                category: texts.categoryLabel(_lastCategory ?? _category),
                priority: texts.priorityLabel(_lastPriority ?? _priority),
                sla: texts.slaText(_lastPriority ?? _priority),
                status: _lastStatus,
                latestAdminUpdate: _lastAdminUpdate,
                texts: texts,
                onClear: () {
                  setState(() {
                    _lastTicketId = null;
                    _lastTicketNumericId = null;
                    _lastSubmittedAt = null;
                    _lastCategory = null;
                    _lastPriority = null;
                    _lastStatus = null;
                    _lastAdminUpdate = null;
                  });
                },
              ),
            ),
          )
        : null;

    final latestWarningSection =
        _latestTicketLoadErrorMessage != null &&
            (_lastTicketId == null || _lastSubmittedAt == null)
        ? RepaintBoundary(
            child: FadeSlideIn(
              delay: const Duration(milliseconds: 100),
              child: _InlineSupportWarning(
                title: texts.statusSyncWarningTitle,
                message: texts.latestTicketLoadWarning,
                actionLabel: texts.retryAction,
                onRetry: _loadLatestTicket,
              ),
            ),
          )
        : null;

    final historySection = RepaintBoundary(
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 120),
        child: SectionCard(
          title: texts.recentRequestsTitle,
          child: SupportTicketHistory(
            isEnglish: texts.isEnglish,
            items: _ticketHistory,
            isLoading: _isHistoryLoading,
            isLoadingMore: _isLoadingMoreTickets,
            hasMore: _hasMoreTickets,
            errorMessage: _ticketHistoryLoadErrorMessage == null
                ? null
                : texts.historyLoadWarning,
            onLoadMore: () => _loadTicketHistory(loadMore: true),
            onRetry: _loadTicketHistory,
          ),
        ),
      ),
    );

    final submitSection = RepaintBoundary(
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 140),
        child: SectionCard(
          title: texts.submitRequestTitle,
          child: Column(
            children: [
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
              const SizedBox(height: 14),
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
                controller: _messageController,
                keyboardType: TextInputType.multiline,
                textInputAction: TextInputAction.newline,
                textCapitalization: TextCapitalization.sentences,
                minLines: 4,
                maxLines: 8,
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
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  texts.expectedResponseTime(texts.slaText(_priority)),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
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
              if (_lastTicketNumericId != null && _lastStatus != 'CLOSED') ...[
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _isSubmitting
                        ? null
                        : () => _handleFollowUp(texts),
                    child: Text(texts.followUpAction),
                  ),
                ),
              ],
            ],
          ),
        ),
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
                                quickContactSection,
                                if (statusSection != null) ...[
                                  const SizedBox(height: 14),
                                  statusSection,
                                ],
                                if (latestWarningSection != null) ...[
                                  const SizedBox(height: 14),
                                  latestWarningSection,
                                ],
                                const SizedBox(height: 14),
                                faqSection,
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            flex: 7,
                            child: Column(
                              children: [
                                submitSection,
                                const SizedBox(height: 14),
                                historySection,
                              ],
                            ),
                          ),
                        ],
                      ),
                    ]
                  : [
                      quickContactSection,
                      if (statusSection != null) ...[
                        const SizedBox(height: 14),
                        statusSection,
                      ],
                      if (latestWarningSection != null) ...[
                        const SizedBox(height: 14),
                        latestWarningSection,
                      ],
                      const SizedBox(height: 14),
                      submitSection,
                      const SizedBox(height: 14),
                      historySection,
                      const SizedBox(height: 14),
                      faqSection,
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
    final targetContext = _ticketCardKey.currentContext;
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
    final message = _messageController.text.trim();

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
      );
      _applyTicket(ticket);
      _loadTicketHistory();
      _showSnackBar(texts.requestSubmittedMessage(ticket.ticketCode));
      _subjectController.clear();
      _messageController.clear();
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
    final ticketId = _lastTicketNumericId;
    final message = _messageController.text.trim();
    if (ticketId == null) {
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
      final ticket = await _supportService.submitTicketMessage(
        ticketId: ticketId,
        message: message,
      );
      _applyTicket(ticket);
      _loadTicketHistory();
      _messageController.clear();
      _showSnackBar(texts.followUpSubmittedMessage(ticket.ticketCode));
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
        return 'ORDER';
      case SupportCategory.warranty:
        return 'WARRANTY';
      case SupportCategory.product:
        return 'PRODUCT';
      case SupportCategory.payment:
        return 'PAYMENT';
      case SupportCategory.returnOrder:
        return 'returnOrder';
      case SupportCategory.other:
        return 'OTHER';
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
    switch ((raw ?? '').trim().toUpperCase()) {
      case 'HIGH':
        return SupportPriority.high;
      case 'URGENT':
        return SupportPriority.urgent;
      case 'NORMAL':
      default:
        return SupportPriority.normal;
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
      ? 'Send follow-up to latest ticket'
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
        return isEnglish ? 'Warranty / Serial' : 'Kho serial';
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
    switch (status) {
      case 'OPEN':
        return isEnglish ? 'Open' : 'Mở';
      case 'IN_PROGRESS':
        return isEnglish ? 'In progress' : 'Đang xử lý';
      case 'RESOLVED':
        return isEnglish ? 'Resolved' : 'Đã xử lý';
      case 'CLOSED':
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

class _InlineSupportWarning extends StatelessWidget {
  const _InlineSupportWarning({
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onRetry,
  });

  final String title;
  final String message;
  final String actionLabel;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return SectionCard(
      title: title,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.errorContainer.withValues(alpha: 0.28),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.error.withValues(alpha: 0.28)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: colors.errorContainer,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(Icons.info_outline, color: colors.onErrorContainer),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(message, style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh_rounded),
                    label: Text(actionLabel),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  const _ContactTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.onCopy,
    required this.copyTooltip,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onCopy;
  final String copyTooltip;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onCopy,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: colors.primaryContainer.withValues(alpha: 0.72),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: colors.onPrimaryContainer),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: textTheme.labelMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      value,
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.copy_rounded),
                onPressed: onCopy,
                tooltip: copyTooltip,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.ticketId,
    required this.submittedAt,
    required this.category,
    required this.priority,
    required this.sla,
    required this.onClear,
    required this.texts,
    this.status,
    this.latestAdminUpdate,
  });

  final String ticketId;
  final DateTime submittedAt;
  final String category;
  final String priority;
  final String sla;
  final String? status;
  final String? latestAdminUpdate;
  final VoidCallback onClear;
  final _SupportTexts texts;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = Theme.of(context).colorScheme;
    final statusText = status == null ? null : texts.statusLabel(status!);
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.55),
        ),
        boxShadow: [
          BoxShadow(
            color: colors.shadow.withValues(alpha: 0.03),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
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
                        texts.requestSubmittedTitle,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${texts.responseSlaLabel}: $sla',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                if (statusText != null) ...[
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: colors.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: colors.outlineVariant.withValues(alpha: 0.5),
                      ),
                    ),
                    child: Text(
                      statusText,
                      style: theme.textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
                IconButton(
                  onPressed: onClear,
                  icon: const Icon(Icons.close),
                  tooltip: texts.hideAction,
                ),
              ],
            ),
            const SizedBox(height: 8),
            _InfoRow(label: texts.ticketIdLabel, value: ticketId),
            const SizedBox(height: 6),
            _InfoRow(
              label: texts.submittedAtLabel,
              value: _formatDateTime(submittedAt),
            ),
            const SizedBox(height: 6),
            _InfoRow(label: texts.categorySummaryLabel, value: category),
            const SizedBox(height: 6),
            _InfoRow(label: texts.prioritySummaryLabel, value: priority),
            const SizedBox(height: 6),
            _InfoRow(label: texts.responseSlaLabel, value: sla),
            if (latestAdminUpdate != null) ...[
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: colors.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: colors.outlineVariant.withValues(alpha: 0.5),
                  ),
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
                      style: theme.textTheme.bodyMedium?.copyWith(height: 1.45),
                    ),
                  ],
                ),
              ),
            ],
          ],
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
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final labelStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
      color: Theme.of(context).colorScheme.onSurfaceVariant,
      fontWeight: FontWeight.w600,
    );
    final valueStyle = Theme.of(
      context,
    ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: labelStyle)),
        const SizedBox(width: 12),
        Flexible(
          child: Text(value, textAlign: TextAlign.right, style: valueStyle),
        ),
      ],
    );
  }
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
