// ignore_for_file: invalid_use_of_protected_member

part of 'checkout_screen.dart';

extension _CheckoutScreenSubmit on _CheckoutScreenState {
  List<String> _missingProfileFields(_CheckoutTexts texts) {
    final fields = <String>[];
    if (_profile.businessName.trim().isEmpty) {
      fields.add(texts.businessNameFieldLabel);
    }
    if (_profile.contactName.trim().isEmpty) {
      fields.add(texts.contactNameFieldLabel);
    }
    if (_profile.phone.trim().isEmpty) {
      fields.add(texts.phoneFieldLabel);
    }
    if (_profile.shippingAddress.trim().isEmpty) {
      fields.add(texts.shippingAddressFieldLabel);
    }
    return fields;
  }

  CheckoutValidationService _buildCheckoutValidationService() {
    return CheckoutValidationService(
      localDataSource: LocalCheckoutValidationDataSource(
        productCatalog: ProductCatalogScope.maybeOf(context),
      ),
    );
  }

  CheckoutValidationRequest _buildCheckoutValidationRequest({
    required CartController cart,
  }) {
    return CheckoutValidationRequest(
      items: cart.items
          .map(
            (item) => CheckoutValidationItem(
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: item.product.price,
            ),
          )
          .toList(growable: false),
      paymentMethod: _method,
      isCartSyncing: cart.isSyncing,
    );
  }

  Future<bool> _handleValidationResult(CheckoutValidationResult result) async {
    if (!result.hasIssues) {
      return true;
    }

    final dialogIssues = result.issues
        .where(
          (issue) =>
              issue.code == CheckoutValidationIssueCode.cartSyncInProgress ||
              issue.code == CheckoutValidationIssueCode.outOfStock ||
              issue.code == CheckoutValidationIssueCode.insufficientStock,
        )
        .map(_validationMessageForIssue)
        .toList(growable: false);
    if (dialogIssues.isNotEmpty) {
      await _showValidationDialog(context, dialogIssues);
      return false;
    }

    return true;
  }

  String _validationMessageForIssue(CheckoutValidationIssue issue) {
    final texts = _texts;
    switch (issue.code) {
      case CheckoutValidationIssueCode.cartSyncInProgress:
        return texts.cartSyncInProgressMessage;
      case CheckoutValidationIssueCode.outOfStock:
        return texts.outOfStockIssue(issue.productName ?? '');
      case CheckoutValidationIssueCode.insufficientStock:
        return texts.stockIssue(
          issue.productName ?? '',
          issue.availableStock ?? 0,
        );
    }
  }

  Future<void> _placeOrder({
    required CartController cart,
    required OrderController orderController,
    BankTransferInstructions? bankTransferInstructions,
  }) async {
    final isBankTransfer = _method == OrderPaymentMethod.bankTransfer;
    final order = Order(
      // Let the backend assign the production order code.
      id: '',
      createdAt: DateTime.now(),
      status: OrderStatus.pending,
      paymentMethod: _method,
      paymentStatus: _previewPaymentStatus,
      receiverName: _profile.businessName,
      receiverAddress: _profile.shippingAddress,
      receiverPhone: _profile.phone,
      items: cart.items
          .map(
            (item) =>
                OrderLineItem(product: item.product, quantity: item.quantity),
          )
          .toList(growable: false),
      paidAmount: 0,
      note: _orderNoteController.text.trim().isEmpty
          ? null
          : _orderNoteController.text.trim(),
    );
    final createdOrder = await orderController.addOrder(order);
    if (!mounted) {
      return;
    }

    if (isBankTransfer && bankTransferInstructions != null) {
      await showBankTransferInfoSheet(
        context: context,
        instructions: bankTransferInstructions,
        amount: createdOrder.total,
        content: createdOrder.id,
        orderId: createdOrder.id,
        orderController: orderController,
        onCopy: _copyToClipboard,
      );
      if (!mounted) {
        return;
      }
    }

    final shouldOpenOrderDetail =
        orderController.findById(createdOrder.id)?.paymentStatus ==
        OrderPaymentStatus.paid;

    await cart.clear(rollbackOnFailure: false);
    if (!mounted) {
      return;
    }

    HapticFeedback.mediumImpact();
    if (shouldOpenOrderDetail) {
      context.goDealerOrderDetail(createdOrder.id);
      return;
    }
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => OrderSuccessScreen(
          orderId: createdOrder.id,
          itemCount: createdOrder.totalItems,
          totalPrice: createdOrder.total,
        ),
      ),
    );
  }

  Future<void> _showValidationDialog(
    BuildContext context,
    List<String> issues,
  ) async {
    final texts = _texts;
    await showDialog<void>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          scrollable: true,
          insetPadding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 20,
          ),
          title: Text(texts.validationDialogTitle),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 460),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(texts.validationDialogSubtitle),
                const SizedBox(height: 10),
                ...issues.map(
                  (issue) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('- '),
                        Expanded(child: Text(issue)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(texts.closeAction),
            ),
          ],
        );
      },
    );
  }
}
