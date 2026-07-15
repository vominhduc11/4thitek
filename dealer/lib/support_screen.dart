import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_settings_controller.dart';
import 'business_profile.dart';
import 'breakpoints.dart';
import 'dealer_navigation.dart';
import 'dealer_routes.dart';
import 'support_attachment_download.dart';
import 'notification_controller.dart';
import 'support_attachment_utils.dart';
import 'support_service.dart';
import 'upload_service.dart';
import 'widgets/attachment_preview.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';
import 'widgets/support_ticket_history.dart';
import 'support_screen_diagnostics.dart';

part 'support_texts.dart';
part 'support_screen_data.dart';
part 'support_screen_interactions.dart';
part 'support_screen_sections.dart';
part 'support_screen_attachments.dart';
part 'support_screen_actions.dart';
part 'support_hero_widgets.dart';
part 'support_ticket_detail_widgets.dart';
part 'support_composer_widgets.dart';
part 'support_attachment_widgets.dart';

const _hotline = BusinessProfile.contactPhone;
const _supportEmail = BusinessProfile.contactEmail;
const _subjectMax = 80;
const _messageMax = 1000;
const _subjectMin = 5;
const _messageMin = 20;
const _maxImageBytes = 10 * 1024 * 1024;
const _maxVideoBytes = 50 * 1024 * 1024;
const _maxDocumentBytes = 10 * 1024 * 1024;

enum SupportCategory { order, warranty, product, payment, returnOrder, other }

enum SupportPriority { normal, high, urgent }

enum SupportInteractionMode { viewing, creating, followingUp }

enum _SupportAttachmentPickerChoice { image, video, document }

class SupportScreen extends StatefulWidget {
  const SupportScreen({
    super.key,
    this.supportService,
    this.initialTicketId,
    this.uploadServiceFactory,
    this.attachmentPicker,
  });

  final SupportService? supportService;
  final int? initialTicketId;
  final UploadService Function()? uploadServiceFactory;
  final Future<XFile?> Function()? attachmentPicker;

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
  NotificationController? _notificationController;
  int? _pendingInitialTicketId;
  bool _respectInitialTicketSelection = false;

  SupportCategory _category = SupportCategory.order;
  SupportPriority _priority = SupportPriority.normal;
  int? _lastTicketNumericId;
  String? _lastTicketId;
  DateTime? _lastSubmittedAt;
  SupportPriority? _lastPriority;
  String? _lastStatus;
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
  bool _isDeletingAttachment = false;
  double? _attachmentUploadProgress;
  int _handledSupportEventVersion = 0;
  SupportInteractionMode _interactionMode = SupportInteractionMode.viewing;

  UploadService _createUploadService() =>
      widget.uploadServiceFactory?.call() ?? UploadService();

  @override
  void initState() {
    super.initState();
    _supportService = widget.supportService ?? SupportService();
    _pendingInitialTicketId = widget.initialTicketId;
    _respectInitialTicketSelection = _pendingInitialTicketId != null;
    SupportScreenDiagnostics.instance.attach();
    if (_pendingInitialTicketId != null && _pendingInitialTicketId! > 0) {
      unawaited(_resolveInitialTicketDeepLink(_pendingInitialTicketId!));
    }
    _loadLatestTicket();
    _loadTicketHistory();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final notificationController = NotificationScope.of(context);
    if (!identical(_notificationController, notificationController)) {
      _notificationController?.incomingSupportEvents.removeListener(
        _handleIncomingSupportEvent,
      );
      _notificationController = notificationController;
      _notificationController!.incomingSupportEvents.addListener(
        _handleIncomingSupportEvent,
      );
      _handleIncomingSupportEvent();
    }
  }

  void _handleIncomingSupportEvent() {
    final notificationController = _notificationController;
    if (notificationController == null) {
      return;
    }
    SupportScreenDiagnostics.instance.recordSupportEvent();
    final version = notificationController.incomingSupportEventVersion;
    if (version == _handledSupportEventVersion) {
      return;
    }
    _handledSupportEventVersion = version;
    _loadLatestTicket();
    _loadTicketHistory();
  }

  @override
  void dispose() {
    SupportScreenDiagnostics.instance.detach();
    _notificationController?.incomingSupportEvents.removeListener(
      _handleIncomingSupportEvent,
    );
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
    unawaited(_cleanupPendingAttachments());
    _supportService.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    SupportScreenDiagnostics.instance.recordSupportScreenBuild();
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
    final animateSections = isWideLayout;
    final denseSectionLayout = !isWideLayout;
    final selectedTicket = _selectedTicketForReply;
    final shouldShowComposer =
        _interactionMode != SupportInteractionMode.viewing;
    final shouldShowGuideCard =
        _interactionMode == SupportInteractionMode.creating ||
        (!_isHistoryLoading && _ticketHistory.isEmpty);

    final summarySection = RepaintBoundary(
      key: _ticketSummaryKey,
      child: FadeSlideIn(
        animate: animateSections,
        child: _SupportHeroSection(
          texts: texts,
          ticketCode: _lastTicketId,
          latestStatus: _lastStatus,
          submittedAt: _lastSubmittedAt,
          slaLabel: texts.slaText(_lastPriority ?? _priority),
          hasLatestError: _latestTicketLoadErrorMessage != null,
          onRetryLatest: _loadLatestTicket,
          onCreateTicket: () => _openCreateComposer(shouldScroll: true),
          onOpenReply: selectedTicket == null || _isTicketClosed(selectedTicket)
              ? null
              : () => _openFollowUpComposer(shouldScroll: true),
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
        animate: animateSections,
        delay: const Duration(milliseconds: 70),
        child: SectionCard(
          dense: denseSectionLayout,
          title: texts.ticketInboxTitle,
          child: SupportTicketHistory(
            isEnglish: texts.isEnglish,
            items: _ticketHistory,
            isLoading: _isHistoryLoading,
            isLoadingMore: _isLoadingMoreTickets,
            hasMore: _hasMoreTickets,
            dense: denseSectionLayout,
            selectedTicketId: selectedTicket?.id,
            onSelectTicket: _handleTicketSelected,
            errorMessage: _ticketHistoryLoadErrorMessage == null
                ? null
                : texts.historyLoadWarning,
            onLoadMore: () => _loadTicketHistory(loadMore: true),
            onRetry: _loadTicketHistory,
            onCreateTicket: () => _openCreateComposer(shouldScroll: true),
          ),
        ),
      ),
    );

    final detailSection = RepaintBoundary(
      key: _detailSectionKey,
      child: FadeSlideIn(
        animate: animateSections,
        delay: const Duration(milliseconds: 110),
        child: _buildTicketDetailSection(
          texts,
          selectedTicket,
          dense: denseSectionLayout,
        ),
      ),
    );

    final composerSection = RepaintBoundary(
      key: _composerSectionKey,
      child: FadeSlideIn(
        animate: animateSections,
        delay: const Duration(milliseconds: 150),
        child: _buildComposerSection(
          texts,
          selectedTicket,
          dense: denseSectionLayout,
        ),
      ),
    );

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        leading: const DealerFallbackBackButton(
          fallbackPath: DealerRoutePath.home,
        ),
        title: BrandAppBarTitle(texts.screenTitle),
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: RefreshIndicator(
            onRefresh: _handleRefresh,
            child: NotificationListener<ScrollNotification>(
              onNotification: (notification) {
                SupportScreenDiagnostics.instance.recordScrollNotification(
                  notification,
                );
                return false;
              },
              child: ListView(
                key: const ValueKey<String>('support-scroll-view'),
                controller: _scrollController,
                keyboardDismissBehavior:
                    ScrollViewKeyboardDismissBehavior.onDrag,
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.fromLTRB(
                  isTablet ? 24 : 16,
                  16,
                  isTablet ? 24 : 16,
                  24,
                ),
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
                                  if (shouldShowComposer) ...[
                                    const SizedBox(height: 14),
                                    composerSection,
                                  ],
                                  if (shouldShowGuideCard) ...[
                                    const SizedBox(height: 14),
                                    _SupportGuideCard(texts: texts),
                                  ],
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
                        if (shouldShowComposer) ...[
                          const SizedBox(height: 14),
                          composerSection,
                        ],
                        if (shouldShowGuideCard) ...[
                          const SizedBox(height: 14),
                          _SupportGuideCard(texts: texts),
                        ],
                      ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
