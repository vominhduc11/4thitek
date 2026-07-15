part of 'serial_scan_screen.dart';

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
