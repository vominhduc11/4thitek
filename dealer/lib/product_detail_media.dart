part of 'product_detail_screen.dart';

class _MediaPreview extends StatelessWidget {
  const _MediaPreview({required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final resolvedUrl = resolveFileReference(url);
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: LazyNetworkImage(
          url: resolvedUrl,
          fit: BoxFit.cover,
          placeholderBuilder: (context) => Container(
            color: colors.surfaceContainerHighest.withValues(alpha: 0.6),
            alignment: Alignment.center,
            child: const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
          errorBuilder: (context, error, stackTrace) => Container(
            color: colors.surfaceContainerHighest.withValues(alpha: 0.6),
            alignment: Alignment.center,
            child: Icon(
              Icons.broken_image_outlined,
              color: colors.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }
}

class _VideoSection extends StatelessWidget {
  const _VideoSection({required this.videos, required this.contentPadding});

  final List<ProductVideoItem> videos;
  final double contentPadding;

  @override
  Widget build(BuildContext context) {
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      padding: EdgeInsets.all(contentPadding),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            texts.productVideosTitle,
            style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          if (videos.isEmpty)
            Text(
              texts.noProductVideosMessage,
              style: textTheme.bodySmall?.copyWith(
                color: colors.onSurfaceVariant,
              ),
            )
          else
            ...videos.map(
              (video) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: colors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: colors.primary.withValues(alpha: 0.18),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.play_circle_outline, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            video.title.trim().isEmpty
                                ? texts.defaultVideoTitle
                                : video.title.trim(),
                            style: textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (video.url.trim().isNotEmpty) ...[
                      const SizedBox(height: 10),
                      _InlineVideoPlayer(url: video.url.trim()),
                    ],
                    if (video.description?.trim().isNotEmpty ?? false) ...[
                      const SizedBox(height: 4),
                      Text(
                        video.description!.trim(),
                        style: textTheme.bodySmall?.copyWith(
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _InlineVideoPlayer extends StatefulWidget {
  const _InlineVideoPlayer({required this.url});

  final String url;

  @override
  State<_InlineVideoPlayer> createState() => _InlineVideoPlayerState();
}

bool _isYouTubeVideoUrl(String rawUrl) {
  final resolved = resolveFileReference(rawUrl).trim();
  final uri = Uri.tryParse(resolved);
  if (uri == null) {
    return false;
  }
  final host = uri.host.toLowerCase();
  return host.contains('youtube.com') || host.contains('youtu.be');
}

class _InlineVideoPlayerState extends State<_InlineVideoPlayer> {
  static const Duration _videoInitTimeout = Duration(seconds: 12);

  VideoPlayerController? _videoController;
  ChewieController? _chewieController;
  bool _hasError = false;
  bool _isInitializing = false;
  bool _shouldLoad = false;
  String? _errorMessage;

  @override
  void didUpdateWidget(covariant _InlineVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url) {
      _disposeController();
      if (mounted) {
        setState(() {
          _hasError = false;
          _isInitializing = false;
          _shouldLoad = false;
          _errorMessage = null;
        });
      } else {
        _hasError = false;
        _isInitializing = false;
        _shouldLoad = false;
        _errorMessage = null;
      }
    }
  }

  void _requestLoad() {
    if (_shouldLoad || _isInitializing) {
      return;
    }
    setState(() => _shouldLoad = true);
    _initPlayer();
  }

  Future<void> _initPlayer() async {
    final texts = _productDetailTexts(context);
    if (mounted) {
      setState(() {
        _isInitializing = true;
        _hasError = false;
        _errorMessage = null;
      });
    } else {
      _isInitializing = true;
      _hasError = false;
      _errorMessage = null;
    }

    final attempts = _buildAttemptUrls(widget.url);
    final errors = <String>[];

    for (final attemptUrl in attempts) {
      final uri = Uri.tryParse(attemptUrl);
      if (uri == null || (!uri.isScheme('http') && !uri.isScheme('https'))) {
        errors.add('Invalid URL: $attemptUrl');
        continue;
      }

      final controller = VideoPlayerController.networkUrl(uri);
      try {
        await controller.initialize().timeout(_videoInitTimeout);
        await controller.setLooping(false);
        final chewieController = ChewieController(
          videoPlayerController: controller,
          autoPlay: false,
          looping: false,
          showControlsOnInitialize: true,
          errorBuilder: (context, errorMessage) {
            return _VideoFallback(message: errorMessage, onRetry: _requestLoad);
          },
        );

        _videoController = controller;
        _chewieController = chewieController;
        if (mounted) {
          setState(() => _isInitializing = false);
        } else {
          _isInitializing = false;
        }
        return;
      } on TimeoutException {
        errors.add(
          '$attemptUrl -> timeout after ${_videoInitTimeout.inSeconds}s',
        );
        await controller.dispose();
      } catch (error) {
        errors.add('$attemptUrl -> $error');
        await controller.dispose();
      }
    }

    if (mounted) {
      setState(() {
        _isInitializing = false;
        _hasError = true;
        _errorMessage = errors.isEmpty
            ? texts.invalidProductVideoMessage
            : texts.cannotPlayVideoNowMessage;
      });
    } else {
      _isInitializing = false;
      _hasError = true;
    }
  }

  List<String> _buildAttemptUrls(String primaryUrl) {
    final urls = <String>[];
    final cleanedPrimary = resolveFileReference(primaryUrl).trim();
    if (cleanedPrimary.isNotEmpty) {
      urls.add(cleanedPrimary);
    }

    return urls.toSet().toList();
  }

  void _disposeController() {
    final chewieController = _chewieController;
    final videoController = _videoController;
    _chewieController = null;
    _videoController = null;
    chewieController?.dispose();
    videoController?.dispose();
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isYouTubeVideoUrl(widget.url)) {
      return _VideoExternalLink(url: widget.url);
    }

    final videoController = _videoController;
    final chewieController = _chewieController;

    if (!_shouldLoad) {
      return _VideoDeferredPlaceholder(onTap: _requestLoad);
    }

    if (_hasError) {
      return _VideoFallback(message: _errorMessage, onRetry: _requestLoad);
    }

    if (_isInitializing ||
        videoController == null ||
        chewieController == null) {
      return const AspectRatio(
        aspectRatio: 16 / 9,
        child: Center(child: CircularProgressIndicator(strokeWidth: 2.2)),
      );
    }

    if (videoController.value.hasError) {
      return _VideoFallback(
        message: videoController.value.errorDescription,
        onRetry: _requestLoad,
      );
    }

    if (!videoController.value.isInitialized) {
      return const AspectRatio(
        aspectRatio: 16 / 9,
        child: Center(child: CircularProgressIndicator(strokeWidth: 2.2)),
      );
    }

    final aspect = videoController.value.aspectRatio == 0
        ? 16 / 9
        : videoController.value.aspectRatio;

    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: AspectRatio(
        aspectRatio: aspect,
        child: Chewie(controller: chewieController),
      ),
    );
  }
}

class _VideoExternalLink extends StatelessWidget {
  const _VideoExternalLink({required this.url});

  final String url;

  Future<void> _open(BuildContext context) async {
    final texts = _productDetailTexts(context);
    final messenger = ScaffoldMessenger.maybeOf(context);
    final resolved = resolveFileReference(url).trim();
    final uri = Uri.tryParse(resolved);
    if (uri == null) {
      messenger?.showSnackBar(
        SnackBar(content: Text(texts.invalidVideoLinkMessage)),
      );
      return;
    }
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched) {
      messenger?.showSnackBar(
        SnackBar(content: Text(texts.cannotOpenVideoNowMessage)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isYouTube = _isYouTubeVideoUrl(url);
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isYouTube ? Icons.smart_display_outlined : Icons.open_in_new,
                size: 18,
                color: colors.onSurfaceVariant,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isYouTube
                      ? texts.youtubeExternalOpenMessage
                      : texts.videoExternalOpenMessage,
                  style: textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () => _open(context),
            icon: const Icon(Icons.open_in_new, size: 16),
            label: Text(
              isYouTube ? texts.openOnYoutubeAction : texts.openVideoAction,
            ),
          ),
        ],
      ),
    );
  }
}

class _VideoFallback extends StatelessWidget {
  const _VideoFallback({this.message, this.onRetry});

  final String? message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.error_outline, size: 18, color: colors.onSurfaceVariant),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  texts.cannotLoadVideoOnDeviceMessage,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                  ),
                ),
                if (message != null && message!.trim().isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    message!,
                    maxLines: 6,
                    overflow: TextOverflow.fade,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                ],
                if (onRetry != null) ...[
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: onRetry,
                    icon: const Icon(Icons.refresh, size: 16),
                    label: Text(texts.retryLoadAction),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VideoDeferredPlaceholder extends StatelessWidget {
  const _VideoDeferredPlaceholder({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final texts = _productDetailTexts(context);
    final colors = Theme.of(context).colorScheme;
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Material(
        color: colors.surfaceContainerHighest.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.play_circle_fill, size: 38, color: colors.primary),
                const SizedBox(height: 8),
                Text(
                  texts.tapToLoadVideoMessage,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
