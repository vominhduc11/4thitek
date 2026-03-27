import 'dart:math' as math;

class QueryPageRequest {
  const QueryPageRequest({required this.offset, required this.limit})
    : assert(offset >= 0),
      assert(limit > 0);

  const QueryPageRequest.first({this.limit = 20}) : offset = 0;

  final int offset;
  final int limit;

  int get pageIndex => offset ~/ limit;
}

class QueryPageResult<T> {
  const QueryPageResult({
    required this.items,
    required this.isLastPage,
    required this.nextOffset,
    this.totalCount,
  });

  factory QueryPageResult.empty() {
    return QueryPageResult<T>(
      items: List<T>.empty(growable: false),
      isLastPage: true,
      nextOffset: null,
      totalCount: 0,
    );
  }

  factory QueryPageResult.slice({
    required List<T> allItems,
    required QueryPageRequest request,
  }) {
    final start = math.min(request.offset, allItems.length);
    final end = math.min(start + request.limit, allItems.length);
    final items = List<T>.unmodifiable(allItems.sublist(start, end));
    final isLastPage = end >= allItems.length;
    return QueryPageResult<T>(
      items: items,
      isLastPage: isLastPage,
      nextOffset: isLastPage ? null : end,
      totalCount: allItems.length,
    );
  }

  final List<T> items;
  final bool isLastPage;
  final int? nextOffset;
  final int? totalCount;
}
