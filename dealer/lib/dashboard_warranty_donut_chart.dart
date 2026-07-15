part of 'dashboard_screen.dart';

class _WarrantyStatusDonutCard extends StatefulWidget {
  const _WarrantyStatusDonutCard({
    required this.activations,
    required this.ranges,
    required this.initialRange,
  });

  final List<_DailyActivation> activations;
  final List<int> ranges;
  final int initialRange;

  @override
  State<_WarrantyStatusDonutCard> createState() =>
      _WarrantyStatusDonutCardState();
}

class _WarrantyStatusDonutCardState extends State<_WarrantyStatusDonutCard> {
  static const _maxSegments = 5;

  late int _selectedRange;
  int? _selectedIndex;
  Offset? _tooltipAnchor;

  @override
  void initState() {
    super.initState();
    _selectedRange = _resolveInitialRange();
  }

  @override
  void didUpdateWidget(covariant _WarrantyStatusDonutCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!listEquals(oldWidget.ranges, widget.ranges) ||
        oldWidget.initialRange != widget.initialRange) {
      _selectedRange = _resolveInitialRange();
      _selectedIndex = null;
      _tooltipAnchor = null;
    }
  }

  int _resolveInitialRange() {
    if (widget.ranges.isEmpty) {
      return 30;
    }
    if (widget.ranges.contains(widget.initialRange)) {
      return widget.initialRange;
    }
    return widget.ranges.last;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    final texts = _DashboardTexts(isEnglish: isEnglish);
    final enableHoverTooltip = kIsWeb;
    final filteredActivations = _filterByRange(
      widget.activations,
      _selectedRange,
    );
    final trackedActivationCount = widget.activations.fold<int>(
      0,
      (sum, item) => sum + item.count,
    );
    final stats = _buildWarrantyStatuses(filteredActivations);
    final total = stats.fold<int>(0, (sum, e) => sum + e.count);
    final showUnavailable = total == 0;

    final sortedStats = [...stats]
      ..sort((a, b) {
        final left = total == 0 ? 0.0 : a.count / total;
        final right = total == 0 ? 0.0 : b.count / total;
        final byPercent = right.compareTo(left);
        if (byPercent != 0) {
          return byPercent;
        }
        return b.count.compareTo(a.count);
      });
    final displayStats = _groupWarrantyStats(
      sortedStats,
      maxSegments: _maxSegments,
      isEnglish: isEnglish,
    );

    final touchedStat =
        _selectedIndex != null &&
            _selectedIndex! >= 0 &&
            _selectedIndex! < displayStats.length
        ? displayStats[_selectedIndex!]
        : null;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.6),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              texts.warrantyStatusTitle,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              showUnavailable
                  ? texts.metricUnavailableLabel
                  : (isEnglish
                        ? 'Total: $total serial-processing orders'
                        : 'Tổng: $total đơn xử lý serial'),
              style: theme.textTheme.bodySmall?.copyWith(
                color: _dashboardMutedText(context),
              ),
            ),
            const SizedBox(height: 10),
            if (!showUnavailable) ...[
              LayoutBuilder(
                builder: (context, constraints) {
                  final isCompactSegment = constraints.maxWidth < 360;
                  final segmentButton = SegmentedButton<int>(
                    showSelectedIcon: false,
                    multiSelectionEnabled: false,
                    style: ButtonStyle(
                      visualDensity: VisualDensity.compact,
                      padding: WidgetStateProperty.all(
                        EdgeInsets.symmetric(
                          horizontal: isCompactSegment ? 8 : 10,
                          vertical: 8,
                        ),
                      ),
                      side: WidgetStateProperty.resolveWith((states) {
                        if (states.contains(WidgetState.selected)) {
                          return const BorderSide(
                            color: Colors.transparent,
                            width: 0,
                          );
                        }
                        return const BorderSide(
                          color: Color(0xFFCBD5E1),
                          width: 1,
                        );
                      }),
                      backgroundColor: WidgetStateProperty.resolveWith((
                        states,
                      ) {
                        if (states.contains(WidgetState.selected)) {
                          return theme.colorScheme.primary;
                        }
                        return theme.colorScheme.surface;
                      }),
                      foregroundColor: WidgetStateProperty.resolveWith((
                        states,
                      ) {
                        if (states.contains(WidgetState.selected)) {
                          return Colors.white;
                        }
                        return const Color(0xFF475569);
                      }),
                      textStyle: WidgetStateProperty.resolveWith((states) {
                        return theme.textTheme.labelMedium?.copyWith(
                          fontWeight: states.contains(WidgetState.selected)
                              ? FontWeight.w800
                              : FontWeight.w600,
                        );
                      }),
                    ),
                    segments: [
                      for (final range in widget.ranges)
                        ButtonSegment<int>(
                          value: range,
                          label: Text(texts.warrantyRangeLabel(range)),
                        ),
                    ],
                    selected: {_selectedRange},
                    onSelectionChanged: (selected) {
                      if (selected.isEmpty) {
                        return;
                      }
                      final value = selected.first;
                      if (value == _selectedRange) {
                        return;
                      }
                      setState(() {
                        _selectedRange = value;
                        _selectedIndex = null;
                        _tooltipAnchor = null;
                      });
                    },
                  );

                  return SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.hardEdge,
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minWidth: constraints.maxWidth,
                      ),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: segmentButton,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),
            ],
            if (showUnavailable)
              _buildEmptyDonutState(
                theme,
                texts: texts,
                activationCount: trackedActivationCount,
              )
            else
              LayoutBuilder(
                builder: (context, constraints) {
                  final isWideLayout =
                      constraints.maxWidth >= _donutStackBreakpoint;
                  final rawChartWidth = isWideLayout
                      ? constraints.maxWidth * 0.45
                      : constraints.maxWidth;
                  final chartSize = math.min(rawChartWidth, 300.0);
                  final chart = _buildDonutChart(
                    theme: theme,
                    stats: displayStats,
                    total: total,
                    donutSize: chartSize,
                    maxTooltipWidth: chartSize * 0.9,
                    touchedStat: touchedStat,
                    enableHoverTooltip: enableHoverTooltip,
                  );
                  final legendList = Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (var i = 0; i < displayStats.length; i++)
                        Padding(
                          padding: EdgeInsets.only(
                            bottom: i == displayStats.length - 1 ? 0 : 8,
                          ),
                          child: _buildLegendRow(
                            theme: theme,
                            stat: displayStats[i],
                            total: total,
                            isSelected: _selectedIndex == i,
                            onTap: () {
                              setState(() {
                                _selectedIndex = _selectedIndex == i ? null : i;
                                _tooltipAnchor = null;
                              });
                            },
                          ),
                        ),
                    ],
                  );
                  final legendScrollable = ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 300),
                    child: Scrollbar(
                      thumbVisibility: isWideLayout && displayStats.length > 3,
                      child: SingleChildScrollView(child: legendList),
                    ),
                  );
                  final legendWrap = Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (var i = 0; i < displayStats.length; i++)
                        _buildLegendChip(
                          theme: theme,
                          stat: displayStats[i],
                          total: total,
                          isSelected: _selectedIndex == i,
                          isCompact: true,
                          onTap: () {
                            setState(() {
                              _selectedIndex = _selectedIndex == i ? null : i;
                              _tooltipAnchor = null;
                            });
                          },
                        ),
                    ],
                  );

                  if (!isWideLayout) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Center(
                          child: SizedBox(width: chartSize, child: chart),
                        ),
                        const SizedBox(height: 16),
                        legendWrap,
                      ],
                    );
                  }

                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(width: chartSize, child: chart),
                      const SizedBox(width: 20),
                      Expanded(child: legendScrollable),
                    ],
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDonutChart({
    required ThemeData theme,
    required List<_WarrantyStatusStat> stats,
    required int total,
    required double donutSize,
    required double maxTooltipWidth,
    required _WarrantyStatusStat? touchedStat,
    required bool enableHoverTooltip,
  }) {
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    return SizedBox(
      width: donutSize,
      height: donutSize,
      child: Stack(
        clipBehavior: Clip.hardEdge,
        alignment: Alignment.center,
        children: [
          PieChart(
            PieChartData(
              sectionsSpace: 2,
              centerSpaceRadius: 50,
              pieTouchData: PieTouchData(
                touchCallback: (event, response) {
                  final touchedSection = response?.touchedSection;
                  final idx = touchedSection?.touchedSectionIndex;

                  if (event is FlTapCancelEvent ||
                      event is FlPointerExitEvent ||
                      event is FlLongPressEnd) {
                    if (_selectedIndex != null || _tooltipAnchor != null) {
                      setState(() {
                        _selectedIndex = null;
                        _tooltipAnchor = null;
                      });
                    }
                    return;
                  }

                  if (!enableHoverTooltip && event is! FlTapUpEvent) {
                    return;
                  }

                  if (idx == null || idx < 0 || idx >= stats.length) {
                    if (!enableHoverTooltip &&
                        (_selectedIndex != null || _tooltipAnchor != null)) {
                      setState(() {
                        _selectedIndex = null;
                        _tooltipAnchor = null;
                      });
                    }
                    return;
                  }

                  if (touchedSection == null ||
                      touchedSection.touchedSection == null) {
                    return;
                  }

                  setState(() {
                    if (!enableHoverTooltip) {
                      _selectedIndex = _selectedIndex == idx ? null : idx;
                      _tooltipAnchor = _selectedIndex == null
                          ? null
                          : _buildTooltipAnchor(
                              touchedSection,
                              donutSize: donutSize,
                            );
                      return;
                    }
                    _selectedIndex = idx;
                    _tooltipAnchor = _buildTooltipAnchor(
                      touchedSection,
                      donutSize: donutSize,
                    );
                  });
                },
              ),
              sections: [
                for (var i = 0; i < stats.length; i++)
                  PieChartSectionData(
                    color: stats[i].color,
                    value: stats[i].count.toDouble(),
                    radius: _selectedIndex == i ? 57 : 52,
                    showTitle: _selectedIndex == i,
                    title: total == 0
                        ? ''
                        : '${(stats[i].count / total * 100).round()}%',
                    titleStyle: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
              ],
            ),
            swapAnimationDuration: Duration.zero,
            swapAnimationCurve: Curves.linear,
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$total',
                style: theme.textTheme.headlineMedium?.copyWith(
                  color: theme.colorScheme.onSurface,
                  fontWeight: FontWeight.w900,
                  fontSize: 22,
                  height: 1.0,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                isEnglish ? 'Total' : 'Tổng',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: _dashboardMutedText(context),
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          if (touchedStat != null && _tooltipAnchor != null)
            CustomSingleChildLayout(
              delegate: _DonutTooltipPositionDelegate(anchor: _tooltipAnchor!),
              child: IgnorePointer(
                child: _DonutSliceTooltip(
                  color: touchedStat.color,
                  label: touchedStat.label,
                  count: touchedStat.count,
                  percent: (touchedStat.count / total * 100).round(),
                  maxWidth: maxTooltipWidth,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLegendRow({
    required ThemeData theme,
    required _WarrantyStatusStat stat,
    required int total,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final percent = total == 0 ? 0 : (stat.count / total * 100).round();
    return Semantics(
      button: true,
      label:
          '${stat.label}: ${texts.orderCountPercentLabel(stat.count, percent)}',
      child: Material(
        color: isSelected
            ? theme.colorScheme.surfaceContainerLow
            : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 48),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
              child: Row(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    width: isSelected ? 12 : 10,
                    height: isSelected ? 12 : 10,
                    decoration: BoxDecoration(
                      color: stat.color,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: stat.color.withValues(
                          alpha: isSelected ? 0.9 : 0.45,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '${stat.label}  ${texts.orderCountPercentLabel(stat.count, percent)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface,
                        fontWeight: isSelected
                            ? FontWeight.w800
                            : FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLegendChip({
    required ThemeData theme,
    required _WarrantyStatusStat stat,
    required int total,
    required bool isSelected,
    required bool isCompact,
    required VoidCallback onTap,
  }) {
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    final percent = total == 0 ? 0 : (stat.count / total * 100).round();
    return Semantics(
      button: true,
      label:
          '${stat.label}: ${texts.orderCountPercentLabel(stat.count, percent)}',
      child: Material(
        color: isSelected
            ? theme.colorScheme.surfaceContainerHighest
            : theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          borderRadius: BorderRadius.circular(999),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: isSelected ? 10 : 8,
                  height: isSelected ? 10 : 8,
                  decoration: BoxDecoration(
                    color: stat.color,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${stat.label} ($percent%)',
                  style:
                      (isCompact
                              ? theme.textTheme.labelSmall
                              : theme.textTheme.labelMedium)
                          ?.copyWith(
                            color: theme.colorScheme.onSurface,
                            fontWeight: isSelected
                                ? FontWeight.w800
                                : FontWeight.w700,
                          ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyDonutState(
    ThemeData theme, {
    required _DashboardTexts texts,
    required int activationCount,
  }) {
    return Column(
      children: [
        SizedBox(
          width: 164,
          height: 164,
          child: Stack(
            alignment: Alignment.center,
            children: [
              PieChart(
                PieChartData(
                  sectionsSpace: 0,
                  centerSpaceRadius: 50,
                  pieTouchData: PieTouchData(enabled: false),
                  sections: [
                    PieChartSectionData(
                      color: Color(0xFFD6DEE8),
                      value: 100,
                      radius: 52,
                      showTitle: false,
                    ),
                  ],
                ),
                swapAnimationDuration: Duration.zero,
                swapAnimationCurve: Curves.linear,
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'N/A',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: const Color(0xFF334155),
                      fontWeight: FontWeight.w900,
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    texts.metricUnavailableLabel,
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: _dashboardMutedText(context),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Text(
          texts.warrantyStatusUnavailableMessage(activationCount),
          style: theme.textTheme.bodySmall?.copyWith(
            color: _dashboardMutedText(context),
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          texts.warrantyStatusUnavailableDescription,
          style: theme.textTheme.bodySmall?.copyWith(
            color: _dashboardMutedText(context),
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  List<_DailyActivation> _filterByRange(
    List<_DailyActivation> source,
    int days,
  ) {
    if (source.isEmpty) {
      return source;
    }
    final end = source.last.date;
    final start = DateTime(
      end.year,
      end.month,
      end.day,
    ).subtract(Duration(days: days - 1));
    return source.where((item) => !item.date.isBefore(start)).toList();
  }

  List<_WarrantyStatusStat> _groupWarrantyStats(
    List<_WarrantyStatusStat> sortedStats, {
    required int maxSegments,
    required bool isEnglish,
  }) {
    if (sortedStats.isEmpty || maxSegments <= 0) {
      return sortedStats;
    }

    final totalCount = sortedStats.fold<int>(
      0,
      (sum, item) => sum + item.count,
    );
    const minVisibleRatio = 0.04;
    var groupedCount = 0;
    final visibleStats = <_WarrantyStatusStat>[];

    for (final stat in sortedStats) {
      final ratio = totalCount == 0 ? 0.0 : stat.count / totalCount;
      if (ratio < minVisibleRatio) {
        groupedCount += stat.count;
      } else {
        visibleStats.add(stat);
      }
    }

    final otherLabel = isEnglish ? 'Other' : 'Khác';

    if (groupedCount > 0) {
      visibleStats.add(
        _WarrantyStatusStat(
          label: otherLabel,
          count: groupedCount,
          color: const Color(0xFF475569),
        ),
      );
    }

    visibleStats.sort((a, b) => b.count.compareTo(a.count));

    final keepCount = maxSegments - 1;
    if (visibleStats.length <= maxSegments || keepCount <= 0) {
      return visibleStats;
    }

    final top = visibleStats.take(keepCount).toList();
    final othersCount = visibleStats
        .skip(keepCount)
        .fold<int>(0, (sum, item) => sum + item.count);

    if (othersCount > 0) {
      top.add(
        _WarrantyStatusStat(
          label: otherLabel,
          count: othersCount,
          color: const Color(0xFF475569),
        ),
      );
    }
    return top;
  }

  Offset _buildTooltipAnchor(
    PieTouchedSection touchedSection, {
    required double donutSize,
  }) {
    final center = Offset(donutSize / 2, donutSize / 2);
    final angleRad = touchedSection.touchAngle * (math.pi / 180);
    final distance = (touchedSection.touchRadius + 16).clamp(46.0, 88.0);
    return Offset(
      center.dx + math.cos(angleRad) * distance,
      center.dy + math.sin(angleRad) * distance,
    );
  }
}

class _DonutSliceTooltip extends StatelessWidget {
  const _DonutSliceTooltip({
    required this.color,
    required this.label,
    required this.count,
    required this.percent,
    required this.maxWidth,
  });

  final Color color;
  final String label;
  final int count;
  final int percent;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final texts = _DashboardTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );
    return Container(
      constraints: BoxConstraints(maxWidth: maxWidth),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.22),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          const SizedBox(width: 7),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  texts.orderCountPercentLabel(count, percent),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DonutTooltipPositionDelegate extends SingleChildLayoutDelegate {
  const _DonutTooltipPositionDelegate({required this.anchor});

  final Offset anchor;

  static const double _margin = 6;
  static const double _horizontalGap = 10;
  static const double _verticalGap = 8;

  @override
  Offset getPositionForChild(Size size, Size childSize) {
    final placeRight = anchor.dx >= size.width / 2;
    final placeBelow = anchor.dy >= size.height / 2;

    final targetLeft = placeRight
        ? anchor.dx + _horizontalGap
        : anchor.dx - _horizontalGap - childSize.width;
    final targetTop = placeBelow
        ? anchor.dy + _verticalGap
        : anchor.dy - _verticalGap - childSize.height;

    final maxLeft = math.max(_margin, size.width - childSize.width - _margin);
    final maxTop = math.max(_margin, size.height - childSize.height - _margin);

    final clampedLeft = targetLeft.clamp(_margin, maxLeft).toDouble();
    final clampedTop = targetTop.clamp(_margin, maxTop).toDouble();
    return Offset(clampedLeft, clampedTop);
  }

  @override
  bool shouldRelayout(covariant _DonutTooltipPositionDelegate oldDelegate) {
    return anchor != oldDelegate.anchor;
  }
}
