part of 'login_screen.dart';

class _BrandHeader extends StatelessWidget {
  const _BrandHeader({
    required this.theme,
    this.logoHeight = 40,
    this.showSubtitle = true,
    this.alignment = CrossAxisAlignment.center,
    this.textAlign = TextAlign.center,
  });

  final ThemeData theme;
  final double logoHeight;
  final bool showSubtitle;
  final CrossAxisAlignment alignment;
  final TextAlign textAlign;

  @override
  Widget build(BuildContext context) {
    final texts = _loginTexts(context);
    return Column(
      crossAxisAlignment: alignment,
      children: [
        BrandLogoWordmark(height: logoHeight),
        if (showSubtitle) ...[
          const SizedBox(height: 16),
          Text(
            texts.brandSubtitle,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: const Color(0xFFE9F0F4),
              height: 1.45,
            ),
            textAlign: textAlign,
          ),
        ],
      ],
    );
  }
}

class _TabletBrandPanel extends StatelessWidget {
  const _TabletBrandPanel({required this.theme, required this.logoHeight});

  final ThemeData theme;
  final double logoHeight;

  @override
  Widget build(BuildContext context) {
    final texts = _loginTexts(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 12, 8, 12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _BrandHeader(
            theme: theme,
            logoHeight: logoHeight,
            alignment: CrossAxisAlignment.start,
            textAlign: TextAlign.left,
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _BrandPill(
                icon: Icons.inventory_2_outlined,
                text: texts.brandPillOrders,
              ),
              _BrandPill(
                icon: Icons.account_balance_wallet_outlined,
                text: texts.brandPillPayments,
              ),
              _BrandPill(
                icon: Icons.verified_user_outlined,
                text: texts.brandPillWarranty,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BrandPill extends StatelessWidget {
  const _BrandPill({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0x1A29ABE2),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0x4D29ABE2)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: Colors.white),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                text,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: const Color(0xFFECEDEE),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RegisterPrompt extends StatelessWidget {
  const _RegisterPrompt({
    required this.theme,
    required this.isLoading,
    required this.onRegister,
  });

  final ThemeData theme;
  final bool isLoading;
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    final texts = _loginTexts(context);
    final borderColor = const Color(0x4D29ABE2);
    final textColor = const Color(0xFFECEDEE);

    return Center(
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color(0x1A29ABE2),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: borderColor),
        ),
        child: TextButton(
          onPressed: isLoading ? null : onRegister,
          style: TextButton.styleFrom(
            minimumSize: const Size(48, 48),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            foregroundColor: textColor,
          ),
          child: Text.rich(
            TextSpan(
              text: texts.noAccountPrompt,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: textColor,
                height: 1.2,
              ),
              children: [
                TextSpan(
                  text: texts.registerOnWebsiteAction,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: textColor,
                    fontWeight: FontWeight.w700,
                    decoration: TextDecoration.underline,
                    decorationColor: textColor,
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
