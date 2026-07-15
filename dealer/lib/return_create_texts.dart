part of 'return_create_screen.dart';

_DealerReturnCreateTexts _dealerReturnCreateTexts(BuildContext context) =>
    _DealerReturnCreateTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );

String _eligibilityReasonLabel(
  DealerReturnEligibilityRecord eligibility, {
  required bool isEnglish,
}) {
  final reason = eligibility.reasonCode.trim().toUpperCase();
  switch (reason) {
    case 'ELIGIBLE':
      return isEnglish ? 'Eligible for return' : 'Đủ điều kiện đổi trả';
    case 'ORDER_NOT_COMPLETED':
      return isEnglish
          ? 'Order must be completed before return request.'
          : 'Đơn hàng phải hoàn tất mới được tạo yêu cầu đổi trả.';
    case 'SERIAL_STATUS_NOT_ELIGIBLE':
      return isEnglish
          ? 'Serial status is not eligible for return.'
          : 'Trạng thái serial hiện tại không cho phép đổi trả.';
    case 'ACTIVE_RETURN_REQUEST_EXISTS':
      return isEnglish
          ? 'An active return request already exists for this serial.'
          : 'Serial này đã có yêu cầu đổi trả đang xử lý.';
    default:
      return eligibility.reasonMessage.isNotEmpty
          ? eligibility.reasonMessage
          : (isEnglish
                ? 'Eligibility unavailable'
                : 'Không xác định đủ điều kiện');
  }
}

class _DealerReturnCreateTexts {
  const _DealerReturnCreateTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle =>
      isEnglish ? 'Create return request' : 'Tạo yêu cầu đổi trả';
  String orderTitle(String orderCode) =>
      isEnglish ? 'Order $orderCode' : 'Đơn $orderCode';
  String orderHint(int eligibleCount) => isEnglish
      ? '$eligibleCount serial(s) are currently eligible to create a return request.'
      : '$eligibleCount serial đang đủ điều kiện tạo yêu cầu đổi trả.';
  String get checkingEligibilityMessage => isEnglish
      ? 'Checking eligible serials for this return request...'
      : 'Đang kiểm tra serial đủ điều kiện đổi trả...';
  String remoteOrderHint(int remoteOrderId) => isEnglish
      ? 'Runtime order id: $remoteOrderId'
      : 'Mã đơn runtime: $remoteOrderId';
  String missingOrderMappingMessage(String orderCode) => isEnglish
      ? 'Unable to resolve backend order id for order $orderCode. Please refresh this order and try again.'
      : 'Không tìm thấy mã đơn backend cho đơn $orderCode. Vui lòng tải lại đơn và thử lại.';
  String get loadFailedTitle => isEnglish
      ? 'Unable to load return eligibility'
      : 'Không thể tải dữ liệu đủ điều kiện đổi trả';
  String get eligibilityLoadTimeoutMessage => isEnglish
      ? 'Loading return eligibility timed out. Please retry.'
      : 'Tải dữ liệu đủ điều kiện đổi trả bị quá thời gian. Vui lòng thử lại.';
  String get eligibilityLoadInvalidResponseMessage => isEnglish
      ? 'The server returned invalid return data. Please retry.'
      : 'Máy chủ trả về dữ liệu đổi trả không hợp lệ. Vui lòng thử lại.';
  String get eligibilityLoadNetworkMessage => isEnglish
      ? 'Unable to reach the server right now. Please retry.'
      : 'Không thể kết nối máy chủ lúc này. Vui lòng thử lại.';
  String get eligibilityLoadFailedMessage => isEnglish
      ? 'Unable to load return eligibility right now.'
      : 'Không thể tải dữ liệu đủ điều kiện đổi trả lúc này.';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get requestConfigTitle =>
      isEnglish ? 'Request details' : 'Thông tin yêu cầu';
  String get typeLabel => isEnglish ? 'Return type' : 'Loại đổi trả';
  String get resolutionLabel =>
      isEnglish ? 'Requested resolution' : 'Phương án xử lý mong muốn';
  String get reasonCodeLabel =>
      isEnglish ? 'Reason code (optional)' : 'Mã lý do (tùy chọn)';
  String get reasonDetailLabel =>
      isEnglish ? 'Reason detail (optional)' : 'Mô tả chi tiết (tùy chọn)';
  String serialSelectionTitle(int selected, int total) => isEnglish
      ? 'Serial selection ($selected/$total)'
      : 'Chọn serial ($selected/$total)';
  String get noSerialsMessage => isEnglish
      ? 'No serials found for this order.'
      : 'Không tìm thấy serial nào của đơn này.';
  String get noEligibleSerialsGuidance => isEnglish
      ? 'There are no eligible serials for the selected return type. Change return type or try again later.'
      : 'Không có serial đủ điều kiện cho loại đổi trả đã chọn. Hãy đổi loại đổi trả hoặc thử lại sau.';
  String get attachmentSectionLabel =>
      isEnglish ? 'Attachments' : 'Tập đính kèm';
  String get attachmentsTitle =>
      isEnglish ? 'Attachments (optional)' : 'Tập đính kèm (tùy chọn)';
  String get addAttachmentAction =>
      isEnglish ? 'Upload attachment' : 'Tải tập đính kèm';
  String get uploadingAttachmentLabel =>
      isEnglish ? 'Uploading attachment...' : 'Đang tải tệp...';
  String get openAttachmentAction => isEnglish ? 'Open' : 'Mở';
  String get pickImageAction =>
      isEnglish ? 'Choose image from gallery' : 'Chọn ảnh từ thư viện';
  String get pickVideoAction =>
      isEnglish ? 'Choose video from gallery' : 'Chọn video từ thư viện';
  String get pickDocumentAction =>
      isEnglish ? 'Choose PDF document' : 'Chọn tài liệu PDF';
  String get attachmentHelper => isEnglish
      ? 'Supported: JPG/JPEG/PNG/WEBP (max 10MB), MP4/WEBM (max 50MB), PDF (max 10MB).'
      : 'Hỗ trợ: JPG/JPEG/PNG/WEBP (tối đa 10MB), MP4/WEBM (tối đa 50MB), PDF (tối đa 10MB).';
  String get submitAction =>
      isEnglish ? 'Submit return request' : 'Gửi yêu cầu đổi trả';
  String get createSuccessMessage => isEnglish
      ? 'Return request created successfully.'
      : 'Đã tạo yêu cầu đổi trả thành công.';
  String get selectAtLeastOneSerialMessage => isEnglish
      ? 'Select at least one eligible serial.'
      : 'Hãy chọn ít nhất một serial đủ điều kiện.';
  String get noEligibleSerialsSubmitMessage => isEnglish
      ? 'No eligible serials are available for this return request.'
      : 'Không có serial đủ điều kiện để tạo yêu cầu đổi trả này.';
  String get attachmentUploadInProgressMessage => isEnglish
      ? 'Please wait for the attachment upload to finish before submitting.'
      : 'Vui lòng chờ tải tập đính kèm xong trước khi gửi yêu cầu.';
  String reasonCodeTooLongMessage(int maxLength) => isEnglish
      ? 'Reason code must be at most $maxLength characters.'
      : 'Mã lý do tối đa $maxLength ký tự.';
  String reasonDetailTooLongMessage(int maxLength) => isEnglish
      ? 'Reason detail must be at most $maxLength characters.'
      : 'Mô tả chi tiết tối đa $maxLength ký tự.';
  String attachmentAddedMessage(String fileName) =>
      isEnglish ? 'Added attachment $fileName.' : 'Đã thêm tệp $fileName.';
  String get attachmentUnsupportedTypeMessage => isEnglish
      ? 'Unsupported file type. Please use image, MP4/WEBM video, or PDF.'
      : 'Định dạng tệp không hợp lệ. Chỉ hỗ trợ ảnh, video MP4/WEBM hoặc PDF.';
  String get attachmentImageTooLargeMessage =>
      isEnglish ? 'Image exceeds 10MB limit.' : 'Ảnh vượt quá giới hạn 10MB.';
  String get attachmentVideoTooLargeMessage =>
      isEnglish ? 'Video exceeds 50MB limit.' : 'Video vượt quá giới hạn 50MB.';
  String get attachmentDocumentTooLargeMessage => isEnglish
      ? 'Document exceeds 10MB limit.'
      : 'Tài liệu vượt quá giới hạn 10MB.';
  String attachmentUploadFailed(Object error) =>
      uploadServiceErrorMessage(error, isEnglish: isEnglish);
}
