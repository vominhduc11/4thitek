import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_settings_controller.dart';
import 'bank_transfer_support.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'dealer_navigation.dart';
import 'global_search.dart';
import 'models.dart';
import 'order_controller.dart';
import 'return_request_service.dart';
import 'return_request_ui_support.dart';
import 'upload_service.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

_OrderDetailTexts _orderDetailTexts(BuildContext context) => _OrderDetailTexts(
  isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
);

void _leaveOrderDetail(BuildContext context) {
  final navigator = Navigator.of(context);
  if (navigator.canPop()) {
    navigator.maybePop();
    return;
  }
  context.goToDealerOrders();
}

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  Widget _buildConfirmationSummary(
    BuildContext context,
    Order order,
    _OrderDetailTexts texts, {
    required String footerMessage,
    required Color footerColor,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(texts.orderCodeSummary(order.id)),
        const SizedBox(height: 4),
        Text(texts.totalAmountSummary(formatVnd(order.total))),
        const SizedBox(height: 4),
        Text(texts.itemCountSummary(order.totalItems)),
        const SizedBox(height: 8),
        Text(
          footerMessage,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: footerColor,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  void _confirmCancel(BuildContext context, Order order) {
    final texts = _orderDetailTexts(context);
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
              constraints: const BoxConstraints(maxWidth: 420),
              child: _buildConfirmationSummary(
                context,
                order,
                texts,
                footerMessage: texts.irreversibleWarning,
                footerColor: colors.error,
              ),
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
                    OrderStatus.cancelled,
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

  Future<void> _callReceiver(BuildContext context, String rawPhone) async {
    final texts = _orderDetailTexts(context);
    final normalized = rawPhone.replaceAll(RegExp(r'[^0-9+]'), '');
    final uri = Uri(scheme: 'tel', path: normalized);
    final launched = await launchUrl(uri);
    if (launched || !context.mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(texts.cannotOpenPhoneAppMessage)));
  }

  Future<void> _openAddressOnMap(BuildContext context, String address) async {
    final texts = _orderDetailTexts(context);
    final uri = Uri.https('www.google.com', '/maps/search/', {
      'api': '1',
      'query': address,
    });
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (launched || !context.mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(texts.cannotOpenMapAppMessage)));
  }

  Future<void> _reorder(
    BuildContext context,
    CartController cart,
    Order order,
  ) async {
    final texts = _orderDetailTexts(context);
    var addedCount = 0;
    final skipped = <String>[];

    for (final item in order.items) {
      final remaining = cart.remainingStockFor(item.product);
      if (remaining <= 0) {
        skipped.add(item.product.name);
        continue;
      }
      final qtyToAdd = item.quantity > remaining ? remaining : item.quantity;
      if (qtyToAdd <= 0) {
        skipped.add(item.product.name);
        continue;
      }
      final didAdd = await cart.add(item.product, quantity: qtyToAdd);
      if (didAdd) {
        addedCount++;
      } else {
        skipped.add(item.product.name);
      }
    }

    final String message;
    if (addedCount == 0) {
      message = texts.reorderNoneAddedMessage;
    } else if (skipped.isEmpty) {
      message = texts.reorderAllAddedMessage;
    } else {
      message = texts.reorderPartialAddedMessage(addedCount, skipped);
    }

    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        action: addedCount > 0
            ? SnackBarAction(
                label: texts.openCartAction,
                onPressed: () {
                  context.pushDealerCart();
                },
              )
            : null,
      ),
    );
  }

  Future<void> _copyToClipboard(
    BuildContext context,
    String label,
    String value,
  ) async {
    final texts = _orderDetailTexts(context);
    await Clipboard.setData(ClipboardData(text: value));
    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(texts.copiedLabelMessage(label))));
  }

  Future<void> _showBankTransferInstructions(
    BuildContext context,
    Order order,
  ) async {
    final texts = _orderDetailTexts(context);
    final service = BankTransferService();
    try {
      final instructions = await service.fetchInstructions();
      if (!context.mounted) {
        return;
      }
      await showBankTransferInfoSheet(
        context: context,
        instructions: instructions,
        amount: order.outstandingAmount > 0
            ? order.outstandingAmount
            : order.total,
        content: order.id,
        orderId: order.id,
        orderController: OrderScope.of(context),
        onCopy: (label, value) => _copyToClipboard(context, label, value),
      );
    } catch (error) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(texts.cannotLoadBankTransferMessage(error))),
      );
    } finally {
      service.close();
    }
  }

  void _showRecordPaymentDialog(BuildContext context, Order order) {
    final texts = _orderDetailTexts(context);
    final uploadService = UploadService();
    final amountController = TextEditingController();
    final proofController = TextEditingController();
    final channels = <String>[
      texts.bankTransferChannelValue,
      texts.cashChannelValue,
    ];
    var selectedChannel = order.paymentMethod == OrderPaymentMethod.bankTransfer
        ? channels.first
        : channels.last;
    String? errorText;
    String? pickedFileName;
    var isSubmitting = false;
    var isUploadingProof = false;
    final proofRequired =
        order.outstandingAmount >= _OrderDetailTexts.proofRequiredThreshold;

    showDialog<void>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (_, setDialogState) {
            return AlertDialog(
              scrollable: true,
              insetPadding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 20,
              ),
              title: Text(texts.recordPaymentTitle),
              content: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      texts.outstandingOrderSummary(
                        order.id,
                        formatVnd(order.outstandingAmount),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: amountController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        labelText: texts.amountLabel,
                        hintText: texts.amountHint(
                          formatVnd(order.outstandingAmount),
                        ),
                        errorText: errorText,
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: selectedChannel,
                      decoration: InputDecoration(
                        labelText: texts.paymentChannelLabel,
                      ),
                      items: channels
                          .map(
                            (channel) => DropdownMenuItem(
                              value: channel,
                              child: Text(texts.paymentChannelDisplay(channel)),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        if (value == null) {
                          return;
                        }
                        setDialogState(() => selectedChannel = value);
                      },
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: isSubmitting || isUploadingProof
                          ? null
                          : () async {
                              final picked = await ImagePicker().pickImage(
                                source: ImageSource.gallery,
                              );
                              if (picked == null || !dialogContext.mounted) {
                                return;
                              }
                              final messenger = ScaffoldMessenger.of(context);
                              messenger.hideCurrentSnackBar();
                              setDialogState(() {
                                errorText = null;
                                isUploadingProof = true;
                                pickedFileName = picked.name;
                              });
                              try {
                                final storedFileName = await uploadService
                                    .uploadXFile(
                                      file: picked,
                                      category: 'payment-proofs',
                                    )
                                    .then((value) => value.fileName);
                                if (!context.mounted) {
                                  return;
                                }
                                setDialogState(() {
                                  proofController.text = storedFileName;
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      texts.proofAttachedSuccess(picked.name),
                                    ),
                                  ),
                                );
                              } catch (error) {
                                if (!context.mounted) {
                                  return;
                                }
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      texts.proofUploadFailed(error),
                                    ),
                                  ),
                                );
                              } finally {
                                if (dialogContext.mounted) {
                                  setDialogState(
                                    () => isUploadingProof = false,
                                  );
                                }
                              }
                            },
                      icon: isUploadingProof
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.2,
                              ),
                            )
                          : const Icon(Icons.attach_file_outlined, size: 18),
                      label: Text(
                        isUploadingProof
                            ? texts.attachingProofLabel
                            : (pickedFileName ?? texts.attachProofButton),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (proofRequired) ...[
                      const SizedBox(height: 8),
                      Text(
                        texts.proofRequiredHint(
                          formatVnd(_OrderDetailTexts.proofRequiredThreshold),
                        ),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.error,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isSubmitting || isUploadingProof
                      ? null
                      : () => Navigator.of(dialogContext).pop(),
                  child: Text(texts.closeAction),
                ),
                FilledButton(
                  onPressed: isSubmitting || isUploadingProof
                      ? null
                      : () async {
                          final digitsOnly = amountController.text.replaceAll(
                            RegExp(r'[^0-9]'),
                            '',
                          );
                          final amount = int.tryParse(digitsOnly) ?? 0;
                          if (amount <= 0) {
                            setDialogState(() {
                              errorText = texts.invalidAmountMessage;
                            });
                            return;
                          }
                          if (amount > order.outstandingAmount) {
                            setDialogState(() {
                              errorText = texts.amountExceedsOutstandingMessage;
                            });
                            return;
                          }
                          if (proofRequired &&
                              proofController.text.trim().isEmpty) {
                            setDialogState(() {
                              errorText = texts
                                  .proofRequiredForLargeOutstandingMessage(
                                    formatVnd(
                                      _OrderDetailTexts.proofRequiredThreshold,
                                    ),
                                  );
                            });
                            return;
                          }

                          setDialogState(() {
                            errorText = null;
                            isSubmitting = true;
                          });
                          final orderController = OrderScope.of(context);
                          final success = await orderController.recordPayment(
                            orderId: order.id,
                            amount: amount,
                            channel: selectedChannel,
                            note: texts.recordPaymentScreenNote,
                            proofFileName: proofController.text.trim().isEmpty
                                ? null
                                : proofController.text.trim(),
                          );
                          if (!dialogContext.mounted || !context.mounted) {
                            return;
                          }
                          setDialogState(() => isSubmitting = false);
                          if (!success) {
                            setDialogState(() {
                              errorText = orderControllerErrorMessage(
                                orderController.lastActionMessage,
                                isEnglish: texts.isEnglish,
                              );
                            });
                            return;
                          }

                          Navigator.of(dialogContext).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                texts.paymentRecordedMessage(
                                  formatVnd(amount),
                                  order.id,
                                ),
                              ),
                            ),
                          );
                        },
                  child: isSubmitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2.4),
                        )
                      : Text(texts.recordAction),
                ),
              ],
            );
          },
        );
      },
    ).whenComplete(amountController.dispose);
  }

  Widget _buildStickyActionBar({
    required BuildContext context,
    required Order order,
    required CartController cart,
    required bool canProcessSerial,
    required bool canCancel,
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
    final paymentActionIsPrimary = canShowBankTransferInfo || canRecordPayment;
    final processSerialIsPrimary = !paymentActionIsPrimary && canProcessSerial;

    final actions = <Widget>[
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

  @override
  Widget build(BuildContext context) {
    return _OrderDetailRefreshBoundary(
      orderId: orderId,
      child: Builder(builder: _buildScreen),
    );
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
    final stickyActionBar = _buildStickyActionBar(
      context: context,
      order: order,
      cart: cart,
      canProcessSerial: canProcessSerial,
      canCancel: canCancel,
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

class _OrderDetailRefreshBoundary extends StatefulWidget {
  const _OrderDetailRefreshBoundary({
    required this.orderId,
    required this.child,
  });

  final String orderId;
  final Widget child;

  @override
  State<_OrderDetailRefreshBoundary> createState() =>
      _OrderDetailRefreshBoundaryState();
}

class _OrderDetailRefreshBoundaryState
    extends State<_OrderDetailRefreshBoundary> {
  @override
  void initState() {
    super.initState();
    _scheduleRefresh();
  }

  @override
  void didUpdateWidget(covariant _OrderDetailRefreshBoundary oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.orderId != widget.orderId) {
      _scheduleRefresh();
    }
  }

  void _scheduleRefresh() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      unawaited(OrderScope.of(context).refreshSingleOrder(widget.orderId));
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

class _OrderReturnOverviewSection extends StatefulWidget {
  const _OrderReturnOverviewSection({required this.orderId});

  final String orderId;

  @override
  State<_OrderReturnOverviewSection> createState() =>
      _OrderReturnOverviewSectionState();
}

class _OrderReturnOverviewSectionState
    extends State<_OrderReturnOverviewSection> {
  late final ReturnRequestService _returnService;
  bool _hasLoadedInitially = false;
  List<DealerReturnEligibilityRecord> _eligibilities =
      const <DealerReturnEligibilityRecord>[];
  final Map<int, DealerReturnRequestStatus> _activeStatusByRequestId =
      <int, DealerReturnRequestStatus>{};
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _returnService = ReturnRequestService();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_hasLoadedInitially) {
      return;
    }
    _hasLoadedInitially = true;
    unawaited(_load());
  }

  @override
  void dispose() {
    _returnService.close();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    final isEnglish = _orderDetailTexts(context).isEnglish;
    try {
      final orderController = OrderScope.of(context);
      await orderController.refreshSingleOrder(widget.orderId);
      final remoteOrderId = orderController.remoteOrderIdForOrderCode(
        widget.orderId,
      );
      if (remoteOrderId == null || remoteOrderId <= 0) {
        if (!mounted) {
          return;
        }
        setState(() {
          _errorMessage = isEnglish
              ? 'Unable to resolve this order for return eligibility.'
              : 'Khong the anh xa don hang de kiem tra doi tra.';
        });
        return;
      }

      final eligibility = await _returnService.fetchOrderEligibleSerials(
        remoteOrderId,
      );
      final activeRequestIds = eligibility
          .map((item) => item.activeRequestId)
          .whereType<int>()
          .toSet()
          .toList(growable: false);
      final statusMap = <int, DealerReturnRequestStatus>{};
      for (final requestId in activeRequestIds) {
        try {
          final detail = await _returnService.fetchDetail(requestId);
          statusMap[requestId] = detail.status;
        } on ReturnRequestException {
          // Keep reason from eligibility API if detail lookup fails.
        }
      }
      if (!mounted) {
        return;
      }
      setState(() {
        _eligibilities = eligibility;
        _activeStatusByRequestId
          ..clear()
          ..addAll(statusMap);
      });
    } on ReturnRequestException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = resolveReturnServiceMessage(
          error.message,
          isEnglish: isEnglish,
        );
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final texts = _orderDetailTexts(context);
    final eligibleCount = _eligibilities.where((item) => item.eligible).length;
    final activeCount = _eligibilities
        .where((item) => item.activeRequestId != null)
        .length;
    return SectionCard(
      title: texts.returnOverviewTitle,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else if (_errorMessage != null) ...[
            Text(
              _errorMessage!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.error,
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(onPressed: _load, child: Text(texts.retryAction)),
          ] else ...[
            Text(
              texts.returnOverviewSummary(
                eligibleCount,
                activeCount,
                _eligibilities.length,
              ),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: () =>
                      context.pushDealerCreateReturnRequest(widget.orderId),
                  icon: const Icon(Icons.assignment_return_outlined, size: 18),
                  label: Text(texts.createReturnAction),
                ),
              ],
            ),
            if (_eligibilities.isEmpty) ...[
              const SizedBox(height: 8),
              Text(texts.returnNoSerialsMessage),
            ] else ...[
              const SizedBox(height: 10),
              for (var index = 0; index < _eligibilities.length; index++) ...[
                _OrderReturnSerialTile(
                  eligibility: _eligibilities[index],
                  activeStatus: _eligibilities[index].activeRequestId == null
                      ? null
                      : _activeStatusByRequestId[_eligibilities[index]
                            .activeRequestId!],
                ),
                if (index != _eligibilities.length - 1)
                  const Divider(height: 14),
              ],
            ],
          ],
        ],
      ),
    );
  }
}

class _OrderReturnSerialTile extends StatelessWidget {
  const _OrderReturnSerialTile({
    required this.eligibility,
    required this.activeStatus,
  });

  final DealerReturnEligibilityRecord eligibility;
  final DealerReturnRequestStatus? activeStatus;

  @override
  Widget build(BuildContext context) {
    final texts = _orderDetailTexts(context);
    final productName = eligibility.productName ?? '-';
    final productSku = eligibility.productSku ?? '-';
    final statusText = activeStatus == null
        ? _eligibilityReasonText(eligibility, isEnglish: texts.isEnglish)
        : dealerReturnStatusLabel(activeStatus!, isEnglish: texts.isEnglish);
    final statusColor = activeStatus == null
        ? (eligibility.eligible
              ? Theme.of(context).colorScheme.tertiary
              : Theme.of(context).colorScheme.error)
        : dealerReturnStatusForeground(activeStatus!);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          eligibility.serial,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 2),
        Text(
          '$productName - $productSku',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          statusText,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: statusColor,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            if (eligibility.eligible)
              OutlinedButton(
                onPressed:
                    (eligibility.orderCode == null ||
                        eligibility.orderCode!.trim().isEmpty)
                    ? null
                    : () => context.pushDealerCreateReturnRequest(
                        eligibility.orderCode!,
                        prefilledSerialId: eligibility.serialId,
                      ),
                child: Text(texts.createReturnForSerialAction),
              ),
            if (eligibility.activeRequestId != null)
              OutlinedButton.icon(
                onPressed: () => context.pushDealerReturnDetail(
                  eligibility.activeRequestId!,
                ),
                icon: const Icon(Icons.open_in_new_rounded, size: 16),
                label: Text(texts.openReturnRequestAction),
              ),
          ],
        ),
      ],
    );
  }
}

String _eligibilityReasonText(
  DealerReturnEligibilityRecord eligibility, {
  required bool isEnglish,
}) {
  final reason = eligibility.reasonCode.trim().toUpperCase();
  switch (reason) {
    case 'ELIGIBLE':
      return isEnglish ? 'Eligible for return' : 'Du dieu kien doi tra';
    case 'ORDER_NOT_COMPLETED':
      return isEnglish
          ? 'Order is not completed yet.'
          : 'Don hang chua hoan tat.';
    case 'SERIAL_STATUS_NOT_ELIGIBLE':
      return isEnglish
          ? 'Serial status is not eligible for return.'
          : 'Trang thai serial khong cho phep doi tra.';
    case 'ACTIVE_RETURN_REQUEST_EXISTS':
      return isEnglish
          ? 'This serial already has an active return request.'
          : 'Serial nay da co yeu cau doi tra dang xu ly.';
    default:
      return eligibility.reasonMessage.isNotEmpty
          ? eligibility.reasonMessage
          : (isEnglish
                ? 'Eligibility unavailable.'
                : 'Khong xac dinh du dieu kien.');
  }
}

class _OrderDetailTexts {
  const _OrderDetailTexts({required this.isEnglish});

  final bool isEnglish;

  static const int proofRequiredThreshold = 10000000;

  String get screenTitle => isEnglish ? 'Order details' : 'Chi tiết đơn hàng';
  String get orderNotFoundMessage =>
      isEnglish ? 'Order not found.' : 'Không tìm thấy đơn hàng.';
  String get orderNotFoundDescription => isEnglish
      ? 'This order may have been removed or is no longer available in the current session.'
      : 'Đơn hàng này có thể đã bị xóa hoặc không còn khả dụng trong phiên làm việc hiện tại.';
  String get updateOrderStatusFailedMessage => isEnglish
      ? 'Unable to update the order status. Please try again.'
      : 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.';
  String get confirmCancelTitle =>
      isEnglish ? 'Confirm order cancellation' : 'Xác nhận hủy đơn';
  String orderCodeSummary(String orderId) =>
      isEnglish ? 'Order: #$orderId' : 'Đơn hàng: #$orderId';
  String totalAmountSummary(String amount) =>
      isEnglish ? 'Total amount: $amount' : 'Tổng tiền: $amount';
  String itemCountSummary(int count) =>
      isEnglish ? '$count items' : '$count sản phẩm';
  String get irreversibleWarning => isEnglish
      ? 'This action cannot be undone.'
      : 'Hành động này không thể hoàn tác.';
  String get noAction => isEnglish ? 'No' : 'Không';
  String get cancelOrderAction => isEnglish ? 'Cancel order' : 'Hủy đơn';
  String get confirmReceivedTitle =>
      isEnglish ? 'Confirm delivery received' : 'Xác nhận đã nhận hàng';
  String get paymentWillBeMarkedCompleteMessage => isEnglish
      ? 'Payment will be marked complete for this order.'
      : 'Thanh toán sẽ được đánh dấu hoàn tất cho đơn hàng này.';
  String get confirmAction => isEnglish ? 'Confirm' : 'Xác nhận';
  String get confirmReceivedAction =>
      isEnglish ? 'Confirm received' : 'Xác nhận đã nhận hàng';
  String get cannotOpenPhoneAppMessage => isEnglish
      ? 'Unable to open the phone app on this device.'
      : 'Không thể mở ứng dụng gọi điện trên thiết bị này.';
  String get cannotOpenMapAppMessage => isEnglish
      ? 'Unable to open the map application.'
      : 'Không thể mở ứng dụng bản đồ.';
  String get reorderNoneAddedMessage => isEnglish
      ? 'No products were added to the cart because they are out of stock.'
      : 'Không có sản phẩm nào được thêm vào giỏ vì đã hết hàng.';
  String get reorderAllAddedMessage => isEnglish
      ? 'All products were added to the cart.'
      : 'Đã thêm tất cả sản phẩm vào giỏ hàng.';
  String reorderPartialAddedMessage(int addedCount, List<String> skipped) =>
      isEnglish
      ? 'Added $addedCount products. Skipped: ${skipped.join(', ')} (out of stock or over stock limit).'
      : 'Đã thêm $addedCount sản phẩm. Bỏ qua: ${skipped.join(', ')} (hết hàng hoặc vượt tồn kho).';
  String get openCartAction => isEnglish ? 'Open cart' : 'Mở giỏ hàng';
  String copiedLabelMessage(String label) =>
      isEnglish ? 'Copied $label' : 'Đã sao chép $label';
  String cannotLoadBankTransferMessage(Object error) => isEnglish
      ? bankTransferLoadErrorMessage(error, isEnglish: true)
      : bankTransferLoadErrorMessage(error, isEnglish: false);
  String get recordPaymentTitle =>
      isEnglish ? 'Record payment' : 'Ghi nhận thanh toán';
  String outstandingOrderSummary(String orderId, String amount) => isEnglish
      ? 'Order $orderId has an outstanding amount of $amount'
      : 'Đơn $orderId còn nợ $amount';
  String get amountLabel => isEnglish ? 'Amount' : 'Số tiền';
  String amountHint(String maxAmount) =>
      isEnglish ? 'Maximum $maxAmount' : 'Tối đa $maxAmount';
  String get paymentChannelLabel =>
      isEnglish ? 'Payment channel' : 'Kênh thanh toán';
  String get attachProofButton =>
      isEnglish ? 'Attach payment proof' : 'Đính kèm chứng từ';
  String get attachingProofLabel =>
      isEnglish ? 'Uploading proof...' : 'Đang tải chứng từ...';
  String get closeAction => isEnglish ? 'Close' : 'Đóng';
  String get backAction => isEnglish ? 'Back' : 'Quay lại';
  String get invalidAmountMessage =>
      isEnglish ? 'Invalid amount.' : 'Số tiền không hợp lệ.';
  String get amountExceedsOutstandingMessage => isEnglish
      ? 'The amount exceeds the remaining outstanding balance.'
      : 'Số tiền vượt quá số dư cần thanh toán còn lại.';
  String get recordPaymentScreenNote => isEnglish
      ? 'Recorded from the order detail screen.'
      : 'Ghi nhận từ màn hình chi tiết đơn hàng.';
  String proofRequiredHint(String threshold) => isEnglish
      ? 'Proof is required for orders with outstanding amount from $threshold.'
      : 'Bắt buộc đính kèm chứng từ khi đơn còn nợ từ $threshold.';
  String proofRequiredForLargeOutstandingMessage(String threshold) => isEnglish
      ? 'Attach payment proof before recording this payment. Required from $threshold outstanding.'
      : 'Vui lòng đính kèm chứng từ trước khi ghi nhận thanh toán. Áp dụng khi còn nợ từ $threshold.';
  String proofAttachedSuccess(String fileName) => isEnglish
      ? 'Attached proof $fileName.'
      : 'Đã đính kèm chứng từ $fileName.';
  String proofUploadFailed(Object error) =>
      uploadServiceErrorMessage(error, isEnglish: isEnglish);
  String get cannotRecordPaymentMessage => isEnglish
      ? 'Unable to record the payment. Please check again.'
      : 'Không thể ghi nhận thanh toán. Vui lòng kiểm tra lại.';
  String paymentRecordedMessage(String amount, String orderId) => isEnglish
      ? 'Recorded $amount for order $orderId.'
      : 'Đã ghi nhận $amount cho đơn $orderId.';
  String get recordAction => isEnglish ? 'Record' : 'Ghi nhận';
  String get reorderAction => isEnglish ? 'Reorder' : 'Đặt lại đơn cũ';
  String get bankTransferInfoAction =>
      isEnglish ? 'Bank transfer info' : 'Thông tin chuyển khoản';
  String get recordPaymentAction =>
      isEnglish ? 'Record payment' : 'Ghi nhận thanh toán';
  String get processSerialAction =>
      isEnglish ? 'Process serials' : 'Xử lý serial';
  String get createReturnAction =>
      isEnglish ? 'Create return request' : 'Tạo yêu cầu đổi trả';
  String get createReturnForSerialAction =>
      isEnglish ? 'Create for this serial' : 'Tạo cho serial này';
  String get openReturnRequestAction =>
      isEnglish ? 'Open return request' : 'Mở yêu cầu đổi trả';
  String get returnOverviewTitle =>
      isEnglish ? 'Return eligibility' : 'Điều kiện đổi trả';
  String returnOverviewSummary(int eligibleCount, int activeCount, int total) =>
      isEnglish
      ? '$eligibleCount of $total serial(s) are eligible. $activeCount serial(s) already have active return requests.'
      : '$eligibleCount/$total serial đủ điều kiện. $activeCount serial đã có yêu cầu đang xử lý.';
  String get returnNoSerialsMessage => isEnglish
      ? 'No serials found for this order.'
      : 'Không tìm thấy serial cho đơn hàng này.';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get serialProcessingLockedTitle => isEnglish
      ? 'Serial processing is almost ready'
      : 'Xử lý serial sắp khả dụng';
  String get serialProcessingLockedMessage => isEnglish
      ? 'This order is already shipping, but serial processing only opens after the order reaches completed status.'
      : 'Đơn hàng đang giao, nhưng chỉ có thể xử lý serial sau khi đơn chuyển sang trạng thái hoàn thành.';
  String get orderInfoTitle =>
      isEnglish ? 'Order information' : 'Thông tin đơn';
  String get orderIdLabel => isEnglish ? 'Order ID' : 'Mã đơn';
  String copiedOrderIdMessage(String orderId) =>
      isEnglish ? 'Copied order ID $orderId' : 'Đã sao chép mã đơn $orderId';
  String get orderDateLabel => isEnglish ? 'Order date' : 'Ngày đặt';
  String get orderStatusRowLabel =>
      isEnglish ? 'Order status' : 'Trạng thái đơn';
  String get paymentMethodRowLabel =>
      isEnglish ? 'Payment method' : 'Phương thức thanh toán';
  String get paymentStatusRowLabel =>
      isEnglish ? 'Payment status' : 'Trạng thái thanh toán';
  String get shippingInfoTitle =>
      isEnglish ? 'Shipping information' : 'Thông tin nhận hàng';
  String noteValue(String note) => isEnglish ? 'Note: $note' : 'Ghi chú: $note';
  String productsTitle(int count) =>
      isEnglish ? 'Products ($count)' : 'Sản phẩm ($count)';
  String get paymentTitle => isEnglish ? 'Payment' : 'Thanh toán';
  String get subtotalLabel => isEnglish ? 'Subtotal' : 'Tạm tính';
  String discountLabel(int percent) =>
      isEnglish ? 'Discount ($percent%)' : 'Chiết khấu ($percent%)';
  String get afterDiscountLabel =>
      isEnglish ? 'After discount' : 'Sau chiết khấu';
  String vatLabel(int percent) =>
      isEnglish ? 'VAT ($percent%)' : 'VAT ($percent%)';
  String get paidAmountLabel => isEnglish ? 'Paid amount' : 'Đã thanh toán';
  String get outstandingAmountLabel =>
      isEnglish ? 'Outstanding' : 'Còn phải thanh toán';
  String get totalLabel => isEnglish ? 'Total' : 'Tổng cộng';
  String get paymentHistoryTitle =>
      isEnglish ? 'Payment history' : 'Lịch sử thanh toán';
  String get totalRecordedLabel =>
      isEnglish ? 'Total recorded' : 'Tổng đã ghi nhận';
  String get copyTooltip => isEnglish ? 'Copy' : 'Sao chép';

  String orderStatusLabel(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return isEnglish ? 'Pending' : 'Chờ xử lý';
      case OrderStatus.confirmed:
        return isEnglish ? 'Confirmed' : 'Đã xác nhận';
      case OrderStatus.shipping:
        return isEnglish ? 'Shipping' : 'Đang giao';
      case OrderStatus.completed:
        return isEnglish ? 'Completed' : 'Hoàn thành';
      case OrderStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
    }
  }

  String paymentMethodLabel(BuildContext context, OrderPaymentMethod method) =>
      method.localizedLabel(context);

  String orderPaymentStatusLabel(OrderPaymentStatus status) {
    switch (status) {
      case OrderPaymentStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
      case OrderPaymentStatus.pending:
        return isEnglish ? 'Unpaid' : 'Chưa thanh toán';
      case OrderPaymentStatus.paid:
        return isEnglish ? 'Paid' : 'Đã thanh toán';
    }
  }

  String get bankTransferChannelValue => 'Chuyển khoản';
  String get cashChannelValue => 'Tiền mặt';

  String paymentChannelDisplay(String value) {
    final normalized = value.trim().toLowerCase();
    if (normalized.contains('chuyển khoản') ||
        normalized.contains('transfer') ||
        normalized.contains('bank')) {
      return isEnglish ? 'Bank transfer' : 'Chuyển khoản';
    }
    if (normalized.contains('tiền mặt') || normalized.contains('cash')) {
      return isEnglish ? 'Cash' : 'Tiền mặt';
    }
    return value;
  }
}

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
    final style = Theme.of(context).textTheme.bodyMedium;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: style)),
        const SizedBox(width: 16),
        _StatusChip(status: status),
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
    final style = Theme.of(context).textTheme.bodyMedium;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: style)),
        const SizedBox(width: 16),
        _PaymentStatusChip(paymentStatus: paymentStatus),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final OrderStatus status;

  @override
  Widget build(BuildContext context) {
    final texts = _orderDetailTexts(context);
    final background = _backgroundForStatus(status);
    final textColor = _textForStatus(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.28)),
      ),
      child: Text(
        texts.orderStatusLabel(status),
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}

class _PaymentStatusChip extends StatelessWidget {
  const _PaymentStatusChip({required this.paymentStatus});

  final OrderPaymentStatus paymentStatus;

  @override
  Widget build(BuildContext context) {
    final texts = _orderDetailTexts(context);
    final background = _paymentStatusBackground(paymentStatus);
    final textColor = _paymentStatusTextColor(paymentStatus);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: textColor.withValues(alpha: 0.28)),
      ),
      child: Text(
        texts.orderPaymentStatusLabel(paymentStatus),
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }
}

Color _backgroundForStatus(OrderStatus status) {
  switch (status) {
    case OrderStatus.pending:
      return const Color(0xFF4C3B16);
    case OrderStatus.confirmed:
      return const Color(0xFF1E3150);
    case OrderStatus.shipping:
      return const Color(0xFF154052);
    case OrderStatus.completed:
      return const Color(0xFF1A3F2D);
    case OrderStatus.cancelled:
      return const Color(0xFF2A3642);
  }
}

Color _textForStatus(OrderStatus status) {
  switch (status) {
    case OrderStatus.pending:
      return const Color(0xFFF4D18A);
    case OrderStatus.confirmed:
      return const Color(0xFF93C5FD);
    case OrderStatus.shipping:
      return const Color(0xFF7DD3FC);
    case OrderStatus.completed:
      return const Color(0xFF86EFAC);
    case OrderStatus.cancelled:
      return const Color(0xFFCBD5E1);
  }
}

Color _paymentStatusBackground(OrderPaymentStatus status) {
  switch (status) {
    case OrderPaymentStatus.cancelled:
      return const Color(0xFF3B1F26);
    case OrderPaymentStatus.pending:
      return const Color(0xFF4A1E24);
    case OrderPaymentStatus.paid:
      return const Color(0xFF1A3F2D);
  }
}

Color _paymentStatusTextColor(OrderPaymentStatus status) {
  switch (status) {
    case OrderPaymentStatus.cancelled:
      return const Color(0xFFFDA4AF);
    case OrderPaymentStatus.pending:
      return const Color(0xFFFDA4AF);
    case OrderPaymentStatus.paid:
      return const Color(0xFF86EFAC);
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
