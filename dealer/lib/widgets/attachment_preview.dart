import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../support_attachment_download.dart';

class AttachmentImagePreviewCard extends StatelessWidget {
  const AttachmentImagePreviewCard({
    super.key,
    required this.asset,
    required this.label,
    required this.previewHeight,
    required this.thumbnailWidth,
    required this.semanticLabel,
    this.openLabel,
  });

  final SupportAttachmentAsset asset;
  final String label;
  final double previewHeight;
  final double thumbnailWidth;
  final String semanticLabel;
  final String? openLabel;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: thumbnailWidth),
      child: Semantics(
        label: semanticLabel,
        button: true,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () =>
              showAttachmentImagePreview(context, asset: asset, title: label),
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
                            label,
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

class AttachmentNetworkImagePreviewCard extends StatelessWidget {
  const AttachmentNetworkImagePreviewCard({
    super.key,
    required this.imageUrl,
    required this.label,
    required this.previewHeight,
    required this.thumbnailWidth,
    required this.semanticLabel,
    this.openLabel,
  });

  final String imageUrl;
  final String label;
  final double previewHeight;
  final double thumbnailWidth;
  final String semanticLabel;
  final String? openLabel;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return ConstrainedBox(
      constraints: BoxConstraints(maxWidth: thumbnailWidth),
      child: Semantics(
        label: semanticLabel,
        button: true,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => openAttachmentUrl(imageUrl),
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
                            label,
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

class AttachmentLoadingPreviewCard extends StatelessWidget {
  const AttachmentLoadingPreviewCard({
    super.key,
    required this.semanticLabel,
    required this.previewHeight,
    required this.thumbnailWidth,
    required this.label,
  });

  final String semanticLabel;
  final double previewHeight;
  final double thumbnailWidth;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticLabel,
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

Future<void> openAttachmentDataUri(String dataUri) async {
  final uri = Uri.tryParse(dataUri);
  if (uri != null) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

Future<void> openAttachmentUrl(String url) async {
  final uri = Uri.tryParse(url);
  if (uri != null) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

Future<void> showAttachmentImagePreview(
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
