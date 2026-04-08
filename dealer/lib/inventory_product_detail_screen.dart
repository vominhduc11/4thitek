import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'inventory_service.dart';
import 'models.dart';
import 'order_detail_screen.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'warranty_controller.dart';
import 'warranty_export_screen.dart';
import 'warranty_models.dart';
import 'widgets/brand_identity.dart';
import 'widgets/product_image.dart';

enum InventorySerialFilter { all, ready, warranty, issue }

const double _detailSectionSpacing = 16;
const double _detailSectionSpacingLarge = 18;
const double _detailItemSpacing = 10;
const double _detailMinTapTarget = 48;

_InventoryProductDetailTexts _inventoryProductDetailTexts(
  BuildContext context,
) => _InventoryProductDetailTexts(
  isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
);

class InventoryProductDetailScreen extends StatefulWidget {
  const InventoryProductDetailScreen({
    super.key,
    required this.product,
    required this.readyQuantity,
    required this.importedQuantity,
    required this.warrantyQuantity,
    required this.issueQuantity,
    required this.orderIds,
    required this.latestImportedAt,
    this.inventoryService,
  });

  final Product product;
  final int readyQuantity;
  final int importedQuantity;
  final int warrantyQuantity;
  final int issueQuantity;
  final List<String> orderIds;
  final DateTime latestImportedAt;
  final InventoryService? inventoryService;

  @override
  State<InventoryProductDetailScreen> createState() =>
      _InventoryProductDetailScreenState();
}

class _InventoryProductDetailScreenState
    extends State<InventoryProductDetailScreen> {
  static const int _initialVisibleSerialCount = 40;
  static const int _visibleSerialStep = 40;

  final ScrollController _scrollController = ScrollController();
  late final InventoryService _inventoryService;
  InventorySerialFilter _filter = InventorySerialFilter.all;
  int _visibleSerialCount = _initialVisibleSerialCount;
  int _filteredSerialCount = 0;
  List<DealerInventorySerialRecord>? _remoteSerials;
  String? _remoteLoadErrorMessage;
  bool _isRemoteLoading = false;

  @override
  void initState() {
    super.initState();
    _inventoryService = widget.inventoryService ?? InventoryService();
    _scrollController.addListener(_handleSerialListScroll);
    unawaited(_loadRemoteSerials());
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_handleSerialListScroll)
      ..dispose();
    if (widget.inventoryService == null) {
      _inventoryService.close();
    }
    super.dispose();
  }

  Future<void> _loadRemoteSerials() async {
    setState(() {
      _isRemoteLoading = true;
      _remoteLoadErrorMessage = null;
    });
    try {
      final serials = await _inventoryService.fetchSerials(
        productId: widget.product.id,
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _remoteSerials = serials;
        _remoteLoadErrorMessage = null;
      });
    } on InventoryException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _remoteLoadErrorMessage = resolveInventoryServiceMessage(
          error.message,
          isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
        );
      });
    } finally {
      if (mounted) {
        setState(() {
          _isRemoteLoading = false;
        });
      }
    }
  }

  void _handleSerialListScroll() {
    if (!_scrollController.hasClients ||
        _visibleSerialCount >= _filteredSerialCount) {
      return;
    }
    if (_scrollController.position.extentAfter > 280) {
      return;
    }
    setState(() {
      _visibleSerialCount =
          (_visibleSerialCount + _visibleSerialStep) > _filteredSerialCount
          ? _filteredSerialCount
          : _visibleSerialCount + _visibleSerialStep;
    });
  }

  void _jumpToTop() {
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(0);
    }
  }

  Future<void> _refresh() async {
    await _loadRemoteSerials();
    if (!mounted) {
      return;
    }
    setState(() {
      _visibleSerialCount = _initialVisibleSerialCount;
    });
    _jumpToTop();
  }

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryProductDetailTexts(context);
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final warrantyController = WarrantyScope.of(context);
    final productSku = widget.product.sku.trim();
    final remoteSerialByValue = <String, DealerInventorySerialRecord>{
      for (final item in _remoteSerials ?? const <DealerInventorySerialRecord>[])
        item.record.serial: item,
    };

    final serialRecords =
        _remoteSerials?.map((record) => record.record).toList(growable: false) ??
        warrantyController
            .importedSerialsForProduct(widget.product.id)
            .where((record) => widget.orderIds.toSet().contains(record.orderId))
            .toList(growable: false);

    // Compute live metrics from serial statuses (not stale widget params).
    int readyCount = 0;
    int warrantyCount = 0;
    int issueCount = 0;
    final serialStatuses = <String, ImportedSerialStatus>{};
    for (final record in serialRecords) {
      final status = _serialStatus(record);
      serialStatuses[record.serial] = status;
      if (_isReadyStatus(status)) {
        readyCount++;
      } else if (status == ImportedSerialStatus.warranty) {
        warrantyCount++;
      } else {
        issueCount++;
      }
    }
    final importedCount = serialRecords.length;
    final canExport = readyCount > 0;
    final filterAllLabel = texts.filterAllLabel(importedCount);
    final filterReadyLabel = texts.filterReadyLabel(readyCount);
    final filterWarrantyLabel = texts.filterWarrantyLabel(warrantyCount);
    final filterIssueLabel = texts.filterIssueLabel(issueCount);

    final filtered = serialRecords
        .where((record) {
          final status = serialStatuses[record.serial]!;
          if (_filter == InventorySerialFilter.ready &&
              !_isReadyStatus(status)) {
            return false;
          }
          if (_filter == InventorySerialFilter.warranty &&
              status != ImportedSerialStatus.warranty) {
            return false;
          }
          if (_filter == InventorySerialFilter.issue &&
              (_isReadyStatus(status) ||
                  status == ImportedSerialStatus.warranty)) {
            return false;
          }
          return true;
        })
        .toList(growable: false);
    _filteredSerialCount = filtered.length;
    final visibleSerials = filtered
        .take(_visibleSerialCount)
        .toList(growable: false);
    final hasMoreSerials = visibleSerials.length < _filteredSerialCount;
    final mediaSize = MediaQuery.sizeOf(context);
    final isTablet = mediaSize.shortestSide >= AppBreakpoints.phone;
    final isWideLayout = mediaSize.width >= 960;
    final maxWidth = isWideLayout
        ? 1120.0
        : (isTablet ? 1040.0 : double.infinity);

    Widget buildMetricsGrid() {
      return LayoutBuilder(
        builder: (context, constraints) {
          final columns = constraints.maxWidth >= 860 ? 4 : 2;
          const spacing = 8.0;
          final tileWidth =
              (constraints.maxWidth - spacing * (columns - 1)) / columns;
          final metrics = <Widget>[
            _InventoryMetric(
              label: texts.readyMetricLabel,
              value: '$readyCount',
              color: colorScheme.primary,
              icon: Icons.inventory_2_outlined,
            ),
            _InventoryMetric(
              label: texts.importedMetricLabel,
              value: '$importedCount',
              color: colorScheme.secondary,
              icon: Icons.south_west_rounded,
            ),
            _InventoryMetric(
              label: texts.warrantyMetricLabel,
              value: '$warrantyCount',
              color: colorScheme.tertiary,
              icon: Icons.verified_outlined,
            ),
            _InventoryMetric(
              label: texts.issueMetricLabel,
              value: '$issueCount',
              color: colorScheme.error,
              icon: Icons.report_problem_outlined,
            ),
          ];

          return Wrap(
            spacing: spacing,
            runSpacing: spacing,
            children: [
              for (final metric in metrics)
                SizedBox(width: tileWidth, child: metric),
            ],
          );
        },
      );
    }

    final Widget productSummary = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Semantics(
              image: true,
              label: texts.productImageLabel(widget.product.name),
              child: ExcludeSemantics(
                child: ProductImage(
                  product: widget.product,
                  width: 72,
                  height: 72,
                  borderRadius: BorderRadius.circular(14),
                  fit: BoxFit.cover,
                  iconSize: 20,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.product.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: textTheme.titleMedium?.copyWith(
                      color: colorScheme.onSurface,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      height: 1.2,
                    ),
                  ),
                  if (productSku.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      'SKU: $productSku',
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 11.5,
                        height: 1.3,
                      ),
                    ),
                  ],
                  const SizedBox(height: 4),
                  Text(
                    texts.latestImportedLabel(
                      formatDateTime(widget.latestImportedAt),
                    ),
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (widget.product.description.trim().isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            widget.product.description.trim(),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontSize: 12.5,
              height: 1.35,
            ),
          ),
        ],
      ],
    );

    final Widget actionButtons = Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        Semantics(
          button: true,
          enabled: canExport,
          label: texts.exportAction,
          child: ElevatedButton.icon(
            onPressed: canExport
                ? () {
                    Navigator.of(this.context).push(
                      MaterialPageRoute(
                        builder: (_) => const WarrantyExportScreen(),
                      ),
                    );
                  }
                : null,
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(120, 48),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              textStyle: const TextStyle(fontWeight: FontWeight.w700),
            ),
            icon: const Icon(Icons.local_shipping_outlined),
            label: Text(texts.exportAction),
          ),
        ),
        OutlinedButton.icon(
          onPressed: () {
            unawaited(_handleScanSerialForProduct(warrantyController));
          },
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(120, 48),
            padding: const EdgeInsets.symmetric(horizontal: 14),
            foregroundColor: colorScheme.onSurfaceVariant,
            side: BorderSide(
              color: colorScheme.outlineVariant.withValues(alpha: 0.9),
            ),
            backgroundColor: colorScheme.surfaceContainerHighest.withValues(
              alpha: 0.4,
            ),
            textStyle: const TextStyle(fontWeight: FontWeight.w600),
          ),
          icon: const Icon(Icons.qr_code_scanner_outlined),
          label: Text(texts.scanQrAction),
        ),
      ],
    );

    final Widget summaryCard = RepaintBoundary(
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(
            color: Theme.of(
              context,
            ).colorScheme.outlineVariant.withValues(alpha: 0.6),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final useWideSummary = constraints.maxWidth >= 900;
              final Widget sidePanel = Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  buildMetricsGrid(),
                  const SizedBox(height: _detailSectionSpacingLarge),
                  actionButtons,
                ],
              );

              if (useWideSummary) {
                final sidePanelWidth = constraints.maxWidth >= 1040
                    ? 340.0
                    : 312.0;
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: productSummary),
                    const SizedBox(width: _detailSectionSpacingLarge),
                    SizedBox(width: sidePanelWidth, child: sidePanel),
                  ],
                );
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  productSummary,
                  const SizedBox(height: 12),
                  sidePanel,
                ],
              );
            },
          ),
        ),
      ),
    );

    return Scaffold(
      appBar: AppBar(title: BrandAppBarTitle(texts.screenTitle)),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                summaryCard,
                const SizedBox(height: _detailSectionSpacingLarge),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _SerialFilterChip(
                      label: filterAllLabel,
                      selected: _filter == InventorySerialFilter.all,
                      onTap: () => _setFilter(InventorySerialFilter.all),
                    ),
                    _SerialFilterChip(
                      label: filterReadyLabel,
                      selected: _filter == InventorySerialFilter.ready,
                      onTap: () => _setFilter(InventorySerialFilter.ready),
                    ),
                    _SerialFilterChip(
                      label: filterWarrantyLabel,
                      selected: _filter == InventorySerialFilter.warranty,
                      onTap: () => _setFilter(InventorySerialFilter.warranty),
                    ),
                    _SerialFilterChip(
                      label: filterIssueLabel,
                      selected: _filter == InventorySerialFilter.issue,
                      onTap: () => _setFilter(InventorySerialFilter.issue),
                    ),
                  ],
                ),
                const SizedBox(height: _detailSectionSpacing),
                if (_remoteLoadErrorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: _detailSectionSpacing),
                    child: _SerialEmptyStateCard(
                      icon: Icons.sync_problem_outlined,
                      message: _remoteLoadErrorMessage!,
                      actionLabel: texts.retryAction,
                      onAction: _loadRemoteSerials,
                    ),
                  ),
                if (_isRemoteLoading && serialRecords.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(bottom: _detailSectionSpacing),
                    child: Center(
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                  )
                else if (serialRecords.isEmpty)
                  _SerialEmptyStateCard(
                    icon: Icons.inventory_2_outlined,
                    message: texts.noSerialsMessage,
                  )
                else if (filtered.isEmpty)
                  _SerialEmptyStateCard(
                    icon: Icons.filter_alt_off_outlined,
                    message: texts.filterEmptyMessage,
                    actionLabel: texts.clearFilterAction,
                    onAction: () => _setFilter(InventorySerialFilter.all),
                  )
                else
                  ...visibleSerials.map((record) {
                    final status = serialStatuses[record.serial]!;
                    return Padding(
                      padding: const EdgeInsets.only(
                        bottom: _detailItemSpacing,
                      ),
                      child: RepaintBoundary(
                        child: _SerialTile(
                          record: record,
                          status: status,
                          onOpenOrder: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) =>
                                    OrderDetailScreen(orderId: record.orderId),
                              ),
                            );
                          },
                          onCopy: () => _copySerial(record.serial),
                          onViewTimeline: remoteSerialByValue[record.serial] == null
                              ? null
                              : () => _openSerialTimeline(
                                  remoteSerialByValue[record.serial]!,
                                ),
                        ),
                      ),
                    );
                  }),
                if (hasMoreSerials) ...[
                  const SizedBox(height: 8),
                  const Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _setFilter(InventorySerialFilter filter) {
    setState(() {
      _filter = filter;
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

  Future<void> _openSerialTimeline(DealerInventorySerialRecord remoteRecord) async {
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
              return _InventoryTimelineSheet(
                detail: detail,
                texts: texts,
              );
            },
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

class _SerialEmptyStateCard extends StatelessWidget {
  const _SerialEmptyStateCard({
    required this.message,
    required this.icon,
    this.actionLabel,
    this.onAction,
  });

  final String message;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: colorScheme.primary, size: 24),
            const SizedBox(height: 10),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: onAction,
                icon: const Icon(Icons.restart_alt_rounded),
                label: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InventoryMetric extends StatelessWidget {
  const _InventoryMetric({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  final String label;
  final String value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 76),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 14, color: color),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: color,
                fontSize: 18,
                fontWeight: FontWeight.w800,
                height: 1.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SerialFilterChip extends StatelessWidget {
  const _SerialFilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _detailMinTapTarget),
      child: ChoiceChip(
        label: Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: colorScheme.onSurface),
        ),
        selected: selected,
        showCheckmark: false,
        onSelected: (_) => onTap(),
        selectedColor: colorScheme.secondaryContainer,
        backgroundColor: colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.38,
        ),
        side: BorderSide(
          color: colorScheme.outlineVariant.withValues(alpha: 0.8),
        ),
      ),
    );
  }
}

class _SerialTile extends StatelessWidget {
  const _SerialTile({
    required this.record,
    required this.status,
    required this.onOpenOrder,
    required this.onCopy,
    this.onViewTimeline,
  });

  final ImportedSerialRecord record;
  final ImportedSerialStatus status;
  final VoidCallback onOpenOrder;
  final VoidCallback onCopy;
  final VoidCallback? onViewTimeline;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryProductDetailTexts(context);
    final colorScheme = Theme.of(context).colorScheme;
    final color = switch (status) {
      ImportedSerialStatus.available ||
      ImportedSerialStatus.assigned => const Color(0xFF4ADE80),
      ImportedSerialStatus.warranty => const Color(0xFFFBBF24),
      ImportedSerialStatus.inspecting => const Color(0xFFFDE68A),
      ImportedSerialStatus.defective ||
      ImportedSerialStatus.returned => const Color(0xFFFCA5A5),
      ImportedSerialStatus.scrapped => const Color(0xFFCBD5E1),
      ImportedSerialStatus.reserved ||
      ImportedSerialStatus.unknown => const Color(0xFF93C5FD),
    };
    final statusLabel = switch (status) {
      ImportedSerialStatus.available ||
      ImportedSerialStatus.assigned => texts.readyStatusLabel,
      ImportedSerialStatus.warranty => texts.warrantyStatusLabel,
      ImportedSerialStatus.inspecting => texts.inspectingStatusLabel,
      ImportedSerialStatus.defective => texts.defectiveStatusLabel,
      ImportedSerialStatus.returned => texts.returnedStatusLabel,
      ImportedSerialStatus.scrapped => texts.scrappedStatusLabel,
      ImportedSerialStatus.reserved => texts.reservedStatusLabel,
      ImportedSerialStatus.unknown => texts.unknownStatusLabel,
    };

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    record.serial,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: colorScheme.onSurface,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    statusLabel,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: color.withValues(alpha: 0.84),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    texts.importedAtLabel(formatDateTime(record.importedAt)),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 2),
                  TextButton(
                    onPressed: onOpenOrder,
                    style: TextButton.styleFrom(
                      minimumSize: const Size(100, 48),
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.symmetric(horizontal: 0),
                      foregroundColor: colorScheme.primary,
                    ),
                    child: Text(
                      texts.orderLinkLabel(record.orderId),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w600,
                        decoration: TextDecoration.underline,
                        decorationThickness: 1.2,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            PopupMenuButton<String>(
              tooltip: texts.serialOptionsTooltip,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(
                minWidth: _detailMinTapTarget,
                minHeight: _detailMinTapTarget,
              ),
              onSelected: (value) {
                if (value == 'copy') {
                  onCopy();
                } else if (value == 'timeline') {
                  onViewTimeline?.call();
                }
              },
              itemBuilder: (_) => [
                if (onViewTimeline != null)
                  PopupMenuItem<String>(
                    value: 'timeline',
                    child: Text(texts.timelineAction),
                  ),
                PopupMenuItem<String>(
                  value: 'copy',
                  child: Text(texts.copySerialAction),
                ),
              ],
              child: Container(
                width: _detailMinTapTarget,
                height: _detailMinTapTarget,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.more_vert,
                  color: color.withValues(alpha: 0.88),
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InventoryTimelineSheet extends StatelessWidget {
  const _InventoryTimelineSheet({
    required this.detail,
    required this.texts,
  });

  final DealerInventorySerialDetailRecord detail;
  final _InventoryProductDetailTexts texts;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final serial = detail.serial.record;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 42,
              height: 4,
              decoration: BoxDecoration(
                color: colorScheme.outlineVariant.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            texts.timelineTitle(serial.serial),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${serial.productName} • ${serial.productSku}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),
          Flexible(
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: detail.timeline.isEmpty ? 1 : detail.timeline.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                if (detail.timeline.isEmpty) {
                  return _SerialEmptyStateCard(
                    icon: Icons.timeline_outlined,
                    message: texts.emptyTimelineMessage,
                  );
                }
                final entry = detail.timeline[index];
                final occurredAt = entry.occurredAt;
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest.withValues(
                      alpha: 0.32,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: colorScheme.outlineVariant.withValues(alpha: 0.55),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        entry.title,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: colorScheme.onSurface,
                        ),
                      ),
                      if (occurredAt != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          formatDateTime(occurredAt),
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ],
                      const SizedBox(height: 6),
                      Text(
                        entry.description,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _InventoryProductDetailTexts {
  const _InventoryProductDetailTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Inventory details' : 'Chi tiết kho';
  String filterAllLabel(int count) =>
      isEnglish ? 'All ($count)' : 'Tất cả ($count)';
  String filterReadyLabel(int count) =>
      isEnglish ? 'Ready ($count)' : 'Sẵn sàng ($count)';
  String filterWarrantyLabel(int count) =>
      isEnglish ? 'Warranty ($count)' : 'Bảo hành ($count)';
  String filterIssueLabel(int count) =>
      isEnglish ? 'Needs attention ($count)' : 'Cần xử lý ($count)';
  String productImageLabel(String productName) => isEnglish
      ? 'Product image for $productName'
      : 'Ảnh sản phẩm $productName';
  String latestImportedLabel(String dateTimeLabel) => isEnglish
      ? 'Latest import: $dateTimeLabel'
      : 'Nhập gần nhất: $dateTimeLabel';
  String get readyMetricLabel => isEnglish ? 'Ready' : 'Sẵn sàng';
  String get importedMetricLabel => isEnglish ? 'Imported' : 'Đã nhập';
  String get warrantyMetricLabel => isEnglish ? 'Warranty' : 'Bảo hành';
  String get issueMetricLabel => isEnglish ? 'Needs attention' : 'Cần xử lý';
  String get exportAction => isEnglish ? 'Export stock' : 'Xuất hàng';
  String get scanQrAction => isEnglish ? 'Scan QR' : 'Quét QR';
  String get noSerialsMessage => isEnglish
      ? 'This product does not have any serials yet.'
      : 'Sản phẩm này chưa có danh sách serial.';
  String get filterEmptyMessage => isEnglish
      ? 'No serial matches the selected filter.'
      : 'Không có serial phù hợp bộ lọc.';
  String get clearFilterAction => isEnglish ? 'Clear filter' : 'Xóa bộ lọc';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get invalidScannedCodeMessage =>
      isEnglish ? 'The scanned code is not valid.' : 'Mã quét không hợp lệ.';
  String copiedSerialMessage(String serial) =>
      isEnglish ? 'Copied serial $serial.' : 'Đã sao chép serial $serial.';
  String get readyStatusLabel => isEnglish ? 'Ready' : 'Sẵn sàng';
  String get warrantyStatusLabel =>
      isEnglish ? 'Under warranty' : 'Đang bảo hành';
  String get inspectingStatusLabel =>
      isEnglish ? 'Inspecting' : 'Đang kiểm định';
  String get defectiveStatusLabel => isEnglish ? 'Defective' : 'Lỗi';
  String get returnedStatusLabel => isEnglish ? 'Returned' : 'Trả về';
  String get scrappedStatusLabel => isEnglish ? 'Scrapped' : 'Đã loại bỏ';
  String get reservedStatusLabel => isEnglish ? 'Reserved' : 'Đã giữ chỗ';
  String get unknownStatusLabel =>
      isEnglish ? 'Unknown status' : 'Trạng thái không xác định';
  String importedAtLabel(String dateTimeLabel) =>
      isEnglish ? 'Imported: $dateTimeLabel' : 'Nhập: $dateTimeLabel';
  String orderLinkLabel(String orderId) =>
      isEnglish ? 'Order $orderId' : 'Đơn $orderId';
  String get serialOptionsTooltip =>
      isEnglish ? 'Serial options' : 'Tùy chọn serial';
  String get copySerialAction => isEnglish ? 'Copy serial' : 'Sao chép serial';
  String get timelineAction =>
      isEnglish ? 'View timeline' : 'Xem dòng thời gian';
  String timelineTitle(String serial) => isEnglish
      ? 'Serial timeline • $serial'
      : 'Dòng thời gian serial • $serial';
  String get emptyTimelineMessage => isEnglish
      ? 'No timeline entries are available for this serial yet.'
      : 'Chưa có mốc thời gian nào cho serial này.';
  String get timelineLoadFailedMessage => isEnglish
      ? 'Unable to load serial timeline right now.'
      : 'Không thể tải dòng thời gian serial lúc này.';
}
