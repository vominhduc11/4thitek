import 'package:flutter/material.dart';

import '../models.dart';

class OrderStatusChip extends StatelessWidget {
  const OrderStatusChip({super.key, required this.status, required this.label});

  final OrderStatus status;
  final String label;

  @override
  Widget build(BuildContext context) {
    final background = orderStatusChipBackground(status);
    final textColor = orderStatusChipTextColor(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.28)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}

class OrderPaymentStatusChip extends StatelessWidget {
  const OrderPaymentStatusChip({
    super.key,
    required this.paymentStatus,
    required this.label,
  });

  final OrderPaymentStatus paymentStatus;
  final String label;

  @override
  Widget build(BuildContext context) {
    final background = orderPaymentStatusChipBackground(paymentStatus);
    final textColor = orderPaymentStatusChipTextColor(paymentStatus);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.28)),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}

Color orderStatusChipBackground(OrderStatus status) {
  switch (status) {
    case OrderStatus.pending:
      return const Color(0xFF4C3B16);
    case OrderStatus.confirmed:
      return const Color(0xFF1E3150);
    case OrderStatus.processing:
      return const Color(0xFF154052);
    case OrderStatus.shipping:
      return const Color(0xFF154052);
    case OrderStatus.completed:
      return const Color(0xFF1A3F2D);
    case OrderStatus.cancelRequested:
      return const Color(0xFF4C3B16);
    case OrderStatus.cancelRejected:
      return const Color(0xFF2A3642);
    case OrderStatus.cancelled:
      return const Color(0xFF2A3642);
  }
}

Color orderStatusChipTextColor(OrderStatus status) {
  switch (status) {
    case OrderStatus.pending:
      return const Color(0xFFF4D18A);
    case OrderStatus.confirmed:
      return const Color(0xFF93C5FD);
    case OrderStatus.processing:
      return const Color(0xFF7DD3FC);
    case OrderStatus.shipping:
      return const Color(0xFF7DD3FC);
    case OrderStatus.completed:
      return const Color(0xFF86EFAC);
    case OrderStatus.cancelRequested:
      return const Color(0xFFF4D18A);
    case OrderStatus.cancelRejected:
      return const Color(0xFFCBD5E1);
    case OrderStatus.cancelled:
      return const Color(0xFFCBD5E1);
  }
}

Color orderPaymentStatusChipBackground(OrderPaymentStatus status) {
  switch (status) {
    case OrderPaymentStatus.cancelled:
      return const Color(0xFF3B1F26);
    case OrderPaymentStatus.pending:
      return const Color(0xFF4A1E24);
    case OrderPaymentStatus.paid:
      return const Color(0xFF1A3F2D);
  }
}

Color orderPaymentStatusChipTextColor(OrderPaymentStatus status) {
  switch (status) {
    case OrderPaymentStatus.cancelled:
      return const Color(0xFFFDA4AF);
    case OrderPaymentStatus.pending:
      return const Color(0xFFFDA4AF);
    case OrderPaymentStatus.paid:
      return const Color(0xFF86EFAC);
  }
}
