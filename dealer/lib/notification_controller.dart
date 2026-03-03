import 'package:flutter/material.dart';

import 'mock_data.dart';

class NotificationController extends ChangeNotifier {
  final Set<String> _readIds = {};

  List<DistributorNotice> get notices =>
      List<DistributorNotice>.unmodifiable(mockDistributorNotices);

  int get unreadCount {
    final total = mockDistributorNotices.length;
    final readCount = _readIds
        .where((id) => mockDistributorNotices.any((n) => n.id == id))
        .length;
    return total - readCount;
  }

  bool isRead(String id) => _readIds.contains(id);

  void markRead(String id) {
    if (_readIds.contains(id)) {
      return;
    }
    _readIds.add(id);
    notifyListeners();
  }

  void markUnread(String id) {
    if (!_readIds.remove(id)) {
      return;
    }
    notifyListeners();
  }

  void markAllAsRead() {
    final ids = notices.map((n) => n.id).toSet();
    if (_readIds.containsAll(ids)) return;
    _readIds.addAll(ids);
    notifyListeners();
  }
}

class NotificationScope extends InheritedNotifier<NotificationController> {
  const NotificationScope({
    super.key,
    required NotificationController controller,
    required super.child,
  }) : super(notifier: controller);

  static NotificationController of(BuildContext context) {
    final scope = context
        .dependOnInheritedWidgetOfExactType<NotificationScope>();
    assert(scope != null, 'NotificationScope not found in widget tree');
    return scope!.notifier!;
  }
}
