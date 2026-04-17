import 'package:flutter/foundation.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';

class SupportScreenDiagnostics {
  SupportScreenDiagnostics._();

  static final SupportScreenDiagnostics instance =
      SupportScreenDiagnostics._();

  final bool _enabled = kDebugMode;
  bool _timingsAttached = false;
  bool _scrollSessionActive = false;

  int _supportScreenBuildCount = 0;
  int _supportHistoryBuildCount = 0;
  int _supportHistoryCardBuildCount = 0;
  int _autoScrollCount = 0;
  int _latestReloadCount = 0;
  int _historyReloadCount = 0;
  int _supportEventCount = 0;

  int _sessionSupportScreenBuildBaseline = 0;
  int _sessionSupportHistoryBuildBaseline = 0;
  int _sessionSupportHistoryCardBuildBaseline = 0;
  int _sessionAutoScrollBaseline = 0;
  int _sessionLatestReloadBaseline = 0;
  int _sessionHistoryReloadBaseline = 0;
  int _sessionSupportEventBaseline = 0;

  DateTime? _sessionStartedAt;
  double? _sessionStartPixels;
  double? _sessionEndPixels;
  double _sessionMinPixels = double.infinity;
  double _sessionMaxPixels = double.negativeInfinity;
  int _sessionScrollUpdateCount = 0;
  int _sessionOverscrollCount = 0;
  final List<FrameTiming> _sessionFrameTimings = <FrameTiming>[];

  void attach() {
    if (!_enabled || _timingsAttached) {
      return;
    }
    SchedulerBinding.instance.addTimingsCallback(_handleTimings);
    _timingsAttached = true;
  }

  void detach() {
    if (_timingsAttached) {
      SchedulerBinding.instance.removeTimingsCallback(_handleTimings);
      _timingsAttached = false;
    }
    _resetSession();
  }

  void recordSupportScreenBuild() {
    if (!_enabled) return;
    _supportScreenBuildCount += 1;
  }

  void recordSupportHistoryBuild() {
    if (!_enabled) return;
    _supportHistoryBuildCount += 1;
  }

  void recordSupportHistoryCardBuild() {
    if (!_enabled) return;
    _supportHistoryCardBuildCount += 1;
  }

  void recordAutoScroll(String target) {
    if (!_enabled) return;
    _autoScrollCount += 1;
    if (_scrollSessionActive) {
      debugPrint('[SupportDiagnostics] autoScroll target=$target whileScroll=true');
    }
  }

  void recordLatestReload(Duration duration) {
    if (!_enabled) return;
    _latestReloadCount += 1;
    debugPrint(
      '[SupportDiagnostics] reload latest durationMs=${duration.inMilliseconds}',
    );
  }

  void recordHistoryReload(Duration duration) {
    if (!_enabled) return;
    _historyReloadCount += 1;
    debugPrint(
      '[SupportDiagnostics] reload history durationMs=${duration.inMilliseconds}',
    );
  }

  void recordSupportEvent() {
    if (!_enabled) return;
    _supportEventCount += 1;
  }

  void recordScrollNotification(ScrollNotification notification) {
    if (!_enabled) return;

    if (notification.metrics.axis != Axis.vertical) {
      return;
    }

    if (notification is ScrollStartNotification) {
      _startSession(notification.metrics.pixels);
      debugPrint(
        '[SupportDiagnostics] scrollStart pixels=${notification.metrics.pixels.toStringAsFixed(1)}',
      );
      return;
    }

    if (!_scrollSessionActive &&
        (notification is ScrollUpdateNotification ||
            notification is OverscrollNotification)) {
      _startSession(notification.metrics.pixels);
    }

    if (notification is ScrollUpdateNotification) {
      _sessionScrollUpdateCount += 1;
      _sessionEndPixels = notification.metrics.pixels;
      _sessionMinPixels = _min(
        _sessionMinPixels,
        notification.metrics.pixels,
      );
      _sessionMaxPixels = _max(
        _sessionMaxPixels,
        notification.metrics.pixels,
      );
      return;
    }

    if (notification is OverscrollNotification) {
      _sessionOverscrollCount += 1;
      _sessionEndPixels = notification.metrics.pixels;
      _sessionMinPixels = _min(
        _sessionMinPixels,
        notification.metrics.pixels,
      );
      _sessionMaxPixels = _max(
        _sessionMaxPixels,
        notification.metrics.pixels,
      );
      return;
    }

    if (notification is ScrollEndNotification) {
      _sessionEndPixels = notification.metrics.pixels;
      _emitSummary('scrollEnd');
      return;
    }
  }

  void _handleTimings(List<FrameTiming> timings) {
    if (!_enabled || !_scrollSessionActive) {
      return;
    }
    _sessionFrameTimings.addAll(timings);
  }

  void _startSession(double pixels) {
    if (_scrollSessionActive) {
      return;
    }
    _scrollSessionActive = true;
    _sessionStartedAt = DateTime.now();
    _sessionStartPixels = pixels;
    _sessionEndPixels = pixels;
    _sessionMinPixels = pixels;
    _sessionMaxPixels = pixels;
    _sessionScrollUpdateCount = 0;
    _sessionOverscrollCount = 0;
    _sessionFrameTimings.clear();
    _sessionSupportScreenBuildBaseline = _supportScreenBuildCount;
    _sessionSupportHistoryBuildBaseline = _supportHistoryBuildCount;
    _sessionSupportHistoryCardBuildBaseline = _supportHistoryCardBuildCount;
    _sessionAutoScrollBaseline = _autoScrollCount;
    _sessionLatestReloadBaseline = _latestReloadCount;
    _sessionHistoryReloadBaseline = _historyReloadCount;
    _sessionSupportEventBaseline = _supportEventCount;
  }

  void _emitSummary(String reason) {
    if (!_scrollSessionActive || _sessionStartedAt == null) {
      return;
    }

    final elapsed = DateTime.now().difference(_sessionStartedAt!);
    final buildMs = _sessionFrameTimings
        .map((timing) => timing.buildDuration.inMicroseconds / 1000.0)
        .toList(growable: false);
    final rasterMs = _sessionFrameTimings
        .map((timing) => timing.rasterDuration.inMicroseconds / 1000.0)
        .toList(growable: false);
    final avgBuildMs = _average(buildMs);
    final avgRasterMs = _average(rasterMs);
    final maxBuildMs = _maxDouble(buildMs);
    final maxRasterMs = _maxDouble(rasterMs);
    final janky16 = _sessionFrameTimings
        .where(
          (timing) =>
              timing.totalSpan.inMilliseconds > 16 ||
              timing.buildDuration.inMilliseconds > 16 ||
              timing.rasterDuration.inMilliseconds > 16,
        )
        .length;
    final janky33 = _sessionFrameTimings
        .where(
          (timing) =>
              timing.totalSpan.inMilliseconds > 33 ||
              timing.buildDuration.inMilliseconds > 33 ||
              timing.rasterDuration.inMilliseconds > 33,
        )
        .length;

    debugPrint(
      '[SupportDiagnostics] summary reason=$reason '
      'durationMs=${elapsed.inMilliseconds} '
      'updates=$_sessionScrollUpdateCount '
      'overscroll=$_sessionOverscrollCount '
      'pixels=${_fmt(_sessionStartPixels)}->${_fmt(_sessionEndPixels)} '
      'span=${_fmt(_sessionMinPixels)}..${_fmt(_sessionMaxPixels)} '
      'screenBuilds=${_supportScreenBuildCount - _sessionSupportScreenBuildBaseline} '
      'historyBuilds=${_supportHistoryBuildCount - _sessionSupportHistoryBuildBaseline} '
      'historyCardBuilds=${_supportHistoryCardBuildCount - _sessionSupportHistoryCardBuildBaseline} '
      'autoScrolls=${_autoScrollCount - _sessionAutoScrollBaseline} '
      'latestReloads=${_latestReloadCount - _sessionLatestReloadBaseline} '
      'historyReloads=${_historyReloadCount - _sessionHistoryReloadBaseline} '
      'supportEvents=${_supportEventCount - _sessionSupportEventBaseline} '
      'frames=${_sessionFrameTimings.length} '
      'buildAvgMs=${avgBuildMs.toStringAsFixed(1)} '
      'buildMaxMs=${maxBuildMs.toStringAsFixed(1)} '
      'rasterAvgMs=${avgRasterMs.toStringAsFixed(1)} '
      'rasterMaxMs=${maxRasterMs.toStringAsFixed(1)} '
      'janky16=$janky16 '
      'janky33=$janky33',
    );

    _resetSession();
  }

  void _resetSession() {
    _scrollSessionActive = false;
    _sessionStartedAt = null;
    _sessionStartPixels = null;
    _sessionEndPixels = null;
    _sessionMinPixels = double.infinity;
    _sessionMaxPixels = double.negativeInfinity;
    _sessionScrollUpdateCount = 0;
    _sessionOverscrollCount = 0;
    _sessionFrameTimings.clear();
  }

  double _average(List<double> values) {
    if (values.isEmpty) {
      return 0;
    }
    final sum = values.fold<double>(0, (total, value) => total + value);
    return sum / values.length;
  }

  double _maxDouble(List<double> values) {
    if (values.isEmpty) {
      return 0;
    }
    return values.reduce((left, right) => left > right ? left : right);
  }

  double _min(double left, double right) => left < right ? left : right;

  double _max(double left, double right) => left > right ? left : right;

  String _fmt(double? value) {
    if (value == null || value.isInfinite) {
      return 'n/a';
    }
    return value.toStringAsFixed(1);
  }
}
