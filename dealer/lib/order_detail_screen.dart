import 'package:flutter/material.dart';

import 'models.dart';
import 'order_controller.dart';
import 'utils.dart';
import 'warranty_activation_screen.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context) {
    final order = OrderScope.of(context).findById(orderId);

    if (order == null) {
      return Scaffold(
        appBar: AppBar(title: const BrandAppBarTitle('Chi tiet don hang')),
        body: const Center(child: Text('Khong tim thay don hang.')),
      );
    }

    final canProcessSerial = order.status == OrderStatus.completed;

    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Chi tiet don hang')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          FadeSlideIn(
            child: _SectionCard(
              title: 'Thong tin don',
              child: Column(
                children: [
                  _InfoRow(label: 'Ma don', value: order.id),
                  const SizedBox(height: 8),
                  _InfoRow(
                    label: 'Ngay dat',
                    value: formatDateTime(order.createdAt),
                  ),
                  const SizedBox(height: 8),
                  _InfoRow(label: 'Trang thai don', value: order.status.label),
                  const SizedBox(height: 8),
                  _InfoRow(
                    label: 'Phuong thuc thanh toan',
                    value: order.paymentMethod.label,
                  ),
                  const SizedBox(height: 8),
                  _InfoRow(
                    label: 'Trang thai thanh toan',
                    value: order.paymentStatus.label,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          FadeSlideIn(
            delay: const Duration(milliseconds: 60),
            child: _SectionCard(
              title: 'Thong tin nhan hang',
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
                  Text(
                    order.receiverAddress,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'SDT: ${order.receiverPhone}',
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
            delay: const Duration(milliseconds: 120),
            child: _SectionCard(
              title: 'San pham (${order.totalItems})',
              child: Column(
                children: [
                  for (var i = 0; i < order.items.length; i++) ...[
                    _OrderItemTile(item: order.items[i]),
                    if (i != order.items.length - 1) const Divider(height: 18),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          FadeSlideIn(
            delay: const Duration(milliseconds: 180),
            child: _SectionCard(
              title: 'Thanh toan',
              child: Column(
                children: [
                  _InfoRow(label: 'Tam tinh', value: formatVnd(order.subtotal)),
                  if (order.discountAmount > 0) ...[
                    const SizedBox(height: 8),
                    _InfoRow(
                      label: 'Giam gia (${order.discountPercent}%)',
                      value: '-${formatVnd(order.discountAmount)}',
                    ),
                    const SizedBox(height: 8),
                    _InfoRow(
                      label: 'Sau giam gia',
                      value: formatVnd(order.totalAfterDiscount),
                    ),
                  ],
                  const SizedBox(height: 8),
                  _InfoRow(
                    label: 'Phi van chuyen',
                    value: formatVnd(order.shippingFee),
                  ),
                  const SizedBox(height: 8),
                  _InfoRow(
                    label: 'VAT (${order.vatPercent}%)',
                    value: formatVnd(order.vatAmount),
                  ),
                  const SizedBox(height: 8),
                  _InfoRow(
                    label: 'Da thanh toan',
                    value: formatVnd(order.paidAmount),
                  ),
                  const SizedBox(height: 8),
                  _InfoRow(
                    label: 'Con no',
                    value: formatVnd(order.outstandingAmount),
                  ),
                  const Divider(height: 20),
                  _InfoRow(
                    label: 'Tong cong',
                    value: formatVnd(order.total),
                    isEmphasis: true,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          FadeSlideIn(
            delay: const Duration(milliseconds: 240),
            child: ElevatedButton(
              onPressed: canProcessSerial
                  ? () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) =>
                              WarrantyActivationScreen(orderId: order.id),
                        ),
                      );
                    }
                  : null,
              child: Text(
                canProcessSerial
                    ? 'Xu ly serial'
                    : 'Chi xu ly serial khi don da giao',
              ),
            ),
          ),
        ],
      ),
    );
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
    ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: isEmphasis ? emphasisStyle : style)),
        const SizedBox(width: 16),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: isEmphasis ? emphasisStyle : style,
          ),
        ),
      ],
    );
  }
}

class _OrderItemTile extends StatelessWidget {
  const _OrderItemTile({required this.item});

  final OrderLineItem item;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: const Color(0xFFEFF3FB),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.inventory_2_outlined, size: 20),
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
                ).textTheme.bodySmall?.copyWith(color: Colors.black54),
              ),
              const SizedBox(height: 2),
              Text(
                '${formatVnd(item.product.price)} x ${item.quantity}',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: Colors.black54),
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
