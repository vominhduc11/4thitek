part of 'inventory_screen.dart';

class _InventoryLayoutConfig {
  const _InventoryLayoutConfig({
    required this.contentMaxWidth,
    required this.useGrid,
    required this.gridMaxTileWidth,
    required this.gridTileExtent,
    required this.showWideControls,
    required this.showInlineOverviewActions,
  });

  final double contentMaxWidth;
  final bool useGrid;
  final double gridMaxTileWidth;
  final double gridTileExtent;
  final bool showWideControls;
  final bool showInlineOverviewActions;

  factory _InventoryLayoutConfig.fromContext(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final isTablet = size.shortestSide >= AppBreakpoints.phone;
    final isWideDesktop = size.width >= 1280;
    return _InventoryLayoutConfig(
      contentMaxWidth: isWideDesktop
          ? 1360.0
          : isTablet
          ? 1120.0
          : double.infinity,
      useGrid: size.width >= 720,
      gridMaxTileWidth: isWideDesktop ? 380.0 : 460.0,
      gridTileExtent: isWideDesktop ? 216.0 : 228.0,
      showWideControls: size.width >= 920,
      showInlineOverviewActions: size.width >= 1040,
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
