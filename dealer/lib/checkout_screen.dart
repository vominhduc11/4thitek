import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'cart_controller.dart';
import 'mock_data.dart';
import 'models.dart';
import 'order_controller.dart';
import 'order_success_screen.dart';
import 'utils.dart';
import 'widgets/fade_slide_in.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  OrderPaymentMethod _method = OrderPaymentMethod.cod;

  OrderPaymentStatus get _previewPaymentStatus {
    switch (_method) {
      case OrderPaymentMethod.bankTransfer:
        return OrderPaymentStatus.unpaid;
      case OrderPaymentMethod.debt:
        return OrderPaymentStatus.debtRecorded;
      default:
        return OrderPaymentStatus.unpaid;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = CartScope.of(context);
    final orderController = OrderScope.of(context);
    final subtotal = cart.subtotal;
    final discountPercent = cart.discountPercent;
    final discountAmount = cart.discountAmount;
    final totalAfterDiscount = cart.totalAfterDiscount;
    final vatAmount = cart.vatAmount;
    const shippingFee = 0;
    final total = cart.total;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toan'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          FadeSlideIn(
            child: _SectionCard(
              title: 'Thong tin nhan hang',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Dai ly SCS Ha Noi',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'So 12, Duong Tran Duy Hung, Cau Giay, Ha Noi',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'SDT: 0909 123 456',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          FadeSlideIn(
            delay: const Duration(milliseconds: 60),
            child: _SectionCard(
              title: 'Phuong thuc thanh toan',
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
                      title: const Text('Chuyen khoan ngan hang'),
                      subtitle: const Text(
                        'Thanh toan truoc, doi soat theo ma don hang.',
                      ),
                    ),
                    RadioListTile<OrderPaymentMethod>(
                      value: OrderPaymentMethod.debt,
                      title: const Text('Ghi nhan cong no (thanh toan sau)'),
                      subtitle: const Text(
                        'Don duoc cong vao tong cong no hien tai.',
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (_method == OrderPaymentMethod.bankTransfer) ...[
            const SizedBox(height: 14),
            FadeSlideIn(
              delay: const Duration(milliseconds: 90),
              child: _SectionCard(
                title: 'Thong tin chuyen khoan',
                child: Column(
                  children: [
                    _SummaryRow(
                      label: 'Chu tai khoan',
                      value: distributorBankOwner,
                      onCopy: () => _copyToClipboard(
                        'Chu tai khoan',
                        distributorBankOwner,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _SummaryRow(
                      label: 'So tai khoan',
                      value: distributorBankAccount,
                      onCopy: () => _copyToClipboard(
                        'So tai khoan',
                        distributorBankAccount,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _SummaryRow(
                      label: 'Ngan hang',
                      value: distributorBankName,
                    ),
                    const SizedBox(height: 8),
                    _SummaryRow(
                      label: 'Noi dung goi y',
                      value: distributorTransferTemplate,
                      onCopy: () => _copyToClipboard(
                        'Noi dung chuyen khoan',
                        distributorTransferTemplate,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 14),
          FadeSlideIn(
            delay: const Duration(milliseconds: 120),
            child: _SectionCard(
              title: 'Tom tat don hang',
              child: Column(
                children: [
                  _SummaryRow(
                    label: 'So luong san pham',
                    value: '${cart.totalItems}',
                  ),
                  const SizedBox(height: 8),
                  _SummaryRow(label: 'Tam tinh', value: formatVnd(subtotal)),
                  if (discountAmount > 0) ...[
                    const SizedBox(height: 8),
                    _SummaryRow(
                      label: 'Giam gia ($discountPercent%)',
                      value: '-${formatVnd(discountAmount)}',
                    ),
                    const SizedBox(height: 8),
                    _SummaryRow(
                      label: 'Sau giam gia',
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
                    label: 'Trang thai thanh toan',
                    value: _previewPaymentStatus.label,
                  ),
                  const Divider(height: 20),
                  _SummaryRow(
                    label: 'Tong cong',
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
                        if (isBankTransfer) {
                          final confirmed = await _showBankTransferSheet(
                            context,
                            amount: total,
                            content: distributorTransferTemplate,
                            owner: distributorBankOwner,
                            account: distributorBankAccount,
                            bankName: distributorBankName,
                          );
                          if (confirmed != true) {
                            return;
                          }
                        }

                        _placeOrder(
                          cart: cart,
                          orderController: orderController,
                          markPaid: isBankTransfer,
                        );
                      },
                child: Text(
                  _method == OrderPaymentMethod.bankTransfer
                      ? 'Quet QR & thanh toan'
                      : 'Xac nhan dat hang',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<String> _validateCart(CartController cart) {
    final List<String> issues = [];
    for (final item in cart.items) {
      if (!item.product.isOrderable) {
        issues.add('${item.product.name} tam ngung ban.');
      }
      if (item.quantity > item.product.stock) {
        issues.add(
          '${item.product.name} chi con ${item.product.stock} sp trong kho.',
        );
      }
      if (item.quantity < item.product.effectiveMinOrderQty) {
        issues.add(
          '${item.product.name} yeu cau toi thieu ${item.product.effectiveMinOrderQty} sp.',
        );
      }
    }
    return issues;
  }

Future<bool?> _showBankTransferSheet(
    BuildContext context, {
    required int amount,
    required String content,
    required String owner,
    required String account,
    required String bankName,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (sheetContext) {
        return _BankTransferSheet(
          amount: amount,
          content: content,
          owner: owner,
          account: account,
          bankName: bankName,
          onCopied: (label, value) => _copyToClipboard(label, value),
        );
      },
    );
  }

  void _placeOrder({
    required CartController cart,
    required OrderController orderController,
    required bool markPaid,
  }) {
    final order = Order(
      id: _generateOrderId(orderController),
      createdAt: DateTime.now(),
      status: OrderStatus.pendingApproval,
      paymentMethod: _method,
      paymentStatus:
          markPaid ? OrderPaymentStatus.paid : _previewPaymentStatus,
      receiverName: 'Dai ly SCS Ha Noi',
      receiverAddress: 'So 12, Duong Tran Duy Hung, Cau Giay, Ha Noi',
      receiverPhone: '0909 123 456',
      shippingFee: 0,
      items: cart.items
          .map(
            (item) => OrderLineItem(
              product: item.product,
              quantity: item.quantity,
            ),
          )
          .toList(growable: false),
      paidAmount: 0,
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
          title: const Text('Can dieu chinh don hang'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Vui long kiem tra:'),
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
              child: const Text('Dong'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _copyToClipboard(String label, String value) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text('$label da duoc sao chep'),
        ),
      );
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

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.isEmphasis = false,
    this.hint,
    this.onCopy,
  });

  final String label;
  final String value;
  final bool isEmphasis;
  final String? hint;
  final VoidCallback? onCopy;

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
            Expanded(child: Text(label, style: isEmphasis ? emphasisStyle : style)),
            const SizedBox(width: 12),
            Flexible(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Flexible(
                    child: Text(
                      value,
                      textAlign: TextAlign.right,
                      style: valueStyle,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (onCopy != null) ...[
                    const SizedBox(width: 6),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      icon: const Icon(Icons.copy, size: 18),
                      onPressed: onCopy,
                      tooltip: 'Sao chep',
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        if (hint != null) ...[
          const SizedBox(height: 4),
          Text(
            hint!,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.black54,
                ),
          ),
        ],
      ],
    );
  }
}

class _BankTransferSheet extends StatefulWidget {
  const _BankTransferSheet({
    required this.amount,
    required this.content,
    required this.owner,
    required this.account,
    required this.bankName,
    required this.onCopied,
  });

  final int amount;
  final String content;
  final String owner;
  final String account;
  final String bankName;
  final void Function(String label, String value) onCopied;

  @override
  State<_BankTransferSheet> createState() => _BankTransferSheetState();
}

class _BankTransferSheetState extends State<_BankTransferSheet> {
  static const Duration _simulateSuccessAfter = Duration(seconds: 6);
  Timer? _timer;
  bool _isDone = false;

  @override
  void initState() {
    super.initState();
    _timer = Timer(_simulateSuccessAfter, _autoComplete);
  }

  void _autoComplete() {
    if (_isDone) return;
    _isDone = true;
    if (mounted) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final amountText = formatVnd(widget.amount);
    final qrUrl =
        'https://img.vietqr.io/image/970422-1234567890-compact.png?amount=${widget.amount}&addInfo=${Uri.encodeComponent(widget.content)}';

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        top: 12,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Column(
              children: [
                const Text(
                  'Quet QR de thanh toan',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
                ),
                const SizedBox(height: 8),
                Text(
                  'Don se tu xac nhan sau khi chuyen khoan thanh cong',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE5EAF5)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          qrUrl,
                          width: 240,
                          height: 240,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) =>
                              const Icon(Icons.qr_code_2, size: 120),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text('So tien: $amountText',
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('Noi dung: ${widget.content}',
                          textAlign: TextAlign.center,
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Colors.black54)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF7F9FC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE5EAF5)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _BankInfoRow(
                              label: 'Chu TK',
                              value: widget.owner,
                              onCopy: () => widget.onCopied('Chu TK', widget.owner),
                            ),
                            const SizedBox(height: 6),
                            _BankInfoRow(
                              label: 'So TK',
                              value: widget.account,
                              onCopy: () =>
                                  widget.onCopied('So TK', widget.account),
                            ),
                            const SizedBox(height: 6),
                            _BankInfoRow(
                              label: 'Ngan hang',
                              value: widget.bankName,
                              onCopy: () =>
                                  widget.onCopied('Ngan hang', widget.bankName),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => widget.onCopied(
                    'So tien',
                    widget.amount.toString(),
                  ),
                  icon: const Icon(Icons.copy, size: 18),
                  label: const Text('Sao chep so tien'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => widget.onCopied(
                    'Noi dung',
                    widget.content,
                  ),
                  icon: const Icon(Icons.copy, size: 18),
                  label: const Text('Sao chep ND'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                if (_isDone) return;
                _isDone = true;
                Navigator.of(context).pop(true);
              },
              child: const Text('Da quet / Da chuyen'),
            ),
          ),
        ],
      ),
    );
  }
}

class _BankInfoRow extends StatelessWidget {
  const _BankInfoRow({
    required this.label,
    required this.value,
    this.onCopy,
  });

  final String label;
  final String value;
  final VoidCallback? onCopy;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodyMedium;
    return Row(
      children: [
        Text('$label: ', style: style?.copyWith(fontWeight: FontWeight.w600)),
        Expanded(
          child: Text(
            value,
            style: style,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (onCopy != null)
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
            icon: const Icon(Icons.copy, size: 16),
            onPressed: onCopy,
          ),
      ],
    );
  }
}
