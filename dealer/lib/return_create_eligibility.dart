// ignore_for_file: invalid_use_of_protected_member

part of 'return_create_screen.dart';

extension _ReturnCreateEligibility on _DealerReturnCreateScreenState {
  Future<void> _loadEligibility() async {
    final loadGeneration = ++_eligibilityLoadGeneration;
    final requestType = _requestType;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    final texts = _dealerReturnCreateTexts(context);
    try {
      await _loadEligibilityData(
        texts,
        loadGeneration: loadGeneration,
        requestType: requestType,
      ).timeout(_eligibilityLoadTimeout);
    } on ReturnRequestException catch (error) {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _errorMessage = resolveReturnServiceMessage(
          error.message,
          isEnglish: texts.isEnglish,
        );
      });
    } on TimeoutException {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _errorMessage = texts.eligibilityLoadTimeoutMessage;
      });
    } on FormatException {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _errorMessage = texts.eligibilityLoadInvalidResponseMessage;
      });
    } on SocketException {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _errorMessage = texts.eligibilityLoadNetworkMessage;
      });
    } catch (_) {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _errorMessage = texts.eligibilityLoadFailedMessage;
      });
    } finally {
      if (mounted && _isCurrentEligibilityLoad(loadGeneration)) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  bool _isCurrentEligibilityLoad(int loadGeneration) =>
      loadGeneration == _eligibilityLoadGeneration;

  Future<void> _loadEligibilityData(
    _DealerReturnCreateTexts texts, {
    required int loadGeneration,
    required DealerReturnRequestType requestType,
  }) async {
    final orderController = OrderScope.of(context);
    await orderController.refreshSingleOrder(widget.orderId);
    final remoteOrderId = orderController.remoteOrderIdForOrderCode(
      widget.orderId,
    );
    if (remoteOrderId == null || remoteOrderId <= 0) {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        final orderLoadError = orderController.lastActionMessage;
        _errorMessage = orderLoadError == null
            ? texts.missingOrderMappingMessage(widget.orderId)
            : orderControllerErrorMessage(
                orderLoadError,
                isEnglish: texts.isEnglish,
              );
      });
      return;
    }

    final eligibility = await _returnService.fetchOrderEligibleSerials(
      remoteOrderId,
      type: requestType,
    );

    if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
      return;
    }
    final nextSelected = <int>{};
    final nextConditionBySerialId = <int, DealerReturnRequestItemCondition>{};
    for (final item in eligibility) {
      final defaultCondition = DealerReturnRequestItemCondition.defective;
      nextConditionBySerialId[item.serialId] = defaultCondition;
      if (item.eligible &&
          widget.prefilledSerialId != null &&
          widget.prefilledSerialId == item.serialId) {
        nextSelected.add(item.serialId);
      }
    }

    setState(() {
      _remoteOrderId = remoteOrderId;
      _eligibilities = eligibility;
      _selectedSerialIds
        ..clear()
        ..addAll(nextSelected);
      _conditionBySerialId
        ..clear()
        ..addAll(nextConditionBySerialId);
      _activeStatusByRequestId.clear();
    });
    unawaited(_enrichActiveRequestStatuses(eligibility, loadGeneration));
  }

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

    final activeStatusMap = <int, DealerReturnRequestStatus>{};
    await Future.wait<void>(
      activeRequestIds.map((requestId) async {
        try {
          final detail = await _returnService
              .fetchDetail(requestId)
              .timeout(_activeRequestDetailTimeout);
          activeStatusMap[requestId] = detail.status;
        } catch (_) {
          // Keep fallback reason text from eligibility endpoint.
        }
      }),
    );

    if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
      return;
    }
    setState(() {
      _activeStatusByRequestId
        ..clear()
        ..addAll(activeStatusMap);
    });
  }

  List<DealerReturnRequestResolution> _allowedResolutionsForRequestType(
    DealerReturnRequestType type,
  ) {
    if (type == DealerReturnRequestType.warrantyRma) {
      return const <DealerReturnRequestResolution>[
        DealerReturnRequestResolution.inspectOnly,
        DealerReturnRequestResolution.replace,
      ];
    }
    return DealerReturnRequestResolution.values
        .where(
          (resolution) => resolution != DealerReturnRequestResolution.unknown,
        )
        .toList(growable: false);
  }

  DealerReturnRequestResolution _normalizeResolutionForRequestType(
    DealerReturnRequestType type,
    DealerReturnRequestResolution current,
  ) {
    final allowed = _allowedResolutionsForRequestType(type);
    if (allowed.contains(current)) {
      return current;
    }
    return allowed.first;
  }

  void _onRequestTypeChanged(DealerReturnRequestType nextType) {
    if (nextType == _requestType) {
      return;
    }
    final normalizedResolution = _normalizeResolutionForRequestType(
      nextType,
      _resolution,
    );
    setState(() {
      _requestType = nextType;
      _resolution = normalizedResolution;
      _eligibilities = const <DealerReturnEligibilityRecord>[];
      _selectedSerialIds.clear();
      _conditionBySerialId.clear();
      _activeStatusByRequestId.clear();
    });
    unawaited(_loadEligibility());
  }
}
