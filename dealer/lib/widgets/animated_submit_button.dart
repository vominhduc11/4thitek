import 'package:flutter/material.dart';

class AnimatedSubmitButton extends StatefulWidget {
  const AnimatedSubmitButton({
    super.key,
    required this.canSubmit,
    required this.isLoading,
    required this.label,
    required this.loadingLabel,
    required this.onPressed,
    required this.style,
  });

  final bool canSubmit;
  final bool isLoading;
  final String label;
  final String loadingLabel;
  final Future<void> Function() onPressed;
  final ButtonStyle style;

  @override
  State<AnimatedSubmitButton> createState() => _AnimatedSubmitButtonState();
}

class _AnimatedSubmitButtonState extends State<AnimatedSubmitButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: widget.canSubmit
          ? (_) {
              if (!_isPressed) {
                setState(() => _isPressed = true);
              }
            }
          : null,
      onPointerUp: (_) {
        if (_isPressed) {
          setState(() => _isPressed = false);
        }
      },
      onPointerCancel: (_) {
        if (_isPressed) {
          setState(() => _isPressed = false);
        }
      },
      child: AnimatedScale(
        scale: _isPressed ? 0.98 : 1,
        duration: const Duration(milliseconds: 90),
        curve: Curves.easeOut,
        child: ElevatedButton(
          onPressed: widget.canSubmit
              ? () async {
                  await widget.onPressed();
                }
              : null,
          style: widget.style,
          child: widget.isLoading
              ? Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(widget.loadingLabel),
                  ],
                )
              : Text(widget.label),
        ),
      ),
    );
  }
}
