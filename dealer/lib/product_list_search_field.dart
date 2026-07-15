// ignore_for_file: invalid_use_of_protected_member

part of 'product_list_screen.dart';

extension _ProductListSearchField on _ProductListScreenState {
  Widget _buildSearchField(BuildContext context, {required bool isTablet}) {
    final texts = _productListTexts(context);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final fieldColor = colors.surface;

    return AnimatedBuilder(
      animation: _searchFieldListenable,
      builder: (context, _) {
        final hasText = _searchController.text.isNotEmpty;
        final isPending = _isSearchPending.value;
        final suffix = _buildSearchSuffixIcon(
          context,
          hasText: hasText,
          isPending: isPending,
          tooltip: texts.clearSearchTooltip,
        );

        if (isTablet) {
          return TextField(
            controller: _searchController,
            textInputAction: TextInputAction.search,
            onSubmitted: _submitSearch,
            decoration: InputDecoration(
              isDense: true,
              hintText: texts.searchHint,
              prefixIcon: const Icon(Icons.search, size: 20),
              suffixIcon: suffix,
              filled: true,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: theme.colorScheme.outlineVariant),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: theme.colorScheme.outlineVariant),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: theme.colorScheme.primary,
                  width: 1.5,
                ),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 9,
              ),
            ),
          );
        }

        return TextField(
          controller: _searchController,
          textInputAction: TextInputAction.search,
          onSubmitted: _submitSearch,
          decoration: InputDecoration(
            isDense: true,
            hintText: texts.searchHint,
            hintStyle: theme.textTheme.bodyMedium?.copyWith(
              color: colors.onSurfaceVariant,
            ),
            prefixIcon: Icon(
              Icons.search_rounded,
              size: 20,
              color: colors.onSurfaceVariant,
            ),
            suffixIcon: suffix,
            filled: true,
            fillColor: fieldColor,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(
                color: colors.outlineVariant.withValues(alpha: 0.85),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(
                color: colors.outlineVariant.withValues(alpha: 0.85),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: colors.primary, width: 1.4),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 11,
            ),
          ),
        );
      },
    );
  }

  Widget? _buildSearchSuffixIcon(
    BuildContext context, {
    required bool hasText,
    required bool isPending,
    required String tooltip,
  }) {
    if (!hasText && !isPending) {
      return null;
    }

    final colors = Theme.of(context).colorScheme;

    return SizedBox(
      width: hasText && isPending ? 72 : 48,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isPending) ...[
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2.2,
                color: colors.primary,
              ),
            ),
            if (hasText) const SizedBox(width: 4),
          ],
          if (hasText)
            IconButton(
              icon: const Icon(Icons.close_rounded, size: 18),
              tooltip: tooltip,
              onPressed: _clearSearch,
            ),
        ],
      ),
    );
  }

  Widget _buildDiscountBanner(
    BuildContext context, {
    required CartController cart,
    required bool isTablet,
  }) {
    final theme = Theme.of(context);
    final borderRadius = isTablet ? 16.0 : 12.0;
    final horizontalPadding = isTablet ? 18.0 : 12.0;
    final verticalPadding = isTablet ? 10.0 : 7.0;
    final iconSize = isTablet ? 18.0 : 15.0;
    final iconSpacing = isTablet ? 10.0 : 7.0;
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: horizontalPadding,
        vertical: verticalPadding,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: theme.colorScheme.primary.withValues(alpha: 0.18),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.local_offer_outlined,
            size: iconSize,
            color: theme.colorScheme.primary,
          ),
          SizedBox(width: iconSpacing),
          Expanded(
            child: Text(
              _discountBannerMessage(context, cart),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style:
                  (isTablet
                          ? theme.textTheme.bodyMedium
                          : theme.textTheme.labelLarge)
                      ?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
            ),
          ),
        ],
      ),
    );
  }

  String _discountBannerMessage(BuildContext context, CartController cart) {
    final texts = _productListTexts(context);
    final nextTarget = cart.nextDiscountTarget;
    if (nextTarget == null) {
      if (cart.discountPercent > 0) {
        return texts.discountReachedMessage(cart.discountPercent);
      }
      return texts.discountAutoApplyMessage;
    }

    final remaining = remainingQuantityForBulkDiscountTarget(
      target: nextTarget,
      items: cart.items,
    );
    if (remaining <= 0) {
      if (cart.discountPercent > 0) {
        return texts.discountReachedMessage(cart.discountPercent);
      }
      return texts.discountAutoApplyMessage;
    }

    final productName = _productNameForDiscountTarget(cart.items, nextTarget);
    if (productName != null && productName.trim().isNotEmpty) {
      return texts.discountTargetProductMessage(
        remaining,
        productName,
        nextTarget.percent,
      );
    }
    return texts.discountTargetMessage(remaining, nextTarget.percent);
  }
}
