part of 'order_detail_screen.dart';

extension _OrderDetailScreenActions on OrderDetailScreen {
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
        String? selectedReason;
        String? reasonError;
        return StatefulBuilder(
          builder: (ctx, setState) {
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
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildConfirmationSummary(
                        context,
                        order,
                        texts,
                        footerMessage: texts.irreversibleWarning,
                        footerColor: colors.error,
                      ),
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        initialValue: selectedReason,
                        decoration: InputDecoration(
                          labelText: texts.cancelReasonLabel,
                          errorText: reasonError,
                          border: const OutlineInputBorder(),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                        ),
                        hint: Text(
                          texts.cancelReasonPlaceholder,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: colors.outline),
                        ),
                        items: texts.cancelReasonOptions
                            .map(
                              (r) => DropdownMenuItem(value: r, child: Text(r)),
                            )
                            .toList(),
                        onChanged: (value) {
                          setState(() {
                            selectedReason = value;
                            reasonError = null;
                          });
                        },
                      ),
                    ],
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
                      if (selectedReason == null) {
                        setState(() {
                          reasonError = texts.cancelReasonRequired;
                        });
                        return;
                      }
                      Navigator.of(dialogContext).pop();
                      final orderController = OrderScope.of(context);
                      final success = await orderController.updateOrderStatus(
                        order.id,
                        OrderStatus.cancelRequested,
                        cancelReason: selectedReason,
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

  Future<void> _updateOrderStatus(
    BuildContext context,
    Order order,
    OrderStatus newStatus,
  ) async {
    final texts = _orderDetailTexts(context);
    final orderController = OrderScope.of(context);
    final success = await orderController.updateOrderStatus(
      order.id,
      newStatus,
    );
    if (!context.mounted || success) return;
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
  }
}
