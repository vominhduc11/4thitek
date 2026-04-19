import 'dart:async';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_settings_controller.dart';
import 'dealer_navigation.dart';
import 'dealer_routes.dart';
import 'order_controller.dart';
import 'return_request_service.dart';
import 'return_request_ui_support.dart';
import 'support_attachment_download.dart';
import 'support_attachment_utils.dart';
import 'upload_service.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

_DealerReturnCreateTexts _dealerReturnCreateTexts(BuildContext context) =>
    _DealerReturnCreateTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );

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
  static const Duration _eligibilityLoadTimeout = Duration(seconds: 15);
  static const Duration _activeRequestDetailTimeout = Duration(seconds: 5);
  static const int _reasonCodeMaxLength = 128;
  static const int _reasonDetailMaxLength = 1000;
  static const int _maxImageBytes = 10 * 1024 * 1024;
  static const int _maxVideoBytes = 50 * 1024 * 1024;
  static const int _maxDocumentBytes = 10 * 1024 * 1024;

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

  Future<void> _loadEligibility() async {
    final loadGeneration = ++_eligibilityLoadGeneration;
    final requestType = _requestType;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    final texts = _dealerReturnCreateTexts(context);
    try {
      await _loadEligibilityData(
        texts,
        loadGeneration: loadGeneration,
        requestType: requestType,
      ).timeout(_eligibilityLoadTimeout);
    } on ReturnRequestException catch (error) {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _errorMessage = resolveReturnServiceMessage(
          error.message,
          isEnglish: texts.isEnglish,
        );
      });
    } on TimeoutException {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _errorMessage = texts.eligibilityLoadTimeoutMessage;
      });
    } on FormatException {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _errorMessage = texts.eligibilityLoadInvalidResponseMessage;
      });
    } on SocketException {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _errorMessage = texts.eligibilityLoadNetworkMessage;
      });
    } catch (_) {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        _errorMessage = texts.eligibilityLoadFailedMessage;
      });
    } finally {
      if (mounted && _isCurrentEligibilityLoad(loadGeneration)) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  bool _isCurrentEligibilityLoad(int loadGeneration) =>
      loadGeneration == _eligibilityLoadGeneration;

  Future<void> _loadEligibilityData(
    _DealerReturnCreateTexts texts, {
    required int loadGeneration,
    required DealerReturnRequestType requestType,
  }) async {
    final orderController = OrderScope.of(context);
    await orderController.refreshSingleOrder(widget.orderId);
    final remoteOrderId = orderController.remoteOrderIdForOrderCode(
      widget.orderId,
    );
    if (remoteOrderId == null || remoteOrderId <= 0) {
      if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
        return;
      }
      setState(() {
        final orderLoadError = orderController.lastActionMessage;
        _errorMessage = orderLoadError == null
            ? texts.missingOrderMappingMessage(widget.orderId)
            : orderControllerErrorMessage(
                orderLoadError,
                isEnglish: texts.isEnglish,
              );
      });
      return;
    }

    final eligibility = await _returnService.fetchOrderEligibleSerials(
      remoteOrderId,
      type: requestType,
    );

    if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
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
      _activeStatusByRequestId.clear();
    });
    unawaited(_enrichActiveRequestStatuses(eligibility, loadGeneration));
  }

  Future<void> _enrichActiveRequestStatuses(
    List<DealerReturnEligibilityRecord> eligibility,
    int loadGeneration,
  ) async {
    final activeRequestIds = eligibility
        .map((item) => item.activeRequestId)
        .whereType<int>()
        .toSet()
        .toList(growable: false);
    if (activeRequestIds.isEmpty) {
      return;
    }

    final activeStatusMap = <int, DealerReturnRequestStatus>{};
    await Future.wait<void>(
      activeRequestIds.map((requestId) async {
        try {
          final detail = await _returnService
              .fetchDetail(requestId)
              .timeout(_activeRequestDetailTimeout);
          activeStatusMap[requestId] = detail.status;
        } catch (_) {
          // Keep fallback reason text from eligibility endpoint.
        }
      }),
    );

    if (!mounted || !_isCurrentEligibilityLoad(loadGeneration)) {
      return;
    }
    setState(() {
      _activeStatusByRequestId
        ..clear()
        ..addAll(activeStatusMap);
    });
  }

  List<DealerReturnRequestResolution> _allowedResolutionsForRequestType(
    DealerReturnRequestType type,
  ) {
    if (type == DealerReturnRequestType.warrantyRma) {
      return const <DealerReturnRequestResolution>[
        DealerReturnRequestResolution.inspectOnly,
        DealerReturnRequestResolution.replace,
      ];
    }
    return DealerReturnRequestResolution.values
        .where(
          (resolution) => resolution != DealerReturnRequestResolution.unknown,
        )
        .toList(growable: false);
  }

  DealerReturnRequestResolution _normalizeResolutionForRequestType(
    DealerReturnRequestType type,
    DealerReturnRequestResolution current,
  ) {
    final allowed = _allowedResolutionsForRequestType(type);
    if (allowed.contains(current)) {
      return current;
    }
    return allowed.first;
  }

  void _onRequestTypeChanged(DealerReturnRequestType nextType) {
    if (nextType == _requestType) {
      return;
    }
    final normalizedResolution = _normalizeResolutionForRequestType(
      nextType,
      _resolution,
    );
    setState(() {
      _requestType = nextType;
      _resolution = normalizedResolution;
      _eligibilities = const <DealerReturnEligibilityRecord>[];
      _selectedSerialIds.clear();
      _conditionBySerialId.clear();
      _activeStatusByRequestId.clear();
    });
    unawaited(_loadEligibility());
  }

  Future<void> _pickAttachment() async {
    if (_isUploadingAttachment) {
      return;
    }
    final texts = _dealerReturnCreateTexts(context);
    final messenger = ScaffoldMessenger.of(context);
    final picked = await (widget.attachmentPicker ??
        () => _pickReturnAttachmentFile(texts))();
    if (picked == null) {
      return;
    }
    final validationMessage = await _validateReturnAttachment(picked, texts);
    if (validationMessage != null) {
      messenger.showSnackBar(SnackBar(content: Text(validationMessage)));
      return;
    }
    setState(() {
      _isUploadingAttachment = true;
      _attachmentUploadProgress = 0;
    });
    try {
      final uploaded = await _uploadService.uploadSupportMediaFile(
        file: picked,
        onProgress: (progress) {
          if (!mounted) {
            return;
          }
          setState(() => _attachmentUploadProgress = progress);
        },
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _attachments.add(
          _AttachmentDraft(
            mediaAssetId: uploaded.mediaAssetId,
            url: uploaded.url,
            fileName: uploaded.fileName,
            accessUrl: uploaded.accessUrl,
            mediaType: uploaded.mediaType,
            contentType: uploaded.contentType,
            sizeBytes: uploaded.sizeBytes,
            category: _resolveAttachmentCategory(picked),
          ),
        );
      });
      messenger.showSnackBar(
        SnackBar(content: Text(texts.attachmentAddedMessage(picked.name))),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      messenger.showSnackBar(SnackBar(content: Text(texts.attachmentUploadFailed(error))));
    } finally {
      if (mounted) {
        setState(() {
          _isUploadingAttachment = false;
          _attachmentUploadProgress = null;
        });
      }
    }
  }

  Future<XFile?> _pickReturnAttachmentFile(_DealerReturnCreateTexts texts) async {
    final choice = await showModalBottomSheet<_ReturnAttachmentPickerChoice>(
      context: context,
      builder: (sheetContext) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.image_outlined),
                title: Text(texts.pickImageAction),
                onTap: () => Navigator.of(
                  sheetContext,
                ).pop(_ReturnAttachmentPickerChoice.image),
              ),
              ListTile(
                leading: const Icon(Icons.videocam_outlined),
                title: Text(texts.pickVideoAction),
                onTap: () => Navigator.of(
                  sheetContext,
                ).pop(_ReturnAttachmentPickerChoice.video),
              ),
              ListTile(
                leading: const Icon(Icons.picture_as_pdf_outlined),
                title: Text(texts.pickDocumentAction),
                onTap: () => Navigator.of(
                  sheetContext,
                ).pop(_ReturnAttachmentPickerChoice.document),
              ),
            ],
          ),
        );
      },
    );

    if (choice == null) {
      return null;
    }

    if (choice == _ReturnAttachmentPickerChoice.image) {
      return ImagePicker().pickImage(source: ImageSource.gallery);
    }
    if (choice == _ReturnAttachmentPickerChoice.video) {
      return ImagePicker().pickVideo(source: ImageSource.gallery);
    }

    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const <String>['pdf'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) {
      return null;
    }
    final file = result.files.first;
    if (file.path != null && file.path!.trim().isNotEmpty) {
      return XFile(file.path!, name: file.name, mimeType: 'application/pdf');
    }
    if (file.bytes != null) {
      return XFile.fromData(
        file.bytes!,
        name: file.name,
        mimeType: 'application/pdf',
      );
    }
    return null;
  }

  Future<String?> _validateReturnAttachment(
    XFile file,
    _DealerReturnCreateTexts texts,
  ) async {
    final sizeBytes = await file.length();
    final fileName = file.name.trim().toLowerCase();
    final contentType = (file.mimeType ?? '').trim().toLowerCase();

    final isImage =
        isLikelyImageAttachment(fileName: fileName, url: fileName) ||
        contentType.startsWith('image/');
    final isVideo =
        isLikelyVideoAttachment(
          fileName: fileName,
          url: fileName,
          contentType: contentType,
        ) ||
        contentType.startsWith('video/');
    final isDocument =
        isLikelyDocumentAttachment(
          fileName: fileName,
          url: fileName,
          contentType: contentType,
        ) ||
        contentType == 'application/pdf';

    if (!isImage && !isVideo && !isDocument) {
      return texts.attachmentUnsupportedTypeMessage;
    }
    if (isImage && sizeBytes > _maxImageBytes) {
      return texts.attachmentImageTooLargeMessage;
    }
    if (isVideo && sizeBytes > _maxVideoBytes) {
      return texts.attachmentVideoTooLargeMessage;
    }
    if (isDocument && sizeBytes > _maxDocumentBytes) {
      return texts.attachmentDocumentTooLargeMessage;
    }
    return null;
  }

  DealerReturnAttachmentCategory _resolveAttachmentCategory(XFile file) {
    final fileName = file.name.trim().toLowerCase();
    final contentType = (file.mimeType ?? '').trim().toLowerCase();
    final isImage =
        isLikelyImageAttachment(fileName: fileName, url: fileName) ||
        contentType.startsWith('image/');
    if (isImage) {
      return DealerReturnAttachmentCategory.defectPhoto;
    }
    return DealerReturnAttachmentCategory.proof;
  }

  Future<void> _removeAttachment(_AttachmentDraft attachment) async {
    if (_isDeletingAttachment) {
      return;
    }
    final texts = _dealerReturnCreateTexts(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isDeletingAttachment = true);
    try {
      if (attachment.mediaAssetId != null && attachment.mediaAssetId! > 0) {
        await _uploadService.deleteMediaAsset(attachment.mediaAssetId!);
      } else {
        await _uploadService.deleteUrl(attachment.url);
      }
      if (!mounted) {
        return;
      }
      setState(() {
        _attachments.removeWhere((item) => identical(item, attachment));
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      messenger.showSnackBar(
        SnackBar(content: Text(texts.attachmentUploadFailed(error))),
      );
    } finally {
      if (mounted) {
        setState(() => _isDeletingAttachment = false);
      }
    }
  }

  Future<void> _cleanupPendingAttachments() async {
    final attachments = List<_AttachmentDraft>.from(_attachments);
    for (final attachment in attachments) {
      try {
        if (attachment.mediaAssetId != null && attachment.mediaAssetId! > 0) {
          await _uploadService.deleteMediaAsset(attachment.mediaAssetId!);
        } else {
          await _uploadService.deleteUrl(attachment.url);
        }
      } catch (_) {
        // Best-effort cleanup on exit.
      }
    }
  }

  Future<void> _submit() async {
    final texts = _dealerReturnCreateTexts(context);
    if (_isSubmitting) {
      return;
    }
    if (_isUploadingAttachment) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(texts.attachmentUploadInProgressMessage)),
      );
      return;
    }
    if (_isDeletingAttachment) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(texts.attachmentUploadInProgressMessage)),
      );
      return;
    }
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
    final eligibleCount = _eligibilities.where((item) => item.eligible).length;
    if (eligibleCount == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(texts.noEligibleSerialsSubmitMessage)),
      );
      return;
    }
    final reasonCode = _reasonCodeController.text.trim();
    if (reasonCode.length > _reasonCodeMaxLength) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(texts.reasonCodeTooLongMessage(_reasonCodeMaxLength)),
        ),
      );
      return;
    }
    final reasonDetail = _reasonDetailController.text.trim();
    if (reasonDetail.length > _reasonDetailMaxLength) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            texts.reasonDetailTooLongMessage(_reasonDetailMaxLength),
          ),
        ),
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
      final attachmentProductSerialId = _selectedSerialIds.length == 1
          ? _selectedSerialIds.single
          : null;
      final payloadAttachments = _attachments
          .map(
            (attachment) => DealerCreateReturnRequestAttachmentPayload(
              productSerialId: attachmentProductSerialId,
              mediaAssetId: attachment.mediaAssetId,
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
        reasonCode: reasonCode,
        reasonDetail: reasonDetail,
        items: payloadItems,
        attachments: payloadAttachments,
      );
      if (!mounted) {
        return;
      }
      setState(() => _attachments.clear());
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
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
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
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
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
                                  onRemove: (_isSubmitting ||
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

class _DraftAttachmentPreview extends StatelessWidget {
  const _DraftAttachmentPreview({
    required this.attachment,
    required this.openLabel,
    this.onRemove,
  });

  final _AttachmentDraft attachment;
  final String? openLabel;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        _AttachmentPreviewCard(
          attachment: attachment,
          openLabel: openLabel,
          previewHeight: 112,
          thumbnailWidth: 152,
        ),
        if (onRemove != null)
          Positioned(
            top: -6,
            right: -6,
            child: Material(
              color: Theme.of(context).colorScheme.surface,
              shape: const CircleBorder(),
              elevation: 1,
              child: InkWell(
                borderRadius: BorderRadius.circular(999),
                onTap: onRemove,
                child: const Padding(
                  padding: EdgeInsets.all(4),
                  child: Icon(Icons.close_rounded, size: 18),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _AttachmentPreviewCard extends StatefulWidget {
  const _AttachmentPreviewCard({
    required this.attachment,
    required this.previewHeight,
    required this.thumbnailWidth,
    this.openLabel,
  });

  final _AttachmentDraft attachment;
  final double previewHeight;
  final double thumbnailWidth;
  final String? openLabel;

  @override
  State<_AttachmentPreviewCard> createState() => _AttachmentPreviewCardState();
}

class _AttachmentPreviewCardState extends State<_AttachmentPreviewCard> {
  late Future<SupportAttachmentAsset> _loadFuture;
  late String _fetchKey;

  @override
  void initState() {
    super.initState();
    _fetchKey = _resolveFetchKey(widget.attachment);
    _loadFuture = loadSupportAttachmentAsset(_fetchKey);
  }

  @override
  void didUpdateWidget(covariant _AttachmentPreviewCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    final nextKey = _resolveFetchKey(widget.attachment);
    if (_fetchKey != nextKey) {
      _fetchKey = nextKey;
      _loadFuture = loadSupportAttachmentAsset(_fetchKey);
    }
  }

  String _resolveFetchKey(_AttachmentDraft attachment) {
    final direct = attachment.accessUrl?.trim();
    if (direct != null && direct.isNotEmpty) {
      return direct;
    }
    return attachment.url;
  }

  @override
  Widget build(BuildContext context) {
    final directUrl = widget.attachment.accessUrl?.trim().isNotEmpty == true
        ? widget.attachment.accessUrl!.trim()
        : widget.attachment.url.trim();
    final isImageHint =
        (widget.attachment.mediaType ?? '').trim().toLowerCase() == 'image' ||
        isLikelyImageAttachment(
          fileName: widget.attachment.fileName,
          url: widget.attachment.url,
        ) ||
        (widget.attachment.contentType ?? '')
            .trim()
            .toLowerCase()
            .startsWith('image/');
    final isVideoHint =
        (widget.attachment.mediaType ?? '').trim().toLowerCase() == 'video' ||
        isLikelyVideoAttachment(
          fileName: widget.attachment.fileName,
          url: widget.attachment.url,
          contentType: widget.attachment.contentType,
        );
    final isDocumentHint =
        (widget.attachment.mediaType ?? '').trim().toLowerCase() ==
            'document' ||
        isLikelyDocumentAttachment(
          fileName: widget.attachment.fileName,
          url: widget.attachment.url,
          contentType: widget.attachment.contentType,
        );

    if (directUrl.isNotEmpty && isImageHint) {
      return _NetworkImageAttachmentCard(
        attachment: widget.attachment,
        imageUrl: directUrl,
        previewHeight: widget.previewHeight,
        thumbnailWidth: widget.thumbnailWidth,
        openLabel: widget.openLabel,
      );
    }

    if (directUrl.isNotEmpty && (isVideoHint || isDocumentHint)) {
      return _FileAttachmentCard(
        attachment: widget.attachment,
        directUrl: directUrl,
        isVideo: isVideoHint,
        openLabel: widget.openLabel,
        previewHeight: widget.previewHeight,
        thumbnailWidth: widget.thumbnailWidth,
      );
    }

    return FutureBuilder<SupportAttachmentAsset>(
      future: _loadFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return _AttachmentLoadingCard(
            previewHeight: widget.previewHeight,
            thumbnailWidth: widget.thumbnailWidth,
            label: widget.attachment.fileName ?? widget.attachment.url,
          );
        }

        final asset = snapshot.data;
        final isImage =
            asset != null &&
            (isLikelyImageAttachment(
                  fileName: widget.attachment.fileName,
                  url: widget.attachment.url,
                ) ||
                asset.mimeType.startsWith('image/'));

        if (asset == null) {
          return _FileAttachmentCard(
            attachment: widget.attachment,
            directUrl: null,
            isVideo: isVideoHint,
            openLabel: widget.openLabel,
            previewHeight: widget.previewHeight,
            thumbnailWidth: widget.thumbnailWidth,
          );
        }

        if (isImage) {
          return _ImageAttachmentCard(
            attachment: widget.attachment,
            asset: asset,
            previewHeight: widget.previewHeight,
            thumbnailWidth: widget.thumbnailWidth,
            openLabel: widget.openLabel,
          );
        }

        return _FileAttachmentCard(
          attachment: widget.attachment,
          asset: asset,
          isVideo: isVideoHint,
          openLabel: widget.openLabel,
          previewHeight: widget.previewHeight,
          thumbnailWidth: widget.thumbnailWidth,
        );
      },
    );
  }
}

class _ImageAttachmentCard extends StatelessWidget {
  const _ImageAttachmentCard({
    required this.attachment,
    required this.asset,
    required this.previewHeight,
    required this.thumbnailWidth,
    this.openLabel,
  });

  final _AttachmentDraft attachment;
  final SupportAttachmentAsset asset;
  final double previewHeight;
  final double thumbnailWidth;
  final String? openLabel;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: thumbnailWidth),
      child: Semantics(
        label: attachment.fileName ?? attachment.url,
        button: true,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _openAttachmentFullscreen(
            context,
            asset: asset,
            title: attachment.fileName ?? attachment.url,
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: colors.surface,
              border: Border.all(
                color: colors.outlineVariant.withValues(alpha: 0.45),
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.memory(
                    asset.bytes,
                    height: previewHeight,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            attachment.fileName ?? attachment.url,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                        if (openLabel != null) ...[
                          const SizedBox(width: 8),
                          Text(
                            openLabel!,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: colors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NetworkImageAttachmentCard extends StatelessWidget {
  const _NetworkImageAttachmentCard({
    required this.attachment,
    required this.imageUrl,
    required this.previewHeight,
    required this.thumbnailWidth,
    this.openLabel,
  });

  final _AttachmentDraft attachment;
  final String imageUrl;
  final double previewHeight;
  final double thumbnailWidth;
  final String? openLabel;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: thumbnailWidth),
      child: Semantics(
        label: attachment.fileName ?? attachment.url,
        button: true,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _openAttachmentUrl(imageUrl),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: colors.surface,
              border: Border.all(
                color: colors.outlineVariant.withValues(alpha: 0.45),
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.network(
                    imageUrl,
                    height: previewHeight,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: previewHeight,
                        alignment: Alignment.center,
                        color: colors.surfaceContainerLow,
                        child: Icon(
                          Icons.image_not_supported_outlined,
                          color: colors.onSurfaceVariant,
                        ),
                      );
                    },
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            attachment.fileName ?? attachment.url,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                        if (openLabel != null) ...[
                          const SizedBox(width: 8),
                          Text(
                            openLabel!,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: colors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FileAttachmentCard extends StatelessWidget {
  const _FileAttachmentCard({
    required this.attachment,
    required this.previewHeight,
    required this.thumbnailWidth,
    this.asset,
    this.directUrl,
    this.isVideo = false,
    this.openLabel,
  });

  final _AttachmentDraft attachment;
  final SupportAttachmentAsset? asset;
  final String? directUrl;
  final bool isVideo;
  final double previewHeight;
  final double thumbnailWidth;
  final String? openLabel;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final hasDirectUrl = directUrl?.trim().isNotEmpty == true;
    final canOpen = asset != null || hasDirectUrl;
    return Semantics(
      label: attachment.fileName ?? attachment.url,
      button: true,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: !canOpen
            ? null
            : () => asset != null
                ? _openAttachmentDataUri(asset!.dataUri)
                : _openAttachmentUrl(directUrl!),
        child: Container(
          constraints: BoxConstraints(maxWidth: thumbnailWidth),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: colors.surface,
            border: Border.all(
              color: colors.outlineVariant.withValues(alpha: 0.45),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isVideo
                        ? Icons.videocam_outlined
                        : Icons.attach_file_outlined,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      attachment.fileName ?? attachment.url,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                height: previewHeight - 44,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: colors.surfaceContainerLowest,
                  border: Border.all(
                    color: colors.outlineVariant.withValues(alpha: 0.35),
                  ),
                ),
                alignment: Alignment.center,
                child: Icon(
                  isVideo ? Icons.videocam_outlined : Icons.description_outlined,
                  color: colors.onSurfaceVariant,
                ),
              ),
              if (openLabel != null) ...[
                const SizedBox(height: 8),
                TextButton(
                  onPressed: canOpen
                      ? () => asset != null
                          ? _openAttachmentDataUri(asset!.dataUri)
                          : _openAttachmentUrl(directUrl!)
                      : null,
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    visualDensity: VisualDensity.compact,
                  ),
                  child: Text(openLabel!),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _AttachmentLoadingCard extends StatelessWidget {
  const _AttachmentLoadingCard({
    required this.previewHeight,
    required this.thumbnailWidth,
    required this.label,
  });

  final double previewHeight;
  final double thumbnailWidth;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      button: false,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: thumbnailWidth),
        child: Container(
          height: previewHeight,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: Theme.of(context).colorScheme.surface,
            border: Border.all(
              color: Theme.of(
                context,
              ).colorScheme.outlineVariant.withValues(alpha: 0.45),
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              const SizedBox(height: 10),
              Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }
}

Future<void> _openAttachmentDataUri(String dataUri) async {
  final uri = Uri.tryParse(dataUri);
  if (uri != null) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

Future<void> _openAttachmentUrl(String url) async {
  final uri = Uri.tryParse(url);
  if (uri != null) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

Future<void> _openAttachmentFullscreen(
  BuildContext context, {
  required SupportAttachmentAsset asset,
  required String title,
}) async {
  await showDialog<void>(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.92),
    barrierDismissible: true,
    builder: (dialogContext) {
      final colors = Theme.of(dialogContext).colorScheme;
      return Dialog.fullscreen(
        backgroundColor: Colors.black,
        child: SafeArea(
          child: Stack(
            children: [
              Positioned.fill(
                child: Center(
                  child: InteractiveViewer(
                    minScale: 1,
                    maxScale: 4,
                    child: Image.memory(
                      asset.bytes,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.broken_image_outlined,
                                size: 56,
                                color: colors.onSurface.withValues(alpha: 0.8),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                title,
                                textAlign: TextAlign.center,
                                style: Theme.of(dialogContext)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                      color: colors.onSurface.withValues(
                                        alpha: 0.9,
                                      ),
                                    ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
              Positioned(
                top: 8,
                right: 8,
                child: Material(
                  color: colors.surface.withValues(alpha: 0.12),
                  shape: const CircleBorder(),
                  child: IconButton(
                    tooltip: 'Close',
                    onPressed: () => Navigator.of(dialogContext).pop(),
                    icon: Icon(Icons.close_rounded, color: colors.onSurface),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
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
  String get checkingEligibilityMessage => isEnglish
      ? 'Checking eligible serials for this return request...'
      : 'Dang kiem tra serial du dieu kien doi tra...';
  String remoteOrderHint(int remoteOrderId) => isEnglish
      ? 'Runtime order id: $remoteOrderId'
      : 'Ma don runtime: $remoteOrderId';
  String missingOrderMappingMessage(String orderCode) => isEnglish
      ? 'Unable to resolve backend order id for order $orderCode. Please refresh this order and try again.'
      : 'Khong tim thay ma don backend cho don $orderCode. Vui long tai lai don va thu lai.';
  String get loadFailedTitle => isEnglish
      ? 'Unable to load return eligibility'
      : 'Khong the tai du lieu du dieu kien doi tra';
  String get eligibilityLoadTimeoutMessage => isEnglish
      ? 'Loading return eligibility timed out. Please retry.'
      : 'Tai du lieu du dieu kien doi tra bi qua thoi gian. Vui long thu lai.';
  String get eligibilityLoadInvalidResponseMessage => isEnglish
      ? 'The server returned invalid return data. Please retry.'
      : 'May chu tra ve du lieu doi tra khong hop le. Vui long thu lai.';
  String get eligibilityLoadNetworkMessage => isEnglish
      ? 'Unable to reach the server right now. Please retry.'
      : 'Khong the ket noi may chu luc nay. Vui long thu lai.';
  String get eligibilityLoadFailedMessage => isEnglish
      ? 'Unable to load return eligibility right now.'
      : 'Khong the tai du lieu du dieu kien doi tra luc nay.';
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
  String get noEligibleSerialsGuidance => isEnglish
      ? 'There are no eligible serials for the selected return type. Change return type or try again later.'
      : 'Khong co serial du dieu kien cho loai doi tra da chon. Hay doi loai doi tra hoac thu lai sau.';
  String get attachmentSectionLabel =>
      isEnglish ? 'Attachments' : 'Tap dinh kem';
  String get attachmentsTitle =>
      isEnglish ? 'Attachments (optional)' : 'Tap dinh kem (tuy chon)';
  String get addAttachmentAction =>
      isEnglish ? 'Upload attachment' : 'Tai tap dinh kem';
  String get uploadingAttachmentLabel =>
      isEnglish ? 'Uploading attachment...' : 'Dang tai tep...';
  String get openAttachmentAction => isEnglish ? 'Open' : 'Mo';
  String get pickImageAction =>
      isEnglish ? 'Choose image from gallery' : 'Chon anh tu thu vien';
  String get pickVideoAction =>
      isEnglish ? 'Choose video from gallery' : 'Chon video tu thu vien';
  String get pickDocumentAction =>
      isEnglish ? 'Choose PDF document' : 'Chon tai lieu PDF';
  String get attachmentHelper => isEnglish
      ? 'Supported: JPG/JPEG/PNG/WEBP (max 10MB), MP4/WEBM (max 50MB), PDF (max 10MB).'
      : 'Ho tro: JPG/JPEG/PNG/WEBP (toi da 10MB), MP4/WEBM (toi da 50MB), PDF (toi da 10MB).';
  String get submitAction =>
      isEnglish ? 'Submit return request' : 'Gui yeu cau doi tra';
  String get createSuccessMessage => isEnglish
      ? 'Return request created successfully.'
      : 'Da tao yeu cau doi tra thanh cong.';
  String get selectAtLeastOneSerialMessage => isEnglish
      ? 'Select at least one eligible serial.'
      : 'Hay chon it nhat mot serial du dieu kien.';
  String get noEligibleSerialsSubmitMessage => isEnglish
      ? 'No eligible serials are available for this return request.'
      : 'Khong co serial du dieu kien de tao yeu cau doi tra nay.';
  String get attachmentUploadInProgressMessage => isEnglish
      ? 'Please wait for the attachment upload to finish before submitting.'
      : 'Vui long cho tai tap dinh kem xong truoc khi gui yeu cau.';
  String reasonCodeTooLongMessage(int maxLength) => isEnglish
      ? 'Reason code must be at most $maxLength characters.'
      : 'Ma ly do toi da $maxLength ky tu.';
  String reasonDetailTooLongMessage(int maxLength) => isEnglish
      ? 'Reason detail must be at most $maxLength characters.'
      : 'Mo ta chi tiet toi da $maxLength ky tu.';
  String attachmentAddedMessage(String fileName) =>
      isEnglish ? 'Added attachment $fileName.' : 'Da them tep $fileName.';
  String get attachmentUnsupportedTypeMessage => isEnglish
      ? 'Unsupported file type. Please use image, MP4/WEBM video, or PDF.'
      : 'Dinh dang tep khong hop le. Chi ho tro anh, video MP4/WEBM hoac PDF.';
  String get attachmentImageTooLargeMessage =>
      isEnglish ? 'Image exceeds 10MB limit.' : 'Anh vuot qua gioi han 10MB.';
  String get attachmentVideoTooLargeMessage =>
      isEnglish ? 'Video exceeds 50MB limit.' : 'Video vuot qua gioi han 50MB.';
  String get attachmentDocumentTooLargeMessage => isEnglish
      ? 'Document exceeds 10MB limit.'
      : 'Tai lieu vuot qua gioi han 10MB.';
  String attachmentUploadFailed(Object error) =>
      uploadServiceErrorMessage(error, isEnglish: isEnglish);
}
