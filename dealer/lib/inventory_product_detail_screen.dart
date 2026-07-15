import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dealer_navigation.dart';
import 'inventory_service.dart';
import 'models.dart';
import 'return_request_service.dart';
import 'return_request_ui_support.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'warranty_controller.dart';
import 'warranty_export_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/product_image.dart';

part 'inventory_product_detail_serial_logic.dart';
part 'inventory_product_detail_widgets.dart';
part 'inventory_product_detail_texts.dart';

enum InventorySerialFilter { all, ready, warranty, issue }

const double _detailSectionSpacing = 16;
const double _detailSectionSpacingLarge = 18;
const double _detailItemSpacing = 10;
const double _detailMinTapTarget = 48;
const int _initialVisibleSerialCount = 40;
const int _visibleSerialStep = 40;

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
    this.returnRequestService,
  });

  final Product product;
  final int readyQuantity;
  final int importedQuantity;
  final int warrantyQuantity;
  final int issueQuantity;
  final List<String> orderIds;
  final DateTime latestImportedAt;
  final InventoryService? inventoryService;
  final ReturnRequestService? returnRequestService;

  @override
  State<InventoryProductDetailScreen> createState() =>
      _InventoryProductDetailScreenState();
}

class _InventoryProductDetailScreenState
    extends State<InventoryProductDetailScreen> {
  final ScrollController _scrollController = ScrollController();
  late final InventoryService _inventoryService;
  late final ReturnRequestService _returnRequestService;
  InventorySerialFilter _filter = InventorySerialFilter.all;
  String _serialQuery = '';
  int _visibleSerialCount = _initialVisibleSerialCount;
  int _filteredSerialCount = 0;
  List<DealerInventorySerialRecord>? _remoteSerials;
  final Map<int, _SerialReturnIndicator> _returnIndicatorBySerialId =
      <int, _SerialReturnIndicator>{};
  String? _remoteLoadErrorMessage;
  bool _isRemoteLoading = false;

  @override
  void initState() {
    super.initState();
    _inventoryService = widget.inventoryService ?? InventoryService();
    _returnRequestService =
        widget.returnRequestService ?? ReturnRequestService();
    _scrollController.addListener(_handleSerialListScroll);
    unawaited(_loadRemoteSerials());
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_handleSerialListScroll)
      ..dispose();
    if (widget.returnRequestService == null) {
      _returnRequestService.close();
    }
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
      unawaited(_prefetchReturnIndicators(serials.take(12).toList()));
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
      for (final item
          in _remoteSerials ?? const <DealerInventorySerialRecord>[])
        item.record.serial: item,
    };

    final serialRecords =
        _remoteSerials
            ?.map((record) => record.record)
            .toList(growable: false) ??
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
    final normalizedQuery = _serialQuery.trim().toLowerCase();
    final hasSearchQuery = normalizedQuery.isNotEmpty;

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
          if (hasSearchQuery) {
            final serialMatch = record.serial.toLowerCase().contains(
              normalizedQuery,
            );
            final orderMatch = record.orderId.toLowerCase().contains(
              normalizedQuery,
            );
            if (!serialMatch && !orderMatch) {
              return false;
            }
          }
          return true;
        })
        .toList(growable: false);
    _filteredSerialCount = filtered.length;
    final visibleSerials = filtered
        .take(_visibleSerialCount)
        .toList(growable: false);
    final hasMoreSerials = visibleSerials.length < _filteredSerialCount;
    final visibleCount = visibleSerials.length;
    final progressRatio = _filteredSerialCount <= 0
        ? 0.0
        : (visibleCount / _filteredSerialCount).clamp(0.0, 1.0);
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
        FilledButton.icon(
          onPressed: canExport
              ? () {
                  unawaited(_handleScanSerialForProduct(warrantyController));
                }
              : null,
          style: FilledButton.styleFrom(
            minimumSize: const Size(120, 48),
            padding: const EdgeInsets.symmetric(horizontal: 14),
            textStyle: const TextStyle(fontWeight: FontWeight.w700),
          ),
          icon: const Icon(Icons.qr_code_scanner_outlined),
          label: Text(texts.scanForExportAction),
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
                  const SizedBox(height: 8),
                  Text(
                    texts.scanForExportHint,
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
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
      appBar: AppBar(
        toolbarHeight: 72,
        title: _InventoryDetailAppBarTitle(
          screenTitle: texts.screenTitle,
          productName: widget.product.name,
          productSku: productSku,
        ),
      ),
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
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: colorScheme.outlineVariant.withValues(alpha: 0.6),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextField(
                          onChanged: _setSerialQuery,
                          textInputAction: TextInputAction.search,
                          decoration: InputDecoration(
                            prefixIcon: const Icon(Icons.search_rounded),
                            suffixIcon: _serialQuery.trim().isEmpty
                                ? null
                                : IconButton(
                                    tooltip: texts.clearSearchAction,
                                    onPressed: () => _setSerialQuery(''),
                                    icon: const Icon(Icons.close_rounded),
                                  ),
                            hintText: texts.searchSerialHint,
                            isDense: true,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _SerialFilterChip(
                              label: filterAllLabel,
                              selected: _filter == InventorySerialFilter.all,
                              onTap: () =>
                                  _setFilter(InventorySerialFilter.all),
                            ),
                            _SerialFilterChip(
                              label: filterReadyLabel,
                              selected: _filter == InventorySerialFilter.ready,
                              onTap: () =>
                                  _setFilter(InventorySerialFilter.ready),
                            ),
                            _SerialFilterChip(
                              label: filterWarrantyLabel,
                              selected:
                                  _filter == InventorySerialFilter.warranty,
                              onTap: () =>
                                  _setFilter(InventorySerialFilter.warranty),
                            ),
                            _SerialFilterChip(
                              label: filterIssueLabel,
                              selected: _filter == InventorySerialFilter.issue,
                              onTap: () =>
                                  _setFilter(InventorySerialFilter.issue),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: _detailSectionSpacing),
                if (_remoteLoadErrorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(
                      bottom: _detailSectionSpacing,
                    ),
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
                    message: hasSearchQuery
                        ? texts.searchEmptyMessage
                        : texts.filterEmptyMessage,
                    actionLabel: hasSearchQuery
                        ? texts.clearSearchAction
                        : texts.clearFilterAction,
                    onAction: hasSearchQuery
                        ? () => _setSerialQuery('')
                        : () => _setFilter(InventorySerialFilter.all),
                  )
                else
                  ..._buildSerialTiles(
                    context: context,
                    visibleSerials: visibleSerials,
                    serialStatuses: serialStatuses,
                    remoteSerialByValue: remoteSerialByValue,
                    isWideLayout: isWideLayout,
                    colorScheme: colorScheme,
                    texts: texts,
                  ),
                if (filtered.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  _SerialProgressPanel(
                    shownCount: visibleCount,
                    filteredCount: _filteredSerialCount,
                    totalCount: importedCount,
                    progress: progressRatio,
                    summaryLabel: texts.serialVisibilitySummary(
                      visibleCount,
                      _filteredSerialCount,
                      importedCount,
                    ),
                    loadingHint: hasMoreSerials ? texts.loadingMoreHint : null,
                  ),
                ],
                if (hasMoreSerials) ...[
                  const SizedBox(height: 10),
                  Center(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        setState(() {
                          _visibleSerialCount =
                              (_visibleSerialCount + _visibleSerialStep) >
                                  _filteredSerialCount
                              ? _filteredSerialCount
                              : _visibleSerialCount + _visibleSerialStep;
                        });
                      },
                      icon: const Icon(Icons.unfold_more_rounded),
                      label: Text(
                        texts.loadMoreSerialsAction(
                          (_filteredSerialCount - visibleCount).clamp(0, 99999),
                        ),
                      ),
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
}
