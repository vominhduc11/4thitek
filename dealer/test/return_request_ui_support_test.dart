import 'package:dealer_hub/return_request_service.dart';
import 'package:dealer_hub/return_request_ui_support.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('maps dealer return status labels in English', () {
    expect(
      dealerReturnStatusLabel(
        DealerReturnRequestStatus.submitted,
        isEnglish: true,
      ),
      'Return requested',
    );
    expect(
      dealerReturnStatusLabel(
        DealerReturnRequestStatus.underReview,
        isEnglish: true,
      ),
      'Awaiting admin review',
    );
    expect(
      dealerReturnStatusLabel(
        DealerReturnRequestStatus.awaitingReceipt,
        isEnglish: true,
      ),
      'Awaiting receipt',
    );
  });

  test('parses known and unknown backend return status values', () {
    expect(
      DealerReturnRequestStatus.fromApi('INSPECTING'),
      DealerReturnRequestStatus.inspecting,
    );
    expect(
      DealerReturnRequestStatus.fromApi('COMPLETED'),
      DealerReturnRequestStatus.completed,
    );
    expect(
      DealerReturnRequestStatus.fromApi('NOT_A_REAL_STATUS'),
      DealerReturnRequestStatus.unknown,
    );
  });

  test('cancelability is true only for pre-processing statuses', () {
    expect(
      dealerReturnStatusCanCancel(DealerReturnRequestStatus.submitted),
      isTrue,
    );
    expect(
      dealerReturnStatusCanCancel(DealerReturnRequestStatus.awaitingReceipt),
      isTrue,
    );
    expect(
      dealerReturnStatusCanCancel(DealerReturnRequestStatus.received),
      isFalse,
    );
    expect(
      dealerReturnStatusCanCancel(DealerReturnRequestStatus.completed),
      isFalse,
    );
  });
}
