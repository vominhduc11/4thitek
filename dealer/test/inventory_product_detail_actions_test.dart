import 'package:dealer_hub/app_settings_controller.dart';
import 'package:dealer_hub/inventory_product_detail_screen.dart';
import 'package:dealer_hub/inventory_service.dart';
import 'package:dealer_hub/models.dart';
import 'package:dealer_hub/return_request_service.dart';
import 'package:dealer_hub/warranty_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'Inventory product detail keeps only the contextual scan-for-export action',
    (tester) async {
      SharedPreferences.setMockInitialValues(<String, Object>{});
      final settingsController = AppSettingsController();
      await settingsController.setLocale(const Locale('en'));
      final warrantyController = WarrantyController();
      addTearDown(warrantyController.dispose);

      await tester.pumpWidget(
        AppSettingsScope(
          controller: settingsController,
          child: WarrantyScope(
            controller: warrantyController,
            child: MaterialApp(
              home: InventoryProductDetailScreen(
                product: const Product(
                  id: 'p-1',
                  name: 'Warehouse Router',
                  sku: 'WR-01',
                  shortDescription: 'Warehouse router',
                  price: 1000000,
                  stock: 20,
                  warrantyMonths: 12,
                ),
                readyQuantity: 1,
                importedQuantity: 1,
                warrantyQuantity: 0,
                issueQuantity: 0,
                orderIds: const <String>['DH-001'],
                latestImportedAt: DateTime(2026, 4, 14, 9),
                inventoryService: _FakeInventoryService(),
                returnRequestService: _FakeReturnRequestService(),
              ),
            ),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Scan for export'), findsOneWidget);
      expect(find.text('Export stock'), findsNothing);
      expect(find.byIcon(Icons.local_shipping_outlined), findsNothing);
    },
  );
}

class _FakeInventoryService extends InventoryService {
  @override
  Future<List<DealerInventorySerialRecord>> fetchSerials({
    required String productId,
  }) async {
    return <DealerInventorySerialRecord>[
      DealerInventorySerialRecord(
        id: 101,
        record: ImportedSerialRecord(
          serial: 'SN-READY-001',
          orderId: 'DH-001',
          productId: 'p-1',
          productName: 'Warehouse Router',
          productSku: 'WR-01',
          importedAt: DateTime(2026, 4, 14, 9),
          status: ImportedSerialStatus.available,
        ),
      ),
    ];
  }

  @override
  void close() {}
}

class _FakeReturnRequestService extends ReturnRequestService {
  @override
  Future<DealerReturnEligibilityRecord> fetchSerialEligibility(
    int serialId, {
    DealerReturnRequestType? type,
  }) async {
    return DealerReturnEligibilityRecord(
      serialId: serialId,
      serial: 'SN-READY-001',
      orderId: 1,
      orderCode: 'DH-001',
      productId: 1,
      productName: 'Warehouse Router',
      productSku: 'WR-01',
      eligible: true,
      reasonCode: 'ELIGIBLE',
      reasonMessage: 'Eligible',
      activeRequestId: null,
      activeRequestCode: null,
    );
  }

  @override
  void close() {}
}
