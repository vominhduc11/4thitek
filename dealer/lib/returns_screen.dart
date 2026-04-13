import 'dart:async';

import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'dealer_navigation.dart';
import 'global_search.dart';
import 'return_request_service.dart';
import 'return_request_ui_support.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

_DealerReturnsTexts _dealerReturnsTexts(BuildContext context) =>
    _DealerReturnsTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );

class DealerReturnsScreen extends StatefulWidget {
  const DealerReturnsScreen({super.key, this.returnRequestService});

  final ReturnRequestService? returnRequestService;

  @override
  State<DealerReturnsScreen> createState() => _DealerReturnsScreenState();
}

class _DealerReturnsScreenState extends State<DealerReturnsScreen> {
  late final ReturnRequestService _returnService;
  final TextEditingController _orderCodeController = TextEditingController();
  final TextEditingController _serialController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  Timer? _searchDebounce;

  List<DealerReturnRequestSummaryRecord> _items =
      const <DealerReturnRequestSummaryRecord>[];
  DealerReturnRequestStatus? _statusFilter;
  DealerReturnRequestType? _typeFilter;
  int _page = 0;
  int _totalPages = 0;
  int _totalItems = 0;
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _errorMessage;

  bool get _hasMore => _page + 1 < _totalPages;

  @override
  void initState() {
    super.initState();
    _returnService = widget.returnRequestService ?? ReturnRequestService();
    _scrollController.addListener(_handleScroll);
    unawaited(_loadPage(reset: true));
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_handleScroll)
      ..dispose();
    _searchDebounce?.cancel();
    _orderCodeController.dispose();
    _serialController.dispose();
    if (widget.returnRequestService == null) {
      _returnService.close();
    }
    super.dispose();
  }

  void _handleScroll() {
    if (!_scrollController.hasClients || _isLoadingMore || !_hasMore) {
      return;
    }
    if (_scrollController.position.extentAfter > 320) {
      return;
    }
    unawaited(_loadPage(reset: false));
  }

  void _queueSearchRefresh() {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(
      const Duration(milliseconds: 350),
      () => unawaited(_loadPage(reset: true)),
    );
  }

  Future<void> _loadPage({required bool reset}) async {
    final targetPage = reset ? 0 : (_page + 1);
    if (reset) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    } else {
      setState(() {
        _isLoadingMore = true;
      });
    }
    try {
      final response = await _returnService.fetchPage(
        page: targetPage,
        size: 20,
        status: _statusFilter,
        type: _typeFilter,
        orderCode: _orderCodeController.text.trim(),
        serial: _serialController.text.trim(),
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = null;
        _page = response.page;
        _totalPages = response.totalPages;
        _totalItems = response.totalElements;
        if (reset) {
          _items = response.items;
        } else {
          _items = List<DealerReturnRequestSummaryRecord>.unmodifiable(
            <DealerReturnRequestSummaryRecord>[..._items, ...response.items],
          );
        }
      });
    } on ReturnRequestException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = resolveReturnServiceMessage(
          error.message,
          isEnglish: _dealerReturnsTexts(context).isEnglish,
        );
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isLoadingMore = false;
        });
      }
    }
  }

  Future<void> _reload() async {
    await _loadPage(reset: true);
  }

  @override
  Widget build(BuildContext context) {
    final texts = _dealerReturnsTexts(context);
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(texts.screenTitle),
        actions: const [GlobalSearchIconButton()],
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
          children: [
            FadeSlideIn(
              child: SectionCard(
                title: texts.filtersTitle,
                child: Column(
                  children: [
                    TextField(
                      controller: _orderCodeController,
                      onChanged: (_) => _queueSearchRefresh(),
                      decoration: InputDecoration(
                        labelText: texts.orderCodeFilterLabel,
                        prefixIcon: const Icon(Icons.receipt_long_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _serialController,
                      onChanged: (_) => _queueSearchRefresh(),
                      decoration: InputDecoration(
                        labelText: texts.serialFilterLabel,
                        prefixIcon: const Icon(Icons.qr_code_2_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final stacked = constraints.maxWidth < 620;
                        final statusField =
                            DropdownButtonFormField<DealerReturnRequestStatus?>(
                              initialValue: _statusFilter,
                              decoration: InputDecoration(
                                labelText: texts.statusFilterLabel,
                              ),
                              items: [
                                DropdownMenuItem<DealerReturnRequestStatus?>(
                                  value: null,
                                  child: Text(texts.allStatusesLabel),
                                ),
                                ...DealerReturnRequestStatus.values
                                    .where(
                                      (status) =>
                                          status !=
                                          DealerReturnRequestStatus.unknown,
                                    )
                                    .map(
                                      (status) =>
                                          DropdownMenuItem<
                                            DealerReturnRequestStatus?
                                          >(
                                            value: status,
                                            child: Text(
                                              dealerReturnStatusLabel(
                                                status,
                                                isEnglish: texts.isEnglish,
                                              ),
                                            ),
                                          ),
                                    ),
                              ],
                              onChanged: (value) {
                                setState(() {
                                  _statusFilter = value;
                                });
                                unawaited(_loadPage(reset: true));
                              },
                            );
                        final typeField =
                            DropdownButtonFormField<DealerReturnRequestType?>(
                              initialValue: _typeFilter,
                              decoration: InputDecoration(
                                labelText: texts.typeFilterLabel,
                              ),
                              items: [
                                DropdownMenuItem<DealerReturnRequestType?>(
                                  value: null,
                                  child: Text(texts.allTypesLabel),
                                ),
                                ...DealerReturnRequestType.values
                                    .where(
                                      (type) =>
                                          type !=
                                          DealerReturnRequestType.unknown,
                                    )
                                    .map(
                                      (type) =>
                                          DropdownMenuItem<
                                            DealerReturnRequestType?
                                          >(
                                            value: type,
                                            child: Text(
                                              dealerReturnTypeLabel(
                                                type,
                                                isEnglish: texts.isEnglish,
                                              ),
                                            ),
                                          ),
                                    ),
                              ],
                              onChanged: (value) {
                                setState(() {
                                  _typeFilter = value;
                                });
                                unawaited(_loadPage(reset: true));
                              },
                            );
                        if (stacked) {
                          return Column(
                            children: [
                              statusField,
                              const SizedBox(height: 12),
                              typeField,
                            ],
                          );
                        }
                        return Row(
                          children: [
                            Expanded(child: statusField),
                            const SizedBox(width: 12),
                            Expanded(child: typeField),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerRight,
                      child: OutlinedButton.icon(
                        onPressed: _isLoading ? null : _reload,
                        icon: const Icon(Icons.refresh_rounded),
                        label: Text(texts.reloadAction),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 28),
                  child: CircularProgressIndicator(strokeWidth: 2.4),
                ),
              )
            else if (_errorMessage != null)
              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: SectionCard(
                  title: texts.loadFailedTitle,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _errorMessage!,
                        style: Theme.of(
                          context,
                        ).textTheme.bodyMedium?.copyWith(color: colors.error),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton(
                        onPressed: _reload,
                        child: Text(texts.retryAction),
                      ),
                    ],
                  ),
                ),
              )
            else if (_items.isEmpty)
              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: SectionCard(
                  title: texts.emptyTitle,
                  child: Text(
                    texts.emptyMessage,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ),
              )
            else ...[
              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 10),
                  child: Text(
                    texts.resultsSummary(_items.length, _totalItems),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
              ..._items.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _ReturnSummaryCard(item: item),
                ),
              ),
              if (_isLoadingMore)
                const Padding(
                  padding: EdgeInsets.only(top: 4),
                  child: Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                )
              else if (_hasMore)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Center(
                    child: OutlinedButton.icon(
                      onPressed: () => unawaited(_loadPage(reset: false)),
                      icon: const Icon(Icons.expand_more_rounded),
                      label: Text(texts.loadMoreAction),
                    ),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ReturnSummaryCard extends StatelessWidget {
  const _ReturnSummaryCard({required this.item});

  final DealerReturnRequestSummaryRecord item;

  @override
  Widget build(BuildContext context) {
    final texts = _dealerReturnsTexts(context);
    final colors = Theme.of(context).colorScheme;
    final statusColor = dealerReturnStatusForeground(item.status);
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => context.pushDealerReturnDetail(item.id),
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
        decoration: BoxDecoration(
          color: colors.surfaceContainer,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: colors.outlineVariant.withValues(alpha: 0.78),
          ),
        ),
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
                      Text(
                        item.requestCode.isEmpty
                            ? '#${item.id}'
                            : item.requestCode,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${texts.orderLabel}: ${item.orderCode.isEmpty ? '-' : item.orderCode}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: dealerReturnStatusBackground(item.status),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: statusColor.withValues(alpha: 0.26),
                    ),
                  ),
                  child: Text(
                    dealerReturnStatusLabel(
                      item.status,
                      isEnglish: texts.isEnglish,
                    ),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: statusColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _MetaPill(
                  icon: Icons.assignment_return_outlined,
                  label: dealerReturnTypeLabel(
                    item.type,
                    isEnglish: texts.isEnglish,
                  ),
                ),
                _MetaPill(
                  icon: Icons.tune_rounded,
                  label: dealerReturnResolutionLabel(
                    item.requestedResolution,
                    isEnglish: texts.isEnglish,
                  ),
                ),
                _MetaPill(
                  icon: Icons.inventory_2_outlined,
                  label: texts.itemsSummary(
                    item.totalItems,
                    item.resolvedItems,
                  ),
                ),
                _MetaPill(
                  icon: Icons.schedule_outlined,
                  label: item.requestedAt == null
                      ? '-'
                      : texts.requestedAtLabel(
                          formatDateTime(item.requestedAt!),
                        ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: colors.primary),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _DealerReturnsTexts {
  const _DealerReturnsTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Return requests' : 'Yeu cau doi tra';
  String get filtersTitle => isEnglish ? 'Filters' : 'Bo loc';
  String get orderCodeFilterLabel => isEnglish ? 'Order code' : 'Ma don hang';
  String get serialFilterLabel => isEnglish ? 'Serial' : 'Serial';
  String get statusFilterLabel => isEnglish ? 'Status' : 'Trang thai';
  String get typeFilterLabel => isEnglish ? 'Type' : 'Loai';
  String get allStatusesLabel =>
      isEnglish ? 'All statuses' : 'Tat ca trang thai';
  String get allTypesLabel => isEnglish ? 'All types' : 'Tat ca loai';
  String get reloadAction => isEnglish ? 'Reload' : 'Tai lai';
  String get retryAction => isEnglish ? 'Retry' : 'Thu lai';
  String get loadFailedTitle =>
      isEnglish ? 'Unable to load returns' : 'Khong the tai yeu cau doi tra';
  String get emptyTitle =>
      isEnglish ? 'No return requests yet' : 'Chua co yeu cau doi tra';
  String get emptyMessage => isEnglish
      ? 'Create a return from an eligible completed order to see it here.'
      : 'Tao yeu cau tu don da hoan tat va du dieu kien de hien thi tai day.';
  String resultsSummary(int shown, int total) => isEnglish
      ? 'Showing $shown of $total request(s)'
      : 'Dang hien thi $shown/$total yeu cau';
  String get loadMoreAction => isEnglish ? 'Load more' : 'Xem them';
  String get orderLabel => isEnglish ? 'Order' : 'Don';
  String itemsSummary(int totalItems, int resolvedItems) => isEnglish
      ? '$resolvedItems/$totalItems resolved'
      : '$resolvedItems/$totalItems da xu ly';
  String requestedAtLabel(String value) =>
      isEnglish ? 'Requested: $value' : 'Yeu cau: $value';
}
