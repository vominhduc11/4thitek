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
    required this.totalOutstandingDebt,
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
  final int totalOutstandingDebt;
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

_DashboardSnapshot _buildDashboardSnapshot({
  required List<Order> orders,
  required List<WarrantyActivationRecord> activations,
  required _DashboardTimeFilter timeFilter,
  required DateTime selectedPeriod,
  required DateTime now,
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
  final activationWindowDays = timeFilter == _DashboardTimeFilter.month
      ? 30
      : 90;

  return _DashboardSnapshot(
    periodAnchor: periodAnchor,
    periodOrders: periodOrders,
    monthlyRevenue: _buildMonthlyRevenue(periodOrders, year: periodAnchor.year),
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
    ),
    periodRevenue: periodOrders.fold<int>(0, (sum, order) => sum + order.total),
    periodOrderCount: periodOrders.length,
    periodCompletedOrderCount: periodOrders
        .where((order) => order.status == OrderStatus.completed)
        .length,
    totalOutstandingDebt: _calculateTotalOutstandingDebt(orders),
    periodUnitLabel: timeFilter == _DashboardTimeFilter.month
        ? 'th\u00E1ng'
        : 'qu\u00FD',
  );
}

int _calculateTotalOutstandingDebt(List<Order> orders) {
  return orders.fold<int>(0, (sum, order) => sum + order.outstandingAmount);
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

    if (warrantyController.isDefectiveSerial(normalized)) {
      current.serialDefective += 1;
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
  int serialDefective = 0;
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
  _DashboardTimeFilter filter,
) {
  if (filter == _DashboardTimeFilter.month) {
    return 'Th\u00E1ng ${date.month}/${date.year}';
  }
  final quarter = ((date.month - 1) ~/ 3) + 1;
  return 'Qu\u00FD $quarter/${date.year}';
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

Future<_DashboardTimeFilterSelection?> _showDashboardTimeFilterSheet({
  required BuildContext context,
  required _DashboardTimeFilter initialFilter,
  required DateTime selectedPeriod,
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
          final isCurrentPeriod =
              _dashboardPeriodStartForFilter(draftPeriod, draftFilter) ==
              _dashboardPeriodStartForFilter(now, draftFilter);

          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'L\u1ECDc th\u1EDDi gian',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  SegmentedButton<_DashboardTimeFilter>(
                    showSelectedIcon: false,
                    multiSelectionEnabled: false,
                    segments: const [
                      ButtonSegment<_DashboardTimeFilter>(
                        value: _DashboardTimeFilter.month,
                        label: Text('Theo th\u00E1ng'),
                      ),
                      ButtonSegment<_DashboardTimeFilter>(
                        value: _DashboardTimeFilter.quarter,
                        label: Text('Theo qu\u00FD'),
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
                        draftPeriod = _dashboardNormalizePeriodAnchorForFilter(
                          draftPeriod,
                          draftFilter,
                          now: now,
                        );
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Theme.of(context).colorScheme.outlineVariant,
                      ),
                    ),
                    child: Text(
                      _dashboardPeriodContextLabelFor(draftPeriod, draftFilter),
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
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
                          label: const Text('K\u1EF3 tr\u01B0\u1EDBc'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(0, 48),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
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
                          label: const Text('K\u1EF3 sau'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(0, 48),
                          ),
                        ),
                      ),
                    ],
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
                          helpText: draftFilter == _DashboardTimeFilter.month
                              ? 'Ch\u1ECDn th\u00E1ng'
                              : 'Ch\u1ECDn qu\u00FD',
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
                      label: const Text('Ch\u1ECDn t\u1EEB l\u1ECBch'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      TextButton(
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
                        child: const Text('V\u1EC1 hi\u1EC7n t\u1EA1i'),
                      ),
                      const Spacer(),
                      FilledButton(
                        onPressed: () {
                          Navigator.of(sheetContext).pop(
                            _DashboardTimeFilterSelection(
                              filter: draftFilter,
                              period: _dashboardNormalizePeriodAnchorForFilter(
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
                        child: const Text('\u00C1p d\u1EE5ng'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      );
    },
  );
}
