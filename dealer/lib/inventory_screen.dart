import 'dart:async';

import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dealer_navigation.dart';
import 'global_search.dart';
import 'inventory_product_detail_screen.dart';
import 'inventory_service.dart';
import 'models.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'warranty_export_screen.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/product_image.dart';
import 'dealer_routes.dart';

part 'inventory_screen_support.dart';
part 'inventory_filter_controls.dart';
part 'inventory_product_tile.dart';
part 'inventory_header_controls.dart';
part 'inventory_overview.dart';
part 'inventory_state_views.dart';
part 'inventory_texts.dart';

const int _lowStockThreshold = kLowStockThreshold;
const double _inventoryMinTapTarget = 48;
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
    this.inventoryService,
    this.showFallbackNavigation = true,
  });

  final InventoryStockFilter initialStockFilter;
  final InventoryService? inventoryService;
  final bool showFallbackNavigation;

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  Timer? _searchDebounce;
  late final InventoryService _inventoryService;
  List<InventoryProductItem> _cachedInventoryItems =
      const <InventoryProductItem>[];
  InventoryLoadState _loadState = InventoryLoadState.loading;
  bool _hasScheduledInitialReload = false;
  String? _syncWarningMessage;
  String? _loadErrorMessage;

  String _query = '';
  InventoryStockFilter _stockFilter = InventoryStockFilter.all;
  InventorySortOption _sortOption = InventorySortOption.importedDate;
  InventorySortDirection _sortDirection = InventorySortDirection.descending;

  @override
  void initState() {
    super.initState();
    _stockFilter = widget.initialStockFilter;
    _inventoryService = widget.inventoryService ?? InventoryService();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_hasScheduledInitialReload) {
      _hasScheduledInitialReload = true;
      unawaited(_reload());
    }
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _inventoryService.close();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    if (!mounted) {
      return;
    }
    final texts = _inventoryTexts(context);
    setState(() {
      _loadState = InventoryLoadState.loading;
      _syncWarningMessage = null;
      _loadErrorMessage = null;
    });
    try {
      final summary = await _inventoryService.fetchSummary();
      if (!mounted) {
        return;
      }
      _cachedInventoryItems = summary.items
          .map(_mapRemoteInventoryItem)
          .toList(growable: false);
      setState(() {
        _syncWarningMessage = null;
        _loadErrorMessage = null;
        _loadState = InventoryLoadState.ready;
      });
      return;
    } on InventoryException catch (error) {
      final warningMessage = resolveInventoryServiceMessage(
        error.message,
        isEnglish: texts.isEnglish,
      );
      setState(() {
        _syncWarningMessage = warningMessage;
        _loadErrorMessage = warningMessage;
        _loadState = InventoryLoadState.error;
      });
      return;
    } catch (_) {
      setState(() {
        _syncWarningMessage = null;
        _loadErrorMessage = texts.loadInventoryErrorMessage;
        _loadState = InventoryLoadState.error;
      });
      return;
    }
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
    });
    _jumpToTop();
  }

  void _onStockFilterChanged(InventoryStockFilter value) {
    setState(() {
      _stockFilter = value;
    });
    _jumpToTop();
  }

  void _onSortChanged(InventorySortOption value) {
    setState(() {
      if (_sortOption != value) {
        _sortOption = value;
        _sortDirection = _defaultSortDirectionFor(value);
      }
    });
    _jumpToTop();
  }

  void _toggleSortDirection() {
    setState(() {
      _sortDirection = _sortDirection == InventorySortDirection.ascending
          ? InventorySortDirection.descending
          : InventorySortDirection.ascending;
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

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final warrantyController = WarrantyScope.of(context);
    final inventoryItems = _cachedInventoryItems;

    final filteredItems = _filterAndSortItems(
      items: inventoryItems,
      query: _query,
      stockFilter: _stockFilter,
      sortOption: _sortOption,
      sortAscending: _sortDirection == InventorySortDirection.ascending,
    );
    final sortLabel = texts.sortLabel(_sortOption);
    final filteredLowStockCount = filteredItems
        .where((item) => item.stockStatus == InventoryStockStatus.lowStock)
        .length;
    final totalLowStockCount = inventoryItems
        .where((item) => item.stockStatus == InventoryStockStatus.lowStock)
        .length;
    final totalOutOfStockCount = inventoryItems
        .where((item) => item.stockStatus == InventoryStockStatus.outOfStock)
        .length;
    final showLowStockBanner =
        (totalLowStockCount + totalOutOfStockCount) > 0 &&
        _stockFilter == InventoryStockFilter.all;
    const heroMetrics = <Widget>[];
    final warningMessage = _syncWarningMessage?.trim();
    final hasActiveFilters =
        _query.trim().isNotEmpty ||
        _stockFilter != InventoryStockFilter.all ||
        _sortOption != InventorySortOption.importedDate ||
        _sortDirection != InventorySortDirection.descending;
    final listBottomPadding = 24 + MediaQuery.paddingOf(context).bottom;
    final layout = _InventoryLayoutConfig.fromContext(context);

    return Scaffold(
      appBar: AppBar(
        leading: widget.showFallbackNavigation
            ? const DealerFallbackBackButton(fallbackPath: DealerRoutePath.home)
            : null,
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
            InventoryLoadState.ready => Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Column(
                children: [
                  _InventoryControlsCard(
                    key: const ValueKey<String>('inventory-controls-panel'),
                    layout: layout,
                    texts: texts,
                    filteredCount: filteredItems.length,
                    totalCount: inventoryItems.length,
                    searchController: _searchController,
                    sortLabel: sortLabel,
                    sortDirection: _sortDirection,
                    stockFilter: _stockFilter,
                    hasActiveFilters: hasActiveFilters,
                    onSearchChanged: _onSearchChanged,
                    onClearSearch: _clearSearchQuery,
                    onSortChanged: _onSortChanged,
                    onToggleSortDirection: _toggleSortDirection,
                    onStockFilterChanged: _onStockFilterChanged,
                    onClearFilters: _clearFilters,
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: _reload,
                      child: CustomScrollView(
                        key: const ValueKey<String>('inventory-scroll-view'),
                        controller: _scrollController,
                        physics: const AlwaysScrollableScrollPhysics(),
                        keyboardDismissBehavior:
                            ScrollViewKeyboardDismissBehavior.onDrag,
                        slivers: <Widget>[
                          if (inventoryItems.isNotEmpty && showLowStockBanner)
                            SliverToBoxAdapter(
                              child: Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: _InventoryLowStockBanner(
                                  lowStockCount: totalLowStockCount,
                                  outOfStockCount: totalOutOfStockCount,
                                  texts: texts,
                                  onTap: () => _onStockFilterChanged(
                                    InventoryStockFilter.lowStock,
                                  ),
                                ),
                              ),
                            ),
                          if (inventoryItems.isNotEmpty) ...<Widget>[
                            SliverToBoxAdapter(
                              child: _InventoryOverviewCard(
                                layout: layout,
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
                                importActionLabel: texts.importStockAction,
                                exportActionLabel: texts.exportAction,
                                scanActionLabel: texts.scanQrBarcodeAction,
                                scanHelperText: texts.scanQuickActionHelper,
                                onImportAction: () =>
                                    unawaited(_handleQuickAction('import')),
                                onExportAction: () =>
                                    unawaited(_handleQuickAction('export')),
                                onScanAction: () =>
                                    unawaited(_handleQuickAction('scan')),
                                onRetrySync: () => unawaited(_reload()),
                              ),
                            ),
                            const SliverToBoxAdapter(
                              child: SizedBox(height: 12),
                            ),
                          ],
                          ..._buildInventoryContentSlivers(
                            texts: texts,
                            theme: theme,
                            colorScheme: colorScheme,
                            layout: layout,
                            inventoryItems: inventoryItems,
                            filteredItems: filteredItems,
                            filteredLowStockCount: filteredLowStockCount,
                            bottomPadding: listBottomPadding,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          },
        ),
      ),
    );
  }

  List<Widget> _buildInventoryContentSlivers({
    required _InventoryTexts texts,
    required ThemeData theme,
    required ColorScheme colorScheme,
    required _InventoryLayoutConfig layout,
    required List<InventoryProductItem> inventoryItems,
    required List<InventoryProductItem> filteredItems,
    required int filteredLowStockCount,
    required double bottomPadding,
  }) {
    if (inventoryItems.isEmpty) {
      return <Widget>[
        SliverFillRemaining(
          hasScrollBody: false,
          child: Padding(
            padding: EdgeInsets.only(bottom: bottomPadding),
            child: _InventoryEmptyView(
              onImport: () => unawaited(_handleQuickAction('import')),
            ),
          ),
        ),
      ];
    }

    if (filteredItems.isEmpty) {
      return <Widget>[
        SliverFillRemaining(
          hasScrollBody: false,
          child: Padding(
            padding: EdgeInsets.only(bottom: bottomPadding),
            child: _InventoryFilteredEmptyView(onClear: _clearFilters),
          ),
        ),
      ];
    }

    return <Widget>[
      SliverToBoxAdapter(
        child: _InventoryCatalogHeader(
          texts: texts,
          theme: theme,
          colorScheme: colorScheme,
          filteredCount: filteredItems.length,
          lowStockCount: filteredLowStockCount,
        ),
      ),
      SliverPadding(
        padding: EdgeInsets.fromLTRB(0, 12, 0, bottomPadding),
        sliver: layout.useGrid
            ? SliverGrid(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final item = filteredItems[index];
                  return _InventoryProductTile(
                    item: item,
                    onTap: () => _openInventoryDetail(item),
                  );
                }, childCount: filteredItems.length),
                gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: layout.gridMaxTileWidth,
                  mainAxisSpacing: _inventoryListItemSpacing,
                  crossAxisSpacing: 12,
                  mainAxisExtent: layout.gridTileExtent,
                ),
              )
            : SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final item = filteredItems[index];
                  return Padding(
                    padding: EdgeInsets.only(
                      bottom: index == filteredItems.length - 1
                          ? 0
                          : _inventoryListItemSpacing,
                    ),
                    child: _InventoryProductTile(
                      item: item,
                      onTap: () => _openInventoryDetail(item),
                    ),
                  );
                }, childCount: filteredItems.length),
              ),
      ),
    ];
  }

  void _openInventoryDetail(InventoryProductItem item) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => InventoryProductDetailScreen(
          product: item.product,
          readyQuantity: item.readyQuantity,
          importedQuantity: item.importedQuantity,
          warrantyQuantity: item.warrantyQuantity,
          issueQuantity: item.issueQuantity,
          orderIds: item.orderIds.toList(growable: false),
          latestImportedAt: item.latestImportedAt,
          inventoryService: _inventoryService,
        ),
      ),
    );
  }

  InventoryProductItem _mapRemoteInventoryItem(
    DealerInventoryProductRecord record,
  ) {
    return InventoryProductItem(
      product: record.product,
      importedQuantity: record.totalSerials,
      readyQuantity: record.readySerials,
      warrantyQuantity: record.warrantySerials,
      issueQuantity: record.issueSerials,
      latestImportedAt: record.latestImportedAt,
      orderIds: record.orderCodes.toSet(),
      serialSearchIndex: '',
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
    });
    _jumpToTop();
  }

  Future<void> _handleQuickAction(String action) async {
    if (!mounted) {
      return;
    }
    switch (action) {
      case 'import':
        await context.pushDealerWarrantyHub();
        return;
      case 'scan':
        await _handleScanSerial();
        return;
      case 'export':
        await context.pushDealerWarrantyExport();
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
