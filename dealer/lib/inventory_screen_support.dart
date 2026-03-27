part of 'inventory_screen.dart';

class _InventoryLayoutConfig {
  const _InventoryLayoutConfig({
    required this.contentMaxWidth,
    required this.tileColumnCount,
    required this.showSummaryRow,
  });

  final double contentMaxWidth;
  final int tileColumnCount;
  final bool showSummaryRow;

  bool get showWideGrid => tileColumnCount > 1;

  factory _InventoryLayoutConfig.fromContext(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final isTablet = size.shortestSide >= AppBreakpoints.phone;
    final isWideDesktop = size.width >= 1180;
    return _InventoryLayoutConfig(
      contentMaxWidth: isWideDesktop
          ? 1280.0
          : isTablet
          ? 1040.0
          : double.infinity,
      tileColumnCount: isWideDesktop ? 2 : 1,
      showSummaryRow: isTablet,
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
