import 'package:flutter/material.dart';

import 'return_request_service.dart';

String dealerReturnStatusLabel(
  DealerReturnRequestStatus status, {
  required bool isEnglish,
}) {
  switch (status) {
    case DealerReturnRequestStatus.submitted:
      return isEnglish ? 'Return requested' : 'Da gui yeu cau doi tra';
    case DealerReturnRequestStatus.underReview:
      return isEnglish ? 'Awaiting admin review' : 'Cho admin duyet';
    case DealerReturnRequestStatus.approved:
      return isEnglish ? 'Approved' : 'Da duyet';
    case DealerReturnRequestStatus.rejected:
      return isEnglish ? 'Rejected' : 'Bi tu choi';
    case DealerReturnRequestStatus.awaitingReceipt:
      return isEnglish ? 'Awaiting receipt' : 'Cho tiep nhan hang tra';
    case DealerReturnRequestStatus.received:
      return isEnglish ? 'Received' : 'Da tiep nhan';
    case DealerReturnRequestStatus.inspecting:
      return isEnglish ? 'Inspecting' : 'Dang kiem dinh';
    case DealerReturnRequestStatus.partiallyResolved:
      return isEnglish ? 'Partially resolved' : 'Da xu ly mot phan';
    case DealerReturnRequestStatus.completed:
      return isEnglish ? 'Completed' : 'Hoan tat';
    case DealerReturnRequestStatus.cancelled:
      return isEnglish ? 'Cancelled' : 'Da huy';
    case DealerReturnRequestStatus.unknown:
      return isEnglish ? 'Unknown' : 'Khong xac dinh';
  }
}

String dealerReturnTypeLabel(
  DealerReturnRequestType type, {
  required bool isEnglish,
}) {
  switch (type) {
    case DealerReturnRequestType.commercialReturn:
      return isEnglish ? 'Commercial return' : 'Tra hang thuong mai';
    case DealerReturnRequestType.defectiveReturn:
      return isEnglish ? 'Defective return' : 'Tra hang loi';
    case DealerReturnRequestType.warrantyRma:
      return isEnglish ? 'Warranty RMA' : 'Bao hanh RMA';
    case DealerReturnRequestType.unknown:
      return isEnglish ? 'Unknown type' : 'Loai khong xac dinh';
  }
}

String dealerReturnResolutionLabel(
  DealerReturnRequestResolution resolution, {
  required bool isEnglish,
}) {
  switch (resolution) {
    case DealerReturnRequestResolution.replace:
      return isEnglish ? 'Replace' : 'Doi moi';
    case DealerReturnRequestResolution.creditNote:
      return isEnglish ? 'Credit note' : 'Bu tru cong no';
    case DealerReturnRequestResolution.refund:
      return isEnglish ? 'Refund' : 'Hoan tien';
    case DealerReturnRequestResolution.inspectOnly:
      return isEnglish ? 'Inspect only' : 'Chi kiem tra';
    case DealerReturnRequestResolution.unknown:
      return isEnglish ? 'Unknown' : 'Khong xac dinh';
  }
}

String dealerItemConditionLabel(
  DealerReturnRequestItemCondition condition, {
  required bool isEnglish,
}) {
  switch (condition) {
    case DealerReturnRequestItemCondition.sealed:
      return isEnglish ? 'Sealed' : 'Con seal';
    case DealerReturnRequestItemCondition.openBox:
      return isEnglish ? 'Open box' : 'Da mo hop';
    case DealerReturnRequestItemCondition.used:
      return isEnglish ? 'Used' : 'Da su dung';
    case DealerReturnRequestItemCondition.defective:
      return isEnglish ? 'Defective' : 'Loi';
    case DealerReturnRequestItemCondition.unknown:
      return isEnglish ? 'Unknown' : 'Khong xac dinh';
  }
}

Color dealerReturnStatusBackground(DealerReturnRequestStatus status) {
  switch (status) {
    case DealerReturnRequestStatus.submitted:
      return const Color(0xFF4C3B16);
    case DealerReturnRequestStatus.underReview:
    case DealerReturnRequestStatus.awaitingReceipt:
    case DealerReturnRequestStatus.received:
      return const Color(0xFF1E3150);
    case DealerReturnRequestStatus.inspecting:
    case DealerReturnRequestStatus.partiallyResolved:
      return const Color(0xFF154052);
    case DealerReturnRequestStatus.approved:
    case DealerReturnRequestStatus.completed:
      return const Color(0xFF1A3F2D);
    case DealerReturnRequestStatus.rejected:
      return const Color(0xFF4A1E24);
    case DealerReturnRequestStatus.cancelled:
    case DealerReturnRequestStatus.unknown:
      return const Color(0xFF2A3642);
  }
}

Color dealerReturnStatusForeground(DealerReturnRequestStatus status) {
  switch (status) {
    case DealerReturnRequestStatus.submitted:
      return const Color(0xFFF4D18A);
    case DealerReturnRequestStatus.underReview:
    case DealerReturnRequestStatus.awaitingReceipt:
    case DealerReturnRequestStatus.received:
      return const Color(0xFF93C5FD);
    case DealerReturnRequestStatus.inspecting:
    case DealerReturnRequestStatus.partiallyResolved:
      return const Color(0xFF7DD3FC);
    case DealerReturnRequestStatus.approved:
    case DealerReturnRequestStatus.completed:
      return const Color(0xFF86EFAC);
    case DealerReturnRequestStatus.rejected:
      return const Color(0xFFFDA4AF);
    case DealerReturnRequestStatus.cancelled:
    case DealerReturnRequestStatus.unknown:
      return const Color(0xFFCBD5E1);
  }
}

bool dealerReturnStatusCanCancel(DealerReturnRequestStatus status) {
  return status == DealerReturnRequestStatus.submitted ||
      status == DealerReturnRequestStatus.underReview ||
      status == DealerReturnRequestStatus.approved ||
      status == DealerReturnRequestStatus.awaitingReceipt;
}

bool dealerReturnStatusIsActive(DealerReturnRequestStatus status) {
  return status == DealerReturnRequestStatus.submitted ||
      status == DealerReturnRequestStatus.underReview ||
      status == DealerReturnRequestStatus.approved ||
      status == DealerReturnRequestStatus.awaitingReceipt ||
      status == DealerReturnRequestStatus.received ||
      status == DealerReturnRequestStatus.inspecting ||
      status == DealerReturnRequestStatus.partiallyResolved;
}
