part of 'inventory_screen.dart';

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _inventoryMinTapTarget),
        child: ChoiceChip(
          label: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: selected
                  ? colorScheme.onSecondaryContainer
                  : colorScheme.onSurface,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
          selected: selected,
          showCheckmark: false,
          labelPadding: const EdgeInsets.symmetric(horizontal: 2),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          materialTapTargetSize: MaterialTapTargetSize.padded,
          selectedColor: colorScheme.secondaryContainer,
          backgroundColor: colorScheme.surfaceContainerHighest.withValues(
            alpha: 0.42,
          ),
          side: BorderSide(
            color: colorScheme.outlineVariant.withValues(alpha: 0.8),
          ),
          onSelected: (_) => onTap(),
        ),
      ),
    );
  }
}

class _MenuFilterButton extends StatelessWidget {
  const _MenuFilterButton({
    required this.label,
    required this.items,
    required this.onSelected,
  });

  final String label;
  final List<PopupMenuEntry<String>> items;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    final colorScheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: texts.openSortMenuSemantic,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _inventoryMinTapTarget),
        child: PopupMenuButton<String>(
          onSelected: onSelected,
          itemBuilder: (_) => items,
          tooltip: texts.sortTooltip,
          child: Container(
            constraints: const BoxConstraints(
              minWidth: _inventoryMinTapTarget,
              minHeight: _inventoryMinTapTarget,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: ShapeDecoration(
              color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
              shape: StadiumBorder(
                side: BorderSide(
                  color: colorScheme.outlineVariant.withValues(alpha: 0.78),
                ),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    label,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Icon(
                  Icons.unfold_more_rounded,
                  size: 18,
                  color: colorScheme.onSurfaceVariant,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SortDirectionButton extends StatelessWidget {
  const _SortDirectionButton({required this.ascending, required this.onTap});

  final bool ascending;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final texts = _inventoryTexts(context);
    final colorScheme = Theme.of(context).colorScheme;
    final label = texts.sortDirectionLabel(ascending);
    return Semantics(
      button: true,
      label: texts.sortDirectionSemantic(label),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _inventoryMinTapTarget),
        child: IconButton(
          tooltip: texts.sortDirectionTooltip(label),
          onPressed: onTap,
          style: IconButton.styleFrom(
            minimumSize: const Size(
              _inventoryMinTapTarget,
              _inventoryMinTapTarget,
            ),
            backgroundColor: colorScheme.surfaceContainerHighest.withValues(
              alpha: 0.4,
            ),
            side: BorderSide(
              color: colorScheme.outlineVariant.withValues(alpha: 0.78),
            ),
          ),
          icon: Icon(
            ascending
                ? Icons.arrow_upward_rounded
                : Icons.arrow_downward_rounded,
            size: 18,
            color: colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}
