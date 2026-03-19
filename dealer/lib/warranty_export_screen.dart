import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'breakpoints.dart';
import 'order_controller.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'validation_utils.dart';
import 'warranty_controller.dart';
import 'warranty_models.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

const double _exportSectionGap = 18;
const double _exportMinTapTarget = 48;

class WarrantyExportScreen extends StatefulWidget {
  const WarrantyExportScreen({super.key, this.prefilledSerial});

  final String? prefilledSerial;

  @override
  State<WarrantyExportScreen> createState() => _WarrantyExportScreenState();
}

class _WarrantyExportScreenState extends State<WarrantyExportScreen> {
  final _serialInputController = TextEditingController();
  final _customerNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<ImportedSerialRecord> _cart = [];
  DateTime _purchaseDate = DateUtils.dateOnly(DateTime.now());
  bool _isSubmitting = false;
  bool _didApplyPrefill = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_didApplyPrefill) return;
    _didApplyPrefill = true;

    final prefilled = widget.prefilledSerial?.trim();
    if (prefilled == null || prefilled.isEmpty) return;

    final warrantyController = WarrantyScope.of(context);
    final normalized = warrantyController.normalizeSerial(prefilled);
    final error = warrantyController.validateSerialForExport(normalized);
    if (error != null) {
      _showSnackBarDeferred(error);
      return;
    }
    final record = warrantyController.findImportedSerial(normalized);
    if (record != null) {
      _cart.add(record);
    }
  }

  @override
  void dispose() {
    _serialInputController.dispose();
    _customerNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _addSerialFromInput(WarrantyController warrantyController) {
    final raw = _serialInputController.text.trim();
    if (raw.isEmpty) return;

    final normalized = warrantyController.normalizeSerial(raw);
    if (_cartContains(normalized, warrantyController)) {
      _showSnackBar('Serial $normalized đã có trong giỏ xuất hàng.');
      return;
    }

    final error = warrantyController.validateSerialForExport(normalized);
    if (error != null) {
      _showSnackBar(error);
      return;
    }

    final record = warrantyController.findImportedSerial(normalized);
    if (record == null) return;

    setState(() {
      _cart.add(record);
      _serialInputController.clear();
    });
  }

  Future<void> _scanSerial(WarrantyController warrantyController) async {
    final scanned = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => const SerialScanScreen()),
    );
    if (!mounted || scanned == null) return;

    final normalized = warrantyController.normalizeSerial(scanned);
    if (_cartContains(normalized, warrantyController)) {
      _showSnackBar('Serial $normalized đã có trong giỏ xuất hàng.');
      return;
    }

    final error = warrantyController.validateSerialForExport(normalized);
    if (error != null) {
      _showSnackBar(error);
      return;
    }

    final record = warrantyController.findImportedSerial(normalized);
    if (record == null) return;

    setState(() => _cart.add(record));
    _showSnackBar('Đã thêm serial $normalized.');
  }

  bool _cartContains(String normalized, WarrantyController warrantyController) {
    return _cart.any(
      (r) => warrantyController.normalizeSerial(r.serial) == normalized,
    );
  }

  Future<void> _pickPurchaseDate() async {
    final now = DateUtils.dateOnly(DateTime.now());
    final firstDate = DateTime(now.year - 5, 1, 1);
    final effectiveInitialDate =
        _purchaseDate.isAfter(now) ? now : _purchaseDate;
    final picked = await showDatePicker(
      context: context,
      initialDate: effectiveInitialDate,
      firstDate: firstDate,
      lastDate: now,
      helpText: 'Chọn ngày mua',
    );
    if (!mounted || picked == null) return;
    setState(() => _purchaseDate = DateUtils.dateOnly(picked));
  }

  Future<void> _handleSubmit(
    WarrantyController warrantyController,
    OrderController orderController,
  ) async {
    if (_cart.isEmpty) {
      _showSnackBar('Chưa có serial nào trong giỏ xuất hàng.');
      return;
    }

    final customerName = _customerNameController.text.trim();
    final customerEmail = _emailController.text.trim();
    final customerPhone = _phoneController.text.trim();
    final customerAddress = _addressController.text.trim();

    final errors = <String>[];
    if (customerName.isEmpty ||
        customerEmail.isEmpty ||
        customerPhone.isEmpty ||
        customerAddress.isEmpty) {
      errors.add('Vui lòng nhập đầy đủ thông tin khách hàng.');
    }
    if (customerEmail.isNotEmpty && !isValidEmailAddress(customerEmail)) {
      errors.add('Vui lòng nhập email hợp lệ.');
    }
    if (errors.isNotEmpty) {
      _showSnackBar(errors.join('\n'));
      return;
    }

    // Re-validate all serials before submit
    for (final record in _cart) {
      final normalized = warrantyController.normalizeSerial(record.serial);
      final error = warrantyController.validateSerialForExport(normalized);
      if (error != null) {
        _showSnackBar(error);
        return;
      }
    }

    final purchaseDate = DateUtils.dateOnly(_purchaseDate);
    final newRecords = _cart.map((record) {
      final order = orderController.findById(record.orderId);
      final warrantyMonths = order?.items
              .where((item) => item.product.id == record.productId)
              .firstOrNull
              ?.product
              .warrantyMonths ??
          12;
      return WarrantyActivationRecord(
        orderId: record.orderId,
        productId: record.productId,
        productName: record.productName,
        productSku: record.productSku,
        serial: warrantyController.normalizeSerial(record.serial),
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
        warrantyMonths: warrantyMonths,
        activatedAt: DateTime.now(),
        purchaseDate: purchaseDate,
      );
    }).toList(growable: false);

    setState(() => _isSubmitting = true);
    final success = await warrantyController.addActivations(newRecords);

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (!success) {
      _showSnackBar(
        'Không thể đồng bộ kích hoạt bảo hành. Vui lòng kiểm tra lại.',
      );
      return;
    }

    // Remove activated serials from cart
    setState(() {
      _cart.removeWhere(
        (r) => warrantyController.isSerialActivated(
          warrantyController.normalizeSerial(r.serial),
        ),
      );
    });

    _scrollController.jumpTo(0);
    _showSnackBar('Đã kích hoạt thành công ${newRecords.length} serial.');
    if (_cart.isEmpty && mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final warrantyController = WarrantyScope.of(context);
    final orderController = OrderScope.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    final isTablet =
        MediaQuery.sizeOf(context).shortestSide >= AppBreakpoints.phone;
    final maxWidth = isTablet ? 1040.0 : double.infinity;
    final submitMaxWidth = isTablet ? 420.0 : double.infinity;

    // Group cart by productId for display
    final Map<String, List<ImportedSerialRecord>> byProduct = {};
    for (final record in _cart) {
      byProduct.putIfAbsent(record.productId, () => []).add(record);
    }

    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Xuất hàng'),
        actions: [
          if (_cart.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${_cart.length} serial',
                    style: TextStyle(
                      color: colorScheme.onPrimaryContainer,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: ListView(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              // Serial input section
              FadeSlideIn(
                child: _ExportSectionCard(
                  title: 'Quét hoặc nhập serial',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Thêm từng serial vào giỏ. Mỗi serial có thể thuộc đơn hàng khác nhau.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _serialInputController,
                              textCapitalization: TextCapitalization.characters,
                              inputFormatters: [
                                FilteringTextInputFormatter.allow(
                                  RegExp(r'[A-Za-z0-9-]'),
                                ),
                              ],
                              decoration: const InputDecoration(
                                labelText: 'Nhập serial',
                                prefixIcon: Icon(
                                  Icons.confirmation_number_outlined,
                                ),
                              ),
                              onSubmitted: (_) =>
                                  _addSerialFromInput(warrantyController),
                            ),
                          ),
                          const SizedBox(width: 8),
                          SizedBox(
                            height: _exportMinTapTarget + 8,
                            child: ElevatedButton(
                              onPressed: () =>
                                  _addSerialFromInput(warrantyController),
                              child: const Text('Thêm'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: () => _scanSerial(warrantyController),
                        icon: const Icon(Icons.qr_code_scanner_outlined),
                        label: const Text('Quét QR'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(
                            _exportMinTapTarget,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: _exportSectionGap),

              // Cart
              FadeSlideIn(
                delay: const Duration(milliseconds: 40),
                child: _cart.isEmpty
                    ? _EmptyCartCard()
                    : _ExportSectionCard(
                        title: 'Giỏ xuất hàng (${_cart.length} serial)',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ...byProduct.entries.toList().asMap().entries.map(
                              (outerEntry) {
                                final isLast =
                                    outerEntry.key ==
                                    byProduct.entries.length - 1;
                                final entry = outerEntry.value;
                                final records = entry.value;
                                final firstRecord = records.first;
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${firstRecord.productName} (${firstRecord.productSku})',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.w700,
                                            color: colorScheme.onSurface,
                                          ),
                                    ),
                                    const SizedBox(height: 8),
                                    ...records.map(
                                      (record) => Padding(
                                        padding: const EdgeInsets.only(
                                          bottom: 6,
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(
                                              Icons.verified_outlined,
                                              size: 16,
                                              color: colorScheme.primary,
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    record.serial,
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.w700,
                                                      fontSize: 14,
                                                    ),
                                                  ),
                                                  Text(
                                                    'Đơn: ${record.orderId}',
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .bodySmall
                                                        ?.copyWith(
                                                          color: colorScheme
                                                              .onSurfaceVariant,
                                                        ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            IconButton(
                                              icon: const Icon(
                                                Icons.remove_circle_outline,
                                                size: 20,
                                              ),
                                              color: colorScheme.error,
                                              tooltip: 'Xóa serial',
                                              onPressed: () => setState(
                                                () => _cart.remove(record),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    if (!isLast) const Divider(height: 16),
                                  ],
                                );
                              },
                            ),
                          ],
                        ),
                      ),
              ),

              const SizedBox(height: _exportSectionGap),

              // Customer info
              FadeSlideIn(
                delay: const Duration(milliseconds: 80),
                child: _ExportSectionCard(
                  title: 'Thông tin khách hàng',
                  child: Column(
                    children: [
                      TextField(
                        controller: _customerNameController,
                        decoration: const InputDecoration(
                          labelText: 'Tên khách hàng',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email khách hàng *',
                          prefixIcon: Icon(Icons.alternate_email_outlined),
                          helperText:
                              'Bắt buộc. Dùng để lưu thông tin kích hoạt bảo hành.',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'Số điện thoại',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _addressController,
                        decoration: const InputDecoration(
                          labelText: 'Địa chỉ',
                          prefixIcon: Icon(Icons.location_on_outlined),
                        ),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _pickPurchaseDate,
                        icon: const Icon(Icons.event_outlined),
                        label: Text('Ngày mua: ${formatDate(_purchaseDate)}'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          alignment: Alignment.centerLeft,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: _exportSectionGap),

              // Submit button
              FadeSlideIn(
                delay: const Duration(milliseconds: 120),
                child: Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: submitMaxWidth),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _cart.isEmpty || _isSubmitting
                            ? null
                            : () => _handleSubmit(
                                warrantyController,
                                orderController,
                              ),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          elevation: 2,
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
                                _cart.isEmpty
                                    ? 'Thêm serial để xuất hàng'
                                    : 'Kích hoạt ${_cart.length} serial',
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

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  void _showSnackBarDeferred(String message) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _showSnackBar(message);
    });
  }
}

class _EmptyCartCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
        child: Column(
          children: [
            Icon(
              Icons.shopping_bag_outlined,
              size: 36,
              color: colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 8),
            Text(
              'Chưa có serial nào trong giỏ',
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

class _ExportSectionCard extends StatelessWidget {
  const _ExportSectionCard({required this.title, required this.child});

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
          color: colorScheme.outlineVariant.withValues(alpha: 0.6),
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
