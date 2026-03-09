import 'package:flutter/material.dart';

import 'breakpoints.dart';
import 'models.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class OrderSuccessScreen extends StatelessWidget {
  const OrderSuccessScreen({
    super.key,
    required this.orderId,
    required this.itemCount,
    required this.totalPrice,
  });

  final String orderId;
  final int itemCount;
  final int totalPrice;

  @override
  Widget build(BuildContext context) {
    final order = OrderScope.of(context).findById(orderId);
    final statusNote = _buildStatusNote(order);
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isTablet = AppBreakpoints.isTablet(context);
    final maxWidth = isTablet ? 860.0 : double.infinity;
    final successColor = isDark
        ? const Color(0xFF4ADE80)
        : const Color(0xFF16A34A);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const BrandAppBarTitle('Đặt hàng thành công'),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
            child: FadeSlideIn(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TweenAnimationBuilder<double>(
                    tween: Tween<double>(begin: 0.9, end: 1.0),
                    duration: const Duration(milliseconds: 420),
                    curve: Curves.easeOutBack,
                    child: Icon(
                      Icons.check_circle_outline,
                      size: 72,
                      color: successColor,
                    ),
                    builder: (context, value, child) {
                      return Transform.scale(scale: value, child: child);
                    },
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Đơn hàng đã được ghi nhận',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Mã đơn hàng: $orderId',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    statusNote,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  _SummaryCard(
                    itemCount: itemCount,
                    totalPrice: totalPrice,
                    paymentMethod: order?.paymentMethod.label,
                    paymentStatus: order?.paymentStatus.label,
                    note: order?.note,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(
                          builder: (_) => OrderDetailScreen(orderId: orderId),
                        ),
                        (route) => route.isFirst,
                      );
                    },
                    child: const Text('Xem chi tiết đơn hàng'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: () {
                      Navigator.of(context).popUntil((route) => route.isFirst);
                    },
                    child: const Text('Tiep tuc mua hang'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _buildStatusNote(Order? order) {
    if (order == null) {
      return 'Đơn đang chờ duyệt phía nhà phân phối.';
    }
    if (order.paymentMethod == OrderPaymentMethod.debt) {
      return 'Đơn đã được ghi nhận công nợ và đang chờ duyệt phía nhà phân phối.';
    }
    return 'Đơn đã được tạo. Hãy chuyển khoản đúng mã đơn hàng, SePay webhook sẽ tự động cập nhật thanh toán khi ngân hàng ghi nhận giao dịch.';
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.itemCount,
    required this.totalPrice,
    this.paymentMethod,
    this.paymentStatus,
    this.note,
  });

  final int itemCount;
  final int totalPrice;
  final String? paymentMethod;
  final String? paymentStatus;
  final String? note;

  @override
  Widget build(BuildContext context) {
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
          children: [
            _SummaryRow(label: 'Số lượng sản phẩm', value: '$itemCount'),
            const SizedBox(height: 8),
            if (paymentMethod != null) ...[
              _SummaryRow(
                label: 'Phuong thuc thanh toan',
                value: paymentMethod!,
              ),
              const SizedBox(height: 8),
            ],
            if (paymentStatus != null) ...[
              _SummaryRow(
                label: 'Trang thai thanh toan',
                value: paymentStatus!,
              ),
              const SizedBox(height: 8),
            ],
            if (note != null && note!.trim().isNotEmpty) ...[
              _SummaryRow(label: 'Ghi chú', value: note!),
              const SizedBox(height: 8),
            ],
            _SummaryRow(
              label: 'Tong thanh toan',
              value: formatVnd(totalPrice),
              isEmphasis: true,
            ),
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

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: isEmphasis ? emphasisStyle : style),
        Text(value, style: isEmphasis ? emphasisStyle : style),
      ],
    );
  }
}
