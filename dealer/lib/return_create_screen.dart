import 'dart:async';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'app_settings_controller.dart';
import 'dealer_navigation.dart';
import 'dealer_routes.dart';
import 'order_controller.dart';
import 'return_request_service.dart';
import 'return_request_ui_support.dart';
import 'upload_service.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

_DealerReturnCreateTexts _dealerReturnCreateTexts(BuildContext context) =>
    _DealerReturnCreateTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );

class DealerReturnCreateScreen extends StatefulWidget {
  const DealerReturnCreateScreen({
    super.key,
    required this.orderId,
    this.prefilledSerialId,
    this.returnRequestService,
    this.uploadService,
  });

  final String orderId;
  final int? prefilledSerialId;
  final ReturnRequestService? returnRequestService;
  final UploadService? uploadService;

  @override
  State<DealerReturnCreateScreen> createState() =>
      _DealerReturnCreateScreenState();
}

class _DealerReturnCreateScreenState extends State<DealerReturnCreateScreen> {
  late final ReturnRequestService _returnService;
  late final UploadService _uploadService;

  final TextEditingController _reasonCodeController = TextEditingController();
  final TextEditingController _reasonDetailController = TextEditingController();

  int? _remoteOrderId;
  List<DealerReturnEligibilityRecord> _eligibilities =
      const <DealerReturnEligibilityRecord>[];
  final Set<int> _selectedSerialIds = <int>{};
  final Map<int, DealerReturnRequestItemCondition> _conditionBySerialId =
      <int, DealerReturnRequestItemCondition>{};
  final Map<int, DealerReturnRequestStatus> _activeStatusByRequestId =
      <int, DealerReturnRequestStatus>{};
  final List<_AttachmentDraft> _attachments = <_AttachmentDraft>[];

  DealerReturnRequestType _requestType =
      DealerReturnRequestType.defectiveReturn;
  DealerReturnRequestResolution _resolution =
      DealerReturnRequestResolution.replace;
  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _isUploadingAttachment = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _returnService = widget.returnRequestService ?? ReturnRequestService();
    _uploadService = widget.uploadService ?? UploadService();
    unawaited(_loadEligibility());
  }

  @override
  void dispose() {
    _reasonCodeController.dispose();
    _reasonDetailController.dispose();
    if (widget.returnRequestService == null) {
      _returnService.close();
    }
    if (widget.uploadService == null) {
      _uploadService.close();
    }
    super.dispose();
  }

  Future<void> _loadEligibility() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    final texts = _dealerReturnCreateTexts(context);
    try {
      final orderController = OrderScope.of(context);
      await orderController.refreshSingleOrder(widget.orderId);
      final remoteOrderId = orderController.remoteOrderIdForOrderCode(
        widget.orderId,
      );
      if (remoteOrderId == null || remoteOrderId <= 0) {
        setState(() {
          _errorMessage = texts.missingOrderMappingMessage(widget.orderId);
          _isLoading = false;
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
      final activeStatusMap = <int, DealerReturnRequestStatus>{};
      for (final requestId in activeRequestIds) {
        try {
          final detail = await _returnService.fetchDetail(requestId);
          activeStatusMap[requestId] = detail.status;
        } on ReturnRequestException {
          // Keep fallback reason text from eligibility endpoint.
        }
      }

      if (!mounted) {
        return;
      }
      final nextSelected = <int>{};
      final nextConditionBySerialId = <int, DealerReturnRequestItemCondition>{};
      for (final item in eligibility) {
        final defaultCondition = DealerReturnRequestItemCondition.defective;
        nextConditionBySerialId[item.serialId] = defaultCondition;
        if (item.eligible &&
            widget.prefilledSerialId != null &&
            widget.prefilledSerialId == item.serialId) {
          nextSelected.add(item.serialId);
        }
      }

      setState(() {
        _remoteOrderId = remoteOrderId;
        _eligibilities = eligibility;
        _selectedSerialIds
          ..clear()
          ..addAll(nextSelected);
        _conditionBySerialId
          ..clear()
          ..addAll(nextConditionBySerialId);
        _activeStatusByRequestId
          ..clear()
          ..addAll(activeStatusMap);
      });
    } on ReturnRequestException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = resolveReturnServiceMessage(
          error.message,
          isEnglish: texts.isEnglish,
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

  Future<void> _pickAttachment() async {
    if (_isUploadingAttachment) {
      return;
    }
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked == null) {
      return;
    }
    setState(() => _isUploadingAttachment = true);
    try {
      final uploaded = await _uploadService.uploadXFile(
        file: picked,
        category: 'returns',
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _attachments.add(
          _AttachmentDraft(
            url: uploaded.url,
            fileName: uploaded.fileName,
            category: DealerReturnAttachmentCategory.defectPhoto,
          ),
        );
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      final texts = _dealerReturnCreateTexts(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            uploadServiceErrorMessage(error, isEnglish: texts.isEnglish),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isUploadingAttachment = false);
      }
    }
  }

  Future<void> _removeAttachment(_AttachmentDraft attachment) async {
    setState(() => _attachments.remove(attachment));
    try {
      await _uploadService.deleteUrl(attachment.url);
    } catch (_) {
      // The attachment was removed from draft already.
    }
  }

  Future<void> _submit() async {
    final texts = _dealerReturnCreateTexts(context);
    final remoteOrderId = _remoteOrderId;
    if (remoteOrderId == null || remoteOrderId <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(texts.missingOrderMappingMessage(widget.orderId)),
        ),
      );
      return;
    }
    if (_selectedSerialIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(texts.selectAtLeastOneSerialMessage)),
      );
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      final payloadItems = _selectedSerialIds
          .map(
            (serialId) => DealerCreateReturnRequestItemPayload(
              productSerialId: serialId,
              conditionOnRequest:
                  _conditionBySerialId[serialId] ??
                  DealerReturnRequestItemCondition.defective,
            ),
          )
          .toList(growable: false);
      final payloadAttachments = _attachments
          .map(
            (attachment) => DealerCreateReturnRequestAttachmentPayload(
              url: attachment.url,
              fileName: attachment.fileName,
              category: attachment.category,
            ),
          )
          .toList(growable: false);

      final created = await _returnService.createRequest(
        orderId: remoteOrderId,
        type: _requestType,
        requestedResolution: _resolution,
        reasonCode: _reasonCodeController.text.trim(),
        reasonDetail: _reasonDetailController.text.trim(),
        items: payloadItems,
        attachments: payloadAttachments,
      );
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(texts.createSuccessMessage)));
      context.goToDealerReturnDetail(created.id);
    } on ReturnRequestException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            resolveReturnServiceMessage(
              error.message,
              isEnglish: texts.isEnglish,
            ),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final texts = _dealerReturnCreateTexts(context);
    final eligibleCount = _eligibilities.where((item) => item.eligible).length;

    return Scaffold(
      appBar: AppBar(
        leading: DealerFallbackBackButton(
          fallbackPath: DealerRoutePath.home,
        ),
        title: BrandAppBarTitle(texts.screenTitle),
      ),
      body: RefreshIndicator(
        onRefresh: _loadEligibility,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
          children: [
            FadeSlideIn(
              child: SectionCard(
                title: texts.orderTitle(widget.orderId),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      texts.orderHint(eligibleCount),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                    if (_remoteOrderId != null) ...[
                      const SizedBox(height: 8),
                      Text(texts.remoteOrderHint(_remoteOrderId!)),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 28),
                  child: CircularProgressIndicator(strokeWidth: 2.4),
                ),
              )
            else if (_errorMessage != null)
              FadeSlideIn(
                delay: const Duration(milliseconds: 40),
                child: SectionCard(
                  title: texts.loadFailedTitle,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_errorMessage!),
                      const SizedBox(height: 10),
                      OutlinedButton(
                        onPressed: _loadEligibility,
                        child: Text(texts.retryAction),
                      ),
                    ],
                  ),
                ),
              )
            else ...[
              FadeSlideIn(
                delay: const Duration(milliseconds: 40),
                child: SectionCard(
                  title: texts.requestConfigTitle,
                  child: Column(
                    children: [
                      DropdownButtonFormField<DealerReturnRequestType>(
                        initialValue: _requestType,
                        decoration: InputDecoration(labelText: texts.typeLabel),
                        items: DealerReturnRequestType.values
                            .where(
                              (type) => type != DealerReturnRequestType.unknown,
                            )
                            .map(
                              (type) =>
                                  DropdownMenuItem<DealerReturnRequestType>(
                                    value: type,
                                    child: Text(
                                      dealerReturnTypeLabel(
                                        type,
                                        isEnglish: texts.isEnglish,
                                      ),
                                    ),
                                  ),
                            )
                            .toList(growable: false),
                        onChanged: (value) {
                          if (value == null) {
                            return;
                          }
                          setState(() => _requestType = value);
                        },
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<DealerReturnRequestResolution>(
                        initialValue: _resolution,
                        decoration: InputDecoration(
                          labelText: texts.resolutionLabel,
                        ),
                        items: DealerReturnRequestResolution.values
                            .where(
                              (resolution) =>
                                  resolution !=
                                  DealerReturnRequestResolution.unknown,
                            )
                            .map(
                              (resolution) =>
                                  DropdownMenuItem<
                                    DealerReturnRequestResolution
                                  >(
                                    value: resolution,
                                    child: Text(
                                      dealerReturnResolutionLabel(
                                        resolution,
                                        isEnglish: texts.isEnglish,
                                      ),
                                    ),
                                  ),
                            )
                            .toList(growable: false),
                        onChanged: (value) {
                          if (value == null) {
                            return;
                          }
                          setState(() => _resolution = value);
                        },
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _reasonCodeController,
                        decoration: InputDecoration(
                          labelText: texts.reasonCodeLabel,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _reasonDetailController,
                        maxLines: 3,
                        decoration: InputDecoration(
                          labelText: texts.reasonDetailLabel,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 80),
                child: SectionCard(
                  title: texts.serialSelectionTitle(
                    _selectedSerialIds.length,
                    _eligibilities.length,
                  ),
                  child: Column(
                    children: [
                      if (_eligibilities.isEmpty)
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(texts.noSerialsMessage),
                        )
                      else
                        for (
                          var index = 0;
                          index < _eligibilities.length;
                          index++
                        ) ...[
                          _EligibilityCard(
                            eligibility: _eligibilities[index],
                            isSelected: _selectedSerialIds.contains(
                              _eligibilities[index].serialId,
                            ),
                            isEnglish: texts.isEnglish,
                            condition:
                                _conditionBySerialId[_eligibilities[index]
                                    .serialId] ??
                                DealerReturnRequestItemCondition.defective,
                            activeStatus:
                                _eligibilities[index].activeRequestId == null
                                ? null
                                : _activeStatusByRequestId[_eligibilities[index]
                                      .activeRequestId!],
                            onToggleSelected: _eligibilities[index].eligible
                                ? (value) {
                                    setState(() {
                                      if (value) {
                                        _selectedSerialIds.add(
                                          _eligibilities[index].serialId,
                                        );
                                      } else {
                                        _selectedSerialIds.remove(
                                          _eligibilities[index].serialId,
                                        );
                                      }
                                    });
                                  }
                                : null,
                            onConditionChanged: _eligibilities[index].eligible
                                ? (value) {
                                    setState(() {
                                      _conditionBySerialId[_eligibilities[index]
                                              .serialId] =
                                          value;
                                    });
                                  }
                                : null,
                            onOpenRequest:
                                _eligibilities[index].activeRequestId == null
                                ? null
                                : () => context.pushDealerReturnDetail(
                                    _eligibilities[index].activeRequestId!,
                                  ),
                          ),
                          if (index != _eligibilities.length - 1)
                            const Divider(height: 14),
                        ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 120),
                child: SectionCard(
                  title: texts.attachmentsTitle,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: _attachments
                            .map(
                              (attachment) => _AttachmentCard(
                                attachment: attachment,
                                onRemove: () => _removeAttachment(attachment),
                                isEnglish: texts.isEnglish,
                              ),
                            )
                            .toList(growable: false),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: (_isUploadingAttachment || _isSubmitting)
                            ? null
                            : _pickAttachment,
                        icon: _isUploadingAttachment
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.attach_file_outlined),
                        label: Text(texts.addAttachmentAction),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FilledButton.icon(
                onPressed: _isSubmitting ? null : _submit,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2.4),
                      )
                    : const Icon(Icons.send_outlined),
                label: Text(texts.submitAction),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _EligibilityCard extends StatelessWidget {
  const _EligibilityCard({
    required this.eligibility,
    required this.isSelected,
    required this.isEnglish,
    required this.condition,
    this.activeStatus,
    this.onToggleSelected,
    this.onConditionChanged,
    this.onOpenRequest,
  });

  final DealerReturnEligibilityRecord eligibility;
  final bool isSelected;
  final bool isEnglish;
  final DealerReturnRequestItemCondition condition;
  final DealerReturnRequestStatus? activeStatus;
  final ValueChanged<bool>? onToggleSelected;
  final ValueChanged<DealerReturnRequestItemCondition>? onConditionChanged;
  final VoidCallback? onOpenRequest;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final titleStyle = Theme.of(
      context,
    ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800);
    final productName = eligibility.productName ?? '-';
    final productSku = eligibility.productSku ?? '-';
    final reason = _eligibilityReasonLabel(eligibility, isEnglish: isEnglish);
    final statusLabel = activeStatus == null
        ? reason
        : dealerReturnStatusLabel(activeStatus!, isEnglish: isEnglish);
    final statusColor = activeStatus == null
        ? (eligibility.eligible ? colors.tertiary : colors.error)
        : dealerReturnStatusForeground(activeStatus!);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(eligibility.serial, style: titleStyle),
                  const SizedBox(height: 2),
                  Text(
                    '$productName - $productSku',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            if (onToggleSelected != null)
              Checkbox(
                value: isSelected,
                onChanged: (value) => onToggleSelected?.call(value ?? false),
              ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          statusLabel,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: statusColor,
            fontWeight: FontWeight.w700,
          ),
        ),
        if (onConditionChanged != null) ...[
          const SizedBox(height: 8),
          DropdownButtonFormField<DealerReturnRequestItemCondition>(
            initialValue: condition,
            decoration: InputDecoration(
              labelText: isEnglish ? 'Item condition' : 'Tinh trang serial',
            ),
            items: DealerReturnRequestItemCondition.values
                .where(
                  (value) => value != DealerReturnRequestItemCondition.unknown,
                )
                .map(
                  (value) => DropdownMenuItem<DealerReturnRequestItemCondition>(
                    value: value,
                    child: Text(
                      dealerItemConditionLabel(value, isEnglish: isEnglish),
                    ),
                  ),
                )
                .toList(growable: false),
            onChanged: (value) {
              if (value == null) {
                return;
              }
              onConditionChanged?.call(value);
            },
          ),
        ],
        if (onOpenRequest != null) ...[
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: onOpenRequest,
            icon: const Icon(Icons.open_in_new_rounded),
            label: Text(
              isEnglish ? 'Open active request' : 'Mo yeu cau dang xu ly',
            ),
          ),
        ],
      ],
    );
  }
}

class _AttachmentCard extends StatelessWidget {
  const _AttachmentCard({
    required this.attachment,
    required this.onRemove,
    required this.isEnglish,
  });

  final _AttachmentDraft attachment;
  final VoidCallback onRemove;
  final bool isEnglish;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      constraints: const BoxConstraints(minWidth: 170, maxWidth: 240),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.7)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  attachment.fileName ?? attachment.url,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 2),
                Text(
                  _attachmentCategoryLabel(
                    attachment.category,
                    isEnglish: isEnglish,
                  ),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          IconButton(
            onPressed: onRemove,
            icon: const Icon(Icons.close_rounded, size: 18),
            tooltip: isEnglish ? 'Remove attachment' : 'Xoa tap dinh kem',
          ),
        ],
      ),
    );
  }
}

class _AttachmentDraft {
  const _AttachmentDraft({
    required this.url,
    required this.fileName,
    required this.category,
  });

  final String url;
  final String? fileName;
  final DealerReturnAttachmentCategory category;
}

String _eligibilityReasonLabel(
  DealerReturnEligibilityRecord eligibility, {
  required bool isEnglish,
}) {
  final reason = eligibility.reasonCode.trim().toUpperCase();
  switch (reason) {
    case 'ELIGIBLE':
      return isEnglish ? 'Eligible for return' : 'Du dieu kien doi tra';
    case 'ORDER_NOT_COMPLETED':
      return isEnglish
          ? 'Order must be completed before return request.'
          : 'Don hang phai hoan tat moi duoc tao yeu cau doi tra.';
    case 'SERIAL_STATUS_NOT_ELIGIBLE':
      return isEnglish
          ? 'Serial status is not eligible for return.'
          : 'Trang thai serial hien tai khong cho phep doi tra.';
    case 'ACTIVE_RETURN_REQUEST_EXISTS':
      return isEnglish
          ? 'An active return request already exists for this serial.'
          : 'Serial nay da co yeu cau doi tra dang xu ly.';
    default:
      return eligibility.reasonMessage.isNotEmpty
          ? eligibility.reasonMessage
          : (isEnglish
                ? 'Eligibility unavailable'
                : 'Khong xac dinh du dieu kien');
  }
}

String _attachmentCategoryLabel(
  DealerReturnAttachmentCategory category, {
  required bool isEnglish,
}) {
  switch (category) {
    case DealerReturnAttachmentCategory.proof:
      return isEnglish ? 'Proof' : 'Bang chung';
    case DealerReturnAttachmentCategory.defectPhoto:
      return isEnglish ? 'Defect photo' : 'Anh loi';
    case DealerReturnAttachmentCategory.receipt:
      return isEnglish ? 'Receipt' : 'Hoa don';
    case DealerReturnAttachmentCategory.packing:
      return isEnglish ? 'Packing' : 'Dong goi';
    case DealerReturnAttachmentCategory.other:
      return isEnglish ? 'Other' : 'Khac';
    case DealerReturnAttachmentCategory.unknown:
      return isEnglish ? 'Unknown' : 'Khong xac dinh';
  }
}

class _DealerReturnCreateTexts {
  const _DealerReturnCreateTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle =>
      isEnglish ? 'Create return request' : 'Tao yeu cau doi tra';
  String orderTitle(String orderCode) =>
      isEnglish ? 'Order $orderCode' : 'Don $orderCode';
  String orderHint(int eligibleCount) => isEnglish
      ? '$eligibleCount serial(s) are currently eligible to create a return request.'
      : '$eligibleCount serial dang du dieu kien tao yeu cau doi tra.';
  String remoteOrderHint(int remoteOrderId) => isEnglish
      ? 'Runtime order id: $remoteOrderId'
      : 'Ma don runtime: $remoteOrderId';
  String missingOrderMappingMessage(String orderCode) => isEnglish
      ? 'Unable to resolve backend order id for order $orderCode. Please refresh this order and try again.'
      : 'Khong tim thay ma don backend cho don $orderCode. Vui long tai lai don va thu lai.';
  String get loadFailedTitle => isEnglish
      ? 'Unable to load return eligibility'
      : 'Khong the tai du lieu du dieu kien doi tra';
  String get retryAction => isEnglish ? 'Retry' : 'Thu lai';
  String get requestConfigTitle =>
      isEnglish ? 'Request details' : 'Thong tin yeu cau';
  String get typeLabel => isEnglish ? 'Return type' : 'Loai doi tra';
  String get resolutionLabel =>
      isEnglish ? 'Requested resolution' : 'Phuong an xu ly mong muon';
  String get reasonCodeLabel =>
      isEnglish ? 'Reason code (optional)' : 'Ma ly do (tuy chon)';
  String get reasonDetailLabel =>
      isEnglish ? 'Reason detail (optional)' : 'Mo ta chi tiet (tuy chon)';
  String serialSelectionTitle(int selected, int total) => isEnglish
      ? 'Serial selection ($selected/$total)'
      : 'Chon serial ($selected/$total)';
  String get noSerialsMessage => isEnglish
      ? 'No serials found for this order.'
      : 'Khong tim thay serial nao cua don nay.';
  String get attachmentsTitle =>
      isEnglish ? 'Attachments (optional)' : 'Tap dinh kem (tuy chon)';
  String get addAttachmentAction =>
      isEnglish ? 'Upload attachment' : 'Tai tap dinh kem';
  String get submitAction =>
      isEnglish ? 'Submit return request' : 'Gui yeu cau doi tra';
  String get createSuccessMessage => isEnglish
      ? 'Return request created successfully.'
      : 'Da tao yeu cau doi tra thanh cong.';
  String get selectAtLeastOneSerialMessage => isEnglish
      ? 'Select at least one eligible serial.'
      : 'Hay chon it nhat mot serial du dieu kien.';
}
