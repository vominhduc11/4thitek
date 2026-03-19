import 'dart:async';

import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'models.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'product_catalog_controller.dart';
import 'product_detail_screen.dart';

Future<void> showGlobalSearch(BuildContext context) async {
  final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
  final orders = List<Order>.from(OrderScope.of(context).orders);
  final products =
      ProductCatalogScope.maybeOf(context)?.products ?? const <Product>[];
  await showSearch<void>(
    context: context,
    delegate: _GlobalSearchDelegate(
      isEnglish: isEnglish,
      launchContext: context,
      products: products,
      orders: orders,
    ),
  );
}

class GlobalSearchIconButton extends StatelessWidget {
  const GlobalSearchIconButton({super.key, this.tooltip});

  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final texts = _GlobalSearchTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final effectiveTooltip = tooltip ?? texts.searchButtonTooltip;
    return Semantics(
      button: true,
      label: effectiveTooltip,
      child: IconButton(
        onPressed: () => showGlobalSearch(context),
        tooltip: effectiveTooltip,
        icon: const Icon(Icons.search_outlined),
      ),
    );
  }
}

enum _SearchItemType { order, product }

class _SearchItem {
  const _SearchItem.order(this.order)
    : product = null,
      type = _SearchItemType.order;
  const _SearchItem.product(this.product)
    : order = null,
      type = _SearchItemType.product;

  final _SearchItemType type;
  final Order? order;
  final Product? product;
}

class _GlobalSearchDelegate extends SearchDelegate<void> {
  _GlobalSearchDelegate({
    required this.isEnglish,
    required this.launchContext,
    required this.products,
    required this.orders,
  });

  final bool isEnglish;
  final BuildContext launchContext;
  final List<Product> products;
  final List<Order> orders;

  Timer? _debounceTimer;
  String _debouncedQuery = '';

  _GlobalSearchTexts get _texts => _GlobalSearchTexts(isEnglish: isEnglish);

  void _scheduleSearch() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      if (_debouncedQuery != query.trim()) {
        _debouncedQuery = query.trim();
        showSuggestions(launchContext);
      }
    });
  }

  @override
  String get searchFieldLabel => _texts.searchFieldLabel;

  @override
  TextInputType get keyboardType => TextInputType.text;

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          tooltip: _texts.clearQueryTooltip,
          onPressed: () => query = '',
          icon: const Icon(Icons.close),
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      tooltip: _texts.closeSearchTooltip,
      onPressed: () => close(context, null),
      icon: const Icon(Icons.arrow_back),
    );
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    _scheduleSearch();
    if (_debouncedQuery.isEmpty) {
      return const _SearchHintState();
    }
    return _buildResultList(context);
  }

  @override
  Widget buildResults(BuildContext context) {
    _debouncedQuery = query.trim();
    return _buildResultList(context);
  }

  Widget _buildResultList(BuildContext context) {
    final items = _search(_debouncedQuery);
    if (items.isEmpty) {
      return const _SearchEmptyState();
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: items.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final item = items[index];
        final isOrder = item.type == _SearchItemType.order;
        final title = isOrder ? item.order!.id : item.product!.name;
        final subtitle = isOrder
            ? '${item.order!.receiverName} • ${item.order!.receiverPhone}'
            : item.product!.sku;
        final trailingLabel = isOrder
            ? _texts.orderItemLabel
            : _texts.productItemLabel;

        return Card(
          elevation: 0,
          child: ListTile(
            leading: Icon(
              isOrder
                  ? Icons.receipt_long_outlined
                  : Icons.inventory_2_outlined,
            ),
            title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
            subtitle: Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: Text(
              trailingLabel,
              style: Theme.of(context).textTheme.labelMedium,
            ),
            onTap: () {
              final selectedItem = item;
              close(context, null);
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (!launchContext.mounted) {
                  return;
                }
                if (selectedItem.type == _SearchItemType.order) {
                  Navigator.of(launchContext).push(
                    MaterialPageRoute(
                      builder: (_) =>
                          OrderDetailScreen(orderId: selectedItem.order!.id),
                    ),
                  );
                } else {
                  Navigator.of(launchContext).push(
                    MaterialPageRoute(
                      builder: (_) =>
                          ProductDetailScreen(product: selectedItem.product!),
                    ),
                  );
                }
              });
            },
          ),
        );
      },
    );
  }

  List<_SearchItem> _search(String rawQuery) {
    final normalized = rawQuery.trim().toLowerCase();
    if (normalized.isEmpty) {
      return const <_SearchItem>[];
    }

    final orderHits = orders
        .where((order) {
          return order.id.toLowerCase().contains(normalized) ||
              order.receiverName.toLowerCase().contains(normalized) ||
              order.receiverPhone.toLowerCase().contains(normalized);
        })
        .take(8)
        .map(_SearchItem.order);

    final productHits = products
        .where((product) {
          return product.name.toLowerCase().contains(normalized) ||
              product.sku.toLowerCase().contains(normalized) ||
              product.id.toLowerCase().contains(normalized);
        })
        .take(8)
        .map(_SearchItem.product);

    return <_SearchItem>[...orderHits, ...productHits];
  }
}

class _SearchHintState extends StatelessWidget {
  const _SearchHintState();

  @override
  Widget build(BuildContext context) {
    final texts = _GlobalSearchTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final colors = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search, size: 54, color: colors.onSurfaceVariant),
            const SizedBox(height: 12),
            Text(
              texts.hintMessage,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchEmptyState extends StatelessWidget {
  const _SearchEmptyState();

  @override
  Widget build(BuildContext context) {
    final texts = _GlobalSearchTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final colors = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off_outlined, size: 54, color: colors.error),
            const SizedBox(height: 12),
            Text(
              texts.emptyMessage,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}

class _GlobalSearchTexts {
  const _GlobalSearchTexts({required this.isEnglish});

  final bool isEnglish;

  String get searchButtonTooltip =>
      isEnglish ? 'Global search' : 'Tìm kiếm toàn cục';
  String get searchFieldLabel => isEnglish
      ? 'Search products, order IDs, or customer names...'
      : 'Tìm sản phẩm, mã đơn, tên khách...';
  String get clearQueryTooltip => isEnglish ? 'Clear keyword' : 'Xóa từ khóa';
  String get closeSearchTooltip => isEnglish ? 'Close search' : 'Đóng tìm kiếm';
  String get orderItemLabel => isEnglish ? 'Order' : 'Đơn hàng';
  String get productItemLabel => isEnglish ? 'Product' : 'Sản phẩm';
  String get hintMessage => isEnglish
      ? 'Enter a keyword to quickly find orders and products.'
      : 'Nhập từ khóa để tìm nhanh đơn hàng và sản phẩm.';
  String get emptyMessage => isEnglish
      ? 'No matching results found.'
      : 'Không tìm thấy kết quả phù hợp.';
}
