part of 'order_detail_screen.dart';

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
    final texts = _orderDetailTexts(context);
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
                      tooltip: texts.copyTooltip,
                      constraints: const BoxConstraints(
                        minWidth: 48,
                        minHeight: 48,
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
    final texts = _orderDetailTexts(context);
    final style = Theme.of(context).textTheme.bodyMedium;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: style)),
        const SizedBox(width: 16),
        OrderStatusChip(status: status, label: texts.orderStatusLabel(status)),
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
    final texts = _orderDetailTexts(context);
    final style = Theme.of(context).textTheme.bodyMedium;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: style)),
        const SizedBox(width: 16),
        OrderPaymentStatusChip(
          paymentStatus: paymentStatus,
          label: texts.orderPaymentStatusLabel(paymentStatus),
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

  final OrderPaymentRecord record;

  IconData _iconForChannel(String channel) {
    final normalized = channel.toLowerCase();
    if (normalized.contains('chuyển khoản') ||
        normalized.contains('transfer') ||
        normalized.contains('bank')) {
      return Icons.account_balance_outlined;
    }
    if (normalized.contains('tiền mặt') || normalized.contains('cash')) {
      return Icons.money_outlined;
    }
    return Icons.payments_outlined;
  }

  @override
  Widget build(BuildContext context) {
    final texts = _orderDetailTexts(context);
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
                  texts.paymentChannelDisplay(record.channel),
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
