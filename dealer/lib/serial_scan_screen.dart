import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'widgets/brand_identity.dart';

class SerialScanScreen extends StatefulWidget {
  const SerialScanScreen({super.key});

  @override
  State<SerialScanScreen> createState() => _SerialScanScreenState();
}

class _SerialScanScreenState extends State<SerialScanScreen>
    with SingleTickerProviderStateMixin {
  static const double _scanFrameRadius = 20;
  static const Duration _scanSuccessDelay = Duration(milliseconds: 180);

  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    detectionTimeoutMs: 220,
  );
  final TextEditingController _manualController = TextEditingController();
  final ImagePicker _imagePicker = ImagePicker();
  late final AnimationController _scanLineController;
  bool _isCompleting = false;
  bool _isPickingImage = false;
  bool _showSuccessFlash = false;

  @override
  void initState() {
    super.initState();
    _scanLineController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1450),
    )..repeat();
  }

  @override
  void dispose() {
    _scanLineController.dispose();
    _manualController.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  bool _isEnglishLocale() {
    return AppSettingsScope.of(context).locale.languageCode == 'en';
  }

  Rect _scanWindowFor({
    required Size size,
    required EdgeInsets safePadding,
    required bool isLandscape,
    required double rightPanelWidth,
  }) {
    const double horizontalPadding = 20;
    const double verticalPadding = 16;
    const double panelGap = 12;

    final double left = safePadding.left + horizontalPadding;
    final double top = safePadding.top + verticalPadding;

    final double rightReserved =
        safePadding.right +
        horizontalPadding +
        (isLandscape ? rightPanelWidth + panelGap : 0);
    final double bottomReserved = safePadding.bottom + (isLandscape ? 28 : 156);

    final double width = math.max(180, size.width - left - rightReserved);
    final double height = math.max(180, size.height - top - bottomReserved);
    return Rect.fromLTWH(left, top, width, height);
  }

  void _handleDetect(BarcodeCapture capture) {
    if (_isCompleting || !mounted) {
      return;
    }
    for (final barcode in capture.barcodes) {
      final raw = barcode.rawValue?.trim();
      if (raw == null || raw.isEmpty) {
        continue;
      }
      _completeWith(raw);
      return;
    }
  }

  void _completeWith(String value) {
    if (_isCompleting || !mounted) {
      return;
    }
    setState(() {
      _isCompleting = true;
      _showSuccessFlash = true;
    });
    HapticFeedback.mediumImpact();
    Future<void>.delayed(_scanSuccessDelay, () {
      if (!mounted) return;
      Navigator.of(context).pop(value);
    });
    // Fade out the success flash after a short display.
    Future<void>.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) setState(() => _showSuccessFlash = false);
    });
  }

  void _showMessage(String message) {
    if (!mounted || message.trim().isEmpty) {
      return;
    }
    final messenger = ScaffoldMessenger.of(context);
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _pasteManual() async {
    if (_isCompleting) {
      return;
    }
    final isEnglish = _isEnglishLocale();
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (!mounted) {
      return;
    }
    final pasted = data?.text?.trim() ?? '';
    if (pasted.isEmpty) {
      _showMessage(
        isEnglish
            ? 'Clipboard has no serial text to paste.'
            : 'Clipboard không có dữ liệu serial để dán.',
      );
      return;
    }
    _manualController.value = TextEditingValue(
      text: pasted,
      selection: TextSelection.collapsed(offset: pasted.length),
    );
    HapticFeedback.selectionClick();
  }

  Future<void> _scanFromImage() async {
    if (_isCompleting || _isPickingImage) {
      return;
    }

    final isEnglish = _isEnglishLocale();
    HapticFeedback.selectionClick();
    final bool wasScannerRunning = _scannerController.value.isRunning;
    setState(() => _isPickingImage = true);
    try {
      if (wasScannerRunning) {
        await _scannerController.stop();
      }

      XFile? picked;
      try {
        picked = await _imagePicker.pickImage(
          source: ImageSource.gallery,
          requestFullMetadata: false,
        );
      } on PlatformException {
        picked = await _imagePicker.pickMedia(requestFullMetadata: false);
      }

      if (picked == null) {
        _showMessage(
          isEnglish
              ? 'No image selected for scanning.'
              : 'Bạn chưa chọn ảnh để quét.',
        );
        return;
      }

      final BarcodeCapture? capture = await _scannerController.analyzeImage(
        picked.path,
      );
      String? serial;
      for (final Barcode barcode in capture?.barcodes ?? <Barcode>[]) {
        final String? raw = barcode.rawValue?.trim();
        if (raw != null && raw.isNotEmpty) {
          serial = raw;
          break;
        }
      }

      if (serial == null) {
        _showMessage(
          isEnglish
              ? 'No QR or barcode found in the selected image.'
              : 'Không tìm thấy mã QR hoặc barcode trong ảnh.',
        );
        return;
      }
      _completeWith(serial);
    } on MissingPluginException {
      _showMessage(
        isEnglish
            ? 'Image picker is unavailable. Please restart the app.'
            : 'Chức năng chọn ảnh chưa sẵn sàng. Hãy khởi động lại app.',
      );
    } on PlatformException catch (error) {
      final code = error.code.toLowerCase();
      if (code.contains('denied')) {
        _showMessage(
          isEnglish
              ? 'Photo library permission denied. Please allow permission and try again.'
              : 'Không có quyền truy cập thư viện ảnh. Hãy cấp quyền rồi thử lại.',
        );
      } else if (code.contains('already_active')) {
        _showMessage(
          isEnglish
              ? 'Photo picker is already open. Please wait a moment.'
              : 'Thư viện ảnh đang mở. Vui lòng chờ trong giây lát.',
        );
      } else {
        final detailMessage = (error.message ?? '').trim();
        _showMessage(
          detailMessage.isEmpty
              ? isEnglish
                    ? 'Cannot open photo library (${error.code}).'
                    : 'Không thể mở thư viện ảnh (${error.code}).'
              : isEnglish
              ? 'Cannot open photo library (${error.code}). $detailMessage'
              : 'Không thể mở thư viện ảnh (${error.code}). $detailMessage',
        );
      }
    } catch (_) {
      _showMessage(
        isEnglish
            ? 'Cannot read serial from image. Please try again.'
            : 'Không thể đọc mã từ ảnh. Vui lòng thử lại.',
      );
    } finally {
      if (mounted) {
        setState(() => _isPickingImage = false);
        if (!_isCompleting && wasScannerRunning) {
          try {
            await _scannerController.start();
          } catch (_) {
            _showMessage(
              isEnglish
                  ? 'Cannot restart camera. Please try again.'
                  : 'Không thể khởi động lại camera. Vui lòng thử lại.',
            );
          }
        }
      }
    }
  }

  Future<void> _restartCamera() async {
    final isEnglish = _isEnglishLocale();
    try {
      await _scannerController.stop();
      await _scannerController.start();
    } catch (_) {
      _showMessage(
        isEnglish
            ? 'Cannot start camera. Please try again.'
            : 'Không thể khởi động camera. Vui lòng thử lại.',
      );
    }
  }

  void _submitManual() {
    final isEnglish = _isEnglishLocale();
    final value = _manualController.text.trim();
    if (value.isEmpty) {
      _showMessage(
        isEnglish
            ? 'Please enter serial or QR content.'
            : 'Vui lòng nhập serial hoặc mã QR.',
      );
      return;
    }
    _completeWith(value);
  }

  @override
  Widget build(BuildContext context) {
    final isEnglish = _isEnglishLocale();
    final colors = Theme.of(context).colorScheme;
    final isTablet = AppBreakpoints.isTablet(context);

    final title = isEnglish ? 'Scan QR / Barcode' : 'Quét QR / Barcode';
    final fromImageTooltip = isEnglish ? 'Scan from image' : 'Quét từ ảnh';
    final torchOnTooltip = isEnglish ? 'Turn off flashlight' : 'Tắt đèn pin';
    final torchOffTooltip = isEnglish ? 'Turn on flashlight' : 'Bật đèn pin';
    final switchCameraTooltip = isEnglish ? 'Switch camera' : 'Đổi camera';
    final permissionDeniedMessage = isEnglish
        ? 'Camera permission is denied. Open app settings and enable camera access.'
        : 'Quyền camera đang bị từ chối. Hãy vào cài đặt ứng dụng và bật lại quyền.';
    final cameraAccessError = isEnglish
        ? 'Cannot access camera. Please check and try again.'
        : 'Không thể truy cập camera. Hãy kiểm tra lại và thử lại.';
    final statusError = isEnglish
        ? 'Cannot access camera'
        : 'Không thể truy cập camera';
    final statusLoading = isEnglish
        ? 'Starting camera...'
        : 'Đang khởi động camera...';
    final statusReady = isEnglish
        ? 'Scanning... Keep the code inside the frame.'
        : 'Đang quét mã. Giữ mã trong khung.';
    final manualTitle = isEnglish
        ? 'Cannot scan? Enter manually'
        : 'Không quét được? Nhập thủ công';
    final manualDescription = isEnglish
        ? 'Paste or type serial when camera cannot read the code.'
        : 'Dán hoặc nhập serial nếu camera không đọc được mã.';
    final manualHint = isEnglish ? 'Enter serial...' : 'Nhập serial...';
    final submitSerialTooltip = isEnglish ? 'Submit serial' : 'Xác nhận serial';
    final clearSerialTooltip = isEnglish ? 'Clear input' : 'Xóa nội dung';
    final pasteSerialTooltip = isEnglish
        ? 'Paste from clipboard'
        : 'Dán từ clipboard';
    final loadingCameraText = statusLoading;
    final cameraErrorTitle = statusError;
    final retryLabel = isEnglish ? 'Retry' : 'Thử lại';
    final scannerAreaLabel = isEnglish
        ? 'Camera scan frame'
        : 'Khung quét camera';
    final scannerAreaHint = isEnglish
        ? 'Align QR or barcode within the frame.'
        : 'Đưa mã QR hoặc barcode vào trong khung.';
    final statusBannerSemantics = isEnglish ? 'Scan status' : 'Trạng thái quét';
    final manualSectionSemanticsLabel = isEnglish
        ? 'Manual serial input section'
        : 'Khu vực nhập serial thủ công';
    final manualSectionSemanticsHint = isEnglish
        ? 'Type, paste, or submit serial manually.'
        : 'Nhập, dán hoặc xác nhận serial thủ công.';
    final manualFieldSemanticsLabel = isEnglish
        ? 'Serial text input'
        : 'Ô nhập serial';

    Widget buildManualSection({
      required bool landscape,
      required double width,
    }) {
      final panel = Semantics(
        container: true,
        label: manualSectionSemanticsLabel,
        hint: manualSectionSemanticsHint,
        child: Container(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
          decoration: BoxDecoration(
            color: colors.surface.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: colors.outlineVariant.withValues(alpha: 0.8),
            ),
            boxShadow: [
              BoxShadow(
                color: colors.shadow.withValues(alpha: 0.16),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                manualTitle,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: colors.onSurface,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                manualDescription,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colors.onSurfaceVariant,
                  height: 1.25,
                ),
              ),
              const SizedBox(height: 10),
              Semantics(
                textField: true,
                label: manualFieldSemanticsLabel,
                child: ValueListenableBuilder<TextEditingValue>(
                  valueListenable: _manualController,
                  builder: (context, value, child) {
                    final hasText = value.text.trim().isNotEmpty;
                    return TextField(
                      controller: _manualController,
                      textCapitalization: TextCapitalization.characters,
                      textInputAction: TextInputAction.send,
                      style: TextStyle(color: colors.onSurface),
                      decoration: InputDecoration(
                        isDense: true,
                        hintText: manualHint,
                        hintStyle: TextStyle(
                          color: colors.onSurfaceVariant.withValues(alpha: 0.9),
                        ),
                        filled: true,
                        fillColor: colors.surfaceContainerHigh,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 14,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        prefixIcon: Icon(
                          Icons.edit_note_outlined,
                          color: colors.onSurfaceVariant,
                        ),
                        suffixIcon: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              tooltip: pasteSerialTooltip,
                              onPressed: _isCompleting ? null : _pasteManual,
                              icon: const Icon(Icons.content_paste_go_outlined),
                            ),
                            if (hasText)
                              IconButton(
                                tooltip: clearSerialTooltip,
                                onPressed: _isCompleting
                                    ? null
                                    : () => _manualController.clear(),
                                icon: const Icon(Icons.close_rounded),
                              ),
                            IconButton(
                              tooltip: submitSerialTooltip,
                              onPressed: _isCompleting ? null : _submitManual,
                              icon: const Icon(Icons.check_circle_outline),
                            ),
                          ],
                        ),
                      ),
                      onSubmitted: (_) => _submitManual(),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      );

      if (landscape) {
        return Align(
          alignment: Alignment.centerRight,
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              12,
              MediaQuery.paddingOf(context).top + 12,
              MediaQuery.paddingOf(context).right + 12,
              MediaQuery.paddingOf(context).bottom + 12,
            ),
            child: SizedBox(width: width, child: panel),
          ),
        );
      }

      return SafeArea(
        child: Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: isTablet ? 480 : double.infinity,
              ),
              child: panel,
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(title),
        actions: [
          IconButton(
            tooltip: fromImageTooltip,
            onPressed: _isCompleting || _isPickingImage ? null : _scanFromImage,
            icon: _isPickingImage
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2.2),
                  )
                : const Icon(Icons.photo_library_outlined),
          ),
          ValueListenableBuilder<MobileScannerState>(
            valueListenable: _scannerController,
            builder: (context, state, child) {
              final bool torchAvailable =
                  state.torchState != TorchState.unavailable;
              final bool torchOn = state.torchState == TorchState.on;
              return IconButton(
                tooltip: torchOn ? torchOnTooltip : torchOffTooltip,
                onPressed: !state.isRunning || _isCompleting || !torchAvailable
                    ? null
                    : _scannerController.toggleTorch,
                icon: Icon(
                  torchOn
                      ? Icons.flashlight_off_rounded
                      : Icons.flashlight_on_rounded,
                ),
              );
            },
          ),
          ValueListenableBuilder<MobileScannerState>(
            valueListenable: _scannerController,
            builder: (context, state, child) {
              final int? cameraCount = state.availableCameras;
              final bool canSwitch = cameraCount == null || cameraCount > 1;
              return IconButton(
                tooltip: switchCameraTooltip,
                onPressed: !state.isInitialized || _isCompleting || !canSwitch
                    ? null
                    : _scannerController.switchCamera,
                icon: const Icon(Icons.cameraswitch_outlined),
              );
            },
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final Size size = constraints.biggest;
          final EdgeInsets safePadding = MediaQuery.paddingOf(context);
          final bool isLandscape = size.width > size.height;

          final double panelMaxWidth = isTablet ? 480 : 420;
          double rightPanelWidth = 0;
          if (isLandscape) {
            final double desired = math.min(panelMaxWidth, size.width * 0.38);
            final double maxAllowed = math.max(
              0,
              size.width -
                  (safePadding.left + safePadding.right + 40 + 12 + 220),
            );
            rightPanelWidth = math.max(0, math.min(desired, maxAllowed));
          }

          final Rect scanWindow = _scanWindowFor(
            size: size,
            safePadding: safePadding,
            isLandscape: isLandscape,
            rightPanelWidth: rightPanelWidth,
          );

          return Stack(
            children: [
              Semantics(
                container: true,
                label: scannerAreaLabel,
                hint: scannerAreaHint,
                readOnly: true,
                child: MobileScanner(
                  controller: _scannerController,
                  scanWindow: scanWindow,
                  onDetect: _handleDetect,
                  placeholderBuilder: (context, child) {
                    return _CameraLoadingView(message: loadingCameraText);
                  },
                  errorBuilder: (context, error, child) {
                    final bool permissionDenied =
                        error.errorCode ==
                        MobileScannerErrorCode.permissionDenied;
                    return _CameraErrorView(
                      title: cameraErrorTitle,
                      retryLabel: retryLabel,
                      onRetry: _restartCamera,
                      message: permissionDenied
                          ? permissionDeniedMessage
                          : cameraAccessError,
                    );
                  },
                  overlayBuilder: (context, overlayConstraints) {
                    return Stack(
                      children: [
                        AnimatedBuilder(
                          animation: _scanLineController,
                          builder: (context, child) {
                            return CustomPaint(
                              size: overlayConstraints.biggest,
                              painter: _ScannerOverlayPainter(
                                scanWindow: scanWindow,
                                frameRadius: _scanFrameRadius,
                                scanLineProgress: Curves.easeInOut.transform(
                                  _scanLineController.value,
                                ),
                                showSuccessFlash: false,
                              ),
                            );
                          },
                        ),
                        AnimatedOpacity(
                          opacity: _showSuccessFlash ? 1.0 : 0.0,
                          duration: const Duration(milliseconds: 250),
                          child: CustomPaint(
                            size: overlayConstraints.biggest,
                            painter: _ScannerOverlayPainter(
                              scanWindow: scanWindow,
                              frameRadius: _scanFrameRadius,
                              scanLineProgress: 0,
                              showSuccessFlash: true,
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
              SafeArea(
                child: Align(
                  alignment: Alignment.topCenter,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: isTablet ? 480 : double.infinity,
                      ),
                      child: ValueListenableBuilder<MobileScannerState>(
                        valueListenable: _scannerController,
                        builder: (context, state, child) {
                          final String status;
                          if (state.error != null) {
                            status = statusError;
                          } else if (!state.isInitialized) {
                            status = statusLoading;
                          } else {
                            status = statusReady;
                          }
                          return Semantics(
                            container: true,
                            liveRegion: true,
                            label: '$statusBannerSemantics: $status',
                            child: ExcludeSemantics(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: colors.surface.withValues(alpha: 0.86),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: colors.outlineVariant.withValues(
                                      alpha: 0.78,
                                    ),
                                  ),
                                ),
                                child: Text(
                                  status,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: colors.onSurface,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ),
              buildManualSection(
                landscape: isLandscape && rightPanelWidth > 0,
                width: rightPanelWidth,
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CameraLoadingView extends StatelessWidget {
  const _CameraLoadingView({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 2.4),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CameraErrorView extends StatelessWidget {
  const _CameraErrorView({
    required this.onRetry,
    required this.message,
    required this.title,
    required this.retryLabel,
  });

  final VoidCallback onRetry;
  final String message;
  final String title;
  final String retryLabel;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.black,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.videocam_off_rounded,
                size: 38,
                color: Colors.white,
              ),
              const SizedBox(height: 10),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 17,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                message,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white.withValues(alpha: 0.84)),
              ),
              const SizedBox(height: 14),
              FilledButton.tonalIcon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: Text(retryLabel),
                style: FilledButton.styleFrom(minimumSize: const Size(132, 46)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ScannerOverlayPainter extends CustomPainter {
  _ScannerOverlayPainter({
    required this.scanWindow,
    required this.frameRadius,
    required this.scanLineProgress,
    required this.showSuccessFlash,
  });

  final Rect scanWindow;
  final double frameRadius;
  final double scanLineProgress;
  final bool showSuccessFlash;

  @override
  void paint(Canvas canvas, Size size) {
    final RRect frame = RRect.fromRectAndRadius(
      scanWindow,
      Radius.circular(frameRadius),
    );

    final Path maskPath = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Offset.zero & size)
      ..addRRect(frame);
    canvas.drawPath(
      maskPath,
      Paint()..color = Colors.black.withValues(alpha: 0.56),
    );

    final Color accent = showSuccessFlash
        ? const Color(0xFF22C55E)
        : Colors.white;

    if (showSuccessFlash) {
      canvas.drawRRect(
        frame,
        Paint()..color = const Color(0xFF22C55E).withValues(alpha: 0.16),
      );
    }

    canvas.drawRRect(
      frame,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.2
        ..color = accent.withValues(alpha: 0.95),
    );

    final Paint cornerPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 4
      ..color = accent;
    const double cornerLength = 24;

    _drawCorner(
      canvas: canvas,
      paint: cornerPaint,
      x: scanWindow.left,
      y: scanWindow.top,
      horizontalLength: cornerLength,
      verticalLength: cornerLength,
      horizontalSign: 1,
      verticalSign: 1,
    );
    _drawCorner(
      canvas: canvas,
      paint: cornerPaint,
      x: scanWindow.right,
      y: scanWindow.top,
      horizontalLength: cornerLength,
      verticalLength: cornerLength,
      horizontalSign: -1,
      verticalSign: 1,
    );
    _drawCorner(
      canvas: canvas,
      paint: cornerPaint,
      x: scanWindow.left,
      y: scanWindow.bottom,
      horizontalLength: cornerLength,
      verticalLength: cornerLength,
      horizontalSign: 1,
      verticalSign: -1,
    );
    _drawCorner(
      canvas: canvas,
      paint: cornerPaint,
      x: scanWindow.right,
      y: scanWindow.bottom,
      horizontalLength: cornerLength,
      verticalLength: cornerLength,
      horizontalSign: -1,
      verticalSign: -1,
    );

    const double scanLineInset = 14;
    final double lineY =
        scanWindow.top +
        scanLineInset +
        (scanWindow.height - (scanLineInset * 2)) * scanLineProgress;
    final Rect lineRect = Rect.fromLTWH(
      scanWindow.left + scanLineInset,
      lineY,
      scanWindow.width - (scanLineInset * 2),
      3.5,
    );
    final Paint linePaint = Paint()
      ..shader = LinearGradient(
        colors: [
          Colors.transparent,
          accent.withValues(alpha: 0.95),
          Colors.transparent,
        ],
      ).createShader(lineRect);
    canvas.drawRRect(
      RRect.fromRectAndRadius(lineRect, const Radius.circular(4)),
      linePaint,
    );
  }

  void _drawCorner({
    required Canvas canvas,
    required Paint paint,
    required double x,
    required double y,
    required double horizontalLength,
    required double verticalLength,
    required double horizontalSign,
    required double verticalSign,
  }) {
    final Path path = Path()
      ..moveTo(x, y + (verticalLength * verticalSign))
      ..lineTo(x, y)
      ..lineTo(x + (horizontalLength * horizontalSign), y);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _ScannerOverlayPainter oldDelegate) {
    return oldDelegate.scanWindow != scanWindow ||
        oldDelegate.scanLineProgress != scanLineProgress ||
        oldDelegate.showSuccessFlash != showSuccessFlash ||
        oldDelegate.frameRadius != frameRadius;
  }
}
