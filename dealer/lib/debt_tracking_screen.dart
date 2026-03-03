import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import 'breakpoints.dart';
import 'models.dart';
import 'order_controller.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class DebtTrackingScreen extends StatelessWidget {
  const DebtTrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final orderController = OrderScope.of(context);
    final debtOrders = orderController.debtOrders;
    final paymentHistory = orderController.paymentHistory;
    final isTablet =
        MediaQuery.sizeOf(context).shortestSide >= AppBreakpoints.phone;
    final maxWidth = isTablet ? 960.0 : double.infinity;

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Công nợ')),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              FadeSlideIn(
                child: _DebtSummaryCard(
                  totalOutstandingDebt: orderController.totalOutstandingDebt,
                  debtOrderCount: debtOrders.length,
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: Text(
                  'Đơn hàng còn nợ',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              if (debtOrders.isEmpty)
                const _EmptyCard(message: 'Không có đơn hàng nào còn nợ tiền.')
              else
                ...debtOrders.asMap().entries.map((entry) {
                  final index = entry.key;
                  final order = entry.value;
                  return FadeSlideIn(
                    key: ValueKey('debt-${order.id}'),
                    delay: Duration(milliseconds: 90 + index * 40),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _DebtOrderCard(order: order),
                    ),
                  );
                }),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 120),
                child: Text(
                  'Lịch sử thanh toán',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              if (paymentHistory.isEmpty)
                const _EmptyCard(message: 'Chưa có lịch sử thanh toán.')
              else
                ...paymentHistory.asMap().entries.map((entry) {
                  final index = entry.key;
                  final payment = entry.value;
                  return FadeSlideIn(
                    key: ValueKey(payment.id),
                    delay: Duration(milliseconds: 140 + index * 35),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 10),
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
                        child: ListTile(
                          title: Text(
                            '${payment.orderId} - ${formatVnd(payment.amount)}',
                          ),
                          subtitle: Text(
                            '${payment.channel} · ${formatDateTime(payment.paidAt)}',
                          ),
                          trailing: payment.proofFileName == null
                              ? null
                              : Tooltip(
                                  message: payment.proofFileName!,
                                  child: const Icon(
                                    Icons.attach_file,
                                    size: 18,
                                  ),
                                ),
                        ),
                      ),
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }
}

class _DebtSummaryCard extends StatelessWidget {
  const _DebtSummaryCard({
    required this.totalOutstandingDebt,
    required this.debtOrderCount,
  });

  final int totalOutstandingDebt;
  final int debtOrderCount;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final debtColor = isDark
        ? const Color(0xFFFBBF24)
        : const Color(0xFFB45309);

    return Card(
      elevation: 0,
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
              'Tổng công nợ hiện tại',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              formatVnd(totalOutstandingDebt),
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: debtColor,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.receipt_long_outlined, size: 18),
                const SizedBox(width: 6),
                Text(
                  '$debtOrderCount đơn hàng còn nợ',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DebtOrderCard extends StatelessWidget {
  const _DebtOrderCard({required this.order});

  final Order order;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final debtColor = isDark
        ? const Color(0xFFFBBF24)
        : const Color(0xFFB45309);

    return Card(
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
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    order.id,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                _StatusChip(label: order.paymentStatus.label),
              ],
            ),
            const SizedBox(height: 8),
            Text('Ngày đặt: ${formatDateTime(order.createdAt)}'),
            const SizedBox(height: 4),
            Text('PTTT: ${order.paymentMethod.label}'),
            const SizedBox(height: 4),
            Text('Tổng đơn: ${formatVnd(order.total)}'),
            const SizedBox(height: 4),
            Text('Đã thanh toán: ${formatVnd(order.paidAmount)}'),
            const SizedBox(height: 4),
            Text(
              'Còn nợ: ${formatVnd(order.outstandingAmount)}',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: debtColor,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _showRecordPaymentDialog(context, order),
                icon: const Icon(Icons.payments_outlined, size: 18),
                label: const Text('Ghi nhận thanh toán'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showRecordPaymentDialog(
    BuildContext context,
    Order order,
  ) async {
    final amountController = TextEditingController();
    final noteController = TextEditingController();
    final proofController = TextEditingController();
    final channels = <String>['Chuyển khoản', 'Tiền mặt', 'Bù trừ công nợ'];
    var channel = order.paymentMethod == OrderPaymentMethod.debt
        ? channels.last
        : channels.first;

    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        String? pickedFileName;
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Ghi nhận thanh toán'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Đơn: ${order.id}'),
                    const SizedBox(height: 8),
                    TextField(
                      controller: amountController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        labelText: 'Số tiền thanh toán',
                        hintText:
                            'Tối đa ${formatVnd(order.outstandingAmount)}',
                      ),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      initialValue: channel,
                      decoration: const InputDecoration(
                        labelText: 'Kênh thanh toán',
                      ),
                      items: channels
                          .map(
                            (item) => DropdownMenuItem<String>(
                              value: item,
                              child: Text(item),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        if (value == null) {
                          return;
                        }
                        setDialogState(() => channel = value);
                      },
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: noteController,
                      decoration: const InputDecoration(labelText: 'Ghi chú'),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: () async {
                        final picked = await ImagePicker().pickImage(
                          source: ImageSource.gallery,
                        );
                        if (picked != null) {
                          setDialogState(() {
                            pickedFileName = picked.name;
                            proofController.text = picked.name;
                          });
                        }
                      },
                      icon: const Icon(Icons.attach_file_outlined, size: 18),
                      label: Text(
                        pickedFileName ?? 'Đính kèm chứng từ',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Hủy'),
                ),
                ElevatedButton(
                  onPressed: () {
                    final parsedAmount =
                        int.tryParse(amountController.text.trim()) ?? 0;
                    if (parsedAmount <= 0) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Số tiền phải lớn hơn 0.'),
                        ),
                      );
                      return;
                    }
                    if (parsedAmount > order.outstandingAmount) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            'Số tiền không được vượt quá ${formatVnd(order.outstandingAmount)}.',
                          ),
                        ),
                      );
                      return;
                    }
                    OrderScope.of(context).recordPayment(
                      orderId: order.id,
                      amount: parsedAmount,
                      channel: channel,
                      note: noteController.text.trim().isEmpty
                          ? null
                          : noteController.text.trim(),
                      proofFileName: proofController.text.trim().isEmpty
                          ? null
                          : proofController.text.trim(),
                    );
                    Navigator.of(dialogContext).pop();
                  },
                  child: const Text('Xác nhận'),
                ),
              ],
            );
          },
        );
      },
    );

    amountController.dispose();
    noteController.dispose();
    proofController.dispose();
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final chipBg = isDark ? const Color(0xFF422006) : const Color(0xFFFFF7ED);
    final chipText = isDark ? const Color(0xFFFCD34D) : const Color(0xFF9A3412);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: chipBg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: chipText,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(padding: const EdgeInsets.all(16), child: Text(message)),
    );
  }
}
