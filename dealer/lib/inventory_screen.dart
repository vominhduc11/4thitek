import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

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

const int _lowStockThreshold = kLowStockThreshold;
const double _inventoryFabHeight = 56;
const double _inventoryFabBottomSpacing = 20;
const double _inventoryMinTapTarget = 48;
const int _inventoryPageSize = 12;
const double _inventorySectionSpacing = 16;
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
    final summaryCards = <Widget>[
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
    _filteredItemCount = filteredItems.length;
    final visibleItemCount = math.min(_visibleItemCount, filteredItems.length);
    final listBottomPadding =
        _inventoryFabHeight +
        kFloatingActionButtonMargin +
        _inventoryFabBottomSpacing +
        MediaQuery.paddingOf(context).bottom;
    final isTablet =
        MediaQuery.sizeOf(context).shortestSide >= AppBreakpoints.phone;
    final maxWidth = isTablet ? 1040.0 : double.infinity;

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(texts.screenTitle),
        actions: const [GlobalSearchIconButton()],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
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
                padding: EdgeInsets.fromLTRB(16, 12, 16, listBottomPadding),
                children: [
                  _InventorySyncBanner(
                    summary: texts.inventorySourceSummary(
                      warrantyController.lastRemoteSyncAt == null
                          ? null
                          : formatDateTime(warrantyController.lastRemoteSyncAt!),
                    ),
                    warningMessage: _syncWarningMessage,
                  ),
                  const SizedBox(height: _inventorySectionSpacing),
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
                  const SizedBox(height: _inventorySectionSpacing),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _FilterChip(
                        label: texts.filterAllLabel,
                        selected: _stockFilter == InventoryStockFilter.all,
                        onTap: () =>
                            _onStockFilterChanged(InventoryStockFilter.all),
                      ),
                      _FilterChip(
                        label: texts.filterInStockLabel,
                        selected: _stockFilter == InventoryStockFilter.inStock,
                        onTap: () =>
                            _onStockFilterChanged(InventoryStockFilter.inStock),
                      ),
                      _FilterChip(
                        label: texts.filterLowStockLabel,
                        selected: _stockFilter == InventoryStockFilter.lowStock,
                        onTap: () => _onStockFilterChanged(
                          InventoryStockFilter.lowStock,
                        ),
                      ),
                      _FilterChip(
                        label: texts.filterOutOfStockLabel,
                        selected:
                            _stockFilter == InventoryStockFilter.outOfStock,
                        onTap: () => _onStockFilterChanged(
                          InventoryStockFilter.outOfStock,
                        ),
                      ),
                      _MenuFilterButton(
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
                      _SortDirectionButton(
                        ascending:
                            _sortDirection == InventorySortDirection.ascending,
                        onTap: _toggleSortDirection,
                      ),
                    ],
                  ),
                  const SizedBox(height: _inventorySectionSpacing),
                  if (isTablet)
                    Row(
                      children: [
                        Expanded(child: summaryCards[0]),
                        const SizedBox(width: 8),
                        Expanded(child: summaryCards[1]),
                        const SizedBox(width: 8),
                        Expanded(child: summaryCards[2]),
                      ],
                    )
                  else
                    Wrap(spacing: 8, runSpacing: 8, children: summaryCards),
                  const SizedBox(height: _inventorySectionSpacingLarge),
                  if (inventoryItems.isEmpty)
                    _InventoryEmptyView(
                      onImport: () => unawaited(_handleQuickAction('import')),
                    )
                  else if (filteredItems.isEmpty)
                    _InventoryFilteredEmptyView(onClear: _clearFilters)
                  else ...[
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
      floatingActionButton: Semantics(
        button: true,
        label: texts.quickActionsLabel,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: FloatingActionButton.extended(
            onPressed: () => _showActionSheet(),
            tooltip: texts.quickActionsLabel,
            icon: const Icon(Icons.flash_on_outlined),
            label: Text(texts.quickActionsLabel),
          ),
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

  void _showActionSheet() {
    final texts = _inventoryTexts(context);
    final colorScheme = Theme.of(context).colorScheme;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      requestFocus: true,
      backgroundColor: Colors.transparent,
      barrierColor: colorScheme.scrim.withValues(alpha: 0.42),
      builder: (sheetContext) {
        void onSelect(String action) {
          Navigator.of(sheetContext).pop();
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) {
              return;
            }
            unawaited(_handleQuickAction(action));
          });
        }

        final sheetScheme = Theme.of(sheetContext).colorScheme;
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(20),
                bottom: Radius.circular(18),
              ),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: sheetScheme.surface.withValues(alpha: 0.95),
                    boxShadow: [
                      BoxShadow(
                        color: sheetScheme.shadow.withValues(alpha: 0.14),
                        blurRadius: 20,
                        offset: Offset(0, -4),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                color: sheetScheme.primaryContainer,
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Icon(
                                Icons.flash_on_rounded,
                                size: 14,
                                color: sheetScheme.onPrimaryContainer,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              texts.quickActionsLabel,
                              style: Theme.of(context).textTheme.titleSmall
                                  ?.copyWith(
                                    color: sheetScheme.onSurface,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          texts.quickActionsSubtitle,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: sheetScheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 14),
                        _QuickActionSheetItem(
                          icon: Icons.local_shipping_outlined,
                          title: texts.exportAction,
                          subtitle: texts.exportSubtitle,
                          tone: _QuickActionTone.primary,
                          onTap: () => onSelect('export'),
                        ),
                        const SizedBox(height: 8),
                        const SizedBox(height: 12),
                        const Divider(height: 1, thickness: 1),
                        const SizedBox(height: 12),
                        _QuickActionSheetItem(
                          icon: Icons.qr_code_scanner_outlined,
                          title: texts.scanQrBarcodeAction,
                          subtitle: texts.scanQrBarcodeSubtitle,
                          tone: _QuickActionTone.secondary,
                          onTap: () => onSelect('scan'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
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

class InventorySummary {
  const InventorySummary({
    required this.totalProducts,
    required this.totalQuantity,
    required this.lowStockProducts,
  });

  final int totalProducts;
  final int totalQuantity;
  final int lowStockProducts;
}

enum InventoryStockStatus { inStock, lowStock, outOfStock }

class InventoryProductItem {
  const InventoryProductItem({
    required this.product,
    required this.importedQuantity,
    required this.readyQuantity,
    required this.warrantyQuantity,
    required this.issueQuantity,
    required this.latestImportedAt,
    required this.orderIds,
    required this.serialSearchIndex,
  });

  final Product product;
  final int importedQuantity;
  final int readyQuantity;
  final int warrantyQuantity;
  final int issueQuantity;
  final DateTime latestImportedAt;
  final Set<String> orderIds;
  final String serialSearchIndex;

  InventoryStockStatus get stockStatus {
    if (readyQuantity <= 0) {
      return InventoryStockStatus.outOfStock;
    }
    if (readyQuantity <= _lowStockThreshold) {
      return InventoryStockStatus.lowStock;
    }
    return InventoryStockStatus.inStock;
  }
}

List<InventoryProductItem> _buildInventoryItems({
  required OrderController orderController,
  required WarrantyController warrantyController,
}) {
  final productMap = <String, Product>{};
  for (final order in orderController.orders) {
    for (final item in order.items) {
      productMap[item.product.id] = item.product;
    }
  }

  final map = <String, _InventoryAccumulator>{};
  for (final record in warrantyController.importedSerials) {
    final product =
        productMap[record.productId] ??
        Product(
          id: record.productId,
          name: record.productName,
          sku: record.productSku,
          shortDescription: '',
          price: 0,
          stock: 0,
          warrantyMonths: 0,
        );

    final current =
        map[record.productId] ??
        _InventoryAccumulator(
          product: product,
          importedQuantity: 0,
          latestImportedAt: record.importedAt,
          orderIds: <String>{},
          serials: <String>{},
        );

    if (record.importedAt.isAfter(current.latestImportedAt)) {
      current.latestImportedAt = record.importedAt;
    }
    current.orderIds.add(record.orderId);

    final normalized = warrantyController.normalizeSerial(record.serial);
    final isNewSerial = current.serials.add(normalized);
    if (!isNewSerial) {
      map[record.productId] = current;
      continue;
    }

    current.importedQuantity += 1;
    switch (record.status) {
      case ImportedSerialStatus.available:
      case ImportedSerialStatus.assigned:
        current.readyQuantity += 1;
      case ImportedSerialStatus.warranty:
        current.warrantyQuantity += 1;
      case ImportedSerialStatus.reserved:
      case ImportedSerialStatus.defective:
      case ImportedSerialStatus.returned:
      case ImportedSerialStatus.unknown:
        current.issueQuantity += 1;
    }
    map[record.productId] = current;
  }

  return map.values
      .map(
        (entry) => InventoryProductItem(
          product: entry.product,
          importedQuantity: entry.importedQuantity,
          readyQuantity: entry.readyQuantity,
          warrantyQuantity: entry.warrantyQuantity,
          issueQuantity: entry.issueQuantity,
          latestImportedAt: entry.latestImportedAt,
          orderIds: entry.orderIds,
          serialSearchIndex: entry.serials.join(' '),
        ),
      )
      .toList(growable: false);
}

List<InventoryProductItem> _filterAndSortItems({
  required List<InventoryProductItem> items,
  required String query,
  required InventoryStockFilter stockFilter,
  required InventorySortOption sortOption,
  required bool sortAscending,
}) {
  final keyword = query.trim().toLowerCase();
  final filtered = items
      .where((item) {
        if (stockFilter == InventoryStockFilter.inStock &&
            item.stockStatus != InventoryStockStatus.inStock) {
          return false;
        }
        if (stockFilter == InventoryStockFilter.lowStock &&
            item.stockStatus != InventoryStockStatus.lowStock) {
          return false;
        }
        if (stockFilter == InventoryStockFilter.outOfStock &&
            item.stockStatus != InventoryStockStatus.outOfStock) {
          return false;
        }

        if (keyword.isEmpty) {
          return true;
        }
        final blob =
            '${item.product.name} ${item.product.sku} ${item.serialSearchIndex}'
                .toLowerCase();
        return blob.contains(keyword);
      })
      .toList(growable: false);

  filtered.sort((a, b) {
    final compare = switch (sortOption) {
      InventorySortOption.name => a.product.name.toLowerCase().compareTo(
        b.product.name.toLowerCase(),
      ),
      InventorySortOption.quantity => a.readyQuantity.compareTo(
        b.readyQuantity,
      ),
      InventorySortOption.importedDate => a.latestImportedAt.compareTo(
        b.latestImportedAt,
      ),
    };
    return sortAscending ? compare : -compare;
  });
  return filtered;
}

InventorySummary _buildSummary(List<InventoryProductItem> items) {
  var totalQuantity = 0;
  var lowStockProducts = 0;
  for (final item in items) {
    totalQuantity += item.readyQuantity;
    if (item.stockStatus == InventoryStockStatus.lowStock) {
      lowStockProducts++;
    }
  }
  return InventorySummary(
    totalProducts: items.length,
    totalQuantity: totalQuantity,
    lowStockProducts: lowStockProducts,
  );
}

class _InventoryAccumulator {
  _InventoryAccumulator({
    required this.product,
    required this.importedQuantity,
    required this.latestImportedAt,
    required this.orderIds,
    required this.serials,
  });

  final Product product;
  int importedQuantity;
  DateTime latestImportedAt;
  final Set<String> orderIds;
  final Set<String> serials;
  int readyQuantity = 0;
  int warrantyQuantity = 0;
  int issueQuantity = 0;
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 88),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 16, color: color),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    height: 1.3,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: color,
                fontSize: 20,
                fontWeight: FontWeight.w800,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              helperText,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.92),
                fontSize: 11,
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

enum _QuickActionTone { primary, secondary }

class _QuickActionSheetItem extends StatelessWidget {
  const _QuickActionSheetItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.tone,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final _QuickActionTone tone;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isPrimary = tone == _QuickActionTone.primary;
    final iconColor = isPrimary
        ? colorScheme.primary
        : colorScheme.onSurfaceVariant;
    final surfaceColor = isPrimary
        ? colorScheme.primaryContainer.withValues(alpha: 0.58)
        : colorScheme.surfaceContainerHighest.withValues(alpha: 0.55);
    final borderColor = isPrimary
        ? colorScheme.primary.withValues(alpha: 0.34)
        : colorScheme.outlineVariant.withValues(alpha: 0.72);
    final titleColor = isPrimary ? colorScheme.primary : colorScheme.onSurface;

    return Material(
      color: Colors.transparent,
      child: Ink(
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          splashColor: iconColor.withValues(alpha: 0.12),
          highlightColor: iconColor.withValues(alpha: 0.06),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 54),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: colorScheme.surface.withValues(alpha: 0.95),
                      borderRadius: BorderRadius.circular(9),
                    ),
                    alignment: Alignment.center,
                    child: Icon(icon, size: 18, color: iconColor),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          title,
                          style: Theme.of(context).textTheme.bodyLarge
                              ?.copyWith(
                                color: titleColor,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: iconColor.withValues(alpha: 0.72),
                    size: 20,
                  ),
                ],
              ),
            ),
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
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isCompact = screenWidth <= 380;
    final rightColumnWidth = isCompact ? 104.0 : 150.0;
    late final String status;
    late final Color statusColor;
    late final IconData statusIcon;
    switch (item.stockStatus) {
      case InventoryStockStatus.inStock:
        status = texts.inStockStatus;
        statusColor = isDark
            ? const Color(0xFF4ADE80)
            : const Color(0xFF166534);
        statusIcon = Icons.check_circle_outline;
      case InventoryStockStatus.lowStock:
        status = texts.lowStockStatus;
        statusColor = isDark
            ? const Color(0xFFFBBF24)
            : const Color(0xFF9A3412);
        statusIcon = Icons.warning_amber_rounded;
      case InventoryStockStatus.outOfStock:
        status = texts.outOfStockStatus;
        statusColor = isDark
            ? const Color(0xFFFCA5A5)
            : const Color(0xFFB91C1C);
        statusIcon = Icons.remove_circle_outline;
    }

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
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(
            color: Theme.of(
              context,
            ).colorScheme.outlineVariant.withValues(alpha: 0.6),
          ),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Semantics(
                  image: true,
                  label: texts.productImageLabel(item.product.name),
                  child: ExcludeSemantics(
                    child: ProductImage(
                      product: item.product,
                      width: 72,
                      height: 72,
                      borderRadius: BorderRadius.circular(10),
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
                        item.product.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: colorScheme.onSurface,
                          fontSize: 17,
                          height: 1.25,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'SKU: ${item.product.sku}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                          fontSize: 11.5,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      RichText(
                        text: TextSpan(
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: colorScheme.onSurface,
                                fontSize: 15,
                                height: 1.2,
                              ),
                          children: [
                            TextSpan(text: texts.stockLabelPrefix),
                            TextSpan(
                              text: '${item.readyQuantity}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (item.warrantyQuantity > 0) ...[
                        const SizedBox(height: 4),
                        Text(
                          texts.warrantyCountLabel(item.warrantyQuantity),
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                                fontSize: 12,
                                height: 1.25,
                              ),
                        ),
                      ],
                      if (item.issueQuantity > 0) ...[
                        const SizedBox(height: 4),
                        Text(
                          texts.issueCountLabel(item.issueQuantity),
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                                fontSize: 12,
                                height: 1.25,
                              ),
                        ),
                      ],
                    ],
                  ),
                ),
                SizedBox(width: isCompact ? 4 : 8),
                SizedBox(
                  width: rightColumnWidth,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                            color: statusColor.withValues(alpha: 0.28),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(statusIcon, size: 12, color: statusColor),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                status,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(
                                      color: statusColor,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        isCompact
                            ? formatDate(item.latestImportedAt)
                            : texts.latestImportedLabel(
                                formatDate(item.latestImportedAt),
                              ),
                        maxLines: isCompact ? 1 : 2,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.right,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                          fontSize: 12,
                          height: 1.25,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
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
      padding: EdgeInsets.fromLTRB(16, 12, 16, bottomPadding),
      children: [
        const _SkeletonBox(height: 48, radius: 12),
        const SizedBox(height: _inventorySectionSpacing),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(
            6,
            (_) => const _SkeletonBox(width: 96, height: 44, radius: 20),
          ),
        ),
        const SizedBox(height: _inventorySectionSpacing),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(
            3,
            (_) => const _SkeletonBox(width: 156, height: 52, radius: 12),
          ),
        ),
        const SizedBox(height: _inventorySectionSpacingLarge),
        ...List.generate(
          5,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: _inventoryListItemSpacing),
            child: _SkeletonBox(height: 102, radius: 14),
          ),
        ),
      ],
    );
  }
}

class _InventorySyncBanner extends StatelessWidget {
  const _InventorySyncBanner({
    required this.summary,
    this.warningMessage,
  });

  final String summary;
  final String? warningMessage;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final hasWarning = warningMessage != null && warningMessage!.trim().isNotEmpty;
    final backgroundColor = hasWarning
        ? colorScheme.errorContainer.withValues(alpha: 0.55)
        : colorScheme.primaryContainer.withValues(alpha: 0.38);
    final borderColor = hasWarning
        ? colorScheme.error.withValues(alpha: 0.35)
        : colorScheme.primary.withValues(alpha: 0.24);
    final iconColor = hasWarning ? colorScheme.error : colorScheme.primary;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            hasWarning ? Icons.sync_problem_outlined : Icons.info_outline,
            color: iconColor,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  summary,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (hasWarning) ...[
                  const SizedBox(height: 6),
                  Text(
                    warningMessage!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SkeletonBox extends StatefulWidget {
  const _SkeletonBox({
    this.width = double.infinity,
    required this.height,
    this.radius = 10,
  });

  final double width;
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
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: pulse,
            borderRadius: BorderRadius.circular(widget.radius),
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 52),
            const SizedBox(height: 10),
            Text(
              message ?? texts.loadInventoryErrorMessage,
              textAlign: TextAlign.center,
            ),
            if (details != null && details!.trim().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                details!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: onRetry,
              style: ElevatedButton.styleFrom(minimumSize: const Size(128, 46)),
              child: Text(texts.retryAction),
            ),
          ],
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.inventory_2_outlined, size: 64),
            const SizedBox(height: 12),
            Text(
              texts.emptyInventoryTitle,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(texts.emptyInventorySubtitle, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            Semantics(
              button: true,
              label: texts.importStockAction,
              child: ElevatedButton.icon(
                onPressed: onImport,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(132, 46),
                ),
                icon: const Icon(Icons.playlist_add_check_circle_outlined),
                label: Text(texts.importStockAction),
              ),
            ),
          ],
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.filter_alt_off_outlined, size: 44),
            const SizedBox(height: 10),
            Text(texts.filteredEmptyMessage, textAlign: TextAlign.center),
            const SizedBox(height: 10),
            TextButton(
              onPressed: onClear,
              style: TextButton.styleFrom(minimumSize: const Size(116, 48)),
              child: Text(texts.clearFiltersAction),
            ),
          ],
        ),
      ),
    );
  }
}

class _InventoryTexts {
  const _InventoryTexts({required this.isEnglish});

  final bool isEnglish;
  String inventorySourceSummary(String? warrantySyncAt) {
    if (isEnglish) {
      if (warrantySyncAt != null) {
        return 'Inventory is synced from dealer-owned serials. Latest serial sync: $warrantySyncAt.';
      }
      return 'Inventory is synced from dealer-owned serials in the backend inventory.';
    }
    if (warrantySyncAt != null) {
      return 'Kho dang dong bo truc tiep tu serial thuoc dealer. Lan dong bo serial gan nhat: $warrantySyncAt.';
    }
    return 'Kho dang dong bo truc tiep tu serial thuoc dealer tren backend.';
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
        return isEnglish ? 'Sort: Ready stock' : 'Sap xep: San sang';
      case InventorySortOption.importedDate:
        return isEnglish ? 'Sort: Imported date' : 'Sắp xếp: Ngày nhập';
    }
  }

  String get totalProductsLabel =>
      isEnglish ? 'Total products' : 'Tổng sản phẩm';
  String get totalProductsHelperText =>
      isEnglish ? 'Tracked SKUs' : 'SKU đang theo dõi';
  String get totalInventoryLabel =>
      isEnglish ? 'Ready inventory' : 'Ton kho san sang';
  String get totalInventoryHelperText =>
      isEnglish ? 'Ready serials' : 'Serial san sang';
  String get lowStockSummaryLabel => isEnglish ? 'Low stock' : 'Sắp hết hàng';
  String get lowStockSummaryHelperText =>
      isEnglish ? 'Needs replenishment soon' : 'Cần nhập thêm sớm';
  String get filterAllLabel => isEnglish ? 'All' : 'Tất cả';
  String get filterInStockLabel => isEnglish ? 'Ready' : 'San sang';
  String get filterLowStockLabel => isEnglish ? 'Low stock' : 'Sắp hết';
  String get filterOutOfStockLabel => isEnglish ? 'Out of stock' : 'Hết hàng';
  String get sortByNameOption => isEnglish ? 'By name' : 'Theo tên';
  String get sortByQuantityOption =>
      isEnglish ? 'By ready quantity' : 'Theo so luong san sang';
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
  String get quickActionsLabel => isEnglish ? 'Quick actions' : 'Tác vụ nhanh';
  String get quickActionsSubtitle => isEnglish
      ? 'Export is the primary action'
      : 'Xuất hàng là thao tác chính';
  String get exportAction => isEnglish ? 'Export stock' : 'Xuất hàng';
  String get exportSubtitle => isEnglish
      ? 'Start stock export by serial'
      : 'Kích hoạt xuất kho theo serial';
  String get scanQrBarcodeAction =>
      isEnglish ? 'Scan QR / Barcode' : 'Quét QR / Barcode';
  String get scanQrBarcodeSubtitle => isEnglish
      ? 'Look up serials using the camera'
      : 'Tra cứu serial bằng camera';
  String get invalidScannedCodeMessage =>
      isEnglish ? 'The scanned code is not valid.' : 'Mã quét không hợp lệ.';
  String get inStockStatus => isEnglish ? 'Ready' : 'San sang';
  String get lowStockStatus => isEnglish ? 'Low stock' : 'Sắp hết';
  String get outOfStockStatus => isEnglish ? 'Out of stock' : 'Hết hàng';
  String productTileSemantic(
    String name,
    String sku,
    int quantity,
    String status,
  ) => isEnglish
      ? '$name, SKU $sku, ready $quantity, status $status'
      : '$name, SKU $sku, san sang $quantity, trang thai $status';
  String productImageLabel(String productName) => isEnglish
      ? 'Product image for $productName'
      : 'Ảnh sản phẩm $productName';
  String get stockLabelPrefix => isEnglish ? 'Ready: ' : 'San sang: ';
  String warrantyCountLabel(int count) =>
      isEnglish ? 'Warranty: $count' : 'Bao hanh: $count';
  String issueCountLabel(int count) => isEnglish
      ? 'Issue / unavailable: $count'
      : 'Loi / khong kha dung: $count';
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
