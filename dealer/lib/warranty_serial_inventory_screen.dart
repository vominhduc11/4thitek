import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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
  String _query = '';
  SerialInventoryFilter _filter = SerialInventoryFilter.all;
  SerialInventorySort _sort = SerialInventorySort.newest;
  String? _selectedOrderId;
  String? _selectedSku;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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

    final filtered =
        imported
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

              if (_selectedOrderId != null &&
                  record.orderId != _selectedOrderId) {
                return false;
              }
              if (_selectedSku != null && record.productSku != _selectedSku) {
                return false;
              }

              final keyword = _query.trim().toLowerCase();
              if (keyword.isEmpty) {
                return true;
              }

              final blob =
                  '${record.serial} ${record.productSku} ${record.productName} ${record.orderId}'
                      .toLowerCase();
              return blob.contains(keyword);
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

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Kho serial')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _searchController,
                  onChanged: (value) => setState(() => _query = value),
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: 'Tim serial, SKU, ten san pham, ma don',
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _FilterChip(
                      label: 'Tat ca',
                      selected: _filter == SerialInventoryFilter.all,
                      onTap: () =>
                          setState(() => _filter = SerialInventoryFilter.all),
                    ),
                    _FilterChip(
                      label: 'San sang',
                      selected: _filter == SerialInventoryFilter.ready,
                      onTap: () =>
                          setState(() => _filter = SerialInventoryFilter.ready),
                    ),
                    _FilterChip(
                      label: 'Da kich hoat',
                      selected: _filter == SerialInventoryFilter.activated,
                      onTap: () => setState(
                        () => _filter = SerialInventoryFilter.activated,
                      ),
                    ),
                    _MenuFilterButton(
                      label: _selectedOrderId == null
                          ? 'Don: Tat ca'
                          : 'Don: $_selectedOrderId',
                      items: [
                        const PopupMenuItem<String>(
                          value: _allFilterValue,
                          child: Text('Tat ca don'),
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
                      },
                    ),
                    _MenuFilterButton(
                      label: _selectedSku == null
                          ? 'SKU: Tat ca'
                          : 'SKU: $_selectedSku',
                      items: [
                        const PopupMenuItem<String>(
                          value: _allFilterValue,
                          child: Text('Tat ca SKU'),
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
                      },
                    ),
                    _MenuFilterButton(
                      label: _sort == SerialInventorySort.newest
                          ? 'Sap xep: Moi nhat'
                          : 'Sap xep: Cu nhat',
                      items: const [
                        PopupMenuItem<String>(
                          value: 'newest',
                          child: Text('Moi nhat'),
                        ),
                        PopupMenuItem<String>(
                          value: 'oldest',
                          child: Text('Cu nhat'),
                        ),
                      ],
                      onSelected: (value) {
                        setState(() {
                          _sort = value == 'oldest'
                              ? SerialInventorySort.oldest
                              : SerialInventorySort.newest;
                        });
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
                      label: 'Da nhap',
                      value: '$importedCount',
                      color: const Color(0xFF1D4ED8),
                    ),
                    _SummaryChip(
                      label: 'San sang',
                      value: '$readyCount',
                      color: const Color(0xFF047857),
                    ),
                    _SummaryChip(
                      label: 'Da kich hoat',
                      value: '$activatedCount',
                      color: const Color(0xFFB45309),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: filtered.isEmpty
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text('Khong co serial phu hop bo loc hien tai.'),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    itemCount: filtered.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final record = filtered[index];
                      final normalized = warrantyController.normalizeSerial(
                        record.serial,
                      );
                      final isActivated = activatedSet.contains(normalized);
                      final statusLabel = isActivated
                          ? 'Da kich hoat'
                          : 'San sang';
                      final statusColor = isActivated
                          ? const Color(0xFFB45309)
                          : const Color(0xFF047857);

                      return Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                          side: const BorderSide(color: Color(0xFFE5EAF5)),
                        ),
                        child: ListTile(
                          onTap: () => _openOrderDetail(record.orderId),
                          title: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  record.serial,
                                  style: Theme.of(context).textTheme.titleSmall
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: statusColor.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  statusLabel,
                                  style: Theme.of(context).textTheme.labelSmall
                                      ?.copyWith(
                                        color: statusColor,
                                        fontWeight: FontWeight.w700,
                                      ),
                                ),
                              ),
                            ],
                          ),
                          subtitle: Text(
                            '${record.productSku} - Don ${record.orderId}\nNhap ${formatDateTime(record.importedAt)}',
                          ),
                          isThreeLine: true,
                          trailing: PopupMenuButton<String>(
                            tooltip: 'Tac vu serial',
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
                              const PopupMenuItem<String>(
                                value: 'copy',
                                child: Text('Sao chep serial'),
                              ),
                              const PopupMenuItem<String>(
                                value: 'order',
                                child: Text('Xem chi tiet don'),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _copySerial(String serial) {
    Clipboard.setData(ClipboardData(text: serial));
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text('Da sao chep serial $serial.')));
  }

  void _openOrderDetail(String orderId) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: orderId)),
    );
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
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      showCheckmark: false,
      selectedColor: const Color(0xFFDCE9FF),
      side: const BorderSide(color: Color(0xFFE0E6F2)),
      labelStyle: Theme.of(context).textTheme.labelMedium?.copyWith(
        color: selected ? const Color(0xFF1D4ED8) : const Color(0xFF475569),
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
    return PopupMenuButton<String>(
      onSelected: onSelected,
      itemBuilder: (_) => items,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFE0E6F2)),
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: const Color(0xFF334155),
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
              color: const Color(0xFF475569),
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
