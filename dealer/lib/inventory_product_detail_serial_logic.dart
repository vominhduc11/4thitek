// ignore_for_file: invalid_use_of_protected_member

part of 'inventory_product_detail_screen.dart';

extension _InventoryProductDetailSerialLogic
    on _InventoryProductDetailScreenState {
  List<Widget> _buildSerialTiles({
    required BuildContext context,
    required List<ImportedSerialRecord> visibleSerials,
    required Map<String, ImportedSerialStatus> serialStatuses,
    required Map<String, DealerInventorySerialRecord> remoteSerialByValue,
    required bool isWideLayout,
    required ColorScheme colorScheme,
    required _InventoryProductDetailTexts texts,
  }) {
    final tiles = visibleSerials
        .map((record) {
          final status = serialStatuses[record.serial]!;
          final remoteRecord = remoteSerialByValue[record.serial];
          final returnIndicator = remoteRecord == null
              ? null
              : _returnIndicatorBySerialId[remoteRecord.id];
          return RepaintBoundary(
            child: _SerialTile(
              record: record,
              status: status,
              onOpenOrder: () => context.pushDealerOrderDetail(record.orderId),
              onCopy: () => _copySerial(record.serial),
              returnIndicatorLabel: returnIndicator == null
                  ? null
                  : (returnIndicator.activeStatus == null
                        ? _returnEligibilityMessage(
                            returnIndicator.eligibility.reasonCode,
                            fallback: returnIndicator.eligibility.reasonMessage,
                            isEnglish: texts.isEnglish,
                          )
                        : dealerReturnStatusLabel(
                            returnIndicator.activeStatus!,
                            isEnglish: texts.isEnglish,
                          )),
              returnIndicatorColor: returnIndicator == null
                  ? null
                  : (returnIndicator.activeStatus == null
                        ? (returnIndicator.eligibility.eligible
                              ? colorScheme.tertiary
                              : colorScheme.error)
                        : dealerReturnStatusForeground(
                            returnIndicator.activeStatus!,
                          )),
              onViewTimeline: remoteRecord == null
                  ? null
                  : () => _openSerialTimeline(remoteRecord),
              onCheckReturnEligibility: remoteRecord == null
                  ? null
                  : () => _openReturnEligibilitySheet(remoteRecord),
            ),
          );
        })
        .toList(growable: false);

    if (!isWideLayout) {
      return tiles
          .map(
            (tile) => Padding(
              padding: const EdgeInsets.only(bottom: _detailItemSpacing),
              child: tile,
            ),
          )
          .toList(growable: false);
    }

    return [
      LayoutBuilder(
        builder: (context, constraints) {
          final columns = constraints.maxWidth >= 1200 ? 3 : 2;
          const spacing = _detailItemSpacing;
          final tileWidth =
              (constraints.maxWidth - (spacing * (columns - 1))) / columns;
          return Wrap(
            spacing: spacing,
            runSpacing: spacing,
            children: [
              for (final tile in tiles) SizedBox(width: tileWidth, child: tile),
            ],
          );
        },
      ),
    ];
  }

  void _setFilter(InventorySerialFilter filter) {
    setState(() {
      _filter = filter;
      _visibleSerialCount = _initialVisibleSerialCount;
    });
    _jumpToTop();
  }

  void _setSerialQuery(String value) {
    final normalized = value.trimLeft();
    if (normalized == _serialQuery) {
      return;
    }
    setState(() {
      _serialQuery = normalized;
      _visibleSerialCount = _initialVisibleSerialCount;
    });
    _jumpToTop();
  }

  ImportedSerialStatus _serialStatus(ImportedSerialRecord record) {
    final normalized = record.status;
    if (normalized == ImportedSerialStatus.unknown) {
      return ImportedSerialStatus.unknown;
    }
    return normalized;
  }

  bool _isReadyStatus(ImportedSerialStatus status) {
    return status == ImportedSerialStatus.available ||
        status == ImportedSerialStatus.assigned;
  }

  Future<void> _handleScanSerialForProduct(
    WarrantyController warrantyController,
  ) async {
    final texts = _inventoryProductDetailTexts(context);
    final scannedValue = await Navigator.of(
      context,
    ).push<String>(MaterialPageRoute(builder: (_) => const SerialScanScreen()));
    if (!mounted || scannedValue == null) {
      return;
    }

    final normalized = warrantyController.normalizeSerial(scannedValue);
    if (normalized.isEmpty) {
      _showSnackBar(texts.invalidScannedCodeMessage);
      return;
    }

    final validationError = warrantyController.validateSerialForExport(
      normalized,
      isEnglish: texts.isEnglish,
    );
    if (validationError != null) {
      _showSnackBar(validationError);
      return;
    }

    if (!mounted) {
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => WarrantyExportScreen(prefilledSerial: normalized),
      ),
    );
  }

  void _copySerial(String serial) {
    Clipboard.setData(ClipboardData(text: serial));
    _showSnackBar(
      _inventoryProductDetailTexts(context).copiedSerialMessage(serial),
    );
  }

  Future<void> _openSerialTimeline(
    DealerInventorySerialRecord remoteRecord,
  ) async {
    final texts = _inventoryProductDetailTexts(context);
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: FutureBuilder<DealerInventorySerialDetailRecord>(
            future: _inventoryService.fetchSerialDetail(remoteRecord.id),
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const SizedBox(
                  height: 220,
                  child: Center(
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                );
              }

              if (snapshot.hasError || !snapshot.hasData) {
                final message = snapshot.error is InventoryException
                    ? resolveInventoryServiceMessage(
                        (snapshot.error as InventoryException).message,
                        isEnglish: texts.isEnglish,
                      )
                    : texts.timelineLoadFailedMessage;
                return Padding(
                  padding: const EdgeInsets.all(20),
                  child: _SerialEmptyStateCard(
                    icon: Icons.timeline_outlined,
                    message: message,
                  ),
                );
              }

              final detail = snapshot.data!;
              return _InventoryTimelineSheet(detail: detail, texts: texts);
            },
          ),
        );
      },
    );
  }

  Future<void> _prefetchReturnIndicators(
    List<DealerInventorySerialRecord> serials,
  ) async {
    for (final serial in serials) {
      if (!mounted) {
        return;
      }
      if (_returnIndicatorBySerialId.containsKey(serial.id)) {
        continue;
      }
      await _fetchReturnIndicator(serial, silent: true);
    }
  }

  Future<_SerialReturnIndicator?> _fetchReturnIndicator(
    DealerInventorySerialRecord serial, {
    bool silent = false,
  }) async {
    final existing = _returnIndicatorBySerialId[serial.id];
    if (existing != null) {
      return existing;
    }
    try {
      final eligibility = await _returnRequestService.fetchSerialEligibility(
        serial.id,
      );
      DealerReturnRequestStatus? activeStatus;
      final activeRequestId = eligibility.activeRequestId;
      if (activeRequestId != null && activeRequestId > 0) {
        try {
          final detail = await _returnRequestService.fetchDetail(
            activeRequestId,
          );
          activeStatus = detail.status;
        } on ReturnRequestException {
          // Keep fallback reason from eligibility endpoint.
        }
      }
      final indicator = _SerialReturnIndicator(
        eligibility: eligibility,
        activeStatus: activeStatus,
      );
      if (!mounted) {
        return indicator;
      }
      setState(() {
        _returnIndicatorBySerialId[serial.id] = indicator;
      });
      return indicator;
    } on ReturnRequestException catch (error) {
      if (!silent && mounted) {
        _showSnackBar(
          resolveReturnServiceMessage(
            error.message,
            isEnglish: _inventoryProductDetailTexts(context).isEnglish,
          ),
        );
      }
      return null;
    }
  }

  Future<void> _openReturnEligibilitySheet(
    DealerInventorySerialRecord serial,
  ) async {
    final texts = _inventoryProductDetailTexts(context);
    final indicator = await _fetchReturnIndicator(serial);
    if (!mounted || indicator == null) {
      return;
    }

    final eligibility = indicator.eligibility;
    final activeRequestId = eligibility.activeRequestId;
    final activeStatus = indicator.activeStatus;
    final statusText = activeStatus == null
        ? _returnEligibilityMessage(
            eligibility.reasonCode,
            fallback: eligibility.reasonMessage,
            isEnglish: texts.isEnglish,
          )
        : dealerReturnStatusLabel(activeStatus, isEnglish: texts.isEnglish);

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  texts.returnEligibilityTitle(eligibility.serial),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  statusText,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: activeStatus == null
                        ? (eligibility.eligible
                              ? Theme.of(context).colorScheme.tertiary
                              : Theme.of(context).colorScheme.error)
                        : dealerReturnStatusForeground(activeStatus),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    if (eligibility.eligible &&
                        (eligibility.orderCode != null &&
                            eligibility.orderCode!.trim().isNotEmpty))
                      OutlinedButton.icon(
                        onPressed: () {
                          Navigator.of(sheetContext).pop();
                          context.pushDealerCreateReturnRequest(
                            eligibility.orderCode!,
                            prefilledSerialId: eligibility.serialId,
                          );
                        },
                        icon: const Icon(Icons.assignment_return_outlined),
                        label: Text(texts.createReturnAction),
                      ),
                    if (activeRequestId != null && activeRequestId > 0)
                      OutlinedButton.icon(
                        onPressed: () {
                          Navigator.of(sheetContext).pop();
                          context.pushDealerReturnDetail(activeRequestId);
                        },
                        icon: const Icon(Icons.open_in_new_rounded),
                        label: Text(texts.openActiveReturnAction),
                      ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

String _returnEligibilityMessage(
  String reasonCode, {
  required String fallback,
  required bool isEnglish,
}) {
  final normalized = reasonCode.trim().toUpperCase();
  switch (normalized) {
    case 'ELIGIBLE':
      return isEnglish ? 'Eligible for return' : 'Đủ điều kiện đổi trả';
    case 'ORDER_NOT_COMPLETED':
      return isEnglish
          ? 'Order must be completed before creating return request.'
          : 'Đơn hàng phải hoàn tất trước khi tạo yêu cầu đổi trả.';
    case 'SERIAL_STATUS_NOT_ELIGIBLE':
      return isEnglish
          ? 'Serial status is not eligible for return.'
          : 'Trạng thái serial không cho phép đổi trả.';
    case 'ACTIVE_RETURN_REQUEST_EXISTS':
      return isEnglish
          ? 'This serial already has an active return request.'
          : 'Serial này đã có yêu cầu đổi trả đang xử lý.';
    default:
      return fallback.trim().isEmpty
          ? (isEnglish
                ? 'Return eligibility unavailable.'
                : 'Không xác định điều kiện đổi trả.')
          : fallback;
  }
}

class _SerialReturnIndicator {
  const _SerialReturnIndicator({
    required this.eligibility,
    required this.activeStatus,
  });

  final DealerReturnEligibilityRecord eligibility;
  final DealerReturnRequestStatus? activeStatus;
}
