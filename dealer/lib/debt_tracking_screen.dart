import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dealer_profile_storage.dart';
import 'models.dart';
import 'order_controller.dart';
import 'order_detail_screen.dart';
import 'upload_service.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

class DebtTrackingScreen extends StatefulWidget {
  const DebtTrackingScreen({super.key});

  @override
  State<DebtTrackingScreen> createState() => _DebtTrackingScreenState();
}

class _DebtTrackingScreenState extends State<DebtTrackingScreen> {
  DealerProfile _profile = DealerProfile.defaults;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final profile = await loadDealerProfile();
      if (!mounted) {
        return;
      }
      setState(() => _profile = profile);
    } on DealerProfileStorageException {
      // Keep debt tracking usable even if profile metadata is temporarily unavailable.
    }
  }

  Future<void> _handleRefresh() async {
    await Future.wait<void>([OrderScope.of(context).refresh(), _loadProfile()]);
    if (!mounted) {
      return;
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    final texts = _DebtTexts(isEnglish: isEnglish);
    final orderController = OrderScope.of(context);
    final debtOrders = orderController.debtOrders;
    final debtOrderIds = orderController.orders
        .where((order) => order.paymentMethod == OrderPaymentMethod.debt)
        .map((order) => order.id)
        .toSet();
    final paymentHistory = orderController.paymentHistory
        .where((payment) => debtOrderIds.contains(payment.orderId))
        .toList(growable: false);
    final isTablet = AppBreakpoints.isTablet(context);
    final maxWidth = isTablet ? 960.0 : double.infinity;

    return Scaffold(
      appBar: AppBar(title: BrandAppBarTitle(texts.screenTitle)),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: RefreshIndicator(
            onRefresh: _handleRefresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              children: [
                FadeSlideIn(
                  child: _DebtSummaryCard(
                    totalOutstandingDebt: orderController.totalOutstandingDebt,
                    debtOrderCount: debtOrders.length,
                    creditLimit: _profile.creditLimit,
                    texts: texts,
                  ),
                ),
                const SizedBox(height: 14),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 60),
                  child: Text(
                    texts.debtOrdersSectionTitle,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                if (debtOrders.isEmpty)
                  FadeSlideIn(
                    delay: const Duration(milliseconds: 90),
                    child: _EmptyCard(
                      icon: Icons.check_circle_outline,
                      title: texts.debtOrdersEmptyTitle,
                      subtitle: texts.debtOrdersEmptySubtitle,
                    ),
                  )
                else
                  _DebtOrdersGrid(
                    orders: debtOrders,
                    isTablet: isTablet,
                    texts: texts,
                  ),
                const SizedBox(height: 14),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 120),
                  child: Text(
                    texts.paymentHistorySectionTitle,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                if (paymentHistory.isEmpty)
                  FadeSlideIn(
                    delay: const Duration(milliseconds: 140),
                    child: _EmptyCard(
                      icon: Icons.history_toggle_off_outlined,
                      title: texts.paymentHistoryEmptyTitle,
                      subtitle: texts.paymentHistoryEmptySubtitle,
                    ),
                  )
                else
                  ...paymentHistory.asMap().entries.map((entry) {
                    final index = entry.key;
                    final payment = entry.value;
                    return FadeSlideIn(
                      key: ValueKey(payment.id),
                      delay: Duration(milliseconds: 140 + index * 35),
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _PaymentHistoryCard(
                          payment: payment,
                          texts: texts,
                        ),
                      ),
                    );
                  }),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DebtSummaryCard extends StatelessWidget {
  const _DebtSummaryCard({
    required this.totalOutstandingDebt,
    required this.debtOrderCount,
    required this.creditLimit,
    required this.texts,
  });

  final int totalOutstandingDebt;
  final int debtOrderCount;
  final int creditLimit;
  final _DebtTexts texts;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final debtColor = isDark
        ? const Color(0xFFFBBF24)
        : const Color(0xFFB45309);

    return Semantics(
      container: true,
      label: texts.summarySemantics(
        amount: formatVnd(totalOutstandingDebt),
        orderCount: debtOrderCount,
      ),
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(
            color: Theme.of(
              context,
            ).colorScheme.outlineVariant.withValues(alpha: 0.6),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                texts.summaryTitle,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                formatVnd(totalOutstandingDebt),
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: debtColor,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.receipt_long_outlined, size: 18),
                  const SizedBox(width: 6),
                  Text(
                    texts.outstandingOrdersLabel(debtOrderCount),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.account_balance_wallet_outlined, size: 18),
                  const SizedBox(width: 6),
                  Text(
                    '${texts.creditLimitLabel}: ${texts.creditLimitValue(creditLimit)}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DebtOrdersGrid extends StatelessWidget {
  const _DebtOrdersGrid({
    required this.orders,
    required this.isTablet,
    required this.texts,
  });

  final List<Order> orders;
  final bool isTablet;
  final _DebtTexts texts;

  @override
  Widget build(BuildContext context) {
    if (!isTablet) {
      return Column(
        children: [
          ...orders.asMap().entries.map((entry) {
            final index = entry.key;
            final order = entry.value;
            return FadeSlideIn(
              key: ValueKey('debt-${order.id}'),
              delay: Duration(milliseconds: 90 + index * 40),
              child: Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _DebtOrderCard(order: order, texts: texts),
              ),
            );
          }),
        ],
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        const spacing = 10.0;
        final itemWidth = (constraints.maxWidth - spacing) / 2;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            ...orders.asMap().entries.map((entry) {
              final index = entry.key;
              final order = entry.value;
              return SizedBox(
                width: itemWidth,
                child: FadeSlideIn(
                  key: ValueKey('debt-grid-${order.id}'),
                  delay: Duration(milliseconds: 90 + index * 40),
                  child: _DebtOrderCard(order: order, texts: texts),
                ),
              );
            }),
          ],
        );
      },
    );
  }
}

class _DebtOrderCard extends StatelessWidget {
  const _DebtOrderCard({required this.order, required this.texts});

  final Order order;
  final _DebtTexts texts;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = Theme.of(context).colorScheme;
    final debtColor = isDark
        ? const Color(0xFFFBBF24)
        : const Color(0xFFB45309);
    final paidRatio = order.total <= 0
        ? 0.0
        : (order.paidAmount / order.total).clamp(0.0, 1.0);

    return Semantics(
      container: true,
      label: texts.debtCardSemantics(
        orderId: order.id,
        outstanding: formatVnd(order.outstandingAmount),
      ),
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: colors.outlineVariant.withValues(alpha: 0.6)),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _openOrderDetail(context),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        order.id,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    _StatusChip(
                      label: texts.paymentStatusLabel(order.paymentStatus),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                _LabelValueRow(
                  label: texts.orderDateLabel,
                  value: formatDateTime(order.createdAt),
                ),
                const SizedBox(height: 6),
                _LabelValueRow(
                  label: texts.paymentMethodLabel,
                  value: texts.paymentMethod(order.paymentMethod),
                ),
                const SizedBox(height: 6),
                _LabelValueRow(
                  label: texts.totalAmountLabel,
                  value: formatVnd(order.total),
                ),
                const SizedBox(height: 6),
                _LabelValueRow(
                  label: texts.paidAmountLabel,
                  value: formatVnd(order.paidAmount),
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: paidRatio,
                    minHeight: 7,
                    backgroundColor: colors.surfaceContainerHighest,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  texts.paymentProgress(
                    paid: formatVnd(order.paidAmount),
                    total: formatVnd(order.total),
                  ),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF422006)
                        : const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.account_balance_wallet_outlined,
                        size: 18,
                        color: debtColor,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          texts.outstandingAmountLabel(order.outstandingAmount),
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: debtColor,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _openOrderDetail(context),
                        icon: const Icon(Icons.receipt_long_outlined, size: 18),
                        label: Text(texts.viewOrderButton),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () =>
                            _showRecordPaymentBottomSheet(context, order),
                        icon: const Icon(Icons.payments_outlined, size: 18),
                        label: Text(texts.recordPaymentButton),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openOrderDetail(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)),
    );
  }

  Future<void> _showRecordPaymentBottomSheet(
    BuildContext context,
    Order order,
  ) async {
    final uploadService = UploadService();
    final colors = Theme.of(context).colorScheme;
    final amountController = TextEditingController();
    final noteController = TextEditingController();
    final proofController = TextEditingController();
    final channels = texts.paymentChannels;
    var channel = order.paymentMethod == OrderPaymentMethod.debt
        ? channels.last
        : channels.first;
    var isSubmitting = false;
    var isUploadingProof = false;

    await showModalBottomSheet<void>(
      context: context,
      useSafeArea: true,
      requestFocus: true,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetRootContext) {
        String? pickedFileName;
        return StatefulBuilder(
          builder: (sheetContext, setDialogState) {
            final rawAmount = int.tryParse(amountController.text.trim()) ?? 0;
            final amountPreview = rawAmount > 0
                ? formatVnd(rawAmount)
                : texts.amountPreviewPlaceholder;

            return Padding(
              padding: EdgeInsets.fromLTRB(
                16,
                8,
                16,
                MediaQuery.viewInsetsOf(sheetContext).bottom + 16,
              ),
              child: SingleChildScrollView(
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 560),
                    child: Semantics(
                      container: true,
                      label: texts.recordPaymentDialogTitle,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            texts.recordPaymentDialogTitle,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: colors.surfaceContainerHighest.withValues(
                                alpha: 0.45,
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              texts.orderIdAndOutstanding(
                                orderId: order.id,
                                outstanding: formatVnd(order.outstandingAmount),
                              ),
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: amountController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                            ],
                            onChanged: (_) => setDialogState(() {}),
                            decoration: InputDecoration(
                              labelText: texts.paymentAmountLabel,
                              hintText: texts.maxAmountHint(
                                formatVnd(order.outstandingAmount),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            texts.amountPreview(amountPreview),
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: colors.onSurfaceVariant,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          const SizedBox(height: 10),
                          DropdownButtonFormField<String>(
                            initialValue: channel,
                            decoration: InputDecoration(
                              labelText: texts.paymentChannelLabel,
                            ),
                            items: channels
                                .map(
                                  (item) => DropdownMenuItem<String>(
                                    value: item,
                                    child: Text(item),
                                  ),
                                )
                                .toList(),
                            onChanged: (value) {
                              if (value == null) {
                                return;
                              }
                              setDialogState(() => channel = value);
                            },
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: noteController,
                            decoration: InputDecoration(
                              labelText: texts.noteLabel,
                            ),
                          ),
                          const SizedBox(height: 10),
                          OutlinedButton.icon(
                            onPressed: isUploadingProof
                                ? null
                                : () async {
                                    final picked = await ImagePicker()
                                        .pickImage(source: ImageSource.gallery);
                                    if (picked == null) {
                                      return;
                                    }
                                    setDialogState(() {
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
                                      if (sheetRootContext.mounted) {
                                        setDialogState(() {
                                          proofController.text = storedFileName;
                                        });
                                      }
                                      ScaffoldMessenger.of(context)
                                        ..hideCurrentSnackBar()
                                        ..showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              texts.proofAttachedSuccess(
                                                picked.name,
                                              ),
                                            ),
                                          ),
                                        );
                                    } catch (error) {
                                      if (!context.mounted) {
                                        return;
                                      }
                                      ScaffoldMessenger.of(context)
                                        ..hideCurrentSnackBar()
                                        ..showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              texts.proofUploadFailed('$error'),
                                            ),
                                          ),
                                        );
                                    } finally {
                                      if (sheetRootContext.mounted) {
                                        setDialogState(() {
                                          isUploadingProof = false;
                                        });
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
                                : const Icon(
                                    Icons.attach_file_outlined,
                                    size: 18,
                                  ),
                            label: Text(
                              isUploadingProof
                                  ? texts.attachingProofLabel
                                  : (pickedFileName ?? texts.attachProofButton),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: isSubmitting || isUploadingProof
                                      ? null
                                      : () => Navigator.of(
                                          sheetRootContext,
                                        ).pop(),
                                  child: Text(texts.cancelButton),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: isSubmitting || isUploadingProof
                                      ? null
                                      : () async {
                                          final parsedAmount =
                                              int.tryParse(
                                                amountController.text.trim(),
                                              ) ??
                                              0;
                                          if (parsedAmount <= 0) {
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  texts.amountMustBePositive,
                                                ),
                                              ),
                                            );
                                            return;
                                          }
                                          if (parsedAmount >
                                              order.outstandingAmount) {
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  texts.amountExceeded(
                                                    formatVnd(
                                                      order.outstandingAmount,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            );
                                            return;
                                          }

                                          if (parsedAmount >=
                                              _DebtTexts
                                                  .largePaymentConfirmThreshold) {
                                            final confirmLargePayment =
                                                await _confirmLargePayment(
                                                  context: context,
                                                  amount: parsedAmount,
                                                  orderId: order.id,
                                                  texts: texts,
                                                );
                                            if (!context.mounted) {
                                              return;
                                            }
                                            if (confirmLargePayment != true) {
                                              return;
                                            }
                                          }

                                          setDialogState(
                                            () => isSubmitting = true,
                                          );
                                          final success =
                                              await OrderScope.of(
                                                context,
                                              ).recordPayment(
                                                orderId: order.id,
                                                amount: parsedAmount,
                                                channel: channel,
                                                note:
                                                    noteController.text
                                                        .trim()
                                                        .isEmpty
                                                    ? null
                                                    : noteController.text
                                                          .trim(),
                                                proofFileName:
                                                    proofController.text
                                                        .trim()
                                                        .isEmpty
                                                    ? null
                                                    : proofController.text
                                                          .trim(),
                                              );
                                          setDialogState(
                                            () => isSubmitting = false,
                                          );

                                          if (!context.mounted) {
                                            return;
                                          }
                                          if (!success) {
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  texts.recordPaymentFailed,
                                                ),
                                              ),
                                            );
                                            return;
                                          }

                                          Navigator.of(sheetRootContext).pop();
                                          ScaffoldMessenger.of(context)
                                            ..hideCurrentSnackBar()
                                            ..showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  texts.paymentRecordedSuccess(
                                                    amount: formatVnd(
                                                      parsedAmount,
                                                    ),
                                                    orderId: order.id,
                                                  ),
                                                ),
                                              ),
                                            );
                                        },
                                  child: isSubmitting
                                      ? const SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.4,
                                          ),
                                        )
                                      : Text(texts.confirmButton),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );

    amountController.dispose();
    noteController.dispose();
    proofController.dispose();
  }

  Future<bool?> _confirmLargePayment({
    required BuildContext context,
    required int amount,
    required String orderId,
    required _DebtTexts texts,
  }) {
    return showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(texts.largePaymentConfirmTitle),
          content: Text(
            texts.largePaymentConfirmMessage(
              amount: formatVnd(amount),
              orderId: orderId,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(texts.cancelButton),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(texts.continueButton),
            ),
          ],
        );
      },
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final chipBg = isDark ? const Color(0xFF422006) : const Color(0xFFFFF7ED);
    final chipText = isDark ? const Color(0xFFFCD34D) : const Color(0xFF9A3412);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: chipBg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: chipText,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _PaymentHistoryCard extends StatelessWidget {
  const _PaymentHistoryCard({required this.payment, required this.texts});

  final DebtPaymentRecord payment;
  final _DebtTexts texts;

  IconData _iconForChannel(String channel) {
    final normalized = channel.toLowerCase();
    if (normalized.contains('chuyển khoản') ||
        normalized.contains('chuyển khoản') ||
        normalized.contains('bank transfer')) {
      return Icons.account_balance_outlined;
    }
    if (normalized.contains('tiền mặt') ||
        normalized.contains('tien mat') ||
        normalized.contains('cash')) {
      return Icons.money_outlined;
    }
    if (normalized.contains('bù trừ') ||
        normalized.contains('bu tru') ||
        normalized.contains('debt') ||
        normalized.contains('offset')) {
      return Icons.swap_horiz_outlined;
    }
    return Icons.payments_outlined;
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final channel = texts.paymentChannelDisplay(payment.channel);

    return Semantics(
      container: true,
      label: texts.paymentHistorySemantics(
        orderId: payment.orderId,
        amount: formatVnd(payment.amount),
        channel: channel,
      ),
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: colors.outlineVariant.withValues(alpha: 0.6)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: colors.primaryContainer.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      _iconForChannel(channel),
                      size: 18,
                      color: colors.onPrimaryContainer,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          texts.orderPrefix(payment.orderId),
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: colors.onSurfaceVariant,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          formatVnd(payment.amount),
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(
                                color: colors.primary,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                      ],
                    ),
                  ),
                  if (payment.proofFileName != null)
                    Tooltip(
                      message: payment.proofFileName!,
                      child: Icon(
                        Icons.attachment_outlined,
                        size: 20,
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: colors.secondaryContainer.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      channel,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.onSecondaryContainer,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Text(
                    formatDateTime(payment.paidAt),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              if (payment.note != null && payment.note!.trim().isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  texts.noteValue(payment.note!.trim()),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
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

class _LabelValueRow extends StatelessWidget {
  const _LabelValueRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
          ),
        ),
        const SizedBox(width: 12),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 26, color: colors.onSurfaceVariant),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class _DebtTexts {
  _DebtTexts({required this.isEnglish});

  static const int largePaymentConfirmThreshold = 50000000;

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Debt tracking' : 'Công nợ';
  String get debtOrdersSectionTitle =>
      isEnglish ? 'Outstanding orders' : 'Đơn hàng còn nợ';
  String get paymentHistorySectionTitle =>
      isEnglish ? 'Payment history' : 'Lịch sử thanh toán';
  String get debtOrdersEmptyTitle =>
      isEnglish ? 'No outstanding orders' : 'Không còn đơn nợ';
  String get debtOrdersEmptySubtitle => isEnglish
      ? 'All eligible orders are fully paid.'
      : 'Tất cả đơn hàng đủ điều kiện đã được thanh toán.';
  String get paymentHistoryEmptyTitle =>
      isEnglish ? 'No payment history' : 'Chưa có lịch sử thanh toán';
  String get paymentHistoryEmptySubtitle => isEnglish
      ? 'Recorded debt payments will appear here.'
      : 'Các giao dịch ghi nhận thanh toán sẽ hiển thị tại đây.';
  String get summaryTitle =>
      isEnglish ? 'Current outstanding debt' : 'Tổng công nợ hiện tại';
  String get orderDateLabel => isEnglish ? 'Order date' : 'Ngày đặt';
  String get paymentMethodLabel => isEnglish ? 'Payment method' : 'Phương thức';
  String get totalAmountLabel => isEnglish ? 'Order total' : 'Tổng đơn';
  String get paidAmountLabel => isEnglish ? 'Paid amount' : 'Đã thanh toán';
  String get viewOrderButton => isEnglish ? 'View order' : 'Xem đơn';
  String get recordPaymentButton =>
      isEnglish ? 'Record payment' : 'Ghi nhận thanh toán';
  String get recordPaymentDialogTitle =>
      isEnglish ? 'Record debt payment' : 'Ghi nhận thanh toán';
  String get paymentAmountLabel =>
      isEnglish ? 'Payment amount' : 'Số tiền thanh toán';
  String get paymentChannelLabel =>
      isEnglish ? 'Payment channel' : 'Kênh thanh toán';
  String get noteLabel => isEnglish ? 'Note' : 'Ghi chú';
  String get attachProofButton =>
      isEnglish ? 'Attach payment proof' : 'Đính kèm chứng từ';
  String get attachingProofLabel =>
      isEnglish ? 'Uploading proof...' : 'Đang tải chứng từ...';
  String get cancelButton => isEnglish ? 'Cancel' : 'Hủy';
  String get confirmButton => isEnglish ? 'Confirm' : 'Xác nhận';
  String get continueButton => isEnglish ? 'Continue' : 'Tiếp tục';
  String get amountPreviewPlaceholder => '0 ₫';
  String get amountMustBePositive =>
      isEnglish ? 'Amount must be greater than 0.' : 'Số tiền phải lớn hơn 0.';
  String get recordPaymentFailed => isEnglish
      ? 'Unable to record payment. Please check data and try again.'
      : 'Không thể ghi nhận thanh toán. Vui lòng kiểm tra lại dữ liệu.';
  String get largePaymentConfirmTitle =>
      isEnglish ? 'Confirm large payment' : 'Xác nhận khoản thanh toán lớn';

  String get creditLimitLabel => isEnglish ? 'Credit limit' : 'Hạn mức công nợ';

  String creditLimitValue(int amount) {
    if (amount <= 0) {
      return isEnglish ? 'Not set' : 'Chưa cài đặt';
    }
    return formatVnd(amount);
  }

  String summarySemantics({required String amount, required int orderCount}) {
    if (isEnglish) {
      return 'Outstanding debt $amount across $orderCount orders.';
    }
    return 'Tổng công nợ $amount, gồm $orderCount đơn hàng.';
  }

  String debtCardSemantics({
    required String orderId,
    required String outstanding,
  }) {
    if (isEnglish) {
      return 'Order $orderId has outstanding amount $outstanding.';
    }
    return 'Đơn $orderId còn nợ $outstanding.';
  }

  String paymentHistorySemantics({
    required String orderId,
    required String amount,
    required String channel,
  }) {
    if (isEnglish) {
      return 'Payment $amount for order $orderId via $channel.';
    }
    return 'Thanh toán $amount cho đơn $orderId qua kênh $channel.';
  }

  String outstandingOrdersLabel(int count) {
    if (isEnglish) {
      return '$count outstanding orders';
    }
    return '$count đơn hàng còn nợ';
  }

  String outstandingAmountLabel(int amount) {
    final value = formatVnd(amount);
    if (isEnglish) {
      return 'Outstanding: $value';
    }
    return 'Còn nợ: $value';
  }

  String paymentProgress({required String paid, required String total}) {
    if (isEnglish) {
      return 'Paid $paid / $total';
    }
    return 'Đã thanh toán $paid / $total';
  }

  String orderPrefix(String orderId) {
    if (isEnglish) {
      return 'Order $orderId';
    }
    return 'Đơn $orderId';
  }

  String noteValue(String note) {
    if (isEnglish) {
      return 'Note: $note';
    }
    return 'Ghi chú: $note';
  }

  String orderIdAndOutstanding({
    required String orderId,
    required String outstanding,
  }) {
    if (isEnglish) {
      return 'Order: $orderId\nOutstanding: $outstanding';
    }
    return 'Đơn: $orderId\nCòn nợ: $outstanding';
  }

  String maxAmountHint(String maxAmount) {
    if (isEnglish) {
      return 'Maximum $maxAmount';
    }
    return 'Tối đa $maxAmount';
  }

  String amountPreview(String value) {
    if (isEnglish) {
      return 'Formatted amount: $value';
    }
    return 'Số tiền đã định dạng: $value';
  }

  String amountExceeded(String maxAmount) {
    if (isEnglish) {
      return 'Amount cannot exceed $maxAmount.';
    }
    return 'Số tiền không được vượt quá $maxAmount.';
  }

  String paymentRecordedSuccess({
    required String amount,
    required String orderId,
  }) {
    if (isEnglish) {
      return 'Recorded payment $amount for order $orderId.';
    }
    return 'Đã ghi nhận thanh toán $amount cho đơn $orderId.';
  }

  String proofAttachedSuccess(String fileName) {
    if (isEnglish) {
      return 'Attached proof $fileName.';
    }
    return 'Đã đính kèm chứng từ $fileName.';
  }

  String proofUploadFailed(String error) {
    if (isEnglish) {
      return 'Unable to upload proof: $error';
    }
    return 'Không thể tải chứng từ: $error';
  }

  String largePaymentConfirmMessage({
    required String amount,
    required String orderId,
  }) {
    if (isEnglish) {
      return 'You are recording a large payment of $amount for order $orderId. Continue?';
    }
    return 'Bạn đang ghi nhận khoản thanh toán lớn $amount cho đơn $orderId. Tiếp tục?';
  }

  String paymentStatusLabel(OrderPaymentStatus status) {
    if (isEnglish) {
      switch (status) {
        case OrderPaymentStatus.cancelled:
          return 'Cancelled';
        case OrderPaymentStatus.failed:
          return 'Failed';
        case OrderPaymentStatus.unpaid:
          return 'Unpaid';
        case OrderPaymentStatus.paid:
          return 'Paid';
        case OrderPaymentStatus.debtRecorded:
          return 'Debt recorded';
      }
    }
    return status.label;
  }

  String paymentMethod(OrderPaymentMethod method) {
    if (isEnglish) {
      switch (method) {
        case OrderPaymentMethod.bankTransfer:
          return 'Bank transfer';
        case OrderPaymentMethod.debt:
          return 'Debt recording';
      }
    }
    return method.label;
  }

  String paymentChannelDisplay(String channel) {
    if (!isEnglish) {
      return channel;
    }
    final normalized = channel.trim().toLowerCase();
    if (normalized.contains('bank transfer') ||
        normalized.contains('chuyển khoản') ||
        normalized.contains('chuyển khoản')) {
      return 'Bank transfer';
    }
    if (normalized.contains('cash') ||
        normalized.contains('tiền mặt') ||
        normalized.contains('tien mat')) {
      return 'Cash';
    }
    if (normalized.contains('offset') ||
        normalized.contains('debt') ||
        normalized.contains('bù trừ') ||
        normalized.contains('bu tru')) {
      return 'Debt offset';
    }
    return channel;
  }

  List<String> get paymentChannels {
    if (isEnglish) {
      return const <String>['Bank transfer', 'Cash', 'Debt offset'];
    }
    return const <String>['Chuyển khoản', 'Tiền mặt', 'Bù trừ công nợ'];
  }
}
