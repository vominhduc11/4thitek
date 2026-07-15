// ignore_for_file: invalid_use_of_protected_member

part of 'return_create_screen.dart';

extension _ReturnCreateForm on _DealerReturnCreateScreenState {
  Future<void> _pickAttachment() async {
    if (_isUploadingAttachment) {
      return;
    }
    final texts = _dealerReturnCreateTexts(context);
    final messenger = ScaffoldMessenger.of(context);
    final picked =
        await (widget.attachmentPicker ??
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
      messenger.showSnackBar(
        SnackBar(content: Text(texts.attachmentUploadFailed(error))),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isUploadingAttachment = false;
          _attachmentUploadProgress = null;
        });
      }
    }
  }

  Future<XFile?> _pickReturnAttachmentFile(
    _DealerReturnCreateTexts texts,
  ) async {
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
}
