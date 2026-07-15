// ignore_for_file: invalid_use_of_protected_member

part of 'support_screen.dart';

extension _SupportScreenData on _SupportScreenState {
  Future<void> _loadLatestTicket() async {
    final stopwatch = Stopwatch()..start();
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
    } finally {
      if (stopwatch.isRunning) {
        stopwatch.stop();
        SupportScreenDiagnostics.instance.recordLatestReload(stopwatch.elapsed);
      }
    }
  }

  Future<void> _resolveInitialTicketDeepLink(int ticketId) async {
    try {
      final ticket = await _supportService.fetchTicket(ticketId);
      if (!mounted) {
        return;
      }
      setState(() {
        _upsertTicketInHistory(ticket);
        _selectedTicketForReply = ticket;
        _pendingInitialTicketId = null;
        _respectInitialTicketSelection = false;
      });
    } on SupportException {
      if (!mounted) {
        return;
      }
      setState(() {
        _pendingInitialTicketId = null;
      });
      final texts = _SupportTexts(
        isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(texts.deepLinkTicketUnavailableWarning)),
      );
    }
  }

  void _applyTicket(DealerSupportTicketRecord ticket) {
    setState(() {
      _lastTicketNumericId = ticket.id;
      _lastTicketId = ticket.ticketCode;
      _lastSubmittedAt = ticket.createdAt;
      _lastPriority = _parsePriority(ticket.priority);
      _lastStatus = ticket.status;
      if (!_respectInitialTicketSelection) {
        _selectedTicketForReply = _resolveSelectedTicket(ticket.id) ?? ticket;
      }
      if (_interactionMode == SupportInteractionMode.followingUp) {
        _followUpMessageController.text =
            _followUpDraftsByTicketId[ticket.id] ?? '';
      }
    });
  }

  void _upsertTicketInHistory(DealerSupportTicketRecord ticket) {
    final index = _ticketHistory.indexWhere((entry) => entry.id == ticket.id);
    if (index >= 0) {
      _ticketHistory[index] = ticket;
      return;
    }
    _ticketHistory.insert(0, ticket);
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
    final stopwatch = Stopwatch()..start();

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
          final preservedTicket = _selectedTicketForReply;
          _ticketHistory
            ..clear()
            ..addAll(response.items);
          if (preservedTicket != null) {
            _upsertTicketInHistory(preservedTicket);
          }
        } else {
          for (final ticket in response.items) {
            _upsertTicketInHistory(ticket);
          }
        }
        _ticketPage = response.page;
        _hasMoreTickets = response.page + 1 < response.totalPages;
        final preferredInitial = _resolveSelectedTicket(
          _pendingInitialTicketId,
        );
        if (preferredInitial != null) {
          _pendingInitialTicketId = null;
          _respectInitialTicketSelection = false;
        }
        _selectedTicketForReply =
            _resolveSelectedTicket(previousSelectedId) ??
            preferredInitial ??
            _resolveSelectedTicket(_lastTicketNumericId) ??
            (_respectInitialTicketSelection
                ? null
                : (_ticketHistory.isNotEmpty ? _ticketHistory.first : null));
        if (_interactionMode == SupportInteractionMode.followingUp &&
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
        if (stopwatch.isRunning) {
          stopwatch.stop();
          SupportScreenDiagnostics.instance.recordHistoryReload(
            stopwatch.elapsed,
          );
        }
      }
    }
  }
}
