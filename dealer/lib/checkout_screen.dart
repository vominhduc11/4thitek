import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_settings_controller.dart';
import 'bank_transfer_support.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'checkout_validation_service.dart';
import 'dealer_navigation.dart';
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
  final OrderPaymentMethod _method = OrderPaymentMethod.bankTransfer;
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
    return OrderPaymentStatus.pending;
  }

  String get _primaryActionLabel => _texts.primaryActionBankTransfer;

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
      setState(() {
        _profile = profile;
        _isLoadingProfile = false;
        _profileLoadError = null;
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
    await context.pushDealerAccountSettings();
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
    final isWideLayout = MediaQuery.sizeOf(context).width >= 1040;
    final contentMaxWidth = isWideLayout
        ? 1040.0
        : isTablet
        ? 860.0
        : double.infinity;
    final subtotal = cart.subtotal;
    final discountPercent = cart.discountPercent;
    final discountAmount = cart.discountAmount;
    final totalAfterDiscount = cart.totalAfterDiscount;
    final vatAmount = cart.vatAmount;
    final total = cart.total;
    final missingProfileFields = _missingProfileFields(texts);
    final cartSyncInProgress = cart.items.any(
      (item) => cart.isSyncingProduct(item.product.id),
    );
    final hasBankTransferReady =
        _bankTransferInstructions != null &&
        !_isLoadingBankTransferInstructions;
    final blockerMessages = <String>[
      if (cart.isEmpty) texts.emptyCartBlockerMessage,
      if (_isLoadingProfile) texts.loadingProfileMessage,
      ...?_profileLoadError == null ? null : <String>[_profileLoadError!],
      if (missingProfileFields.isNotEmpty)
        texts.missingProfileFieldsMessage(missingProfileFields),
      if (cartSyncInProgress) texts.cartSyncInProgressMessage,
      if (_isLoadingBankTransferInstructions)
        texts.loadingBankTransferMessage
      else if (!hasBankTransferReady)
        texts.bankTransferUnavailableMessage,
    ];
    final canSubmitCheckout =
        !cart.isEmpty &&
        !_isSubmitting &&
        !_isLoadingProfile &&
        _profileLoadError == null &&
        missingProfileFields.isEmpty &&
        !cartSyncInProgress &&
        hasBankTransferReady;

    Widget buildShippingSection() {
      return FadeSlideIn(
        child: SectionCard(
          title: texts.shippingInfoTitle,
          icon: Icons.local_shipping_outlined,
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
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
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
      );
    }

    Widget buildPaymentSection() {
      return FadeSlideIn(
        delay: const Duration(milliseconds: 60),
        child: SectionCard(
          title: texts.paymentFlowTitle,
          icon: Icons.account_balance_wallet_outlined,
          child: _isLoadingProfile
              ? _CheckoutStatePanel(
                  icon: Icons.sync_outlined,
                  message: texts.loadingProfileMessage,
                  tone: _CheckoutStateTone.info,
                )
              : _profileLoadError != null
              ? _CheckoutStatePanel(
                  icon: Icons.error_outline,
                  message: _profileLoadError!,
                  tone: _CheckoutStateTone.error,
                  action: TextButton.icon(
                    onPressed: _isSubmitting
                        ? null
                        : () => _loadDealerProfile(showFailureSnackBar: true),
                    icon: const Icon(Icons.refresh_outlined),
                    label: Text(texts.retryAction),
                  ),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: colors.primaryContainer.withValues(alpha: 0.22),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: colors.primary.withValues(alpha: 0.16),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: colors.surface.withValues(alpha: 0.78),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                alignment: Alignment.center,
                                child: Icon(
                                  Icons.account_balance_outlined,
                                  color: colors.primary,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      texts.bankTransferTitle,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleSmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.w800,
                                          ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      texts.bankTransferSubtitle,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: colors.onSurfaceVariant,
                                            height: 1.4,
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              _CheckoutMethodBadge(label: texts.fixedFlowBadge),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Text(
                            texts.paymentFlowDescription,
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: colors.onSurface,
                                  fontWeight: FontWeight.w600,
                                  height: 1.45,
                                ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    if (_isLoadingBankTransferInstructions)
                      _CheckoutStatePanel(
                        icon: Icons.account_balance_outlined,
                        message: texts.loadingBankTransferMessage,
                        tone: _CheckoutStateTone.info,
                        dense: true,
                      )
                    else if (_bankTransferInstructions == null)
                      _CheckoutStatePanel(
                        icon: Icons.sync_problem_outlined,
                        message: texts.bankTransferUnavailableMessage,
                        tone: _CheckoutStateTone.error,
                        dense: true,
                        action: TextButton.icon(
                          onPressed: _isSubmitting
                              ? null
                              : () => _loadBankTransferInstructions(
                                  showError: true,
                                ),
                          icon: const Icon(Icons.refresh_outlined, size: 18),
                          label: Text(texts.retryAction),
                        ),
                      )
                    else
                      _CheckoutTransferPreviewCard(
                        texts: texts,
                        instructions: _bankTransferInstructions!,
                      ),
                  ],
                ),
        ),
      );
    }

    Widget buildProductsSection() {
      return FadeSlideIn(
        delay: const Duration(milliseconds: 120),
        child: SectionCard(
          title: texts.productsInOrderTitle(cart.totalItems),
          icon: Icons.inventory_2_outlined,
          child: Theme(
            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
            child: ExpansionTile(
              tilePadding: EdgeInsets.zero,
              childrenPadding: const EdgeInsets.only(top: 8),
              initiallyExpanded: cart.items.length <= 3,
              title: Text(
                texts.productLineCount(cart.items.length),
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                texts.expandProductsHint,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
              ),
              children: [
                for (var i = 0; i < cart.items.length; i++) ...[
                  RepaintBoundary(child: _CheckoutItemRow(item: cart.items[i])),
                  if (i != cart.items.length - 1) const Divider(height: 18),
                ],
              ],
            ),
          ),
        ),
      );
    }

    Widget buildOrderNoteSection() {
      return FadeSlideIn(
        delay: const Duration(milliseconds: 160),
        child: SectionCard(
          title: texts.orderNoteTitle,
          icon: Icons.sticky_note_2_outlined,
          child: TextField(
            controller: _orderNoteController,
            maxLines: 3,
            minLines: 2,
            maxLength: 200,
            decoration: InputDecoration(
              hintText: texts.orderNoteHint,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
      );
    }

    Widget buildOrderSummarySection() {
      return FadeSlideIn(
        delay: const Duration(milliseconds: 200),
        child: SectionCard(
          title: texts.orderSummaryTitle,
          icon: Icons.receipt_long_outlined,
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
      );
    }

    Widget buildSubmitAction() {
      return FadeSlideIn(
        delay: const Duration(milliseconds: 180),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (blockerMessages.isNotEmpty) ...[
              _CheckoutStatePanel(
                icon: Icons.info_outline,
                message: texts.checkoutReadinessTitle,
                tone: _CheckoutStateTone.info,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 12),
                    ...blockerMessages.map(
                      (message) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Padding(
                              padding: EdgeInsets.only(top: 4),
                              child: Icon(Icons.circle, size: 7),
                            ),
                            const SizedBox(width: 8),
                            Expanded(child: Text(message)),
                          ],
                        ),
                      ),
                    ),
                    Wrap(
                      spacing: 10,
                      runSpacing: 8,
                      children: [
                        if (missingProfileFields.isNotEmpty)
                          OutlinedButton.icon(
                            onPressed: _isSubmitting
                                ? null
                                : _openAccountSettings,
                            icon: const Icon(Icons.manage_accounts_outlined),
                            label: Text(texts.completeProfileAction),
                          ),
                        if (_profileLoadError != null)
                          OutlinedButton.icon(
                            onPressed: _isSubmitting
                                ? null
                                : () => _loadDealerProfile(
                                    showFailureSnackBar: true,
                                  ),
                            icon: const Icon(Icons.refresh_outlined),
                            label: Text(texts.retryProfileAction),
                          ),
                        if (!hasBankTransferReady)
                          OutlinedButton.icon(
                            onPressed: _isSubmitting
                                ? null
                                : () => _loadBankTransferInstructions(
                                    showError: true,
                                  ),
                            icon: const Icon(Icons.account_balance_outlined),
                            label: Text(texts.reloadPaymentInstructionsAction),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: !canSubmitCheckout
                    ? null
                    : () async {
                        setState(() => _isSubmitting = true);
                        try {
                          final validationService =
                              _buildCheckoutValidationService();
                          final validationResult = await validationService
                              .validate(
                                _buildCheckoutValidationRequest(cart: cart),
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

                          BankTransferInstructions? bankTransferInstructions;
                          bankTransferInstructions =
                              await _ensureBankTransferInstructions();
                          if (!mounted) {
                            return;
                          }
                          if (bankTransferInstructions == null) {
                            return;
                          }

                          await _placeOrder(
                            cart: cart,
                            orderController: orderController,
                            bankTransferInstructions: bankTransferInstructions,
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
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(texts.screenTitle),
        actions: const [GlobalSearchIconButton()],
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: isWideLayout
              ? Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: ListView(
                          padding: EdgeInsets.zero,
                          children: [
                            buildShippingSection(),
                            const SizedBox(height: 14),
                            buildPaymentSection(),
                            const SizedBox(height: 14),
                            buildProductsSection(),
                            const SizedBox(height: 14),
                            buildOrderNoteSection(),
                          ],
                        ),
                      ),
                      const SizedBox(width: 20),
                      SizedBox(
                        width: 340,
                        child: SingleChildScrollView(
                          child: RepaintBoundary(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                buildOrderSummarySection(),
                                const SizedBox(height: 16),
                                buildSubmitAction(),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  children: [
                    buildShippingSection(),
                    const SizedBox(height: 14),
                    buildPaymentSection(),
                    const SizedBox(height: 14),
                    buildProductsSection(),
                    const SizedBox(height: 14),
                    buildOrderNoteSection(),
                    const SizedBox(height: 14),
                    buildOrderSummarySection(),
                    const SizedBox(height: 20),
                    buildSubmitAction(),
                  ],
                ),
        ),
      ),
    );
  }

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

    for (final issue in result.issues) {
      switch (issue.code) {
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

class _CheckoutTexts {
  const _CheckoutTexts({required this.isEnglish});

  final bool isEnglish;

  String get checkoutReadinessTitle => isEnglish
      ? 'Review these prerequisites before placing the order.'
      : 'Hãy hoàn tất các điều kiện sau trước khi đặt đơn.';
  String get completeProfileAction =>
      isEnglish ? 'Complete dealer profile' : 'Bổ sung hồ sơ đại lý';
  String get retryProfileAction =>
      isEnglish ? 'Reload account data' : 'Tải lại dữ liệu tài khoản';
  String get reloadPaymentInstructionsAction => isEnglish
      ? 'Reload transfer instructions'
      : 'Tải lại hướng dẫn chuyển khoản';
  String get businessNameFieldLabel =>
      isEnglish ? 'Business name' : 'Tên doanh nghiệp';
  String get contactNameFieldLabel =>
      isEnglish ? 'Contact name' : 'Người liên hệ';
  String get phoneFieldLabel => isEnglish ? 'Phone number' : 'Số điện thoại';
  String get shippingAddressFieldLabel =>
      isEnglish ? 'Shipping address' : 'Địa chỉ nhận hàng';
  String get emptyCartBlockerMessage => isEnglish
      ? 'Your cart is empty. Add products before creating an order.'
      : 'Giỏ hàng đang trống. Hãy thêm sản phẩm trước khi tạo đơn.';
  String missingProfileFieldsMessage(List<String> fields) {
    final summary = fields.join(', ');
    return isEnglish
        ? 'Update these profile fields first: $summary.'
        : 'Vui lòng cập nhật trước các mục hồ sơ sau: $summary.';
  }

  String get profileLoadFailedMessage => isEnglish
      ? 'Unable to load account information. Please retry before placing the order.'
      : 'Không tải được thông tin tài khoản. Vui lòng tải lại trước khi đặt đơn.';
  String get loadingProfileMessage => isEnglish
      ? 'Loading account information...'
      : 'Đang tải thông tin tài khoản...';
  String get primaryActionBankTransfer => isEnglish
      ? 'Create order and open transfer instructions'
      : 'Tạo đơn và mở hướng dẫn chuyển khoản';
  String cannotLoadBankTransferMessage(Object error) =>
      bankTransferLoadErrorMessage(error, isEnglish: isEnglish);
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
  String get paymentFlowTitle =>
      isEnglish ? 'Payment flow' : 'Quy trình thanh toán';
  String get fixedFlowBadge => isEnglish ? 'Fixed flow' : 'Luồng cố định';
  String get bankTransferTitle =>
      isEnglish ? 'Bank transfer' : 'Chuyển khoản ngân hàng';
  String get bankTransferSubtitle => isEnglish
      ? 'Dealer orders currently use one verified transfer flow managed through SePay reconciliation.'
      : 'Đơn đại lý hiện dùng một luồng chuyển khoản cố định và được đối soát qua SePay.';
  String get paymentFlowDescription => isEnglish
      ? 'Create the order first, then transfer the exact amount using the exact order ID so the system can reconcile payment automatically.'
      : 'Hệ thống sẽ tạo đơn trước. Sau đó bạn chuyển đúng số tiền và đúng mã đơn để hệ thống đối soát thanh toán tự động.';
  String get paymentStepCreateTitle =>
      isEnglish ? 'Create the order first' : 'Tạo đơn hàng trước';
  String get paymentStepCreateDescription => isEnglish
      ? 'The order is recorded immediately and remains pending while payment is being matched.'
      : 'Đơn được ghi nhận ngay và giữ trạng thái chờ trong lúc hệ thống đối soát thanh toán.';
  String get paymentStepTransferTitle => isEnglish
      ? 'Transfer with the exact amount'
      : 'Chuyển khoản đúng số tiền';
  String get paymentStepTransferDescription => isEnglish
      ? 'Use the receiving account shown below. Transfer content is the order ID generated after you place the order.'
      : 'Dùng tài khoản nhận tiền bên dưới. Nội dung chuyển khoản sẽ là mã đơn được tạo sau khi bạn đặt hàng.';
  String get paymentStepConfirmTitle =>
      isEnglish ? 'Wait for automatic confirmation' : 'Chờ xác nhận tự động';
  String get paymentStepConfirmDescription => isEnglish
      ? 'SePay webhook updates payment status automatically. Admin only processes orders after successful payment.'
      : 'SePay webhook sẽ tự cập nhật trạng thái thanh toán. Admin chỉ xử lý đơn sau khi thanh toán được xác nhận.';
  String get transferPreviewTitle =>
      isEnglish ? 'Receiving account' : 'Tài khoản nhận chuyển khoản';
  String get transferPreviewHint => isEnglish
      ? 'Transfer content appears after order creation because it uses the generated order ID.'
      : 'Nội dung chuyển khoản chỉ xuất hiện sau khi tạo đơn vì sẽ dùng đúng mã đơn vừa phát sinh.';
  String get providerLabel => isEnglish ? 'Provider' : 'Nhà cung cấp';
  String get bankNameLabel => isEnglish ? 'Bank' : 'Ngân hàng';
  String get accountNumberLabel =>
      isEnglish ? 'Account number' : 'Số tài khoản';
  String get accountHolderLabel =>
      isEnglish ? 'Account holder' : 'Chủ tài khoản';
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
      : 'Ví dụ: giao giờ hành chính, gọi trước khi giao, lưu ý xuất hóa đơn...';
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
      : 'Đơn sẽ được tạo trước. Sau đó hãy chuyển khoản đúng số tiền và đúng mã đơn để SePay webhook đối soát tự động.';
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
      : 'Lưu ý: Giá thực tế trong đơn được tính theo giá hiện hành tại thời điểm đặt hàng và có thể khác nếu giá sản phẩm thay đổi từ lần tải gần nhất.';
  String get cannotCreateOrderMessage => isEnglish
      ? 'Unable to create the order. Please try again.'
      : 'Không thể tạo đơn hàng. Vui lòng thử lại.';
  String stockIssue(String productName, int stock) => isEnglish
      ? '$productName only has $stock items left in stock.'
      : '$productName chỉ còn $stock sản phẩm trong kho.';
  String productCountSummary(int count) =>
      isEnglish ? 'Item count: $count' : 'Số lượng sản phẩm: $count';
  String totalPaymentSummary(String amount) =>
      isEnglish ? 'Total payment: $amount' : 'Tổng thanh toán: $amount';
  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get validationDialogTitle =>
      isEnglish ? 'Order needs adjustments' : 'Đơn hàng cần điều chỉnh';
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
    }
  }
}

class _CheckoutMethodBadge extends StatelessWidget {
  const _CheckoutMethodBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.86),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: colors.outlineVariant),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: colors.primary,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _CheckoutTransferPreviewCard extends StatelessWidget {
  const _CheckoutTransferPreviewCard({
    required this.texts,
    required this.instructions,
  });

  final _CheckoutTexts texts;
  final BankTransferInstructions instructions;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            texts.transferPreviewTitle,
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            texts.transferPreviewHint,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              final useTwoColumns = constraints.maxWidth >= 560;
              final itemWidth = useTwoColumns
                  ? (constraints.maxWidth - 12) / 2
                  : constraints.maxWidth;
              final fields = [
                _CheckoutTransferDetail(
                  label: texts.providerLabel,
                  value: instructions.provider,
                ),
                _CheckoutTransferDetail(
                  label: texts.bankNameLabel,
                  value: instructions.bankName,
                ),
                _CheckoutTransferDetail(
                  label: texts.accountNumberLabel,
                  value: instructions.accountNumber,
                ),
                _CheckoutTransferDetail(
                  label: texts.accountHolderLabel,
                  value: instructions.accountHolder,
                ),
              ];
              return Wrap(
                spacing: 12,
                runSpacing: 12,
                children: fields
                    .map((field) => SizedBox(width: itemWidth, child: field))
                    .toList(growable: false),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _CheckoutTransferDetail extends StatelessWidget {
  const _CheckoutTransferDetail({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: colors.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w700,
              height: 1.35,
            ),
          ),
        ],
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

enum _CheckoutStateTone { info, error }

class _CheckoutStatePanel extends StatelessWidget {
  const _CheckoutStatePanel({
    required this.icon,
    required this.message,
    required this.tone,
    this.action,
    this.child,
    this.dense = false,
  });

  final IconData icon;
  final String message;
  final _CheckoutStateTone tone;
  final Widget? action;
  final Widget? child;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isError = tone == _CheckoutStateTone.error;
    final background = isError
        ? colors.errorContainer.withValues(alpha: 0.4)
        : colors.primaryContainer.withValues(alpha: 0.3);
    final border = isError
        ? colors.error.withValues(alpha: 0.28)
        : colors.primary.withValues(alpha: 0.22);
    final iconColor = isError ? colors.error : colors.primary;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(dense ? 12 : 14),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(dense ? 14 : 16),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: dense ? 18 : 20, color: iconColor),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  message,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: dense ? colors.onSurfaceVariant : colors.onSurface,
                    height: 1.35,
                    fontWeight: dense ? FontWeight.w500 : FontWeight.w600,
                  ),
                ),
              ),
              if (action case final actionWidget?) ...[
                const SizedBox(width: 8),
                actionWidget,
              ],
            ],
          ),
          ...?child == null ? null : <Widget>[child!],
        ],
      ),
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
