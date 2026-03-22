import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../file_reference.dart';

typedef LazyImagePlaceholderBuilder = Widget Function(BuildContext context);

class LazyNetworkImage extends StatefulWidget {
  const LazyNetworkImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.filterQuality = FilterQuality.medium,
    this.placeholderBuilder,
    this.errorBuilder,
    this.deferDuringScroll = true,
  });

  final String url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final FilterQuality filterQuality;
  final LazyImagePlaceholderBuilder? placeholderBuilder;
  final ImageErrorWidgetBuilder? errorBuilder;
  final bool deferDuringScroll;

  @override
  State<LazyNetworkImage> createState() => _LazyNetworkImageState();
}

class _LazyNetworkImageState extends State<LazyNetworkImage> {
  static const Duration _retryDelay = Duration(milliseconds: 120);

  bool _shouldLoad = false;
  bool _isScheduled = false;
  String? _normalizedUrl;

  @override
  void initState() {
    super.initState();
    _normalizedUrl = _normalizeUrl(widget.url);
    _scheduleLoad();
  }

  @override
  void didUpdateWidget(covariant LazyNetworkImage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url != widget.url) {
      _normalizedUrl = _normalizeUrl(widget.url);
      _shouldLoad = false;
      _scheduleLoad();
    }
  }

  void _scheduleLoad() {
    if (_isScheduled || _shouldLoad) {
      return;
    }
    _isScheduled = true;
    Future<void>.delayed(Duration.zero, () {
      _isScheduled = false;
      if (!mounted || _shouldLoad) {
        return;
      }
      if (widget.deferDuringScroll &&
          Scrollable.recommendDeferredLoadingForContext(context)) {
        Future<void>.delayed(_retryDelay, _scheduleLoad);
        return;
      }
      setState(() => _shouldLoad = true);
    });
  }

  String? _normalizeUrl(String rawUrl) {
    final trimmed = rawUrl.trim();
    if (trimmed.isEmpty) {
      return null;
    }

    final withScheme = trimmed.startsWith('//') ? 'https:$trimmed' : trimmed;
    final uri = Uri.tryParse(withScheme);
    if (uri == null || !uri.hasScheme) {
      return null;
    }
    if (!uri.isScheme('http') && !uri.isScheme('https')) {
      return null;
    }
    return withScheme;
  }

  Widget _buildError(
    BuildContext context,
    Object error, [
    StackTrace? stackTrace,
  ]) {
    final builder = widget.errorBuilder;
    if (builder != null) {
      return builder(context, error, stackTrace);
    }
    return _buildPlaceholder(context);
  }

  Widget _buildPlaceholder(BuildContext context) {
    return widget.placeholderBuilder?.call(context) ??
        Container(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          alignment: Alignment.center,
          child: const SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final normalizedUrl = _normalizedUrl;

    if (normalizedUrl == null) {
      return SizedBox(
        width: widget.width,
        height: widget.height,
        child: _buildError(
          context,
          ArgumentError.value(widget.url, 'url', 'Invalid image URL'),
        ),
      );
    }

    if (!_shouldLoad) {
      return SizedBox(
        width: widget.width,
        height: widget.height,
        child: _buildPlaceholder(context),
      );
    }

    return CachedNetworkImage(
      imageUrl: normalizedUrl,
      httpHeaders: authHeadersForResolvedUrl(normalizedUrl),
      width: widget.width,
      height: widget.height,
      fit: widget.fit,
      filterQuality: widget.filterQuality,
      fadeInDuration: const Duration(milliseconds: 200),
      fadeOutDuration: const Duration(milliseconds: 100),
      placeholder: (context, url) => SizedBox(
        width: widget.width,
        height: widget.height,
        child: _buildPlaceholder(context),
      ),
      errorWidget: (context, url, error) => SizedBox(
        width: widget.width,
        height: widget.height,
        child: _buildError(context, error),
      ),
    );
  }
}
