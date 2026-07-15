part of 'return_create_screen.dart';

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
              labelText: isEnglish ? 'Item condition' : 'Tình trạng serial',
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
              isEnglish ? 'Open active request' : 'Mở yêu cầu đang xử lý',
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
        (widget.attachment.contentType ?? '').trim().toLowerCase().startsWith(
          'image/',
        );
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
      final label = widget.attachment.fileName ?? widget.attachment.url;
      return AttachmentNetworkImagePreviewCard(
        imageUrl: directUrl,
        label: label,
        previewHeight: widget.previewHeight,
        thumbnailWidth: widget.thumbnailWidth,
        semanticLabel: label,
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
          final label = widget.attachment.fileName ?? widget.attachment.url;
          return AttachmentLoadingPreviewCard(
            previewHeight: widget.previewHeight,
            thumbnailWidth: widget.thumbnailWidth,
            label: label,
            semanticLabel: label,
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
          final label = widget.attachment.fileName ?? widget.attachment.url;
          return AttachmentImagePreviewCard(
            asset: asset,
            label: label,
            previewHeight: widget.previewHeight,
            thumbnailWidth: widget.thumbnailWidth,
            semanticLabel: label,
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
                  ? openAttachmentDataUri(asset!.dataUri)
                  : openAttachmentUrl(directUrl!),
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
                  isVideo
                      ? Icons.videocam_outlined
                      : Icons.description_outlined,
                  color: colors.onSurfaceVariant,
                ),
              ),
              if (openLabel != null) ...[
                const SizedBox(height: 8),
                TextButton(
                  onPressed: canOpen
                      ? () => asset != null
                            ? openAttachmentDataUri(asset!.dataUri)
                            : openAttachmentUrl(directUrl!)
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
