import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'widgets/brand_identity.dart';

class SerialScanScreen extends StatefulWidget {
  const SerialScanScreen({super.key});

  @override
  State<SerialScanScreen> createState() => _SerialScanScreenState();
}

class _SerialScanScreenState extends State<SerialScanScreen> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );
  final TextEditingController _manualController = TextEditingController();
  bool _isCompleting = false;

  @override
  void dispose() {
    _manualController.dispose();
    _scannerController.dispose();
    super.dispose();
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
    setState(() => _isCompleting = true);
    Navigator.of(context).pop(value);
  }

  void _submitManual() {
    final value = _manualController.text.trim();
    if (value.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng nhập serial hoặc mã QR.')),
      );
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
            tooltip: 'Bật/tắt đèn',
            onPressed: _scannerController.toggleTorch,
            icon: const Icon(Icons.flashlight_on_outlined),
          ),
          IconButton(
            tooltip: 'Đổi camera',
            onPressed: _scannerController.switchCamera,
            icon: const Icon(Icons.cameraswitch_outlined),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _scannerController,
            onDetect: _handleDetect,
          ),
          Align(
            alignment: Alignment.center,
            child: IgnorePointer(
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.white, width: 2.6),
                  borderRadius: BorderRadius.circular(18),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Đưa mã vào khung để quét tự động hoặc nhập thủ công',
                      style: TextStyle(color: Colors.white),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _manualController,
                      textCapitalization: TextCapitalization.characters,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Nhập serial...',
                        hintStyle: TextStyle(
                          color: Colors.white.withValues(alpha: 0.72),
                        ),
                        filled: true,
                        fillColor: Colors.white.withValues(alpha: 0.12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        suffixIcon: IconButton(
                          tooltip: 'Xác nhận',
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
      ),
    );
  }
}
