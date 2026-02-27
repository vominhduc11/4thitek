import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

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
    detectionSpeed: DetectionSpeed.noDuplicates,
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

  Rect _scanWindowFor(Size size) {
    final double side = math.min(280, math.max(220, size.width * 0.72));
    final double availableHeight = math.max(side + 64, size.height - 210);
    final double top = math.max(28, (availableHeight - side) / 2);
    return Rect.fromLTWH((size.width - side) / 2, top, side, side);
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
      if (!mounted) {
        return;
      }
      Navigator.of(context).pop(value);
    });
  }

  void _showMessage(String message) {
    if (!mounted) {
      return;
    }
    final messenger = ScaffoldMessenger.of(context);
    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _scanFromImage() async {
    if (_isCompleting || _isPickingImage) {
      return;
    }

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
        _showMessage('Bạn chưa chọn ảnh để quét.');
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
        _showMessage('Không tìm thấy mã QR hoặc barcode trong ảnh.');
        return;
      }
      _completeWith(serial);
    } on MissingPluginException {
      _showMessage('Chức năng chọn ảnh chưa sẵn sàng. Hãy khởi động lại app.');
    } on PlatformException catch (error) {
      final code = error.code.toLowerCase();
      if (code.contains('denied')) {
        _showMessage(
          'Không có quyền truy cập thư viện ảnh. Hãy cấp quyền rồi thử lại.',
        );
      } else if (code.contains('already_active')) {
        _showMessage('Thư viện ảnh đang mở. Vui lòng chờ trong giây lát.');
      } else {
        _showMessage(
          'Không thể mở thư viện ảnh (${error.code}). ${error.message ?? ''}'
              .trim(),
        );
      }
    } catch (_) {
      _showMessage('Không thể đọc mã từ ảnh. Vui lòng thử lại.');
    } finally {
      if (mounted) {
        setState(() => _isPickingImage = false);
        if (!_isCompleting && wasScannerRunning) {
          try {
            await _scannerController.start();
          } catch (_) {
            _showMessage('Không thể khởi động lại camera. Vui lòng thử lại.');
          }
        }
      }
    }
  }

  Future<void> _restartCamera() async {
    try {
      await _scannerController.stop();
      await _scannerController.start();
    } catch (_) {
      _showMessage('Không thể khởi động camera. Vui lòng thử lại.');
    }
  }

  void _submitManual() {
    final value = _manualController.text.trim();
    if (value.isEmpty) {
      _showMessage('Vui lòng nhập serial hoặc mã QR.');
      return;
    }
    _completeWith(value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const BrandAppBarTitle('Quét QR / Barcode'),
        actions: [
          IconButton(
            tooltip: 'Quét từ ảnh',
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
                tooltip: torchOn ? 'Tắt đèn pin' : 'Bật đèn pin',
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
                tooltip: 'Đổi camera',
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
          final Rect scanWindow = _scanWindowFor(constraints.biggest);
          return Stack(
            children: [
              MobileScanner(
                controller: _scannerController,
                scanWindow: scanWindow,
                onDetect: _handleDetect,
                placeholderBuilder: (context, child) {
                  return const _CameraLoadingView();
                },
                errorBuilder: (context, error, child) {
                  final bool permissionDenied =
                      error.errorCode ==
                      MobileScannerErrorCode.permissionDenied;
                  return _CameraErrorView(
                    onRetry: _restartCamera,
                    message: permissionDenied
                        ? 'Quyền camera đang bị từ chối. Hãy vào cài đặt ứng dụng và bật lại quyền.'
                        : 'Không thể truy cập camera. Hãy kiểm tra lại và thử lại.',
                  );
                },
                overlayBuilder: (context, overlayConstraints) {
                  return AnimatedBuilder(
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
                          showSuccessFlash: _showSuccessFlash,
                        ),
                      );
                    },
                  );
                },
              ),
              SafeArea(
                child: Align(
                  alignment: Alignment.topCenter,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                    child: ValueListenableBuilder<MobileScannerState>(
                      valueListenable: _scannerController,
                      builder: (context, state, child) {
                        final String status;
                        if (state.error != null) {
                          status = 'Không thể truy cập camera';
                        } else if (!state.isInitialized) {
                          status = 'Đang khởi động camera...';
                        } else {
                          status = 'Đang quét mã. Giữ mã trong khung.';
                        }
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.45),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            status,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
              SafeArea(
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: Container(
                    margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.64),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.14),
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Không quét được? Nhập thủ công',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Dán hoặc nhập serial nếu camera không đọc được mã.',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.78),
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextField(
                          controller: _manualController,
                          textCapitalization: TextCapitalization.characters,
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            isDense: true,
                            hintText: 'Nhập serial...',
                            hintStyle: TextStyle(
                              color: Colors.white.withValues(alpha: 0.72),
                            ),
                            filled: true,
                            fillColor: Colors.white.withValues(alpha: 0.12),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 14,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            prefixIcon: const Icon(
                              Icons.edit_note_outlined,
                              color: Colors.white70,
                            ),
                            suffixIconConstraints: const BoxConstraints(
                              minHeight: 44,
                              minWidth: 44,
                            ),
                            suffixIcon: IconButton(
                              tooltip: 'Xác nhận serial',
                              onPressed: _submitManual,
                              icon: const Icon(Icons.check_circle_outline),
                              color: Colors.white,
                            ),
                          ),
                          onSubmitted: (_) => _submitManual(),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CameraLoadingView extends StatelessWidget {
  const _CameraLoadingView();

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(strokeWidth: 2.4),
            ),
            SizedBox(height: 12),
            Text(
              'Đang khởi động camera...',
              style: TextStyle(
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
  const _CameraErrorView({required this.onRetry, required this.message});

  final VoidCallback onRetry;
  final String message;

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
              const Text(
                'Không thể truy cập camera',
                style: TextStyle(
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
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Thử lại'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(132, 46),
                ),
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
