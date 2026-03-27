import 'dart:async';

import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'global_search_service.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'order_query_service.dart';
import 'product_catalog_controller.dart';
import 'product_detail_screen.dart';
import 'product_query_service.dart';

Future<void> showGlobalSearch(BuildContext context) async {
  final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
  final orderRepository = OrderQueryRepository(
    localDataSource: LocalOrderQueryDataSource(
      orderController: OrderScope.of(context),
    ),
  );
  final sources = <UnifiedSearchSource>[
    OrderUnifiedSearchSource(repository: orderRepository),
  ];
  final productCatalog = ProductCatalogScope.maybeOf(context);
  if (productCatalog != null) {
    sources.add(
      ProductUnifiedSearchSource(
        repository: ProductQueryRepository(
          localDataSource: LocalProductQueryDataSource(catalog: productCatalog),
          remoteDataSource: BasicRemoteProductQueryDataSource(
            catalog: productCatalog,
          ),
        ),
      ),
    );
  }

  await showSearch<void>(
    context: context,
    delegate: _GlobalSearchDelegate(
      isEnglish: isEnglish,
      launchContext: context,
      searchService: GlobalSearchService(sources: sources),
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

class _GlobalSearchDelegate extends SearchDelegate<void> {
  _GlobalSearchDelegate({
    required this.isEnglish,
    required this.launchContext,
    required this.searchService,
  });

  final bool isEnglish;
  final BuildContext launchContext;
  final GlobalSearchService searchService;

  Timer? _debounceTimer;
  String _debouncedQuery = '';
  String _lastRequestedQuery = '';
  Future<List<UnifiedSearchResult>>? _searchFuture;

  _GlobalSearchTexts get _texts => _GlobalSearchTexts(isEnglish: isEnglish);

  void _scheduleSearch() {
    _debounceTimer?.cancel();
    final nextQuery = query.trim();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      if (_debouncedQuery == nextQuery) {
        return;
      }
      _debouncedQuery = nextQuery;
      _lastRequestedQuery = '';
      _searchFuture = null;
      showSuggestions(launchContext);
    });
  }

  Future<List<UnifiedSearchResult>> _resolveSearch(String rawQuery) {
    final normalized = rawQuery.trim();
    if (normalized.isEmpty) {
      return Future<List<UnifiedSearchResult>>.value(
        const <UnifiedSearchResult>[],
      );
    }
    if (_searchFuture != null && _lastRequestedQuery == normalized) {
      return _searchFuture!;
    }
    _lastRequestedQuery = normalized;
    _searchFuture = searchService.search(
      UnifiedSearchQuery(keyword: normalized),
    );
    return _searchFuture!;
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
          onPressed: () {
            query = '';
            _debouncedQuery = '';
            _lastRequestedQuery = '';
            _searchFuture = null;
            showSuggestions(context);
          },
          icon: const Icon(Icons.close),
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      tooltip: _texts.closeSearchTooltip,
      onPressed: () {
        _debounceTimer?.cancel();
        close(context, null);
      },
      icon: const Icon(Icons.arrow_back),
    );
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    _scheduleSearch();
    final normalizedQuery = query.trim();
    if (normalizedQuery.isEmpty && _debouncedQuery.isEmpty) {
      return const _SearchHintState();
    }
    return _buildResultList(
      context,
      future: _resolveSearch(
        _debouncedQuery.isEmpty ? normalizedQuery : _debouncedQuery,
      ),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    _debounceTimer?.cancel();
    _debouncedQuery = query.trim();
    return _buildResultList(context, future: _resolveSearch(_debouncedQuery));
  }

  Widget _buildResultList(
    BuildContext context, {
    required Future<List<UnifiedSearchResult>> future,
  }) {
    return FutureBuilder<List<UnifiedSearchResult>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _SearchLoadingState(message: _texts.loadingMessage);
        }
        if (snapshot.hasError) {
          return _SearchErrorState(message: _texts.searchFailedMessage);
        }

        final items = snapshot.data ?? const <UnifiedSearchResult>[];
        if (items.isEmpty) {
          return const _SearchEmptyState();
        }
        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          itemCount: items.length,
          separatorBuilder: (_, _) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final item = items[index];
            final isOrder = item.type == UnifiedSearchResultType.order;
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
                title: Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  item.subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: Text(
                  trailingLabel,
                  style: Theme.of(context).textTheme.labelMedium,
                ),
                onTap: () {
                  final selectedItem = item;
                  _debounceTimer?.cancel();
                  close(context, null);
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (!launchContext.mounted) {
                      return;
                    }
                    if (selectedItem.type == UnifiedSearchResultType.order) {
                      Navigator.of(launchContext).push(
                        MaterialPageRoute(
                          builder: (_) => OrderDetailScreen(
                            orderId: selectedItem.order!.id,
                          ),
                        ),
                      );
                    } else {
                      Navigator.of(launchContext).push(
                        MaterialPageRoute(
                          builder: (_) => ProductDetailScreen(
                            product: selectedItem.product!,
                          ),
                        ),
                      );
                    }
                  });
                },
              ),
            );
          },
        );
      },
    );
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

class _SearchLoadingState extends StatelessWidget {
  const _SearchLoadingState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            ),
            const SizedBox(height: 12),
            Text(
              message,
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

class _SearchErrorState extends StatelessWidget {
  const _SearchErrorState({required this.message});

  final String message;

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
              message,
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
  String get loadingMessage => isEnglish
      ? 'Searching across products and orders...'
      : 'Đang tìm trên sản phẩm và đơn hàng...';
  String get searchFailedMessage => isEnglish
      ? 'Unable to complete the search right now.'
      : 'Chưa thể hoàn tất tìm kiếm lúc này.';
}
