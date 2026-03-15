import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'account_settings_screen.dart';
import 'bank_transfer_support.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'dealer_profile_storage.dart';
import 'global_search.dart';
import 'models.dart';
import 'order_controller.dart';
import 'order_success_screen.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/product_image.dart';
import 'widgets/section_card.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  OrderPaymentMethod _method = OrderPaymentMethod.bankTransfer;
  DealerProfile _profile = DealerProfile.defaults;
  final TextEditingController _orderNoteController = TextEditingController();
  late final BankTransferService _bankTransferService;
  BankTransferInstructions? _bankTransferInstructions;
  bool _isSubmitting = false;
  bool _isLoadingBankTransferInstructions = false;

  bool get _canUseDebtPayment => _profile.creditLimit > 0;

  @override
  void initState() {
    super.initState();
    _bankTransferService = BankTransferService();
    loadDealerProfile()
        .then((profile) {
          if (!mounted) {
            return;
          }
          final canUseDebtPayment = profile.creditLimit > 0;
          setState(() {
            _profile = profile;
            if (_method == OrderPaymentMethod.debt && !canUseDebtPayment) {
              _method = OrderPaymentMethod.bankTransfer;
            }
          });
        })
        .catchError((_) {
          // Keep default profile when remote profile is temporarily unavailable.
        });
    _loadBankTransferInstructions();
  }

  @override
  void dispose() {
    _bankTransferService.close();
    _orderNoteController.dispose();
    super.dispose();
  }

  OrderPaymentStatus get _previewPaymentStatus {
    switch (_method) {
      case OrderPaymentMethod.bankTransfer:
        return OrderPaymentStatus.unpaid;
      case OrderPaymentMethod.debt:
        return OrderPaymentStatus.debtRecorded;
    }
  }

  String get _primaryActionLabel {
    if (_method == OrderPaymentMethod.bankTransfer) {
      return 'Tạo đơn và xem thông tin chuyển khoản';
    }
    return 'Xác nhận đặt hàng';
  }

  Future<void> _openAccountSettings() async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const AccountSettingsScreen()));
    final latestProfile = await loadDealerProfile();
    if (!mounted) {
      return;
    }
    final canUseDebtPayment = latestProfile.creditLimit > 0;
    setState(() {
      _profile = latestProfile;
      if (_method == OrderPaymentMethod.debt && !canUseDebtPayment) {
        _method = OrderPaymentMethod.bankTransfer;
      }
    });
  }

  Future<void> _loadBankTransferInstructions({bool showError = false}) async {
    if (_isLoadingBankTransferInstructions) {
      return;
    }
    if (mounted) {
      setState(() => _isLoadingBankTransferInstructions = true);
    }
    try {
      final instructions = await _bankTransferService.fetchInstructions();
      if (!mounted) {
        return;
      }
      setState(() => _bankTransferInstructions = instructions);
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _bankTransferInstructions = null);
      if (showError) {
        _showSnackBar('Không thể tải thông tin chuyển khoản: $error');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingBankTransferInstructions = false);
      }
    }
  }

  Future<BankTransferInstructions?> _ensureBankTransferInstructions() async {
    if (_bankTransferInstructions != null) {
      return _bankTransferInstructions;
    }
    await _loadBankTransferInstructions(showError: true);
    return _bankTransferInstructions;
  }

  Future<void> _copyToClipboard(String label, String value) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!mounted) {
      return;
    }
    _showSnackBar('Da sao chep $label');
  }

  void _showSnackBar(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final cart = CartScope.of(context);
    final orderController = OrderScope.of(context);
    final isTablet = AppBreakpoints.isTablet(context);
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;
    final subtotal = cart.subtotal;
    final discountPercent = cart.discountPercent;
    final discountAmount = cart.discountAmount;
    final totalAfterDiscount = cart.totalAfterDiscount;
    final vatAmount = cart.vatAmount;
    const shippingFee = 0;
    final total = cart.total;

    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Thanh toán'),
        actions: const [GlobalSearchIconButton()],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              FadeSlideIn(
                child: SectionCard(
                  title: 'Thông tin nhận hàng',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: _openAccountSettings,
                          icon: const Icon(Icons.edit_outlined, size: 18),
                          label: const Text('Sửa thông tin nhận hàng'),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _profile.businessName,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Người liên hệ: ${_profile.contactName}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: colors.onSurfaceVariant,
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
                        'SDT: ${_profile.phone}',
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
                child: SectionCard(
                  title: 'Phuong thuc thanh toan',
                  child: RadioGroup<OrderPaymentMethod>(
                    groupValue: _method,
                    onChanged: (value) {
                      if (value == null) {
                        return;
                      }
                      setState(() => _method = value);
                      if (value == OrderPaymentMethod.bankTransfer &&
                          _bankTransferInstructions == null &&
                          !_isLoadingBankTransferInstructions) {
                        _loadBankTransferInstructions();
                      }
                    },
                    child: Column(
                      children: [
                        RadioListTile<OrderPaymentMethod>(
                          value: OrderPaymentMethod.bankTransfer,
                          title: const Text('Chuyển khoản ngan hang'),
                          subtitle: const Text(
                            'Tao don truoc, SePay webhook se tu dong xac nhan thanh toan.',
                          ),
                        ),
                        RadioListTile<OrderPaymentMethod>(
                          value: OrderPaymentMethod.debt,
                          enabled: _canUseDebtPayment,
                          title: const Text('Ghi nhan cong no'),
                          subtitle: Text(
                            _canUseDebtPayment
                                ? 'Han muc con lai: ${formatVnd((_profile.creditLimit - orderController.totalOutstandingDebt).clamp(0, _profile.creditLimit))} / ${formatVnd(_profile.creditLimit)}.'
                                : 'Can duoc cap han muc cong no truoc khi dung tuy chon nay.',
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
                child: SectionCard(
                  title: 'San pham trong don (${cart.totalItems})',
                  child: Theme(
                    data: Theme.of(
                      context,
                    ).copyWith(dividerColor: Colors.transparent),
                    child: ExpansionTile(
                      tilePadding: EdgeInsets.zero,
                      childrenPadding: const EdgeInsets.only(top: 8),
                      initiallyExpanded: cart.items.length <= 3,
                      title: Text(
                        '${cart.items.length} dòng sản phẩm',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      subtitle: Text(
                        'Nhấn để xem chi tiết từng sản phẩm',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                      children: [
                        for (var i = 0; i < cart.items.length; i++) ...[
                          _CheckoutItemRow(item: cart.items[i]),
                          if (i != cart.items.length - 1)
                            const Divider(height: 18),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 160),
                child: SectionCard(
                  title: 'Ghi chú đơn hàng',
                  child: TextField(
                    controller: _orderNoteController,
                    maxLines: 3,
                    minLines: 2,
                    maxLength: 200,
                    decoration: const InputDecoration(
                      hintText:
                          'Vi du: giao gio hanh chinh, goi truoc khi giao, luu y xuat hoa don...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 200),
                child: SectionCard(
                  title: 'Tóm tắt đơn hàng',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SummaryRow(
                        label: 'Số lượng sản phẩm',
                        value: '${cart.totalItems}',
                      ),
                      const SizedBox(height: 8),
                      _SummaryRow(
                        label: 'Tam tinh',
                        value: formatVnd(subtotal),
                      ),
                      if (discountAmount > 0) ...[
                        const SizedBox(height: 8),
                        _SummaryRow(
                          label: 'Chiet khau ($discountPercent%)',
                          value: '-${formatVnd(discountAmount)}',
                        ),
                        const SizedBox(height: 8),
                        _SummaryRow(
                          label: 'Sau chiet khau',
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
                        label: 'Phi giao hang',
                        value: shippingFee == 0
                            ? 'Mien phi'
                            : formatVnd(shippingFee),
                      ),
                      const SizedBox(height: 8),
                      _SummaryRow(
                        label: 'Trang thai thanh toan',
                        value: _previewPaymentStatus.label,
                      ),
                      if (_method == OrderPaymentMethod.bankTransfer) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Đơn sẽ được tạo trước. Sau đó hãy chuyển khoản đúng số tiền và đúng mã đơn để SePay webhook đối soát tự động.',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        if (_isLoadingBankTransferInstructions) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Đang tải thông tin chuyển khoản từ hệ thống...',
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                ),
                              ),
                            ],
                          ),
                        ] else if (_bankTransferInstructions == null) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'Chưa tải được thông tin chuyển khoản. Hãy thử lại trước khi đặt đơn.',
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(color: colors.error),
                                ),
                              ),
                              TextButton(
                                onPressed: _isSubmitting
                                    ? null
                                    : () => _loadBankTransferInstructions(
                                        showError: true,
                                      ),
                                child: const Text('Tải lại'),
                              ),
                            ],
                          ),
                        ],
                      ],
                      const Divider(height: 20),
                      _SummaryRow(
                        label: 'Tong cong',
                        value: formatVnd(total),
                        isEmphasis: true,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Lưu ý: Giá thực tế trong đơn được tính theo giá hiện hành tại thời điểm đặt hàng, có thể khác nếu giá sản phẩm thay đổi từ lần tải gần nhất.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                          fontStyle: FontStyle.italic,
                        ),
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
                    onPressed: cart.isEmpty || _isSubmitting
                        ? null
                        : () async {
                            setState(() => _isSubmitting = true);
                            try {
                              final issues = _validateCart(cart);
                              if (issues.isNotEmpty) {
                                await _showValidationDialog(context, issues);
                                return;
                              }

                              BankTransferInstructions?
                              bankTransferInstructions;
                              if (_method == OrderPaymentMethod.bankTransfer) {
                                bankTransferInstructions =
                                    await _ensureBankTransferInstructions();
                                if (bankTransferInstructions == null) {
                                  return;
                                }
                              } else {
                                if (!_canUseDebtPayment) {
                                  _showSnackBar(
                                    'Tai khoan chua duoc cap han muc cong no.',
                                  );
                                  return;
                                }
                                final projectedOutstandingDebt =
                                    orderController.totalOutstandingDebt +
                                    total;
                                if (projectedOutstandingDebt >
                                    _profile.creditLimit) {
                                  _showSnackBar(
                                    'Vuot han muc cong no. Cong no du kien ${formatVnd(projectedOutstandingDebt)} lon hon han muc ${formatVnd(_profile.creditLimit)}.',
                                  );
                                  return;
                                }
                                final confirmed = await _showDebtConfirmDialog(
                                  context,
                                  amount: total,
                                  itemCount: cart.totalItems,
                                );
                                if (confirmed != true) {
                                  return;
                                }
                              }

                              await _placeOrder(
                                cart: cart,
                                orderController: orderController,
                                bankTransferInstructions:
                                    bankTransferInstructions,
                              );
                            } catch (_) {
                              _showSnackBar(
                                'Không thể tạo đơn hàng. Vui lòng thử lại.',
                              );
                            } finally {
                              if (mounted) {
                                setState(() => _isSubmitting = false);
                              }
                            }
                          },
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2.5),
                          )
                        : Text(_primaryActionLabel),
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
      if (item.quantity > item.product.stock) {
        issues.add(
          '${item.product.name} chi con ${item.product.stock} SP trong kho.',
        );
      }
    }
    return issues;
  }

  Future<bool?> _showDebtConfirmDialog(
    BuildContext context, {
    required int amount,
    required int itemCount,
  }) {
    return showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Xác nhận ghi nhận công nợ'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Đơn hàng sẽ được tạo ngay và ghi nhận vào tổng công nợ hiện tại.',
              ),
              const SizedBox(height: 12),
              Text('Số lượng sản phẩm: $itemCount'),
              const SizedBox(height: 4),
              Text('Tong thanh toan: ${formatVnd(amount)}'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Huy'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Xác nhận đặt hàng'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _placeOrder({
    required CartController cart,
    required OrderController orderController,
    BankTransferInstructions? bankTransferInstructions,
  }) async {
    final isBankTransfer = _method == OrderPaymentMethod.bankTransfer;
    final order = Order(
      id: _generateOrderId(orderController),
      createdAt: DateTime.now(),
      status: OrderStatus.pendingApproval,
      paymentMethod: _method,
      paymentStatus: _previewPaymentStatus,
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
      paidAmount: 0,
      note: _orderNoteController.text.trim().isEmpty
          ? null
          : _orderNoteController.text.trim(),
    );
    final createdOrder = await orderController.addOrder(order);
    if (!mounted) {
      return;
    }

    if (isBankTransfer && bankTransferInstructions != null) {
      await showBankTransferInfoSheet(
        context: context,
        instructions: bankTransferInstructions,
        amount: createdOrder.total,
        content: createdOrder.id,
        onCopy: _copyToClipboard,
      );
      if (!mounted) {
        return;
      }
    }

    await cart.clear(rollbackOnFailure: false);
    if (!mounted) {
      return;
    }

    HapticFeedback.mediumImpact();
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => OrderSuccessScreen(
          orderId: createdOrder.id,
          itemCount: createdOrder.totalItems,
          totalPrice: createdOrder.total,
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
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
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
              child: const Text('Dong'),
            ),
          ],
        );
      },
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

class _CheckoutItemRow extends StatelessWidget {
  const _CheckoutItemRow({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ProductImage(
          product: item.product,
          width: 42,
          height: 42,
          borderRadius: BorderRadius.circular(10),
          iconSize: 18,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.product.name,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 2),
              Text(
                'SKU: ${item.product.sku}',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'x${item.quantity}',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 2),
            Text(
              formatVnd(item.quantity * item.product.price),
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ],
    );
  }
}
