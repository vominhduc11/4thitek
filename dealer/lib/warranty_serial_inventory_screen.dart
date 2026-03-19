import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'utils.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';

enum SerialInventoryFilter { all, ready, activated }

enum SerialInventorySort { newest, oldest }

class WarrantySerialInventoryScreen extends StatefulWidget {
  const WarrantySerialInventoryScreen({super.key});

  @override
  State<WarrantySerialInventoryScreen> createState() =>
      _WarrantySerialInventoryScreenState();
}

class _WarrantySerialInventoryScreenState
    extends State<WarrantySerialInventoryScreen> {
  static const String _allFilterValue = '__all__';

  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;
  final ScrollController _scrollController = ScrollController();
  String _query = '';
  SerialInventoryFilter _filter = SerialInventoryFilter.all;
  SerialInventorySort _sort = SerialInventorySort.newest;
  String? _selectedOrderId;
  String? _selectedSku;

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 250), () {
      if (!mounted) {
        return;
      }
      setState(() => _query = value);
      _jumpToTop();
    });
  }

  Future<void> _refresh() async {
    await Future.wait<void>([
      OrderScope.of(context).refresh(),
      WarrantyScope.of(context).load(forceRefresh: true),
    ]);
    if (!mounted) {
      return;
    }
    setState(() {});
  }

  void _jumpToTop() {
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final texts = _WarrantySerialInventoryTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final warrantyController = WarrantyScope.of(context);
    final imported = warrantyController.importedSerials;
    final activatedSet = warrantyController.activations
        .map((record) => warrantyController.normalizeSerial(record.serial))
        .toSet();

    final orderIds =
        imported.map((record) => record.orderId).toSet().toList(growable: false)
          ..sort((a, b) => b.compareTo(a));
    final skus =
        imported
            .map((record) => record.productSku)
            .toSet()
            .toList(growable: false)
          ..sort();

    final keyword = _query.trim().toLowerCase();
    final scopedRecords = imported
        .where((record) {
          if (_selectedOrderId != null && record.orderId != _selectedOrderId) {
            return false;
          }
          if (_selectedSku != null && record.productSku != _selectedSku) {
            return false;
          }
          if (keyword.isEmpty) {
            return true;
          }
          final blob =
              '${record.serial} ${record.productSku} ${record.productName} ${record.orderId}'
                  .toLowerCase();
          return blob.contains(keyword);
        })
        .toList(growable: false);

    final scopedAllCount = scopedRecords.length;
    final scopedReadyCount = scopedRecords
        .where(
          (record) => !activatedSet.contains(
            warrantyController.normalizeSerial(record.serial),
          ),
        )
        .length;
    final scopedActivatedCount = scopedAllCount - scopedReadyCount;

    final filtered =
        scopedRecords
            .where((record) {
              final normalized = warrantyController.normalizeSerial(
                record.serial,
              );
              final isActivated = activatedSet.contains(normalized);
              if (_filter == SerialInventoryFilter.ready && isActivated) {
                return false;
              }
              if (_filter == SerialInventoryFilter.activated && !isActivated) {
                return false;
              }
              return true;
            })
            .toList(growable: false)
          ..sort((a, b) {
            if (_sort == SerialInventorySort.newest) {
              return b.importedAt.compareTo(a.importedAt);
            }
            return a.importedAt.compareTo(b.importedAt);
          });

    final importedCount = warrantyController.importedSerialCount;
    final readyCount = warrantyController.availableImportedSerialCount;
    final activatedCount = warrantyController.activatedImportedSerialCount;
    final isTablet =
        MediaQuery.sizeOf(context).shortestSide >= AppBreakpoints.phone;
    final maxWidth = isTablet ? 1100.0 : double.infinity;

    return Scaffold(
      appBar: AppBar(title: BrandAppBarTitle(texts.screenTitle)),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: _searchController,
                      onChanged: _onSearchChanged,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.search),
                        hintText: texts.searchHint,
                        suffixIcon: _query.isNotEmpty
                            ? IconButton(
                                tooltip: texts.clearSearchTooltip,
                                onPressed: () {
                                  _searchDebounce?.cancel();
                                  _searchController.clear();
                                  setState(() => _query = '');
                                  _jumpToTop();
                                },
                                icon: const Icon(Icons.close_rounded),
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _FilterChip(
                          label: texts.allFilterLabel(scopedAllCount),
                          selected: _filter == SerialInventoryFilter.all,
                          onTap: () {
                            setState(() => _filter = SerialInventoryFilter.all);
                            _jumpToTop();
                          },
                        ),
                        _FilterChip(
                          label: texts.readyFilterLabel(scopedReadyCount),
                          selected: _filter == SerialInventoryFilter.ready,
                          onTap: () {
                            setState(
                              () => _filter = SerialInventoryFilter.ready,
                            );
                            _jumpToTop();
                          },
                        ),
                        _FilterChip(
                          label: texts.activatedFilterLabel(
                            scopedActivatedCount,
                          ),
                          selected: _filter == SerialInventoryFilter.activated,
                          onTap: () {
                            setState(
                              () => _filter = SerialInventoryFilter.activated,
                            );
                            _jumpToTop();
                          },
                        ),
                        _MenuFilterButton(
                          label: _selectedOrderId == null
                              ? texts.orderFilterAllLabel
                              : texts.orderFilterLabel(_selectedOrderId!),
                          items: [
                            PopupMenuItem<String>(
                              value: _allFilterValue,
                              child: Text(texts.allOrdersLabel),
                            ),
                            ...orderIds.map(
                              (orderId) => PopupMenuItem<String>(
                                value: orderId,
                                child: Text(orderId),
                              ),
                            ),
                          ],
                          onSelected: (value) {
                            setState(() {
                              _selectedOrderId = value == _allFilterValue
                                  ? null
                                  : value;
                            });
                            _jumpToTop();
                          },
                        ),
                        _MenuFilterButton(
                          label: _selectedSku == null
                              ? texts.skuFilterAllLabel
                              : texts.skuFilterLabel(_selectedSku!),
                          items: [
                            PopupMenuItem<String>(
                              value: _allFilterValue,
                              child: Text(texts.allSkusLabel),
                            ),
                            ...skus.map(
                              (sku) => PopupMenuItem<String>(
                                value: sku,
                                child: Text(sku),
                              ),
                            ),
                          ],
                          onSelected: (value) {
                            setState(() {
                              _selectedSku = value == _allFilterValue
                                  ? null
                                  : value;
                            });
                            _jumpToTop();
                          },
                        ),
                        _MenuFilterButton(
                          label: _sort == SerialInventorySort.newest
                              ? texts.sortNewestLabel
                              : texts.sortOldestLabel,
                          items: [
                            PopupMenuItem<String>(
                              value: 'newest',
                              child: Text(texts.newestOptionLabel),
                            ),
                            PopupMenuItem<String>(
                              value: 'oldest',
                              child: Text(texts.oldestOptionLabel),
                            ),
                          ],
                          onSelected: (value) {
                            setState(() {
                              _sort = value == 'oldest'
                                  ? SerialInventorySort.oldest
                                  : SerialInventorySort.newest;
                            });
                            _jumpToTop();
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _SummaryChip(
                          label: texts.importedLabel,
                          value: '$importedCount',
                          color: const Color(0xFF1D4ED8),
                        ),
                        _SummaryChip(
                          label: texts.readyLabel,
                          value: '$readyCount',
                          color: const Color(0xFF047857),
                        ),
                        _SummaryChip(
                          label: texts.activatedLabel,
                          value: '$activatedCount',
                          color: const Color(0xFFB45309),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _refresh,
                  child: filtered.isEmpty
                      ? ListView(
                          controller: _scrollController,
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                          children: [
                            _SerialInventoryEmptyCard(
                              message: texts.emptyMessage,
                            ),
                          ],
                        )
                      : ListView.separated(
                          controller: _scrollController,
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                          itemCount: filtered.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final record = filtered[index];
                            final normalized = warrantyController
                                .normalizeSerial(record.serial);
                            final isActivated = activatedSet.contains(
                              normalized,
                            );
                            final isDark =
                                Theme.of(context).brightness == Brightness.dark;
                            final statusLabel = isActivated
                                ? texts.activatedLabel
                                : texts.readyLabel;
                            final statusColor = isActivated
                                ? (isDark
                                      ? const Color(0xFFFBBF24)
                                      : const Color(0xFFB45309))
                                : (isDark
                                      ? const Color(0xFF4ADE80)
                                      : const Color(0xFF047857));

                            return Card(
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                                side: BorderSide(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .outlineVariant
                                      .withValues(alpha: 0.6),
                                ),
                              ),
                              child: ListTile(
                                onTap: () => _openOrderDetail(record.orderId),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        record.serial,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleSmall
                                            ?.copyWith(
                                              fontWeight: FontWeight.w700,
                                            ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: statusColor.withValues(
                                          alpha: 0.1,
                                        ),
                                        borderRadius: BorderRadius.circular(
                                          999,
                                        ),
                                      ),
                                      child: Text(
                                        statusLabel,
                                        style: Theme.of(context)
                                            .textTheme
                                            .labelSmall
                                            ?.copyWith(
                                              color: statusColor,
                                              fontWeight: FontWeight.w700,
                                            ),
                                      ),
                                    ),
                                  ],
                                ),
                                subtitle: Text(
                                  texts.recordSubtitle(
                                    productSku: record.productSku,
                                    orderId: record.orderId,
                                    importedAt: formatDateTime(
                                      record.importedAt,
                                    ),
                                  ),
                                ),
                                isThreeLine: true,
                                trailing: PopupMenuButton<String>(
                                  tooltip: texts.serialActionsTooltip,
                                  icon: const Icon(Icons.more_vert),
                                  onSelected: (value) {
                                    if (value == 'copy') {
                                      _copySerial(record.serial);
                                      return;
                                    }
                                    if (value == 'order') {
                                      _openOrderDetail(record.orderId);
                                    }
                                  },
                                  itemBuilder: (context) => [
                                    PopupMenuItem<String>(
                                      value: 'copy',
                                      child: Text(texts.copySerialAction),
                                    ),
                                    PopupMenuItem<String>(
                                      value: 'order',
                                      child: Text(texts.viewOrderAction),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _copySerial(String serial) {
    Clipboard.setData(ClipboardData(text: serial));
    if (!mounted) {
      return;
    }
    final texts = _WarrantySerialInventoryTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(texts.copiedSerialMessage(serial))));
  }

  void _openOrderDetail(String orderId) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: orderId)),
    );
  }
}

class _WarrantySerialInventoryTexts {
  const _WarrantySerialInventoryTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Serial inventory' : 'Kho serial';
  String get searchHint => isEnglish
      ? 'Search serial, SKU, product name, order ID'
      : 'Tìm serial, SKU, tên sản phẩm, mã đơn';
  String get clearSearchTooltip => isEnglish ? 'Clear search' : 'Xóa tìm kiếm';
  String allFilterLabel(int count) =>
      isEnglish ? 'All ($count)' : 'Tất cả ($count)';
  String readyFilterLabel(int count) =>
      isEnglish ? 'Ready ($count)' : 'Sẵn sàng ($count)';
  String activatedFilterLabel(int count) =>
      isEnglish ? 'Activated ($count)' : 'Đã kích hoạt ($count)';
  String get orderFilterAllLabel => isEnglish ? 'Order: All' : 'Đơn: Tất cả';
  String orderFilterLabel(String orderId) =>
      isEnglish ? 'Order: $orderId' : 'Đơn: $orderId';
  String get allOrdersLabel => isEnglish ? 'All orders' : 'Tất cả đơn';
  String get skuFilterAllLabel => isEnglish ? 'SKU: All' : 'SKU: Tất cả';
  String skuFilterLabel(String sku) => 'SKU: $sku';
  String get allSkusLabel => isEnglish ? 'All SKU' : 'Tất cả SKU';
  String get sortNewestLabel =>
      isEnglish ? 'Sort: Newest' : 'Sắp xếp: Mới nhất';
  String get sortOldestLabel => isEnglish ? 'Sort: Oldest' : 'Sắp xếp: Cũ nhất';
  String get newestOptionLabel => isEnglish ? 'Newest' : 'Mới nhất';
  String get oldestOptionLabel => isEnglish ? 'Oldest' : 'Cũ nhất';
  String get importedLabel => isEnglish ? 'Imported' : 'Đã nhập';
  String get readyLabel => isEnglish ? 'Ready' : 'Sẵn sàng';
  String get activatedLabel => isEnglish ? 'Activated' : 'Đã kích hoạt';
  String get emptyMessage => isEnglish
      ? 'No serial matches the current filters.'
      : 'Không có serial phù hợp bộ lọc hiện tại.';
  String get serialActionsTooltip =>
      isEnglish ? 'Serial actions' : 'Tác vụ serial';
  String get copySerialAction => isEnglish ? 'Copy serial' : 'Sao chép serial';
  String get viewOrderAction =>
      isEnglish ? 'View order details' : 'Xem chi tiết đơn';
  String copiedSerialMessage(String serial) =>
      isEnglish ? 'Copied serial $serial.' : 'Đã sao chép serial $serial.';

  String recordSubtitle({
    required String productSku,
    required String orderId,
    required String importedAt,
  }) {
    if (isEnglish) {
      return '$productSku - Order $orderId\nImported $importedAt';
    }
    return '$productSku - Đơn $orderId\nNhập $importedAt';
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      showCheckmark: false,
      selectedColor: colorScheme.secondaryContainer,
      backgroundColor: colorScheme.surfaceContainerHighest.withValues(
        alpha: 0.38,
      ),
      side: BorderSide(
        color: colorScheme.outlineVariant.withValues(alpha: 0.8),
      ),
      labelStyle: Theme.of(context).textTheme.labelMedium?.copyWith(
        color: selected ? colorScheme.primary : colorScheme.onSurfaceVariant,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}

class _MenuFilterButton extends StatelessWidget {
  const _MenuFilterButton({
    required this.label,
    required this.items,
    required this.onSelected,
  });

  final String label;
  final List<PopupMenuEntry<String>> items;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return PopupMenuButton<String>(
      onSelected: onSelected,
      itemBuilder: (_) => items,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          border: Border.all(
            color: Theme.of(
              context,
            ).colorScheme.outlineVariant.withValues(alpha: 0.6),
          ),
          borderRadius: BorderRadius.circular(12),
          color: Theme.of(context).colorScheme.surface,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: colorScheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 6),
            const Icon(Icons.expand_more, size: 18),
          ],
        ),
      ),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  const _SummaryChip({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: color,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _SerialInventoryEmptyCard extends StatelessWidget {
  const _SerialInventoryEmptyCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.inventory_2_outlined,
              color: colorScheme.onSurfaceVariant,
              size: 28,
            ),
            const SizedBox(height: 10),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
