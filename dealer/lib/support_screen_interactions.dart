// ignore_for_file: invalid_use_of_protected_member

part of 'support_screen.dart';

extension _SupportScreenInteractions on _SupportScreenState {
  Future<void> _scrollToTicketCard() async {
    SupportScreenDiagnostics.instance.recordAutoScroll('ticket_card');
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

  bool _isSingleColumnLayout() => MediaQuery.sizeOf(context).width < 1080;

  Future<void> _scrollToDetailSection() async {
    SupportScreenDiagnostics.instance.recordAutoScroll('detail_section');
    if (!mounted) {
      return;
    }
    final targetContext = _detailSectionKey.currentContext;
    if (targetContext != null) {
      await Scrollable.ensureVisible(
        targetContext,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
      return;
    }
    if (_scrollController.hasClients) {
      await _scrollController.animateTo(
        _scrollController.position.maxScrollExtent * 0.24,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  Future<void> _scrollToComposeSection() async {
    SupportScreenDiagnostics.instance.recordAutoScroll('compose_section');
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

  void _handleTicketSelected(DealerSupportTicketRecord ticket) {
    _persistFollowUpDraftForSelectedTicket();
    setState(() {
      _selectedTicketForReply = ticket;
      _respectInitialTicketSelection = false;
      if (_interactionMode == SupportInteractionMode.creating) {
        _interactionMode = SupportInteractionMode.viewing;
      } else if (_interactionMode == SupportInteractionMode.followingUp &&
          _isTicketClosed(ticket)) {
        _interactionMode = SupportInteractionMode.viewing;
      }
      if (_interactionMode == SupportInteractionMode.followingUp) {
        _followUpMessageController.text =
            _followUpDraftsByTicketId[ticket.id] ?? '';
      }
    });
    if (_isSingleColumnLayout()) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToDetailSection();
      });
    }
  }

  void _openCreateComposer({bool shouldScroll = false}) {
    _persistFollowUpDraftForSelectedTicket();
    setState(() {
      _interactionMode = SupportInteractionMode.creating;
    });
    if (shouldScroll) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToComposeSection();
      });
    }
  }

  void _openFollowUpComposer({bool shouldScroll = false}) {
    _persistFollowUpDraftForSelectedTicket();
    if (_selectedTicketForReply == null ||
        _isTicketClosed(_selectedTicketForReply!)) {
      return;
    }
    setState(() {
      _interactionMode = SupportInteractionMode.followingUp;
      _followUpMessageController.text =
          _followUpDraftsByTicketId[_selectedTicketForReply!.id] ?? '';
    });
    if (shouldScroll) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToComposeSection();
      });
    }
  }

  void _setViewingMode() {
    if (_interactionMode == SupportInteractionMode.viewing) {
      return;
    }
    setState(() {
      _interactionMode = SupportInteractionMode.viewing;
    });
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
    if (_interactionMode == SupportInteractionMode.creating) {
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
}
