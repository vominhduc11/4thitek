import 'models.dart';
import 'order_query_service.dart';
import 'product_query_service.dart';
import 'query_page.dart';

class UnifiedSearchQuery {
  const UnifiedSearchQuery({required this.keyword, this.limitPerSource = 8});

  final String keyword;
  final int limitPerSource;

  String get normalizedKeyword => keyword.trim();

  bool get isEmpty => normalizedKeyword.isEmpty;
}

enum UnifiedSearchResultType { order, product }

class UnifiedSearchResult {
  const UnifiedSearchResult.order({
    required this.order,
    required this.title,
    required this.subtitle,
  }) : product = null,
       type = UnifiedSearchResultType.order;

  const UnifiedSearchResult.product({
    required this.product,
    required this.title,
    required this.subtitle,
  }) : order = null,
       type = UnifiedSearchResultType.product;

  final UnifiedSearchResultType type;
  final String title;
  final String subtitle;
  final Order? order;
  final Product? product;
}

abstract class UnifiedSearchSource {
  Future<List<UnifiedSearchResult>> search(UnifiedSearchQuery query);
}

class GlobalSearchService {
  GlobalSearchService({required List<UnifiedSearchSource> sources})
    : _sources = List<UnifiedSearchSource>.unmodifiable(sources);

  final List<UnifiedSearchSource> _sources;

  Future<List<UnifiedSearchResult>> search(UnifiedSearchQuery query) async {
    if (query.isEmpty) {
      return const <UnifiedSearchResult>[];
    }
    final resultGroups = await Future.wait(
      _sources.map((source) => source.search(query)),
    );
    return List<UnifiedSearchResult>.unmodifiable(
      resultGroups.expand((group) => group),
    );
  }
}

class OrderUnifiedSearchSource implements UnifiedSearchSource {
  OrderUnifiedSearchSource({required this.repository});

  final OrderQueryRepository repository;

  @override
  Future<List<UnifiedSearchResult>> search(UnifiedSearchQuery query) async {
    final page = await repository.fetchPage(
      OrderListQuery(searchText: query.normalizedKeyword),
      QueryPageRequest.first(limit: query.limitPerSource),
    );
    return page.items
        .map(
          (order) => UnifiedSearchResult.order(
            order: order,
            title: order.id,
            subtitle: '${order.receiverName} • ${order.receiverPhone}',
          ),
        )
        .toList(growable: false);
  }
}

class ProductUnifiedSearchSource implements UnifiedSearchSource {
  ProductUnifiedSearchSource({required this.repository});

  final ProductQueryRepository repository;

  @override
  Future<List<UnifiedSearchResult>> search(UnifiedSearchQuery query) async {
    final page = await repository.fetchPage(
      ProductListQuery(searchText: query.normalizedKeyword),
      QueryPageRequest.first(limit: query.limitPerSource),
    );
    return page.items
        .map(
          (product) => UnifiedSearchResult.product(
            product: product,
            title: product.name,
            subtitle: product.sku,
          ),
        )
        .toList(growable: false);
  }
}
