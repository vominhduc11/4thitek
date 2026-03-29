import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'account_settings_screen.dart';
import 'app_settings_controller.dart';
import 'bank_transfer_support.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'checkout_validation_service.dart';
import 'dealer_profile_storage.dart';
import 'global_search.dart';
import 'models.dart';
import 'order_controller.dart';
import 'order_success_screen.dart';
import 'product_catalog_controller.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/product_image.dart';
import 'widgets/section_card.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  OrderPaymentMethod _method = OrderPaymentMethod.bankTransfer;
  DealerProfile _profile = DealerProfile.defaults;
  final TextEditingController _orderNoteController = TextEditingController();
  late final BankTransferService _bankTransferService;
  BankTransferInstructions? _bankTransferInstructions;
  bool _isLoadingProfile = true;
  bool _isSubmitting = false;
  bool _isLoadingBankTransferInstructions = false;
  bool _isEnglish = false;
  String? _profileLoadError;

  _CheckoutTexts get _texts => _CheckoutTexts(isEnglish: _isEnglish);

  bool get _canUseDebtPayment => _profile.creditLimit > 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
  }

  @override
  void initState() {
    super.initState();
    _bankTransferService = BankTransferService();
    _loadDealerProfile();
    _loadBankTransferInstructions();
  }

  @override
  void dispose() {
    _bankTransferService.close();
    _orderNoteController.dispose();
    super.dispose();
  }

  OrderPaymentStatus get _previewPaymentStatus {
    switch (_method) {
      case OrderPaymentMethod.bankTransfer:
        return OrderPaymentStatus.pending;
      case OrderPaymentMethod.debt:
        return OrderPaymentStatus.debtRecorded;
    }
  }

  String get _primaryActionLabel {
    final texts = _texts;
    if (_method == OrderPaymentMethod.bankTransfer) {
      return texts.primaryActionBankTransfer;
    }
    return texts.primaryActionConfirmOrder;
  }

  Future<void> _loadDealerProfile({bool showFailureSnackBar = false}) async {
    if (mounted) {
      setState(() {
        _isLoadingProfile = true;
        _profileLoadError = null;
      });
    }
    try {
      final profile = await loadDealerProfile();
      if (!mounted) {
        return;
      }
      final canUseDebtPayment = profile.creditLimit > 0;
      setState(() {
        _profile = profile;
        _isLoadingProfile = false;
        _profileLoadError = null;
        if (!canUseDebtPayment && _method == OrderPaymentMethod.debt) {
          _method = OrderPaymentMethod.bankTransfer;
        }
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      final message = _texts.profileLoadFailedMessage;
      setState(() {
        _isLoadingProfile = false;
        _profileLoadError = message;
      });
      if (showFailureSnackBar) {
        _showSnackBar(message);
      }
    }
  }

  Future<void> _openAccountSettings() async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const AccountSettingsScreen()));
    await _loadDealerProfile(showFailureSnackBar: true);
  }

  Future<void> _loadBankTransferInstructions({bool showError = false}) async {
    if (_isLoadingBankTransferInstructions) {
      return;
    }
    if (mounted) {
      setState(() => _isLoadingBankTransferInstructions = true);
    }
    try {
      final instructions = await _bankTransferService.fetchInstructions();
      if (!mounted) {
        return;
      }
      setState(() => _bankTransferInstructions = instructions);
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _bankTransferInstructions = null);
      if (showError) {
        _showSnackBar(_texts.cannotLoadBankTransferMessage(error));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingBankTransferInstructions = false);
      }
    }
  }

  Future<BankTransferInstructions?> _ensureBankTransferInstructions() async {
    if (_bankTransferInstructions != null) {
      return _bankTransferInstructions;
    }
    await _loadBankTransferInstructions(showError: true);
    return _bankTransferInstructions;
  }

  Future<void> _copyToClipboard(String label, String value) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!mounted) {
      return;
    }
    _showSnackBar(_texts.copiedLabelMessage(label));
  }

  void _showSnackBar(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final texts = _texts;
    final colors = Theme.of(context).colorScheme;
    final cart = CartScope.of(context);
    final orderController = OrderScope.of(context);
    final isTablet = AppBreakpoints.isTablet(context);
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;
    final subtotal = cart.subtotal;
    final discountPercent = cart.discountPercent;
    final discountAmount = cart.discountAmount;
    final totalAfterDiscount = cart.totalAfterDiscount;
    final vatAmount = cart.vatAmount;
    final total = cart.total;

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(texts.screenTitle),
        actions: const [GlobalSearchIconButton()],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              FadeSlideIn(
                child: SectionCard(
                  title: texts.shippingInfoTitle,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: _openAccountSettings,
                          icon: const Icon(Icons.edit_outlined, size: 18),
                          label: Text(texts.editShippingInfoAction),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _profile.businessName,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        texts.contactPersonLine(_profile.contactName),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _profile.shippingAddress,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        texts.phoneLine(_profile.phone),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: SectionCard(
                  title: texts.paymentMethodTitle,
                  child: _isLoadingProfile
                      ? Row(
                          children: [
                            const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Text(texts.loadingProfileMessage)),
                          ],
                        )
                      : _profileLoadError != null
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _profileLoadError!,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(color: colors.error),
                            ),
                            const SizedBox(height: 12),
                            TextButton.icon(
                              onPressed: _isSubmitting
                                  ? null
                                  : () => _loadDealerProfile(
                                      showFailureSnackBar: true,
                                    ),
                              icon: const Icon(Icons.refresh_outlined),
                              label: Text(texts.retryAction),
                            ),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            RadioGroup<OrderPaymentMethod>(
                              groupValue: _method,
                              onChanged: (value) {
                                if (value == null) {
                                  return;
                                }
                                setState(() => _method = value);
                                if (value == OrderPaymentMethod.bankTransfer &&
                                    _bankTransferInstructions == null &&
                                    !_isLoadingBankTransferInstructions) {
                                  _loadBankTransferInstructions();
                                }
                              },
                              child: Column(
                                children: [
                                  RadioListTile<OrderPaymentMethod>(
                                    value: OrderPaymentMethod.bankTransfer,
                                    title: Text(texts.bankTransferTitle),
                                    subtitle: Text(texts.bankTransferSubtitle),
                                  ),
                                  RadioListTile<OrderPaymentMethod>(
                                    value: OrderPaymentMethod.debt,
                                    enabled: _canUseDebtPayment,
                                    title: Text(texts.debtPaymentTitle),
                                    subtitle: Text(
                                      _canUseDebtPayment
                                          ? texts.remainingCreditLimitLabel(
                                              formatVnd(
                                                (_profile.creditLimit -
                                                        orderController
                                                            .totalOutstandingDebt)
                                                    .clamp(
                                                      0,
                                                      _profile.creditLimit,
                                                    ),
                                              ),
                                              formatVnd(_profile.creditLimit),
                                            )
                                          : texts.debtLimitRequiredMessage,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (_method == OrderPaymentMethod.debt) ...[
                              const SizedBox(height: 12),
                              Text(
                                texts.debtPrecheckHint,
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(
                                      color: colors.onSurfaceVariant,
                                      fontStyle: FontStyle.italic,
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
                  title: texts.productsInOrderTitle(cart.totalItems),
                  child: Theme(
                    data: Theme.of(
                      context,
                    ).copyWith(dividerColor: Colors.transparent),
                    child: ExpansionTile(
                      tilePadding: EdgeInsets.zero,
                      childrenPadding: const EdgeInsets.only(top: 8),
                      initiallyExpanded: cart.items.length <= 3,
                      title: Text(
                        texts.productLineCount(cart.items.length),
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      subtitle: Text(
                        texts.expandProductsHint,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                      children: [
                        for (var i = 0; i < cart.items.length; i++) ...[
                          _CheckoutItemRow(item: cart.items[i]),
                          if (i != cart.items.length - 1)
                            const Divider(height: 18),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 160),
                child: SectionCard(
                  title: texts.orderNoteTitle,
                  child: TextField(
                    controller: _orderNoteController,
                    maxLines: 3,
                    minLines: 2,
                    maxLength: 200,
                    decoration: InputDecoration(
                      hintText: texts.orderNoteHint,
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 200),
                child: SectionCard(
                  title: texts.orderSummaryTitle,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _SummaryRow(
                        label: texts.itemCountLabel,
                        value: '${cart.totalItems}',
                      ),
                      const SizedBox(height: 8),
                      _SummaryRow(
                        label: texts.subtotalLabel,
                        value: formatVnd(subtotal),
                      ),
                      if (discountAmount > 0) ...[
                        const SizedBox(height: 8),
                        _SummaryRow(
                          label: texts.discountLabel(discountPercent),
                          value: '-${formatVnd(discountAmount)}',
                        ),
                        const SizedBox(height: 8),
                        _SummaryRow(
                          label: texts.afterDiscountLabel,
                          value: formatVnd(totalAfterDiscount),
                        ),
                      ],
                      const SizedBox(height: 8),
                      _SummaryRow(
                        label: texts.vatLabel(cart.vatPercent),
                        value: formatVnd(vatAmount),
                      ),
                      const SizedBox(height: 8),
                      _SummaryRow(
                        label: texts.paymentStatusLabelTitle,
                        value: texts.paymentStatusLabel(_previewPaymentStatus),
                      ),
                      if (_method == OrderPaymentMethod.bankTransfer) ...[
                        const SizedBox(height: 8),
                        Text(
                          texts.bankTransferSummaryHint,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        if (_isLoadingBankTransferInstructions) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  texts.loadingBankTransferMessage,
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                ),
                              ),
                            ],
                          ),
                        ] else if (_bankTransferInstructions == null) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  texts.bankTransferUnavailableMessage,
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(color: colors.error),
                                ),
                              ),
                              TextButton(
                                onPressed: _isSubmitting
                                    ? null
                                    : () => _loadBankTransferInstructions(
                                        showError: true,
                                      ),
                                child: Text(texts.retryAction),
                              ),
                            ],
                          ),
                        ],
                      ],
                      const Divider(height: 20),
                      _SummaryRow(
                        label: texts.totalLabel,
                        value: formatVnd(total),
                        isEmphasis: true,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        texts.pricingNote,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                          fontStyle: FontStyle.italic,
                        ),
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
                    onPressed:
                        cart.isEmpty ||
                            _isSubmitting ||
                            _isLoadingProfile ||
                            _profileLoadError != null
                        ? null
                        : () async {
                            setState(() => _isSubmitting = true);
                            try {
                              final validationService =
                                  _buildCheckoutValidationService();
                              final validationResult = await validationService
                                  .validate(
                                    _buildCheckoutValidationRequest(
                                      cart: cart,
                                      orderController: orderController,
                                    ),
                                  );
                              if (!context.mounted) {
                                return;
                              }
                              final canProceed = await _handleValidationResult(
                                validationResult,
                              );
                              if (!context.mounted || !canProceed) {
                                return;
                              }

                              BankTransferInstructions?
                              bankTransferInstructions;
                              if (_method == OrderPaymentMethod.bankTransfer) {
                                bankTransferInstructions =
                                    await _ensureBankTransferInstructions();
                                if (!mounted) {
                                  return;
                                }
                                if (bankTransferInstructions == null) {
                                  return;
                                }
                              } else {
                                final confirmed = await _showDebtConfirmDialog(
                                  context,
                                  amount: total,
                                  itemCount: cart.totalItems,
                                );
                                if (!context.mounted) {
                                  return;
                                }
                                if (confirmed != true) {
                                  return;
                                }
                              }

                              await _placeOrder(
                                cart: cart,
                                orderController: orderController,
                                bankTransferInstructions:
                                    bankTransferInstructions,
                              );
                            } catch (error) {
                              _showSnackBar(
                                orderControllerErrorMessage(
                                  error,
                                  isEnglish: texts.isEnglish,
                                ),
                              );
                            } finally {
                              if (mounted) {
                                setState(() => _isSubmitting = false);
                              }
                            }
                          },
                    child: _isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2.5),
                          )
                        : Text(_primaryActionLabel),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
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
    required OrderController orderController,
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
      currentOutstandingDebt: orderController.totalOutstandingDebt,
      creditLimit: _profile.creditLimit,
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

    for (final issue in result.issues) {
      switch (issue.code) {
        case CheckoutValidationIssueCode.debtPaymentUnavailable:
          _showSnackBar(_texts.debtPaymentUnavailableMessage);
          return false;
        case CheckoutValidationIssueCode.debtLimitExceeded:
          _showSnackBar(
            _texts.creditLimitExceededMessage(
              formatVnd(issue.projectedOutstandingDebt ?? 0),
              formatVnd(issue.creditLimit ?? 0),
            ),
          );
          return false;
        case CheckoutValidationIssueCode.cartSyncInProgress:
        case CheckoutValidationIssueCode.outOfStock:
        case CheckoutValidationIssueCode.insufficientStock:
          break;
      }
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
      case CheckoutValidationIssueCode.debtPaymentUnavailable:
        return texts.debtPaymentUnavailableMessage;
      case CheckoutValidationIssueCode.debtLimitExceeded:
        return texts.creditLimitExceededMessage(
          formatVnd(issue.projectedOutstandingDebt ?? 0),
          formatVnd(issue.creditLimit ?? 0),
        );
    }
  }

  Future<bool?> _showDebtConfirmDialog(
    BuildContext context, {
    required int amount,
    required int itemCount,
  }) {
    final texts = _texts;
    return showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(texts.debtConfirmTitle),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(texts.debtConfirmDescription),
              const SizedBox(height: 12),
              Text(texts.productCountSummary(itemCount)),
              const SizedBox(height: 4),
              Text(texts.totalPaymentSummary(formatVnd(amount))),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(texts.cancelAction),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(texts.primaryActionConfirmOrder),
            ),
          ],
        );
      },
    );
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

    await cart.clear(rollbackOnFailure: false);
    if (!mounted) {
      return;
    }

    HapticFeedback.mediumImpact();
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
          title: Text(texts.validationDialogTitle),
          content: Column(
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

class _CheckoutTexts {
  const _CheckoutTexts({required this.isEnglish});

  final bool isEnglish;

  String get profileLoadFailedMessage => isEnglish
      ? 'Unable to load account information. Please retry before placing the order.'
      : 'Không tải được thông tin tài khoản. Vui lòng tải lại trước khi đặt đơn.';
  String get loadingProfileMessage => isEnglish
      ? 'Loading account information...'
      : 'Đang tải thông tin tài khoản...';
  String get primaryActionBankTransfer => isEnglish
      ? 'Create order and view bank transfer details'
      : 'Tạo đơn và xem thông tin chuyển khoản';
  String get primaryActionConfirmOrder =>
      isEnglish ? 'Confirm order' : 'Xác nhận đặt hàng';
  String cannotLoadBankTransferMessage(Object error) => isEnglish
      ? bankTransferLoadErrorMessage(error, isEnglish: true)
      : bankTransferLoadErrorMessage(error, isEnglish: false);
  String copiedLabelMessage(String label) =>
      isEnglish ? 'Copied $label' : 'Đã sao chép $label';
  String get screenTitle => isEnglish ? 'Checkout' : 'Thanh toán';
  String get shippingInfoTitle =>
      isEnglish ? 'Shipping information' : 'Thông tin nhận hàng';
  String get editShippingInfoAction =>
      isEnglish ? 'Edit shipping information' : 'Sửa thông tin nhận hàng';
  String contactPersonLine(String name) =>
      isEnglish ? 'Contact person: $name' : 'Người liên hệ: $name';
  String phoneLine(String phone) =>
      isEnglish ? 'Phone: $phone' : 'Số điện thoại: $phone';
  String get paymentMethodTitle =>
      isEnglish ? 'Payment method' : 'Phương thức thanh toán';
  String get bankTransferTitle =>
      isEnglish ? 'Bank transfer' : 'Chuyển khoản ngân hàng';
  String get bankTransferSubtitle => isEnglish
      ? 'Create the order first, then let the SePay webhook confirm payment automatically.'
      : 'Tạo đơn trước, SePay webhook sẽ tự động xác nhận thanh toán.';
  String get debtPaymentTitle =>
      isEnglish ? 'Debt recorded' : 'Ghi nhận công nợ';
  String remainingCreditLimitLabel(String remaining, String total) => isEnglish
      ? 'Remaining credit limit: $remaining / $total.'
      : 'Hạn mức còn lại: $remaining / $total.';
  String get debtLimitRequiredMessage => isEnglish
      ? 'A credit limit must be granted before using this option.'
      : 'Cần được cấp hạn mức công nợ trước khi dùng tuỳ chọn này.';
  String get debtPrecheckHint => isEnglish
      ? 'Shown debt eligibility is based on the latest synced data. The backend revalidates the credit limit when the order is created.'
      : 'Điều kiện công nợ đang hiển thị chỉ dựa trên dữ liệu đồng bộ gần nhất. Backend sẽ kiểm tra lại hạn mức khi tạo đơn.';
  String productsInOrderTitle(int totalItems) => isEnglish
      ? 'Products in order ($totalItems)'
      : 'Sản phẩm trong đơn ($totalItems)';
  String productLineCount(int count) =>
      isEnglish ? '$count line items' : '$count dòng sản phẩm';
  String get expandProductsHint => isEnglish
      ? 'Tap to view each product in detail'
      : 'Nhấn để xem chi tiết từng sản phẩm';
  String get orderNoteTitle => isEnglish ? 'Order note' : 'Ghi chú đơn hàng';
  String get orderNoteHint => isEnglish
      ? 'Example: deliver during office hours, call before delivery, invoice note...'
      : 'Ví dụ: giao giờ hành chính, gọi trước khi giao, lưu ý xuất hoá đơn...';
  String get orderSummaryTitle =>
      isEnglish ? 'Order summary' : 'Tóm tắt đơn hàng';
  String get itemCountLabel => isEnglish ? 'Item count' : 'Số lượng sản phẩm';
  String get subtotalLabel => isEnglish ? 'Subtotal' : 'Tạm tính';
  String discountLabel(int percent) =>
      isEnglish ? 'Discount ($percent%)' : 'Chiết khấu ($percent%)';
  String get afterDiscountLabel =>
      isEnglish ? 'After discount' : 'Sau chiết khấu';
  String vatLabel(int percent) =>
      isEnglish ? 'VAT ($percent%)' : 'VAT ($percent%)';
  String get paymentStatusLabelTitle =>
      isEnglish ? 'Payment status' : 'Trạng thái thanh toán';
  String get bankTransferSummaryHint => isEnglish
      ? 'The order will be created first. Then transfer the exact amount with the exact order ID so the SePay webhook can reconcile it automatically.'
      : 'Đơn sẽ được tạo trước. Sau đó hãy chuyển khoản đúng số tiền và đúng mã đơn do hệ thống cấp để SePay webhook đối soát tự động.';
  String get loadingBankTransferMessage => isEnglish
      ? 'Loading bank transfer information from the system...'
      : 'Đang tải thông tin chuyển khoản từ hệ thống...';
  String get bankTransferUnavailableMessage => isEnglish
      ? 'Bank transfer information could not be loaded yet. Please try again before placing the order.'
      : 'Chưa tải được thông tin chuyển khoản. Hãy thử lại trước khi đặt đơn.';
  String get retryAction => isEnglish ? 'Retry' : 'Tải lại';
  String get totalLabel => isEnglish ? 'Total' : 'Tổng cộng';
  String get pricingNote => isEnglish
      ? 'Note: The actual order price is calculated using the current price at checkout time, and may differ if product prices changed since the last refresh.'
      : 'Lưu ý: Giá thực tế trong đơn được tính theo giá hiện hành tại thời điểm đặt hàng, có thể khác nếu giá sản phẩm thay đổi từ lần tải gần nhất.';
  String get debtPaymentUnavailableMessage => isEnglish
      ? 'This account has not been granted a credit limit yet.'
      : 'Tài khoản chưa được cấp hạn mức công nợ.';
  String creditLimitExceededMessage(String projected, String limit) => isEnglish
      ? 'Credit limit exceeded. Projected debt $projected is greater than limit $limit.'
      : 'Vượt hạn mức công nợ. Công nợ dự kiến $projected lớn hơn hạn mức $limit.';
  String get cannotCreateOrderMessage => isEnglish
      ? 'Unable to create the order. Please try again.'
      : 'Không thể tạo đơn hàng. Vui lòng thử lại.';
  String stockIssue(String productName, int stock) => isEnglish
      ? '$productName only has $stock items left in stock.'
      : '$productName chỉ còn $stock sản phẩm trong kho.';
  String get debtConfirmTitle =>
      isEnglish ? 'Confirm debt recording' : 'Xác nhận ghi nhận công nợ';
  String get debtConfirmDescription => isEnglish
      ? 'The order will be created immediately and recorded into the current outstanding debt.'
      : 'Đơn hàng sẽ được tạo ngay và ghi nhận vào tổng công nợ hiện tại.';
  String productCountSummary(int count) =>
      isEnglish ? 'Item count: $count' : 'Số lượng sản phẩm: $count';
  String totalPaymentSummary(String amount) =>
      isEnglish ? 'Total payment: $amount' : 'Tổng thanh toán: $amount';
  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get validationDialogTitle =>
      isEnglish ? 'Order needs adjustments' : 'Cần điều chỉnh đơn hàng';
  String get validationDialogSubtitle =>
      isEnglish ? 'Please review:' : 'Vui lòng kiểm tra:';
  String get cartSyncInProgressMessage => isEnglish
      ? 'The cart is still syncing. Please wait a moment and try again.'
      : 'Giỏ hàng vẫn đang đồng bộ. Vui lòng đợi một chút rồi thử lại.';
  String get closeAction => isEnglish ? 'Close' : 'Đóng';
  String outOfStockIssue(String productName) => isEnglish
      ? '$productName is currently out of stock.'
      : '$productName hiện đã hết hàng.';

  String paymentStatusLabel(OrderPaymentStatus status) {
    switch (status) {
      case OrderPaymentStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
      case OrderPaymentStatus.pending:
        return isEnglish ? 'Unpaid' : 'Chưa thanh toán';
      case OrderPaymentStatus.paid:
        return isEnglish ? 'Paid' : 'Đã thanh toán';
      case OrderPaymentStatus.debtRecorded:
        return isEnglish ? 'Debt recorded' : 'Công nợ';
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

    final valueStyle = isEmphasis ? emphasisStyle : style;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Text(label, style: isEmphasis ? emphasisStyle : style),
            ),
            const SizedBox(width: 12),
            Flexible(
              child: Text(
                value,
                textAlign: TextAlign.right,
                style: valueStyle,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _CheckoutItemRow extends StatelessWidget {
  const _CheckoutItemRow({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ProductImage(
          product: item.product,
          width: 42,
          height: 42,
          borderRadius: BorderRadius.circular(10),
          iconSize: 18,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.product.name,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 2),
              Text(
                'SKU: ${item.product.sku}',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'x${item.quantity}',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 2),
            Text(
              formatVnd(item.quantity * item.product.price),
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ],
    );
  }
}
