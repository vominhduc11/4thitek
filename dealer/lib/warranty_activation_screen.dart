import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'models.dart';
import 'order_controller.dart';
import 'serial_scan_screen.dart';
import 'utils.dart';
import 'validation_utils.dart';
import 'warranty_controller.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

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

  Future<void> _initializeScreen() async {
    if (_phase == _ActivationPhase.syncing ||
        _phase == _ActivationPhase.prefilling ||
        _phase == _ActivationPhase.submitting) {
      return;
    }
    if (mounted) {
      setState(() {
        _phase = _ActivationPhase.syncing;
        _phaseError = null;
      });
    }
    try {
      await _initializeScreenImpl();
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _phase = _ActivationPhase.error;
        _phaseError = error.toString();
      });
    }
  }

  Future<void> _initializeScreenImpl() async {
    final texts = _texts;
    final orderController = OrderScope.of(context);
    final warrantyController = WarrantyScope.of(context);
    await Future.wait<void>([
      orderController.refresh(),
      warrantyController.load(forceRefresh: true),
    ]);
    final warnings = <String>[];
    if (orderController.lastActionMessage != null) {
      warnings.add(
        orderControllerErrorMessage(
          orderController.lastActionMessage,
          isEnglish: texts.isEnglish,
        ),
      );
    }
    if (warrantyController.lastSyncMessage != null) {
      warnings.add(
        warrantySyncErrorMessage(
          warrantyController.lastSyncMessage,
          isEnglish: texts.isEnglish,
        ),
      );
    }
    _initialSyncWarning = warnings.isEmpty ? null : warnings.join('\n');

    if (!mounted) {
      return;
    }
    setState(() {
      _phase = _ActivationPhase.prefilling;
      _phaseError = null;
    });
    final order = orderController.findById(widget.orderId);
    if (order == null) {
      setState(() {
        _phase = _ActivationPhase.ready;
        _phaseError = null;
      });
      return;
    }

    setState(() {
      _syncSerialInputs(order, warrantyController);
      _applyPrefilledSerial(order, warrantyController);
      _prefillCustomerFromOrder(order);
      _purchaseDate = DateUtils.dateOnly(order.createdAt.toLocal());
      _phase = _ActivationPhase.ready;
      _phaseError = null;
    });
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
      appBar: AppBar(title: BrandAppBarTitle(texts.screenTitle)),
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

  void _syncSerialInputs(Order order, WarrantyController warrantyController) {
    for (final item in order.items) {
      final activated = warrantyController.activationsForItem(
        order.id,
        item.product.id,
      );
      final activatedSerials = activated
          .map((r) => warrantyController.normalizeSerial(r.serial))
          .toSet();
      final remaining = (item.quantity - activated.length).clamp(
        0,
        item.quantity,
      );
      final existing = _serialControllers[item.product.id] ?? [];

      List<TextEditingController> finalList;
      if (existing.length == remaining) {
        finalList = existing;
      } else if (existing.length > remaining) {
        // Remove extra controllers from the end
        final toDispose = existing.sublist(remaining);
        for (final controller in toDispose) {
          controller.dispose();
        }
        finalList = existing.sublist(0, remaining);
        _serialControllers[item.product.id] = finalList;
      } else {
        // Add more controllers
        final toAdd = remaining - existing.length;
        finalList = List<TextEditingController>.from(existing)
          ..addAll(List.generate(toAdd, (_) => TextEditingController()));
        _serialControllers[item.product.id] = finalList;
      }

      // Clear any input whose serial is now activated (e.g. after partial failure)
      for (final controller in finalList) {
        final normalized = warrantyController.normalizeSerial(controller.text);
        if (normalized.isNotEmpty && activatedSerials.contains(normalized)) {
          controller.clear();
        }
      }
    }
    // Remove entries for items no longer in the order
    final productIds = order.items.map((item) => item.product.id).toSet();
    final toRemove = _serialControllers.keys
        .where((id) => !productIds.contains(id))
        .toList();
    for (final id in toRemove) {
      for (final controller in _serialControllers[id]!) {
        controller.dispose();
      }
      _serialControllers.remove(id);
    }
  }

  void _applyPrefilledSerial(
    Order order,
    WarrantyController warrantyController,
  ) {
    final texts = _texts;
    final rawPrefilled = widget.prefilledSerial?.trim();
    if (rawPrefilled == null || rawPrefilled.isEmpty) {
      return;
    }

    final normalized = warrantyController.normalizeSerial(rawPrefilled);
    final imported = warrantyController.findImportedSerial(normalized);
    if (imported == null) {
      _showSnackBarDeferred(texts.serialNotFoundInInventory(normalized));
      return;
    }
    if (imported.orderId != order.id) {
      _showSnackBarDeferred(
        texts.serialBelongsToOtherOrder(normalized, imported.orderId, order.id),
      );
      return;
    }
    if (widget.prefilledProductId != null &&
        widget.prefilledProductId != imported.productId) {
      _showSnackBarDeferred(texts.serialProductMismatch(normalized));
      return;
    }

    final inputList = _serialControllers[imported.productId];
    if (inputList == null || inputList.isEmpty) {
      _showSnackBarDeferred(texts.noEmptySerialSlot(imported.productName));
      return;
    }

    final alreadyFilled = inputList.any(
      (controller) =>
          warrantyController.normalizeSerial(controller.text) == normalized,
    );
    if (alreadyFilled) {
      return;
    }

    TextEditingController? emptySlot;
    for (final controller in inputList) {
      if (controller.text.trim().isEmpty) {
        emptySlot = controller;
        break;
      }
    }
    if (emptySlot == null) {
      _showSnackBarDeferred(texts.productAlreadyFull(imported.productName));
      return;
    }

    emptySlot.text = normalized;
    _showSnackBarDeferred(texts.prefilledSerialAssigned(normalized));
  }

  void _prefillCustomerFromOrder(Order order) {
    if (order.receiverName.trim().isNotEmpty &&
        _customerNameController.text.trim().isEmpty) {
      _customerNameController.text = order.receiverName.trim();
    }
    if (order.receiverPhone.trim().isNotEmpty &&
        _phoneController.text.trim().isEmpty) {
      _phoneController.text = order.receiverPhone.trim();
    }
    if (order.receiverAddress.trim().isNotEmpty &&
        _addressController.text.trim().isEmpty) {
      _addressController.text = order.receiverAddress.trim();
    }
  }

  Future<void> _pickPurchaseDate() async {
    final texts = _texts;
    final now = DateUtils.dateOnly(DateTime.now());
    final order = OrderScope.of(context).findById(widget.orderId);
    final minimumDate = order == null
        ? DateTime(now.year - 5, 1, 1)
        : _minimumPurchaseDateForOrder(order);
    final effectiveFirstDate = minimumDate.isAfter(now) ? now : minimumDate;
    final effectiveInitialDate = _purchaseDate.isBefore(effectiveFirstDate)
        ? effectiveFirstDate
        : (_purchaseDate.isAfter(now) ? now : _purchaseDate);
    final picked = await showDatePicker(
      context: context,
      initialDate: effectiveInitialDate,
      firstDate: effectiveFirstDate,
      lastDate: now,
      helpText: texts.pickPurchaseDateHelp,
    );
    if (!mounted || picked == null) {
      return;
    }
    setState(() {
      _purchaseDate = DateUtils.dateOnly(picked);
    });
  }

  bool _hasOrderCustomerProfile(Order order) {
    return order.receiverName.trim().isNotEmpty ||
        order.receiverPhone.trim().isNotEmpty ||
        order.receiverAddress.trim().isNotEmpty;
  }

  DateTime _minimumPurchaseDateForOrder(Order order) {
    return DateUtils.dateOnly(order.createdAt.toLocal());
  }

  String? _validatePurchaseDateForOrder(Order order) {
    final texts = _texts;
    final normalizedPurchaseDate = DateUtils.dateOnly(_purchaseDate);
    final minimumDate = _minimumPurchaseDateForOrder(order);
    final today = DateUtils.dateOnly(DateTime.now());
    if (normalizedPurchaseDate.isBefore(minimumDate)) {
      return texts.purchaseDateBeforeOrder(formatDate(minimumDate));
    }
    if (normalizedPurchaseDate.isAfter(today)) {
      return texts.purchaseDateAfterToday;
    }
    return null;
  }

  Future<void> _scanSerialForItem(
    Order order,
    OrderLineItem item,
    WarrantyController warrantyController,
  ) async {
    final texts = _texts;
    final scannedValue = await Navigator.of(
      context,
    ).push<String>(MaterialPageRoute(builder: (_) => const SerialScanScreen()));
    if (!mounted || scannedValue == null) {
      return;
    }

    final result = _assignSerialToItem(
      order: order,
      item: item,
      rawSerial: scannedValue,
      warrantyController: warrantyController,
    );
    switch (result) {
      case _SerialAssignResult.assigned:
        _showSnackBar(texts.scannedSerialAssigned(item.product.name));
        break;
      case _SerialAssignResult.duplicate:
        _showSnackBar(texts.duplicateScannedSerialMessage);
        break;
      case _SerialAssignResult.invalid:
        _showSnackBar(texts.invalidScannedSerialMessage);
        break;
      case _SerialAssignResult.full:
        _showSnackBar(texts.noEmptySerialSlot(item.product.name));
        break;
    }
  }

  Future<void> _showBulkPasteDialog(
    Order order,
    OrderLineItem item,
    WarrantyController warrantyController,
  ) async {
    final texts = _texts;
    final textController = TextEditingController();
    final pastedText = await showDialog<String>(
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
          title: Text(texts.bulkPasteTitle),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: TextField(
              controller: textController,
              maxLines: 6,
              autofocus: true,
              decoration: InputDecoration(hintText: texts.bulkPasteHint),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(texts.cancelAction),
            ),
            FilledButton(
              onPressed: () =>
                  Navigator.of(dialogContext).pop(textController.text),
              child: Text(texts.fillSerialsAction),
            ),
          ],
        );
      },
    );
    textController.dispose();

    if (!mounted || pastedText == null || pastedText.trim().isEmpty) {
      return;
    }

    final serials = _parseSerialTokens(pastedText, warrantyController);
    if (serials.isEmpty) {
      _showSnackBar(texts.noValidSerialsFoundMessage);
      return;
    }

    var assignedCount = 0;
    var duplicateCount = 0;
    var invalidCount = 0;
    var fullCount = 0;

    for (final serial in serials) {
      final result = _assignSerialToItem(
        order: order,
        item: item,
        rawSerial: serial,
        warrantyController: warrantyController,
      );
      switch (result) {
        case _SerialAssignResult.assigned:
          assignedCount++;
          break;
        case _SerialAssignResult.duplicate:
          duplicateCount++;
          break;
        case _SerialAssignResult.invalid:
          invalidCount++;
          break;
        case _SerialAssignResult.full:
          fullCount++;
          break;
      }
      if (result == _SerialAssignResult.full) {
        break;
      }
    }

    _showSnackBar(
      texts.bulkPasteSummary(
        assignedCount,
        duplicateCount,
        invalidCount,
        fullCount,
      ),
    );
  }

  List<String> _parseSerialTokens(
    String raw,
    WarrantyController warrantyController,
  ) {
    final normalizedSet = <String>{};
    final chunks = raw.split(RegExp(r'[\n,; ]+'));
    for (final token in chunks) {
      final normalized = warrantyController.normalizeSerial(token);
      if (normalized.isNotEmpty) {
        normalizedSet.add(normalized);
      }
    }
    return normalizedSet.toList(growable: false);
  }

  _SerialAssignResult _assignSerialToItem({
    required Order order,
    required OrderLineItem item,
    required String rawSerial,
    required WarrantyController warrantyController,
  }) {
    final texts = _texts;
    final normalized = warrantyController.normalizeSerial(rawSerial);
    if (normalized.isEmpty) {
      return _SerialAssignResult.invalid;
    }

    final imported = warrantyController.findImportedSerial(normalized);
    if (imported == null ||
        imported.orderId != order.id ||
        imported.productId != item.product.id) {
      return _SerialAssignResult.invalid;
    }

    final inputList = _serialControllers[item.product.id] ?? const [];
    if (inputList.isEmpty) {
      return _SerialAssignResult.full;
    }

    final isDuplicate = inputList.any(
      (controller) =>
          warrantyController.normalizeSerial(controller.text) == normalized,
    );
    if (isDuplicate) {
      return _SerialAssignResult.duplicate;
    }

    final validationError = warrantyController.validateSerialForActivation(
      serial: normalized,
      productId: item.product.id,
      productName: item.product.name,
      orderId: order.id,
      isEnglish: texts.isEnglish,
    );
    if (validationError != null) {
      return _SerialAssignResult.invalid;
    }

    TextEditingController? emptySlot;
    for (final controller in inputList) {
      if (controller.text.trim().isEmpty) {
        emptySlot = controller;
        break;
      }
    }
    if (emptySlot == null) {
      return _SerialAssignResult.full;
    }

    setState(() => emptySlot!.text = normalized);
    return _SerialAssignResult.assigned;
  }

  Future<void> _handleSubmit(Order order) async {
    if (_phase != _ActivationPhase.ready) {
      return;
    }
    final texts = _texts;
    final warrantyController = WarrantyScope.of(context);
    final customerName = _customerNameController.text.trim();
    final customerEmail = _emailController.text.trim();
    final customerPhone = _phoneController.text.trim();
    final customerAddress = _addressController.text.trim();

    final preErrors = <String>[];
    if (customerName.isEmpty ||
        customerEmail.isEmpty ||
        customerPhone.isEmpty ||
        customerAddress.isEmpty) {
      preErrors.add(texts.customerInfoRequiredMessage);
    }
    if (customerEmail.isNotEmpty && !isValidEmailAddress(customerEmail)) {
      preErrors.add(texts.invalidEmailMessage);
    }
    if (customerPhone.isNotEmpty && !isValidVietnamPhoneNumber(customerPhone)) {
      preErrors.add(texts.invalidPhoneMessage);
    }
    final purchaseDateError = _validatePurchaseDateForOrder(order);
    if (purchaseDateError != null) preErrors.add(purchaseDateError);
    if (preErrors.isNotEmpty) {
      _showSnackBar(preErrors.join('\n'));
      return;
    }

    final newRecords = <WarrantyActivationRecord>[];
    final localSerialSet = <String>{};
    for (final item in order.items) {
      final serialInputs = _serialControllers[item.product.id] ?? const [];
      for (final controller in serialInputs) {
        final rawSerial = controller.text.trim();
        if (rawSerial.isEmpty) {
          _showSnackBar(texts.serialRequiredForProduct(item.product.name));
          return;
        }

        final normalized = warrantyController.normalizeSerial(rawSerial);
        if (localSerialSet.contains(normalized)) {
          _showSnackBar(texts.duplicateSerialInSubmission(normalized));
          return;
        }
        final serialValidationError = warrantyController
            .validateSerialForActivation(
              serial: normalized,
              productId: item.product.id,
              productName: item.product.name,
              orderId: order.id,
              isEnglish: texts.isEnglish,
            );
        if (serialValidationError != null) {
          _showSnackBar(serialValidationError);
          return;
        }
        localSerialSet.add(normalized);

        newRecords.add(
          WarrantyActivationRecord(
            orderId: order.id,
            productId: item.product.id,
            productName: item.product.name,
            productSku: item.product.sku,
            serial: normalized,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            warrantyMonths: item.product.warrantyMonths,
            activatedAt: DateTime.now(),
            purchaseDate: DateUtils.dateOnly(_purchaseDate),
          ),
        );
      }
    }

    if (newRecords.isEmpty) {
      _showSnackBar(texts.orderAlreadyFullyActivatedMessage);
      return;
    }

    setState(() {
      _phase = _ActivationPhase.submitting;
      _phaseError = null;
    });
    try {
      final success = await warrantyController.addActivations(newRecords);

      if (!mounted) {
        return;
      }

      // Always sync serial inputs so controllers match actual remaining count,
      // even on partial failure where some activations may have succeeded.
      setState(() {
        _syncSerialInputs(order, warrantyController);
        _phase = success ? _ActivationPhase.ready : _ActivationPhase.error;
        _phaseError = success
            ? null
            : warrantySyncErrorMessage(
                warrantyController.lastSyncMessage,
                isEnglish: texts.isEnglish,
              );
      });

      if (!success) {
        return;
      }

      _jumpToTop();
      _showSnackBar(texts.activationSuccessMessage(newRecords.length));
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _phase = _ActivationPhase.error;
        _phaseError = error.toString();
      });
    }
  }

  void _jumpToTop() {
    if (!_scrollController.hasClients) {
      return;
    }
    _scrollController.jumpTo(0);
  }

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  void _showSnackBarDeferred(String message) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      _showSnackBar(message);
    });
  }
}

class _WarrantyActivationTexts {
  const _WarrantyActivationTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Serial processing' : 'Xử lý serial';
  String get loadingTitle =>
      isEnglish ? 'Syncing serial data' : 'Đang đồng bộ dữ liệu serial';
  String get loadingDescription => isEnglish
      ? 'Please wait while the latest order and warranty inventory are prepared.'
      : 'Vui lòng chờ trong lúc hệ thống chuẩn bị dữ liệu đơn hàng và kho bảo hành mới nhất.';
  String get orderNotFoundTitle =>
      isEnglish ? 'Order not found' : 'Không tìm thấy đơn hàng';
  String get orderNotFoundMessage => isEnglish
      ? 'Cannot find the order for serial processing.'
      : 'Không tìm thấy đơn hàng để xử lý serial.';
  String get syncWarningTitle =>
      isEnglish ? 'Sync warning' : 'Cảnh báo đồng bộ';
  String get initialSyncWarning => isEnglish
      ? 'Latest warranty data could not be refreshed. The screen is using the current local data.'
      : 'Không thể làm mới dữ liệu bảo hành mới nhất. Màn hình đang dùng dữ liệu hiện có trên máy.';
  String get cannotProcessTitle =>
      isEnglish ? 'Order is not ready' : 'Đơn hàng chưa sẵn sàng';
  String get cannotProcessMessage => isEnglish
      ? 'Only completed orders can be processed for serials.'
      : 'Chỉ đơn đã hoàn thành mới được xử lý serial.';
  String currentStatusLabel(String statusLabel) => isEnglish
      ? 'Current status: $statusLabel'
      : 'Trạng thái hiện tại: $statusLabel';
  String get processingInfoTitle =>
      isEnglish ? 'Serial processing information' : 'Thông tin xử lý serial';
  String get orderIdLabel => isEnglish ? 'Order ID' : 'Mã đơn hàng';
  String get orderDateLabel => isEnglish ? 'Order date' : 'Ngày đặt';
  String get progressLabel => isEnglish ? 'Progress' : 'Tiến độ';
  String serialProgressValue(int activatedCount, int totalCount) => isEnglish
      ? '$activatedCount/$totalCount serials'
      : '$activatedCount/$totalCount serial';
  String get inventoryValidationHint => isEnglish
      ? 'Only serials already in inventory and matching the order item can be activated.'
      : 'Chỉ serial đã nhập kho và thuộc sản phẩm trong đơn mới được kích hoạt.';
  String get customerNameLabel =>
      isEnglish ? 'Customer name' : 'Tên khách hàng';
  String get customerEmailLabel =>
      isEnglish ? 'Customer email *' : 'Email khách hàng *';
  String get customerEmailHelper => isEnglish
      ? 'Required. Used to store warranty activation details and support contact.'
      : 'Bắt buộc. Dùng để lưu thông tin kích hoạt bảo hành và liên hệ hỗ trợ.';
  String get customerPhoneLabel =>
      isEnglish ? 'Customer phone number' : 'Số điện thoại khách hàng';
  String get customerAddressLabel =>
      isEnglish ? 'Customer address' : 'Địa chỉ khách hàng';
  String purchaseDateLabel(String dateLabel) =>
      isEnglish ? 'Purchase date: $dateLabel' : 'Ngày mua: $dateLabel';
  String get purchaseDateHint => isEnglish
      ? 'Dealers can adjust the in-store purchase date before activating warranty.'
      : 'Đại lý có thể chọn lại ngày khách mua tại cửa hàng trước khi kích hoạt bảo hành.';
  String get prefilledCustomerHint => isEnglish
      ? 'Customer information is prefilled from the order and can still be edited if needed.'
      : 'Thông tin khách hàng được điền sẵn từ đơn hàng, vẫn có thể chỉnh sửa nếu cần.';
  String get quantityLabel => isEnglish ? 'Quantity' : 'Số lượng';
  String get activatedCountLabel => isEnglish ? 'Activated' : 'Đã kích hoạt';
  String get availableInventorySerialsLabel =>
      isEnglish ? 'Valid serials in inventory' : 'Serial hợp lệ trong kho';
  String remainingSerialsLabel(int remaining) => isEnglish
      ? 'Enter $remaining remaining serials'
      : 'Nhập $remaining serial còn thiếu';
  String get scanQrAction => isEnglish ? 'Scan QR' : 'Quét QR';
  String get bulkPasteAction =>
      isEnglish ? 'Paste multiple serials' : 'Dán nhiều serial';
  String serialFieldLabel(int index, int remaining) =>
      isEnglish ? 'Serial $index/$remaining' : 'Serial $index/$remaining';
  String get serialFieldHelper => isEnglish
      ? 'Example: SN-ABC-12345 (letters, numbers, and - only)'
      : 'Ví dụ: SN-ABC-12345 (chỉ gồm chữ, số và dấu -)';
  String get fullyActivatedButtonLabel => isEnglish
      ? 'Order already has all serials activated'
      : 'Đơn đã kích hoạt đủ serial';
  String get confirmActivationAction =>
      isEnglish ? 'Confirm serial activation' : 'Xác nhận kích hoạt serial';

  String serialNotFoundInInventory(String serial) => isEnglish
      ? 'Cannot find serial $serial in inventory.'
      : 'Không tìm thấy serial $serial trong kho.';
  String serialBelongsToOtherOrder(
    String serial,
    String importedOrderId,
    String currentOrderId,
  ) => isEnglish
      ? 'Serial $serial belongs to order $importedOrderId, not order $currentOrderId.'
      : 'Serial $serial thuộc đơn $importedOrderId, không thuộc đơn $currentOrderId.';
  String serialProductMismatch(String serial) => isEnglish
      ? 'Serial $serial does not match the product being processed.'
      : 'Serial $serial không khớp sản phẩm cần xử lý.';
  String noEmptySerialSlot(String productName) => isEnglish
      ? 'There is no empty serial slot left for $productName.'
      : 'Không còn ô serial trống cho $productName.';
  String productAlreadyFull(String productName) => isEnglish
      ? '$productName already has enough serials and cannot be auto-filled.'
      : 'Đã đủ serial cho $productName, không thể tự điền thêm.';
  String prefilledSerialAssigned(String serial) => isEnglish
      ? 'Assigned scanned serial: $serial'
      : 'Đã điền serial quét: $serial';
  String get pickPurchaseDateHelp =>
      isEnglish ? 'Select purchase date' : 'Chọn ngày mua';
  String purchaseDateBeforeOrder(String minimumDate) => isEnglish
      ? 'Purchase date cannot be before the order date $minimumDate.'
      : 'Ngày mua không được trước ngày đặt hàng $minimumDate.';
  String get purchaseDateAfterToday => isEnglish
      ? 'Purchase date cannot be after today.'
      : 'Ngày mua không được sau hôm nay.';
  String scannedSerialAssigned(String productName) => isEnglish
      ? 'Assigned scanned serial for $productName.'
      : 'Đã điền serial quét cho $productName.';
  String get duplicateScannedSerialMessage => isEnglish
      ? 'This serial is already in the input list.'
      : 'Serial này đã có trong danh sách nhập.';
  String get invalidScannedSerialMessage => isEnglish
      ? 'The scanned serial is not valid for this product.'
      : 'Serial quét không hợp lệ cho sản phẩm này.';
  String get bulkPasteTitle =>
      isEnglish ? 'Paste multiple serials' : 'Dán nhiều serial';
  String get bulkPasteHint => isEnglish
      ? 'One serial per line, or separate them with commas'
      : 'Mỗi serial một dòng, hoặc phân tách bằng dấu phẩy';
  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get fillSerialsAction => isEnglish ? 'Fill serials' : 'Điền serial';
  String get noValidSerialsFoundMessage => isEnglish
      ? 'No valid serial was found to fill.'
      : 'Không tìm thấy serial hợp lệ để điền.';
  String bulkPasteSummary(
    int assignedCount,
    int duplicateCount,
    int invalidCount,
    int fullCount,
  ) => isEnglish
      ? 'Assigned $assignedCount serials. Duplicates: $duplicateCount, invalid: $invalidCount, no slots: $fullCount.'
      : 'Đã điền $assignedCount serial. Trùng: $duplicateCount, lỗi: $invalidCount, hết ô: $fullCount.';
  String get customerInfoRequiredMessage => isEnglish
      ? 'Please enter all customer information.'
      : 'Vui lòng nhập đầy đủ thông tin khách hàng.';
  String get invalidEmailMessage => isEnglish
      ? 'Please enter a valid email address.'
      : 'Vui lòng nhập email hợp lệ.';
  String get invalidPhoneMessage => isEnglish
      ? 'Phone number must be 10 digits and start with 0.'
      : 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.';
  String serialRequiredForProduct(String productName) => isEnglish
      ? 'Please enter all serials for $productName.'
      : 'Vui lòng nhập đầy đủ serial cho $productName.';
  String duplicateSerialInSubmission(String serial) => isEnglish
      ? 'Serial $serial is duplicated in this submission.'
      : 'Serial $serial bị trùng trong lần nhập này.';
  String get orderAlreadyFullyActivatedMessage => isEnglish
      ? 'This order already has all serials activated.'
      : 'Đơn hàng này đã kích hoạt đủ serial.';
  String get activationSyncFailedMessage => isEnglish
      ? 'Cannot sync warranty activation. Please check again.'
      : 'Không thể đồng bộ kích hoạt bảo hành. Vui lòng kiểm tra lại.';
  String get screenErrorTitle => isEnglish
      ? 'Warranty activation is temporarily unavailable'
      : 'Màn hình kích hoạt bảo hành tạm thời không khả dụng';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String activationSuccessMessage(int count) => isEnglish
      ? 'Successfully activated $count serials.'
      : 'Đã kích hoạt thành công $count serial.';

  String orderStatusLabel(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return isEnglish ? 'Pending' : '\u0043h\u1EDD x\u1EED l\u00FD';
      case OrderStatus.confirmed:
        return isEnglish ? 'Confirmed' : '\u0110\u00E3 x\u00E1c nh\u1EADn';
      case OrderStatus.shipping:
        return isEnglish ? 'Shipping' : 'Đang giao';
      case OrderStatus.completed:
        return isEnglish ? 'Completed' : 'Hoàn thành';
      case OrderStatus.cancelled:
        return isEnglish ? 'Cancelled' : 'Đã hủy';
    }
  }
}

enum _ActivationStateTone { info, error, neutral }

class _ActivationStateScaffold extends StatelessWidget {
  const _ActivationStateScaffold({
    required this.title,
    required this.icon,
    required this.headline,
    required this.message,
    this.action,
    this.isLoading = false,
    this.tone = _ActivationStateTone.neutral,
  });

  final String title;
  final IconData icon;
  final String headline;
  final String message;
  final Widget? action;
  final bool isLoading;
  final _ActivationStateTone tone;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isError = tone == _ActivationStateTone.error;
    final isInfo = tone == _ActivationStateTone.info || isLoading;
    final background = isError
        ? colors.errorContainer.withValues(alpha: 0.42)
        : isInfo
        ? colors.primaryContainer.withValues(alpha: 0.3)
        : colors.surfaceContainerHighest.withValues(alpha: 0.42);
    final border = isError
        ? colors.error.withValues(alpha: 0.28)
        : isInfo
        ? colors.primary.withValues(alpha: 0.22)
        : colors.outlineVariant.withValues(alpha: 0.72);
    final iconColor = isError
        ? colors.error
        : isInfo
        ? colors.primary
        : colors.onSurfaceVariant;

    return Scaffold(
      appBar: AppBar(title: BrandAppBarTitle(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: background,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: border),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (isLoading)
                    SizedBox(
                      width: 28,
                      height: 28,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.6,
                        color: iconColor,
                      ),
                    )
                  else
                    Icon(icon, size: 42, color: iconColor),
                  const SizedBox(height: 14),
                  Text(
                    headline,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    message,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colors.onSurfaceVariant,
                      height: 1.45,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (action != null) ...[const SizedBox(height: 16), action!],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 1,
      shadowColor: colorScheme.shadow.withValues(alpha: 0.16),
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
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: colorScheme.onSurface,
                fontSize: 17,
                fontWeight: FontWeight.w800,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 14),
            child,
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
  });

  final String label;
  final String value;
  final bool isEmphasis;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final labelStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
      color: colorScheme.onSurfaceVariant,
      fontSize: 12,
      fontWeight: FontWeight.w500,
      height: 1.3,
    );
    final valueStyle = Theme.of(context).textTheme.bodyMedium?.copyWith(
      color: colorScheme.onSurface,
      fontSize: 14,
      fontWeight: FontWeight.w700,
      height: 1.25,
    );
    final emphasisStyle = Theme.of(context).textTheme.titleSmall?.copyWith(
      color: colorScheme.primary,
      fontSize: 16,
      fontWeight: FontWeight.w800,
    );

    return Row(
      children: [
        Expanded(child: Text(label, style: labelStyle)),
        const SizedBox(width: 12),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: isEmphasis ? emphasisStyle : valueStyle,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
