import 'models.dart';
import 'product_catalog_controller.dart';
import 'query_page.dart';

enum StockFilter { all, inStock, lowStock, outOfStock }

enum SortOption { none, priceAsc, priceDesc, nameAsc, nameDesc }

class ProductListQuery {
  const ProductListQuery({
    this.searchText = '',
    this.stockFilter = StockFilter.all,
    this.sortOption = SortOption.none,
  });

  final String searchText;
  final StockFilter stockFilter;
  final SortOption sortOption;

  String get normalizedSearchText => searchText.trim();

  bool get hasFilters =>
      normalizedSearchText.isNotEmpty ||
      stockFilter != StockFilter.all ||
      sortOption != SortOption.none;

  bool get canUseBasicRemotePaging => !hasFilters;

  ProductListQuery copyWith({
    String? searchText,
    StockFilter? stockFilter,
    SortOption? sortOption,
  }) {
    return ProductListQuery(
      searchText: searchText ?? this.searchText,
      stockFilter: stockFilter ?? this.stockFilter,
      sortOption: sortOption ?? this.sortOption,
    );
  }

  Map<String, String> toRemoteQueryParameters(QueryPageRequest pageRequest) {
    final params = <String, String>{
      'page': '${pageRequest.pageIndex}',
      'size': '${pageRequest.limit}',
    };
    if (normalizedSearchText.isNotEmpty) {
      params['q'] = normalizedSearchText;
    }
    if (stockFilter != StockFilter.all) {
      params['stock'] = stockFilter.name;
    }
    if (sortOption != SortOption.none) {
      params['sort'] = sortOption.name;
    }
    return params;
  }

  @override
  bool operator ==(Object other) {
    return other is ProductListQuery &&
        other.searchText == searchText &&
        other.stockFilter == stockFilter &&
        other.sortOption == sortOption;
  }

  @override
  int get hashCode => Object.hash(searchText, stockFilter, sortOption);
}

abstract class ProductQueryDataSource {
  bool supports(ProductListQuery query);

  Future<QueryPageResult<Product>> fetchPage(
    ProductListQuery query,
    QueryPageRequest pageRequest,
  );
}

class ProductQueryRepository {
  ProductQueryRepository({
    required this.localDataSource,
    this.remoteDataSource,
  });

  final LocalProductQueryDataSource localDataSource;
  final ProductQueryDataSource? remoteDataSource;

  Future<QueryPageResult<Product>> fetchPage(
    ProductListQuery query,
    QueryPageRequest pageRequest,
  ) async {
    final remote = remoteDataSource;
    if (remote != null && remote.supports(query)) {
      return remote.fetchPage(query, pageRequest);
    }
    return localDataSource.fetchPage(query, pageRequest);
  }
}

class LocalProductQueryDataSource implements ProductQueryDataSource {
  LocalProductQueryDataSource({required this.catalog});

  final ProductCatalogController catalog;

  @override
  bool supports(ProductListQuery query) => true;

  @override
  Future<QueryPageResult<Product>> fetchPage(
    ProductListQuery query,
    QueryPageRequest pageRequest,
  ) async {
    await catalog.load();
    final errorMessage = catalog.errorMessage;
    if (errorMessage != null) {
      throw ProductCatalogException(errorMessage);
    }
    final filteredProducts = _applyProductQuery(
      List<Product>.from(catalog.products),
      query,
    );
    return QueryPageResult<Product>.slice(
      allItems: filteredProducts,
      request: pageRequest,
    );
  }

  List<Product> readAll(ProductListQuery query) {
    return _applyProductQuery(List<Product>.from(catalog.products), query);
  }
}

class BasicRemoteProductQueryDataSource implements ProductQueryDataSource {
  BasicRemoteProductQueryDataSource({required this.catalog});

  final ProductCatalogController catalog;

  @override
  bool supports(ProductListQuery query) => query.canUseBasicRemotePaging;

  @override
  Future<QueryPageResult<Product>> fetchPage(
    ProductListQuery query,
    QueryPageRequest pageRequest,
  ) async {
    final result = await catalog.fetchPage(
      pageRequest.pageIndex,
      pageRequest.limit,
    );
    return QueryPageResult<Product>(
      items: List<Product>.unmodifiable(result.items),
      isLastPage: result.isLast,
      nextOffset: result.isLast ? null : pageRequest.offset + pageRequest.limit,
    );
  }
}

List<Product> _applyProductQuery(
  List<Product> products,
  ProductListQuery query,
) {
  final normalizedQuery = query.normalizedSearchText.toLowerCase();
  final filtered = products
      .where((product) {
        if (normalizedQuery.isNotEmpty) {
          final name = product.name.toLowerCase();
          final sku = product.sku.toLowerCase();
          final productId = product.id.toLowerCase();
          if (!name.contains(normalizedQuery) &&
              !sku.contains(normalizedQuery) &&
              !productId.contains(normalizedQuery)) {
            return false;
          }
        }

        switch (query.stockFilter) {
          case StockFilter.inStock:
            return product.stock > 0;
          case StockFilter.lowStock:
            return product.stock > 0 && product.stock <= kLowStockThreshold;
          case StockFilter.outOfStock:
            return product.stock == 0;
          case StockFilter.all:
            return true;
        }
      })
      .toList(growable: false);

  final sorted = List<Product>.of(filtered, growable: true);
  switch (query.sortOption) {
    case SortOption.priceAsc:
      sorted.sort((a, b) => a.price.compareTo(b.price));
      break;
    case SortOption.priceDesc:
      sorted.sort((a, b) => b.price.compareTo(a.price));
      break;
    case SortOption.nameAsc:
      sorted.sort((a, b) => a.name.compareTo(b.name));
      break;
    case SortOption.nameDesc:
      sorted.sort((a, b) => b.name.compareTo(a.name));
      break;
    case SortOption.none:
      break;
  }
  return List<Product>.unmodifiable(sorted);
}
