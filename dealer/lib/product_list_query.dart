// ignore_for_file: invalid_use_of_protected_member

part of 'product_list_screen.dart';

extension _ProductListQueryActions on _ProductListScreenState {
  Future<void> _fetchPage(int pageKey) async {
    final requestRevision = _queryRevision;
    var usesLocalCatalogSource = false;
    try {
      final repository = _productQueryRepository;
      if (repository == null) {
        _pagingController.appendLastPage(const <Product>[]);
        return;
      }
      usesLocalCatalogSource =
          !(repository.remoteDataSource?.supports(_query) ?? false);
      if (usesLocalCatalogSource) {
        _suppressedCatalogLoadCount++;
      }

      final result = await repository.fetchPage(
        _query,
        QueryPageRequest(offset: pageKey, limit: _pageSize),
      );
      if (!mounted || requestRevision != _queryRevision) {
        return;
      }
      if (result.isLastPage) {
        _pagingController.appendLastPage(result.items);
      } else {
        _pagingController.appendPage(
          result.items,
          result.nextOffset ?? pageKey + result.items.length,
        );
      }
    } catch (error) {
      _pagingController.error = error;
    } finally {
      if (usesLocalCatalogSource) {
        final nextSuppressedCatalogLoadCount = _suppressedCatalogLoadCount - 1;
        assert(
          nextSuppressedCatalogLoadCount >= 0,
          '_suppressedCatalogLoadCount went negative - suppression logic is unbalanced',
        );
        _suppressedCatalogLoadCount = math.max(
          0,
          nextSuppressedCatalogLoadCount,
        );
      }
    }
  }

  void _onSearchChanged() {
    _searchDebounce?.cancel();
    final next = _searchController.text.trim();
    if (next == _query.searchText) {
      _setSearchPending(false);
      return;
    }
    _setSearchPending(true);
    _searchDebounce = Timer(
      _searchDebounceDuration,
      () => _applySearchText(_searchController.text),
    );
  }

  void _applySearchText(String rawValue) {
    final next = rawValue.trim();
    if (!mounted) {
      return;
    }
    if (next == _query.searchText) {
      _setSearchPending(false);
      return;
    }
    _setSearchPending(false);
    setState(() => _query = _query.copyWith(searchText: next));
    _refreshProducts();
  }

  void _submitSearch(String rawValue) {
    _searchDebounce?.cancel();
    _applySearchText(rawValue);
  }

  void _setSearchPending(bool value) {
    if (_isSearchPending.value == value) {
      return;
    }
    _isSearchPending.value = value;
  }

  void _setStockFilter(StockFilter filter) {
    if (filter == _query.stockFilter) {
      return;
    }
    setState(() => _query = _query.copyWith(stockFilter: filter));
    _refreshProducts();
  }

  void _setSortOption(SortOption option) {
    if (option == _query.sortOption) {
      return;
    }
    setState(() => _query = _query.copyWith(sortOption: option));
    _refreshProducts();
  }

  void _resetFilters() {
    _searchDebounce?.cancel();
    _setSearchPending(false);
    setState(() {
      _query = const ProductListQuery();
      _searchController.text = '';
    });
    _refreshProducts();
  }

  void _clearSearch() {
    if (_searchController.text.isEmpty && _query.searchText.isEmpty) {
      return;
    }
    _searchDebounce?.cancel();
    _setSearchPending(false);
    setState(() {
      _query = _query.copyWith(searchText: '');
      _searchController.clear();
    });
    _refreshProducts();
  }
}
