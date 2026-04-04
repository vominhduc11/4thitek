import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'global_search.dart';
import 'inventory_product_detail_screen.dart';
import 'models.dart';
import 'order_controller.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'warranty_export_screen.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/product_image.dart';

part 'inventory_screen_support.dart';

const int _lowStockThreshold = kLowStockThreshold;
const double _inventoryMinTapTarget = 48;
const int _inventoryPageSize = 12;
const double _inventorySectionSpacingLarge = 20;
const double _inventoryListItemSpacing = 10;

_InventoryTexts _inventoryTexts(BuildContext context) => _InventoryTexts(
  isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
);

enum InventoryLoadState { loading, ready, error }

enum InventoryStockFilter { all, inStock, lowStock, outOfStock }

enum InventorySortOption { name, quantity, importedDate }

enum InventorySortDirection { ascending, descending }

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({
    super.key,
    this.initialStockFilter = InventoryStockFilter.all,
  });

  final InventoryStockFilter initialStockFilter;

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  Timer? _searchDebounce;
  OrderController? _observedOrderController;
  WarrantyController? _observedWarrantyController;
  List<InventoryProductItem> _cachedInventoryItems =
      const <InventoryProductItem>[];
  bool _inventoryCacheDirty = true;
  InventoryLoadState _loadState = InventoryLoadState.loading;
  bool _hasScheduledInitialReload = false;
  String? _syncWarningMessage;
  String? _loadErrorMessage;

  String _query = '';
  InventoryStockFilter _stockFilter = InventoryStockFilter.all;
  InventorySortOption _sortOption = InventorySortOption.importedDate;
  InventorySortDirection _sortDirection = InventorySortDirection.descending;
  int _visibleItemCount = _inventoryPageSize;
  int _filteredItemCount = 0;

  @override
  void initState() {
    super.initState();
    _stockFilter = widget.initialStockFilter;
    _scrollController.addListener(_handleListScroll);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final nextOrderController = OrderScope.of(context);
    if (!identical(_observedOrderController, nextOrderController)) {
      _observedOrderController?.removeListener(_markInventoryCacheDirty);
      _observedOrderController = nextOrderController;
      _observedOrderController?.addListener(_markInventoryCacheDirty);
      _inventoryCacheDirty = true;
    }

    final nextWarrantyController = WarrantyScope.of(context);
    if (!identical(_observedWarrantyController, nextWarrantyController)) {
      _observedWarrantyController?.removeListener(_markInventoryCacheDirty);
      _observedWarrantyController = nextWarrantyController;
      _observedWarrantyController?.addListener(_markInventoryCacheDirty);
      _inventoryCacheDirty = true;
    }

    if (!_hasScheduledInitialReload) {
      _hasScheduledInitialReload = true;
      unawaited(_reload());
    }
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _observedOrderController?.removeListener(_markInventoryCacheDirty);
    _observedWarrantyController?.removeListener(_markInventoryCacheDirty);
    _searchController.dispose();
    _scrollController
      ..removeListener(_handleListScroll)
      ..dispose();
    super.dispose();
  }

  void _markInventoryCacheDirty() {
    if (!mounted) return;
    setState(() {
      _inventoryCacheDirty = true;
    });
  }

  Future<void> _reload() async {
    if (!mounted) {
      return;
    }
    final texts = _inventoryTexts(context);
    final orderController = OrderScope.of(context);
    final warrantyController = WarrantyScope.of(context);
    setState(() {
      _loadState = InventoryLoadState.loading;
      _visibleItemCount = _inventoryPageSize;
      _syncWarningMessage = null;
      _loadErrorMessage = null;
    });
    await Future.wait<void>([
      orderController.refresh(),
      warrantyController.load(forceRefresh: true),
    ]);
    if (!mounted) {
      return;
    }

    final warnings = <String>{};
    if (orderController.lastActionMessage != null) {
      warnings.add(
        orderControllerErrorMessage(
          orderController.lastActionMessage,
          isEnglish: texts.isEnglish,
        ),
      );
    }
    if (warrantyController.lastSyncMessage != null) {
      warnings.add(
        warrantySyncErrorMessage(
          warrantyController.lastSyncMessage,
          isEnglish: texts.isEnglish,
        ),
      );
    }
    final warningMessage = warnings.isEmpty ? null : warnings.join('\n');

    _inventoryCacheDirty = true;
    final nextInventoryItems = _buildInventoryItems(
      orderController: orderController,
      warrantyController: warrantyController,
    );
    final hasFreshData =
        orderController.lastActionMessage == null &&
        warrantyController.lastSyncMessage == null;
    final shouldShowError = nextInventoryItems.isEmpty && !hasFreshData;

    setState(() {
      _inventoryCacheDirty = true;
      _visibleItemCount = _inventoryPageSize;
      _syncWarningMessage = warningMessage;
      _loadErrorMessage = shouldShowError
          ? (warningMessage ?? texts.loadInventoryErrorMessage)
          : null;
      _loadState = shouldShowError
          ? InventoryLoadState.error
          : InventoryLoadState.ready;
    });
  }

  void _handleListScroll() {
    if (_loadState != InventoryLoadState.ready ||
        !_scrollController.hasClients) {
      return;
    }
    if (_visibleItemCount >= _filteredItemCount) {
      return;
    }
    if (_scrollController.position.extentAfter > 280) {
      return;
    }
    setState(() {
      _visibleItemCount = math.min(
        _visibleItemCount + _inventoryPageSize,
        _filteredItemCount,
      );
    });
  }

  void _jumpToTop() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 250), () {
      if (!mounted) {
        return;
      }
      _applySearchQuery(value);
    });
  }

  void _applySearchQuery(String value) {
    setState(() {
      _query = value;
      _visibleItemCount = _inventoryPageSize;
    });
    _jumpToTop();
  }

  void _onStockFilterChanged(InventoryStockFilter value) {
    setState(() {
      _stockFilter = value;
      _visibleItemCount = _inventoryPageSize;
    });
    _jumpToTop();
  }

  void _onSortChanged(InventorySortOption value) {
    setState(() {
      if (_sortOption != value) {
        _sortOption = value;
        _sortDirection = _defaultSortDirectionFor(value);
      }
      _visibleItemCount = _inventoryPageSize;
    });
    _jumpToTop();
  }

  void _toggleSortDirection() {
    setState(() {
      _sortDirection = _sortDirection == InventorySortDirection.ascending
          ? InventorySortDirection.descending
          : InventorySortDirection.ascending;
      _visibleItemCount = _inventoryPageSize;
    });
    _jumpToTop();
  }

  InventorySortDirection _defaultSortDirectionFor(InventorySortOption option) {
    return switch (option) {
      InventorySortOption.name => InventorySortDirection.ascending,
      InventorySortOption.quantity ||
      InventorySortOption.importedDate => InventorySortDirection.descending,
    };
  }

  void _clearSearchQuery() {
    _searchDebounce?.cancel();
    _searchController.clear();
    _applySearchQuery('');
  }

  List<InventoryProductItem> _resolveInventoryItems({
    required OrderController orderController,
    required WarrantyController warrantyController,
  }) {
    if (!_inventoryCacheDirty &&
        identical(orderController, _observedOrderController) &&
        identical(warrantyController, _observedWarrantyController)) {
      return _cachedInventoryItems;
    }
    _cachedInventoryItems = _buildInventoryItems(
      orderController: orderController,
      warrantyController: warrantyController,
    );
    _inventoryCacheDirty = false;
    return _cachedInventoryItems;
  }

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final orderController = OrderScope.of(context);
    final warrantyController = WarrantyScope.of(context);
    final inventoryItems = _resolveInventoryItems(
      orderController: orderController,
      warrantyController: warrantyController,
    );

    final filteredItems = _filterAndSortItems(
      items: inventoryItems,
      query: _query,
      stockFilter: _stockFilter,
      sortOption: _sortOption,
      sortAscending: _sortDirection == InventorySortDirection.ascending,
    );

    final summary = _buildSummary(inventoryItems);
    final sortLabel = texts.sortLabel(_sortOption);
    final heroMetrics = <Widget>[
      _SummaryChip(
        label: texts.totalProductsLabel,
        value: '${summary.totalProducts}',
        color: const Color(0xFF1D4ED8),
        icon: Icons.inventory_2_outlined,
        helperText: texts.totalProductsHelperText,
      ),
      _SummaryChip(
        label: texts.totalInventoryLabel,
        value: '${summary.totalQuantity}',
        color: const Color(0xFF047857),
        icon: Icons.stacked_bar_chart_outlined,
        helperText: texts.totalInventoryHelperText,
      ),
      _SummaryChip(
        label: texts.lowStockSummaryLabel,
        value: '${summary.lowStockProducts}',
        color: const Color(0xFFB45309),
        icon: Icons.warning_amber_rounded,
        helperText: texts.lowStockSummaryHelperText,
      ),
    ];
    final warningMessage = _syncWarningMessage?.trim();
    final hasActiveFilters =
        _query.trim().isNotEmpty ||
        _stockFilter != InventoryStockFilter.all ||
        _sortOption != InventorySortOption.importedDate ||
        _sortDirection != InventorySortDirection.descending;
    _filteredItemCount = filteredItems.length;
    final visibleItemCount = math.min(_visibleItemCount, filteredItems.length);
    final listBottomPadding = 28 + MediaQuery.paddingOf(context).bottom;
    final layout = _InventoryLayoutConfig.fromContext(context);

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(texts.screenTitle),
        actions: const [GlobalSearchIconButton()],
      ),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: layout.contentMaxWidth),
          child: switch (_loadState) {
            InventoryLoadState.loading => _InventoryLoadingView(
              bottomPadding: listBottomPadding,
            ),
            InventoryLoadState.error => _InventoryErrorView(
              onRetry: _reload,
              message: _loadErrorMessage,
              details: _syncWarningMessage,
            ),
            InventoryLoadState.ready => RefreshIndicator(
              onRefresh: _reload,
              child: ListView(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                keyboardDismissBehavior:
                    ScrollViewKeyboardDismissBehavior.onDrag,
                padding: EdgeInsets.fromLTRB(16, 16, 16, listBottomPadding),
                children: [
                  _InventoryHeroCard(
                    headline: texts.heroTitle,
                    summary: texts.inventorySourceSummary(
                      warrantyController.lastRemoteSyncAt == null
                          ? null
                          : formatDateTime(
                              warrantyController.lastRemoteSyncAt!,
                            ),
                    ),
                    warningMessage: warningMessage,
                    metrics: heroMetrics,
                    primaryActionLabel: texts.exportAction,
                    primaryActionIcon: Icons.local_shipping_outlined,
                    onPrimaryAction: () =>
                        unawaited(_handleQuickAction('export')),
                    secondaryActionLabel: texts.scanQrBarcodeAction,
                    secondaryActionIcon: Icons.qr_code_scanner_outlined,
                    onSecondaryAction: () =>
                        unawaited(_handleQuickAction('scan')),
                  ),
                  const SizedBox(height: _inventorySectionSpacingLarge),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceContainerLow.withValues(
                        alpha: 0.92,
                      ),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: colorScheme.outlineVariant.withValues(
                          alpha: 0.86,
                        ),
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
                                    texts.controlPanelLabel,
                                    style: theme.textTheme.labelLarge?.copyWith(
                                      color: colorScheme.primary,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    texts.inventoryResultsSummary(
                                      filteredItems.length,
                                      inventoryItems.length,
                                    ),
                                    style: theme.textTheme.titleSmall?.copyWith(
                                      color: colorScheme.onSurface,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (hasActiveFilters)
                              TextButton.icon(
                                onPressed: _clearFilters,
                                icon: const Icon(Icons.restart_alt_rounded),
                                label: Text(texts.clearFiltersAction),
                              ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Semantics(
                          textField: true,
                          label: texts.searchSemantic,
                          child: TextField(
                            controller: _searchController,
                            onChanged: _onSearchChanged,
                            decoration: InputDecoration(
                              prefixIcon: const Icon(Icons.search),
                              hintText: texts.searchHint,
                              suffixIcon: _query.isNotEmpty
                                  ? IconButton(
                                      tooltip: texts.clearSearchTooltip,
                                      onPressed: _clearSearchQuery,
                                      icon: const Icon(Icons.close_rounded),
                                    )
                                  : null,
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(
                              child: _MenuFilterButton(
                                label:
                                    '$sortLabel ${_sortDirection == InventorySortDirection.ascending ? '↑' : '↓'}',
                                items: [
                                  PopupMenuItem<String>(
                                    value: 'name',
                                    child: Text(texts.sortByNameOption),
                                  ),
                                  PopupMenuItem<String>(
                                    value: 'quantity',
                                    child: Text(texts.sortByQuantityOption),
                                  ),
                                  PopupMenuItem<String>(
                                    value: 'importedDate',
                                    child: Text(texts.sortByImportedDateOption),
                                  ),
                                ],
                                onSelected: (value) {
                                  _onSortChanged(switch (value) {
                                    'name' => InventorySortOption.name,
                                    'quantity' => InventorySortOption.quantity,
                                    _ => InventorySortOption.importedDate,
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 10),
                            _SortDirectionButton(
                              ascending:
                                  _sortDirection ==
                                  InventorySortDirection.ascending,
                              onTap: _toggleSortDirection,
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              _FilterChip(
                                label: texts.filterAllLabel,
                                selected:
                                    _stockFilter == InventoryStockFilter.all,
                                onTap: () => _onStockFilterChanged(
                                  InventoryStockFilter.all,
                                ),
                              ),
                              const SizedBox(width: 8),
                              _FilterChip(
                                label: texts.filterInStockLabel,
                                selected:
                                    _stockFilter ==
                                    InventoryStockFilter.inStock,
                                onTap: () => _onStockFilterChanged(
                                  InventoryStockFilter.inStock,
                                ),
                              ),
                              const SizedBox(width: 8),
                              _FilterChip(
                                label: texts.filterLowStockLabel,
                                selected:
                                    _stockFilter ==
                                    InventoryStockFilter.lowStock,
                                onTap: () => _onStockFilterChanged(
                                  InventoryStockFilter.lowStock,
                                ),
                              ),
                              const SizedBox(width: 8),
                              _FilterChip(
                                label: texts.filterOutOfStockLabel,
                                selected:
                                    _stockFilter ==
                                    InventoryStockFilter.outOfStock,
                                onTap: () => _onStockFilterChanged(
                                  InventoryStockFilter.outOfStock,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: _inventorySectionSpacingLarge),
                  if (inventoryItems.isEmpty)
                    _InventoryEmptyView(
                      onImport: () => unawaited(_handleQuickAction('import')),
                    )
                  else if (filteredItems.isEmpty)
                    _InventoryFilteredEmptyView(onClear: _clearFilters)
                  else ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                texts.catalogSectionTitle,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  color: colorScheme.onSurface,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                texts.catalogSectionSubtitle(
                                  filteredItems.length,
                                ),
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: colorScheme.onSurfaceVariant,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (summary.lowStockProducts > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(
                                0xFFB45309,
                              ).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(
                                color: const Color(
                                  0xFFB45309,
                                ).withValues(alpha: 0.3),
                              ),
                            ),
                            child: Text(
                              texts.lowStockHighlight(summary.lowStockProducts),
                              style: theme.textTheme.labelMedium?.copyWith(
                                color: const Color(0xFFF6AD55),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    if (layout.showWideGrid)
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: visibleItemCount,
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: layout.tileColumnCount,
                          mainAxisSpacing: _inventoryListItemSpacing,
                          crossAxisSpacing: 12,
                          mainAxisExtent: 214,
                        ),
                        itemBuilder: (context, index) {
                          final item = filteredItems[index];
                          return _InventoryProductTile(
                            item: item,
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => InventoryProductDetailScreen(
                                    product: item.product,
                                    readyQuantity: item.readyQuantity,
                                    importedQuantity: item.importedQuantity,
                                    warrantyQuantity: item.warrantyQuantity,
                                    issueQuantity: item.issueQuantity,
                                    orderIds: item.orderIds.toList(
                                      growable: false,
                                    ),
                                    latestImportedAt: item.latestImportedAt,
                                  ),
                                ),
                              );
                            },
                          );
                        },
                      )
                    else
                      for (var index = 0; index < visibleItemCount; index++)
                        Padding(
                          padding: const EdgeInsets.only(
                            bottom: _inventoryListItemSpacing,
                          ),
                          child: _InventoryProductTile(
                            item: filteredItems[index],
                            onTap: () {
                              final item = filteredItems[index];
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => InventoryProductDetailScreen(
                                    product: item.product,
                                    readyQuantity: item.readyQuantity,
                                    importedQuantity: item.importedQuantity,
                                    warrantyQuantity: item.warrantyQuantity,
                                    issueQuantity: item.issueQuantity,
                                    orderIds: item.orderIds.toList(
                                      growable: false,
                                    ),
                                    latestImportedAt: item.latestImportedAt,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                    if (visibleItemCount < filteredItems.length)
                      const Padding(
                        padding: EdgeInsets.only(top: 4, bottom: 4),
                        child: Center(
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                      ),
                  ],
                ],
              ),
            ),
          },
        ),
      ),
    );
  }

  void _clearFilters() {
    _searchDebounce?.cancel();
    _searchController.clear();
    setState(() {
      _query = '';
      _stockFilter = InventoryStockFilter.all;
      _sortOption = InventorySortOption.importedDate;
      _sortDirection = InventorySortDirection.descending;
      _visibleItemCount = _inventoryPageSize;
    });
    _jumpToTop();
  }

  Future<void> _handleQuickAction(String action) async {
    if (!mounted) {
      return;
    }
    switch (action) {
      case 'scan':
        await _handleScanSerial();
        return;
      case 'export':
        if (!mounted) {
          return;
        }
        Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => const WarrantyExportScreen()));
        return;
    }
  }

  Future<void> _handleScanSerial() async {
    final texts = _inventoryTexts(context);
    final scannedValue = await Navigator.of(
      context,
    ).push<String>(MaterialPageRoute(builder: (_) => const SerialScanScreen()));
    if (!mounted || scannedValue == null) {
      return;
    }

    final warrantyController = WarrantyScope.of(context);
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

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
    required this.helperText,
  });

  final String label;
  final String value;
  final Color color;
  final IconData icon;
  final String helperText;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colorScheme.surface.withValues(alpha: 0.46),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withValues(alpha: 0.22)),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 104, minWidth: 132),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Icon(icon, size: 18, color: color),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    label,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      height: 1.3,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              value,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: color,
                fontSize: 24,
                fontWeight: FontWeight.w800,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              helperText,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.94),
                fontSize: 11,
                height: 1.35,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
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
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _inventoryMinTapTarget),
        child: ChoiceChip(
          label: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: selected
                  ? colorScheme.onSecondaryContainer
                  : colorScheme.onSurface,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
          selected: selected,
          showCheckmark: false,
          labelPadding: const EdgeInsets.symmetric(horizontal: 2),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          materialTapTargetSize: MaterialTapTargetSize.padded,
          selectedColor: colorScheme.secondaryContainer,
          backgroundColor: colorScheme.surfaceContainerHighest.withValues(
            alpha: 0.42,
          ),
          side: BorderSide(
            color: colorScheme.outlineVariant.withValues(alpha: 0.8),
          ),
          onSelected: (_) => onTap(),
        ),
      ),
    );
  }
}

class _MenuFilterButton extends StatelessWidget {
  const _MenuFilterButton({
    required this.label,
    required this.items,
    required this.onSelected,
  });

  final String label;
  final List<PopupMenuEntry<String>> items;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    final colorScheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: texts.openSortMenuSemantic,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _inventoryMinTapTarget),
        child: PopupMenuButton<String>(
          onSelected: onSelected,
          itemBuilder: (_) => items,
          tooltip: texts.sortTooltip,
          child: Container(
            constraints: const BoxConstraints(
              minWidth: _inventoryMinTapTarget,
              minHeight: _inventoryMinTapTarget,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: ShapeDecoration(
              color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
              shape: StadiumBorder(
                side: BorderSide(
                  color: colorScheme.outlineVariant.withValues(alpha: 0.78),
                ),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    label,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Icon(
                  Icons.unfold_more_rounded,
                  size: 18,
                  color: colorScheme.onSurfaceVariant,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SortDirectionButton extends StatelessWidget {
  const _SortDirectionButton({required this.ascending, required this.onTap});

  final bool ascending;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    final colorScheme = Theme.of(context).colorScheme;
    final label = texts.sortDirectionLabel(ascending);
    return Semantics(
      button: true,
      label: texts.sortDirectionSemantic(label),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _inventoryMinTapTarget),
        child: IconButton(
          tooltip: texts.sortDirectionTooltip(label),
          onPressed: onTap,
          style: IconButton.styleFrom(
            minimumSize: const Size(
              _inventoryMinTapTarget,
              _inventoryMinTapTarget,
            ),
            backgroundColor: colorScheme.surfaceContainerHighest.withValues(
              alpha: 0.4,
            ),
            side: BorderSide(
              color: colorScheme.outlineVariant.withValues(alpha: 0.78),
            ),
          ),
          icon: Icon(
            ascending
                ? Icons.arrow_upward_rounded
                : Icons.arrow_downward_rounded,
            size: 18,
            color: colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}

class _InventoryProductTile extends StatelessWidget {
  const _InventoryProductTile({required this.item, required this.onTap});

  final InventoryProductItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    late final String status;
    late final Color statusColor;
    late final IconData statusIcon;
    switch (item.stockStatus) {
      case InventoryStockStatus.inStock:
        status = texts.inStockStatus;
        statusColor = const Color(0xFF4ADE80);
        statusIcon = Icons.check_circle_outline;
      case InventoryStockStatus.lowStock:
        status = texts.lowStockStatus;
        statusColor = const Color(0xFFFBBF24);
        statusIcon = Icons.warning_amber_rounded;
      case InventoryStockStatus.outOfStock:
        status = texts.outOfStockStatus;
        statusColor = const Color(0xFFFCA5A5);
        statusIcon = Icons.remove_circle_outline;
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final isCompact = constraints.maxWidth <= 380;
        return Semantics(
          button: true,
          label: texts.productTileSemantic(
            item.product.name,
            item.product.sku,
            item.readyQuantity,
            status,
          ),
          child: Card(
            elevation: 1,
            shadowColor: colorScheme.shadow.withValues(alpha: 0.1),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
              side: BorderSide(color: statusColor.withValues(alpha: 0.16)),
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Semantics(
                          image: true,
                          label: texts.productImageLabel(item.product.name),
                          child: ExcludeSemantics(
                            child: ProductImage(
                              product: item.product,
                              width: 84,
                              height: 84,
                              borderRadius: BorderRadius.circular(14),
                              fit: BoxFit.cover,
                              iconSize: 22,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.product.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  color: colorScheme.onSurface,
                                  fontSize: 18,
                                  height: 1.2,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: colorScheme.surfaceContainerLow
                                      .withValues(alpha: 0.82),
                                  borderRadius: BorderRadius.circular(999),
                                  border: Border.all(
                                    color: colorScheme.outlineVariant
                                        .withValues(alpha: 0.76),
                                  ),
                                ),
                                child: Text(
                                  'SKU: ${item.product.sku}',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                    fontSize: 11.5,
                                    height: 1.2,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Icon(
                                    Icons.schedule_rounded,
                                    size: 14,
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      texts.latestImportedLabel(
                                        formatDate(item.latestImportedAt),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(
                                            color: colorScheme.onSurfaceVariant,
                                            fontSize: 12,
                                          ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 6,
                              ),
                              constraints: BoxConstraints(
                                maxWidth: isCompact ? 120 : 150,
                              ),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(
                                  color: statusColor.withValues(alpha: 0.24),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    statusIcon,
                                    size: 13,
                                    color: statusColor,
                                  ),
                                  const SizedBox(width: 5),
                                  Flexible(
                                    child: Text(
                                      status,
                                      overflow: TextOverflow.ellipsis,
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(
                                            color: statusColor,
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w700,
                                          ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 22),
                            Container(
                              width: 34,
                              height: 34,
                              decoration: BoxDecoration(
                                color: colorScheme.surfaceContainerLow
                                    .withValues(alpha: 0.88),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: colorScheme.outlineVariant.withValues(
                                    alpha: 0.76,
                                  ),
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Icon(
                                Icons.arrow_outward_rounded,
                                size: 18,
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _InventoryMetricTag(
                          icon: Icons.inventory_2_outlined,
                          label: texts.stockMetricLabel,
                          value: '${item.readyQuantity}',
                          accentColor: const Color(0xFF1D4ED8),
                        ),
                        if (item.warrantyQuantity > 0)
                          _InventoryMetricTag(
                            icon: Icons.verified_outlined,
                            label: texts.warrantyMetricLabel,
                            value: '${item.warrantyQuantity}',
                            accentColor: const Color(0xFF0F9D8B),
                          ),
                        if (item.issueQuantity > 0)
                          _InventoryMetricTag(
                            icon: Icons.report_gmailerrorred_outlined,
                            label: texts.issueMetricLabel,
                            value: '${item.issueQuantity}',
                            accentColor: const Color(0xFFB45309),
                          ),
                        if (item.importedQuantity > 0 &&
                            item.importedQuantity != item.readyQuantity)
                          _InventoryMetricTag(
                            icon: Icons.stacked_bar_chart_outlined,
                            label: texts.importedMetricLabel,
                            value: '${item.importedQuantity}',
                            accentColor: colorScheme.onSurfaceVariant,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _InventoryLoadingView extends StatelessWidget {
  const _InventoryLoadingView({required this.bottomPadding});

  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(16, 16, 16, bottomPadding),
      children: [
        const _SkeletonBox(height: 220, radius: 24),
        const SizedBox(height: _inventorySectionSpacingLarge),
        const _SkeletonBox(height: 192, radius: 24),
        const SizedBox(height: _inventorySectionSpacingLarge),
        ...List.generate(
          5,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: _inventoryListItemSpacing),
            child: _SkeletonBox(height: 174, radius: 18),
          ),
        ),
      ],
    );
  }
}

class _InventoryHeroCard extends StatelessWidget {
  const _InventoryHeroCard({
    required this.headline,
    required this.summary,
    required this.metrics,
    required this.primaryActionLabel,
    required this.primaryActionIcon,
    required this.onPrimaryAction,
    required this.secondaryActionLabel,
    required this.secondaryActionIcon,
    required this.onSecondaryAction,
    this.warningMessage,
  });

  final String headline;
  final String summary;
  final String? warningMessage;
  final List<Widget> metrics;
  final String primaryActionLabel;
  final IconData primaryActionIcon;
  final VoidCallback onPrimaryAction;
  final String secondaryActionLabel;
  final IconData secondaryActionIcon;
  final VoidCallback onSecondaryAction;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final hasWarning =
        warningMessage != null && warningMessage!.trim().isNotEmpty;
    final accentColor = hasWarning ? colorScheme.error : colorScheme.primary;
    final metricWidth = MediaQuery.sizeOf(context).width >= 640 ? 176.0 : 148.0;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            (hasWarning
                    ? colorScheme.errorContainer
                    : colorScheme.primaryContainer)
                .withValues(alpha: hasWarning ? 0.54 : 0.64),
            colorScheme.surfaceContainerHigh.withValues(alpha: 0.96),
          ],
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: accentColor.withValues(alpha: 0.22)),
        boxShadow: [
          BoxShadow(
            color: colorScheme.shadow.withValues(alpha: 0.2),
            blurRadius: 24,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _InventoryStatusPill(
                icon: Icons.sync_rounded,
                label: texts.liveSyncLabel,
                accentColor: accentColor,
              ),
              if (hasWarning)
                _InventoryStatusPill(
                  icon: Icons.priority_high_rounded,
                  label: texts.syncAttentionLabel,
                  accentColor: colorScheme.error,
                ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            headline,
            style: theme.textTheme.headlineSmall?.copyWith(
              color: colorScheme.onSurface,
              fontWeight: FontWeight.w800,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            summary,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
              height: 1.5,
            ),
          ),
          if (hasWarning) ...[
            const SizedBox(height: 10),
            Text(
              warningMessage!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onErrorContainer,
                fontWeight: FontWeight.w600,
                height: 1.45,
              ),
            ),
          ],
          const SizedBox(height: 18),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (final metric in metrics)
                SizedBox(width: metricWidth, child: metric),
            ],
          ),
          const SizedBox(height: 18),
          LayoutBuilder(
            builder: (context, constraints) {
              final buttonWidth = constraints.maxWidth >= 520
                  ? (constraints.maxWidth - 10) / 2
                  : double.infinity;
              return Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  SizedBox(
                    width: buttonWidth,
                    child: FilledButton.icon(
                      onPressed: onPrimaryAction,
                      icon: Icon(primaryActionIcon),
                      label: Text(primaryActionLabel),
                    ),
                  ),
                  SizedBox(
                    width: buttonWidth,
                    child: OutlinedButton.icon(
                      onPressed: onSecondaryAction,
                      icon: Icon(secondaryActionIcon),
                      label: Text(secondaryActionLabel),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _InventoryStatusPill extends StatelessWidget {
  const _InventoryStatusPill({
    required this.icon,
    required this.label,
    required this.accentColor,
  });

  final IconData icon;
  final String label;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: colorScheme.surface.withValues(alpha: 0.48),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: accentColor.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: accentColor),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: colorScheme.onSurface,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _InventoryMetricTag extends StatelessWidget {
  const _InventoryMetricTag({
    required this.icon,
    required this.label,
    required this.value,
    required this.accentColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color accentColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerLow.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: accentColor.withValues(alpha: 0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: accentColor),
          const SizedBox(width: 8),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            value,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: accentColor,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _SkeletonBox extends StatefulWidget {
  const _SkeletonBox({required this.height, this.radius = 10});

  final double height;
  final double radius;

  @override
  State<_SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<_SkeletonBox>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 980),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final baseColor =
        Color.lerp(
          colorScheme.surfaceContainerHighest,
          colorScheme.surfaceContainerLow,
          0.55,
        ) ??
        colorScheme.surfaceContainerHighest;
    final highlightColor =
        Color.lerp(baseColor, colorScheme.surface, 0.35) ?? colorScheme.surface;

    return AnimatedBuilder(
      animation: _controller,
      builder: (_, _) {
        final pulse =
            Color.lerp(baseColor, highlightColor, _controller.value) ??
            baseColor;
        return RepaintBoundary(
          child: Container(
            width: double.infinity,
            height: widget.height,
            decoration: BoxDecoration(
              color: pulse,
              borderRadius: BorderRadius.circular(widget.radius),
            ),
          ),
        );
      },
    );
  }
}

class _InventoryErrorView extends StatelessWidget {
  const _InventoryErrorView({
    required this.onRetry,
    this.message,
    this.details,
  });

  final VoidCallback onRetry;
  final String? message;
  final String? details;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: _InventoryStateCard(
          icon: Icons.sync_problem_outlined,
          title: message ?? texts.loadInventoryErrorMessage,
          description: details,
          tone: _InventoryStateTone.error,
          action: ElevatedButton.icon(
            onPressed: onRetry,
            style: ElevatedButton.styleFrom(minimumSize: const Size(132, 46)),
            icon: const Icon(Icons.refresh_outlined),
            label: Text(texts.retryAction),
          ),
        ),
      ),
    );
  }
}

class _InventoryEmptyView extends StatelessWidget {
  const _InventoryEmptyView({required this.onImport});

  final VoidCallback onImport;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: _InventoryStateCard(
          icon: Icons.inventory_2_outlined,
          title: texts.emptyInventoryTitle,
          description: texts.emptyInventorySubtitle,
          tone: _InventoryStateTone.info,
          action: Semantics(
            button: true,
            label: texts.importStockAction,
            child: ElevatedButton.icon(
              onPressed: onImport,
              style: ElevatedButton.styleFrom(minimumSize: const Size(132, 46)),
              icon: const Icon(Icons.playlist_add_check_circle_outlined),
              label: Text(texts.importStockAction),
            ),
          ),
        ),
      ),
    );
  }
}

class _InventoryFilteredEmptyView extends StatelessWidget {
  const _InventoryFilteredEmptyView({required this.onClear});

  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 30),
      child: Center(
        child: _InventoryStateCard(
          icon: Icons.filter_alt_off_outlined,
          title: texts.filteredEmptyMessage,
          tone: _InventoryStateTone.neutral,
          action: TextButton(
            onPressed: onClear,
            style: TextButton.styleFrom(minimumSize: const Size(116, 48)),
            child: Text(texts.clearFiltersAction),
          ),
        ),
      ),
    );
  }
}

enum _InventoryStateTone { info, error, neutral }

class _InventoryStateCard extends StatelessWidget {
  const _InventoryStateCard({
    required this.icon,
    required this.title,
    required this.tone,
    this.description,
    this.action,
  });

  final IconData icon;
  final String title;
  final _InventoryStateTone tone;
  final String? description;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isError = tone == _InventoryStateTone.error;
    final isInfo = tone == _InventoryStateTone.info;
    final background = isError
        ? colors.errorContainer.withValues(alpha: 0.42)
        : isInfo
        ? colors.primaryContainer.withValues(alpha: 0.32)
        : colors.surfaceContainerHighest.withValues(alpha: 0.45);
    final borderColor = isError
        ? colors.error.withValues(alpha: 0.28)
        : isInfo
        ? colors.primary.withValues(alpha: 0.22)
        : colors.outlineVariant.withValues(alpha: 0.72);
    final iconColor = isError
        ? colors.error
        : isInfo
        ? colors.primary
        : colors.onSurfaceVariant;

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 420),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 42, color: iconColor),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            if (description != null && description!.trim().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                description!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colors.onSurfaceVariant,
                  height: 1.4,
                ),
              ),
            ],
            if (action != null) ...[const SizedBox(height: 14), action!],
          ],
        ),
      ),
    );
  }
}

class _InventoryTexts {
  const _InventoryTexts({required this.isEnglish});

  final bool isEnglish;

  String get heroTitle => isEnglish
      ? 'Track ready serial stock and move outbound tasks faster.'
      : 'Theo dõi serial sẵn sàng và xử lý xuất kho nhanh hơn.';
  String get liveSyncLabel =>
      isEnglish ? 'Live dealer sync' : 'Đồng bộ trực tiếp';
  String get syncAttentionLabel =>
      isEnglish ? 'Needs attention' : 'Cần kiểm tra';
  String get controlPanelLabel =>
      isEnglish ? 'Search and refine' : 'Tìm kiếm và tinh chỉnh';
  String inventoryResultsSummary(int filteredCount, int totalCount) => isEnglish
      ? '$filteredCount of $totalCount tracked SKUs visible'
      : 'Hiển thị $filteredCount / $totalCount SKU đang theo dõi';
  String get catalogSectionTitle =>
      isEnglish ? 'Tracked inventory' : 'Danh sách SKU';
  String catalogSectionSubtitle(int filteredCount) => isEnglish
      ? '$filteredCount products match the current view'
      : '$filteredCount sản phẩm khớp bộ lọc hiện tại';
  String lowStockHighlight(int count) =>
      isEnglish ? '$count low-stock SKUs' : '$count SKU sắp hết';

  String inventorySourceSummary(String? warrantySyncAt) {
    if (isEnglish) {
      if (warrantySyncAt != null) {
        return 'Inventory is synced from dealer-owned serials. Latest serial sync: $warrantySyncAt.';
      }
      return 'Inventory is synced from dealer-owned serials in the backend inventory.';
    }
    if (warrantySyncAt != null) {
      return 'Kho đang đồng bộ trực tiếp từ serial thuộc dealer. Lần đồng bộ serial gần nhất: $warrantySyncAt.';
    }
    return 'Kho đang đồng bộ trực tiếp từ serial thuộc dealer trên backend.';
  }

  String get screenTitle => isEnglish ? 'Inventory' : 'Kho';
  String get searchSemantic => isEnglish
      ? 'Search products by name, SKU, or serial'
      : 'Tìm kiếm sản phẩm theo tên, SKU hoặc serial';
  String get searchHint => isEnglish
      ? 'Search by product name, SKU, or serial'
      : 'Tìm theo tên sản phẩm, SKU, serial';
  String get clearSearchTooltip => isEnglish ? 'Clear search' : 'Xóa tìm kiếm';
  String sortLabel(InventorySortOption option) {
    switch (option) {
      case InventorySortOption.name:
        return isEnglish ? 'Sort: Name' : 'Sắp xếp: Tên';
      case InventorySortOption.quantity:
        return isEnglish ? 'Sort: Ready stock' : 'Sắp xếp: Sẵn sàng';
      case InventorySortOption.importedDate:
        return isEnglish ? 'Sort: Imported date' : 'Sắp xếp: Ngày nhập';
    }
  }

  String get totalProductsLabel =>
      isEnglish ? 'Total products' : 'Tổng sản phẩm';
  String get totalProductsHelperText =>
      isEnglish ? 'Tracked SKUs' : 'SKU đang theo dõi';
  String get totalInventoryLabel =>
      isEnglish ? 'Ready inventory' : 'Tồn kho sẵn sàng';
  String get totalInventoryHelperText =>
      isEnglish ? 'Ready serials' : 'Serial sẵn sàng';
  String get lowStockSummaryLabel => isEnglish ? 'Low stock' : 'Sắp hết hàng';
  String get lowStockSummaryHelperText =>
      isEnglish ? 'Needs replenishment soon' : 'Cần nhập thêm sớm';
  String get filterAllLabel => isEnglish ? 'All' : 'Tất cả';
  String get filterInStockLabel => isEnglish ? 'Ready' : 'Sẵn sàng';
  String get filterLowStockLabel => isEnglish ? 'Low stock' : 'Sắp hết';
  String get filterOutOfStockLabel => isEnglish ? 'Out of stock' : 'Hết hàng';
  String get sortByNameOption => isEnglish ? 'By name' : 'Theo tên';
  String get sortByQuantityOption =>
      isEnglish ? 'By ready quantity' : 'Theo số lượng sẵn sàng';
  String get sortByImportedDateOption =>
      isEnglish ? 'By imported date' : 'Theo ngày nhập';
  String get openSortMenuSemantic =>
      isEnglish ? 'Open sort menu' : 'Mở bộ lọc sắp xếp';
  String get sortTooltip => isEnglish ? 'Sort' : 'Sắp xếp';
  String sortDirectionLabel(bool ascending) => ascending
      ? (isEnglish ? 'Ascending' : 'Tăng dần')
      : (isEnglish ? 'Descending' : 'Giảm dần');
  String sortDirectionSemantic(String label) => isEnglish
      ? 'Change sort direction, currently $label'
      : 'Đổi chiều sắp xếp, hiện tại $label';
  String sortDirectionTooltip(String label) => isEnglish
      ? 'Change sort direction ($label)'
      : 'Đổi chiều sắp xếp ($label)';
  String get exportAction => isEnglish ? 'Export stock' : 'Xuất hàng';
  String get scanQrBarcodeAction =>
      isEnglish ? 'Scan QR / Barcode' : 'Quét QR / Barcode';
  String get invalidScannedCodeMessage =>
      isEnglish ? 'The scanned code is not valid.' : 'Mã quét không hợp lệ.';
  String get inStockStatus => isEnglish ? 'Ready' : 'Sẵn sàng';
  String get lowStockStatus => isEnglish ? 'Low stock' : 'Sắp hết';
  String get outOfStockStatus => isEnglish ? 'Out of stock' : 'Hết hàng';
  String productTileSemantic(
    String name,
    String sku,
    int quantity,
    String status,
  ) => isEnglish
      ? '$name, SKU $sku, ready $quantity, status $status'
      : '$name, SKU $sku, sẵn sàng $quantity, trạng thái $status';
  String productImageLabel(String productName) => isEnglish
      ? 'Product image for $productName'
      : 'Ảnh sản phẩm $productName';
  String get stockMetricLabel => isEnglish ? 'Ready' : 'Sẵn sàng';
  String get warrantyMetricLabel => isEnglish ? 'Warranty' : 'Bảo hành';
  String get issueMetricLabel => isEnglish ? 'Issue' : 'Sự cố';
  String get importedMetricLabel => isEnglish ? 'Imported' : 'Đã nhập';
  String latestImportedLabel(String dateLabel) =>
      isEnglish ? 'Latest import: $dateLabel' : 'Nhập gần nhất: $dateLabel';
  String get loadInventoryErrorMessage => isEnglish
      ? 'Unable to load inventory data. Please try again.'
      : 'Không thể tải dữ liệu kho. Vui lòng thử lại.';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get emptyInventoryTitle =>
      isEnglish ? 'Inventory is empty.' : 'Kho chưa có sản phẩm.';
  String get emptyInventorySubtitle => isEnglish
      ? 'Import goods from the distributor to start managing inventory.'
      : 'Nhập hàng từ nhà phân phối để bắt đầu quản lý kho.';
  String get importStockAction => isEnglish ? 'Import stock' : 'Nhập hàng';
  String get filteredEmptyMessage => isEnglish
      ? 'No products match the current filter.'
      : 'Không có sản phẩm phù hợp bộ lọc hiện tại.';
  String get clearFiltersAction => isEnglish ? 'Clear filters' : 'Xóa bộ lọc';
}
