import 'package:flutter/material.dart';

import 'warranty_controller.dart';

class WarrantyScope extends InheritedNotifier<WarrantyController> {
  const WarrantyScope({
    super.key,
    required WarrantyController controller,
    required super.child,
  }) : super(notifier: controller);

  static WarrantyController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<WarrantyScope>();
    assert(scope != null, 'WarrantyScope not found in widget tree.');
    return scope!.notifier!;
  }
}
