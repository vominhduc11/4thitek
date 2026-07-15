part of 'support_screen.dart';

class _SupportTexts {
  const _SupportTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle => isEnglish ? 'Support' : 'Hỗ trợ';
  String get quickContactTitle => isEnglish ? 'Quick contact' : 'Liên hệ nhanh';
  String get hotlineLabel => 'Hotline';
  String get emailLabel => 'Email';
  String get copyAction => isEnglish ? 'Copy' : 'Sao chép';
  String get hotlineCopiedMessage =>
      isEnglish ? 'Hotline number copied.' : 'Đã sao chép số hotline.';
  String get supportEmailCopiedMessage =>
      isEnglish ? 'Support email copied.' : 'Đã sao chép email hỗ trợ.';
  String copiedValueMessage(String value) =>
      isEnglish ? 'Copied $value' : 'Đã sao chép $value';
  String get callHotlineAction => isEnglish ? 'Call hotline' : 'Gọi hotline';
  String get sendEmailAction => isEnglish ? 'Send email' : 'Gửi email';
  String get supportHours => isEnglish
      ? 'Support hours: 8:00-18:00 (Mon-Sat)'
      : 'Thời gian hỗ trợ: 8:00-18:00 (T2-T7)';
  String get faqTitle =>
      isEnglish ? 'Frequently asked questions' : 'Câu hỏi thường gặp';
  String get recentRequestsTitle =>
      isEnglish ? 'Recent requests' : 'Yêu cầu gần đây';
  String get submitRequestTitle =>
      isEnglish ? 'Submit support request' : 'Gửi yêu cầu hỗ trợ';
  String get categoryFieldLabel =>
      isEnglish ? 'Request category' : 'Loại yêu cầu';
  String get categorySummaryLabel => isEnglish ? 'Category' : 'Loại yêu cầu';
  String get priorityFieldLabel => isEnglish ? 'Priority' : 'Mức độ ưu tiên';
  String get prioritySummaryLabel => isEnglish ? 'Priority' : 'Ưu tiên';
  String get subjectFieldLabel => isEnglish ? 'Subject' : 'Tiêu đề';
  String get descriptionFieldLabel => isEnglish ? 'Description' : 'Nội dung';
  String get descriptionHint => isEnglish
      ? 'Describe your issue, event time, and order/serial code if available.'
      : 'Mô tả vấn đề, thời điểm xảy ra và mã đơn hoặc serial nếu có.';
  String get descriptionHelper => isEnglish
      ? 'The more details you share, the faster support can help.'
      : 'Thông tin càng chi tiết, đội hỗ trợ xử lý càng nhanh.';
  String expectedResponseTime(String sla) => isEnglish
      ? 'Expected response time: $sla'
      : 'Thời gian phản hồi dự kiến: $sla';
  String get submitRequestAction =>
      isEnglish ? 'Submit request' : 'Gửi yêu cầu';
  String get followUpAction => isEnglish
      ? 'Send details for this request'
      : 'Gửi bổ sung cho yêu cầu này';
  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get cannotOpenDialerMessage => isEnglish
      ? 'Cannot open dialer. Number has been copied.'
      : 'Không mở được cuộc gọi. Đã sao chép số.';
  String get cannotOpenEmailAppMessage => isEnglish
      ? 'Cannot open email app. Address has been copied.'
      : 'Không mở được ứng dụng email. Đã sao chép địa chỉ.';
  String get confirmSubmitTitle =>
      isEnglish ? 'Confirm request' : 'Xác nhận gửi yêu cầu';
  String get confirmSubmitDescription => isEnglish
      ? 'Please review the request details before submitting.'
      : 'Vui lòng kiểm tra thông tin yêu cầu trước khi gửi.';

  String get latestTicketLoadWarning => isEnglish
      ? 'Unable to load the latest support status right now.'
      : 'Chua the tai trang thai ho tro moi nhat luc nay.';
  String get historyLoadWarning => isEnglish
      ? 'Unable to load support request history right now.'
      : 'Chua the tai lich su yeu cau ho tro luc nay.';

  String get deepLinkTicketUnavailableWarning => isEnglish
      ? 'The requested support ticket is unavailable or you do not have access.'
      : 'Khong mo duoc ticket ho tro theo lien ket hoac ban khong co quyen truy cap.';
  String get statusSyncWarningTitle =>
      isEnglish ? 'Support status' : 'Trạng thái hỗ trợ';
  String get retryAction => isEnglish ? 'Retry' : 'Thử lại';
  String get missingFieldsMessage => isEnglish
      ? 'Please enter both subject and description.'
      : 'Vui lòng nhập tiêu đề và nội dung.';
  String get messageOnlyRequiredMessage => isEnglish
      ? 'Please enter the follow-up message.'
      : 'Vui lòng nhập nội dung bổ sung.';
  String requestSubmittedMessage(String ticketCode) => isEnglish
      ? 'Request #$ticketCode has been submitted.'
      : 'Yêu cầu #$ticketCode đã được gửi.';
  String followUpSubmittedMessage(String ticketCode) => isEnglish
      ? 'Additional details sent to request #$ticketCode.'
      : 'Đã gửi bổ sung cho yêu cầu #$ticketCode.';
  String get requestSubmittedTitle =>
      isEnglish ? 'Request submitted' : 'Yêu cầu đã gửi';
  String get hideAction => isEnglish ? 'Hide' : 'Ẩn';
  String get ticketIdLabel => isEnglish ? 'Request ID' : 'Mã yêu cầu';
  String get submittedAtLabel => isEnglish ? 'Submitted at' : 'Thời gian gửi';
  String get responseSlaLabel =>
      isEnglish ? 'Expected response' : 'Phản hồi dự kiến';
  String get statusSummaryLabel => isEnglish ? 'Status' : 'Trạng thái';
  String get adminReplyLabel => isEnglish
      ? 'Latest support team update'
      : 'Cập nhật mới nhất từ đội hỗ trợ';

  String categoryLabel(SupportCategory category) {
    switch (category) {
      case SupportCategory.order:
        return isEnglish ? 'Order' : 'Đơn hàng';
      case SupportCategory.warranty:
        return isEnglish ? 'Warranty / Serial' : 'Bảo hành / Serial';
      case SupportCategory.product:
        return isEnglish ? 'Product' : 'Sản phẩm';
      case SupportCategory.payment:
        return isEnglish ? 'Payment' : 'Thanh toán';
      case SupportCategory.returnOrder:
        return isEnglish ? 'Return' : 'Đổi trả hàng';
      case SupportCategory.other:
        return isEnglish ? 'Other' : 'Khác';
    }
  }

  String priorityLabel(SupportPriority priority) {
    switch (priority) {
      case SupportPriority.normal:
        return isEnglish ? 'Normal' : 'Bình thường';
      case SupportPriority.high:
        return isEnglish ? 'High' : 'Cao';
      case SupportPriority.urgent:
        return isEnglish ? 'Urgent' : 'Khẩn cấp';
    }
  }

  String slaText(SupportPriority priority) {
    switch (priority) {
      case SupportPriority.normal:
        return isEnglish ? '4-8 business hours' : '4-8 giờ làm việc';
      case SupportPriority.high:
        return isEnglish ? '2-4 business hours' : '2-4 giờ làm việc';
      case SupportPriority.urgent:
        return isEnglish ? '30-60 minutes' : '30-60 phút';
    }
  }

  String statusLabel(String status) {
    switch (status.trim().toLowerCase()) {
      case 'open':
        return isEnglish ? 'Open' : 'Mới gửi';
      case 'in_progress':
        return isEnglish ? 'In progress' : 'Đang xử lý';
      case 'resolved':
        return isEnglish ? 'Resolved' : 'Đã xử lý xong';
      case 'closed':
        return isEnglish ? 'Closed' : 'Đã kết thúc';
      default:
        return status;
    }
  }

  List<_FaqItem> get faqItems => isEnglish
      ? const [
          _FaqItem(
            title: 'Cannot sign in',
            body:
                'Check your email, password, and internet connection before retrying.',
            icon: Icons.lock_outline,
          ),
          _FaqItem(
            title: 'Order status not updated',
            body:
                'The system may take 3-5 minutes to sync recent status changes.',
            icon: Icons.receipt_long_outlined,
          ),
          _FaqItem(
            title: 'Serial handling',
            body:
                'Prepare serial/IMEI and customer phone number for faster support.',
            icon: Icons.verified_outlined,
          ),
          _FaqItem(
            title: 'Payment reconciliation delay',
            body:
                'Bank transfer reconciliation can be delayed during peak periods.',
            icon: Icons.account_balance_wallet_outlined,
          ),
          _FaqItem(
            title: 'Warranty activation issue',
            body:
                'Verify purchase date and serial format before submitting warranty.',
            icon: Icons.shield_outlined,
          ),
        ]
      : const [
          _FaqItem(
            title: 'Không đăng nhập được',
            body:
                'Kiểm tra email, mật khẩu và đảm bảo thiết bị có kết nối mạng.',
            icon: Icons.lock_outline,
          ),
          _FaqItem(
            title: 'Đơn hàng chưa cập nhật',
            body:
                'Hệ thống có thể cần 3-5 phút để đồng bộ trạng thái đơn hàng.',
            icon: Icons.receipt_long_outlined,
          ),
          _FaqItem(
            title: 'Xử lý serial',
            body: 'Chuẩn bị serial/IMEI và số điện thoại để xử lý nhanh hơn.',
            icon: Icons.verified_outlined,
          ),
          _FaqItem(
            title: 'Đối soát thanh toán chậm',
            body:
                'Đối soát chuyển khoản có thể chậm hơn vào khung giờ cao điểm.',
            icon: Icons.account_balance_wallet_outlined,
          ),
          _FaqItem(
            title: 'Lỗi kích hoạt bảo hành',
            body:
                'Kiểm tra ngày mua và định dạng serial trước khi gửi yêu cầu.',
            icon: Icons.shield_outlined,
          ),
        ];
}

extension _SupportTextsValidationMessages on _SupportTexts {
  String subjectTooShortMessage(int minLength) => isEnglish
      ? 'Subject must be at least $minLength characters.'
      : 'Tiêu đề phải có ít nhất $minLength ký tự.';

  String messageTooShortMessage(int minLength) => isEnglish
      ? 'Description must be at least $minLength characters.'
      : 'Nội dung phải có ít nhất $minLength ký tự.';
}

extension _SupportTextsSupportExtras on _SupportTexts {
  String get supportCenterTitle =>
      isEnglish ? 'Dealer support center' : 'Trung tâm hỗ trợ đại lý';
  String get supportCenterDescription => isEnglish
      ? 'Track every support request in one place, review updates, and add more information to the right request.'
      : 'Theo dõi toàn bộ yêu cầu hỗ trợ tại một nơi, xem cập nhật mới nhất và bổ sung thông tin đúng yêu cầu đang xử lý.';
  String get statusSummaryTitle =>
      isEnglish ? 'Support status summary' : 'Tóm tắt trạng thái hỗ trợ';
  String statusSummarySubtitle(String ticketCode) => isEnglish
      ? 'Request in view: #$ticketCode'
      : 'Yêu cầu đang xem: #$ticketCode';
  String get noActiveTicketSummary => isEnglish
      ? 'No request is being tracked yet. Create a new request whenever you need support.'
      : 'Hiện chưa có yêu cầu nào đang theo dõi. Bạn có thể tạo yêu cầu mới bất cứ lúc nào.';
  String get supportHoursLabel =>
      isEnglish ? 'Support hours' : 'Khung giờ hỗ trợ';
  String get startNewTicketAction =>
      isEnglish ? 'Create new request' : 'Tạo yêu cầu mới';
  String get replyActiveTicketAction => isEnglish
      ? 'Add details to current request'
      : 'Bổ sung cho yêu cầu đang xem';
  String get activeLabel => isEnglish ? 'Request in view' : 'Yêu cầu đang xem';
  String get ticketInboxTitle =>
      isEnglish ? 'Request list' : 'Danh sách yêu cầu';
  String get ticketDetailTitle =>
      isEnglish ? 'Request details' : 'Chi tiết yêu cầu';
  String get emptyDetailTitle => isEnglish
      ? 'Choose a request to view the full conversation'
      : 'Chọn một yêu cầu để xem toàn bộ trao đổi';
  String get emptyDetailDescription => isEnglish
      ? 'Once you select a request, you will see its status, related information, and full conversation here.'
      : 'Khi chọn một yêu cầu, bạn sẽ xem được trạng thái, thông tin liên quan và toàn bộ trao đổi tại đây.';
  String get startFirstTicketAction =>
      isEnglish ? 'Create your first request' : 'Tạo yêu cầu đầu tiên';
  String get threadTitle =>
      isEnglish ? 'Conversation history' : 'Lịch sử trao đổi';
  String threadCountLabel(int count) =>
      isEnglish ? '$count updates' : '$count cập nhật';
  String get rootMessageLabel =>
      isEnglish ? 'Original request' : 'Nội dung bạn đã gửi';
  String threadAuthorLabel(String authorRole, String? authorName) {
    switch (authorRole.trim().toLowerCase()) {
      case 'admin':
        return authorName?.trim().isNotEmpty == true
            ? authorName!.trim()
            : (isEnglish ? 'Support team' : 'Đội hỗ trợ');
      case 'dealer':
        return authorName?.trim().isNotEmpty == true
            ? authorName!.trim()
            : (isEnglish ? 'You' : 'Bạn');
      default:
        return authorName?.trim().isNotEmpty == true
            ? authorName!.trim()
            : (isEnglish ? 'System' : 'Hệ thống');
    }
  }

  String threadRoleLabel(String authorRole, {required bool isRootMessage}) {
    if (isRootMessage) {
      return isEnglish ? 'Sent by you' : 'Bạn đã gửi yêu cầu này';
    }
    switch (authorRole.trim().toLowerCase()) {
      case 'admin':
        return isEnglish ? 'Support reply' : 'Phản hồi từ hỗ trợ';
      case 'dealer':
        return isEnglish ? 'Dealer reply' : 'Phản hồi từ đại lý';
      default:
        return isEnglish ? 'System update' : 'Cập nhật hệ thống';
    }
  }

  String get openAttachmentAction => isEnglish ? 'Open' : 'Mở';
  String get downloadAttachmentAction => isEnglish ? 'Download' : 'Tải xuống';
  String attachmentDownloadedMessage(String fileName) =>
      isEnglish ? 'Saved $fileName.' : 'Đã tải xuống $fileName.';
  String attachmentDownloadFailedMessage(Object error) => isEnglish
      ? 'Unable to save the file right now.'
      : 'Không thể tải tệp xuống lúc này.';

  String get newRequestModeTitle =>
      isEnglish ? 'Create a new support request' : 'Tạo yêu cầu hỗ trợ mới';
  String get newRequestModeDescription => isEnglish
      ? 'Use this form for a brand-new issue. Your request will appear in the request list right after submission.'
      : 'Dùng biểu mẫu này khi bạn cần gửi một yêu cầu mới. Yêu cầu sẽ xuất hiện ngay trong danh sách sau khi gửi.';
  String get followUpModeTitle => isEnglish
      ? 'Add details to the current request'
      : 'Bổ sung cho yêu cầu đang xem';
  String get followUpModeUnavailableTitle =>
      isEnglish ? 'No request selected' : 'Chưa chọn yêu cầu';
  String get followUpModeUnavailable => isEnglish
      ? 'Select an active request from the list above to send more details.'
      : 'Hãy chọn một yêu cầu đang xử lý ở phía trên để gửi thêm thông tin.';
  String get selectTicketToReplyMessage => isEnglish
      ? 'Please choose a request before sending more details.'
      : 'Vui lòng chọn yêu cầu trước khi gửi bổ sung.';
  String get closedTicketReplyTitle =>
      isEnglish ? 'Request is closed' : 'Yêu cầu đã kết thúc';
  String get closedTicketReplyMessage => isEnglish
      ? 'This request is already closed. Create a new request if you still need assistance.'
      : 'Yêu cầu này đã kết thúc. Hãy tạo yêu cầu mới nếu bạn vẫn cần hỗ trợ.';
  String get followUpFieldLabel =>
      isEnglish ? 'Additional details' : 'Nội dung bổ sung';
  String get followUpHint => isEnglish
      ? 'Share the latest update, proof, or any extra details for this request.'
      : 'Mô tả cập nhật mới nhất, bổ sung bằng chứng hoặc thông tin cần làm rõ cho yêu cầu này.';
  String get followUpHelper => isEnglish
      ? 'Your message will be added to the conversation history of the selected request.'
      : 'Nội dung này sẽ được thêm vào lịch sử trao đổi của yêu cầu đang xem.';

  String get contextSectionTitle =>
      isEnglish ? 'Related information' : 'Thong tin lien quan';
  String get contextSectionDescription => isEnglish
      ? 'Add the order code, payment reference, serial, or return reason so support can handle the request faster.'
      : 'Bo sung ma don, giao dich, serial hoac ly do tra hang de doi ho tro xu ly nhanh hon.';

  String get contextSummaryTitle =>
      isEnglish ? 'Related information' : 'Thong tin lien quan';

  String get linkedReturnCardTitle =>
      isEnglish ? 'Related return request' : 'Yeu cau doi tra lien quan';
  String get returnCodeLabel => isEnglish ? 'Return code' : 'Ma yeu cau';
  String get returnStatusLabel =>
      isEnglish ? 'Return status' : 'Trang thai doi tra';
  String get openLinkedReturnAction =>
      isEnglish ? 'Open return detail' : 'Mo chi tiet doi tra';
  String get createdLabel => isEnglish ? 'Submitted' : 'Gửi lúc';
  String get resolvedLabel => isEnglish ? 'Resolved' : 'Xử lý xong lúc';
  String get closedLabel => isEnglish ? 'Closed' : 'Kết thúc lúc';
  String get quickTipsTitle =>
      isEnglish ? 'Quick tips before sending' : 'Gợi ý trước khi gửi';
  String get quickTipOneTitle => isEnglish
      ? 'Use the correct order or serial'
      : 'Chuẩn bị đúng mã đơn hoặc serial';
  String get quickTipOneBody => isEnglish
      ? 'Adding the right order code or serial helps support verify the issue much faster.'
      : 'Thêm đúng mã đơn hoặc serial giúp đội hỗ trợ xác minh vấn đề nhanh hơn.';
  String get quickTipTwoTitle =>
      isEnglish ? 'Attach evidence when possible' : 'Đính kèm hình ảnh nếu có';
  String get quickTipTwoBody => isEnglish
      ? 'Screenshots, payment proof, or serial labels usually shorten the processing time.'
      : 'Ảnh chụp màn hình, chứng từ chuyển khoản hoặc tem serial thường giúp rút ngắn thời gian xử lý.';
  String get quickTipThreeTitle => isEnglish
      ? 'Add details inside the same request'
      : 'Bổ sung ngay trong yêu cầu đang xem';
  String get quickTipThreeBody => isEnglish
      ? 'When support asks for more information, add it to the same request so the conversation stays complete.'
      : 'Khi cần bổ sung thông tin, hãy bổ sung ngay trong yêu cầu đang xem để lịch sử trao đổi luôn đầy đủ.';
  String get replyThisTicketAction =>
      isEnglish ? 'Add details to this request' : 'Bổ sung cho yêu cầu này';
  String followUpTargetLabel(String ticketCode, String subject) => isEnglish
      ? 'Adding details to request #$ticketCode - $subject'
      : 'Đang bổ sung cho yêu cầu #$ticketCode - $subject';

  String get orderCodeFieldLabel => isEnglish ? 'Order code' : 'Mã đơn hàng';
  String get transactionCodeFieldLabel =>
      isEnglish ? 'Transaction code' : 'Mã giao dịch';
  String get paidAmountFieldLabel =>
      isEnglish ? 'Paid amount' : 'Số tiền đã chuyển';
  String get paymentReferenceFieldLabel =>
      isEnglish ? 'Payment reference' : 'Nội dung chuyển khoản';
  String get serialFieldLabel => 'Serial';
  String get returnReasonFieldLabel =>
      isEnglish ? 'Return reason' : 'Lý do trả hàng';
  String get attachmentSectionLabel =>
      isEnglish ? 'Attachments' : 'Tệp đính kèm';
  String get addAttachmentAction =>
      isEnglish ? 'Add attachment' : 'Thêm tệp đính kèm';
  String get uploadingAttachmentLabel =>
      isEnglish ? 'Uploading attachment...' : 'Đang tải tệp...';
  String get pickImageAction =>
      isEnglish ? 'Choose image from gallery' : 'Chọn ảnh từ thư viện';
  String get pickVideoAction =>
      isEnglish ? 'Choose video from gallery' : 'Chọn video từ thư viện';
  String get pickDocumentAction =>
      isEnglish ? 'Choose PDF document' : 'Chọn tài liệu PDF';
  String get attachmentHelper => isEnglish
      ? 'Supported: JPG/JPEG/PNG/WEBP (max 10MB), MP4/WEBM (max 50MB), PDF (max 10MB).'
      : 'Hỗ trợ: JPG/JPEG/PNG/WEBP (tối đa 10MB), MP4/WEBM (tối đa 50MB), PDF (tối đa 10MB).';
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

class _TicketThreadItem {
  const _TicketThreadItem({
    required this.authorRole,
    required this.authorName,
    required this.message,
    required this.createdAt,
    required this.attachments,
    this.isRootMessage = false,
  });

  final String authorRole;
  final String? authorName;
  final String message;
  final DateTime createdAt;
  final List<SupportTicketAttachmentRecord> attachments;
  final bool isRootMessage;
}
