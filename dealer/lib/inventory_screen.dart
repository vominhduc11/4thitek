import 'dart:async';

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
  InventoryLoadState _loadState = InventoryLoadState.loading;

  String _query = '';
  InventoryStockFilter _stockFilter = InventoryStockFilter.all;
  InventorySortOption _sortOption = InventorySortOption.importedDate;

  @override
  void initState() {
    super.initState();
    unawaited(_reload());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _reload() async {
    if (!mounted) {
      return;
    }
    setState(() => _loadState = InventoryLoadState.loading);
    try {
      await Future<void>.delayed(const Duration(milliseconds: 240));
      if (!mounted) {
        return;
      }
      setState(() => _loadState = InventoryLoadState.ready);
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() => _loadState = InventoryLoadState.error);
    }
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

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Kho')),
      body: switch (_loadState) {
        InventoryLoadState.loading => const _InventoryLoadingView(),
        InventoryLoadState.error => _InventoryErrorView(onRetry: _reload),
        InventoryLoadState.ready => ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Semantics(
              textField: true,
              label: 'Tìm kiếm sản phẩm theo tên, SKU hoặc serial',
              child: TextField(
                controller: _searchController,
                onChanged: (value) => setState(() => _query = value),
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search),
                  hintText: 'Tìm theo tên sản phẩm, SKU, serial',
                ),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _FilterChip(
                  label: 'Tất cả',
                  selected: _stockFilter == InventoryStockFilter.all,
                  onTap: () =>
                      setState(() => _stockFilter = InventoryStockFilter.all),
                ),
                _FilterChip(
                  label: 'Còn hàng',
                  selected: _stockFilter == InventoryStockFilter.inStock,
                  onTap: () => setState(
                    () => _stockFilter = InventoryStockFilter.inStock,
                  ),
                ),
                _FilterChip(
                  label: 'Sắp hết',
                  selected: _stockFilter == InventoryStockFilter.lowStock,
                  onTap: () => setState(
                    () => _stockFilter = InventoryStockFilter.lowStock,
                  ),
                ),
                _FilterChip(
                  label: 'Hết hàng',
                  selected: _stockFilter == InventoryStockFilter.outOfStock,
                  onTap: () => setState(
                    () => _stockFilter = InventoryStockFilter.outOfStock,
                  ),
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
                    setState(() {
                      _sortOption = switch (value) {
                        'name' => InventorySortOption.name,
                        'quantity' => InventorySortOption.quantity,
                        _ => InventorySortOption.importedDate,
                      };
                    });
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _SummaryChip(
                  label: 'Tổng sản phẩm',
                  value: '${summary.totalProducts}',
                  color: const Color(0xFF1D4ED8),
                ),
                _SummaryChip(
                  label: 'Tổng tồn kho',
                  value: '${summary.totalQuantity}',
                  color: const Color(0xFF047857),
                ),
                _SummaryChip(
                  label: 'Sắp hết hàng',
                  value: '${summary.lowStockProducts}',
                  color: const Color(0xFFB45309),
                ),
              ],
            ),
            const SizedBox(height: 14),
            if (inventoryItems.isEmpty)
              _InventoryEmptyView(
                onImport: () =>
                    unawaited(_handleQuickAction('import', orderController)),
              )
            else if (filteredItems.isEmpty)
              _InventoryFilteredEmptyView(onClear: _clearFilters)
            else
              ...filteredItems.map((item) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _InventoryProductTile(
                    item: item,
                    onTap: () {
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
                );
              }),
          ],
        ),
      },
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showActionSheet(orderController),
        icon: const Icon(Icons.flash_on_outlined),
        label: const Text('Tác vụ nhanh'),
      ),
    );
  }

  void _clearFilters() {
    _searchController.clear();
    setState(() {
      _query = '';
      _stockFilter = InventoryStockFilter.all;
      _sortOption = InventorySortOption.importedDate;
    });
  }

  void _showActionSheet(OrderController orderController) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) {
        return SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.inventory_2_outlined),
                title: const Text('Nhập hàng từ PO'),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  unawaited(_handleQuickAction('import', orderController));
                },
              ),
              ListTile(
                leading: const Icon(Icons.qr_code_scanner_outlined),
                title: const Text('Quét QR / Barcode'),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  unawaited(_handleQuickAction('scan', orderController));
                },
              ),
              ListTile(
                leading: const Icon(Icons.local_shipping_outlined),
                title: const Text('Xuất hàng'),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  unawaited(_handleQuickAction('export', orderController));
                },
              ),
              const SizedBox(height: 8),
            ],
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
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label),
          Text(
            value,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
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
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      showCheckmark: false,
      onSelected: (_) => onTap(),
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
    return PopupMenuButton<String>(
      onSelected: onSelected,
      itemBuilder: (_) => items,
      child: Chip(label: Text(label)),
    );
  }
}

class _InventoryProductTile extends StatelessWidget {
  const _InventoryProductTile({required this.item, required this.onTap});

  final InventoryProductItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final status = switch (item.stockStatus) {
      InventoryStockStatus.inStock => 'Còn hàng',
      InventoryStockStatus.lowStock => 'Sắp hết',
      InventoryStockStatus.outOfStock => 'Hết hàng',
    };
    final statusColor = switch (item.stockStatus) {
      InventoryStockStatus.inStock => const Color(0xFF047857),
      InventoryStockStatus.lowStock => const Color(0xFFB45309),
      InventoryStockStatus.outOfStock => const Color(0xFFB91C1C),
    };
    return Card(
      elevation: 0,
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
              ProductImage(
                product: item.product,
                width: 56,
                height: 56,
                borderRadius: BorderRadius.circular(12),
                fit: BoxFit.cover,
                iconSize: 18,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.product.name,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'SKU: ${item.product.sku}',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                    ),
                    const SizedBox(height: 4),
                    RichText(
                      text: TextSpan(
                        style: Theme.of(
                          context,
                        ).textTheme.bodyMedium?.copyWith(color: Colors.black87),
                        children: [
                          const TextSpan(text: 'Tồn kho: '),
                          TextSpan(
                            text: '${item.availableQuantity}',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                    if (item.soldQuantity > 0 ||
                        item.defectiveQuantity > 0) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Đã bán: ${item.soldQuantity} • Lỗi: ${item.defectiveQuantity}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: const Color(0xFF5B6478),
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
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      status,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Nhập ${formatDate(item.latestImportedAt)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF64748B),
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

class _InventoryLoadingView extends StatelessWidget {
  const _InventoryLoadingView();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        const _SkeletonBox(height: 48, radius: 12),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(
            6,
            (_) => const _SkeletonBox(width: 96, height: 32, radius: 16),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(
            3,
            (_) => const _SkeletonBox(width: 156, height: 52, radius: 12),
          ),
        ),
        const SizedBox(height: 14),
        ...List.generate(
          5,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: _SkeletonBox(height: 88, radius: 14),
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
