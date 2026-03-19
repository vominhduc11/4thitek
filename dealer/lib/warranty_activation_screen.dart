import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'breakpoints.dart';
import 'models.dart';
import 'order_controller.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'validation_utils.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

const double _serialSectionGap = 18;
const double _serialItemGap = 16;
const double _serialMinTapTarget = 48;

enum _SerialAssignResult { assigned, duplicate, invalid, full }

class WarrantyActivationScreen extends StatefulWidget {
  const WarrantyActivationScreen({
    super.key,
    required this.orderId,
    this.prefilledSerial,
    this.prefilledProductId,
  });

  final String orderId;
  final String? prefilledSerial;
  final String? prefilledProductId;

  @override
  State<WarrantyActivationScreen> createState() =>
      _WarrantyActivationScreenState();
}

class _WarrantyActivationScreenState extends State<WarrantyActivationScreen> {
  final _customerNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final Map<String, List<TextEditingController>> _serialControllers = {};
  DateTime _purchaseDate = DateTime.now();
  bool _isInitialized = false;
  bool _isSubmitting = false;
  bool _didApplyPrefill = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInitialized) {
      return;
    }

    final order = OrderScope.of(context).findById(widget.orderId);
    if (order == null) {
      _isInitialized = true;
      return;
    }

    final warrantyController = WarrantyScope.of(context);
    _syncSerialInputs(order, warrantyController);
    _applyPrefilledSerial(order, warrantyController);
    _prefillCustomerFromOrder(order);
    _purchaseDate = DateUtils.dateOnly(order.createdAt.toLocal());
    _isInitialized = true;
  }

  @override
  void dispose() {
    for (final inputList in _serialControllers.values) {
      for (final controller in inputList) {
        controller.dispose();
      }
    }
    _customerNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final order = OrderScope.of(context).findById(widget.orderId);
    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const BrandAppBarTitle('Xử lý serial')),
        body: const Center(
          child: Text('Không tìm thấy đơn hàng để xử lý serial.'),
        ),
      );
    }

    final canProcess =
        order.status == OrderStatus.completed ||
        order.status == OrderStatus.shipping;
    if (!canProcess) {
      return Scaffold(
        appBar: AppBar(title: const BrandAppBarTitle('Xử lý serial')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(
                  color: Theme.of(
                    context,
                  ).colorScheme.outlineVariant.withValues(alpha: 0.6),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.lock_outline, size: 38),
                    const SizedBox(height: 10),
                    Text(
                      'Chỉ đơn đang giao hoặc đã giao mới được xử lý serial.',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Trạng thái hiện tại: ${order.status.label}',
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    final warrantyController = WarrantyScope.of(context);
    final orderActivations = warrantyController.activationsForOrder(order.id);
    final activatedCount = orderActivations.length;
    final totalCount = order.totalItems;
    final isFullyActivated = activatedCount >= totalCount;
    final hasOrderCustomerData = _hasOrderCustomerProfile(order);
    final lockNameField = isFullyActivated;
    final lockPhoneField = isFullyActivated;
    final lockAddressField = isFullyActivated;
    final progressValue = totalCount == 0 ? 0.0 : activatedCount / totalCount;
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isTablet =
        MediaQuery.sizeOf(context).shortestSide >= AppBreakpoints.phone;
    final maxWidth = isTablet ? 1040.0 : double.infinity;
    final submitMaxWidth = isTablet ? 420.0 : double.infinity;
    final itemProgressColor = isDark
        ? const Color(0xFF4ADE80)
        : const Color(0xFF16A34A);

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Xử lý serial')),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: ListView(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              FadeSlideIn(
                child: _SectionCard(
                  title: 'Thông tin xử lý serial',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _InfoRow(label: 'Mã đơn hàng', value: order.id),
                      const SizedBox(height: 10),
                      _InfoRow(
                        label: 'Ngày đặt',
                        value: formatDateTime(order.createdAt),
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: colorScheme.surfaceContainerHighest.withValues(
                            alpha: 0.48,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: colorScheme.outlineVariant.withValues(
                              alpha: 0.8,
                            ),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _InfoRow(
                              label: 'Tiến độ',
                              value: '$activatedCount/$totalCount serial',
                              isEmphasis: true,
                            ),
                            const SizedBox(height: 8),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(999),
                              child: LinearProgressIndicator(
                                value: progressValue,
                                minHeight: 8,
                                backgroundColor: colorScheme
                                    .surfaceContainerHighest
                                    .withValues(alpha: 0.9),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  colorScheme.primary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Chỉ serial đã nhập kho và thuộc sản phẩm trong đơn mới được kích hoạt.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _customerNameController,
                        enabled: !lockNameField,
                        decoration: const InputDecoration(
                          labelText: 'Tên khách hàng',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        enabled: !isFullyActivated,
                        decoration: const InputDecoration(
                          labelText: 'Email khách hàng *',
                          prefixIcon: Icon(Icons.alternate_email_outlined),
                          helperText:
                              'Bắt buộc. Dùng để lưu thông tin kích hoạt bảo hành và liên hệ hỗ trợ.',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        enabled: !lockPhoneField,
                        decoration: const InputDecoration(
                          labelText: 'Số điện thoại khách hàng',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _addressController,
                        enabled: !lockAddressField,
                        decoration: const InputDecoration(
                          labelText: 'Địa chỉ khách hàng',
                          prefixIcon: Icon(Icons.location_on_outlined),
                        ),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: isFullyActivated ? null : _pickPurchaseDate,
                        icon: const Icon(Icons.event_outlined),
                        label: Text('Ngày mua: ${formatDate(_purchaseDate)}'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          alignment: Alignment.centerLeft,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Đại lý có thể chọn lại ngày khách mua tại cửa hàng trước khi kích hoạt bảo hành.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      if (hasOrderCustomerData) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Thông tin khách hàng đã được điền sẵn từ đơn hàng, đại lý có thể chỉnh sửa nếu cần.',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: _serialSectionGap),
              ...order.items.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                final activated = warrantyController.activationsForItem(
                  order.id,
                  item.product.id,
                );
                final remaining = item.quantity - activated.length;
                final serialInputs =
                    _serialControllers[item.product.id] ?? const [];
                final availableSerials = warrantyController
                    .availableImportedSerialsForOrderItem(
                      order.id,
                      item.product.id,
                    );

                return Padding(
                  padding: const EdgeInsets.only(bottom: _serialItemGap),
                  child: FadeSlideIn(
                    key: ValueKey('line-${item.product.id}'),
                    delay: Duration(milliseconds: 60 + 40 * index),
                    child: _SectionCard(
                      title: '${item.product.name} (${item.product.sku})',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _InfoRow(
                            label: 'Số lượng',
                            value: '${item.quantity}',
                          ),
                          const SizedBox(height: 10),
                          _InfoRow(
                            label: 'Đã kích hoạt',
                            value: '${activated.length}/${item.quantity}',
                          ),
                          const SizedBox(height: 10),
                          _InfoRow(
                            label: 'Serial hợp lệ trong kho',
                            value: '${availableSerials.length}',
                          ),
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(999),
                            child: LinearProgressIndicator(
                              value: item.quantity == 0
                                  ? 0
                                  : activated.length / item.quantity,
                              minHeight: 7,
                              backgroundColor: colorScheme
                                  .surfaceContainerHighest
                                  .withValues(alpha: 0.9),
                              valueColor: AlwaysStoppedAnimation<Color>(
                                itemProgressColor,
                              ),
                            ),
                          ),
                          if (activated.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            const Divider(height: 1),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: activated
                                  .map(
                                    (record) => Chip(
                                      label: Text(
                                        '${record.serial} (${formatDate(record.startsAt)} - ${formatDate(record.expiresAt)})',
                                      ),
                                      avatar: const Icon(
                                        Icons.verified_outlined,
                                        size: 16,
                                      ),
                                    ),
                                  )
                                  .toList(growable: false),
                            ),
                          ],
                          if (remaining > 0) ...[
                            const SizedBox(height: 12),
                            const Divider(height: 1),
                            const SizedBox(height: 12),
                            Text(
                              'Nhập $remaining serial còn thiếu',
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: isFullyActivated
                                      ? null
                                      : () => _scanSerialForItem(
                                          order,
                                          item,
                                          warrantyController,
                                        ),
                                  icon: const Icon(
                                    Icons.qr_code_scanner_outlined,
                                  ),
                                  label: const Text('Quét QR'),
                                  style: OutlinedButton.styleFrom(
                                    minimumSize: const Size(
                                      0,
                                      _serialMinTapTarget,
                                    ),
                                  ),
                                ),
                                TextButton.icon(
                                  onPressed: isFullyActivated
                                      ? null
                                      : () => _showBulkPasteDialog(
                                          order,
                                          item,
                                          warrantyController,
                                        ),
                                  icon: const Icon(Icons.content_paste_rounded),
                                  label: const Text('Dán nhiều serial'),
                                  style: TextButton.styleFrom(
                                    minimumSize: const Size(
                                      0,
                                      _serialMinTapTarget,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            ...serialInputs.asMap().entries.map((serialEntry) {
                              final serialIndex = serialEntry.key;
                              final controller = serialEntry.value;
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: TextField(
                                  controller: controller,
                                  textCapitalization:
                                      TextCapitalization.characters,
                                  enabled: !isFullyActivated,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.allow(
                                      RegExp(r'[A-Za-z0-9-]'),
                                    ),
                                  ],
                                  decoration: InputDecoration(
                                    labelText:
                                        'Serial ${serialIndex + 1}/$remaining',
                                    prefixIcon: const Icon(
                                      Icons.confirmation_number_outlined,
                                    ),
                                    helperText:
                                        'Ví dụ: SN-ABC-12345 (chỉ gồm chữ, số và dấu -)',
                                  ),
                                ),
                              );
                            }),
                          ],
                        ],
                      ),
                    ),
                  ),
                );
              }),
              FadeSlideIn(
                delay: const Duration(milliseconds: 240),
                child: Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: submitMaxWidth),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isFullyActivated || _isSubmitting
                            ? null
                            : () => _handleSubmit(order),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          elevation: 2,
                          shadowColor: colorScheme.primary.withValues(
                            alpha: 0.25,
                          ),
                          textStyle: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                ),
                              )
                            : Text(
                                isFullyActivated
                                    ? 'Đơn đã kích hoạt đủ serial'
                                    : 'Xác nhận kích hoạt serial',
                              ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _syncSerialInputs(Order order, WarrantyController warrantyController) {
    for (final item in order.items) {
      final activated = warrantyController.activationsForItem(
        order.id,
        item.product.id,
      );
      final activatedSerials = activated
          .map((r) => warrantyController.normalizeSerial(r.serial))
          .toSet();
      final remaining = (item.quantity - activated.length).clamp(
        0,
        item.quantity,
      );
      final existing = _serialControllers[item.product.id] ?? [];

      List<TextEditingController> finalList;
      if (existing.length == remaining) {
        finalList = existing;
      } else if (existing.length > remaining) {
        // Remove extra controllers from the end
        final toDispose = existing.sublist(remaining);
        for (final controller in toDispose) {
          controller.dispose();
        }
        finalList = existing.sublist(0, remaining);
        _serialControllers[item.product.id] = finalList;
      } else {
        // Add more controllers
        final toAdd = remaining - existing.length;
        finalList = List<TextEditingController>.from(existing)
          ..addAll(List.generate(toAdd, (_) => TextEditingController()));
        _serialControllers[item.product.id] = finalList;
      }

      // Clear any input whose serial is now activated (e.g. after partial failure)
      for (final controller in finalList) {
        final normalized = warrantyController.normalizeSerial(controller.text);
        if (normalized.isNotEmpty && activatedSerials.contains(normalized)) {
          controller.clear();
        }
      }
    }
    // Remove entries for items no longer in the order
    final productIds = order.items.map((item) => item.product.id).toSet();
    final toRemove = _serialControllers.keys
        .where((id) => !productIds.contains(id))
        .toList();
    for (final id in toRemove) {
      for (final controller in _serialControllers[id]!) {
        controller.dispose();
      }
      _serialControllers.remove(id);
    }
  }

  void _applyPrefilledSerial(
    Order order,
    WarrantyController warrantyController,
  ) {
    if (_didApplyPrefill) {
      return;
    }
    _didApplyPrefill = true;

    final rawPrefilled = widget.prefilledSerial?.trim();
    if (rawPrefilled == null || rawPrefilled.isEmpty) {
      return;
    }

    final normalized = warrantyController.normalizeSerial(rawPrefilled);
    final imported = warrantyController.findImportedSerial(normalized);
    if (imported == null) {
      _showSnackBarDeferred('Không tìm thấy serial $normalized trong kho.');
      return;
    }
    if (imported.orderId != order.id) {
      _showSnackBarDeferred(
        'Serial $normalized thuộc đơn ${imported.orderId}, không thuộc đơn ${order.id}.',
      );
      return;
    }
    if (widget.prefilledProductId != null &&
        widget.prefilledProductId != imported.productId) {
      _showSnackBarDeferred(
        'Serial $normalized không khớp sản phẩm cần xử lý.',
      );
      return;
    }

    final inputList = _serialControllers[imported.productId];
    if (inputList == null || inputList.isEmpty) {
      _showSnackBarDeferred(
        'Không còn ô serial trống cho ${imported.productName}.',
      );
      return;
    }

    final alreadyFilled = inputList.any(
      (controller) =>
          warrantyController.normalizeSerial(controller.text) == normalized,
    );
    if (alreadyFilled) {
      return;
    }

    TextEditingController? emptySlot;
    for (final controller in inputList) {
      if (controller.text.trim().isEmpty) {
        emptySlot = controller;
        break;
      }
    }
    if (emptySlot == null) {
      _showSnackBarDeferred(
        'Đã đủ serial cho ${imported.productName}, không thể tự điền thêm.',
      );
      return;
    }

    emptySlot.text = normalized;
    _showSnackBarDeferred('Đã điền serial quét: $normalized');
  }

  void _prefillCustomerFromOrder(Order order) {
    if (order.receiverName.trim().isNotEmpty &&
        _customerNameController.text.trim().isEmpty) {
      _customerNameController.text = order.receiverName.trim();
    }
    if (order.receiverPhone.trim().isNotEmpty &&
        _phoneController.text.trim().isEmpty) {
      _phoneController.text = order.receiverPhone.trim();
    }
    if (order.receiverAddress.trim().isNotEmpty &&
        _addressController.text.trim().isEmpty) {
      _addressController.text = order.receiverAddress.trim();
    }
  }

  Future<void> _pickPurchaseDate() async {
    final now = DateUtils.dateOnly(DateTime.now());
    final order = OrderScope.of(context).findById(widget.orderId);
    final minimumDate = order == null
        ? DateTime(now.year - 5, 1, 1)
        : _minimumPurchaseDateForOrder(order);
    final effectiveFirstDate = minimumDate.isAfter(now) ? now : minimumDate;
    final effectiveInitialDate = _purchaseDate.isBefore(effectiveFirstDate)
        ? effectiveFirstDate
        : (_purchaseDate.isAfter(now) ? now : _purchaseDate);
    final picked = await showDatePicker(
      context: context,
      initialDate: effectiveInitialDate,
      firstDate: effectiveFirstDate,
      lastDate: now,
      helpText: 'Chọn ngày mua',
    );
    if (!mounted || picked == null) {
      return;
    }
    setState(() {
      _purchaseDate = DateUtils.dateOnly(picked);
    });
  }

  bool _hasOrderCustomerProfile(Order order) {
    return order.receiverName.trim().isNotEmpty ||
        order.receiverPhone.trim().isNotEmpty ||
        order.receiverAddress.trim().isNotEmpty;
  }

  DateTime _minimumPurchaseDateForOrder(Order order) {
    return DateUtils.dateOnly(order.createdAt.toLocal());
  }

  String? _validatePurchaseDateForOrder(Order order) {
    final normalizedPurchaseDate = DateUtils.dateOnly(_purchaseDate);
    final minimumDate = _minimumPurchaseDateForOrder(order);
    final today = DateUtils.dateOnly(DateTime.now());
    if (normalizedPurchaseDate.isBefore(minimumDate)) {
      return 'Ngày mua không được trước ngày đặt hàng ${formatDate(minimumDate)}.';
    }
    if (normalizedPurchaseDate.isAfter(today)) {
      return 'Ngày mua không được sau ngày hôm nay.';
    }
    return null;
  }

  Future<void> _scanSerialForItem(
    Order order,
    OrderLineItem item,
    WarrantyController warrantyController,
  ) async {
    final scannedValue = await Navigator.of(
      context,
    ).push<String>(MaterialPageRoute(builder: (_) => const SerialScanScreen()));
    if (!mounted || scannedValue == null) {
      return;
    }

    final result = _assignSerialToItem(
      order: order,
      item: item,
      rawSerial: scannedValue,
      warrantyController: warrantyController,
    );
    switch (result) {
      case _SerialAssignResult.assigned:
        _showSnackBar('Đã điền serial quét cho ${item.product.name}.');
        break;
      case _SerialAssignResult.duplicate:
        _showSnackBar('Serial này đã có trong danh sách nhập.');
        break;
      case _SerialAssignResult.invalid:
        _showSnackBar('Serial quét không hợp lệ cho sản phẩm này.');
        break;
      case _SerialAssignResult.full:
        _showSnackBar('Không còn ô serial trống cho ${item.product.name}.');
        break;
    }
  }

  Future<void> _showBulkPasteDialog(
    Order order,
    OrderLineItem item,
    WarrantyController warrantyController,
  ) async {
    final textController = TextEditingController();
    final pastedText = await showDialog<String>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Dán nhiều serial'),
          content: TextField(
            controller: textController,
            maxLines: 6,
            autofocus: true,
            decoration: const InputDecoration(
              hintText: 'Mỗi serial một dòng, hoặc phân tách bằng dấu phẩy',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Hủy'),
            ),
            FilledButton(
              onPressed: () =>
                  Navigator.of(dialogContext).pop(textController.text),
              child: const Text('Điền serial'),
            ),
          ],
        );
      },
    );
    textController.dispose();

    if (!mounted || pastedText == null || pastedText.trim().isEmpty) {
      return;
    }

    final serials = _parseSerialTokens(pastedText, warrantyController);
    if (serials.isEmpty) {
      _showSnackBar('Không tìm thấy serial hợp lệ để điền.');
      return;
    }

    var assignedCount = 0;
    var duplicateCount = 0;
    var invalidCount = 0;
    var fullCount = 0;

    for (final serial in serials) {
      final result = _assignSerialToItem(
        order: order,
        item: item,
        rawSerial: serial,
        warrantyController: warrantyController,
      );
      switch (result) {
        case _SerialAssignResult.assigned:
          assignedCount++;
          break;
        case _SerialAssignResult.duplicate:
          duplicateCount++;
          break;
        case _SerialAssignResult.invalid:
          invalidCount++;
          break;
        case _SerialAssignResult.full:
          fullCount++;
          break;
      }
      if (result == _SerialAssignResult.full) {
        break;
      }
    }

    _showSnackBar(
      'Đã điền $assignedCount serial. Trùng: $duplicateCount, lỗi: $invalidCount, hết ô: $fullCount.',
    );
  }

  List<String> _parseSerialTokens(
    String raw,
    WarrantyController warrantyController,
  ) {
    final normalizedSet = <String>{};
    final chunks = raw.split(RegExp(r'[\n,; ]+'));
    for (final token in chunks) {
      final normalized = warrantyController.normalizeSerial(token);
      if (normalized.isNotEmpty) {
        normalizedSet.add(normalized);
      }
    }
    return normalizedSet.toList(growable: false);
  }

  _SerialAssignResult _assignSerialToItem({
    required Order order,
    required OrderLineItem item,
    required String rawSerial,
    required WarrantyController warrantyController,
  }) {
    final normalized = warrantyController.normalizeSerial(rawSerial);
    if (normalized.isEmpty) {
      return _SerialAssignResult.invalid;
    }

    final imported = warrantyController.findImportedSerial(normalized);
    if (imported == null ||
        imported.orderId != order.id ||
        imported.productId != item.product.id) {
      return _SerialAssignResult.invalid;
    }

    final inputList = _serialControllers[item.product.id] ?? const [];
    if (inputList.isEmpty) {
      return _SerialAssignResult.full;
    }

    final isDuplicate = inputList.any(
      (controller) =>
          warrantyController.normalizeSerial(controller.text) == normalized,
    );
    if (isDuplicate) {
      return _SerialAssignResult.duplicate;
    }

    final validationError = warrantyController.validateSerialForActivation(
      serial: normalized,
      productId: item.product.id,
      productName: item.product.name,
      orderId: order.id,
    );
    if (validationError != null) {
      return _SerialAssignResult.invalid;
    }

    TextEditingController? emptySlot;
    for (final controller in inputList) {
      if (controller.text.trim().isEmpty) {
        emptySlot = controller;
        break;
      }
    }
    if (emptySlot == null) {
      return _SerialAssignResult.full;
    }

    setState(() => emptySlot!.text = normalized);
    return _SerialAssignResult.assigned;
  }

  Future<void> _handleSubmit(Order order) async {
    final warrantyController = WarrantyScope.of(context);
    final customerName = _customerNameController.text.trim();
    final customerEmail = _emailController.text.trim();
    final customerPhone = _phoneController.text.trim();
    final customerAddress = _addressController.text.trim();

    final preErrors = <String>[];
    if (customerName.isEmpty ||
        customerEmail.isEmpty ||
        customerPhone.isEmpty ||
        customerAddress.isEmpty) {
      preErrors.add('Vui lòng nhập đầy đủ thông tin khách hàng.');
    }
    if (customerEmail.isNotEmpty && !isValidEmailAddress(customerEmail)) {
      preErrors.add('Vui lòng nhập email hợp lệ.');
    }
    final purchaseDateError = _validatePurchaseDateForOrder(order);
    if (purchaseDateError != null) preErrors.add(purchaseDateError);
    if (preErrors.isNotEmpty) {
      _showSnackBar(preErrors.join('\n'));
      return;
    }

    final newRecords = <WarrantyActivationRecord>[];
    final localSerialSet = <String>{};
    for (final item in order.items) {
      final serialInputs = _serialControllers[item.product.id] ?? const [];
      for (final controller in serialInputs) {
        final rawSerial = controller.text.trim();
        if (rawSerial.isEmpty) {
          _showSnackBar(
            'Vui lòng nhập đầy đủ serial cho ${item.product.name}.',
          );
          return;
        }

        final normalized = warrantyController.normalizeSerial(rawSerial);
        if (localSerialSet.contains(normalized)) {
          _showSnackBar('Serial $normalized đang bị trùng trong lần nhập này.');
          return;
        }
        final serialValidationError = warrantyController
            .validateSerialForActivation(
              serial: normalized,
              productId: item.product.id,
              productName: item.product.name,
              orderId: order.id,
            );
        if (serialValidationError != null) {
          _showSnackBar(serialValidationError);
          return;
        }
        localSerialSet.add(normalized);

        newRecords.add(
          WarrantyActivationRecord(
            orderId: order.id,
            productId: item.product.id,
            productName: item.product.name,
            productSku: item.product.sku,
            serial: normalized,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            warrantyMonths: item.product.warrantyMonths,
            activatedAt: DateTime.now(),
            purchaseDate: DateUtils.dateOnly(_purchaseDate),
          ),
        );
      }
    }

    if (newRecords.isEmpty) {
      _showSnackBar('Đơn hàng này đã kích hoạt đủ serial.');
      return;
    }

    setState(() => _isSubmitting = true);
    final success = await warrantyController.addActivations(newRecords);

    if (!mounted) {
      return;
    }

    // Always sync serial inputs so controllers match actual remaining count,
    // even on partial failure where some activations may have succeeded.
    setState(() {
      _isSubmitting = false;
      _syncSerialInputs(order, warrantyController);
    });

    if (!success) {
      _showSnackBar(
        'Không thể đồng bộ kích hoạt bảo hành. Vui lòng kiểm tra lại.',
      );
      return;
    }

    _jumpToTop();
    _showSnackBar('Đã kích hoạt thành công ${newRecords.length} serial.');
  }

  void _jumpToTop() {
    if (!_scrollController.hasClients) {
      return;
    }
    _scrollController.jumpTo(0);
  }

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  void _showSnackBarDeferred(String message) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      _showSnackBar(message);
    });
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 1,
      shadowColor: colorScheme.shadow.withValues(alpha: 0.16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: colorScheme.onSurface,
                fontSize: 17,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 14),
            child,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    this.isEmphasis = false,
  });

  final String label;
  final String value;
  final bool isEmphasis;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final labelStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
      color: colorScheme.onSurfaceVariant,
      fontSize: 12,
      fontWeight: FontWeight.w500,
      height: 1.3,
    );
    final valueStyle = Theme.of(context).textTheme.bodyMedium?.copyWith(
      color: colorScheme.onSurface,
      fontSize: 14,
      fontWeight: FontWeight.w700,
      height: 1.25,
    );
    final emphasisStyle = Theme.of(context).textTheme.titleSmall?.copyWith(
      color: colorScheme.primary,
      fontSize: 16,
      fontWeight: FontWeight.w800,
    );

    return Row(
      children: [
        Expanded(child: Text(label, style: labelStyle)),
        const SizedBox(width: 12),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: isEmphasis ? emphasisStyle : valueStyle,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
