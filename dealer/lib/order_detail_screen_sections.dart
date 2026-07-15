part of 'order_detail_screen.dart';

class _OrderDetailRefreshBoundary extends StatefulWidget {
  const _OrderDetailRefreshBoundary({
    required this.orderId,
    required this.child,
  });

  final String orderId;
  final Widget child;

  @override
  State<_OrderDetailRefreshBoundary> createState() =>
      _OrderDetailRefreshBoundaryState();
}

class _OrderDetailRefreshBoundaryState
    extends State<_OrderDetailRefreshBoundary> {
  @override
  void initState() {
    super.initState();
    _scheduleRefresh();
  }

  @override
  void didUpdateWidget(covariant _OrderDetailRefreshBoundary oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.orderId != widget.orderId) {
      _scheduleRefresh();
    }
  }

  void _scheduleRefresh() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      unawaited(OrderScope.of(context).refreshSingleOrder(widget.orderId));
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

class _OrderReturnOverviewSection extends StatefulWidget {
  const _OrderReturnOverviewSection({required this.orderId});

  final String orderId;

  @override
  State<_OrderReturnOverviewSection> createState() =>
      _OrderReturnOverviewSectionState();
}

class _OrderReturnOverviewSectionState
    extends State<_OrderReturnOverviewSection> {
  static const Duration _activeRequestDetailTimeout = Duration(seconds: 5);

  late final ReturnRequestService _returnService;
  bool _hasLoadedInitially = false;
  List<DealerReturnEligibilityRecord> _eligibilities =
      const <DealerReturnEligibilityRecord>[];
  final Map<int, DealerReturnRequestStatus> _activeStatusByRequestId =
      <int, DealerReturnRequestStatus>{};
  bool _isLoading = true;
  String? _errorMessage;
  int _loadGeneration = 0;

  @override
  void initState() {
    super.initState();
    _returnService = ReturnRequestService();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_hasLoadedInitially) {
      return;
    }
    _hasLoadedInitially = true;
    unawaited(_load());
  }

  @override
  void dispose() {
    _returnService.close();
    super.dispose();
  }

  Future<void> _load() async {
    final loadGeneration = ++_loadGeneration;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    final isEnglish = _orderDetailTexts(context).isEnglish;
    try {
      final orderController = OrderScope.of(context);
      await orderController.refreshSingleOrder(widget.orderId);
      final remoteOrderId = orderController.remoteOrderIdForOrderCode(
        widget.orderId,
      );
      if (remoteOrderId == null || remoteOrderId <= 0) {
        if (!mounted || !_isCurrentLoad(loadGeneration)) {
          return;
        }
        setState(() {
          _errorMessage = isEnglish
              ? 'Unable to resolve this order for return eligibility.'
              : 'Khong the anh xa don hang de kiem tra doi tra.';
        });
        return;
      }

      final eligibility = await _returnService.fetchOrderEligibleSerials(
        remoteOrderId,
        type: _defaultCreateReturnRequestType,
      );
      if (!mounted || !_isCurrentLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _eligibilities = eligibility;
        _activeStatusByRequestId.clear();
      });
      unawaited(_enrichActiveRequestStatuses(eligibility, loadGeneration));
    } on ReturnRequestException catch (error) {
      if (!mounted || !_isCurrentLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _errorMessage = resolveReturnServiceMessage(
          error.message,
          isEnglish: isEnglish,
        );
      });
    } finally {
      if (mounted && _isCurrentLoad(loadGeneration)) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  bool _isCurrentLoad(int loadGeneration) => loadGeneration == _loadGeneration;

  Future<void> _enrichActiveRequestStatuses(
    List<DealerReturnEligibilityRecord> eligibility,
    int loadGeneration,
  ) async {
    final activeRequestIds = eligibility
        .map((item) => item.activeRequestId)
        .whereType<int>()
        .toSet()
        .toList(growable: false);
    if (activeRequestIds.isEmpty) {
      return;
    }

    final statusMap = <int, DealerReturnRequestStatus>{};
    await Future.wait<void>(
      activeRequestIds.map((requestId) async {
        try {
          final detail = await _returnService
              .fetchDetail(requestId)
              .timeout(_activeRequestDetailTimeout);
          statusMap[requestId] = detail.status;
        } catch (_) {
          // Keep reason from eligibility API if detail lookup fails.
        }
      }),
    );

    if (!mounted || !_isCurrentLoad(loadGeneration)) {
      return;
    }
    setState(() {
      _activeStatusByRequestId
        ..clear()
        ..addAll(statusMap);
    });
  }

  @override
  Widget build(BuildContext context) {
    final texts = _orderDetailTexts(context);
    final eligibleCount = _eligibilities.where((item) => item.eligible).length;
    final activeCount = _eligibilities
        .where((item) => item.activeRequestId != null)
        .length;
    return SectionCard(
      title: texts.returnOverviewTitle,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else if (_errorMessage != null) ...[
            Text(
              _errorMessage!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.error,
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(onPressed: _load, child: Text(texts.retryAction)),
          ] else ...[
            Text(
              texts.returnOverviewSummary(
                eligibleCount,
                activeCount,
                _eligibilities.length,
              ),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: () => context.pushDealerCreateReturnRequest(
                    widget.orderId,
                    returnType: _defaultCreateReturnRequestType,
                  ),
                  icon: const Icon(Icons.assignment_return_outlined, size: 18),
                  label: Text(texts.createReturnAction),
                ),
              ],
            ),
            if (_eligibilities.isEmpty) ...[
              const SizedBox(height: 8),
              Text(texts.returnNoSerialsMessage),
            ] else ...[
              const SizedBox(height: 10),
              for (var index = 0; index < _eligibilities.length; index++) ...[
                _OrderReturnSerialTile(
                  eligibility: _eligibilities[index],
                  activeStatus: _eligibilities[index].activeRequestId == null
                      ? null
                      : _activeStatusByRequestId[_eligibilities[index]
                            .activeRequestId!],
                ),
                if (index != _eligibilities.length - 1)
                  const Divider(height: 14),
              ],
            ],
          ],
        ],
      ),
    );
  }
}

class _OrderReturnSerialTile extends StatelessWidget {
  const _OrderReturnSerialTile({
    required this.eligibility,
    required this.activeStatus,
  });

  final DealerReturnEligibilityRecord eligibility;
  final DealerReturnRequestStatus? activeStatus;

  @override
  Widget build(BuildContext context) {
    final texts = _orderDetailTexts(context);
    final productName = eligibility.productName ?? '-';
    final productSku = eligibility.productSku ?? '-';
    final statusText = activeStatus == null
        ? _eligibilityReasonText(eligibility, isEnglish: texts.isEnglish)
        : dealerReturnStatusLabel(activeStatus!, isEnglish: texts.isEnglish);
    final statusColor = activeStatus == null
        ? (eligibility.eligible
              ? Theme.of(context).colorScheme.tertiary
              : Theme.of(context).colorScheme.error)
        : dealerReturnStatusForeground(activeStatus!);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eligibility.serial,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 2),
        Text(
          '$productName - $productSku',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          statusText,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: statusColor,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            if (eligibility.eligible)
              OutlinedButton(
                onPressed:
                    (eligibility.orderCode == null ||
                        eligibility.orderCode!.trim().isEmpty)
                    ? null
                    : () => context.pushDealerCreateReturnRequest(
                        eligibility.orderCode!,
                        prefilledSerialId: eligibility.serialId,
                        returnType: _defaultCreateReturnRequestType,
                      ),
                child: Text(texts.createReturnForSerialAction),
              ),
            if (eligibility.activeRequestId != null)
              OutlinedButton.icon(
                onPressed: () => context.pushDealerReturnDetail(
                  eligibility.activeRequestId!,
                ),
                icon: const Icon(Icons.open_in_new_rounded, size: 16),
                label: Text(texts.openReturnRequestAction),
              ),
          ],
        ),
      ],
    );
  }
}
