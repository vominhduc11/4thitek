import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import 'breakpoints.dart';
import 'cart_controller.dart';
import 'cart_screen.dart';
import 'global_search.dart';
import 'models.dart';
import 'order_controller.dart';
import 'utils.dart';
import 'warranty_activation_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  void _confirmCancel(BuildContext context, Order order) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        final colors = Theme.of(context).colorScheme;
        return AlertDialog(
          title: const Text('Xác nhận hủy đơn'),
          content: Text('Bạn có chắc muốn hủy đơn hàng ${order.id}?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Không'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: colors.errorContainer,
                foregroundColor: colors.onErrorContainer,
              ),
              onPressed: () {
                Navigator.of(dialogContext).pop();
                OrderScope.of(
                  context,
                ).updateOrderStatus(order.id, OrderStatus.cancelled);
              },
              child: const Text('Hủy đơn'),
            ),
          ],
        );
      },
    );
  }

  void _confirmReceived(BuildContext context, Order order) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Xác nhận đã nhận hàng'),
          content: Text('Đánh dấu đơn ${order.id} là hoàn thành?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Không'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                OrderScope.of(
                  context,
                ).updateOrderStatus(order.id, OrderStatus.completed);
              },
              child: const Text('Xác nhận'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _callReceiver(BuildContext context, String rawPhone) async {
    final normalized = rawPhone.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri(scheme: 'tel', path: normalized);
    final launched = await launchUrl(uri);
    if (launched || !context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Không thể mở trình gọi điện trên thiết bị này.'),
      ),
    );
  }

  Future<void> _openAddressOnMap(BuildContext context, String address) async {
    final uri = Uri.https('www.google.com', '/maps/search/', {
      'api': '1',
      'query': address,
    });
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (launched || !context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Không thể mở ứng dụng bản đồ.')),
    );
  }

  void _reorder(BuildContext context, CartController cart, Order order) {
    var addedCount = 0;
    final skipped = <String>[];

    for (final item in order.items) {
      final remaining = cart.remainingStockFor(item.product);
      if (remaining <= 0) {
        skipped.add(item.product.name);
        continue;
      }
      final qtyToAdd = item.quantity > remaining ? remaining : item.quantity;
      if (qtyToAdd <= 0) {
        skipped.add(item.product.name);
        continue;
      }
      final didAdd = cart.add(item.product, quantity: qtyToAdd);
      if (didAdd) {
        addedCount++;
      } else {
        skipped.add(item.product.name);
      }
    }

    final String message;
    if (addedCount == 0) {
      message = 'Không có sản phẩm nào được thêm vào giỏ (hết hàng).';
    } else if (skipped.isEmpty) {
      message = 'Đã thêm tất cả sản phẩm vào giỏ hàng.';
    } else {
      message =
          'Đã thêm $addedCount sản phẩm. Bỏ qua: ${skipped.join(', ')} (hết hàng hoặc vượt tồn kho).';
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        action: addedCount > 0
            ? SnackBarAction(
                label: 'Mở giỏ hàng',
                onPressed: () {
                  Navigator.of(
                    context,
                  ).push(MaterialPageRoute(builder: (_) => const CartScreen()));
                },
              )
            : null,
      ),
    );
  }

  void _showRecordPaymentDialog(BuildContext context, Order order) {
    final amountController = TextEditingController();
    const channels = <String>['Chuyển khoản', 'Tiền mặt', 'Bù trừ công nợ'];
    var selectedChannel = order.paymentMethod == OrderPaymentMethod.bankTransfer
        ? channels.first
        : channels.last;
    String? errorText;

    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (_, setDialogState) {
            return AlertDialog(
              title: const Text('Ghi nhận thanh toán'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Đơn ${order.id} còn nợ ${formatVnd(order.outstandingAmount)}',
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: amountController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: InputDecoration(
                      labelText: 'Số tiền',
                      hintText: 'Tối đa ${formatVnd(order.outstandingAmount)}',
                      errorText: errorText,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: selectedChannel,
                    decoration: const InputDecoration(
                      labelText: 'Kênh thanh toán',
                    ),
                    items: channels
                        .map(
                          (channel) => DropdownMenuItem(
                            value: channel,
                            child: Text(channel),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      if (value == null) {
                        return;
                      }
                      setDialogState(() => selectedChannel = value);
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Đóng'),
                ),
                FilledButton(
                  onPressed: () {
                    final digitsOnly = amountController.text.replaceAll(
                      RegExp(r'[^0-9]'),
                      '',
                    );
                    final amount = int.tryParse(digitsOnly) ?? 0;
                    if (amount <= 0) {
                      setDialogState(() {
                        errorText = 'Số tiền không hợp lệ.';
                      });
                      return;
                    }
                    if (amount > order.outstandingAmount) {
                      setDialogState(() {
                        errorText = 'Số tiền vượt quá công nợ còn lại.';
                      });
                      return;
                    }

                    final success = OrderScope.of(context).recordPayment(
                      orderId: order.id,
                      amount: amount,
                      channel: selectedChannel,
                      note: 'Ghi nhận từ màn hình chi tiết đơn hàng.',
                    );
                    if (!success) {
                      setDialogState(() {
                        errorText =
                            'Không thể ghi nhận thanh toán. Vui lòng kiểm tra lại.';
                      });
                      return;
                    }

                    Navigator.of(dialogContext).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Đã ghi nhận ${formatVnd(amount)} cho đơn ${order.id}.',
                        ),
                      ),
                    );
                  },
                  child: const Text('Ghi nhận'),
                ),
              ],
            );
          },
        );
      },
    ).whenComplete(amountController.dispose);
  }

  Widget _buildStickyActionBar({
    required BuildContext context,
    required Order order,
    required CartController cart,
    required bool canProcessSerial,
    required bool canMarkReceived,
    required bool canCancel,
  }) {
    final colors = Theme.of(context).colorScheme;
    final canReorder = order.status != OrderStatus.cancelled;
    final markReceivedIsPrimary = canMarkReceived;
    final recordPaymentIsPrimary =
        !markReceivedIsPrimary && order.outstandingAmount > 0;
    final processSerialIsPrimary =
        !markReceivedIsPrimary && !recordPaymentIsPrimary && canProcessSerial;

    final actions = <Widget>[
      if (canReorder)
        OutlinedButton(
          onPressed: () => _reorder(context, cart, order),
          child: const Text('Đặt lại đơn cũ'),
        ),
      if (order.outstandingAmount > 0)
        recordPaymentIsPrimary
            ? ElevatedButton.icon(
                onPressed: () => _showRecordPaymentDialog(context, order),
                icon: const Icon(Icons.payments_outlined, size: 18),
                label: const Text('Ghi nhận thanh toán'),
              )
            : OutlinedButton.icon(
                onPressed: () => _showRecordPaymentDialog(context, order),
                icon: const Icon(Icons.payments_outlined, size: 18),
                label: const Text('Ghi nhận thanh toán'),
              ),
      if (canProcessSerial)
        processSerialIsPrimary
            ? ElevatedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) =>
                          WarrantyActivationScreen(orderId: order.id),
                    ),
                  );
                },
                child: const Text('Xử lý serial'),
              )
            : OutlinedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) =>
                          WarrantyActivationScreen(orderId: order.id),
                    ),
                  );
                },
                child: const Text('Xử lý serial'),
              ),
      if (canMarkReceived)
        ElevatedButton(
          onPressed: () => _confirmReceived(context, order),
          child: const Text('Xác nhận đã nhận hàng'),
        ),
      if (canCancel)
        TextButton(
          style: TextButton.styleFrom(
            foregroundColor: colors.error,
            minimumSize: const Size(0, 44),
            padding: const EdgeInsets.symmetric(horizontal: 14),
          ),
          onPressed: () => _confirmCancel(context, order),
          child: const Text('Hủy đơn'),
        ),
    ];

    return _StickyActionBar(actions: actions);
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final order = OrderScope.of(context).findById(orderId);
    final cart = CartScope.of(context);
    final isTablet = AppBreakpoints.isTablet(context);
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;

    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const BrandAppBarTitle('Chi tiết đơn hàng')),
        body: const Center(child: Text('Không tìm thấy đơn hàng.')),
      );
    }

    final canProcessSerial =
        order.status == OrderStatus.completed ||
        order.status == OrderStatus.shipping;
    final canCancel =
        order.status == OrderStatus.pendingApproval ||
        order.status == OrderStatus.approved;
    final canMarkReceived = order.status == OrderStatus.shipping;
    final stickyActionBar = _buildStickyActionBar(
      context: context,
      order: order,
      cart: cart,
      canProcessSerial: canProcessSerial,
      canMarkReceived: canMarkReceived,
      canCancel: canCancel,
    );
    final payments = OrderScope.of(
      context,
    ).paymentHistory.where((p) => p.orderId == orderId).toList();
    final totalPaymentHistoryAmount = payments.fold<int>(
      0,
      (sum, record) => sum + record.amount,
    );

    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Chi tiết đơn hàng'),
        actions: const [GlobalSearchIconButton()],
      ),
      bottomNavigationBar: stickyActionBar,
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 104),
            children: [
              FadeSlideIn(
                child: SectionCard(
                  title: 'Thông tin đơn',
                  child: Column(
                    children: [
                      _InfoRow(
                        label: 'Mã đơn',
                        value: order.id,
                        onCopy: () {
                          Clipboard.setData(ClipboardData(text: order.id));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Đã sao chép mã đơn ${order.id}'),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: 'Ngày đặt',
                        value: formatDateTime(order.createdAt),
                      ),
                      const SizedBox(height: 8),
                      _InfoStatusRow(
                        label: 'Trạng thái đơn',
                        status: order.status,
                      ),
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: 'Phương thức thanh toán',
                        value: order.paymentMethod.label,
                      ),
                      const SizedBox(height: 8),
                      _InfoPaymentStatusRow(
                        label: 'Trạng thái thanh toán',
                        paymentStatus: order.paymentStatus,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: SectionCard(
                  title: 'Thông tin nhận hàng',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        order.receiverName,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      InkWell(
                        onTap: () =>
                            _openAddressOnMap(context, order.receiverAddress),
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 2,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.max,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(
                                Icons.map_outlined,
                                size: 16,
                                color: colors.primary,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  order.receiverAddress,
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(
                                        color: colors.primary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      InkWell(
                        onTap: () =>
                            _callReceiver(context, order.receiverPhone),
                        borderRadius: BorderRadius.circular(8),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 4,
                            vertical: 2,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.phone_outlined,
                                size: 16,
                                color: colors.primary,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                order.receiverPhone,
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(
                                      color: colors.primary,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 120),
                child: SectionCard(
                  title: 'Sản phẩm (${order.totalItems})',
                  child: Column(
                    children: [
                      for (var i = 0; i < order.items.length; i++) ...[
                        _OrderItemTile(item: order.items[i]),
                        if (i != order.items.length - 1)
                          const Divider(height: 18),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 180),
                child: SectionCard(
                  title: 'Thanh toán',
                  child: Column(
                    children: [
                      _InfoRow(
                        label: 'Tạm tính',
                        value: formatVnd(order.subtotal),
                      ),
                      if (order.discountAmount > 0) ...[
                        const SizedBox(height: 8),
                        _InfoRow(
                          label: 'Chiết khấu (${order.discountPercent}%)',
                          value: '-${formatVnd(order.discountAmount)}',
                        ),
                        const SizedBox(height: 8),
                        _InfoRow(
                          label: 'Sau chiết khấu',
                          value: formatVnd(order.totalAfterDiscount),
                        ),
                      ],
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: 'Phí vận chuyển',
                        value: formatVnd(order.shippingFee),
                      ),
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: 'VAT (${order.vatPercent}%)',
                        value: formatVnd(order.vatAmount),
                      ),
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: 'Đã thanh toán',
                        value: formatVnd(order.paidAmount),
                      ),
                      if (order.outstandingAmount > 0) ...[
                        const SizedBox(height: 8),
                        _InfoRow(
                          label: 'Còn nợ',
                          value: formatVnd(order.outstandingAmount),
                          isWarning: true,
                        ),
                      ],
                      const Divider(height: 20),
                      _InfoRow(
                        label: 'Tổng cộng',
                        value: formatVnd(order.total),
                        isEmphasis: true,
                      ),
                    ],
                  ),
                ),
              ),
              if (payments.isNotEmpty) ...[
                const SizedBox(height: 14),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 240),
                  child: SectionCard(
                    title: 'Lịch sử thanh toán',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Tổng đã ghi nhận',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colors.onSurfaceVariant,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          formatVnd(totalPaymentHistoryAmount),
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(
                                color: colors.primary,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 10),
                        for (var i = 0; i < payments.length; i++) ...[
                          _PaymentHistoryTile(record: payments[i]),
                          if (i != payments.length - 1)
                            const Divider(height: 16),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StickyActionBar extends StatefulWidget {
  const _StickyActionBar({required this.actions});

  final List<Widget> actions;

  @override
  State<_StickyActionBar> createState() => _StickyActionBarState();
}

class _StickyActionBarState extends State<_StickyActionBar> {
  late final ScrollController _scrollController;
  bool _showOverflowHint = false;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController()..addListener(_handleScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _updateOverflowHint());
  }

  @override
  void didUpdateWidget(covariant _StickyActionBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    WidgetsBinding.instance.addPostFrameCallback((_) => _updateOverflowHint());
  }

  void _handleScroll() {
    _updateOverflowHint();
  }

  void _updateOverflowHint() {
    if (!mounted || !_scrollController.hasClients) {
      return;
    }
    final maxExtent = _scrollController.position.maxScrollExtent;
    final hasOverflow = maxExtent > 0;
    final canScrollRight = _scrollController.offset < maxExtent - 1;
    final shouldShow = hasOverflow && canScrollRight;
    if (shouldShow == _showOverflowHint) {
      return;
    }
    setState(() => _showOverflowHint = shouldShow);
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_handleScroll)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return SafeArea(
      top: false,
      child: Container(
        decoration: BoxDecoration(
          color: colors.surface,
          border: Border(
            top: BorderSide(
              color: colors.outlineVariant.withValues(alpha: 0.7),
            ),
          ),
          boxShadow: [
            BoxShadow(
              color: colors.shadow.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        child: Stack(
          children: [
            SingleChildScrollView(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (var i = 0; i < widget.actions.length; i++) ...[
                    widget.actions[i],
                    if (i != widget.actions.length - 1)
                      const SizedBox(width: 8),
                  ],
                ],
              ),
            ),
            if (_showOverflowHint)
              Positioned(
                top: 0,
                right: 0,
                bottom: 0,
                child: IgnorePointer(
                  child: Container(
                    width: 28,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                        colors: [
                          colors.surface.withValues(alpha: 0),
                          colors.surface,
                        ],
                      ),
                    ),
                    alignment: Alignment.centerRight,
                    child: Icon(
                      Icons.chevron_right,
                      size: 16,
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
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
    this.isWarning = false,
    this.onCopy,
  });

  final String label;
  final String value;
  final bool isEmphasis;
  final bool isWarning;
  final VoidCallback? onCopy;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final style = Theme.of(context).textTheme.bodyMedium;
    final emphasisStyle = Theme.of(
      context,
    ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700);
    final baseLabelStyle = isEmphasis ? emphasisStyle : style;
    final baseValueStyle = isEmphasis ? emphasisStyle : style;
    final labelStyle = isWarning
        ? baseLabelStyle?.copyWith(
            color: colors.error,
            fontWeight: FontWeight.w600,
          )
        : baseLabelStyle;
    final valueStyle = isWarning
        ? baseValueStyle?.copyWith(
            color: colors.error,
            fontWeight: FontWeight.w700,
          )
        : baseValueStyle;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: labelStyle)),
        const SizedBox(width: 16),
        Flexible(
          child: onCopy != null
              ? Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Flexible(
                      child: Text(
                        value,
                        textAlign: TextAlign.right,
                        style: valueStyle,
                      ),
                    ),
                    const SizedBox(width: 2),
                    IconButton(
                      onPressed: onCopy,
                      tooltip: 'Sao chép',
                      constraints: const BoxConstraints(
                        minWidth: 44,
                        minHeight: 44,
                      ),
                      icon: Icon(
                        Icons.copy_outlined,
                        size: 18,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                )
              : Text(value, textAlign: TextAlign.right, style: valueStyle),
        ),
      ],
    );
  }
}

class _InfoStatusRow extends StatelessWidget {
  const _InfoStatusRow({required this.label, required this.status});

  final String label;
  final OrderStatus status;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodyMedium;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: style)),
        const SizedBox(width: 16),
        _StatusChip(status: status),
      ],
    );
  }
}

class _InfoPaymentStatusRow extends StatelessWidget {
  const _InfoPaymentStatusRow({
    required this.label,
    required this.paymentStatus,
  });

  final String label;
  final OrderPaymentStatus paymentStatus;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodyMedium;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: style)),
        const SizedBox(width: 16),
        _PaymentStatusChip(paymentStatus: paymentStatus),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final OrderStatus status;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final background = _backgroundForStatus(status, isDark: isDark);
    final textColor = _textForStatus(status, isDark: isDark);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.28)),
      ),
      child: Text(
        status.label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}

class _PaymentStatusChip extends StatelessWidget {
  const _PaymentStatusChip({required this.paymentStatus});

  final OrderPaymentStatus paymentStatus;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final background = _paymentStatusBackground(paymentStatus, isDark: isDark);
    final textColor = _paymentStatusTextColor(paymentStatus, isDark: isDark);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.28)),
      ),
      child: Text(
        paymentStatus.label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}

Color _backgroundForStatus(OrderStatus status, {required bool isDark}) {
  if (isDark) {
    switch (status) {
      case OrderStatus.pendingApproval:
        return const Color(0xFF4C3B16);
      case OrderStatus.approved:
        return const Color(0xFF1E3150);
      case OrderStatus.shipping:
        return const Color(0xFF154052);
      case OrderStatus.completed:
        return const Color(0xFF1A3F2D);
      case OrderStatus.cancelled:
        return const Color(0xFF2A3642);
    }
  }
  switch (status) {
    case OrderStatus.pendingApproval:
      return const Color(0xFFFFF6DB);
    case OrderStatus.approved:
      return const Color(0xFFEAF2FF);
    case OrderStatus.shipping:
      return const Color(0xFFE0F2FE);
    case OrderStatus.completed:
      return const Color(0xFFE8F8EF);
    case OrderStatus.cancelled:
      return const Color(0xFFF1F5F9);
  }
}

Color _textForStatus(OrderStatus status, {required bool isDark}) {
  if (isDark) {
    switch (status) {
      case OrderStatus.pendingApproval:
        return const Color(0xFFF4D18A);
      case OrderStatus.approved:
        return const Color(0xFF93C5FD);
      case OrderStatus.shipping:
        return const Color(0xFF7DD3FC);
      case OrderStatus.completed:
        return const Color(0xFF86EFAC);
      case OrderStatus.cancelled:
        return const Color(0xFFCBD5E1);
    }
  }
  switch (status) {
    case OrderStatus.pendingApproval:
      return const Color(0xFF8A5A00);
    case OrderStatus.approved:
      return const Color(0xFF1A4FA3);
    case OrderStatus.shipping:
      return const Color(0xFF0C4A6E);
    case OrderStatus.completed:
      return const Color(0xFF1D7A3A);
    case OrderStatus.cancelled:
      return const Color(0xFF64748B);
  }
}

Color _paymentStatusBackground(
  OrderPaymentStatus status, {
  required bool isDark,
}) {
  if (isDark) {
    switch (status) {
      case OrderPaymentStatus.unpaid:
        return const Color(0xFF4A1E24);
      case OrderPaymentStatus.paid:
        return const Color(0xFF1A3F2D);
      case OrderPaymentStatus.debtRecorded:
        return const Color(0xFF4C3B16);
    }
  }
  switch (status) {
    case OrderPaymentStatus.unpaid:
      return const Color(0xFFFEECEE);
    case OrderPaymentStatus.paid:
      return const Color(0xFFE8F8EF);
    case OrderPaymentStatus.debtRecorded:
      return const Color(0xFFFFF6DB);
  }
}

Color _paymentStatusTextColor(
  OrderPaymentStatus status, {
  required bool isDark,
}) {
  if (isDark) {
    switch (status) {
      case OrderPaymentStatus.unpaid:
        return const Color(0xFFFDA4AF);
      case OrderPaymentStatus.paid:
        return const Color(0xFF86EFAC);
      case OrderPaymentStatus.debtRecorded:
        return const Color(0xFFF4D18A);
    }
  }
  switch (status) {
    case OrderPaymentStatus.unpaid:
      return const Color(0xFFB42318);
    case OrderPaymentStatus.paid:
      return const Color(0xFF1D7A3A);
    case OrderPaymentStatus.debtRecorded:
      return const Color(0xFF8A5A00);
  }
}

class _OrderItemTile extends StatelessWidget {
  const _OrderItemTile({required this.item});

  final OrderLineItem item;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: colors.secondaryContainer.withValues(alpha: 0.65),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            Icons.inventory_2_outlined,
            size: 20,
            color: colors.onSecondaryContainer,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.product.name,
                style: Theme.of(
                  context,
                ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 2),
              Text(
                'SKU: ${item.product.sku}',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
              ),
              const SizedBox(height: 2),
              Text(
                '${formatVnd(item.product.price)} x ${item.quantity}',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Text(
          formatVnd(item.total),
          style: Theme.of(
            context,
          ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

class _PaymentHistoryTile extends StatelessWidget {
  const _PaymentHistoryTile({required this.record});

  final DebtPaymentRecord record;

  IconData _iconForChannel(String channel) {
    final normalized = channel.toLowerCase();
    if (normalized.contains('chuyển khoản')) {
      return Icons.account_balance_outlined;
    }
    if (normalized.contains('tiền mặt')) {
      return Icons.money_outlined;
    }
    if (normalized.contains('bù trừ') || normalized.contains('công nợ')) {
      return Icons.swap_horiz_outlined;
    }
    return Icons.payments_outlined;
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(_iconForChannel(record.channel), size: 18, color: colors.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: colors.secondaryContainer.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  record.channel,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSecondaryContainer,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                formatDateTime(record.paidAt),
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
              ),
            ],
          ),
        ),
        Text(
          formatVnd(record.amount),
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w700,
            color: colors.primary,
          ),
        ),
      ],
    );
  }
}
