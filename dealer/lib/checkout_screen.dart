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
import 'order_detail_screen.dart';
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
          title: texts.paymentMethodTitle,
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
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.account_balance_outlined),
                      title: Text(texts.bankTransferTitle),
                      subtitle: Text(texts.bankTransferSubtitle),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      texts.bankTransferWorkflowHint,
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
              if (_method == OrderPaymentMethod.bankTransfer) ...[
                const SizedBox(height: 8),
                Text(
                  texts.bankTransferSummaryHint,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (_isLoadingBankTransferInstructions) ...[
                  const SizedBox(height: 8),
                  _CheckoutStatePanel(
                    icon: Icons.account_balance_outlined,
                    message: texts.loadingBankTransferMessage,
                    tone: _CheckoutStateTone.info,
                    dense: true,
                  ),
                ] else if (_bankTransferInstructions == null) ...[
                  const SizedBox(height: 8),
                  _CheckoutStatePanel(
                    icon: Icons.sync_problem_outlined,
                    message: texts.bankTransferUnavailableMessage,
                    tone: _CheckoutStateTone.error,
                    dense: true,
                    action: TextButton(
                      onPressed: _isSubmitting
                          ? null
                          : () =>
                                _loadBankTransferInstructions(showError: true),
                      child: Text(texts.retryAction),
                    ),
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
      );
    }

    Widget buildSubmitAction() {
      return FadeSlideIn(
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
                      final validationResult = await validationService.validate(
                        _buildCheckoutValidationRequest(
                          cart: cart,
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
                                if (_profileLoadError != null) ...[
                                  const SizedBox(height: 12),
                                  _CheckoutStatePanel(
                                    icon: Icons.error_outline,
                                    message: _profileLoadError!,
                                    tone: _CheckoutStateTone.error,
                                    dense: true,
                                  ),
                                ],
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
                    if (_profileLoadError != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _CheckoutStatePanel(
                          icon: Icons.error_outline,
                          message: _profileLoadError!,
                          tone: _CheckoutStateTone.error,
                          dense: true,
                        ),
                      ),
                    buildSubmitAction(),
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
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => shouldOpenOrderDetail
            ? OrderDetailScreen(orderId: createdOrder.id)
            : OrderSuccessScreen(
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

  String get profileLoadFailedMessage => isEnglish
      ? 'Unable to load account information. Please retry before placing the order.'
      : 'Khong tai duoc thong tin tai khoan. Vui long tai lai truoc khi dat don.';
  String get loadingProfileMessage => isEnglish
      ? 'Loading account information...'
      : 'Dang tai thong tin tai khoan...';
  String get primaryActionBankTransfer => isEnglish
      ? 'Create order and view bank transfer details'
      : 'Tao don va xem thong tin chuyen khoan';
  String cannotLoadBankTransferMessage(Object error) => isEnglish
      ? bankTransferLoadErrorMessage(error, isEnglish: true)
      : bankTransferLoadErrorMessage(error, isEnglish: false);
  String copiedLabelMessage(String label) =>
      isEnglish ? 'Copied $label' : 'Da sao chep $label';
  String get screenTitle => isEnglish ? 'Checkout' : 'Thanh toan';
  String get shippingInfoTitle =>
      isEnglish ? 'Shipping information' : 'Thong tin nhan hang';
  String get editShippingInfoAction =>
      isEnglish ? 'Edit shipping information' : 'Sua thong tin nhan hang';
  String contactPersonLine(String name) =>
      isEnglish ? 'Contact person: $name' : 'Nguoi lien he: $name';
  String phoneLine(String phone) =>
      isEnglish ? 'Phone: $phone' : 'So dien thoai: $phone';
  String get paymentMethodTitle =>
      isEnglish ? 'Payment method' : 'Phuong thuc thanh toan';
  String get bankTransferTitle =>
      isEnglish ? 'Bank transfer' : 'Chuyen khoan ngan hang';
  String get bankTransferSubtitle => isEnglish
      ? 'Create the order first, then let the SePay webhook confirm payment automatically.'
      : 'Tao don truoc, sau do de SePay webhook tu dong xac nhan thanh toan.';
  String get bankTransferWorkflowHint => isEnglish
      ? 'The order is created first and stays pending until payment is reconciled. Admin only processes paid orders, and unpaid pending orders may be auto-cancelled after the timeout.'
      : 'Don duoc tao truoc va giu trang thai cho den khi doi soat thanh toan. Admin chi xu ly don da thanh toan, va don cho chua thanh toan co the tu huy khi het thoi gian cho.';
  String productsInOrderTitle(int totalItems) => isEnglish
      ? 'Products in order ($totalItems)'
      : 'San pham trong don ($totalItems)';
  String productLineCount(int count) =>
      isEnglish ? '$count line items' : '$count dong san pham';
  String get expandProductsHint => isEnglish
      ? 'Tap to view each product in detail'
      : 'Nhan de xem chi tiet tung san pham';
  String get orderNoteTitle => isEnglish ? 'Order note' : 'Ghi chu don hang';
  String get orderNoteHint => isEnglish
      ? 'Example: deliver during office hours, call before delivery, invoice note...'
      : 'Vi du: giao gio hanh chinh, goi truoc khi giao, luu y xuat hoa don...';
  String get orderSummaryTitle =>
      isEnglish ? 'Order summary' : 'Tom tat don hang';
  String get itemCountLabel => isEnglish ? 'Item count' : 'So luong san pham';
  String get subtotalLabel => isEnglish ? 'Subtotal' : 'Tam tinh';
  String discountLabel(int percent) =>
      isEnglish ? 'Discount ($percent%)' : 'Chiet khau ($percent%)';
  String get afterDiscountLabel =>
      isEnglish ? 'After discount' : 'Sau chiet khau';
  String vatLabel(int percent) =>
      isEnglish ? 'VAT ($percent%)' : 'VAT ($percent%)';
  String get paymentStatusLabelTitle =>
      isEnglish ? 'Payment status' : 'Trang thai thanh toan';
  String get bankTransferSummaryHint => isEnglish
      ? 'The order will be created first. Then transfer the exact amount with the exact order ID so the SePay webhook can reconcile it automatically.'
      : 'Don se duoc tao truoc. Sau do hay chuyen khoan dung so tien va dung ma don de SePay webhook doi soat tu dong.';
  String get loadingBankTransferMessage => isEnglish
      ? 'Loading bank transfer information from the system...'
      : 'Dang tai thong tin chuyen khoan tu he thong...';
  String get bankTransferUnavailableMessage => isEnglish
      ? 'Bank transfer information could not be loaded yet. Please try again before placing the order.'
      : 'Chua tai duoc thong tin chuyen khoan. Hay thu lai truoc khi dat don.';
  String get retryAction => isEnglish ? 'Retry' : 'Tai lai';
  String get totalLabel => isEnglish ? 'Total' : 'Tong cong';
  String get pricingNote => isEnglish
      ? 'Note: The actual order price is calculated using the current price at checkout time, and may differ if product prices changed since the last refresh.'
      : 'Luu y: Gia thuc te trong don duoc tinh theo gia hien hanh tai thoi diem dat hang va co the khac neu gia san pham thay doi tu lan tai gan nhat.';
  String get cannotCreateOrderMessage => isEnglish
      ? 'Unable to create the order. Please try again.'
      : 'Khong the tao don hang. Vui long thu lai.';
  String stockIssue(String productName, int stock) => isEnglish
      ? '$productName only has $stock items left in stock.'
      : '$productName chi con $stock san pham trong kho.';
  String productCountSummary(int count) =>
      isEnglish ? 'Item count: $count' : 'So luong san pham: $count';
  String totalPaymentSummary(String amount) =>
      isEnglish ? 'Total payment: $amount' : 'Tong thanh toan: $amount';
  String get cancelAction => isEnglish ? 'Cancel' : 'Huy';
  String get validationDialogTitle =>
      isEnglish ? 'Order needs adjustments' : 'Don hang can dieu chinh';
  String get validationDialogSubtitle =>
      isEnglish ? 'Please review:' : 'Vui long kiem tra:';
  String get cartSyncInProgressMessage => isEnglish
      ? 'The cart is still syncing. Please wait a moment and try again.'
      : 'Gio hang van dang dong bo. Vui long doi mot chut roi thu lai.';
  String get closeAction => isEnglish ? 'Close' : 'Dong';
  String outOfStockIssue(String productName) => isEnglish
      ? '$productName is currently out of stock.'
      : '$productName hien da het hang.';

  String paymentStatusLabel(OrderPaymentStatus status) {
    switch (status) {
      case OrderPaymentStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Da huy';
      case OrderPaymentStatus.failed:
        return isEnglish ? 'Failed' : 'That bai';
      case OrderPaymentStatus.pending:
        return isEnglish ? 'Unpaid' : 'Chua thanh toan';
      case OrderPaymentStatus.paid:
        return isEnglish ? 'Paid' : 'Da thanh toan';
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

enum _CheckoutStateTone { info, error }

class _CheckoutStatePanel extends StatelessWidget {
  const _CheckoutStatePanel({
    required this.icon,
    required this.message,
    required this.tone,
    this.action,
    this.dense = false,
  });

  final IconData icon;
  final String message;
  final _CheckoutStateTone tone;
  final Widget? action;
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
      child: Row(
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
          if (action != null) ...[const SizedBox(width: 8), action!],
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
