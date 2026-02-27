import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'models.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'warranty_activation_screen.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/product_image.dart';

enum InventorySerialFilter { all, available, sold }

void _noopSerialTransfer() {}
const double _detailSectionSpacing = 16;
const double _detailSectionSpacingLarge = 18;
const double _detailItemSpacing = 10;
const double _detailMinTapTarget = 44;

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
  InventorySerialFilter _filter = InventorySerialFilter.all;

  @override
  Widget build(BuildContext context) {
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

    final filtered = serials
        .where((record) {
          final status = _serialStatus(
            record.serial,
            warrantyController,
            activatedSet: activatedSet,
            defectiveSet: defectiveSet,
          );
          if (_filter == InventorySerialFilter.available &&
              status != 'available') {
            return false;
          }
          if (_filter == InventorySerialFilter.sold && status != 'sold') {
            return false;
          }
          return true;
        })
        .toList(growable: false);

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Chi tiết kho')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: Color(0xFFE5EAF5)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ProductImage(
                        product: widget.product,
                        width: 72,
                        height: 72,
                        borderRadius: BorderRadius.circular(14),
                        fit: BoxFit.cover,
                        iconSize: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.product.name,
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(
                                    color: const Color(0xFF0F172A),
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    height: 1.2,
                                  ),
                            ),
                            if (productSku.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                'SKU: $productSku',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(
                                      color: const Color(0xFF94A3B8),
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
                                    color: const Color(0xFF64748B),
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
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF64748B),
                        fontSize: 12.5,
                        height: 1.35,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _InventoryMetric(
                        label: 'Tồn kho',
                        value: '${widget.availableQuantity}',
                        color: const Color(0xFF047857),
                        icon: Icons.inventory_2_outlined,
                      ),
                      _InventoryMetric(
                        label: 'Đã nhập',
                        value: '${widget.importedQuantity}',
                        color: const Color(0xFF1D4ED8),
                        icon: Icons.south_west_rounded,
                      ),
                      _InventoryMetric(
                        label: 'Đã bán',
                        value: '${widget.soldQuantity}',
                        color: const Color(0xFFB45309),
                        icon: Icons.north_east_rounded,
                      ),
                    ],
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
                label: 'Xuất hàng',
                child: ElevatedButton.icon(
                  onPressed: () {
                    final orderId = _pickOrderForExport(
                      orderController,
                      warrantyController,
                    );
                    if (orderId == null) {
                      _showSnackBar('Không tìm thấy đơn phù hợp để xuất hàng.');
                      return;
                    }
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) =>
                            WarrantyActivationScreen(orderId: orderId),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(120, 46),
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    textStyle: const TextStyle(fontWeight: FontWeight.w700),
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
                  foregroundColor: const Color(0xFF475569),
                  side: const BorderSide(color: Color(0xFFD1DAE8)),
                  backgroundColor: const Color(0xFFF8FAFC),
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
                label: 'Tất cả',
                selected: _filter == InventorySerialFilter.all,
                onTap: () =>
                    setState(() => _filter = InventorySerialFilter.all),
              ),
              _SerialFilterChip(
                label: 'Sẵn sàng',
                selected: _filter == InventorySerialFilter.available,
                onTap: () =>
                    setState(() => _filter = InventorySerialFilter.available),
              ),
              _SerialFilterChip(
                label: 'Đã bán',
                selected: _filter == InventorySerialFilter.sold,
                onTap: () =>
                    setState(() => _filter = InventorySerialFilter.sold),
              ),
            ],
          ),
          const SizedBox(height: _detailSectionSpacing),
          if (serials.isEmpty)
            const Card(
              elevation: 0,
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('Sản phẩm này chưa có danh sách serial.'),
              ),
            )
          else if (filtered.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: Text('Không có serial phù hợp bộ lọc.')),
            )
          else
            ...filtered.map((record) {
              final status = _serialStatus(
                record.serial,
                warrantyController,
                activatedSet: activatedSet,
                defectiveSet: defectiveSet,
              );
              return Padding(
                padding: const EdgeInsets.only(bottom: _detailItemSpacing),
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
                  onToggleDefective: () {
                    final next = status != 'defective';
                    warrantyController.markSerialDefective(
                      serial: record.serial,
                      defective: next,
                    );
                  },
                  onTransferMain: _noopSerialTransfer,
                  onTransferBackup: _noopSerialTransfer,
                ),
              );
            }),
        ],
      ),
    );
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

  String? _pickOrderForExport(
    OrderController orderController,
    WarrantyController warrantyController,
  ) {
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
        return order.id;
      }
    }
    return null;
  }

  void _copySerial(String serial) {
    Clipboard.setData(ClipboardData(text: serial));
    _showSnackBar('Đã sao chép serial $serial.');
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
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
                    color: const Color(0xFF64748B),
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
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _detailMinTapTarget),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        showCheckmark: false,
        onSelected: (_) => onTap(),
        selectedColor: const Color(0xFFDCE9FF),
        side: const BorderSide(color: Color(0xFFE0E6F2)),
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
    this.onTransferMain = _noopSerialTransfer,
    this.onTransferBackup = _noopSerialTransfer,
  });

  final ImportedSerialRecord record;
  final String status;
  final VoidCallback onOpenOrder;
  final VoidCallback onCopy;
  final VoidCallback onToggleDefective;
  final VoidCallback onTransferMain;
  final VoidCallback onTransferBackup;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'available' => const Color(0xFF15803D),
      'sold' => const Color(0xFFB45309),
      _ => const Color(0xFFB91C1C),
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
        side: const BorderSide(color: Color(0xFFE5EAF5)),
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
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: const Color(0xFF0F172A),
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
                      color: const Color(0xFF64748B),
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 2),
                  TextButton(
                    onPressed: onOpenOrder,
                    style: TextButton.styleFrom(
                      minimumSize: const Size(100, 44),
                      alignment: Alignment.centerLeft,
                      padding: const EdgeInsets.symmetric(horizontal: 0),
                      foregroundColor: const Color(0xFF1D4ED8),
                    ),
                    child: Text(
                      'Đơn ${record.orderId}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF1D4ED8),
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
              onSelected: (value) {
                switch (value) {
                  case 'copy':
                    onCopy();
                  case 'defective':
                    onToggleDefective();
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
