import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'models.dart';
import 'order_controller.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

const double _serialSectionGap = 18;
const double _serialItemGap = 16;
const double _serialMinTapTarget = 44;

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
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final Map<String, List<TextEditingController>> _serialControllers = {};
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
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final order = OrderScope.of(context).findById(widget.orderId);
    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const BrandAppBarTitle('Xu ly serial')),
        body: const Center(
          child: Text('Khong tim thay don hang de xu ly serial.'),
        ),
      );
    }

    if (order.status != OrderStatus.completed) {
      return Scaffold(
        appBar: AppBar(title: const BrandAppBarTitle('Xu ly serial')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFFE5EAF5)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.lock_outline, size: 38),
                    const SizedBox(height: 10),
                    Text(
                      'Chi don da giao moi duoc xu ly serial.',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Trang thai hien tai: ${order.status.label}',
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
    final lockNameField =
        isFullyActivated || order.receiverName.trim().isNotEmpty;
    final lockPhoneField =
        isFullyActivated || order.receiverPhone.trim().isNotEmpty;
    final lockAddressField =
        isFullyActivated || order.receiverAddress.trim().isNotEmpty;
    final progressValue = totalCount == 0 ? 0.0 : activatedCount / totalCount;

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Xu ly serial')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          FadeSlideIn(
            child: _SectionCard(
              title: 'Thong tin xu ly serial',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _InfoRow(label: 'Ma don hang', value: order.id),
                  const SizedBox(height: 10),
                  _InfoRow(
                    label: 'Ngay dat',
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
                      color: const Color(0xFFF8FAFF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFD9E5FB)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _InfoRow(
                          label: 'Tien do',
                          value: '$activatedCount/$totalCount serial',
                          isEmphasis: true,
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(999),
                          child: LinearProgressIndicator(
                            value: progressValue,
                            minHeight: 8,
                            backgroundColor: const Color(0xFFE2E8F0),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              Color(0xFF1D4ED8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Chi serial da nhap kho va thuoc san pham trong don moi duoc kich hoat.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _customerNameController,
                    enabled: !lockNameField,
                    decoration: const InputDecoration(
                      labelText: 'Ten khach hang',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    enabled: !lockPhoneField,
                    decoration: const InputDecoration(
                      labelText: 'So dien thoai khach hang',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _addressController,
                    enabled: !lockAddressField,
                    decoration: const InputDecoration(
                      labelText: 'Dia chi khach hang',
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                  ),
                  if (hasOrderCustomerData) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Thong tin khach hang da duoc lay tu don hang va khoa chinh sua.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF64748B),
                      ),
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
                      _InfoRow(label: 'So luong', value: '${item.quantity}'),
                      const SizedBox(height: 10),
                      _InfoRow(
                        label: 'Da kich hoat',
                        value: '${activated.length}/${item.quantity}',
                      ),
                      const SizedBox(height: 10),
                      _InfoRow(
                        label: 'Serial hop le trong kho',
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
                          backgroundColor: const Color(0xFFE2E8F0),
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            Color(0xFF16A34A),
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
                          'Nhap $remaining serial con thieu',
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
                              icon: const Icon(Icons.qr_code_scanner_outlined),
                              label: const Text('Quet QR'),
                              style: OutlinedButton.styleFrom(
                                minimumSize: const Size(0, _serialMinTapTarget),
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
                              label: const Text('Dan nhieu serial'),
                              style: TextButton.styleFrom(
                                minimumSize: const Size(0, _serialMinTapTarget),
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
                              textCapitalization: TextCapitalization.characters,
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
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isFullyActivated || _isSubmitting
                    ? null
                    : () => _handleSubmit(order),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                  elevation: 2,
                  shadowColor: const Color(0x401D4ED8),
                  textStyle: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
                child: Text(
                  isFullyActivated
                      ? 'Don da kich hoat du serial'
                      : 'Xac nhan kich hoat serial',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _syncSerialInputs(Order order, WarrantyController warrantyController) {
    for (final inputList in _serialControllers.values) {
      for (final controller in inputList) {
        controller.dispose();
      }
    }
    _serialControllers.clear();

    for (final item in order.items) {
      final activated = warrantyController.activationsForItem(
        order.id,
        item.product.id,
      );
      final remaining = item.quantity - activated.length;
      _serialControllers[item.product.id] =
          List<TextEditingController>.generate(
            remaining > 0 ? remaining : 0,
            (_) => TextEditingController(),
          );
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

  bool _hasOrderCustomerProfile(Order order) {
    return order.receiverName.trim().isNotEmpty ||
        order.receiverPhone.trim().isNotEmpty ||
        order.receiverAddress.trim().isNotEmpty;
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
    final customerPhone = _phoneController.text.trim();
    final customerAddress = _addressController.text.trim();

    if (customerName.isEmpty ||
        customerPhone.isEmpty ||
        customerAddress.isEmpty) {
      _showSnackBar('Vui long nhap day du thong tin khach hang.');
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
            'Vui long nhap day du serial cho ${item.product.name}.',
          );
          return;
        }

        final normalized = warrantyController.normalizeSerial(rawSerial);
        if (localSerialSet.contains(normalized)) {
          _showSnackBar('Serial $normalized dang bi trung trong lan nhap nay.');
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
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            warrantyMonths: item.product.warrantyMonths,
            activatedAt: DateTime.now(),
          ),
        );
      }
    }

    if (newRecords.isEmpty) {
      _showSnackBar('Don hang nay da kich hoat du serial.');
      return;
    }

    setState(() => _isSubmitting = true);
    warrantyController.addActivations(newRecords);

    if (!mounted) {
      return;
    }

    setState(() {
      _isSubmitting = false;
      _syncSerialInputs(order, warrantyController);
    });
    _showSnackBar('Da kich hoat thanh cong ${newRecords.length} serial.');
  }

  void _showSnackBar(String message) {
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
    return Card(
      elevation: 1,
      shadowColor: const Color(0x100F172A),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: const Color(0xFF0F172A),
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
    final labelStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
      color: const Color(0xFF64748B),
      fontSize: 12,
      fontWeight: FontWeight.w500,
      height: 1.3,
    );
    final valueStyle = Theme.of(context).textTheme.bodyMedium?.copyWith(
      color: const Color(0xFF0F172A),
      fontSize: 14,
      fontWeight: FontWeight.w700,
      height: 1.25,
    );
    final emphasisStyle = Theme.of(context).textTheme.titleSmall?.copyWith(
      color: const Color(0xFF1D4ED8),
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
