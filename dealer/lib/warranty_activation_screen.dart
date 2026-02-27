import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'models.dart';
import 'order_controller.dart';
import 'utils.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

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

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Xu ly serial')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          FadeSlideIn(
            child: _SectionCard(
              title: 'Thong tin xu ly serial',
              child: Column(
                children: [
                  _InfoRow(label: 'Ma don hang', value: order.id),
                  const SizedBox(height: 8),
                  _InfoRow(
                    label: 'Ngay dat',
                    value: formatDateTime(order.createdAt),
                  ),
                  const SizedBox(height: 8),
                  _InfoRow(
                    label: 'Tien do',
                    value: '$activatedCount/$totalCount serial',
                    isEmphasis: true,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Chi serial da nhap kho va thuoc san pham trong don moi duoc kich hoat.',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _customerNameController,
                    enabled: !isFullyActivated,
                    decoration: const InputDecoration(
                      labelText: 'Ten khach hang',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    enabled: !isFullyActivated,
                    decoration: const InputDecoration(
                      labelText: 'So dien thoai khach hang',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _addressController,
                    enabled: !isFullyActivated,
                    decoration: const InputDecoration(
                      labelText: 'Dia chi khach hang',
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
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
              padding: const EdgeInsets.only(bottom: 12),
              child: FadeSlideIn(
                key: ValueKey('line-${item.product.id}'),
                delay: Duration(milliseconds: 60 + 40 * index),
                child: _SectionCard(
                  title: '${item.product.name} (${item.product.sku})',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _InfoRow(label: 'So luong', value: '${item.quantity}'),
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: 'Da kich hoat',
                        value: '${activated.length}/${item.quantity}',
                      ),
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: 'Serial hop le trong kho',
                        value: '${availableSerials.length}',
                      ),
                      if (activated.isNotEmpty) ...[
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
                        Text(
                          'Nhap $remaining serial con thieu',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
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
      elevation: 0,
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
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
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
    final style = Theme.of(context).textTheme.bodyMedium;
    final emphasisStyle = Theme.of(
      context,
    ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700);

    return Row(
      children: [
        Expanded(child: Text(label, style: isEmphasis ? emphasisStyle : style)),
        const SizedBox(width: 12),
        Text(value, style: isEmphasis ? emphasisStyle : style),
      ],
    );
  }
}
