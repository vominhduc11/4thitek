import 'dart:async';

import 'package:flutter/material.dart';

import 'models.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'product_catalog_controller.dart';
import 'product_detail_screen.dart';

Future<void> showGlobalSearch(BuildContext context) async {
  final orders = List<Order>.from(OrderScope.of(context).orders);
  final products = ProductCatalogScope.maybeOf(context)?.products ?? const <Product>[];
  await showSearch<void>(
    context: context,
    delegate: _GlobalSearchDelegate(
      launchContext: context,
      products: products,
      orders: orders,
    ),
  );
}

class GlobalSearchIconButton extends StatelessWidget {
  const GlobalSearchIconButton({super.key, this.tooltip = 'Tìm kiếm toàn cục'});

  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: tooltip,
      child: IconButton(
        onPressed: () => showGlobalSearch(context),
        tooltip: tooltip,
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
    required this.launchContext,
    required this.products,
    required this.orders,
  });

  final BuildContext launchContext;
  final List<Product> products;
  final List<Order> orders;

  Timer? _debounceTimer;
  String _debouncedQuery = '';

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
  String get searchFieldLabel => 'Tìm sản phẩm, mã đơn, tên khách...';

  @override
  TextInputType get keyboardType => TextInputType.text;

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          tooltip: 'Xóa từ khóa',
          onPressed: () => query = '',
          icon: const Icon(Icons.close),
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      tooltip: 'Đóng tìm kiếm',
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
        final trailingLabel = isOrder ? 'Đơn hàng' : 'Sản phẩm';

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
              'Nhập từ khóa để tìm nhanh đơn hàng và sản phẩm.',
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
              'Không tìm thấy kết quả phù hợp.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}
