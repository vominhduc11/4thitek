import 'package:flutter/material.dart';

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
      case OrderPaymentMethod.cod:
        return OrderPaymentStatus.unpaid;
      case OrderPaymentMethod.bankTransfer:
        return OrderPaymentStatus.unpaid;
      case OrderPaymentMethod.debt:
        return OrderPaymentStatus.debtRecorded;
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
    final total = cart.total + shippingFee;

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
                      value: OrderPaymentMethod.cod,
                      title: const Text('Thanh toan khi nhan hang (COD)'),
                    ),
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
                    ),
                    const SizedBox(height: 8),
                    _SummaryRow(
                      label: 'So tai khoan',
                      value: distributorBankAccount,
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
                    label: 'Phi van chuyen',
                    value: formatVnd(shippingFee),
                  ),
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
                    : () {
                        final order = Order(
                          id: _generateOrderId(orderController),
                          createdAt: DateTime.now(),
                          status: OrderStatus.pendingApproval,
                          paymentMethod: _method,
                          paymentStatus: _previewPaymentStatus,
                          receiverName: 'Dai ly SCS Ha Noi',
                          receiverAddress:
                              'So 12, Duong Tran Duy Hung, Cau Giay, Ha Noi',
                          receiverPhone: '0909 123 456',
                          shippingFee: shippingFee,
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
                      },
                child: const Text('Xac nhan dat hang'),
              ),
            ),
          ),
        ],
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
