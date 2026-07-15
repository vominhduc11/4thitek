import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_spinbox/flutter_spinbox.dart';
import 'package:infinite_scroll_pagination/infinite_scroll_pagination.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'dealer_navigation.dart';
import 'global_search.dart';
import 'models.dart';
import 'notification_controller.dart';
import 'product_catalog_controller.dart';
import 'product_query_service.dart';
import 'query_page.dart';
import 'utils.dart';
import 'widgets/cart_icon_button.dart';
import 'widgets/notification_icon_button.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/product_image.dart';
import 'widgets/skeleton_box.dart';
import 'widgets/stock_badge.dart';
import 'dealer_routes.dart';

part 'product_list_screen_support.dart';
part 'product_list_texts.dart';
part 'product_list_layout.dart';
part 'product_list_scroll.dart';
part 'product_list_query.dart';
part 'product_list_search_field.dart';
part 'product_list_filter_bar.dart';
part 'product_list_state_indicators.dart';
part 'product_list_cards.dart';

const int _pageSize = 10;
const int _lowStockThreshold = kLowStockThreshold;
const double _tabletListMaxContentWidth = 1040;
const Duration _searchDebounceDuration = Duration(milliseconds: 320);
const double _floatingFilterCollapsedHeight = 8;
const double _floatingFilterRevealDistance = 72;
const double _floatingFilterHideDistance = 132;
const int _animatedItemsPerPage = 4;

_ProductListTexts _productListTexts(BuildContext context) => _ProductListTexts(
  isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
);

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key, this.showFallbackNavigation = true});

  final bool showFallbackNavigation;

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  late final PagingController<int, Product> _pagingController;
  final TextEditingController _searchController = TextEditingController();
  final ValueNotifier<bool> _isSearchPending = ValueNotifier<bool>(false);
  final ValueNotifier<bool> _isCatalogRefreshing = ValueNotifier<bool>(false);
  late final Listenable _searchFieldListenable;
  Timer? _searchDebounce;
  Timer? _catalogRefreshDebounce;
  ProductListQuery _query = const ProductListQuery();
  ProductCatalogController? _productCatalog;
  ProductQueryRepository? _productQueryRepository;
  final Set<String> _addingProductIds = <String>{};
  final Set<String> _recentlyAddedProductIds = <String>{};
  final Map<String, Timer> _recentlyAddedTimers = <String, Timer>{};
  String? _catalogSnapshot;
  bool _isManuallyRefreshingCatalog = false;
  double _floatingFilterBarReveal = 1;
  double? _lastObservedScrollPixels;
  // Counts how many catalog change notifications should be ignored while a
  // manual local-catalog page fetch is in flight. Increment before triggering
  // a fetch that relies on local catalog data, decrement when that fetch
  // completes, and resume normal notification-driven refreshes once it
  // returns to 0.
  int _suppressedCatalogLoadCount = 0;
  // Monotonic revision token for query refreshes. Increment before each manual
  // refresh, let in-flight page requests capture the current value, and ignore
  // responses that complete after a newer revision has started.
  int _queryRevision = 0;

  @override
  void initState() {
    super.initState();
    _pagingController = PagingController(firstPageKey: 0);
    _pagingController.addPageRequestListener(_fetchPage);
    _searchFieldListenable = Listenable.merge([
      _searchController,
      _isSearchPending,
    ]);
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final nextCatalog = ProductCatalogScope.maybeOf(context);
    if (identical(_productCatalog, nextCatalog)) {
      return;
    }
    _productCatalog?.removeListener(_handleCatalogChanged);
    _catalogRefreshDebounce?.cancel();
    _productCatalog = nextCatalog;
    _productQueryRepository = nextCatalog == null
        ? null
        : ProductQueryRepository(
            localDataSource: LocalProductQueryDataSource(catalog: nextCatalog),
            remoteDataSource: BasicRemoteProductQueryDataSource(
              catalog: nextCatalog,
            ),
          );
    _catalogSnapshot = nextCatalog == null
        ? null
        : _catalogSummarySnapshot(nextCatalog);
    _productCatalog?.addListener(_handleCatalogChanged);
    unawaited(_productCatalog?.load());
  }

  @override
  void dispose() {
    _productCatalog?.removeListener(_handleCatalogChanged);
    _searchDebounce?.cancel();
    _catalogRefreshDebounce?.cancel();
    for (final timer in _recentlyAddedTimers.values) {
      timer.cancel();
    }
    _recentlyAddedTimers.clear();
    _isSearchPending.dispose();
    _isCatalogRefreshing.dispose();
    _searchController.dispose();
    _pagingController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final texts = _productListTexts(context);
    final cart = CartScope.of(context);
    final layout = _ProductListAdaptiveLayout.fromContext(context);
    final horizontalPadding = layout.centeredHorizontalPadding;
    final bottomSafeArea = MediaQuery.viewPaddingOf(context).bottom;
    final stickyBarHeight = layout.stickyHeaderExtent;
    final useFloatingFilterBar = !layout.isDesktop;
    final floatingFilterBarReveal = _floatingFilterBarReveal.clamp(0.0, 1.0);
    final floatingSpacerHeight =
        _floatingFilterCollapsedHeight +
        ((stickyBarHeight - _floatingFilterCollapsedHeight) *
            floatingFilterBarReveal);
    final floatingFilterBarVisualProgress = Curves.easeOutCubic.transform(
      floatingFilterBarReveal,
    );

    final mediaQuery = MediaQuery.of(context);
    final screenTextScale = mediaQuery.textScaler.scale(1);
    final safeTextScaler = screenTextScale.isFinite && screenTextScale > 1.4
        ? const TextScaler.linear(1.4)
        : mediaQuery.textScaler;

    return MediaQuery(
      data: mediaQuery.copyWith(textScaler: safeTextScaler),
      child: Scaffold(
        appBar: AppBar(
          leading: widget.showFallbackNavigation
              ? const DealerFallbackBackButton(
                  fallbackPath: DealerRoutePath.home,
                )
              : null,
          title: BrandAppBarTitle(texts.screenTitle),
          actions: [
            const GlobalSearchIconButton(),
            NotificationIconButton(
              count: NotificationScope.of(context).unreadCount,
              onPressed: () => context.pushDealerNotifications(),
            ),
            CartIconButton(
              count: cart.totalItems,
              onPressed: () => context.pushDealerCart(),
            ),
            const SizedBox(width: 6),
          ],
        ),
        body: Stack(
          children: [
            NotificationListener<ScrollNotification>(
              onNotification: (notification) => _handleScrollNotification(
                notification,
                useFloatingFilterBar: useFloatingFilterBar,
              ),
              child: RefreshIndicator(
                onRefresh: _refreshCatalog,
                child: CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  slivers: [
                    if (layout.isDesktop)
                      SliverPersistentHeader(
                        pinned: true,
                        delegate: _PinnedHeaderDelegate(
                          minExtent: stickyBarHeight,
                          maxExtent: stickyBarHeight,
                          child: _buildFilterBarSliverSurface(
                            context,
                            layout: layout,
                            cart: cart,
                            horizontalPadding: horizontalPadding,
                          ),
                        ),
                      )
                    else
                      SliverToBoxAdapter(
                        child: SizedBox(height: floatingSpacerHeight),
                      ),
                    SliverPadding(
                      padding: EdgeInsets.fromLTRB(
                        horizontalPadding,
                        0,
                        horizontalPadding,
                        layout.resolveResultsBottomPadding(
                          bottomSafeArea: bottomSafeArea,
                        ),
                      ),
                      sliver: _buildResultsSliver(
                        context,
                        cart,
                        layout: layout,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (useFloatingFilterBar)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: IgnorePointer(
                  ignoring: floatingFilterBarReveal <= 0.04,
                  child: ClipRect(
                    clipBehavior: Clip.hardEdge,
                    child: Transform.translate(
                      offset: Offset(
                        0,
                        -(stickyBarHeight + 12) *
                            (1 - floatingFilterBarVisualProgress),
                      ),
                      child: _buildFilterBarSliverSurface(
                        context,
                        layout: layout,
                        cart: cart,
                        horizontalPadding: horizontalPadding,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
