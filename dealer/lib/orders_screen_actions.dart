// ignore_for_file: invalid_use_of_protected_member

part of 'orders_screen.dart';

extension _OrdersScreenActions on _OrdersScreenState {
  void _confirmCancel(BuildContext context, Order order) {
    final texts = _ordersTexts(context);
    showDialog<void>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        final colors = Theme.of(context).colorScheme;
        return RepaintBoundary(
          child: AlertDialog(
            scrollable: true,
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 20,
            ),
            title: Text(texts.confirmCancelTitle),
            content: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Text(texts.confirmCancelDescription(order.id)),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: Text(texts.noAction),
              ),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: colors.errorContainer,
                  foregroundColor: colors.onErrorContainer,
                ),
                onPressed: () async {
                  Navigator.of(dialogContext).pop();
                  final orderController = OrderScope.of(context);
                  final success = await orderController.updateOrderStatus(
                    order.id,
                    OrderStatus.cancelRequested,
                  );
                  if (!context.mounted || success) {
                    return;
                  }
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        orderControllerErrorMessage(
                          orderController.lastActionMessage,
                          isEnglish: texts.isEnglish,
                        ),
                      ),
                    ),
                  );
                },
                child: Text(texts.cancelOrderAction),
              ),
            ],
          ),
        );
      },
    );
  }

  void _openOrderDetail(BuildContext context, String orderId) {
    context.pushDealerOrderDetail(orderId);
  }

  void _openCreateOrder(BuildContext context) {
    if (widget.onSwitchTab != null) {
      widget.onSwitchTab!(0);
      return;
    }
    context.pushDealerProducts();
  }

  void _openFilterSheet(
    BuildContext context, {
    required _OrdersTexts texts,
    required List<OrderStatus?> statusFilters,
    required List<OrderPaymentStatus?> paymentFilters,
  }) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => _OrdersFilterSheet(
        texts: texts,
        initialQuery: _query,
        statusFilters: statusFilters,
        paymentFilters: paymentFilters,
        onApply: (pending) {
          if (!mounted) return;
          setState(() => _query = pending);
          _refreshOrders();
        },
        onClear: _clearAllCriteria,
      ),
    );
  }

  Widget _buildFilterChips<T>({
    required BuildContext context,
    required String label,
    required List<T?> options,
    required T? selected,
    required ValueChanged<T?> onSelected,
    required String Function(T?) labelFor,
    required bool useWrapLayout,
  }) {
    final colors = Theme.of(context).colorScheme;
    final labelStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
      color: colors.onSurfaceVariant,
      fontWeight: FontWeight.w600,
    );
    final chips = options.map((option) {
      final isSelected = selected == option;
      return FilterChip(
        label: Text(labelFor(option)),
        selected: isSelected,
        onSelected: (_) => onSelected(option),
        showCheckmark: false,
        side: BorderSide(
          color: isSelected
              ? colors.primary.withValues(alpha: 0.35)
              : colors.outlineVariant.withValues(alpha: 0.45),
        ),
        backgroundColor: colors.surface.withValues(alpha: 0.72),
        selectedColor: colors.primaryContainer.withValues(alpha: 0.9),
        labelStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
          fontWeight: FontWeight.w600,
          color: isSelected
              ? colors.onPrimaryContainer
              : colors.onSurfaceVariant,
        ),
        visualDensity: const VisualDensity(horizontal: -1, vertical: -1),
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      );
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: labelStyle),
        const SizedBox(height: 8),
        if (useWrapLayout)
          Wrap(spacing: 8, runSpacing: 8, children: chips)
        else
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: chips.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, index) => chips[index],
            ),
          ),
      ],
    );
  }
}
