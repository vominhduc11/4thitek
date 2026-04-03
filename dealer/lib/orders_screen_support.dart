// ignore_for_file: invalid_use_of_protected_member

part of 'orders_screen.dart';

class _OrderCardSkeleton extends StatelessWidget {
  const _OrderCardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: const Padding(
        padding: EdgeInsets.all(16),
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
                      SkeletonBox(width: 120, height: 16),
                      SizedBox(height: 6),
                      SkeletonBox(width: double.infinity, height: 14),
                      SizedBox(height: 4),
                      SkeletonBox(width: 80, height: 12),
                    ],
                  ),
                ),
                SizedBox(width: 12),
                SkeletonBox(
                  width: 72,
                  height: 26,
                  borderRadius: BorderRadius.all(Radius.circular(20)),
                ),
              ],
            ),
            SizedBox(height: 12),
            SkeletonBox(width: 100, height: 20),
            SizedBox(height: 6),
            SkeletonBox(width: 60, height: 13),
            SizedBox(height: 6),
            SkeletonBox(width: 140, height: 13),
            SizedBox(height: 8),
            SkeletonBox(
              width: 90,
              height: 24,
              borderRadius: BorderRadius.all(Radius.circular(12)),
            ),
          ],
        ),
      ),
    );
  }
}

class _OrdersLayoutConfig {
  const _OrdersLayoutConfig({
    required this.isCompact,
    required this.contentMaxWidth,
    required this.useWrapFilters,
    required this.gridColumnCount,
    required this.gridItemExtent,
    required this.listBottomPadding,
  });

  final bool isCompact;
  final double contentMaxWidth;
  final bool useWrapFilters;
  final int gridColumnCount;
  final double gridItemExtent;
  final double listBottomPadding;

  bool get useGridLayout => gridColumnCount > 1;

  factory _OrdersLayoutConfig.fromContext(BuildContext context) {
    final mediaSize = MediaQuery.sizeOf(context);
    final shortestSide = mediaSize.shortestSide;
    final isCompact = shortestSide < AppBreakpoints.phone;
    final isWideDesktop = mediaSize.width >= 1280;
    final contentMaxWidth = isCompact
        ? double.infinity
        : isWideDesktop
        ? 1360.0
        : 1100.0;
    final constrainedWidth = isCompact
        ? mediaSize.width
        : math.min(mediaSize.width, contentMaxWidth);
    final bottomSafeArea = MediaQuery.of(context).viewPadding.bottom;
    return _OrdersLayoutConfig(
      isCompact: isCompact,
      contentMaxWidth: contentMaxWidth,
      useWrapFilters: !isCompact && constrainedWidth >= 900,
      gridColumnCount: isCompact
          ? 1
          : isWideDesktop
          ? 3
          : 2,
      gridItemExtent: isWideDesktop ? 420.0 : 460.0,
      listBottomPadding: (isCompact ? 104.0 : 88.0) + bottomSafeArea,
    );
  }
}

extension _OrdersScreenSupport on _OrdersScreenState {
  void _handleOrderControllerChanged() {
    final controller = _observedOrderController;
    if (!mounted || controller == null) {
      return;
    }
    _syncOrderSnapshot(controller.orders);
  }

  Future<void> _fetchPage(int pageKey) async {
    final requestRevision = _queryRevision;
    try {
      if (!mounted) {
        return;
      }

      final repository = _orderQueryRepository;
      if (repository == null) {
        _pagingController.appendLastPage(const <Order>[]);
        return;
      }
      final result = await repository.fetchPage(
        _query,
        QueryPageRequest(offset: pageKey, limit: _OrdersScreenState._pageSize),
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
    }
  }

  void _refreshOrders() {
    _queryRevision++;
    _pagingController.refresh();
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    final next = value.trim();
    _searchDebounce = Timer(const Duration(milliseconds: 320), () {
      if (!mounted || next == _query.searchText) {
        return;
      }
      setState(() => _query = _query.copyWith(searchText: next));
      _refreshOrders();
    });
  }

  void _clearSearch() {
    final hasValue =
        _searchController.text.isNotEmpty || _query.searchText.isNotEmpty;
    if (!hasValue) {
      return;
    }
    _searchDebounce?.cancel();
    _searchController.clear();
    if (_query.searchText.isEmpty) {
      return;
    }
    setState(() => _query = _query.copyWith(searchText: ''));
    _refreshOrders();
  }

  void _setStatusFilter(OrderStatus? status) {
    if (_query.status == status) {
      return;
    }
    setState(() => _query = _query.copyWith(status: status));
    _refreshOrders();
  }

  void _setPaymentStatusFilter(OrderPaymentStatus? paymentStatus) {
    if (_query.paymentStatus == paymentStatus) {
      return;
    }
    setState(() => _query = _query.copyWith(paymentStatus: paymentStatus));
    _refreshOrders();
  }

  void _clearActiveFilters() {
    if (_query.status == null &&
        _query.paymentStatus == null &&
        !_query.onlyOutstanding) {
      return;
    }
    setState(() {
      _query = _query.copyWith(
        status: null,
        paymentStatus: null,
        onlyOutstanding: false,
      );
    });
    _refreshOrders();
  }

  void _clearAllCriteria() {
    final hadSearch =
        _searchController.text.isNotEmpty || _query.searchText.isNotEmpty;
    final hadFilters =
        _query.status != null ||
        _query.paymentStatus != null ||
        _query.onlyOutstanding;
    if (!hadSearch && !hadFilters) {
      return;
    }
    _searchDebounce?.cancel();
    _searchController.clear();
    setState(() => _query = const OrderListQuery());
    _refreshOrders();
  }

  void _toggleOutstandingQuickFilter() {
    setState(() {
      _query = _query.copyWith(onlyOutstanding: !_query.onlyOutstanding);
    });
    _refreshOrders();
  }

  void _setSort(OrderSortOption sort) {
    if (_query.sort == sort) {
      return;
    }
    setState(() => _query = _query.copyWith(sort: sort));
    _refreshOrders();
  }

  void _syncOrderSnapshot(List<Order> orders) {
    final snapshot = Object.hashAll(
      orders.map(
        (o) => Object.hash(o.id, o.status, o.paymentStatus, o.paidAmount),
      ),
    ).toString();
    if (!_hasInitializedSnapshot) {
      _hasInitializedSnapshot = true;
      _lastOrderSnapshot = snapshot;
      return;
    }
    if (_lastOrderSnapshot == snapshot) {
      return;
    }
    _lastOrderSnapshot = snapshot;
    _orderRefreshDebounce?.cancel();
    _orderRefreshDebounce = Timer(const Duration(milliseconds: 400), () {
      if (!mounted) {
        return;
      }
      _refreshOrders();
    });
  }

  String _activeCriteriaSummary(BuildContext context) {
    final texts = _ordersTexts(context);
    final parts = <String>[];
    if (_query.onlyOutstanding) {
      parts.add(texts.outstandingCriteriaLabel);
    }
    if (_query.status != null) {
      parts.add(texts.statusCriteriaLabel(_query.status!));
    }
    if (_query.paymentStatus != null) {
      parts.add(texts.paymentCriteriaLabel(_query.paymentStatus!));
    }
    if (_query.normalizedSearchText.isNotEmpty) {
      parts.add(texts.keywordCriteriaLabel(_query.normalizedSearchText));
    }
    return parts.join(' · ');
  }
}
