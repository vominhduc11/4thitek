import 'package:flutter/widgets.dart';

import 'cart_controller.dart';
import 'notification_controller.dart';
import 'order_controller.dart';
import 'push_messaging_controller.dart';
import 'warranty_controller.dart';

Future<void> bootstrapSessionScopes(BuildContext context) async {
  await CartScope.of(context).load();
  if (!context.mounted) {
    return;
  }
  await OrderScope.of(context).load(forceRefresh: true);
  if (!context.mounted) {
    return;
  }
  await WarrantyScope.of(context).load(forceRefresh: true);
  if (!context.mounted) {
    return;
  }
  await NotificationScope.of(context).load(forceRefresh: true);
  if (!context.mounted) {
    return;
  }
  final pushMessagingController = PushMessagingScope.maybeOf(context);
  await pushMessagingController?.initialize();
  if (!context.mounted) {
    return;
  }
  await pushMessagingController?.refreshRegistration();
}
