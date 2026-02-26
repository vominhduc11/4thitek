import 'package:flutter/material.dart';

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

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Cong no')),
      body: ListView(
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
              'Don hang con no',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 10),
          if (debtOrders.isEmpty)
            const _EmptyCard(message: 'Khong co don hang nao con no tien.')
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
              'Lich su thanh toan',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: 10),
          if (paymentHistory.isEmpty)
            const _EmptyCard(message: 'Chua co lich su thanh toan.')
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
                      side: const BorderSide(color: Color(0xFFE5EAF5)),
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
                              child: const Icon(Icons.attach_file, size: 18),
                            ),
                    ),
                  ),
                ),
              );
            }),
        ],
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
              'Tong cong no hien tai',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
            ),
            const SizedBox(height: 6),
            Text(
              formatVnd(totalOutstandingDebt),
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: const Color(0xFFB45309),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.receipt_long_outlined, size: 18),
                const SizedBox(width: 6),
                Text(
                  '$debtOrderCount don hang con no',
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
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
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
            Text('Ngay dat: ${formatDateTime(order.createdAt)}'),
            const SizedBox(height: 4),
            Text('PTTT: ${order.paymentMethod.label}'),
            const SizedBox(height: 4),
            Text('Tong don: ${formatVnd(order.total)}'),
            const SizedBox(height: 4),
            Text('Da thanh toan: ${formatVnd(order.paidAmount)}'),
            const SizedBox(height: 4),
            Text(
              'Con no: ${formatVnd(order.outstandingAmount)}',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: const Color(0xFFB45309),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _showRecordPaymentDialog(context, order),
                icon: const Icon(Icons.payments_outlined, size: 18),
                label: const Text('Ghi nhan thanh toan'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showRecordPaymentDialog(BuildContext context, Order order) async {
    final amountController = TextEditingController(
      text: order.outstandingAmount.toString(),
    );
    final noteController = TextEditingController();
    final proofController = TextEditingController();
    var channel = 'Chuyen khoan';

    await showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Ghi nhan thanh toan (mock)'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Don: ${order.id}'),
                    const SizedBox(height: 8),
                    TextField(
                      controller: amountController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'So tien thanh toan',
                      ),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      initialValue: channel,
                      decoration: const InputDecoration(
                        labelText: 'Kenh thanh toan',
                      ),
                      items: const [
                        DropdownMenuItem(
                          value: 'Chuyen khoan',
                          child: Text('Chuyen khoan ngan hang'),
                        ),
                        DropdownMenuItem(
                          value: 'Tien mat',
                          child: Text('Tien mat'),
                        ),
                      ],
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
                      decoration: const InputDecoration(
                        labelText: 'Ghi chu',
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: proofController,
                      decoration: const InputDecoration(
                        labelText: 'Ten chung tu (mock)',
                      ),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: () {
                        final timestamp = DateTime.now().millisecondsSinceEpoch;
                        proofController.text = 'chung-tu-$timestamp.jpg';
                      },
                      icon: const Icon(Icons.upload_file_outlined, size: 18),
                      label: const Text('Upload chung tu (UI mock)'),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  child: const Text('Huy'),
                ),
                ElevatedButton(
                  onPressed: () {
                    final parsedAmount =
                        int.tryParse(amountController.text.trim()) ?? 0;
                    final success = OrderScope.of(context).recordPayment(
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
                    ScaffoldMessenger.of(context)
                      ..hideCurrentSnackBar()
                      ..showSnackBar(
                        SnackBar(
                          behavior: SnackBarBehavior.floating,
                          content: Text(
                            success
                                ? 'Da ghi nhan thanh toan thanh cong.'
                                : 'Khong the ghi nhan thanh toan.',
                          ),
                        ),
                      );
                  },
                  child: const Text('Xac nhan'),
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: const Color(0xFF9A3412),
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
        side: const BorderSide(color: Color(0xFFE5EAF5)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Text(message),
      ),
    );
  }
}
