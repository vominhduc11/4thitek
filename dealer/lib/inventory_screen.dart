import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';

import 'breakpoints.dart';
import 'global_search.dart';
import 'inventory_product_detail_screen.dart';
import 'models.dart';
import 'order_controller.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'warranty_activation_screen.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/product_image.dart';

const int _lowStockThreshold = 5;
const double _inventoryFabHeight = 56;
const double _inventoryFabBottomSpacing = 20;
const double _inventoryMinTapTarget = 48;
const int _inventoryPageSize = 12;
const double _inventorySectionSpacing = 16;
const double _inventorySectionSpacingLarge = 20;
const double _inventoryListItemSpacing = 10;

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
    unawaited(_reload());
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
    _inventoryCacheDirty = true;
  }

  Future<void> _reload() async {
    if (!mounted) {
      return;
    }
    setState(() {
      _loadState = InventoryLoadState.loading;
      _visibleItemCount = _inventoryPageSize;
    });
    try {
      await Future<void>.delayed(const Duration(milliseconds: 160));
      if (!mounted) {
        return;
      }
      setState(() {
        _loadState = InventoryLoadState.ready;
        _visibleItemCount = _inventoryPageSize;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() => _loadState = InventoryLoadState.error);
    }
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
    final sortLabel = switch (_sortOption) {
      InventorySortOption.name => 'Sắp xếp: Tên',
      InventorySortOption.quantity => 'Sắp xếp: Tồn kho',
      InventorySortOption.importedDate => 'Sắp xếp: Ngày nhập',
    };
    final summaryCards = <Widget>[
      _SummaryChip(
        label: 'Tổng sản phẩm',
        value: '${summary.totalProducts}',
        color: const Color(0xFF1D4ED8),
        icon: Icons.inventory_2_outlined,
        helperText: 'SKU đang theo dõi',
      ),
      _SummaryChip(
        label: 'Tổng tồn kho',
        value: '${summary.totalQuantity}',
        color: const Color(0xFF047857),
        icon: Icons.stacked_bar_chart_outlined,
        helperText: 'Đơn vị còn khả dụng',
      ),
      _SummaryChip(
        label: 'Sắp hết hàng',
        value: '${summary.lowStockProducts}',
        color: const Color(0xFFB45309),
        icon: Icons.warning_amber_rounded,
        helperText: 'Cần nhập thêm sớm',
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
        title: const BrandAppBarTitle('Kho'),
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
            InventoryLoadState.error => _InventoryErrorView(onRetry: _reload),
            InventoryLoadState.ready => RefreshIndicator(
              onRefresh: _reload,
              child: ListView(
                controller: _scrollController,
                physics: const AlwaysScrollableScrollPhysics(),
                keyboardDismissBehavior:
                    ScrollViewKeyboardDismissBehavior.onDrag,
                padding: EdgeInsets.fromLTRB(16, 12, 16, listBottomPadding),
                children: [
                  Semantics(
                    textField: true,
                    label: 'Tìm kiếm sản phẩm theo tên, SKU hoặc serial',
                    child: TextField(
                      controller: _searchController,
                      onChanged: _onSearchChanged,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.search),
                        hintText: 'Tìm theo tên sản phẩm, SKU, serial',
                        suffixIcon: _query.isNotEmpty
                            ? IconButton(
                                tooltip: 'Xóa tìm kiếm',
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
                        label: 'Tất cả',
                        selected: _stockFilter == InventoryStockFilter.all,
                        onTap: () =>
                            _onStockFilterChanged(InventoryStockFilter.all),
                      ),
                      _FilterChip(
                        label: 'Còn hàng',
                        selected: _stockFilter == InventoryStockFilter.inStock,
                        onTap: () =>
                            _onStockFilterChanged(InventoryStockFilter.inStock),
                      ),
                      _FilterChip(
                        label: 'Sắp hết',
                        selected: _stockFilter == InventoryStockFilter.lowStock,
                        onTap: () => _onStockFilterChanged(
                          InventoryStockFilter.lowStock,
                        ),
                      ),
                      _FilterChip(
                        label: 'Hết hàng',
                        selected:
                            _stockFilter == InventoryStockFilter.outOfStock,
                        onTap: () => _onStockFilterChanged(
                          InventoryStockFilter.outOfStock,
                        ),
                      ),
                      _MenuFilterButton(
                        label:
                            '$sortLabel ${_sortDirection == InventorySortDirection.ascending ? '↑' : '↓'}',
                        items: const [
                          PopupMenuItem<String>(
                            value: 'name',
                            child: Text('Theo tên'),
                          ),
                          PopupMenuItem<String>(
                            value: 'quantity',
                            child: Text('Theo số lượng tồn'),
                          ),
                          PopupMenuItem<String>(
                            value: 'importedDate',
                            child: Text('Theo ngày nhập'),
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
                      onImport: () => unawaited(
                        _handleQuickAction('import', orderController),
                      ),
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
                                  availableQuantity: item.availableQuantity,
                                  importedQuantity: item.importedQuantity,
                                  soldQuantity: item.soldQuantity,
                                  defectiveQuantity: item.defectiveQuantity,
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
        label: 'Tác vụ nhanh',
        child: Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: FloatingActionButton.extended(
            onPressed: () => _showActionSheet(orderController),
            tooltip: 'Tác vụ nhanh',
            icon: const Icon(Icons.flash_on_outlined),
            label: const Text('Tác vụ nhanh'),
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

  void _showActionSheet(OrderController orderController) {
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
            unawaited(_handleQuickAction(action, orderController));
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
                              'Tác vụ nhanh',
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
                          'Xuất hàng là thao tác chính',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: sheetScheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 14),
                        _QuickActionSheetItem(
                          icon: Icons.local_shipping_outlined,
                          title: 'Xuất hàng',
                          subtitle: 'Kích hoạt xuất kho theo serial',
                          tone: _QuickActionTone.primary,
                          onTap: () => onSelect('export'),
                        ),
                        const SizedBox(height: 8),
                        _QuickActionSheetItem(
                          icon: Icons.inventory_2_outlined,
                          title: 'Nhập hàng từ PO',
                          subtitle: 'Nhận thêm hàng vào kho',
                          tone: _QuickActionTone.secondary,
                          onTap: () => onSelect('import'),
                        ),
                        const SizedBox(height: 12),
                        const Divider(height: 1, thickness: 1),
                        const SizedBox(height: 12),
                        _QuickActionSheetItem(
                          icon: Icons.qr_code_scanner_outlined,
                          title: 'Quét QR / Barcode',
                          subtitle: 'Tra cứu serial bằng camera',
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

  Future<void> _handleQuickAction(
    String action,
    OrderController orderController,
  ) async {
    if (!mounted) {
      return;
    }
    switch (action) {
      case 'import':
        await _handleImportSerials(orderController);
        return;
      case 'scan':
        await _handleScanSerial(orderController);
        return;
      case 'export':
        final orderId = await _pickOrderForExport(orderController);
        if (!mounted) {
          return;
        }
        if (orderId == null) {
          _showSnackBar('Không có đơn phù hợp để xuất hàng lúc này.');
          return;
        }
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => WarrantyActivationScreen(orderId: orderId),
          ),
        );
        return;
    }
  }

  Future<void> _handleImportSerials(OrderController orderController) async {
    final warrantyController = WarrantyScope.of(context);
    final options = _buildSerialImportOptions(
      orderController: orderController,
      warrantyController: warrantyController,
    );
    if (options.isEmpty) {
      _showSnackBar('Không co dong PO nao san sang de nhap serial.');
      return;
    }

    final result = await showModalBottomSheet<_SerialImportSheetResult>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      requestFocus: true,
      builder: (_) => _SerialImportSheet(
        options: options,
        warrantyController: warrantyController,
      ),
    );
    if (!mounted || result == null) {
      return;
    }
    _showSnackBar(result.message);
  }

  Future<void> _handleScanSerial(OrderController orderController) async {
    final scannedValue = await Navigator.of(
      context,
    ).push<String>(MaterialPageRoute(builder: (_) => const SerialScanScreen()));
    if (!mounted || scannedValue == null) {
      return;
    }

    final warrantyController = WarrantyScope.of(context);
    final normalized = warrantyController.normalizeSerial(scannedValue);
    if (normalized.isEmpty) {
      _showSnackBar('Mã quét không hợp lệ.');
      return;
    }

    final imported = warrantyController.findImportedSerial(normalized);
    if (imported == null) {
      _showSnackBar('Không tìm thấy serial $normalized trong kho.');
      return;
    }

    final order = orderController.findById(imported.orderId);
    if (order == null || order.status != OrderStatus.completed) {
      _showSnackBar('Serial $normalized chưa thuộc đơn đã hoàn thành.');
      return;
    }

    final validationError = warrantyController.validateSerialForActivation(
      serial: normalized,
      productId: imported.productId,
      productName: imported.productName,
      orderId: imported.orderId,
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
        builder: (_) => WarrantyActivationScreen(
          orderId: imported.orderId,
          prefilledSerial: normalized,
          prefilledProductId: imported.productId,
        ),
      ),
    );
  }

  Future<String?> _pickOrderForExport(OrderController orderController) async {
    final warrantyController = WarrantyScope.of(context);
    final options = <_MainExportOrderOption>[];
    for (final order in orderController.orders) {
      if (order.status != OrderStatus.completed) {
        continue;
      }
      var availableSerials = 0;
      for (final item in order.items) {
        availableSerials += warrantyController
            .availableImportedSerialCountForOrderItem(
              order.id,
              item.product.id,
            );
      }
      if (availableSerials > 0) {
        options.add(
          _MainExportOrderOption(
            orderId: order.id,
            availableSerials: availableSerials,
            createdAt: order.createdAt,
          ),
        );
      }
    }
    if (options.isEmpty) {
      return null;
    }
    options.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    if (options.length == 1) {
      return options.first.orderId;
    }
    if (!mounted) {
      return null;
    }
    return showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      requestFocus: true,
      builder: (sheetContext) {
        final colorScheme = Theme.of(sheetContext).colorScheme;
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Chọn đơn để xuất hàng',
                  style: Theme.of(sheetContext).textTheme.titleSmall?.copyWith(
                    color: colorScheme.onSurface,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Có nhiều đơn hoàn thành còn serial khả dụng.',
                  style: Theme.of(sheetContext).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                for (final option in options) ...[
                  Material(
                    color: colorScheme.surfaceContainerHighest.withValues(
                      alpha: 0.38,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: colorScheme.outlineVariant.withValues(
                          alpha: 0.6,
                        ),
                      ),
                    ),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () =>
                          Navigator.of(sheetContext).pop(option.orderId),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'Đơn ${option.orderId}',
                                    style: Theme.of(sheetContext)
                                        .textTheme
                                        .bodyLarge
                                        ?.copyWith(
                                          color: colorScheme.onSurface,
                                          fontWeight: FontWeight.w700,
                                        ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Còn ${option.availableSerials} serial • ${formatDate(option.createdAt)}',
                                    style: Theme.of(sheetContext)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(
                                          color: colorScheme.onSurfaceVariant,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                            Icon(
                              Icons.chevron_right_rounded,
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
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

  List<_SerialImportTargetOption> _buildSerialImportOptions({
    required OrderController orderController,
    required WarrantyController warrantyController,
  }) {
    final options = <_SerialImportTargetOption>[];
    for (final order in orderController.orders) {
      if (!_canImportSerialsFromOrder(order)) {
        continue;
      }
      for (final item in order.items) {
        final importedCount = warrantyController
            .importedSerialCountForOrderItem(order.id, item.product.id);
        final remainingCount = item.quantity - importedCount;
        if (remainingCount <= 0) {
          continue;
        }
        options.add(
          _SerialImportTargetOption(
            orderId: order.id,
            orderCreatedAt: order.createdAt,
            productId: item.product.id,
            productName: item.product.name,
            productSku: item.product.sku,
            orderedQuantity: item.quantity,
            importedQuantity: importedCount,
            remainingQuantity: remainingCount,
          ),
        );
      }
    }
    options.sort((a, b) {
      final byDate = b.orderCreatedAt.compareTo(a.orderCreatedAt);
      if (byDate != 0) {
        return byDate;
      }
      return a.productName.toLowerCase().compareTo(b.productName.toLowerCase());
    });
    return options;
  }

  bool _canImportSerialsFromOrder(Order order) {
    return order.status == OrderStatus.shipping ||
        order.status == OrderStatus.completed;
  }
}

class _MainExportOrderOption {
  const _MainExportOrderOption({
    required this.orderId,
    required this.availableSerials,
    required this.createdAt,
  });

  final String orderId;
  final int availableSerials;
  final DateTime createdAt;
}

class _SerialImportTargetOption {
  const _SerialImportTargetOption({
    required this.orderId,
    required this.orderCreatedAt,
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.orderedQuantity,
    required this.importedQuantity,
    required this.remainingQuantity,
  });

  final String orderId;
  final DateTime orderCreatedAt;
  final String productId;
  final String productName;
  final String productSku;
  final int orderedQuantity;
  final int importedQuantity;
  final int remainingQuantity;

  String get dropdownLabel => '$orderId • $productName';
}

class _SerialImportSheetResult {
  const _SerialImportSheetResult({required this.message});

  final String message;
}

class _SerialImportSheet extends StatefulWidget {
  const _SerialImportSheet({
    required this.options,
    required this.warrantyController,
  });

  final List<_SerialImportTargetOption> options;
  final WarrantyController warrantyController;

  @override
  State<_SerialImportSheet> createState() => _SerialImportSheetState();
}

class _SerialImportSheetState extends State<_SerialImportSheet> {
  final TextEditingController _serialsController = TextEditingController();
  final TextEditingController _warehouseIdController = TextEditingController(
    text: 'main',
  );
  final TextEditingController _warehouseNameController = TextEditingController(
    text: 'Kho',
  );

  late _SerialImportTargetOption _selectedOption;
  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _selectedOption = widget.options.first;
  }

  @override
  void dispose() {
    _serialsController.dispose();
    _warehouseIdController.dispose();
    _warehouseNameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final serials = _parseSerials(_serialsController.text);
    if (serials.isEmpty) {
      setState(() {
        _errorMessage = 'Nhập ít nhất 1 serial.';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final result = await widget.warrantyController.importSerials(
      orderId: _selectedOption.orderId,
      productId: _selectedOption.productId,
      productName: _selectedOption.productName,
      productSku: _selectedOption.productSku,
      serials: serials,
      maxToAdd: _selectedOption.remainingQuantity,
      warehouseId: _warehouseIdController.text,
      warehouseName: _warehouseNameController.text,
    );

    if (!mounted) {
      return;
    }

    setState(() {
      _isSubmitting = false;
      _errorMessage = result.errorMessage;
    });

    if (result.hasError) {
      return;
    }

    Navigator.of(context).pop(
      _SerialImportSheetResult(
        message: _buildResultMessage(result, _selectedOption),
      ),
    );
  }

  List<String> _parseSerials(String raw) {
    return raw
        .split(RegExp(r'[\s,;]+'))
        .map((value) => value.trim())
        .where((value) => value.isNotEmpty)
        .toList(growable: false);
  }

  String _buildResultMessage(
    WarrantySerialImportResult result,
    _SerialImportTargetOption option,
  ) {
    final parts = <String>[];
    if (result.addedCount > 0) {
      parts.add('Đã thêm ${result.addedCount} serial');
    } else {
      parts.add('Không co serial moi duoc them');
    }
    if (result.duplicateCount > 0) {
      parts.add('${result.duplicateCount} trung');
    }
    if (result.invalidCount > 0) {
      parts.add('${result.invalidCount} không hợp lệ');
    }
    if (result.overLimitCount > 0) {
      parts.add('${result.overLimitCount} vuot so luong');
    }
    return '${parts.join(', ')} cho ${option.productSku}.';
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, 4, 16, 16 + bottomInset),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Nhập serial từ PO',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: colorScheme.onSurface,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Chọn đơn, sản phẩm và dán danh sách serial để đồng bộ vào kho.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<_SerialImportTargetOption>(
                initialValue: _selectedOption,
                isExpanded: true,
                decoration: const InputDecoration(
                  labelText: 'Dong PO',
                  prefixIcon: Icon(Icons.receipt_long_outlined),
                ),
                items: widget.options
                    .map(
                      (option) => DropdownMenuItem<_SerialImportTargetOption>(
                        value: option,
                        child: Text(
                          option.dropdownLabel,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    )
                    .toList(growable: false),
                onChanged: _isSubmitting
                    ? null
                    : (value) {
                        if (value == null) {
                          return;
                        }
                        setState(() {
                          _selectedOption = value;
                        });
                      },
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHighest.withValues(
                    alpha: 0.45,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: colorScheme.outlineVariant.withValues(alpha: 0.6),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _selectedOption.productName,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: colorScheme.onSurface,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Don ${_selectedOption.orderId} • ${_selectedOption.productSku}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Da nhap ${_selectedOption.importedQuantity}/${_selectedOption.orderedQuantity} • Con ${_selectedOption.remainingQuantity} serial',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _serialsController,
                enabled: !_isSubmitting,
                textCapitalization: TextCapitalization.characters,
                minLines: 5,
                maxLines: 8,
                decoration: const InputDecoration(
                  labelText: 'Danh sách serial',
                  alignLabelWithHint: true,
                  hintText: 'Mỗi dòng 1 serial hoặc tách bằng dấu phẩy',
                  prefixIcon: Icon(Icons.qr_code_2_outlined),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Serial được tự động chuẩn hóa, bỏ qua dòng trống, trùng và số lượng vượt mức cho phép.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _warehouseIdController,
                      enabled: !_isSubmitting,
                      decoration: const InputDecoration(
                        labelText: 'Warehouse ID',
                        prefixIcon: Icon(Icons.tag_outlined),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _warehouseNameController,
                      enabled: !_isSubmitting,
                      decoration: const InputDecoration(
                        labelText: 'Warehouse name',
                        prefixIcon: Icon(Icons.warehouse_outlined),
                      ),
                    ),
                  ),
                ],
              ),
              if (_errorMessage != null &&
                  _errorMessage!.trim().isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  _errorMessage!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.error,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Row(
                children: [
                  TextButton(
                    onPressed: _isSubmitting
                        ? null
                        : () => Navigator.of(context).pop(),
                    child: const Text('Dong'),
                  ),
                  const Spacer(),
                  FilledButton.icon(
                    onPressed: _isSubmitting ? null : _submit,
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.inventory_2_outlined),
                    label: Text(
                      _isSubmitting ? 'Đang import...' : 'Import serial',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
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
    required this.availableQuantity,
    required this.soldQuantity,
    required this.defectiveQuantity,
    required this.latestImportedAt,
    required this.orderIds,
    required this.warehouseNames,
    required this.serialSearchIndex,
  });

  final Product product;
  final int importedQuantity;
  final int availableQuantity;
  final int soldQuantity;
  final int defectiveQuantity;
  final DateTime latestImportedAt;
  final Set<String> orderIds;
  final Map<String, String> warehouseNames;
  final String serialSearchIndex;

  InventoryStockStatus get stockStatus {
    if (availableQuantity <= 0) {
      return InventoryStockStatus.outOfStock;
    }
    if (availableQuantity <= _lowStockThreshold) {
      return InventoryStockStatus.lowStock;
    }
    return InventoryStockStatus.inStock;
  }
}

List<InventoryProductItem> _buildInventoryItems({
  required OrderController orderController,
  required WarrantyController warrantyController,
}) {
  final completedOrders = orderController.orders
      .where((order) => order.status == OrderStatus.completed)
      .toList(growable: false);

  final map = <String, _InventoryAccumulator>{};
  for (final order in completedOrders) {
    for (final item in order.items) {
      final current =
          map[item.product.id] ??
          _InventoryAccumulator(
            product: item.product,
            importedQuantity: 0,
            latestImportedAt: order.createdAt,
            orderIds: <String>{},
            warehouseNames: <String, String>{'main': 'Kho'},
            serials: <String>{},
          );
      current.importedQuantity += item.quantity;
      current.orderIds.add(order.id);
      if (order.createdAt.isAfter(current.latestImportedAt)) {
        current.latestImportedAt = order.createdAt;
      }
      map[item.product.id] = current;
    }
  }

  final activatedSet = warrantyController.activations
      .map((record) => warrantyController.normalizeSerial(record.serial))
      .toSet();

  for (final record in warrantyController.importedSerials) {
    final current = map[record.productId];
    if (current == null || !current.orderIds.contains(record.orderId)) {
      continue;
    }
    current.warehouseNames[record.warehouseId] = record.warehouseName;
    if (record.importedAt.isAfter(current.latestImportedAt)) {
      current.latestImportedAt = record.importedAt;
    }

    final normalized = warrantyController.normalizeSerial(record.serial);
    final isNewSerial = current.serials.add(normalized);
    if (!isNewSerial) {
      continue;
    }

    if (warrantyController.isDefectiveSerial(normalized)) {
      current.serialDefective += 1;
      continue;
    }
    if (activatedSet.contains(normalized)) {
      current.serialSold += 1;
      continue;
    }
    current.serialAvailable += 1;
  }

  return map.values
      .map((entry) {
        final trackedSerialCount = entry.serials.length;
        final pendingWithoutSerial =
            entry.importedQuantity - trackedSerialCount;
        final availableFromPending = pendingWithoutSerial > 0
            ? pendingWithoutSerial
            : 0;

        return InventoryProductItem(
          product: entry.product,
          importedQuantity: entry.importedQuantity,
          availableQuantity: entry.serialAvailable + availableFromPending,
          soldQuantity: entry.serialSold,
          defectiveQuantity: entry.serialDefective,
          latestImportedAt: entry.latestImportedAt,
          orderIds: entry.orderIds,
          warehouseNames: entry.warehouseNames,
          serialSearchIndex: entry.serials.join(' '),
        );
      })
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
      InventorySortOption.quantity => a.availableQuantity.compareTo(
        b.availableQuantity,
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
    totalQuantity += item.availableQuantity;
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
    required this.warehouseNames,
    required this.serials,
  });

  final Product product;
  int importedQuantity;
  DateTime latestImportedAt;
  final Set<String> orderIds;
  final Map<String, String> warehouseNames;
  final Set<String> serials;
  int serialAvailable = 0;
  int serialSold = 0;
  int serialDefective = 0;
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
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: colorScheme.onSurface),
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
    final colorScheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: 'Mở bộ lọc sắp xếp',
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _inventoryMinTapTarget),
        child: PopupMenuButton<String>(
          onSelected: onSelected,
          itemBuilder: (_) => items,
          tooltip: 'Sắp xếp',
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
    final colorScheme = Theme.of(context).colorScheme;
    final label = ascending ? 'Tăng dần' : 'Giảm dần';
    return Semantics(
      button: true,
      label: 'Đổi chiều sắp xếp, hiện tại $label',
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _inventoryMinTapTarget),
        child: IconButton(
          tooltip: 'Đổi chiều sắp xếp ($label)',
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
        status = 'Còn hàng';
        statusColor = isDark
            ? const Color(0xFF4ADE80)
            : const Color(0xFF166534);
        statusIcon = Icons.check_circle_outline;
      case InventoryStockStatus.lowStock:
        status = 'Sắp hết';
        statusColor = isDark
            ? const Color(0xFFFBBF24)
            : const Color(0xFF9A3412);
        statusIcon = Icons.warning_amber_rounded;
      case InventoryStockStatus.outOfStock:
        status = 'Hết hàng';
        statusColor = isDark
            ? const Color(0xFFFCA5A5)
            : const Color(0xFFB91C1C);
        statusIcon = Icons.remove_circle_outline;
    }

    return Semantics(
      button: true,
      label:
          '${item.product.name}, SKU ${item.product.sku}, tồn ${item.availableQuantity}, trạng thái $status',
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
                  label: 'Ảnh sản phẩm ${item.product.name}',
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
                            const TextSpan(text: 'Tồn: '),
                            TextSpan(
                              text: '${item.availableQuantity}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (item.soldQuantity > 0 ||
                          item.defectiveQuantity > 0) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Đã bán: ${item.soldQuantity} • Lỗi: ${item.defectiveQuantity}',
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
                            : 'Nhập gần nhất: ${formatDate(item.latestImportedAt)}',
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
  const _InventoryErrorView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 52),
            const SizedBox(height: 10),
            const Text(
              'Không thể tải dữ liệu kho. Vui lòng thử lại.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: onRetry,
              style: ElevatedButton.styleFrom(minimumSize: const Size(128, 46)),
              child: const Text('Thử lại'),
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
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.inventory_2_outlined, size: 64),
            const SizedBox(height: 12),
            Text(
              'Kho chưa có sản phẩm.',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            const Text(
              'Nhập hàng từ nhà phân phối để bắt đầu quản lý kho.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Semantics(
              button: true,
              label: 'Nhập hàng từ nhà phân phối',
              child: ElevatedButton.icon(
                onPressed: onImport,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(132, 46),
                ),
                icon: const Icon(Icons.playlist_add_check_circle_outlined),
                label: const Text('Nhập hàng'),
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
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 30),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.filter_alt_off_outlined, size: 44),
            const SizedBox(height: 10),
            const Text(
              'Không có sản phẩm phù hợp bộ lọc hiện tại.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            TextButton(
              onPressed: onClear,
              style: TextButton.styleFrom(minimumSize: const Size(116, 48)),
              child: const Text('Xóa bộ lọc'),
            ),
          ],
        ),
      ),
    );
  }
}
