import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'breakpoints.dart';
import 'models.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'warranty_activation_screen.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/product_image.dart';

enum InventorySerialFilter { all, available, sold, defective }

const double _detailSectionSpacing = 16;
const double _detailSectionSpacingLarge = 18;
const double _detailItemSpacing = 10;
const double _detailMinTapTarget = 48;

class InventoryProductDetailScreen extends StatefulWidget {
  const InventoryProductDetailScreen({
    super.key,
    required this.product,
    required this.availableQuantity,
    required this.importedQuantity,
    required this.soldQuantity,
    required this.defectiveQuantity,
    required this.orderIds,
    required this.latestImportedAt,
  });

  final Product product;
  final int availableQuantity;
  final int importedQuantity;
  final int soldQuantity;
  final int defectiveQuantity;
  final List<String> orderIds;
  final DateTime latestImportedAt;

  @override
  State<InventoryProductDetailScreen> createState() =>
      _InventoryProductDetailScreenState();
}

class _InventoryProductDetailScreenState
    extends State<InventoryProductDetailScreen> {
  static const int _initialVisibleSerialCount = 40;
  static const int _visibleSerialStep = 40;

  final ScrollController _scrollController = ScrollController();
  InventorySerialFilter _filter = InventorySerialFilter.all;
  int _visibleSerialCount = _initialVisibleSerialCount;
  int _filteredSerialCount = 0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_handleSerialListScroll);
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_handleSerialListScroll)
      ..dispose();
    super.dispose();
  }

  void _handleSerialListScroll() {
    if (!_scrollController.hasClients ||
        _visibleSerialCount >= _filteredSerialCount) {
      return;
    }
    if (_scrollController.position.extentAfter > 280) {
      return;
    }
    setState(() {
      _visibleSerialCount =
          (_visibleSerialCount + _visibleSerialStep) > _filteredSerialCount
          ? _filteredSerialCount
          : _visibleSerialCount + _visibleSerialStep;
    });
  }

  void _jumpToTop() {
    if (_scrollController.hasClients) {
      _scrollController.jumpTo(0);
    }
  }

  Future<void> _refresh() async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    if (!mounted) {
      return;
    }
    setState(() {
      _visibleSerialCount = _initialVisibleSerialCount;
    });
    _jumpToTop();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final warrantyController = WarrantyScope.of(context);
    final orderController = OrderScope.of(context);
    final orderIdSet = widget.orderIds.toSet();
    final productSku = widget.product.sku.trim();

    final serials = warrantyController
        .importedSerialsForProduct(widget.product.id)
        .where((record) => orderIdSet.contains(record.orderId))
        .toList(growable: false);
    final activatedSet = warrantyController.activations
        .map((record) => warrantyController.normalizeSerial(record.serial))
        .toSet();
    final defectiveSet = warrantyController.defectiveSerialSetForProduct(
      widget.product.id,
    );

    // Compute live metrics from serial statuses (not stale widget params).
    int availableCount = 0;
    int soldCount = 0;
    int defectiveCount = 0;
    final serialStatuses = <String, String>{};
    for (final record in serials) {
      final status = _serialStatus(
        record.serial,
        warrantyController,
        activatedSet: activatedSet,
        defectiveSet: defectiveSet,
      );
      serialStatuses[record.serial] = status;
      switch (status) {
        case 'available':
          availableCount++;
        case 'sold':
          soldCount++;
        case 'defective':
          defectiveCount++;
      }
    }
    final importedCount = serials.length;
    final canExport = availableCount > 0;
    final filterAllLabel = 'Tất cả ($importedCount)';
    final filterAvailableLabel = 'Sẵn sàng ($availableCount)';
    final filterSoldLabel = 'Đã bán ($soldCount)';
    final filterDefectiveLabel = 'Lỗi ($defectiveCount)';

    final filtered = serials
        .where((record) {
          final status = serialStatuses[record.serial]!;
          if (_filter == InventorySerialFilter.available &&
              status != 'available') {
            return false;
          }
          if (_filter == InventorySerialFilter.sold && status != 'sold') {
            return false;
          }
          if (_filter == InventorySerialFilter.defective &&
              status != 'defective') {
            return false;
          }
          return true;
        })
        .toList(growable: false);
    _filteredSerialCount = filtered.length;
    final visibleSerials = filtered
        .take(_visibleSerialCount)
        .toList(growable: false);
    final hasMoreSerials = visibleSerials.length < _filteredSerialCount;
    final isTablet =
        MediaQuery.sizeOf(context).shortestSide >= AppBreakpoints.phone;
    final maxWidth = isTablet ? 1040.0 : double.infinity;

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Chi tiết kho')),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(
                      color: Theme.of(
                        context,
                      ).colorScheme.outlineVariant.withValues(alpha: 0.6),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Semantics(
                              image: true,
                              label: 'Ảnh sản phẩm ${widget.product.name}',
                              child: ExcludeSemantics(
                                child: ProductImage(
                                  product: widget.product,
                                  width: 72,
                                  height: 72,
                                  borderRadius: BorderRadius.circular(14),
                                  fit: BoxFit.cover,
                                  iconSize: 20,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.product.name,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(
                                          color: colorScheme.onSurface,
                                          fontSize: 18,
                                          fontWeight: FontWeight.w800,
                                          height: 1.2,
                                        ),
                                  ),
                                  if (productSku.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      'SKU: $productSku',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: colorScheme.onSurfaceVariant,
                                            fontSize: 11.5,
                                            height: 1.3,
                                          ),
                                    ),
                                  ],
                                  const SizedBox(height: 4),
                                  Text(
                                    'Nhập gần nhất: ${formatDateTime(widget.latestImportedAt)}',
                                    style: Theme.of(context).textTheme.bodySmall
                                        ?.copyWith(
                                          color: colorScheme.onSurfaceVariant,
                                          fontSize: 12,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (widget.product.description.trim().isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            widget.product.description.trim(),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: colorScheme.onSurfaceVariant,
                                  fontSize: 12.5,
                                  height: 1.35,
                                ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        LayoutBuilder(
                          builder: (context, constraints) {
                            final columns = constraints.maxWidth >= 860 ? 4 : 2;
                            const spacing = 8.0;
                            final tileWidth =
                                (constraints.maxWidth -
                                    spacing * (columns - 1)) /
                                columns;
                            final metrics = <Widget>[
                              _InventoryMetric(
                                label: 'Tồn kho',
                                value: '$availableCount',
                                color: const Color(0xFF047857),
                                icon: Icons.inventory_2_outlined,
                              ),
                              _InventoryMetric(
                                label: 'Đã nhập',
                                value: '$importedCount',
                                color: const Color(0xFF1D4ED8),
                                icon: Icons.south_west_rounded,
                              ),
                              _InventoryMetric(
                                label: 'Đã bán',
                                value: '$soldCount',
                                color: const Color(0xFFB45309),
                                icon: Icons.north_east_rounded,
                              ),
                              _InventoryMetric(
                                label: 'Lỗi',
                                value: '$defectiveCount',
                                color: const Color(0xFFB91C1C),
                                icon: Icons.error_outline_rounded,
                              ),
                            ];
                            return Wrap(
                              spacing: spacing,
                              runSpacing: spacing,
                              children: [
                                for (final metric in metrics)
                                  SizedBox(width: tileWidth, child: metric),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: _detailSectionSpacingLarge),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    Semantics(
                      button: true,
                      enabled: canExport,
                      label: 'Xuất hàng',
                      child: ElevatedButton.icon(
                        onPressed: canExport
                            ? () async {
                                final orderId = await _pickOrderForExport(
                                  orderController,
                                  warrantyController,
                                );
                                if (!mounted) {
                                  return;
                                }
                                if (orderId == null) {
                                  _showSnackBar(
                                    'Không tìm thấy đơn phù hợp để xuất hàng.',
                                  );
                                  return;
                                }
                                Navigator.of(this.context).push(
                                  MaterialPageRoute(
                                    builder: (_) => WarrantyActivationScreen(
                                      orderId: orderId,
                                    ),
                                  ),
                                );
                              }
                            : null,
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(120, 46),
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          textStyle: const TextStyle(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        icon: const Icon(Icons.local_shipping_outlined),
                        label: const Text('Xuất hàng'),
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: () {
                        unawaited(
                          _handleScanSerialForProduct(
                            orderController,
                            warrantyController,
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(120, 46),
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        foregroundColor: colorScheme.onSurfaceVariant,
                        side: BorderSide(
                          color: colorScheme.outlineVariant.withValues(
                            alpha: 0.9,
                          ),
                        ),
                        backgroundColor: colorScheme.surfaceContainerHighest
                            .withValues(alpha: 0.4),
                        textStyle: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      icon: const Icon(Icons.qr_code_scanner_outlined),
                      label: const Text('Quét QR'),
                    ),
                  ],
                ),
                const SizedBox(height: _detailSectionSpacing),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _SerialFilterChip(
                      label: filterAllLabel,
                      selected: _filter == InventorySerialFilter.all,
                      onTap: () => _setFilter(InventorySerialFilter.all),
                    ),
                    _SerialFilterChip(
                      label: filterAvailableLabel,
                      selected: _filter == InventorySerialFilter.available,
                      onTap: () => _setFilter(InventorySerialFilter.available),
                    ),
                    _SerialFilterChip(
                      label: filterSoldLabel,
                      selected: _filter == InventorySerialFilter.sold,
                      onTap: () => _setFilter(InventorySerialFilter.sold),
                    ),
                    _SerialFilterChip(
                      label: filterDefectiveLabel,
                      selected: _filter == InventorySerialFilter.defective,
                      onTap: () => _setFilter(InventorySerialFilter.defective),
                    ),
                  ],
                ),
                const SizedBox(height: _detailSectionSpacing),
                if (serials.isEmpty)
                  const _SerialEmptyStateCard(
                    message: 'Sản phẩm này chưa có danh sách serial.',
                  )
                else if (filtered.isEmpty)
                  const _SerialEmptyStateCard(
                    message: 'Không có serial phù hợp bộ lọc.',
                  )
                else
                  ...visibleSerials.map((record) {
                    final status = serialStatuses[record.serial]!;
                    return Padding(
                      padding: const EdgeInsets.only(
                        bottom: _detailItemSpacing,
                      ),
                      child: _SerialTile(
                        record: record,
                        status: status,
                        onOpenOrder: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  OrderDetailScreen(orderId: record.orderId),
                            ),
                          );
                        },
                        onCopy: () => _copySerial(record.serial),
                        onToggleDefective: () async {
                          final next = status != 'defective';
                          final error = await warrantyController
                              .setSerialDefective(
                                serial: record.serial,
                                defective: next,
                              );
                          if (!mounted || error == null) {
                            return;
                          }
                          _showSnackBar(error);
                        },
                      ),
                    );
                  }),
                if (hasMoreSerials) ...[
                  const SizedBox(height: 8),
                  const Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _setFilter(InventorySerialFilter filter) {
    setState(() {
      _filter = filter;
      _visibleSerialCount = _initialVisibleSerialCount;
    });
    _jumpToTop();
  }

  String _serialStatus(
    String serial,
    WarrantyController controller, {
    required Set<String> activatedSet,
    required Set<String> defectiveSet,
  }) {
    final normalized = controller.normalizeSerial(serial);
    if (defectiveSet.contains(normalized)) {
      return 'defective';
    }
    if (activatedSet.contains(normalized)) {
      return 'sold';
    }
    return 'available';
  }

  Future<void> _handleScanSerialForProduct(
    OrderController orderController,
    WarrantyController warrantyController,
  ) async {
    final scannedValue = await Navigator.of(
      context,
    ).push<String>(MaterialPageRoute(builder: (_) => const SerialScanScreen()));
    if (!mounted || scannedValue == null) {
      return;
    }

    final normalized = warrantyController.normalizeSerial(scannedValue);
    if (normalized.isEmpty) {
      _showSnackBar('Mã quét không hợp lệ.');
      return;
    }

    final imported = warrantyController.findImportedSerial(normalized);
    if (imported == null) {
      _showSnackBar('Không tìm thấy serial $normalized trong kho.');
      return;
    }
    if (imported.productId != widget.product.id) {
      _showSnackBar('Serial $normalized không thuộc ${widget.product.name}.');
      return;
    }
    if (!widget.orderIds.contains(imported.orderId)) {
      _showSnackBar(
        'Serial $normalized không thuộc nhóm đơn của sản phẩm này.',
      );
      return;
    }

    final order = orderController.findById(imported.orderId);
    if (order == null || order.status != OrderStatus.completed) {
      _showSnackBar('Serial $normalized chưa thuộc đơn đã hoàn thành.');
      return;
    }

    final validationError = warrantyController.validateSerialForActivation(
      serial: normalized,
      productId: imported.productId,
      productName: imported.productName,
      orderId: imported.orderId,
    );
    if (validationError != null) {
      _showSnackBar(validationError);
      return;
    }

    if (!mounted) {
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => WarrantyActivationScreen(
          orderId: imported.orderId,
          prefilledSerial: normalized,
          prefilledProductId: imported.productId,
        ),
      ),
    );
  }

  Future<String?> _pickOrderForExport(
    OrderController orderController,
    WarrantyController warrantyController,
  ) async {
    final options = <_ExportOrderOption>[];
    for (final orderId in widget.orderIds) {
      final order = orderController.findById(orderId);
      if (order == null || order.status != OrderStatus.completed) {
        continue;
      }
      final available = warrantyController
          .availableImportedSerialCountForOrderItem(
            order.id,
            widget.product.id,
          );
      if (available > 0) {
        options.add(
          _ExportOrderOption(
            orderId: order.id,
            availableSerialCount: available,
            importedAt: order.createdAt,
          ),
        );
      }
    }
    if (options.isEmpty) {
      return null;
    }
    options.sort((a, b) => b.importedAt.compareTo(a.importedAt));
    if (options.length == 1) {
      return options.first.orderId;
    }
    if (!mounted) {
      return null;
    }

    return showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      requestFocus: true,
      builder: (sheetContext) {
        final colorScheme = Theme.of(sheetContext).colorScheme;
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Chọn đơn để xuất hàng',
                  style: Theme.of(sheetContext).textTheme.titleSmall?.copyWith(
                    color: colorScheme.onSurface,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Sản phẩm có nhiều đơn còn serial khả dụng.',
                  style: Theme.of(sheetContext).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 12),
                for (final option in options) ...[
                  Material(
                    color: colorScheme.surfaceContainerHighest.withValues(
                      alpha: 0.38,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: colorScheme.outlineVariant.withValues(
                          alpha: 0.6,
                        ),
                      ),
                    ),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () =>
                          Navigator.of(sheetContext).pop(option.orderId),
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'Đơn ${option.orderId}',
                                    style: Theme.of(sheetContext)
                                        .textTheme
                                        .bodyLarge
                                        ?.copyWith(
                                          color: colorScheme.onSurface,
                                          fontWeight: FontWeight.w700,
                                        ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Còn ${option.availableSerialCount} serial • ${formatDate(option.importedAt)}',
                                    style: Theme.of(sheetContext)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(
                                          color: colorScheme.onSurfaceVariant,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                            Icon(
                              Icons.chevron_right_rounded,
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  void _copySerial(String serial) {
    Clipboard.setData(ClipboardData(text: serial));
    _showSnackBar('Đã sao chép serial $serial.');
  }

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _ExportOrderOption {
  const _ExportOrderOption({
    required this.orderId,
    required this.availableSerialCount,
    required this.importedAt,
  });

  final String orderId;
  final int availableSerialCount;
  final DateTime importedAt;
}

class _SerialEmptyStateCard extends StatelessWidget {
  const _SerialEmptyStateCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
        ),
      ),
    );
  }
}

class _InventoryMetric extends StatelessWidget {
  const _InventoryMetric({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  final String label;
  final String value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.28)),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 76),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 14, color: color),
                const SizedBox(width: 6),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              value,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: color,
                fontSize: 18,
                fontWeight: FontWeight.w800,
                height: 1.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SerialFilterChip extends StatelessWidget {
  const _SerialFilterChip({
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
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _detailMinTapTarget),
      child: ChoiceChip(
        label: Text(
          label,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: colorScheme.onSurface),
        ),
        selected: selected,
        showCheckmark: false,
        onSelected: (_) => onTap(),
        selectedColor: colorScheme.secondaryContainer,
        backgroundColor: colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.38,
        ),
        side: BorderSide(
          color: colorScheme.outlineVariant.withValues(alpha: 0.8),
        ),
      ),
    );
  }
}

class _SerialTile extends StatelessWidget {
  const _SerialTile({
    required this.record,
    required this.status,
    required this.onOpenOrder,
    required this.onCopy,
    required this.onToggleDefective,
  });

  final ImportedSerialRecord record;
  final String status;
  final VoidCallback onOpenOrder;
  final VoidCallback onCopy;
  final Future<void> Function() onToggleDefective;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = switch (status) {
      'available' => isDark ? const Color(0xFF4ADE80) : const Color(0xFF15803D),
      'sold' => isDark ? const Color(0xFFFBBF24) : const Color(0xFFB45309),
      _ => isDark ? const Color(0xFFFCA5A5) : const Color(0xFFB91C1C),
    };
    final statusLabel = switch (status) {
      'available' => 'Sẵn sàng',
      'sold' => 'Đã bán',
      _ => 'Lỗi',
    };

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    record.serial,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: colorScheme.onSurface,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$statusLabel • ${record.warehouseName}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: color.withValues(alpha: 0.84),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Nhập: ${formatDateTime(record.importedAt)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 2),
                  TextButton(
                    onPressed: onOpenOrder,
                    style: TextButton.styleFrom(
                      minimumSize: const Size(100, 48),
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.symmetric(horizontal: 0),
                      foregroundColor: colorScheme.primary,
                    ),
                    child: Text(
                      'Đơn ${record.orderId}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colorScheme.primary,
                        fontWeight: FontWeight.w600,
                        decoration: TextDecoration.underline,
                        decorationThickness: 1.2,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            PopupMenuButton<String>(
              tooltip: 'Tùy chọn serial',
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(
                minWidth: _detailMinTapTarget,
                minHeight: _detailMinTapTarget,
              ),
              onSelected: (value) async {
                switch (value) {
                  case 'copy':
                    onCopy();
                  case 'defective':
                    await onToggleDefective();
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem<String>(
                  value: 'copy',
                  child: Text('Sao chép serial'),
                ),
                PopupMenuItem<String>(
                  value: 'defective',
                  child: Text(
                    status == 'defective' ? 'Bỏ đánh dấu lỗi' : 'Đánh dấu lỗi',
                  ),
                ),
              ],
              child: Container(
                width: _detailMinTapTarget,
                height: _detailMinTapTarget,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.more_vert,
                  color: color.withValues(alpha: 0.88),
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
