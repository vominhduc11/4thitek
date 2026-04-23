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
      useGrid: size.width >= 980,
      gridMaxTileWidth: isWideDesktop ? 380.0 : 460.0,
      gridTileExtent: isWideDesktop ? 216.0 : 228.0,
      showWideControls: size.width >= 960,
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
            '${item.product.name} ${item.product.sku} ${item.orderIds.join(' ')} ${item.serialSearchIndex}'
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

class _InventoryLowStockBanner extends StatelessWidget {
  const _InventoryLowStockBanner({
    required this.lowStockCount,
    required this.outOfStockCount,
    required this.texts,
    required this.onTap,
  });

  final int lowStockCount;
  final int outOfStockCount;
  final _InventoryTexts texts;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final totalCount = lowStockCount + outOfStockCount;
    final hasOutOfStock = outOfStockCount > 0;
    final bannerColor = hasOutOfStock ? cs.errorContainer : cs.tertiaryContainer;
    final textColor =
        hasOutOfStock ? cs.onErrorContainer : cs.onTertiaryContainer;
    final icon = hasOutOfStock
        ? Icons.inventory_2_outlined
        : Icons.warning_amber_rounded;
    final title = texts.lowStockWarningTitle(totalCount);

    return Material(
      color: bannerColor,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, size: 22, color: textColor),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: textColor,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      texts.lowStockWarningAction,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: textColor.withValues(alpha: 0.75),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_rounded,
                size: 18,
                color: textColor.withValues(alpha: 0.7),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
