part of 'dashboard_screen.dart';

class _ActivationTrendCard extends StatefulWidget {
  const _ActivationTrendCard({required this.data, required this.windowDays});

  final List<_DailyActivation> data;
  final int windowDays;

  @override
  State<_ActivationTrendCard> createState() => _ActivationTrendCardState();
}

class _ActivationTrendCardState extends State<_ActivationTrendCard> {
  int? _selectedSpotIndex;

  @override
  Widget build(BuildContext context) {
    final rawData = widget.data;
    final theme = Theme.of(context);
    final isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    final secondaryTextColor = _dashboardMutedText(context);
    final windowDays = widget.windowDays;
    final isCompactMobile =
        MediaQuery.sizeOf(context).width < _mobileBreakpoint;
    final useWeeklyBuckets = isCompactMobile && windowDays >= 90;

    if (rawData.isEmpty) {
      return _EmptyCard(
        title: isEnglish
            ? 'No activation data yet'
            : 'Chưa có dữ liệu kích hoạt',
        message: isEnglish
            ? 'No activation has been recorded in the last $windowDays days.'
            : 'Chưa ghi nhận lượt kích hoạt nào trong $windowDays ngày gần đây.',
        description: isEnglish
            ? 'Complete orders and process serials to start tracking.'
            : 'Hãy hoàn tất đơn và xử lý serial để bắt đầu theo dõi.',
        icon: Icons.show_chart_outlined,
      );
    }

    final data = _buildChartData(rawData, weeklyBucket: useWeeklyBuckets);

    var peakIndex = 0;
    for (var i = 1; i < data.length; i++) {
      if (data[i].count > data[peakIndex].count) {
        peakIndex = i;
      }
    }
    final peakPoint = data[peakIndex];
    final peakLabel = _formatPointLabel(peakPoint);

    final totalActivations = rawData.fold<int>(
      0,
      (sum, item) => sum + item.count,
    );
    final averagePerDay = totalActivations / rawData.length;
    final maxY = data
        .fold<int>(0, (max, item) => math.max(max, item.count))
        .toDouble();
    final roughTopY = math.max(5, (maxY * 1.2).ceil()).toDouble();
    final yInterval = math.max(1, (roughTopY / 4).ceil()).toDouble();
    final topY = (roughTopY / yInterval).ceil() * yInterval;
    final chartMinX = -1.0;
    final chartMaxX = data.length.toDouble();
    final enableHoverTooltip = kIsWeb;
    final hasValidSelectedSpot =
        _selectedSpotIndex != null &&
        _selectedSpotIndex! >= 0 &&
        _selectedSpotIndex! < data.length;
    final targetLabelCount = useWeeklyBuckets
        ? (isCompactMobile ? 3 : 6)
        : (isCompactMobile ? 4 : 7);
    final xLabelStep = math.max(1, (data.length / targetLabelCount).ceil());
    final chartHeight = (MediaQuery.sizeOf(context).width * 0.45)
        .clamp(220.0, 320.0)
        .toDouble();

    bool shouldShowMarker(int index) {
      return index == 0 || index == data.length - 1 || index == peakIndex;
    }

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
              isEnglish
                  ? 'Serial processing in the last $windowDays days'
                  : 'Xử lý serial $windowDays ngày gần nhất',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              useWeeklyBuckets
                  ? (isEnglish
                        ? 'Weekly activation volume'
                        : 'Số lượt kích hoạt theo tuần')
                  : (isEnglish
                        ? 'Daily activation volume'
                        : 'Số lượt kích hoạt theo từng ngày'),
              style: theme.textTheme.bodySmall?.copyWith(
                color: secondaryTextColor,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isEnglish ? 'Unit: activations/day' : 'Đơn vị: lượt/ngày',
              style: theme.textTheme.labelSmall?.copyWith(
                color: secondaryTextColor,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (useWeeklyBuckets) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: theme.colorScheme.outlineVariant),
                ),
                child: Text(
                  isEnglish
                      ? 'Grouped by week for easier reading on mobile.'
                      : 'Đang gộp dữ liệu theo tuần để dễ đọc trên mobile.',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onPrimaryContainer,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 8),
            SizedBox(
              height: chartHeight,
              child: LineChart(
                LineChartData(
                  minX: chartMinX,
                  maxX: chartMaxX,
                  minY: 0,
                  maxY: topY,
                  clipData: const FlClipData.none(),
                  extraLinesData: ExtraLinesData(
                    extraLinesOnTop: true,
                    horizontalLines: [
                      HorizontalLine(
                        y: averagePerDay,
                        color: const Color(0xFF29ABE2).withValues(alpha: 0.4),
                        strokeWidth: 1.1,
                        dashArray: const [6, 4],
                        label: HorizontalLineLabel(
                          show: true,
                          alignment: Alignment.topLeft,
                          padding: const EdgeInsets.only(left: 6, bottom: 2),
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: const Color(0xFF1E3A8A),
                            fontWeight: FontWeight.w700,
                            fontSize: 11,
                          ),
                          labelResolver: (_) => isEnglish
                              ? 'Avg: ${averagePerDay.toStringAsFixed(1)}'
                              : 'TB: ${averagePerDay.toStringAsFixed(1)}',
                        ),
                      ),
                    ],
                  ),
                  lineTouchData: LineTouchData(
                    enabled: true,
                    handleBuiltInTouches: enableHoverTooltip,
                    touchSpotThreshold: 24,
                    touchCallback: (event, response) {
                      if (enableHoverTooltip || event is! FlTapUpEvent) {
                        return;
                      }
                      final spots = response?.lineBarSpots;
                      final touchedIndex = spots != null && spots.isNotEmpty
                          ? spots.first.x.round()
                          : null;
                      if (touchedIndex == null ||
                          touchedIndex < 0 ||
                          touchedIndex >= data.length) {
                        if (_selectedSpotIndex != null) {
                          setState(() => _selectedSpotIndex = null);
                        }
                        return;
                      }
                      setState(() {
                        _selectedSpotIndex = _selectedSpotIndex == touchedIndex
                            ? null
                            : touchedIndex;
                      });
                    },
                    getTouchLineStart: (barData, spotIndex) => 0,
                    getTouchLineEnd: (barData, spotIndex) => topY,
                    getTouchedSpotIndicator: (barData, spotIndexes) {
                      return spotIndexes.map((spotIndex) {
                        return TouchedSpotIndicatorData(
                          FlLine(
                            color: const Color(
                              0xFF29ABE2,
                            ).withValues(alpha: 0.22),
                            strokeWidth: 1.1,
                            dashArray: const [5, 4],
                          ),
                          FlDotData(
                            show: true,
                            getDotPainter: (spot, percent, line, index) =>
                                FlDotCirclePainter(
                                  radius: 4,
                                  color: const Color(0xFF29ABE2),
                                  strokeWidth: 2,
                                  strokeColor: Colors.white,
                                ),
                          ),
                        );
                      }).toList();
                    },
                    touchTooltipData: LineTouchTooltipData(
                      tooltipRoundedRadius: 10,
                      tooltipPadding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 8,
                      ),
                      tooltipMargin: 10,
                      fitInsideHorizontally: true,
                      fitInsideVertically: true,
                      getTooltipColor: (_) => const Color(0xFF0F172A),
                      getTooltipItems: (touchedSpots) {
                        return touchedSpots.map((spot) {
                          final idx = spot.x.round();
                          if (idx < 0 || idx >= data.length) {
                            return null;
                          }
                          return LineTooltipItem(
                            isEnglish
                                ? '${_formatPointLabel(data[idx])} - ${spot.y.toInt()} activations'
                                : '${_formatPointLabel(data[idx])} - ${spot.y.toInt()} lượt kích hoạt',
                            const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          );
                        }).toList();
                      },
                    ),
                  ),
                  titlesData: FlTitlesData(
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 34,
                        interval: yInterval,
                        getTitlesWidget: (value, meta) {
                          if (value < 0 || value > topY) {
                            return const SizedBox.shrink();
                          }
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            child: Text(
                              value.toInt().toString(),
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: secondaryTextColor,
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
                        interval: 1,
                        reservedSize: 28,
                        getTitlesWidget: (value, meta) {
                          final idx = value.round();
                          if ((value - idx).abs() > 0.001 ||
                              idx < 0 ||
                              idx >= data.length) {
                            return const SizedBox.shrink();
                          }

                          final shouldShowLabel =
                              idx == 0 ||
                              idx == data.length - 1 ||
                              idx % xLabelStep == 0;
                          if (!shouldShowLabel) {
                            return const SizedBox.shrink();
                          }

                          final d = data[idx].endDate;
                          return SideTitleWidget(
                            axisSide: meta.axisSide,
                            space: 8,
                            child: Text(
                              '${d.day}/${d.month}',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: secondaryTextColor,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval: yInterval,
                    getDrawingHorizontalLine: (value) => FlLine(
                      color: const Color(0xFF94A3B8).withValues(alpha: 0.16),
                      strokeWidth: 1,
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      showingIndicators:
                          !enableHoverTooltip && hasValidSelectedSpot
                          ? [_selectedSpotIndex!]
                          : const [],
                      spots: [
                        for (var i = 0; i < data.length; i++)
                          FlSpot(i.toDouble(), data[i].count.toDouble()),
                      ],
                      isCurved: true,
                      curveSmoothness: 0.25,
                      preventCurveOverShooting: true,
                      color: const Color(0xFF29ABE2),
                      barWidth: 2.2,
                      isStrokeCapRound: true,
                      dotData: FlDotData(
                        show: true,
                        checkToShowDot: (spot, barData) {
                          final idx = spot.x.round();
                          if (idx < 0 || idx >= data.length) {
                            return false;
                          }
                          return shouldShowMarker(idx);
                        },
                        getDotPainter: (spot, percent, barData, index) {
                          final isPeak = index == peakIndex;
                          return FlDotCirclePainter(
                            radius: isPeak ? 3.5 : 2.6,
                            color: isPeak
                                ? const Color(0xFFDC2626)
                                : Colors.white,
                            strokeWidth: 1.8,
                            strokeColor: isPeak
                                ? const Color(0xFFDC2626)
                                : const Color(0xFF29ABE2),
                          );
                        },
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        color: const Color(0xFF29ABE2).withValues(alpha: 0.08),
                      ),
                    ),
                  ],
                ),
                duration: Duration.zero,
                curve: Curves.linear,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: [
                _MiniKpi(
                  label: isEnglish
                      ? 'Total $windowDays days'
                      : 'Tổng $windowDays ngày',
                  value: '$totalActivations',
                ),
                _MiniKpi(
                  label: isEnglish ? 'Average / day' : 'Trung bình/ngày',
                  value: averagePerDay.toStringAsFixed(1),
                ),
                _MiniKpi(
                  label: isEnglish
                      ? '${useWeeklyBuckets ? 'Peak week' : 'Peak'} ($peakLabel)'
                      : '${useWeeklyBuckets ? 'Đỉnh tuần' : 'Đỉnh'} ($peakLabel)',
                  value: '${peakPoint.count}',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  List<_ActivationChartPoint> _buildChartData(
    List<_DailyActivation> source, {
    required bool weeklyBucket,
  }) {
    if (!weeklyBucket) {
      return [
        for (final item in source)
          _ActivationChartPoint(
            startDate: item.date,
            endDate: item.date,
            count: item.count,
          ),
      ];
    }

    final buckets = <_ActivationChartPoint>[];
    for (var i = 0; i < source.length; i += 7) {
      final end = math.min(i + 7, source.length);
      final chunk = source.sublist(i, end);
      final total = chunk.fold<int>(0, (sum, item) => sum + item.count);
      buckets.add(
        _ActivationChartPoint(
          startDate: chunk.first.date,
          endDate: chunk.last.date,
          count: total,
        ),
      );
    }
    return buckets;
  }

  String _formatPointLabel(_ActivationChartPoint point) {
    if (_isSameDay(point.startDate, point.endDate)) {
      return '${point.endDate.day}/${point.endDate.month}';
    }
    return '${point.startDate.day}/${point.startDate.month}'
        '-${point.endDate.day}/${point.endDate.month}';
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}
