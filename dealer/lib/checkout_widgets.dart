part of 'checkout_screen.dart';

class _CheckoutMethodBadge extends StatelessWidget {
  const _CheckoutMethodBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: colors.surface.withValues(alpha: 0.86),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: colors.outlineVariant),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: colors.primary,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _CheckoutTransferPreviewCard extends StatelessWidget {
  const _CheckoutTransferPreviewCard({
    required this.texts,
    required this.instructions,
  });

  final _CheckoutTexts texts;
  final BankTransferInstructions instructions;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            texts.transferPreviewTitle,
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            texts.transferPreviewHint,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              final useTwoColumns = constraints.maxWidth >= 560;
              final itemWidth = useTwoColumns
                  ? (constraints.maxWidth - 12) / 2
                  : constraints.maxWidth;
              final fields = [
                _CheckoutTransferDetail(
                  label: texts.providerLabel,
                  value: instructions.provider,
                ),
                _CheckoutTransferDetail(
                  label: texts.bankNameLabel,
                  value: instructions.bankName,
                ),
                _CheckoutTransferDetail(
                  label: texts.accountNumberLabel,
                  value: instructions.accountNumber,
                ),
                _CheckoutTransferDetail(
                  label: texts.accountHolderLabel,
                  value: instructions.accountHolder,
                ),
              ];
              return Wrap(
                spacing: 12,
                runSpacing: 12,
                children: fields
                    .map((field) => SizedBox(width: itemWidth, child: field))
                    .toList(growable: false),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _CheckoutTransferDetail extends StatelessWidget {
  const _CheckoutTransferDetail({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: colors.onSurfaceVariant,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w700,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.isEmphasis = false,
  });

  final String label;
  final String value;
  final bool isEmphasis;

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodyMedium;
    final emphasisStyle = Theme.of(
      context,
    ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700);

    final valueStyle = isEmphasis ? emphasisStyle : style;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Text(label, style: isEmphasis ? emphasisStyle : style),
            ),
            const SizedBox(width: 12),
            Flexible(
              child: Text(
                value,
                textAlign: TextAlign.right,
                style: valueStyle,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

enum _CheckoutStateTone { info, error }

class _CheckoutStatePanel extends StatelessWidget {
  const _CheckoutStatePanel({
    required this.icon,
    required this.message,
    required this.tone,
    this.action,
    this.child,
    this.dense = false,
  });

  final IconData icon;
  final String message;
  final _CheckoutStateTone tone;
  final Widget? action;
  final Widget? child;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final isError = tone == _CheckoutStateTone.error;
    final background = isError
        ? colors.errorContainer.withValues(alpha: 0.4)
        : colors.primaryContainer.withValues(alpha: 0.3);
    final border = isError
        ? colors.error.withValues(alpha: 0.28)
        : colors.primary.withValues(alpha: 0.22);
    final iconColor = isError ? colors.error : colors.primary;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(dense ? 12 : 14),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(dense ? 14 : 16),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: dense ? 18 : 20, color: iconColor),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  message,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: dense ? colors.onSurfaceVariant : colors.onSurface,
                    height: 1.35,
                    fontWeight: dense ? FontWeight.w500 : FontWeight.w600,
                  ),
                ),
              ),
              if (action case final actionWidget?) ...[
                const SizedBox(width: 8),
                actionWidget,
              ],
            ],
          ),
          ...?child == null ? null : <Widget>[child!],
        ],
      ),
    );
  }
}

class _CheckoutItemRow extends StatelessWidget {
  const _CheckoutItemRow({required this.item});

  final CartItem item;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ProductImage(
          product: item.product,
          width: 42,
          height: 42,
          borderRadius: BorderRadius.circular(10),
          iconSize: 18,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.product.name,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 2),
              Text(
                'SKU: ${item.product.sku}',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'x${item.quantity}',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 2),
            Text(
              formatVnd(item.quantity * item.product.price),
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ],
    );
  }
}
