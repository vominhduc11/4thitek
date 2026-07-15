part of 'inventory_screen.dart';

class _InventoryCatalogHeader extends StatelessWidget {
  const _InventoryCatalogHeader({
    required this.texts,
    required this.theme,
    required this.colorScheme,
    required this.filteredCount,
    required this.lowStockCount,
  });

  final _InventoryTexts texts;
  final ThemeData theme;
  final ColorScheme colorScheme;
  final int filteredCount;
  final int lowStockCount;

  @override
  Widget build(BuildContext context) {
    final warnColor = colorScheme.tertiary;
    final highlight = lowStockCount > 0
        ? Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: warnColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: warnColor.withValues(alpha: 0.35)),
            ),
            child: Text(
              texts.lowStockHighlight(lowStockCount),
              style: theme.textTheme.labelMedium?.copyWith(
                color: warnColor,
                fontWeight: FontWeight.w700,
              ),
            ),
          )
        : null;

    return LayoutBuilder(
      builder: (context, constraints) {
        final titleBlock = Column(
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
              texts.catalogSectionSubtitle(filteredCount),
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
                height: 1.4,
              ),
            ),
          ],
        );
        if (highlight == null || constraints.maxWidth < 560) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              titleBlock,
              if (highlight != null) ...[const SizedBox(height: 10), highlight],
            ],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: titleBlock),
            const SizedBox(width: 12),
            highlight,
          ],
        );
      },
    );
  }
}

class _InventoryControlsCard extends StatelessWidget {
  const _InventoryControlsCard({
    super.key,
    required this.layout,
    required this.texts,
    required this.filteredCount,
    required this.totalCount,
    required this.searchController,
    required this.sortLabel,
    required this.sortDirection,
    required this.stockFilter,
    required this.hasActiveFilters,
    required this.onSearchChanged,
    required this.onClearSearch,
    required this.onSortChanged,
    required this.onToggleSortDirection,
    required this.onStockFilterChanged,
    required this.onClearFilters,
  });

  final _InventoryLayoutConfig layout;
  final _InventoryTexts texts;
  final int filteredCount;
  final int totalCount;
  final TextEditingController searchController;
  final String sortLabel;
  final InventorySortDirection sortDirection;
  final InventoryStockFilter stockFilter;
  final bool hasActiveFilters;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback onClearSearch;
  final ValueChanged<InventorySortOption> onSortChanged;
  final VoidCallback onToggleSortDirection;
  final ValueChanged<InventoryStockFilter> onStockFilterChanged;
  final VoidCallback onClearFilters;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final sortItems = <PopupMenuEntry<String>>[
      PopupMenuItem<String>(value: 'name', child: Text(texts.sortByNameOption)),
      PopupMenuItem<String>(
        value: 'quantity',
        child: Text(texts.sortByQuantityOption),
      ),
      PopupMenuItem<String>(
        value: 'importedDate',
        child: Text(texts.sortByImportedDateOption),
      ),
    ];

    Widget buildSortSection() {
      return Wrap(
        spacing: 10,
        runSpacing: 10,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          _MenuFilterButton(
            label: sortLabel,
            items: sortItems,
            onSelected: (value) {
              onSortChanged(switch (value) {
                'name' => InventorySortOption.name,
                'quantity' => InventorySortOption.quantity,
                _ => InventorySortOption.importedDate,
              });
            },
          ),
          _SortDirectionButton(
            ascending: sortDirection == InventorySortDirection.ascending,
            onTap: onToggleSortDirection,
          ),
        ],
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerLow.withValues(alpha: 0.94),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.82),
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
                      texts.inventoryResultsSummary(filteredCount, totalCount),
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
                  onPressed: onClearFilters,
                  icon: const Icon(Icons.restart_alt_rounded),
                  label: Text(texts.clearFiltersAction),
                ),
            ],
          ),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              if (layout.showWideControls && constraints.maxWidth >= 920) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 5,
                      child: _InventorySearchField(
                        texts: texts,
                        controller: searchController,
                        onChanged: onSearchChanged,
                        onClear: onClearSearch,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(flex: 3, child: buildSortSection()),
                  ],
                );
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _InventorySearchField(
                    texts: texts,
                    controller: searchController,
                    onChanged: onSearchChanged,
                    onClear: onClearSearch,
                  ),
                  const SizedBox(height: 12),
                  buildSortSection(),
                ],
              );
            },
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _FilterChip(
                label: texts.filterAllLabel,
                selected: stockFilter == InventoryStockFilter.all,
                onTap: () => onStockFilterChanged(InventoryStockFilter.all),
              ),
              _FilterChip(
                label: texts.filterInStockLabel,
                selected: stockFilter == InventoryStockFilter.inStock,
                onTap: () => onStockFilterChanged(InventoryStockFilter.inStock),
              ),
              _FilterChip(
                label: texts.filterLowStockLabel,
                selected: stockFilter == InventoryStockFilter.lowStock,
                onTap: () =>
                    onStockFilterChanged(InventoryStockFilter.lowStock),
              ),
              _FilterChip(
                label: texts.filterOutOfStockLabel,
                selected: stockFilter == InventoryStockFilter.outOfStock,
                onTap: () =>
                    onStockFilterChanged(InventoryStockFilter.outOfStock),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InventorySearchField extends StatelessWidget {
  const _InventorySearchField({
    required this.texts,
    required this.controller,
    required this.onChanged,
    required this.onClear,
  });

  final _InventoryTexts texts;
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: controller,
      builder: (context, value, _) {
        return Semantics(
          textField: true,
          label: texts.searchSemantic,
          child: TextField(
            controller: controller,
            onChanged: onChanged,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.search),
              hintText: texts.searchHint,
              suffixIcon: value.text.trim().isNotEmpty
                  ? IconButton(
                      tooltip: texts.clearSearchTooltip,
                      onPressed: onClear,
                      icon: const Icon(Icons.close_rounded),
                    )
                  : null,
            ),
          ),
        );
      },
    );
  }
}
