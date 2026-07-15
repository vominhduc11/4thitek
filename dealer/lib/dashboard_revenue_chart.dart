part of 'dashboard_screen.dart';

class _RevenueChartCard extends StatefulWidget {
  const _RevenueChartCard({
    required this.data,
    required this.focusMonth,
    required this.displayYear,
    required this.onCreateOrder,
  });

  final List<_MonthRevenue> data;
  final int focusMonth;
  final int displayYear;
  final VoidCallback onCreateOrder;

  @override
  State<_RevenueChartCard> createState() => _RevenueChartCardState();
}

class _RevenueChartCardState extends State<_RevenueChartCard> {
  int? _selectedBarGroupIndex;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    final texts = _DashboardTexts(isEnglish: isEnglish);
    final colorScheme = theme.colorScheme;
    final focusMonth = widget.focusMonth.clamp(1, 12);
    final displayYear = widget.displayYear;

    final monthsWithData = widget.data.where((item) => item.value > 0).toList();
    final hasAnyData = monthsWithData.isNotEmpty;
    final hasSparseData = hasAnyData && monthsWithData.length <= 2;
    final chartData = widget.data;
    final zeroValueMonthCount = chartData
        .where((item) => item.value <= 0)
        .length;
    final showMissingMonthNote = hasAnyData && zeroValueMonthCount > 0;
    final enableHoverTooltip = kIsWeb;

    final maxValue = chartData.fold<int>(
      0,
      (max, item) => math.max(max, item.value),
    );
    final topY = maxValue <= 0
        ? 1000000.0
        : math
              .max(1000000, ((maxValue * 1.25) / 1000000).ceil() * 1000000)
              .toDouble();
    final yInterval = topY / 4;

    final subtitle = hasSparseData
        ? (isEnglish
              ? 'Data is available for ${monthsWithData.length}/12 months in $displayYear.'
              : '\u0110\u00e3 c\u00f3 d\u1eef li\u1ec7u ${monthsWithData.length}/12 th\u00e1ng c\u1ee7a n\u0103m $displayYear.')
        : (isEnglish
              ? 'Monthly purchase value across $displayYear.'
              : 'T\u1ed5ng h\u1ee3p gi\u00e1 tr\u1ecb \u0111\u01a1n nh\u1eadp theo t\u1eebng th\u00e1ng trong n\u0103m $displayYear.');

    final showValueLabels = hasAnyData && monthsWithData.length <= 2;
    final yearlyTotal = widget.data.fold<int>(
      0,
      (sum, item) => sum + item.value,
    );
    final focusMonthValue = widget.data[focusMonth - 1].value;
    final previousMonthValue = focusMonth > 1
        ? widget.data[focusMonth - 2].value
        : 0;
    final monthChangePercent = previousMonthValue <= 0
        ? 0.0
        : (focusMonthValue - previousMonthValue) / previousMonthValue * 100;
    final monthChangeText = previousMonthValue <= 0
        ? (focusMonthValue > 0
              ? (isEnglish ? 'New activity' : 'M\u1edbi ph\u00e1t sinh')
              : (isEnglish ? 'No change' : 'Kh\u00f4ng \u0111\u1ed5i'))
        : '${monthChangePercent >= 0 ? '+' : ''}${monthChangePercent.toStringAsFixed(1)}%';
    final monthChangeColor = previousMonthValue <= 0
        ? _dashboardMutedText(context)
        : focusMonthValue >= previousMonthValue
        ? const Color(0xFF15803D)
        : const Color(0xFFB91C1C);
    final chartHeight = (MediaQuery.sizeOf(context).width * 0.46)
        .clamp(240.0, 340.0)
        .toDouble();

    return _DashboardSurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _DashboardCardHeader(
            title: isEnglish
                ? 'Monthly purchase value ($displayYear)'
                : 'Gi\u00e1 tr\u1ecb nh\u1eadp h\u00e0ng theo th\u00e1ng ($displayYear)',
            subtitle: hasAnyData ? subtitle : null,
          ),
          if (hasAnyData) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                _InsightChip(
                  label: isEnglish ? 'Year total' : 'T\u1ed5ng n\u0103m',
                  value: _formatCompactVnd(yearlyTotal),
                  valueColor: const Color(0xFF1E3A8A),
                ),
                _InsightChip(
                  label: isEnglish ? 'Selected month' : 'Th\u00e1ng ch\u1ecdn',
                  value: _formatCompactVnd(focusMonthValue),
                  valueColor: const Color(0xFF1E3A8A),
                ),
                _InsightChip(
                  label: isEnglish
                      ? 'Vs previous month'
                      : 'So v\u1edbi th\u00e1ng tr\u01b0\u1edbc',
                  value: monthChangeText,
                  valueColor: monthChangeColor,
                ),
              ],
            ),
          ],
          if (showMissingMonthNote) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: colorScheme.primary.withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    size: 15,
                    color: colorScheme.onPrimaryContainer,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      isEnglish
                          ? 'Showing all 12 months. $zeroValueMonthCount months without data are displayed as 0.'
                          : 'Hiển thị đủ 12 tháng, $zeroValueMonthCount tháng chưa có dữ liệu đang được hiển thị là 0.',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          if (!hasAnyData)
            Container(
              width: double.infinity,
              constraints: const BoxConstraints(minHeight: 220),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: theme.colorScheme.outlineVariant),
              ),
              alignment: Alignment.center,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.bar_chart_rounded,
                      color: theme.colorScheme.onPrimaryContainer,
                      size: 20,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    isEnglish
                        ? 'No purchase orders have been recorded in $displayYear yet.'
                        : 'Bạn chưa có đơn nhập nào trong năm $displayYear.',
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isEnglish
                        ? 'Create a new order to start tracking monthly purchase value.'
                        : 'Hãy tạo đơn hàng mới để bắt đầu theo dõi giá trị nhập theo tháng.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: _dashboardMutedText(context),
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: 220,
                    child: Semantics(
                      button: true,
                      label: isEnglish
                          ? 'Create a new order to track monthly purchase value'
                          : 'Tạo đơn hàng mới để theo dõi giá trị nhập hàng theo tháng',
                      child: FilledButton.icon(
                        onPressed: widget.onCreateOrder,
                        style: FilledButton.styleFrom(
                          minimumSize: const Size(220, 48),
                        ),
                        icon: const Icon(
                          Icons.add_shopping_cart_outlined,
                          size: 18,
                        ),
                        label: Text(texts.createOrderAction),
                      ),
                    ),
                  ),
                ],
              ),
            )
          else
            SizedBox(
              height: chartHeight,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  minY: 0,
                  maxY: topY,
                  barTouchData: BarTouchData(
                    enabled: true,
                    handleBuiltInTouches: enableHoverTooltip,
                    touchCallback: (event, response) {
                      if (enableHoverTooltip) {
                        return;
                      }
                      if (event is! FlTapUpEvent) {
                        return;
                      }
                      final touchedIdx = response?.spot?.touchedBarGroupIndex;
                      if (touchedIdx == null ||
                          touchedIdx < 0 ||
                          touchedIdx >= chartData.length ||
                          chartData[touchedIdx].value <= 0) {
                        setState(() => _selectedBarGroupIndex = null);
                        return;
                      }
                      setState(() {
                        _selectedBarGroupIndex =
                            _selectedBarGroupIndex == touchedIdx
                            ? null
                            : touchedIdx;
                      });
                    },
                    touchTooltipData: BarTouchTooltipData(
                      tooltipRoundedRadius: 10,
                      tooltipPadding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      tooltipMargin: 8,
                      fitInsideHorizontally: true,
                      fitInsideVertically: true,
                      getTooltipColor: (_) => const Color(0xFF0F172A),
                      getTooltipItem: (group, groupIndex, rod, rodIndex) {
                        if (groupIndex < 0 || groupIndex >= chartData.length) {
                          return null;
                        }
                        final item = chartData[groupIndex];
                        return BarTooltipItem(
                          '${item.label}/$displayYear\n${formatVnd(item.value)}',
                          const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        );
                      },
                    ),
                  ),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: yInterval,
                    getDrawingHorizontalLine: (value) => FlLine(
                      color: const Color(0xFFCBD5E1).withValues(alpha: 0.35),
                      strokeWidth: 1,
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    topTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: showValueLabels,
                        reservedSize: 40,
                        interval: 1,
                        getTitlesWidget: (value, meta) {
                          final idx = value.toInt();
                          if (value != idx.toDouble() ||
                              idx < 0 ||
                              idx >= chartData.length) {
                            return const SizedBox.shrink();
                          }
                          final amount = chartData[idx].value;
                          if (amount <= 0) {
                            return const SizedBox.shrink();
                          }
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            child: Text(
                              '${_formatCompactValue(amount / 1000000)}M đ',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: const Color(0xFF334155),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 54,
                        interval: yInterval,
                        getTitlesWidget: (value, meta) {
                          if (value <= 0) {
                            return const SizedBox.shrink();
                          }
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            child: Text(
                              '${_formatCompactValue(value / 1000000)}M đ',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: _dashboardMutedText(context),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 28,
                        interval: 1,
                        getTitlesWidget: (value, meta) {
                          final idx = value.toInt();
                          if (value != idx.toDouble() ||
                              idx < 0 ||
                              idx >= chartData.length) {
                            return const SizedBox.shrink();
                          }
                          final item = chartData[idx];
                          final isCurrent = item.month == focusMonth;
                          final hasValue = item.value > 0;
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            space: 6,
                            child: Text(
                              item.label,
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: isCurrent
                                    ? theme.colorScheme.primary
                                    : hasValue
                                    ? const Color(0xFF334155)
                                    : const Color(0xFF94A3B8),
                                fontWeight: isCurrent
                                    ? FontWeight.w800
                                    : FontWeight.w600,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  barGroups: [
                    for (var i = 0; i < chartData.length; i++)
                      BarChartGroupData(
                        x: i,
                        showingTooltipIndicators:
                            !enableHoverTooltip &&
                                _selectedBarGroupIndex == i &&
                                chartData[i].value > 0
                            ? const [0]
                            : const [],
                        barRods: [
                          BarChartRodData(
                            toY: chartData[i].value.toDouble(),
                            width: 18,
                            backDrawRodData: BackgroundBarChartRodData(
                              show: true,
                              toY: topY * 0.06,
                              color: const Color(0xFFE2E8F0),
                            ),
                            borderRadius: BorderRadius.circular(5),
                            gradient: _revenueBarGradient(
                              chartData[i],
                              focusMonth,
                            ),
                            borderSide: chartData[i].month == focusMonth
                                ? const BorderSide(
                                    color: Color(0xFF1E3A8A),
                                    width: 1,
                                  )
                                : BorderSide.none,
                          ),
                        ],
                      ),
                  ],
                ),
                swapAnimationDuration: Duration.zero,
                swapAnimationCurve: Curves.linear,
              ),
            ),
        ],
      ),
    );
  }
}

LinearGradient _revenueBarGradient(_MonthRevenue item, int currentMonth) {
  if (item.value <= 0) {
    return const LinearGradient(
      begin: Alignment.bottomCenter,
      end: Alignment.topCenter,
      colors: [Color(0xFFD7DEE8), Color(0xFFE8EDF4)],
    );
  }

  if (item.month == currentMonth) {
    return const LinearGradient(
      begin: Alignment.bottomCenter,
      end: Alignment.topCenter,
      colors: [Color(0xFF0071BC), Color(0xFF29ABE2)],
    );
  }

  return const LinearGradient(
    begin: Alignment.bottomCenter,
    end: Alignment.topCenter,
    colors: [Color(0xFF3B82F6), Color(0xFF93C5FD)],
  );
}

class _InsightChip extends StatelessWidget {
  const _InsightChip({
    required this.label,
    required this.value,
    required this.valueColor,
  });

  final String label;
  final String value;
  final Color valueColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: _dashboardMutedText(context),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: theme.textTheme.labelMedium?.copyWith(
              color: valueColor,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
