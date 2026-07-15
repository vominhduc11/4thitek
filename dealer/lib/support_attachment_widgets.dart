part of 'support_screen.dart';

class _AttachmentPreviewCard extends StatefulWidget {
  const _AttachmentPreviewCard({
    required this.attachment,
    required this.previewHeight,
    required this.semanticLabel,
    this.openLabel,
    this.downloadLabel,
    this.onDownload,
    this.thumbnailWidth = 220,
  });

  final SupportTicketAttachmentRecord attachment;
  final double previewHeight;
  final double thumbnailWidth;
  final String semanticLabel;
  final String? openLabel;
  final String? downloadLabel;
  final Future<void> Function(
    SupportTicketAttachmentRecord attachment,
    SupportAttachmentAsset asset,
  )?
  onDownload;

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

  String _resolveFetchKey(SupportTicketAttachmentRecord attachment) {
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
        : '';
    final isImageHint =
        (widget.attachment.mediaType ?? '').trim().toLowerCase() == 'image' ||
        isLikelyImageAttachment(
          fileName: widget.attachment.fileName,
          url: widget.attachment.url,
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
      return AttachmentNetworkImagePreviewCard(
        imageUrl: directUrl,
        label: widget.attachment.fileName ?? widget.attachment.url,
        previewHeight: widget.previewHeight,
        thumbnailWidth: widget.thumbnailWidth,
        semanticLabel: widget.semanticLabel,
        openLabel: widget.openLabel,
      );
    }

    if (directUrl.isNotEmpty && (isVideoHint || isDocumentHint)) {
      return _FileAttachmentCard(
        attachment: widget.attachment,
        openLabel: widget.openLabel,
        downloadLabel: widget.downloadLabel,
        onDownload: widget.onDownload,
        semanticLabel: widget.semanticLabel,
        maxWidth: widget.thumbnailWidth,
        asset: null,
        directUrl: directUrl,
        isVideo: isVideoHint,
      );
    }

    return FutureBuilder<SupportAttachmentAsset>(
      future: _loadFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return AttachmentLoadingPreviewCard(
            semanticLabel: widget.semanticLabel,
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
            openLabel: widget.openLabel,
            downloadLabel: widget.downloadLabel,
            onDownload: widget.onDownload,
            semanticLabel: widget.semanticLabel,
            maxWidth: widget.thumbnailWidth,
            asset: null,
            isVideo: isVideoHint,
          );
        }

        if (isImage) {
          return AttachmentImagePreviewCard(
            asset: asset,
            label: widget.attachment.fileName ?? widget.attachment.url,
            openLabel: widget.openLabel,
            previewHeight: widget.previewHeight,
            thumbnailWidth: widget.thumbnailWidth,
            semanticLabel: widget.semanticLabel,
          );
        }

        return _FileAttachmentCard(
          attachment: widget.attachment,
          asset: asset,
          openLabel: widget.openLabel,
          downloadLabel: widget.downloadLabel,
          onDownload: widget.onDownload,
          semanticLabel: widget.semanticLabel,
          maxWidth: widget.thumbnailWidth,
          isVideo: isVideoHint,
        );
      },
    );
  }
}

class _FileAttachmentCard extends StatefulWidget {
  const _FileAttachmentCard({
    required this.attachment,
    required this.semanticLabel,
    required this.asset,
    this.directUrl,
    this.isVideo = false,
    this.openLabel,
    this.downloadLabel,
    this.onDownload,
    this.maxWidth = 220,
  });

  final SupportTicketAttachmentRecord attachment;
  final SupportAttachmentAsset? asset;
  final String? directUrl;
  final bool isVideo;
  final String semanticLabel;
  final String? openLabel;
  final String? downloadLabel;
  final Future<void> Function(
    SupportTicketAttachmentRecord attachment,
    SupportAttachmentAsset asset,
  )?
  onDownload;
  final double maxWidth;

  @override
  State<_FileAttachmentCard> createState() => _FileAttachmentCardState();
}

class _FileAttachmentCardState extends State<_FileAttachmentCard> {
  bool _isDownloading = false;

  Future<void> _handleDownload(SupportAttachmentAsset asset) async {
    final onDownload = widget.onDownload;
    if (onDownload == null || _isDownloading) {
      return;
    }
    setState(() => _isDownloading = true);
    try {
      await onDownload(widget.attachment, asset);
    } finally {
      if (mounted) {
        setState(() => _isDownloading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final asset = widget.asset;
    final directUrl = widget.directUrl?.trim();
    final hasDirectUrl = directUrl != null && directUrl.isNotEmpty;
    final canOpen = asset != null || hasDirectUrl;
    return Semantics(
      label: widget.semanticLabel,
      button: true,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: !canOpen
            ? null
            : () => asset != null
                  ? openAttachmentDataUri(asset.dataUri)
                  : openAttachmentUrl(directUrl!),
        child: Container(
          constraints: BoxConstraints(maxWidth: widget.maxWidth),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: Theme.of(context).colorScheme.surface,
            border: Border.all(
              color: Theme.of(
                context,
              ).colorScheme.outlineVariant.withValues(alpha: 0.45),
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
                    widget.isVideo
                        ? Icons.videocam_outlined
                        : Icons.attach_file_outlined,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      widget.attachment.fileName ?? widget.attachment.url,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              if (asset != null) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (widget.openLabel != null)
                      TextButton(
                        onPressed: () => openAttachmentDataUri(asset.dataUri),
                        child: Text(widget.openLabel!),
                      ),
                    if (widget.downloadLabel != null &&
                        (widget.onDownload != null || hasDirectUrl))
                      OutlinedButton.icon(
                        onPressed: _isDownloading
                            ? null
                            : () => _handleDownload(asset),
                        icon: _isDownloading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.download_outlined, size: 18),
                        label: Text(widget.downloadLabel!),
                      ),
                  ],
                ),
              ] else if (widget.openLabel != null && hasDirectUrl) ...[
                const SizedBox(height: 6),
                Text(
                  widget.openLabel!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w700,
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

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final display = label.isEmpty ? value : '$label: $value';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: Theme.of(context).colorScheme.surface,
      ),
      child: Text(display, style: Theme.of(context).textTheme.bodySmall),
    );
  }
}

class _CompactStatusBadge extends StatelessWidget {
  const _CompactStatusBadge({required this.label, required this.status});

  final String label;
  final String status;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    Color background;
    Color foreground;
    switch (status.trim().toLowerCase()) {
      case 'resolved':
        background = const Color(0xFF163624);
        foreground = const Color(0xFF71E2A0);
        break;
      case 'in_progress':
        background = const Color(0xFF3A2C11);
        foreground = const Color(0xFFF7D46B);
        break;
      case 'closed':
        background = colorScheme.surface;
        foreground = colorScheme.onSurfaceVariant;
        break;
      default:
        background = colorScheme.primary.withValues(alpha: 0.14);
        foreground = colorScheme.primary;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelLarge?.copyWith(
          color: foreground,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

SupportPriority _parsePriorityStatic(String raw) {
  switch (raw.trim().toLowerCase()) {
    case 'urgent':
      return SupportPriority.urgent;
    case 'high':
      return SupportPriority.high;
    default:
      return SupportPriority.normal;
  }
}

String _formatDateTime(DateTime value) {
  final day = value.day.toString().padLeft(2, '0');
  final month = value.month.toString().padLeft(2, '0');
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '$day/$month/${value.year} $hour:$minute';
}

class _FaqItem {
  const _FaqItem({required this.title, required this.body, required this.icon});

  final String title;
  final String body;
  final IconData icon;
}

class _FaqTile extends StatelessWidget {
  const _FaqTile({required this.item, required this.showDivider});

  final _FaqItem item;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: colors.secondaryContainer.withValues(alpha: 0.72),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(item.icon, color: colors.onSecondaryContainer),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.body,
                      style: textTheme.bodyMedium?.copyWith(
                        color: colors.onSurfaceVariant,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (showDivider) const Divider(height: 0),
      ],
    );
  }
}
