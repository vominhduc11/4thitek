import 'package:flutter/material.dart';

InputDecoration buildAppInputDecoration(
  BuildContext context, {
  required String labelText,
  required Widget prefixIcon,
  Widget? suffixIcon,
  String? hintText,
  String? helperText,
  bool alignLabelWithHint = false,
  bool isRequired = false,
}) {
  final colors = Theme.of(context).colorScheme;
  final border = OutlineInputBorder(
    borderRadius: BorderRadius.circular(18),
    borderSide: BorderSide(color: colors.outlineVariant.withValues(alpha: 0.7)),
  );
  final displayLabel = isRequired ? '$labelText *' : labelText;

  return InputDecoration(
    labelText: displayLabel,
    hintText: hintText,
    hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
      color: colors.onSurfaceVariant.withValues(alpha: 0.9),
    ),
    helperText: helperText,
    helperMaxLines: 2,
    alignLabelWithHint: alignLabelWithHint,
    filled: true,
    fillColor: colors.surfaceContainerHighest.withValues(alpha: 0.22),
    prefixIcon: prefixIcon,
    suffixIcon: suffixIcon,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
    border: border,
    enabledBorder: border,
    disabledBorder: border,
    focusedBorder: border.copyWith(
      borderSide: BorderSide(color: colors.primary, width: 1.4),
    ),
    errorBorder: border.copyWith(
      borderSide: BorderSide(color: colors.error, width: 1.1),
    ),
    focusedErrorBorder: border.copyWith(
      borderSide: BorderSide(color: colors.error, width: 1.4),
    ),
  );
}
