import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_settings_controller.dart';
import 'bank_transfer_support.dart';
import 'breakpoints.dart';
import 'cart_controller.dart';
import 'checkout_validation_service.dart';
import 'dealer_navigation.dart';
import 'dealer_routes.dart';
import 'dealer_profile_storage.dart';
import 'global_search.dart';
import 'models.dart';
import 'order_controller.dart';
import 'order_success_screen.dart';
import 'product_catalog_controller.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/product_image.dart';
import 'widgets/section_card.dart';

part 'checkout_texts.dart';
part 'checkout_widgets.dart';
part 'checkout_screen_submit.dart';

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
        leading: const DealerFallbackBackButton(
          fallbackPath: DealerRoutePath.home,
        ),
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
}
