part of 'order_detail_screen.dart';

extension _OrderDetailScreenBody on OrderDetailScreen {
  Widget _buildStickyActionBar({
    required BuildContext context,
    required Order order,
    required CartController cart,
    required bool canProcessSerial,
    required bool canCancel,
    required bool canConfirm,
    required bool canStartShipping,
    required bool canComplete,
  }) {
    final texts = _orderDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    final canReorder = order.status != OrderStatus.cancelled;
    final canShowBankTransferInfo =
        order.paymentMethod == OrderPaymentMethod.bankTransfer &&
        order.outstandingAmount > 0;
    final canRecordPayment =
        order.paymentMethod != OrderPaymentMethod.bankTransfer &&
        order.outstandingAmount > 0;
    final hasForwardAction = canConfirm || canStartShipping || canComplete;
    final paymentActionIsPrimary =
        !hasForwardAction && (canShowBankTransferInfo || canRecordPayment);
    final processSerialIsPrimary =
        !paymentActionIsPrimary && !hasForwardAction && canProcessSerial;

    final actions = <Widget>[
      if (canConfirm)
        FilledButton.icon(
          onPressed: () =>
              _updateOrderStatus(context, order, OrderStatus.confirmed),
          icon: const Icon(Icons.check_rounded, size: 18),
          label: Text(texts.confirmOrderAction),
        ),
      if (canStartShipping)
        FilledButton.icon(
          onPressed: () =>
              _updateOrderStatus(context, order, OrderStatus.shipping),
          icon: const Icon(Icons.local_shipping_outlined, size: 18),
          label: Text(texts.startShippingAction),
        ),
      if (canComplete)
        FilledButton.icon(
          onPressed: () =>
              _updateOrderStatus(context, order, OrderStatus.completed),
          icon: const Icon(Icons.task_alt_rounded, size: 18),
          label: Text(texts.completeOrderAction),
        ),
      if (canReorder)
        OutlinedButton(
          onPressed: () => _reorder(context, cart, order),
          child: Text(texts.reorderAction),
        ),
      if (canShowBankTransferInfo)
        paymentActionIsPrimary
            ? ElevatedButton.icon(
                onPressed: () => _showBankTransferInstructions(context, order),
                icon: const Icon(Icons.account_balance_outlined, size: 18),
                label: Text(texts.bankTransferInfoAction),
              )
            : OutlinedButton.icon(
                onPressed: () => _showBankTransferInstructions(context, order),
                icon: const Icon(Icons.account_balance_outlined, size: 18),
                label: Text(texts.bankTransferInfoAction),
              ),
      if (canRecordPayment)
        paymentActionIsPrimary
            ? ElevatedButton.icon(
                onPressed: () => _showRecordPaymentDialog(context, order),
                icon: const Icon(Icons.payments_outlined, size: 18),
                label: Text(texts.recordPaymentAction),
              )
            : OutlinedButton.icon(
                onPressed: () => _showRecordPaymentDialog(context, order),
                icon: const Icon(Icons.payments_outlined, size: 18),
                label: Text(texts.recordPaymentAction),
              ),
      if (canProcessSerial)
        processSerialIsPrimary
            ? ElevatedButton(
                onPressed: () => context.pushDealerWarrantyActivation(order.id),
                child: Text(texts.processSerialAction),
              )
            : OutlinedButton(
                onPressed: () => context.pushDealerWarrantyActivation(order.id),
                child: Text(texts.processSerialAction),
              ),
      if (canCancel)
        TextButton(
          style: TextButton.styleFrom(
            foregroundColor: colors.error,
            minimumSize: const Size(0, 48),
            padding: const EdgeInsets.symmetric(horizontal: 14),
          ),
          onPressed: () => _confirmCancel(context, order),
          child: Text(texts.cancelOrderAction),
        ),
    ];

    return _StickyActionBar(actions: actions);
  }

  Widget _buildScreen(BuildContext context) {
    final texts = _orderDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    final order = OrderScope.of(context).findById(orderId);
    final cart = CartScope.of(context);
    final isTablet = AppBreakpoints.isTablet(context);
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;
    final canPop = Navigator.of(context).canPop();

    if (order == null) {
      return Scaffold(
        appBar: AppBar(
          title: BrandAppBarTitle(texts.screenTitle),
          leading: canPop
              ? null
              : IconButton(
                  tooltip: texts.backAction,
                  onPressed: () => _leaveOrderDetail(context),
                  icon: const Icon(Icons.arrow_back_rounded),
                ),
        ),
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: SectionCard(
                title: texts.screenTitle,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: colors.primaryContainer.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Icon(
                        Icons.receipt_long_outlined,
                        color: colors.onPrimaryContainer,
                        size: 28,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      texts.orderNotFoundMessage,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      texts.orderNotFoundDescription,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    final canProcessSerial = order.status == OrderStatus.completed;
    final canCancel =
        order.status == OrderStatus.pending ||
        order.status == OrderStatus.confirmed;
    final canConfirm = order.status == OrderStatus.pending;
    final canStartShipping = order.status == OrderStatus.confirmed;
    final canComplete = order.status == OrderStatus.shipping;
    final stickyActionBar = _buildStickyActionBar(
      context: context,
      order: order,
      cart: cart,
      canProcessSerial: canProcessSerial,
      canCancel: canCancel,
      canConfirm: canConfirm,
      canStartShipping: canStartShipping,
      canComplete: canComplete,
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
        title: BrandAppBarTitle(texts.screenTitle),
        leading: canPop
            ? null
            : IconButton(
                tooltip: texts.backAction,
                onPressed: () => _leaveOrderDetail(context),
                icon: const Icon(Icons.arrow_back_rounded),
              ),
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
                  title: texts.orderInfoTitle,
                  child: Column(
                    children: [
                      _InfoRow(
                        label: texts.orderIdLabel,
                        value: order.id,
                        onCopy: () {
                          Clipboard.setData(ClipboardData(text: order.id));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                texts.copiedOrderIdMessage(order.id),
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: texts.orderDateLabel,
                        value: formatDateTime(order.createdAt),
                      ),
                      const SizedBox(height: 8),
                      _InfoStatusRow(
                        label: texts.orderStatusRowLabel,
                        status: order.status,
                      ),
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: texts.paymentMethodRowLabel,
                        value: texts.paymentMethodLabel(
                          context,
                          order.paymentMethod,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _InfoPaymentStatusRow(
                        label: texts.paymentStatusRowLabel,
                        paymentStatus: order.paymentStatus,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              if (order.status == OrderStatus.shipping) ...[
                FadeSlideIn(
                  delay: const Duration(milliseconds: 40),
                  child: SectionCard(
                    title: texts.serialProcessingLockedTitle,
                    child: Text(
                      texts.serialProcessingLockedMessage,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
              ],
              if (order.carrier != null ||
                  order.trackingCode != null ||
                  order.shippedAt != null ||
                  order.deliveredAt != null) ...[
                FadeSlideIn(
                  delay: const Duration(milliseconds: 45),
                  child: SectionCard(
                    title: texts.fulfillmentInfoTitle,
                    child: Column(
                      children: [
                        _InfoRow(
                          label: texts.carrierLabel,
                          value: order.carrier ?? texts.notAvailableValue,
                        ),
                        const SizedBox(height: 8),
                        _InfoRow(
                          label: texts.trackingCodeLabel,
                          value: order.trackingCode ?? texts.notAvailableValue,
                        ),
                        const SizedBox(height: 8),
                        _InfoRow(
                          label: texts.shippedAtLabel,
                          value: order.shippedAt == null
                              ? texts.notAvailableValue
                              : formatDateTime(order.shippedAt!),
                        ),
                        if (order.deliveredAt != null) ...[
                          const SizedBox(height: 8),
                          _InfoRow(
                            label: texts.deliveredAtLabel,
                            value: formatDateTime(order.deliveredAt!),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
              ],
              if (order.status == OrderStatus.completed) ...[
                FadeSlideIn(
                  delay: const Duration(milliseconds: 50),
                  child: _OrderReturnOverviewSection(orderId: order.id),
                ),
                const SizedBox(height: 14),
              ],
              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: SectionCard(
                  title: texts.shippingInfoTitle,
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
                      if (order.note != null &&
                          order.note!.trim().isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: colors.surfaceContainerHighest.withValues(
                              alpha: 0.4,
                            ),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            texts.noteValue(order.note!),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: colors.onSurfaceVariant),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 120),
                child: SectionCard(
                  title: texts.productsTitle(order.totalItems),
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
                  title: texts.paymentTitle,
                  child: Column(
                    children: [
                      _InfoRow(
                        label: texts.subtotalLabel,
                        value: formatVnd(order.subtotal),
                      ),
                      if (order.discountAmount > 0) ...[
                        const SizedBox(height: 8),
                        _InfoRow(
                          label: texts.discountLabel(order.discountPercent),
                          value: '-${formatVnd(order.discountAmount)}',
                        ),
                        const SizedBox(height: 8),
                        _InfoRow(
                          label: texts.afterDiscountLabel,
                          value: formatVnd(order.totalAfterDiscount),
                        ),
                      ],
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: texts.vatLabel(order.vatPercent),
                        value: formatVnd(order.vatAmount),
                      ),
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: texts.paidAmountLabel,
                        value: formatVnd(order.paidAmount),
                      ),
                      if (order.outstandingAmount > 0) ...[
                        const SizedBox(height: 8),
                        _InfoRow(
                          label: texts.outstandingAmountLabel,
                          value: formatVnd(order.outstandingAmount),
                          isWarning: true,
                        ),
                      ],
                      const Divider(height: 20),
                      _InfoRow(
                        label: texts.totalLabel,
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
                    title: texts.paymentHistoryTitle,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          texts.totalRecordedLabel,
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
