import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import 'dealer_routes.dart';
import 'inventory_screen.dart';
import 'return_request_service.dart';

extension DealerNavigationX on BuildContext {
  void goToDealerHome() => go(DealerRoutePath.home);

  void goToDealerLogin() => go(DealerRoutePath.login);

  Future<T?> pushDealerNotifications<T extends Object?>() =>
      push<T>(DealerRoutePath.notifications);

  Future<T?> pushDealerProducts<T extends Object?>() =>
      push<T>(DealerRoutePath.products);

  void goToDealerProducts() => go(DealerRoutePath.products);

  Future<T?> pushDealerProductDetail<T extends Object?>(String productId) =>
      push<T>(DealerRoutePath.productDetail(productId));

  Future<T?> pushDealerOrders<T extends Object?>() =>
      push<T>(DealerRoutePath.orders);

  void goToDealerOrders() => go(DealerRoutePath.orders);

  Future<T?> pushDealerOrderDetail<T extends Object?>(String orderId) =>
      push<T>(DealerRoutePath.orderDetail(orderId));

  Future<T?> pushDealerReturns<T extends Object?>() =>
      push<T>(DealerRoutePath.returns);

  void goToDealerReturns() => go(DealerRoutePath.returns);

  Future<T?> pushDealerReturnDetail<T extends Object?>(int requestId) =>
      push<T>(DealerRoutePath.returnDetail(requestId));

  void goToDealerReturnDetail(int requestId) =>
      go(DealerRoutePath.returnDetail(requestId));

  Future<T?> pushDealerCreateReturnRequest<T extends Object?>(
    String orderId, {
    int? prefilledSerialId,
    DealerReturnRequestType? returnType,
  }) => push<T>(
    DealerRoutePath.createReturnRequest(
      orderId,
      prefilledSerialId: prefilledSerialId,
      returnType: returnType,
    ),
  );

  void goDealerOrderDetail(String orderId) =>
      go(DealerRoutePath.orderDetail(orderId));

  Future<T?> pushDealerSupport<T extends Object?>({int? ticketId}) => push<T>(
    ticketId != null && ticketId > 0
        ? DealerRoutePath.supportWithTicket(ticketId)
        : DealerRoutePath.support,
  );

  Future<T?> pushDealerInventory<T extends Object?>({
    InventoryStockFilter? filter,
  }) {
    final route = switch (filter) {
      InventoryStockFilter.inStock => DealerRoutePath.inventoryWithFilter(
        'in-stock',
      ),
      InventoryStockFilter.lowStock => DealerRoutePath.inventoryWithFilter(
        'low-stock',
      ),
      InventoryStockFilter.outOfStock => DealerRoutePath.inventoryWithFilter(
        'out-of-stock',
      ),
      _ => DealerRoutePath.inventory,
    };
    return push<T>(route);
  }

  Future<T?> pushDealerWarrantyHub<T extends Object?>() =>
      push<T>(DealerRoutePath.warranty);

  Future<T?> pushDealerWarrantyActivation<T extends Object?>(
    String orderId, {
    String? prefilledSerial,
    String? prefilledProductId,
  }) => push<T>(
    DealerRoutePath.warrantyActivation(
      orderId,
      prefilledSerial: prefilledSerial,
      prefilledProductId: prefilledProductId,
    ),
  );

  Future<T?> pushDealerWarrantyExport<T extends Object?>({String? serial}) =>
      push<T>(
        serial == null || serial.trim().isEmpty
            ? DealerRoutePath.warrantyExport
            : DealerRoutePath.warrantyExportWithSerial(serial.trim()),
      );

  Future<T?> pushDealerAccountSettings<T extends Object?>() =>
      push<T>(DealerRoutePath.accountSettings);

  Future<T?> pushDealerAccountPreferences<T extends Object?>() =>
      push<T>(DealerRoutePath.accountPreferences);

  Future<T?> pushDealerChangePassword<T extends Object?>() =>
      push<T>(DealerRoutePath.accountChangePassword);

  Future<T?> pushDealerCart<T extends Object?>() =>
      push<T>(DealerRoutePath.cart);

  Future<T?> pushDealerCheckout<T extends Object?>() =>
      push<T>(DealerRoutePath.checkout);

  Future<T?> openDealerInternalRoute<T extends Object?>(String route) {
    final normalized = normalizeDealerInternalRoute(route) ?? route;
    return push<T>(normalized);
  }
}
