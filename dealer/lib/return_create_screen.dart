import 'dart:async';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import 'app_settings_controller.dart';
import 'dealer_navigation.dart';
import 'dealer_routes.dart';
import 'order_controller.dart';
import 'return_request_service.dart';
import 'return_request_ui_support.dart';
import 'support_attachment_download.dart';
import 'support_attachment_utils.dart';
import 'upload_service.dart';
import 'widgets/attachment_preview.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

part 'return_create_eligibility.dart';
part 'return_create_form.dart';
part 'return_create_texts.dart';
part 'return_create_widgets.dart';

const Duration _eligibilityLoadTimeout = Duration(seconds: 15);
const Duration _activeRequestDetailTimeout = Duration(seconds: 5);
const int _reasonCodeMaxLength = 128;
const int _reasonDetailMaxLength = 1000;
const int _maxImageBytes = 10 * 1024 * 1024;
const int _maxVideoBytes = 50 * 1024 * 1024;
const int _maxDocumentBytes = 10 * 1024 * 1024;

enum _ReturnAttachmentPickerChoice { image, video, document }

class DealerReturnCreateScreen extends StatefulWidget {
  const DealerReturnCreateScreen({
    super.key,
    required this.orderId,
    this.prefilledSerialId,
    this.initialRequestType,
    this.returnRequestService,
    this.uploadService,
    this.attachmentPicker,
  });

  final String orderId;
  final int? prefilledSerialId;
  final DealerReturnRequestType? initialRequestType;
  final ReturnRequestService? returnRequestService;
  final UploadService? uploadService;
  final Future<XFile?> Function()? attachmentPicker;

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
  bool _isDeletingAttachment = false;
  double? _attachmentUploadProgress;
  int _eligibilityLoadGeneration = 0;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _returnService = widget.returnRequestService ?? ReturnRequestService();
    _uploadService = widget.uploadService ?? UploadService();
    final initialRequestType = widget.initialRequestType;
    if (initialRequestType != null &&
        initialRequestType != DealerReturnRequestType.unknown) {
      _requestType = initialRequestType;
      _resolution = _normalizeResolutionForRequestType(
        _requestType,
        _resolution,
      );
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      unawaited(_loadEligibility());
    });
  }

  @override
  void dispose() {
    _reasonCodeController.dispose();
    _reasonDetailController.dispose();
    if (widget.uploadService == null) {
      unawaited(
        _cleanupPendingAttachments().whenComplete(() {
          _uploadService.close();
        }),
      );
    } else {
      unawaited(_cleanupPendingAttachments());
    }
    if (widget.returnRequestService == null) {
      _returnService.close();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final texts = _dealerReturnCreateTexts(context);
    final eligibleCount = _eligibilities.where((item) => item.eligible).length;
    final hasEligibleSerials = eligibleCount > 0;
    final allowedResolutions = _allowedResolutionsForRequestType(_requestType);
    final canSubmit =
        !_isSubmitting &&
        !_isLoading &&
        !_isUploadingAttachment &&
        !_isDeletingAttachment &&
        hasEligibleSerials;
    final orderHintText = _isLoading
        ? texts.checkingEligibilityMessage
        : texts.orderHint(eligibleCount);

    return Scaffold(
      appBar: AppBar(
        leading: DealerFallbackBackButton(fallbackPath: DealerRoutePath.home),
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
                      orderHintText,
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
                          _onRequestTypeChanged(value);
                        },
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<DealerReturnRequestResolution>(
                        initialValue: allowedResolutions.contains(_resolution)
                            ? _resolution
                            : allowedResolutions.first,
                        decoration: InputDecoration(
                          labelText: texts.resolutionLabel,
                        ),
                        items: allowedResolutions
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
                        onChanged: hasEligibleSerials
                            ? (value) {
                                if (value == null) {
                                  return;
                                }
                                setState(() => _resolution = value);
                              }
                            : null,
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _reasonCodeController,
                        enabled: hasEligibleSerials,
                        inputFormatters: [
                          LengthLimitingTextInputFormatter(
                            _reasonCodeMaxLength,
                          ),
                        ],
                        decoration: InputDecoration(
                          labelText: texts.reasonCodeLabel,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _reasonDetailController,
                        enabled: hasEligibleSerials,
                        maxLines: 3,
                        inputFormatters: [
                          LengthLimitingTextInputFormatter(
                            _reasonDetailMaxLength,
                          ),
                        ],
                        decoration: InputDecoration(
                          labelText: texts.reasonDetailLabel,
                        ),
                      ),
                      if (!hasEligibleSerials && _eligibilities.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            texts.noEligibleSerialsGuidance,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                ),
                          ),
                        ),
                      ],
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
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: Theme.of(context).colorScheme.surfaceContainerLow,
                    border: Border.all(
                      color: Theme.of(
                        context,
                      ).colorScheme.outlineVariant.withValues(alpha: 0.45),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              texts.attachmentsTitle,
                              style: Theme.of(context).textTheme.titleSmall
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed: (_isSubmitting || _isUploadingAttachment)
                                ? null
                                : _pickAttachment,
                            icon: _isUploadingAttachment
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
                              _isUploadingAttachment
                                  ? texts.uploadingAttachmentLabel
                                  : texts.addAttachmentAction,
                            ),
                          ),
                        ],
                      ),
                      if (_isUploadingAttachment &&
                          _attachmentUploadProgress != null) ...[
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(999),
                          child: LinearProgressIndicator(
                            minHeight: 8,
                            value: (_attachmentUploadProgress! / 100)
                                .clamp(0.0, 1.0)
                                .toDouble(),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_attachmentUploadProgress!.toStringAsFixed(0)}%',
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Text(
                        texts.attachmentHelper,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                      if (_attachments.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: _attachments
                              .map(
                                (attachment) => _DraftAttachmentPreview(
                                  attachment: attachment,
                                  openLabel: texts.openAttachmentAction,
                                  onRemove:
                                      (_isSubmitting ||
                                          _isUploadingAttachment ||
                                          _isDeletingAttachment)
                                      ? null
                                      : () => _removeAttachment(attachment),
                                ),
                              )
                              .toList(growable: false),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FilledButton.icon(
                onPressed: canSubmit ? _submit : null,
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

class _AttachmentDraft {
  const _AttachmentDraft({
    this.mediaAssetId,
    required this.url,
    required this.fileName,
    required this.category,
    this.accessUrl,
    this.mediaType,
    this.contentType,
    this.sizeBytes,
  });

  final int? mediaAssetId;
  final String url;
  final String? fileName;
  final DealerReturnAttachmentCategory category;
  final String? accessUrl;
  final String? mediaType;
  final String? contentType;
  final int? sizeBytes;
}
