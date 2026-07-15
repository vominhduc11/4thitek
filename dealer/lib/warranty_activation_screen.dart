import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dealer_routes.dart';
import 'models.dart';
import 'order_controller.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'validation_utils.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';

part 'warranty_activation_lifecycle.dart';
part 'warranty_activation_serials.dart';
part 'warranty_activation_form.dart';
part 'warranty_activation_texts.dart';
part 'warranty_activation_widgets.dart';

const double _serialSectionGap = 18;
const double _serialItemGap = 16;
const double _serialMinTapTarget = 48;

enum _SerialAssignResult { assigned, duplicate, invalid, full }

enum _ActivationPhase { idle, syncing, prefilling, ready, submitting, error }

class WarrantyActivationScreen extends StatefulWidget {
  const WarrantyActivationScreen({
    super.key,
    required this.orderId,
    this.prefilledSerial,
    this.prefilledProductId,
  });

  final String orderId;
  final String? prefilledSerial;
  final String? prefilledProductId;

  @override
  State<WarrantyActivationScreen> createState() =>
      _WarrantyActivationScreenState();
}

class _WarrantyActivationScreenState extends State<WarrantyActivationScreen> {
  final _customerNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final Map<String, List<TextEditingController>> _serialControllers = {};
  DateTime _purchaseDate = DateTime.now();
  _ActivationPhase _phase = _ActivationPhase.idle;
  String? _phaseError;
  String? _initialSyncWarning;

  _WarrantyActivationTexts get _texts => _WarrantyActivationTexts(
    isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_phase != _ActivationPhase.idle) {
      return;
    }
    unawaited(_initializeScreen());
  }

  @override
  void dispose() {
    for (final inputList in _serialControllers.values) {
      for (final controller in inputList) {
        controller.dispose();
      }
    }
    _customerNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final texts = _texts;
    if (_phase == _ActivationPhase.syncing ||
        _phase == _ActivationPhase.prefilling) {
      return _ActivationStateScaffold(
        title: texts.screenTitle,
        icon: Icons.sync_outlined,
        headline: texts.loadingTitle,
        message: texts.loadingDescription,
        isLoading: true,
      );
    }
    if (_phase == _ActivationPhase.error) {
      return _ActivationStateScaffold(
        title: texts.screenTitle,
        icon: Icons.error_outline,
        headline: texts.screenErrorTitle,
        message: _phaseError ?? texts.activationSyncFailedMessage,
        tone: _ActivationStateTone.error,
        action: FilledButton.icon(
          onPressed: () => unawaited(_initializeScreen()),
          icon: const Icon(Icons.refresh),
          label: Text(texts.retryAction),
        ),
      );
    }
    final order = OrderScope.of(context).findById(widget.orderId);
    if (order == null) {
      return _ActivationStateScaffold(
        title: texts.screenTitle,
        icon: Icons.receipt_long_outlined,
        headline: texts.orderNotFoundTitle,
        message: texts.orderNotFoundMessage,
      );
    }

    final canProcess = order.status == OrderStatus.completed;
    if (!canProcess) {
      return _ActivationStateScaffold(
        title: texts.screenTitle,
        icon: Icons.lock_outline,
        headline: texts.cannotProcessTitle,
        message:
            '${texts.cannotProcessMessage}\n${texts.currentStatusLabel(texts.orderStatusLabel(order.status))}',
      );
    }

    final warrantyController = WarrantyScope.of(context);
    final orderActivations = warrantyController.activationsForOrder(order.id);
    final activatedCount = orderActivations.length;
    final totalCount = order.totalItems;
    final isFullyActivated = activatedCount >= totalCount;
    final hasOrderCustomerData = _hasOrderCustomerProfile(order);
    final lockNameField = isFullyActivated;
    final lockPhoneField = isFullyActivated;
    final lockAddressField = isFullyActivated;
    final progressValue = totalCount == 0 ? 0.0 : activatedCount / totalCount;
    final colorScheme = Theme.of(context).colorScheme;
    final isTablet =
        MediaQuery.sizeOf(context).shortestSide >= AppBreakpoints.phone;
    final screenWidth = MediaQuery.sizeOf(context).width;
    final useWideCustomerFields = screenWidth >= 960;
    final maxWidth = isTablet ? 1040.0 : double.infinity;
    final submitMaxWidth = isTablet ? 420.0 : double.infinity;
    const itemProgressColor = Color(0xFF4ADE80);
    final isFormReady = _phase == _ActivationPhase.ready;

    return Scaffold(
      appBar: AppBar(
        leading: const DealerFallbackBackButton(
          fallbackPath: DealerRoutePath.home,
        ),
        title: BrandAppBarTitle(texts.screenTitle),
      ),
      body: Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: ListView(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              if (_initialSyncWarning != null) ...[
                FadeSlideIn(
                  child: _SectionCard(
                    title: texts.syncWarningTitle,
                    child: Text(_initialSyncWarning!),
                  ),
                ),
                const SizedBox(height: _serialSectionGap),
              ],
              FadeSlideIn(
                child: _SectionCard(
                  title: texts.processingInfoTitle,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _InfoRow(label: texts.orderIdLabel, value: order.id),
                      const SizedBox(height: 10),
                      _InfoRow(
                        label: texts.orderDateLabel,
                        value: formatDateTime(order.createdAt),
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1),
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: colorScheme.surfaceContainerHighest.withValues(
                            alpha: 0.48,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: colorScheme.outlineVariant.withValues(
                              alpha: 0.8,
                            ),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _InfoRow(
                              label: texts.progressLabel,
                              value: texts.serialProgressValue(
                                activatedCount,
                                totalCount,
                              ),
                              isEmphasis: true,
                            ),
                            const SizedBox(height: 8),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(999),
                              child: LinearProgressIndicator(
                                value: progressValue,
                                minHeight: 8,
                                backgroundColor: colorScheme
                                    .surfaceContainerHighest
                                    .withValues(alpha: 0.9),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  colorScheme.primary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        texts.inventoryValidationHint,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (useWideCustomerFields)
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _customerNameController,
                                enabled: isFormReady && !lockNameField,
                                decoration: InputDecoration(
                                  labelText: texts.customerNameLabel,
                                  prefixIcon: const Icon(Icons.person_outline),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextField(
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                enabled: isFormReady && !isFullyActivated,
                                decoration: InputDecoration(
                                  labelText: texts.customerEmailLabel,
                                  prefixIcon: const Icon(
                                    Icons.alternate_email_outlined,
                                  ),
                                  helperText: texts.customerEmailHelper,
                                ),
                              ),
                            ),
                          ],
                        )
                      else ...[
                        TextField(
                          controller: _customerNameController,
                          enabled: isFormReady && !lockNameField,
                          decoration: InputDecoration(
                            labelText: texts.customerNameLabel,
                            prefixIcon: const Icon(Icons.person_outline),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          enabled: isFormReady && !isFullyActivated,
                          decoration: InputDecoration(
                            labelText: texts.customerEmailLabel,
                            prefixIcon: const Icon(
                              Icons.alternate_email_outlined,
                            ),
                            helperText: texts.customerEmailHelper,
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      if (useWideCustomerFields)
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _phoneController,
                                keyboardType: TextInputType.phone,
                                enabled: isFormReady && !lockPhoneField,
                                decoration: InputDecoration(
                                  labelText: texts.customerPhoneLabel,
                                  prefixIcon: const Icon(Icons.phone_outlined),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextField(
                                controller: _addressController,
                                enabled: isFormReady && !lockAddressField,
                                decoration: InputDecoration(
                                  labelText: texts.customerAddressLabel,
                                  prefixIcon: const Icon(
                                    Icons.location_on_outlined,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        )
                      else ...[
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          enabled: isFormReady && !lockPhoneField,
                          decoration: InputDecoration(
                            labelText: texts.customerPhoneLabel,
                            prefixIcon: const Icon(Icons.phone_outlined),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _addressController,
                          enabled: isFormReady && !lockAddressField,
                          decoration: InputDecoration(
                            labelText: texts.customerAddressLabel,
                            prefixIcon: const Icon(Icons.location_on_outlined),
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: !isFormReady || isFullyActivated
                            ? null
                            : _pickPurchaseDate,
                        icon: const Icon(Icons.event_outlined),
                        label: Text(
                          texts.purchaseDateLabel(formatDate(_purchaseDate)),
                        ),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size.fromHeight(52),
                          alignment: Alignment.centerLeft,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        texts.purchaseDateHint,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      if (hasOrderCustomerData) ...[
                        const SizedBox(height: 8),
                        Text(
                          texts.prefilledCustomerHint,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: _serialSectionGap),
              ...order.items.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                final activated = warrantyController.activationsForItem(
                  order.id,
                  item.product.id,
                );
                final remaining = item.quantity - activated.length;
                final serialInputs =
                    _serialControllers[item.product.id] ?? const [];
                final availableSerials = warrantyController
                    .availableImportedSerialsForOrderItem(
                      order.id,
                      item.product.id,
                    );
                final shouldAnimate = index < 4;

                return Padding(
                  padding: const EdgeInsets.only(bottom: _serialItemGap),
                  child: shouldAnimate
                      ? FadeSlideIn(
                          key: ValueKey('line-${item.product.id}'),
                          delay: Duration(milliseconds: 60 + 40 * index),
                          child: RepaintBoundary(
                            child: _SectionCard(
                              title:
                                  '${item.product.name} (${item.product.sku})',
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _InfoRow(
                                    label: texts.quantityLabel,
                                    value: '${item.quantity}',
                                  ),
                                  const SizedBox(height: 10),
                                  _InfoRow(
                                    label: texts.activatedCountLabel,
                                    value:
                                        '${activated.length}/${item.quantity}',
                                  ),
                                  const SizedBox(height: 10),
                                  _InfoRow(
                                    label: texts.availableInventorySerialsLabel,
                                    value: '${availableSerials.length}',
                                  ),
                                  const SizedBox(height: 12),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(999),
                                    child: LinearProgressIndicator(
                                      value: item.quantity == 0
                                          ? 0
                                          : activated.length / item.quantity,
                                      minHeight: 7,
                                      backgroundColor: colorScheme
                                          .surfaceContainerHighest
                                          .withValues(alpha: 0.9),
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        itemProgressColor,
                                      ),
                                    ),
                                  ),
                                  if (activated.isNotEmpty) ...[
                                    const SizedBox(height: 12),
                                    const Divider(height: 1),
                                    const SizedBox(height: 12),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: activated
                                          .map(
                                            (record) => Chip(
                                              label: Text(
                                                '${record.serial} (${formatDate(record.startsAt)} - ${formatDate(record.expiresAt)})',
                                              ),
                                              avatar: const Icon(
                                                Icons.verified_outlined,
                                                size: 16,
                                              ),
                                            ),
                                          )
                                          .toList(growable: false),
                                    ),
                                  ],
                                  if (remaining > 0) ...[
                                    const SizedBox(height: 12),
                                    const Divider(height: 1),
                                    const SizedBox(height: 12),
                                    Text(
                                      texts.remainingSerialsLabel(remaining),
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(
                                            fontWeight: FontWeight.w600,
                                          ),
                                    ),
                                    const SizedBox(height: 10),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: [
                                        OutlinedButton.icon(
                                          onPressed:
                                              !isFormReady || isFullyActivated
                                              ? null
                                              : () => _scanSerialForItem(
                                                  order,
                                                  item,
                                                  warrantyController,
                                                ),
                                          icon: const Icon(
                                            Icons.qr_code_scanner_outlined,
                                          ),
                                          label: Text(texts.scanQrAction),
                                          style: OutlinedButton.styleFrom(
                                            minimumSize: const Size(
                                              0,
                                              _serialMinTapTarget,
                                            ),
                                          ),
                                        ),
                                        TextButton.icon(
                                          onPressed:
                                              !isFormReady || isFullyActivated
                                              ? null
                                              : () => _showBulkPasteDialog(
                                                  order,
                                                  item,
                                                  warrantyController,
                                                ),
                                          icon: const Icon(
                                            Icons.content_paste_rounded,
                                          ),
                                          label: Text(texts.bulkPasteAction),
                                          style: TextButton.styleFrom(
                                            minimumSize: const Size(
                                              0,
                                              _serialMinTapTarget,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    ...serialInputs.asMap().entries.map((
                                      serialEntry,
                                    ) {
                                      final serialIndex = serialEntry.key;
                                      final controller = serialEntry.value;
                                      return Padding(
                                        padding: const EdgeInsets.only(
                                          bottom: 10,
                                        ),
                                        child: TextField(
                                          controller: controller,
                                          textCapitalization:
                                              TextCapitalization.characters,
                                          enabled:
                                              isFormReady && !isFullyActivated,
                                          inputFormatters: [
                                            FilteringTextInputFormatter.allow(
                                              RegExp(r'[A-Za-z0-9-]'),
                                            ),
                                          ],
                                          decoration: InputDecoration(
                                            labelText: texts.serialFieldLabel(
                                              serialIndex + 1,
                                              remaining,
                                            ),
                                            prefixIcon: const Icon(
                                              Icons
                                                  .confirmation_number_outlined,
                                            ),
                                            helperText: texts.serialFieldHelper,
                                          ),
                                        ),
                                      );
                                    }),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        )
                      : RepaintBoundary(
                          child: _SectionCard(
                            title: '${item.product.name} (${item.product.sku})',
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _InfoRow(
                                  label: texts.quantityLabel,
                                  value: '${item.quantity}',
                                ),
                                const SizedBox(height: 10),
                                _InfoRow(
                                  label: texts.activatedCountLabel,
                                  value: '${activated.length}/${item.quantity}',
                                ),
                                const SizedBox(height: 10),
                                _InfoRow(
                                  label: texts.availableInventorySerialsLabel,
                                  value: '${availableSerials.length}',
                                ),
                                const SizedBox(height: 12),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(999),
                                  child: LinearProgressIndicator(
                                    value: item.quantity == 0
                                        ? 0
                                        : activated.length / item.quantity,
                                    minHeight: 7,
                                    backgroundColor: colorScheme
                                        .surfaceContainerHighest
                                        .withValues(alpha: 0.9),
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      itemProgressColor,
                                    ),
                                  ),
                                ),
                                if (activated.isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  const Divider(height: 1),
                                  const SizedBox(height: 12),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: activated
                                        .map(
                                          (record) => Chip(
                                            label: Text(
                                              '${record.serial} (${formatDate(record.startsAt)} - ${formatDate(record.expiresAt)})',
                                            ),
                                            avatar: const Icon(
                                              Icons.verified_outlined,
                                              size: 16,
                                            ),
                                          ),
                                        )
                                        .toList(growable: false),
                                  ),
                                ],
                                if (remaining > 0) ...[
                                  const SizedBox(height: 12),
                                  const Divider(height: 1),
                                  const SizedBox(height: 12),
                                  Text(
                                    texts.remainingSerialsLabel(remaining),
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(fontWeight: FontWeight.w600),
                                  ),
                                  const SizedBox(height: 10),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: [
                                      OutlinedButton.icon(
                                        onPressed:
                                            !isFormReady || isFullyActivated
                                            ? null
                                            : () => _scanSerialForItem(
                                                order,
                                                item,
                                                warrantyController,
                                              ),
                                        icon: const Icon(
                                          Icons.qr_code_scanner_outlined,
                                        ),
                                        label: Text(texts.scanQrAction),
                                        style: OutlinedButton.styleFrom(
                                          minimumSize: const Size(
                                            0,
                                            _serialMinTapTarget,
                                          ),
                                        ),
                                      ),
                                      TextButton.icon(
                                        onPressed:
                                            !isFormReady || isFullyActivated
                                            ? null
                                            : () => _showBulkPasteDialog(
                                                order,
                                                item,
                                                warrantyController,
                                              ),
                                        icon: const Icon(
                                          Icons.content_paste_rounded,
                                        ),
                                        label: Text(texts.bulkPasteAction),
                                        style: TextButton.styleFrom(
                                          minimumSize: const Size(
                                            0,
                                            _serialMinTapTarget,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  ...serialInputs.asMap().entries.map((
                                    serialEntry,
                                  ) {
                                    final serialIndex = serialEntry.key;
                                    final controller = serialEntry.value;
                                    return Padding(
                                      padding: const EdgeInsets.only(
                                        bottom: 10,
                                      ),
                                      child: TextField(
                                        controller: controller,
                                        textCapitalization:
                                            TextCapitalization.characters,
                                        enabled:
                                            isFormReady && !isFullyActivated,
                                        inputFormatters: [
                                          FilteringTextInputFormatter.allow(
                                            RegExp(r'[A-Za-z0-9-]'),
                                          ),
                                        ],
                                        decoration: InputDecoration(
                                          labelText: texts.serialFieldLabel(
                                            serialIndex + 1,
                                            remaining,
                                          ),
                                          prefixIcon: const Icon(
                                            Icons.confirmation_number_outlined,
                                          ),
                                          helperText: texts.serialFieldHelper,
                                        ),
                                      ),
                                    );
                                  }),
                                ],
                              ],
                            ),
                          ),
                        ),
                );
              }),
              RepaintBoundary(
                child: FadeSlideIn(
                  delay: const Duration(milliseconds: 240),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(maxWidth: submitMaxWidth),
                      child: SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed:
                              isFullyActivated ||
                                  _phase != _ActivationPhase.ready
                              ? null
                              : () => _handleSubmit(order),
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size.fromHeight(52),
                            elevation: 2,
                            shadowColor: colorScheme.primary.withValues(
                              alpha: 0.25,
                            ),
                            textStyle: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 15,
                            ),
                          ),
                          child: _phase == _ActivationPhase.submitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                  ),
                                )
                              : Text(
                                  isFullyActivated
                                      ? texts.fullyActivatedButtonLabel
                                      : texts.confirmActivationAction,
                                ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
