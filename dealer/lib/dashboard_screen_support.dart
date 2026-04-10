part of 'dashboard_screen.dart';

class _DashboardSnapshot {
  const _DashboardSnapshot({
    required this.periodAnchor,
    required this.periodOrders,
    required this.monthlyRevenue,
    required this.activationWindowDays,
    required this.activationSeries,
    required this.warrantyActivationSeries,
    required this.warrantyRanges,
    required this.periodContextLabel,
    required this.periodRevenue,
    required this.periodOrderCount,
    required this.periodCompletedOrderCount,
    required this.totalOutstandingAmount,
    required this.periodUnitLabel,
  });

  final DateTime periodAnchor;
  final List<Order> periodOrders;
  final List<_MonthRevenue> monthlyRevenue;
  final int activationWindowDays;
  final List<_DailyActivation> activationSeries;
  final List<_DailyActivation> warrantyActivationSeries;
  final List<int> warrantyRanges;
  final String periodContextLabel;
  final int periodRevenue;
  final int periodOrderCount;
  final int periodCompletedOrderCount;
  final int totalOutstandingAmount;
  final String periodUnitLabel;
}

class _DashboardTimeFilterSelection {
  const _DashboardTimeFilterSelection({
    required this.filter,
    required this.period,
  });

  final _DashboardTimeFilter filter;
  final DateTime period;
}

enum DashboardTimeFilterDebug { month, quarter }

@visibleForTesting
({int activationWindowDays, List<int> warrantyRanges})
debugDashboardWarrantyWindowFor({
  required DashboardTimeFilterDebug filter,
  required DateTime selectedPeriod,
  DateTime? now,
}) {
  final snapshot = _buildDashboardSnapshot(
    orders: const <Order>[],
    activations: const <WarrantyActivationRecord>[],
    timeFilter: filter == DashboardTimeFilterDebug.month
        ? _DashboardTimeFilter.month
        : _DashboardTimeFilter.quarter,
    selectedPeriod: selectedPeriod,
    now: now ?? DateTime.now(),
    isEnglish: true,
  );
  return (
    activationWindowDays: snapshot.activationWindowDays,
    warrantyRanges: snapshot.warrantyRanges,
  );
}

_DashboardSnapshot _buildDashboardSnapshot({
  required List<Order> orders,
  required List<WarrantyActivationRecord> activations,
  required _DashboardTimeFilter timeFilter,
  required DateTime selectedPeriod,
  required DateTime now,
  required bool isEnglish,
}) {
  final periodAnchor = _dashboardNormalizePeriodAnchorForFilter(
    selectedPeriod,
    timeFilter,
    now: now,
  );
  final periodStart = _dashboardPeriodStartForFilter(periodAnchor, timeFilter);
  final periodEndExclusive = _dashboardPeriodEndExclusive(
    periodAnchor,
    timeFilter,
    now,
  );
  final periodEndDate = periodEndExclusive.subtract(
    const Duration(microseconds: 1),
  );
  final periodOrders = _dashboardFilterOrdersByPeriod(
    orders,
    periodStart,
    periodEndExclusive,
  );
  final periodRevenueOrders = _dashboardFilterRevenueOrdersByPeriod(
    orders,
    periodStart,
    periodEndExclusive,
  );
  final activationWindowDays = timeFilter == _DashboardTimeFilter.month
      ? 30
      : 90;

  return _DashboardSnapshot(
    periodAnchor: periodAnchor,
    periodOrders: periodOrders,
    monthlyRevenue: _buildMonthlyRevenue(
      periodRevenueOrders,
      year: periodAnchor.year,
    ),
    activationWindowDays: activationWindowDays,
    activationSeries: _buildActivationSeries(
      days: activationWindowDays,
      endDate: periodEndDate,
      activations: activations,
    ),
    warrantyActivationSeries: _buildActivationSeries(
      days: 90,
      endDate: periodEndDate,
      activations: activations,
    ),
    warrantyRanges: timeFilter == _DashboardTimeFilter.month
        ? const <int>[7, 30]
        : const <int>[7, 30, 90],
    periodContextLabel: _dashboardPeriodContextLabelFor(
      periodAnchor,
      timeFilter,
      isEnglish: isEnglish,
    ),
    periodRevenue: periodRevenueOrders.fold<int>(
      0,
      (sum, order) => sum + order.total,
    ),
    periodOrderCount: periodOrders.length,
    periodCompletedOrderCount: periodOrders
        .where((order) => order.status == OrderStatus.completed)
        .length,
    totalOutstandingAmount: _calculateTotalOutstandingAmount(orders),
    periodUnitLabel: _DashboardTexts(
      isEnglish: isEnglish,
    ).periodUnitLabel(timeFilter),
  );
}

int _calculateTotalOutstandingAmount(List<Order> orders) {
  return orders
      .where(
        (order) =>
            order.status == OrderStatus.pending && order.outstandingAmount > 0,
      )
      .fold<int>(0, (sum, order) => sum + order.outstandingAmount);
}

class _DashboardLowStockItem {
  const _DashboardLowStockItem({
    required this.product,
    required this.availableQuantity,
  });

  final Product product;
  final int availableQuantity;
}

List<_DashboardLowStockItem> _buildLowStockProducts({
  required OrderController orderController,
  required WarrantyController warrantyController,
}) {
  final completedOrders = orderController.orders
      .where((order) => order.status == OrderStatus.completed)
      .toList(growable: false);

  final map = <String, _DashboardInventoryAccumulator>{};
  for (final order in completedOrders) {
    for (final item in order.items) {
      final current =
          map[item.product.id] ??
          _DashboardInventoryAccumulator(
            product: item.product,
            importedQuantity: 0,
            orderIds: <String>{},
            serials: <String>{},
          );
      current.importedQuantity += item.quantity;
      current.orderIds.add(order.id);
      map[item.product.id] = current;
    }
  }

  final activatedSet = warrantyController.activations
      .map((record) => warrantyController.normalizeSerial(record.serial))
      .toSet();

  for (final record in warrantyController.importedSerials) {
    final current = map[record.productId];
    if (current == null || !current.orderIds.contains(record.orderId)) {
      continue;
    }

    final normalized = warrantyController.normalizeSerial(record.serial);
    final isNewSerial = current.serials.add(normalized);
    if (!isNewSerial) {
      continue;
    }

    if (activatedSet.contains(normalized)) {
      current.serialSold += 1;
      continue;
    }
    current.serialAvailable += 1;
  }

  final products =
      map.values
          .map((entry) {
            final trackedSerialCount = entry.serials.length;
            final pendingWithoutSerial =
                entry.importedQuantity - trackedSerialCount;
            final availableFromPending = pendingWithoutSerial > 0
                ? pendingWithoutSerial
                : 0;

            return _DashboardLowStockItem(
              product: entry.product,
              availableQuantity: entry.serialAvailable + availableFromPending,
            );
          })
          .where((item) => item.availableQuantity <= _lowStockAlertThreshold)
          .toList(growable: false)
        ..sort((a, b) {
          final quantityCompare = a.availableQuantity.compareTo(
            b.availableQuantity,
          );
          if (quantityCompare != 0) {
            return quantityCompare;
          }
          return a.product.name.toLowerCase().compareTo(
            b.product.name.toLowerCase(),
          );
        });

  return products.take(5).toList(growable: false);
}

class _DashboardInventoryAccumulator {
  _DashboardInventoryAccumulator({
    required this.product,
    required this.importedQuantity,
    required this.orderIds,
    required this.serials,
  });

  final Product product;
  int importedQuantity;
  final Set<String> orderIds;
  final Set<String> serials;
  int serialAvailable = 0;
  int serialSold = 0;
}

String _periodCompactLabelFor(DateTime date, _DashboardTimeFilter filter) {
  if (filter == _DashboardTimeFilter.month) {
    return 'T${date.month}/${date.year}';
  }
  final quarter = ((date.month - 1) ~/ 3) + 1;
  return 'Q$quarter/${date.year}';
}

String _dashboardPeriodContextLabelFor(
  DateTime date,
  _DashboardTimeFilter filter, {
  required bool isEnglish,
}) {
  if (filter == _DashboardTimeFilter.month) {
    return isEnglish
        ? 'Month ${date.month}/${date.year}'
        : 'Th\u00E1ng ${date.month}/${date.year}';
  }
  final quarter = ((date.month - 1) ~/ 3) + 1;
  return isEnglish
      ? 'Quarter $quarter/${date.year}'
      : 'Qu\u00FD $quarter/${date.year}';
}

DateTime _dashboardPeriodStartForFilter(
  DateTime date,
  _DashboardTimeFilter filter,
) {
  if (filter == _DashboardTimeFilter.month) {
    return DateTime(date.year, date.month, 1);
  }
  final quarterStartMonth = ((date.month - 1) ~/ 3) * 3 + 1;
  return DateTime(date.year, quarterStartMonth, 1);
}

DateTime _dashboardNextPeriodStartForFilter(
  DateTime date,
  _DashboardTimeFilter filter,
) {
  final periodStart = _dashboardPeriodStartForFilter(date, filter);
  if (filter == _DashboardTimeFilter.month) {
    return DateTime(periodStart.year, periodStart.month + 1, 1);
  }
  return DateTime(periodStart.year, periodStart.month + 3, 1);
}

DateTime _dashboardPreviousPeriodStartForFilter(
  DateTime date,
  _DashboardTimeFilter filter,
) {
  final periodStart = _dashboardPeriodStartForFilter(date, filter);
  if (filter == _DashboardTimeFilter.month) {
    return DateTime(periodStart.year, periodStart.month - 1, 1);
  }
  return DateTime(periodStart.year, periodStart.month - 3, 1);
}

DateTime _dashboardPeriodEndExclusive(
  DateTime date,
  _DashboardTimeFilter filter,
  DateTime now,
) {
  final nextPeriodStart = _dashboardNextPeriodStartForFilter(date, filter);
  final nowExclusive = now.add(const Duration(microseconds: 1));
  return nowExclusive.isBefore(nextPeriodStart)
      ? nowExclusive
      : nextPeriodStart;
}

DateTime _dashboardNormalizePeriodAnchorForFilter(
  DateTime value,
  _DashboardTimeFilter filter, {
  DateTime? now,
}) {
  final current = now ?? DateTime.now();
  final safeValue = value.isAfter(current) ? current : value;
  return _dashboardPeriodStartForFilter(safeValue, filter);
}

bool _dashboardCanMoveToNextPeriod(
  DateTime periodAnchor,
  _DashboardTimeFilter filter,
  DateTime now,
) {
  final nextStart = _dashboardNextPeriodStartForFilter(periodAnchor, filter);
  final currentStart = _dashboardPeriodStartForFilter(now, filter);
  return !nextStart.isAfter(currentStart);
}

List<Order> _dashboardFilterOrdersByPeriod(
  List<Order> orders,
  DateTime start,
  DateTime endExclusive,
) {
  return orders.where((order) {
    final createdAt = order.createdAt;
    return !createdAt.isBefore(start) && createdAt.isBefore(endExclusive);
  }).toList();
}

List<Order> _dashboardFilterRevenueOrdersByPeriod(
  List<Order> orders,
  DateTime start,
  DateTime endExclusive,
) {
  return orders.where((order) {
    final revenueAt = _orderRevenueTimestamp(order);
    if (revenueAt == null) {
      return false;
    }
    return !revenueAt.isBefore(start) && revenueAt.isBefore(endExclusive);
  }).toList();
}

DateTime? _orderRevenueTimestamp(Order order) {
  if (order.status != OrderStatus.completed) {
    return null;
  }
  return order.completedAt ?? order.createdAt;
}

class _MonthRevenue {
  const _MonthRevenue({required this.month, required this.value});

  final int month;
  final int value;

  String get label => 'T$month';
}

List<_MonthRevenue> _buildMonthlyRevenue(
  List<Order> orders, {
  required int year,
}) {
  final values = List<int>.filled(12, 0);
  for (final order in orders) {
    final revenueAt = _orderRevenueTimestamp(order);
    if (revenueAt == null || revenueAt.year != year) {
      continue;
    }
    values[revenueAt.month - 1] += order.total;
  }

  return [
    for (var i = 0; i < 12; i++) _MonthRevenue(month: i + 1, value: values[i]),
  ];
}

class _CustomerStat {
  const _CustomerStat({
    required this.name,
    required this.phone,
    required this.total,
    required this.orderCount,
    required this.lastOrder,
  });

  final String name;
  final String phone;
  final int total;
  final int orderCount;
  final DateTime lastOrder;

  int get avgOrder => orderCount == 0 ? 0 : (total / orderCount).round();

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].isNotEmpty ? parts[0][0] : '') +
          (parts.last.isNotEmpty ? parts.last[0] : '');
    }
    return name.isNotEmpty ? name[0] : '?';
  }
}

// ignore: unused_element
List<_CustomerStat> _buildTopCustomers(List<Order> orders) {
  final map = <String, _CustomerStat>{};

  for (final order in orders) {
    final key = '${order.receiverName}-${order.receiverPhone}';
    final current = map[key];
    final updated = _CustomerStat(
      name: order.receiverName,
      phone: order.receiverPhone,
      total: (current?.total ?? 0) + order.total,
      orderCount: (current?.orderCount ?? 0) + 1,
      lastOrder: [
        if (current != null) current.lastOrder,
        order.createdAt,
      ].reduce((a, b) => a.isAfter(b) ? a : b),
    );
    map[key] = updated;
  }

  final list = map.values.toList()
    ..sort((a, b) {
      final totalCompare = b.total.compareTo(a.total);
      if (totalCompare != 0) {
        return totalCompare;
      }
      return b.lastOrder.compareTo(a.lastOrder);
    });
  return list;
}

class _DailyActivation {
  const _DailyActivation({required this.date, required this.count});

  final DateTime date;
  final int count;
}

List<_DailyActivation> _buildActivationSeries({
  required int days,
  required DateTime endDate,
  required List<WarrantyActivationRecord> activations,
}) {
  final end = DateTime(endDate.year, endDate.month, endDate.day);
  final startDate = end.subtract(Duration(days: days - 1));

  final countByDate = <DateTime, int>{};
  for (final a in activations) {
    final d = DateTime(
      a.activatedAt.year,
      a.activatedAt.month,
      a.activatedAt.day,
    );
    if (!d.isBefore(startDate) && !d.isAfter(end)) {
      countByDate[d] = (countByDate[d] ?? 0) + 1;
    }
  }

  final list = <_DailyActivation>[];
  for (var i = days - 1; i >= 0; i--) {
    final date = end.subtract(Duration(days: i));
    final normalised = DateTime(date.year, date.month, date.day);
    list.add(
      _DailyActivation(date: normalised, count: countByDate[normalised] ?? 0),
    );
  }
  return list;
}

class _WarrantyStatusStat {
  const _WarrantyStatusStat({
    required this.label,
    required this.count,
    required this.color,
  });

  final String label;
  final int count;
  final Color color;
}

List<_WarrantyStatusStat> _buildWarrantyStatuses(List<_DailyActivation> _) {
  // The dealer app does not currently have a real backend status breakdown
  // for this dashboard card, so we intentionally do not synthesize one.
  return const <_WarrantyStatusStat>[];
}

bool _shouldShowWarrantyStatusCard(List<_DailyActivation> activations) {
  // Keep the unfinished serial-status card off the landing screen until the
  // backend exposes a production-ready breakdown for this metric.
  return _buildWarrantyStatuses(activations).isNotEmpty;
}

Future<_DashboardTimeFilterSelection?> _showDashboardTimeFilterSheet({
  required BuildContext context,
  required _DashboardTimeFilter initialFilter,
  required DateTime selectedPeriod,
  required _DashboardTexts texts,
}) async {
  final now = DateTime.now();
  var draftFilter = initialFilter;
  var draftPeriod = _dashboardNormalizePeriodAnchorForFilter(
    selectedPeriod,
    draftFilter,
    now: now,
  );

  return showModalBottomSheet<_DashboardTimeFilterSelection>(
    context: context,
    showDragHandle: true,
    requestFocus: true,
    backgroundColor: Theme.of(context).colorScheme.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (sheetContext) {
      return StatefulBuilder(
        builder: (context, setSheetState) {
          final theme = Theme.of(context);
          final colors = theme.colorScheme;
          final textTheme = theme.textTheme;
          final isCurrentPeriod =
              _dashboardPeriodStartForFilter(draftPeriod, draftFilter) ==
              _dashboardPeriodStartForFilter(now, draftFilter);
          final currentContextLabel = _dashboardPeriodContextLabelFor(
            draftPeriod,
            draftFilter,
            isEnglish: texts.isEnglish,
          );

          return SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DashboardSurfaceCard(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 42,
                                  height: 42,
                                  decoration: BoxDecoration(
                                    color: colors.primaryContainer.withValues(
                                      alpha: 0.72,
                                    ),
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: Icon(
                                    Icons.tune_rounded,
                                    color: colors.onPrimaryContainer,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        texts.filterSheetTitle,
                                        style: textTheme.titleMedium?.copyWith(
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        currentContextLabel,
                                        style: textTheme.bodySmall?.copyWith(
                                          color: colors.onSurfaceVariant,
                                          height: 1.4,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            SegmentedButton<_DashboardTimeFilter>(
                              showSelectedIcon: false,
                              multiSelectionEnabled: false,
                              segments: [
                                ButtonSegment<_DashboardTimeFilter>(
                                  value: _DashboardTimeFilter.month,
                                  label: Text(texts.filterByMonthLabel),
                                ),
                                ButtonSegment<_DashboardTimeFilter>(
                                  value: _DashboardTimeFilter.quarter,
                                  label: Text(texts.filterByQuarterLabel),
                                ),
                              ],
                              selected: {draftFilter},
                              onSelectionChanged: (selected) {
                                if (selected.isEmpty) {
                                  return;
                                }
                                final nextFilter = selected.first;
                                setSheetState(() {
                                  draftFilter = nextFilter;
                                  draftPeriod =
                                      _dashboardNormalizePeriodAnchorForFilter(
                                        draftPeriod,
                                        draftFilter,
                                        now: now,
                                      );
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      _DashboardSurfaceCard(
                        color: colors.surfaceContainerLow,
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            Icon(
                              Icons.calendar_month_outlined,
                              size: 18,
                              color: colors.primary,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                currentContextLabel,
                                style: textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final shouldStack = constraints.maxWidth < 420;
                          final previousButton = OutlinedButton.icon(
                            onPressed: () {
                              setSheetState(() {
                                draftPeriod =
                                    _dashboardPreviousPeriodStartForFilter(
                                      draftPeriod,
                                      draftFilter,
                                    );
                              });
                            },
                            icon: const Icon(Icons.chevron_left),
                            label: Text(texts.previousPeriodLabel),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(0, 48),
                            ),
                          );
                          final nextButton = OutlinedButton.icon(
                            onPressed:
                                _dashboardCanMoveToNextPeriod(
                                  draftPeriod,
                                  draftFilter,
                                  now,
                                )
                                ? () {
                                    setSheetState(() {
                                      draftPeriod =
                                          _dashboardNextPeriodStartForFilter(
                                            draftPeriod,
                                            draftFilter,
                                          );
                                    });
                                  }
                                : null,
                            icon: const Icon(Icons.chevron_right),
                            label: Text(texts.nextPeriodLabel),
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(0, 48),
                            ),
                          );

                          if (shouldStack) {
                            return Column(
                              children: [
                                SizedBox(
                                  width: double.infinity,
                                  child: previousButton,
                                ),
                                const SizedBox(height: 8),
                                SizedBox(
                                  width: double.infinity,
                                  child: nextButton,
                                ),
                              ],
                            );
                          }

                          return Row(
                            children: [
                              Expanded(child: previousButton),
                              const SizedBox(width: 8),
                              Expanded(child: nextButton),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: draftPeriod.isAfter(now)
                                  ? now
                                  : draftPeriod,
                              firstDate: DateTime(now.year - 5, 1, 1),
                              lastDate: now,
                              helpText:
                                  draftFilter == _DashboardTimeFilter.month
                                  ? texts.pickMonthLabel
                                  : texts.pickQuarterLabel,
                            );
                            if (picked == null) {
                              return;
                            }
                            setSheetState(() {
                              draftPeriod =
                                  _dashboardNormalizePeriodAnchorForFilter(
                                    picked,
                                    draftFilter,
                                    now: now,
                                  );
                            });
                          },
                          icon: const Icon(Icons.event_outlined),
                          label: Text(texts.pickFromCalendarLabel),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size.fromHeight(48),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final shouldStack = constraints.maxWidth < 360;
                          final backButton = TextButton(
                            onPressed: isCurrentPeriod
                                ? null
                                : () {
                                    setSheetState(() {
                                      draftPeriod =
                                          _dashboardNormalizePeriodAnchorForFilter(
                                            now,
                                            draftFilter,
                                            now: now,
                                          );
                                    });
                                  },
                            child: Text(texts.backToCurrentLabel),
                          );
                          final applyButton = FilledButton(
                            onPressed: () {
                              Navigator.of(sheetContext).pop(
                                _DashboardTimeFilterSelection(
                                  filter: draftFilter,
                                  period:
                                      _dashboardNormalizePeriodAnchorForFilter(
                                        draftPeriod,
                                        draftFilter,
                                        now: now,
                                      ),
                                ),
                              );
                            },
                            style: FilledButton.styleFrom(
                              minimumSize: const Size(96, 48),
                            ),
                            child: Text(texts.applyAction),
                          );

                          if (shouldStack) {
                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                backButton,
                                const SizedBox(height: 8),
                                applyButton,
                              ],
                            );
                          }

                          return Row(
                            children: [backButton, const Spacer(), applyButton],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      );
    },
  );
}
