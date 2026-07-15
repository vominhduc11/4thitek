// ignore_for_file: invalid_use_of_protected_member

part of 'support_screen.dart';

extension _SupportScreenAttachments on _SupportScreenState {
  Future<void> _handleAddAttachment(_SupportTexts texts) async {
    if (_interactionMode == SupportInteractionMode.followingUp &&
        _selectedTicketForReply == null) {
      _showSnackBar(texts.selectTicketToReplyMessage);
      return;
    }
    final picked =
        await (widget.attachmentPicker ??
            () => _pickSupportAttachmentFile(texts))();
    if (picked == null || !mounted) {
      return;
    }
    final validationMessage = await _validateSupportAttachment(picked, texts);
    if (validationMessage != null) {
      _showSnackBar(validationMessage);
      return;
    }

    setState(() {
      _isUploadingAttachment = true;
      _attachmentUploadProgress = 0;
    });
    final uploadService = _createUploadService();
    try {
      final uploaded = await uploadService.uploadSupportMediaFile(
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
        _activeDraftAttachments().add(
          SupportTicketAttachmentRecord(
            url: uploaded.url,
            accessUrl: uploaded.accessUrl,
            fileName: uploaded.fileName,
            id: uploaded.mediaAssetId,
            mediaType: uploaded.mediaType,
            contentType: uploaded.contentType,
            sizeBytes: uploaded.sizeBytes,
          ),
        );
      });
      _showSnackBar(texts.attachmentAddedMessage(picked.name));
    } catch (error) {
      _showSnackBar(texts.attachmentUploadFailed(error));
    } finally {
      uploadService.close();
      if (mounted) {
        setState(() {
          _isUploadingAttachment = false;
          _attachmentUploadProgress = null;
        });
      }
    }
  }

  Future<XFile?> _pickSupportAttachmentFile(_SupportTexts texts) async {
    final choice = await showModalBottomSheet<_SupportAttachmentPickerChoice>(
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
                ).pop(_SupportAttachmentPickerChoice.image),
              ),
              ListTile(
                leading: const Icon(Icons.videocam_outlined),
                title: Text(texts.pickVideoAction),
                onTap: () => Navigator.of(
                  sheetContext,
                ).pop(_SupportAttachmentPickerChoice.video),
              ),
              ListTile(
                leading: const Icon(Icons.picture_as_pdf_outlined),
                title: Text(texts.pickDocumentAction),
                onTap: () => Navigator.of(
                  sheetContext,
                ).pop(_SupportAttachmentPickerChoice.document),
              ),
            ],
          ),
        );
      },
    );

    if (choice == null) {
      return null;
    }

    if (choice == _SupportAttachmentPickerChoice.image) {
      return ImagePicker().pickImage(source: ImageSource.gallery);
    }
    if (choice == _SupportAttachmentPickerChoice.video) {
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

  Future<String?> _validateSupportAttachment(
    XFile file,
    _SupportTexts texts,
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

  Future<void> _removeDraftAttachment(
    SupportTicketAttachmentRecord attachment,
  ) async {
    if (_isDeletingAttachment) {
      return;
    }
    final isCreatingMode = _interactionMode == SupportInteractionMode.creating;
    final ticketId = _selectedTicketForReply?.id;
    final uploadService = _createUploadService();
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isDeletingAttachment = true);
    try {
      final mediaAssetId = attachment.id;
      if (mediaAssetId != null && mediaAssetId > 0) {
        await uploadService.deleteMediaAsset(mediaAssetId);
      } else {
        await uploadService.deleteUrl(attachment.url);
      }
      if (!mounted) {
        return;
      }
      setState(() {
        final attachmentKey = attachment.id?.toString() ?? attachment.url;
        if (isCreatingMode) {
          _createDraftAttachments.removeWhere(
            (item) => (item.id?.toString() ?? item.url) == attachmentKey,
          );
        } else if (ticketId != null) {
          final target = _followUpAttachmentsByTicketId[ticketId];
          target?.removeWhere(
            (item) => (item.id?.toString() ?? item.url) == attachmentKey,
          );
          if (target != null && target.isEmpty) {
            _followUpAttachmentsByTicketId.remove(ticketId);
          }
        }
      });
    } catch (error) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(
            content: Text(
              uploadServiceErrorMessage(
                error,
                isEnglish:
                    AppSettingsScope.of(context).locale.languageCode == 'en',
              ),
            ),
          ),
        );
      }
    } finally {
      uploadService.close();
      if (mounted) {
        setState(() => _isDeletingAttachment = false);
      }
    }
  }
}
