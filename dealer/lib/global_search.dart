import 'dart:async';

import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'dealer_navigation.dart';
import 'global_search_service.dart';
import 'order_controller.dart';
import 'order_query_service.dart';
import 'product_catalog_controller.dart';
import 'product_query_service.dart';
import 'widgets/skeleton_box.dart';

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
        return Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 880),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = items[index];
                final isOrder = item.type == UnifiedSearchResultType.order;
                final trailingLabel = isOrder
                    ? _texts.orderItemLabel
                    : _texts.productItemLabel;
                final colors = Theme.of(context).colorScheme;
                final titleStyle = Theme.of(
                  context,
                ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700);
                final subtitleStyle = Theme.of(context).textTheme.bodyMedium
                    ?.copyWith(color: colors.onSurfaceVariant, height: 1.35);
                final trailingChip = Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 7,
                  ),
                  decoration: BoxDecoration(
                    color: colors.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    trailingLabel,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                );
                final leadingIcon = Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color:
                        (isOrder
                                ? colors.primaryContainer
                                : colors.secondaryContainer)
                            .withValues(alpha: 0.82),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    isOrder
                        ? Icons.receipt_long_outlined
                        : Icons.inventory_2_outlined,
                    color: isOrder ? colors.primary : colors.secondary,
                  ),
                );

                return RepaintBoundary(
                  child: Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                      side: BorderSide(
                        color: colors.outlineVariant.withValues(alpha: 0.72),
                      ),
                    ),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(18),
                      onTap: () {
                        final selectedItem = item;
                        _debounceTimer?.cancel();
                        close(context, null);
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          if (!launchContext.mounted) {
                            return;
                          }
                          if (selectedItem.type ==
                              UnifiedSearchResultType.order) {
                            launchContext.pushDealerOrderDetail(
                              selectedItem.order!.id,
                            );
                          } else {
                            launchContext.pushDealerProductDetail(
                              selectedItem.product!.id,
                            );
                          }
                        });
                      },
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final isCompactRow = constraints.maxWidth < 560;
                          final details = Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: titleStyle,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                item.subtitle,
                                maxLines: isCompactRow ? 3 : 2,
                                overflow: TextOverflow.ellipsis,
                                style: subtitleStyle,
                              ),
                            ],
                          );

                          return Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                            child: isCompactRow
                                ? Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          leadingIcon,
                                          const SizedBox(width: 14),
                                          Expanded(child: details),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      trailingChip,
                                    ],
                                  )
                                : Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      leadingIcon,
                                      const SizedBox(width: 14),
                                      Expanded(child: details),
                                      const SizedBox(width: 12),
                                      trailingChip,
                                    ],
                                  ),
                          );
                        },
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
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
    return _SearchStatePanel(
      icon: Icons.search_rounded,
      iconColor: colors.primary,
      title: texts.hintTitle,
      message: texts.hintMessage,
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        alignment: WrapAlignment.center,
        children: [
          _SearchContextChip(label: texts.orderItemLabel),
          _SearchContextChip(label: texts.productItemLabel),
        ],
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
    return _SearchStatePanel(
      icon: Icons.search_off_rounded,
      iconColor: colors.error,
      title: texts.emptyTitle,
      message: texts.emptyMessage,
      child: _SearchContextChip(label: texts.refineHint),
    );
  }
}

class _SearchLoadingState extends StatelessWidget {
  const _SearchLoadingState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const _SearchLoadingCard(),
                const SizedBox(height: 12),
                const _SearchLoadingCard(),
                const SizedBox(height: 12),
                const _SearchLoadingCard(),
                const SizedBox(height: 16),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
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

class _SearchErrorState extends StatelessWidget {
  const _SearchErrorState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final texts = _GlobalSearchTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final colors = Theme.of(context).colorScheme;
    return _SearchStatePanel(
      icon: Icons.error_outline_rounded,
      iconColor: colors.error,
      title: texts.errorTitle,
      message: message,
      child: OutlinedButton.icon(
        onPressed: () => showGlobalSearch(context),
        icon: const Icon(Icons.refresh_rounded, size: 18),
        label: Text(texts.retryLabel),
      ),
    );
  }
}

class _SearchStatePanel extends StatelessWidget {
  const _SearchStatePanel({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.message,
    this.child,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String message;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return RepaintBoundary(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                color: colors.surfaceContainer,
                border: Border.all(
                  color: colors.outlineVariant.withValues(alpha: 0.78),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: iconColor.withValues(alpha: 0.14),
                    ),
                    child: Icon(icon, size: 30, color: iconColor),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    message,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colors.onSurfaceVariant,
                      height: 1.45,
                    ),
                  ),
                  if (child != null) ...[const SizedBox(height: 18), child!],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SearchContextChip extends StatelessWidget {
  const _SearchContextChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: Theme.of(context).colorScheme.surfaceContainerLow,
      ),
      child: Text(
        label,
        style: Theme.of(
          context,
        ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _SearchLoadingCard extends StatelessWidget {
  const _SearchLoadingCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: Theme.of(context).colorScheme.surfaceContainer,
      ),
      child: const Row(
        children: [
          SkeletonBox(
            width: 42,
            height: 42,
            borderRadius: BorderRadius.all(Radius.circular(14)),
          ),
          SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(
                  width: double.infinity,
                  height: 14,
                  borderRadius: BorderRadius.all(Radius.circular(10)),
                ),
                SizedBox(height: 8),
                SkeletonBox(
                  width: 180,
                  height: 14,
                  borderRadius: BorderRadius.all(Radius.circular(10)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _GlobalSearchTexts {
  const _GlobalSearchTexts({required this.isEnglish});

  final bool isEnglish;

  String get searchButtonTooltip =>
      isEnglish ? 'Search orders and products' : 'Tìm đơn hàng và sản phẩm';
  String get searchFieldLabel => isEnglish
      ? 'Search products, order IDs, customer names, or phone numbers...'
      : 'Tìm sản phẩm, mã đơn, tên khách hoặc số điện thoại...';
  String get clearQueryTooltip => isEnglish ? 'Clear keyword' : 'Xóa từ khóa';
  String get closeSearchTooltip => isEnglish ? 'Close search' : 'Đóng tìm kiếm';
  String get orderItemLabel => isEnglish ? 'Order' : 'Đơn hàng';
  String get productItemLabel => isEnglish ? 'Product' : 'Sản phẩm';
  String get hintTitle => isEnglish
      ? 'Search orders and products'
      : 'Tìm nhanh đơn hàng và sản phẩm';
  String get hintMessage => isEnglish
      ? 'Use one search box for catalog items and recent dealer orders.'
      : 'Dùng một ô tìm kiếm để tra nhanh sản phẩm và đơn hàng đại lý.';
  String get emptyTitle =>
      isEnglish ? 'No matching results' : 'Không có kết quả phù hợp';
  String get emptyMessage => isEnglish
      ? 'No matching results found.'
      : 'Chưa tìm thấy kết quả phù hợp.';
  String get refineHint => isEnglish
      ? 'Try a SKU, order ID, customer name, or phone number'
      : 'Hãy thử mã SKU, mã đơn, tên khách hoặc số điện thoại';
  String get loadingMessage => isEnglish
      ? 'Searching dealer products and orders...'
      : 'Đang tìm trong sản phẩm và đơn hàng...';
  String get searchFailedMessage => isEnglish
      ? 'Unable to complete the search right now.'
      : 'Chưa thể hoàn tất tìm kiếm lúc này.';
  String get errorTitle => isEnglish
      ? 'Search is temporarily unavailable'
      : 'Tìm kiếm tạm thời không khả dụng';
  String get retryLabel => isEnglish ? 'Retry' : 'Thử lại';
}
