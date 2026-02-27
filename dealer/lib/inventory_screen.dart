import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';

import 'inventory_product_detail_screen.dart';
import 'models.dart';
import 'order_controller.dart';
import 'orders_screen.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'warranty_activation_screen.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/product_image.dart';

const int _lowStockThreshold = 5;
const double _inventoryFabHeight = 56;
const double _inventoryFabBottomSpacing = 20;
const double _inventoryMinTapTarget = 44;
const int _inventoryPageSize = 12;
const double _inventorySectionSpacing = 16;
const double _inventorySectionSpacingLarge = 20;
const double _inventoryListItemSpacing = 10;

enum InventoryLoadState { loading, ready, error }

enum InventoryStockFilter { all, inStock, lowStock, outOfStock }

enum InventorySortOption { name, quantity, importedDate }

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  InventoryLoadState _loadState = InventoryLoadState.loading;

  String _query = '';
  InventoryStockFilter _stockFilter = InventoryStockFilter.all;
  InventorySortOption _sortOption = InventorySortOption.importedDate;
  int _visibleItemCount = _inventoryPageSize;
  int _filteredItemCount = 0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_handleListScroll);
    unawaited(_reload());
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController
      ..removeListener(_handleListScroll)
      ..dispose();
    super.dispose();
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
      _scrollController.jumpTo(0);
    }
  }

  void _onSearchChanged(String value) {
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
      _sortOption = value;
      _visibleItemCount = _inventoryPageSize;
    });
    _jumpToTop();
  }

  @override
  Widget build(BuildContext context) {
    final orderController = OrderScope.of(context);
    final warrantyController = WarrantyScope.of(context);
    final inventoryItems = _buildInventoryItems(
      orderController: orderController,
      warrantyController: warrantyController,
    );

    final filteredItems = _filterAndSortItems(
      items: inventoryItems,
      query: _query,
      stockFilter: _stockFilter,
      sortOption: _sortOption,
    );

    final summary = _buildSummary(inventoryItems);
    _filteredItemCount = filteredItems.length;
    final visibleItemCount = math.min(_visibleItemCount, filteredItems.length);
    final listBottomPadding =
        _inventoryFabHeight +
        kFloatingActionButtonMargin +
        _inventoryFabBottomSpacing +
        MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Kho')),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      body: switch (_loadState) {
        InventoryLoadState.loading => _InventoryLoadingView(
          bottomPadding: listBottomPadding,
        ),
        InventoryLoadState.error => _InventoryErrorView(onRetry: _reload),
        InventoryLoadState.ready => ListView(
          controller: _scrollController,
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: EdgeInsets.fromLTRB(16, 12, 16, listBottomPadding),
          children: [
            Semantics(
              textField: true,
              label: 'Tìm kiếm sản phẩm theo tên, SKU hoặc serial',
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search),
                  hintText: 'Tìm theo tên sản phẩm, SKU, serial',
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
                  onTap: () => _onStockFilterChanged(InventoryStockFilter.all),
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
                  onTap: () =>
                      _onStockFilterChanged(InventoryStockFilter.lowStock),
                ),
                _FilterChip(
                  label: 'Hết hàng',
                  selected: _stockFilter == InventoryStockFilter.outOfStock,
                  onTap: () =>
                      _onStockFilterChanged(InventoryStockFilter.outOfStock),
                ),
                _MenuFilterButton(
                  label: switch (_sortOption) {
                    InventorySortOption.name => 'Sắp xếp: Tên',
                    InventorySortOption.quantity => 'Sắp xếp: Tồn kho',
                    InventorySortOption.importedDate => 'Sắp xếp: Ngày nhập',
                  },
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
              ],
            ),
            const SizedBox(height: _inventorySectionSpacing),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
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
              ],
            ),
            const SizedBox(height: _inventorySectionSpacingLarge),
            if (inventoryItems.isEmpty)
              _InventoryEmptyView(
                onImport: () =>
                    unawaited(_handleQuickAction('import', orderController)),
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
                            orderIds: item.orderIds.toList(growable: false),
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
      },
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
    _searchController.clear();
    setState(() {
      _query = '';
      _stockFilter = InventoryStockFilter.all;
      _sortOption = InventorySortOption.importedDate;
      _visibleItemCount = _inventoryPageSize;
    });
    _jumpToTop();
  }

  void _showActionSheet(OrderController orderController) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: false,
      backgroundColor: Colors.transparent,
      barrierColor: const Color(0x660F172A),
      builder: (sheetContext) {
        void onSelect(String action) {
          Navigator.of(sheetContext).pop();
          unawaited(_handleQuickAction(action, orderController));
        }

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
                    color: Colors.white.withValues(alpha: 0.95),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x240F172A),
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
                        Center(
                          child: Container(
                            width: 38,
                            height: 4,
                            decoration: BoxDecoration(
                              color: const Color(0xFFCBD5E1),
                              borderRadius: BorderRadius.circular(999),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                color: const Color(0xFFE0ECFF),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: const Icon(
                                Icons.flash_on_rounded,
                                size: 14,
                                color: Color(0xFF1D4ED8),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Tác vụ nhanh',
                              style: Theme.of(context).textTheme.titleSmall
                                  ?.copyWith(
                                    color: const Color(0xFF0F172A),
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Xuất hàng là thao tác chính',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: const Color(0xFF64748B)),
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
    switch (action) {
      case 'import':
        Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => const OrdersScreen()));
        return;
      case 'scan':
        await _handleScanSerial(orderController);
        return;
      case 'export':
        final orderId = _pickOrderForExport(orderController);
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

  String? _pickOrderForExport(OrderController orderController) {
    final warrantyController = WarrantyScope.of(context);
    for (final order in orderController.orders) {
      if (order.status != OrderStatus.completed) {
        continue;
      }
      for (final item in order.items) {
        final available = warrantyController
            .availableImportedSerialCountForOrderItem(
              order.id,
              item.product.id,
            );
        if (available > 0) {
          return order.id;
        }
      }
    }
    return null;
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
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
      if (item.product.category != ProductCategory.headset) {
        continue;
      }
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
    switch (sortOption) {
      case InventorySortOption.name:
        return a.product.name.toLowerCase().compareTo(
          b.product.name.toLowerCase(),
        );
      case InventorySortOption.quantity:
        return b.availableQuantity.compareTo(a.availableQuantity);
      case InventorySortOption.importedDate:
        return b.latestImportedAt.compareTo(a.latestImportedAt);
    }
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
                    color: const Color(0xFF334155),
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
                color: const Color(0xFF475569),
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
            ).textTheme.bodyMedium?.copyWith(color: const Color(0xFF1E293B)),
          ),
          selected: selected,
          showCheckmark: false,
          labelPadding: const EdgeInsets.symmetric(horizontal: 2),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          materialTapTargetSize: MaterialTapTargetSize.padded,
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
              color: const Color(0xFFF8FAFC),
              shape: StadiumBorder(
                side: BorderSide(
                  color: Theme.of(context).dividerColor.withValues(alpha: 0.8),
                ),
              ),
            ),
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: const Color(0xFF1E293B),
                fontWeight: FontWeight.w600,
              ),
            ),
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
    final isPrimary = tone == _QuickActionTone.primary;
    final iconColor = isPrimary
        ? const Color(0xFF1D4ED8)
        : const Color(0xFF334155);
    final surfaceColor = isPrimary
        ? const Color(0xFFE7F0FF)
        : const Color(0xFFF8FAFC);
    final borderColor = isPrimary
        ? const Color(0xFFBBD0FB)
        : const Color(0xFFDCE4F1);
    final titleColor = isPrimary
        ? const Color(0xFF123A9D)
        : const Color(0xFF0F172A);

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
                      color: Colors.white.withValues(alpha: 0.94),
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
                              ?.copyWith(color: const Color(0xFF64748B)),
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
    late final String status;
    late final Color statusColor;
    late final IconData statusIcon;
    switch (item.stockStatus) {
      case InventoryStockStatus.inStock:
        status = 'Còn hàng';
        statusColor = const Color(0xFF166534);
        statusIcon = Icons.check_circle_outline;
      case InventoryStockStatus.lowStock:
        status = 'Sắp hết';
        statusColor = const Color(0xFF9A3412);
        statusIcon = Icons.warning_amber_rounded;
      case InventoryStockStatus.outOfStock:
        status = 'Hết hàng';
        statusColor = const Color(0xFFB91C1C);
        statusIcon = Icons.remove_circle_outline;
    }

    return Semantics(
      button: true,
      label:
          '${item.product.name}, SKU ${item.product.sku}, tồn ${item.availableQuantity}, trạng thái $status',
      child: Card(
        elevation: 1,
        shadowColor: const Color(0x120F172A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: Color(0xFFE5EAF5)),
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
                          color: const Color(0xFF0F172A),
                          fontSize: 17,
                          height: 1.25,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'SKU: ${item.product.sku}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: const Color(0xFF64748B),
                          fontSize: 11.5,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      RichText(
                        text: TextSpan(
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: const Color(0xFF0F172A),
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
                                color: const Color(0xFF475569),
                                fontSize: 12,
                                height: 1.25,
                              ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
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
                          Text(
                            status,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: statusColor,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Nhập gần nhất: ${formatDate(item.latestImportedAt)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF64748B),
                        fontSize: 12,
                        height: 1.25,
                      ),
                    ),
                  ],
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

class _SkeletonBox extends StatelessWidget {
  const _SkeletonBox({
    this.width = double.infinity,
    required this.height,
    this.radius = 10,
  });

  final double width;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFFEFF3FB),
        borderRadius: BorderRadius.circular(radius),
      ),
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
              style: TextButton.styleFrom(minimumSize: const Size(116, 44)),
              child: const Text('Xóa bộ lọc'),
            ),
          ],
        ),
      ),
    );
  }
}
