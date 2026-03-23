import 'package:dealer_hub/warranty_controller.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Warranty serial validation messages render English copy', () {
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.invalidSerial,
        isEnglish: true,
        serial: '',
      ),
      'Serial is invalid.',
    );
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.notImported,
        isEnglish: true,
        serial: 'SN-001',
      ),
      'Serial SN-001 is not available in inventory.',
    );
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.wrongProduct,
        isEnglish: true,
        serial: 'SN-001',
        productName: 'Router AX',
      ),
      'Serial SN-001 does not belong to product Router AX.',
    );
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.wrongOrder,
        isEnglish: true,
        serial: 'SN-001',
        actualOrderId: 'DH-01',
        expectedOrderId: 'DH-02',
      ),
      'Serial SN-001 belongs to order DH-01, not order DH-02.',
    );
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.alreadyActivated,
        isEnglish: true,
        serial: 'SN-001',
      ),
      'Serial SN-001 was already activated.',
    );
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.invalidOrderState,
        isEnglish: true,
        serial: 'SN-001',
      ),
      'Serial SN-001 is not linked to a completed order yet.',
    );
  });

  test('Warranty serial validation messages render Vietnamese copy', () {
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.invalidSerial,
        isEnglish: false,
        serial: '',
      ),
      'Serial khong hop le.',
    );
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.notImported,
        isEnglish: false,
        serial: 'SN-001',
      ),
      'Serial SN-001 chua duoc nhap kho.',
    );
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.wrongProduct,
        isEnglish: false,
        serial: 'SN-001',
        productName: 'Router AX',
      ),
      'Serial SN-001 khong thuoc san pham Router AX.',
    );
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.wrongOrder,
        isEnglish: false,
        serial: 'SN-001',
        actualOrderId: 'DH-01',
        expectedOrderId: 'DH-02',
      ),
      'Serial SN-001 thuoc don DH-01, khong thuoc don DH-02.',
    );
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.alreadyActivated,
        isEnglish: false,
        serial: 'SN-001',
      ),
      'Serial SN-001 da duoc kich hoat truoc do.',
    );
    expect(
      warrantySerialValidationMessage(
        WarrantySerialValidationErrorCode.invalidOrderState,
        isEnglish: false,
        serial: 'SN-001',
      ),
      'Serial SN-001 chua thuoc don da hoan thanh.',
    );
  });
}
