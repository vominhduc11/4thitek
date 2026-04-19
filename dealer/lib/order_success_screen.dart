import 'package:flutter/material.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dealer_navigation.dart';
import 'models.dart';
import 'order_controller.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class OrderSuccessScreen extends StatefulWidget {
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
  State<OrderSuccessScreen> createState() => _OrderSuccessScreenState();
}

class _OrderSuccessScreenState extends State<OrderSuccessScreen> {
  OrderController? _orderController;
  bool _redirectScheduled = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final nextController = OrderScope.of(context);
    if (!identical(_orderController, nextController)) {
      _orderController?.removeListener(_handleOrderChange);
      _orderController = nextController;
      _orderController?.addListener(_handleOrderChange);
    }
    _redirectWhenPaid();
  }

  @override
  void dispose() {
    _orderController?.removeListener(_handleOrderChange);
    super.dispose();
  }

  void _handleOrderChange() {
    if (!mounted) {
      return;
    }
    _redirectWhenPaid();
  }

  void _redirectWhenPaid() {
    if (_redirectScheduled) {
      return;
    }
    final order = _orderController?.findById(widget.orderId);
    if (order?.paymentStatus != OrderPaymentStatus.paid) {
      return;
    }
    _redirectScheduled = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      context.goDealerOrderDetail(widget.orderId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final texts = _OrderSuccessTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final order = OrderScope.of(context).findById(widget.orderId);
    final isPaid = order?.paymentStatus == OrderPaymentStatus.paid;
    final statusNote = _buildStatusNote(order, texts);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isTablet = AppBreakpoints.isTablet(context);
    final isWideLayout = screenWidth >= 980;
    final maxWidth = isWideLayout
        ? 1080.0
        : isTablet
        ? 860.0
        : double.infinity;
    const successColor = Color(0xFF4ADE80);

    final summarySection = RepaintBoundary(
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 500),
        child: _SummaryCard(
          texts: texts,
          itemCount: widget.itemCount,
          totalPrice: widget.totalPrice,
          paymentMethod: order != null
              ? texts.paymentMethodLabel(context, order.paymentMethod)
              : null,
          paymentStatus: order != null
              ? texts.paymentStatusLabel(order.paymentStatus)
              : null,
          note: order?.note,
        ),
      ),
    );

    final actionSection = RepaintBoundary(
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 650),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: colorScheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: colorScheme.outlineVariant.withValues(alpha: 0.55),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                isPaid
                    ? texts.paymentConfirmedMessage
                    : texts.pendingTransferMessage,
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  height: 1.45,
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => context.goDealerOrderDetail(widget.orderId),
                icon: const Icon(Icons.receipt_long_outlined),
                label: Text(texts.viewOrderDetailAction),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => context.goToDealerHome(),
                icon: const Icon(Icons.storefront_outlined),
                label: Text(texts.continueShoppingAction),
              ),
            ],
          ),
        ),
      ),
    );

    final heroSection = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0.4, end: 1.0),
          duration: const Duration(milliseconds: 480),
          curve: Curves.easeOutBack,
          child: Icon(
            Icons.check_circle_outline,
            size: 72,
            color: successColor,
          ),
          builder: (context, value, child) {
            return Opacity(
              opacity: value.clamp(0.0, 1.0),
              child: Transform.scale(scale: value, child: child),
            );
          },
        ),
        const SizedBox(height: 16),
        FadeSlideIn(
          delay: const Duration(milliseconds: 200),
          child: Column(
            children: [
              Text(
                texts.orderRecordedTitle,
                style: textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                texts.orderIdSummary(widget.orderId),
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        if (isPaid) ...[
          const SizedBox(height: 16),
          FadeSlideIn(
            delay: const Duration(milliseconds: 250),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: successColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: successColor.withValues(alpha: 0.4)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle, color: successColor, size: 20),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      texts.paymentConfirmedMessage,
                      textAlign: TextAlign.center,
                      style: textTheme.bodyMedium?.copyWith(
                        color: successColor,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 20),
        FadeSlideIn(
          delay: const Duration(milliseconds: 350),
          child: Text(
            statusNote,
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
              height: 1.45,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: BrandAppBarTitle(texts.screenTitle),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
            child: isWideLayout
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 6, child: heroSection),
                      const SizedBox(width: 24),
                      Expanded(
                        flex: 5,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            summarySection,
                            const SizedBox(height: 20),
                            actionSection,
                          ],
                        ),
                      ),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      heroSection,
                      const SizedBox(height: 20),
                      summarySection,
                      const SizedBox(height: 24),
                      actionSection,
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  String _buildStatusNote(Order? order, _OrderSuccessTexts texts) {
    if (order == null) {
      return texts.pendingMessage;
    }
    if (order.paymentStatus == OrderPaymentStatus.paid) {
      return texts.sepayConfirmedMessage;
    }
    return texts.pendingTransferMessage;
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.texts,
    required this.itemCount,
    required this.totalPrice,
    this.paymentMethod,
    this.paymentStatus,
    this.note,
  });

  final _OrderSuccessTexts texts;
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
            _SummaryRow(label: texts.itemCountLabel, value: '$itemCount'),
            const SizedBox(height: 8),
            if (paymentMethod != null) ...[
              _SummaryRow(
                label: texts.paymentMethodRowLabel,
                value: paymentMethod!,
              ),
              const SizedBox(height: 8),
            ],
            if (paymentStatus != null) ...[
              _SummaryRow(
                label: texts.paymentStatusRowLabel,
                value: paymentStatus!,
              ),
              const SizedBox(height: 8),
            ],
            if (note != null && note!.trim().isNotEmpty) ...[
              _SummaryRow(label: texts.noteLabel, value: note!),
              const SizedBox(height: 8),
            ],
            _SummaryRow(
              label: texts.totalPaymentLabel,
              value: formatVnd(totalPrice),
              isEmphasis: true,
            ),
          ],
        ),
      ),
    );
  }
}

class _OrderSuccessTexts {
  const _OrderSuccessTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle =>
      isEnglish ? 'Order placed successfully' : 'Đặt hàng thành công';
  String get orderRecordedTitle =>
      isEnglish ? 'Your order has been recorded' : 'Đơn hàng đã được ghi nhận';
  String orderIdSummary(String orderId) =>
      isEnglish ? 'Order ID: $orderId' : 'Mã đơn hàng: $orderId';
  String get paymentConfirmedMessage => isEnglish
      ? 'Payment has been confirmed!'
      : 'Thanh toán đã được xác nhận!';
  String get pendingMessage => isEnglish
      ? 'The order is pending confirmation.'
      : 'Đơn hàng đang chờ xác nhận.';
  String get sepayConfirmedMessage => isEnglish
      ? 'SePay has confirmed the payment. Your order is pending confirmation.'
      : 'SePay đã xác nhận thanh toán. Đơn hàng đang chờ xác nhận.';
  String get pendingTransferMessage => isEnglish
      ? 'The order has been created. Please transfer using the correct order ID; the SePay webhook will update payment automatically once the bank confirms the transaction.'
      : 'Đơn đã được tạo. Hãy chuyển khoản đúng mã đơn hàng, SePay webhook sẽ tự động cập nhật thanh toán khi ngân hàng ghi nhận giao dịch.';
  String get viewOrderDetailAction =>
      isEnglish ? 'View order details' : 'Xem chi tiết đơn hàng';
  String get continueShoppingAction =>
      isEnglish ? 'Continue shopping' : 'Tiếp tục mua hàng';
  String get itemCountLabel => isEnglish ? 'Item count' : 'Số lượng sản phẩm';
  String get paymentMethodRowLabel =>
      isEnglish ? 'Payment method' : 'Phương thức thanh toán';
  String get paymentStatusRowLabel =>
      isEnglish ? 'Payment status' : 'Trạng thái thanh toán';
  String get noteLabel => isEnglish ? 'Note' : 'Ghi chú';
  String get totalPaymentLabel =>
      isEnglish ? 'Total payment' : 'Tổng thanh toán';

  String paymentMethodLabel(BuildContext context, OrderPaymentMethod method) =>
      method.localizedLabel(context);

  String paymentStatusLabel(OrderPaymentStatus status) {
    switch (status) {
      case OrderPaymentStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
      case OrderPaymentStatus.pending:
        return isEnglish ? 'Unpaid' : 'Chưa thanh toán';
      case OrderPaymentStatus.paid:
        return isEnglish ? 'Paid' : 'Đã thanh toán';
    }
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

    return LayoutBuilder(
      builder: (context, constraints) {
        final shouldStack = constraints.maxWidth < 300;
        if (shouldStack) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: isEmphasis ? emphasisStyle : style),
              const SizedBox(height: 4),
              Text(value, style: isEmphasis ? emphasisStyle : style),
            ],
          );
        }

        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: isEmphasis ? emphasisStyle : style),
            Text(value, style: isEmphasis ? emphasisStyle : style),
          ],
        );
      },
    );
  }
}
