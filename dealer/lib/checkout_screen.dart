import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'cart_controller.dart';
import 'dealer_profile_storage.dart';
import 'mock_data.dart';
import 'models.dart';
import 'order_controller.dart';
import 'order_success_screen.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  OrderPaymentMethod _method = OrderPaymentMethod.bankTransfer;
  DealerProfile _profile = DealerProfile.defaults;

  @override
  void initState() {
    super.initState();
    loadDealerProfile().then((p) {
      if (mounted) setState(() => _profile = p);
    });
  }

  OrderPaymentStatus get _previewPaymentStatus {
    switch (_method) {
      case OrderPaymentMethod.bankTransfer:
        return OrderPaymentStatus.unpaid;
      case OrderPaymentMethod.debt:
        return OrderPaymentStatus.debtRecorded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final cart = CartScope.of(context);
    final orderController = OrderScope.of(context);
    final isTablet = MediaQuery.sizeOf(context).shortestSide >= 600;
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;
    final subtotal = cart.subtotal;
    final discountPercent = cart.discountPercent;
    final discountAmount = cart.discountAmount;
    final totalAfterDiscount = cart.totalAfterDiscount;
    final vatAmount = cart.vatAmount;
    const shippingFee = 0;
    final total = cart.total;

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Thanh toán')),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              FadeSlideIn(
                child: _SectionCard(
                  title: 'Thông tin nhận hàng',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _profile.businessName,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _profile.shippingAddress,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'SĐT: ${_profile.phone}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: _SectionCard(
                  title: 'Phương thức thanh toán',
                  child: RadioGroup<OrderPaymentMethod>(
                    groupValue: _method,
                    onChanged: (value) {
                      if (value == null) {
                        return;
                      }
                      setState(() => _method = value);
                    },
                    child: Column(
                      children: [
                        RadioListTile<OrderPaymentMethod>(
                          value: OrderPaymentMethod.bankTransfer,
                          title: const Text('Chuyển khoản ngân hàng'),
                          subtitle: const Text(
                            'Thanh toán trước, hệ thống tự động cập nhật giao dịch.',
                          ),
                        ),
                        RadioListTile<OrderPaymentMethod>(
                          value: OrderPaymentMethod.debt,
                          title: const Text(
                            'Ghi nhận công nợ (thanh toán sau)',
                          ),
                          subtitle: const Text(
                            'Đơn được cộng vào tổng công nợ hiện tại.',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 120),
                child: _SectionCard(
                  title: 'Tóm tắt đơn hàng',
                  child: Column(
                    children: [
                      _SummaryRow(
                        label: 'Số lượng sản phẩm',
                        value: '${cart.totalItems}',
                      ),
                      const SizedBox(height: 8),
                      _SummaryRow(
                        label: 'Tạm tính',
                        value: formatVnd(subtotal),
                      ),
                      if (discountAmount > 0) ...[
                        const SizedBox(height: 8),
                        _SummaryRow(
                          label: 'Chiết khấu ($discountPercent%)',
                          value: '-${formatVnd(discountAmount)}',
                        ),
                        const SizedBox(height: 8),
                        _SummaryRow(
                          label: 'Sau chiết khấu',
                          value: formatVnd(totalAfterDiscount),
                        ),
                      ],
                      const SizedBox(height: 8),
                      _SummaryRow(
                        label: 'VAT (${CartController.vatPercent}%)',
                        value: formatVnd(vatAmount),
                      ),
                      const SizedBox(height: 8),
                      _SummaryRow(
                        label: 'Phí giao hàng',
                        value: shippingFee == 0
                            ? 'Miễn phí'
                            : formatVnd(shippingFee),
                      ),
                      const SizedBox(height: 8),
                      _SummaryRow(
                        label: 'Trạng thái thanh toán',
                        value: _previewPaymentStatus.label,
                      ),
                      if (_method == OrderPaymentMethod.bankTransfer) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Lưu ý: bấm "Tiếp tục" để mở thông tin chuyển khoản. Đơn chỉ được tạo khi hệ thống nhận thanh toán thành công.',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colors.error,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ],
                      const Divider(height: 20),
                      _SummaryRow(
                        label: 'Tổng cộng',
                        value: formatVnd(total),
                        isEmphasis: true,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              FadeSlideIn(
                delay: const Duration(milliseconds: 180),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: cart.isEmpty
                        ? null
                        : () async {
                            final issues = _validateCart(cart);
                            if (issues.isNotEmpty) {
                              _showValidationDialog(context, issues);
                              return;
                            }

                            final isBankTransfer =
                                _method == OrderPaymentMethod.bankTransfer;
                            var bankTransferPaid = false;
                            if (isBankTransfer) {
                              final paid = await _showBankTransferInfo(
                                context,
                                amount: total,
                                owner: distributorBankOwner,
                                account: distributorBankAccount,
                                bankName: distributorBankName,
                                content: distributorTransferTemplate,
                              );
                              if (paid != true) {
                                return;
                              }
                              bankTransferPaid = true;
                            }

                            _placeOrder(
                              cart: cart,
                              orderController: orderController,
                              bankTransferPaid: bankTransferPaid,
                            );
                          },
                    child: const Text('Tiếp tục'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<String> _validateCart(CartController cart) {
    final List<String> issues = [];
    for (final item in cart.items) {
      if (!item.product.isOrderable) {
        issues.add('${item.product.name} tạm ngừng bán.');
      }
      if (item.quantity > item.product.stock) {
        issues.add(
          '${item.product.name} chỉ còn ${item.product.stock} SP trong kho.',
        );
      }
      if (item.quantity < item.product.effectiveMinOrderQty) {
        issues.add(
          '${item.product.name} yêu cầu tối thiểu ${item.product.effectiveMinOrderQty} SP.',
        );
      }
    }
    return issues;
  }

  Future<bool?> _showBankTransferInfo(
    BuildContext context, {
    required int amount,
    required String owner,
    required String account,
    required String bankName,
    required String content,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      builder: (sheetContext) {
        return _BankTransferInfoSheet(
          amount: amount,
          owner: owner,
          account: account,
          bankName: bankName,
          content: content,
          onCopy: _copyToClipboard,
        );
      },
    );
  }

  void _placeOrder({
    required CartController cart,
    required OrderController orderController,
    required bool bankTransferPaid,
  }) {
    final isPaidByBankTransfer =
        _method == OrderPaymentMethod.bankTransfer && bankTransferPaid;
    final order = Order(
      id: _generateOrderId(orderController),
      createdAt: DateTime.now(),
      status: OrderStatus.pendingApproval,
      paymentMethod: _method,
      paymentStatus: isPaidByBankTransfer
          ? OrderPaymentStatus.paid
          : _previewPaymentStatus,
      receiverName: _profile.businessName,
      receiverAddress: _profile.shippingAddress,
      receiverPhone: _profile.phone,
      shippingFee: 0,
      items: cart.items
          .map(
            (item) =>
                OrderLineItem(product: item.product, quantity: item.quantity),
          )
          .toList(growable: false),
      paidAmount: isPaidByBankTransfer ? cart.total : 0,
    );
    final itemCount = order.totalItems;
    final totalPrice = order.total;
    orderController.addOrder(order);
    cart.clear();

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => OrderSuccessScreen(
          orderId: order.id,
          itemCount: itemCount,
          totalPrice: totalPrice,
        ),
      ),
    );
  }

  Future<void> _showValidationDialog(
    BuildContext context,
    List<String> issues,
  ) async {
    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Cần điều chỉnh đơn hàng'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Vui lòng kiểm tra:'),
              const SizedBox(height: 10),
              ...issues.map(
                (issue) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('- '),
                      Expanded(child: Text(issue)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Đóng'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _copyToClipboard(String label, String value) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('Đã sao chép $label')));
  }

  String _generateOrderId(OrderController orderController) {
    final now = DateTime.now().millisecondsSinceEpoch.toString();
    final suffix = now.substring(now.length - 6);
    var orderId = 'SCS-$suffix';
    var index = 1;

    while (orderController.containsId(orderId)) {
      orderId = 'SCS-$suffix-$index';
      index += 1;
    }

    return orderId;
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: colors.outlineVariant.withValues(alpha: 0.6)),
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

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
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
    ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700);

    final valueStyle = isEmphasis ? emphasisStyle : style;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Text(label, style: isEmphasis ? emphasisStyle : style),
            ),
            const SizedBox(width: 12),
            Flexible(
              child: Text(
                value,
                textAlign: TextAlign.right,
                style: valueStyle,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _BankTransferInfoSheet extends StatefulWidget {
  const _BankTransferInfoSheet({
    required this.amount,
    required this.owner,
    required this.account,
    required this.bankName,
    required this.content,
    required this.onCopy,
  });

  final int amount;
  final String owner;
  final String account;
  final String bankName;
  final String content;
  final Future<void> Function(String label, String value) onCopy;

  @override
  State<_BankTransferInfoSheet> createState() => _BankTransferInfoSheetState();
}

class _BankTransferInfoSheetState extends State<_BankTransferInfoSheet> {
  @override
  Widget build(BuildContext context) {
    final isTablet = MediaQuery.sizeOf(context).shortestSide >= 600;
    final maxWidth = isTablet ? 760.0 : double.infinity;
    final colors = Theme.of(context).colorScheme;
    return SafeArea(
      child: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 12,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Thông tin chuyển khoản',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Vui lòng xem thông tin chuyển khoản. Bạn có thể thanh toán bằng STK/nội dung hoặc quét QR bên ngoài ứng dụng.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: colors.primary.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      'Hệ thống sẽ theo dõi giao dịch từ chuyển khoản/QR bên ngoài. Khi nhận thành công, app sẽ tự động cập nhật và chuyển sang trang đơn hàng.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  _BankTransferInfoRow(
                    label: 'Số tiền',
                    value: formatVnd(widget.amount),
                    onCopy: () {
                      widget.onCopy('Số tiền', widget.amount.toString());
                    },
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Chủ tài khoản',
                    value: widget.owner,
                    onCopy: () {
                      widget.onCopy('Chủ tài khoản', widget.owner);
                    },
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Số tài khoản',
                    value: widget.account,
                    onCopy: () {
                      widget.onCopy('Số tài khoản', widget.account);
                    },
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Ngân hàng',
                    value: widget.bankName,
                    onCopy: () {
                      widget.onCopy('Ngân hàng', widget.bankName);
                    },
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Nội dung',
                    value: widget.content,
                    onCopy: () {
                      widget.onCopy('Nội dung chuyển khoản', widget.content);
                    },
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(context).pop(false),
                          child: const Text('Hủy'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: () => Navigator.of(context).pop(true),
                          child: const Text('Đã chuyển khoản'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BankTransferInfoRow extends StatelessWidget {
  const _BankTransferInfoRow({
    required this.label,
    required this.value,
    required this.onCopy,
  });

  final String label;
  final String value;
  final VoidCallback onCopy;

  @override
  Widget build(BuildContext context) {
    final borderColor = Theme.of(context).colorScheme.outlineVariant;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 2),
                Text(value, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.all(10),
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            onPressed: onCopy,
            icon: const Icon(Icons.copy, size: 18),
            tooltip: 'Sao chép',
          ),
        ],
      ),
    );
  }
}
