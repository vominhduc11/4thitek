import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'support_service.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';
import 'widgets/support_ticket_history.dart';

enum SupportCategory { order, warranty, product, payment, other }

enum SupportPriority { normal, high, urgent }

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final _ticketCardKey = GlobalKey();
  late final SupportService _supportService;

  SupportCategory _category = SupportCategory.order;
  SupportPriority _priority = SupportPriority.normal;
  String? _lastTicketId;
  DateTime? _lastSubmittedAt;
  SupportCategory? _lastCategory;
  SupportPriority? _lastPriority;
  final List<DealerSupportTicketRecord> _ticketHistory = [];
  int _ticketPage = 0;
  bool _isHistoryLoading = false;
  bool _isLoadingMoreTickets = false;
  bool _hasMoreTickets = true;
  bool _isSubmitting = false;

  static const _hotline = '1900 1234';
  static const _supportEmail = 'support@4thitek.vn';
  static const _subjectMax = 80;
  static const _messageMax = 500;

  @override
  void initState() {
    super.initState();
    _supportService = SupportService();
    _loadLatestTicket();
    _loadTicketHistory();
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    _supportService.close();
    super.dispose();
  }

  Future<void> _loadLatestTicket() async {
    try {
      final ticket = await _supportService.fetchLatestTicket();
      if (!mounted || ticket == null) {
        return;
      }
      _applyTicket(ticket);
    } on SupportException {
      // Keep the support form usable even if the latest-ticket read fails.
    }
  }

  void _applyTicket(DealerSupportTicketRecord ticket) {
    setState(() {
      _lastTicketId = ticket.ticketCode;
      _lastSubmittedAt = ticket.createdAt;
      _lastCategory = _parseCategory(ticket.category);
      _lastPriority = _parsePriority(ticket.priority);
    });
  }

  Future<void> _loadTicketHistory({bool loadMore = false}) async {
    if (loadMore) {
      if (_isLoadingMoreTickets || !_hasMoreTickets) {
        return;
      }
      setState(() => _isLoadingMoreTickets = true);
    } else {
      setState(() => _isHistoryLoading = true);
    }

    try {
      final pageToLoad = loadMore ? _ticketPage + 1 : 0;
      final response = await _supportService.fetchTicketsPage(
        page: pageToLoad,
        size: 6,
      );
      if (!mounted) {
        return;
      }
      setState(() {
        if (!loadMore) {
          _ticketHistory
            ..clear()
            ..addAll(response.items);
        } else {
          _ticketHistory.addAll(response.items);
        }
        _ticketPage = response.page;
        _hasMoreTickets = response.page + 1 < response.totalPages;
      });
    } on SupportException {
      // Keep the main support flow usable even if history loading fails.
    } finally {
      if (mounted) {
        setState(() {
          _isHistoryLoading = false;
          _isLoadingMoreTickets = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final appSettings = AppSettingsScope.of(context);
    final isEnglish = appSettings.locale.languageCode == 'en';
    final isTablet = AppBreakpoints.isTablet(context);
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;
    final faqItems = _faqItems(isEnglish);

    return Scaffold(
      appBar: AppBar(title: BrandAppBarTitle(isEnglish ? 'Support' : 'Hỗ trợ')),
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: contentMaxWidth),
          child: ListView(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            children: [
              FadeSlideIn(
                child: SectionCard(
                  title: isEnglish ? 'Quick contact' : 'Liên hệ nhanh',
                  child: Column(
                    children: [
                      _ContactTile(
                        icon: Icons.phone_outlined,
                        label: isEnglish ? 'Hotline' : 'Hotline',
                        value: _hotline,
                        copyTooltip: isEnglish ? 'Copy' : 'Sao chép',
                        onCopy: () => _copyToClipboard(
                          _hotline,
                          message: isEnglish
                              ? 'Hotline number copied.'
                              : 'Đã sao chép số hotline.',
                        ),
                      ),
                      const Divider(height: 0),
                      _ContactTile(
                        icon: Icons.mail_outline,
                        label: 'Email',
                        value: _supportEmail,
                        copyTooltip: isEnglish ? 'Copy' : 'Sao chép',
                        onCopy: () => _copyToClipboard(
                          _supportEmail,
                          message: isEnglish
                              ? 'Support email copied.'
                              : 'Đã sao chép email hỗ trợ.',
                        ),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () =>
                                _launchHotline(_hotline, isEnglish),
                            icon: const Icon(Icons.phone_in_talk_outlined),
                            label: Text(
                              isEnglish ? 'Call hotline' : 'Gọi hotline',
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed: () =>
                                _launchSupportEmail(_supportEmail, isEnglish),
                            icon: const Icon(Icons.alternate_email_outlined),
                            label: Text(isEnglish ? 'Send email' : 'Gửi email'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          isEnglish
                              ? 'Support hours: 8:00-18:00 (Mon-Sat)'
                              : 'Thời gian hỗ trợ: 8:00-18:00 (T2-T7)',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 60),
                child: SectionCard(
                  title: isEnglish
                      ? 'Frequently asked questions'
                      : 'Câu hỏi thường gặp',
                  child: Column(
                    children: [
                      for (var i = 0; i < faqItems.length; i++)
                        _FaqTile(
                          item: faqItems[i],
                          showDivider: i != faqItems.length - 1,
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              if (_lastTicketId != null && _lastSubmittedAt != null)
                FadeSlideIn(
                  key: _ticketCardKey,
                  delay: const Duration(milliseconds: 90),
                  child: _StatusCard(
                    ticketId: _lastTicketId!,
                    submittedAt: _lastSubmittedAt!,
                    category: _categoryLabel(
                      _lastCategory ?? _category,
                      isEnglish: isEnglish,
                    ),
                    priority: _priorityLabel(
                      _lastPriority ?? _priority,
                      isEnglish: isEnglish,
                    ),
                    sla: _slaText(
                      _lastPriority ?? _priority,
                      isEnglish: isEnglish,
                    ),
                    isEnglish: isEnglish,
                    onClear: () {
                      setState(() {
                        _lastTicketId = null;
                        _lastSubmittedAt = null;
                        _lastCategory = null;
                        _lastPriority = null;
                      });
                    },
                  ),
                ),
              if (_lastTicketId != null && _lastSubmittedAt != null)
                const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 120),
                child: SectionCard(
                  title: isEnglish ? 'Recent requests' : 'Yeu cau gan day',
                  child: SupportTicketHistory(
                    isEnglish: isEnglish,
                    items: _ticketHistory,
                    isLoading: _isHistoryLoading,
                    isLoadingMore: _isLoadingMoreTickets,
                    hasMore: _hasMoreTickets,
                    onLoadMore: () => _loadTicketHistory(loadMore: true),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FadeSlideIn(
                delay: const Duration(milliseconds: 140),
                child: SectionCard(
                  title: isEnglish
                      ? 'Submit support request'
                      : 'Gửi yêu cầu hỗ trợ',
                  child: Column(
                    children: [
                      DropdownButtonFormField<SupportCategory>(
                        initialValue: _category,
                        decoration: InputDecoration(
                          labelText: isEnglish
                              ? 'Request category'
                              : 'Loại yêu cầu',
                          prefixIcon: const Icon(Icons.category_outlined),
                        ),
                        items: SupportCategory.values
                            .map(
                              (item) => DropdownMenuItem(
                                value: item,
                                child: Text(
                                  _categoryLabel(item, isEnglish: isEnglish),
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          if (value == null) {
                            return;
                          }
                          setState(() => _category = value);
                        },
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<SupportPriority>(
                        initialValue: _priority,
                        decoration: InputDecoration(
                          labelText: isEnglish ? 'Priority' : 'Mức độ ưu tiên',
                          prefixIcon: const Icon(Icons.flag_outlined),
                        ),
                        items: SupportPriority.values
                            .map(
                              (item) => DropdownMenuItem(
                                value: item,
                                child: Text(
                                  _priorityLabel(item, isEnglish: isEnglish),
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          if (value == null) {
                            return;
                          }
                          setState(() => _priority = value);
                        },
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _subjectController,
                        textInputAction: TextInputAction.next,
                        textCapitalization: TextCapitalization.sentences,
                        maxLength: _subjectMax,
                        buildCounter: _buildCounter,
                        decoration: InputDecoration(
                          labelText: isEnglish ? 'Subject' : 'Tiêu đề',
                          prefixIcon: const Icon(Icons.subject_outlined),
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _messageController,
                        keyboardType: TextInputType.multiline,
                        textInputAction: TextInputAction.newline,
                        textCapitalization: TextCapitalization.sentences,
                        minLines: 4,
                        maxLines: 8,
                        maxLength: _messageMax,
                        buildCounter: _buildCounter,
                        decoration: InputDecoration(
                          labelText: isEnglish ? 'Description' : 'Nội dung',
                          hintText: isEnglish
                              ? 'Describe your issue, event time, and order/serial code if available.'
                              : 'Mô tả vấn đề, thời điểm xảy ra, mã đơn/serial nếu có.',
                          helperText: isEnglish
                              ? 'The more details you share, the faster support can help.'
                              : 'Thông tin càng chi tiết, đội hỗ trợ xử lý càng nhanh.',
                          alignLabelWithHint: true,
                          prefixIcon: const Icon(Icons.chat_bubble_outline),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          isEnglish
                              ? 'Expected response time: ${_slaText(_priority, isEnglish: true)}'
                              : 'Thời gian phản hồi dự kiến: ${_slaText(_priority, isEnglish: false)}',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                              ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isSubmitting
                              ? null
                              : () => _handleSubmit(isEnglish),
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                  ),
                                )
                              : Text(
                                  isEnglish ? 'Submit request' : 'Gửi yêu cầu',
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _scrollToTicketCard() async {
    if (!mounted) {
      return;
    }
    final targetContext = _ticketCardKey.currentContext;
    if (targetContext != null) {
      await Scrollable.ensureVisible(
        targetContext,
        duration: const Duration(milliseconds: 360),
        curve: Curves.easeOut,
      );
      return;
    }
    if (_scrollController.hasClients) {
      await _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 360),
        curve: Curves.easeOut,
      );
    }
  }

  void _copyToClipboard(String value, {String? message}) {
    Clipboard.setData(ClipboardData(text: value));
    _showSnackBar(message ?? 'Đã sao chép $value');
  }

  Future<void> _launchHotline(String phone, bool isEnglish) async {
    final normalizedPhone = phone.replaceAll(RegExp(r'\s+'), '');
    final uri = Uri(scheme: 'tel', path: normalizedPhone);
    if (await launchUrl(uri)) {
      return;
    }
    _copyToClipboard(
      phone,
      message: isEnglish
          ? 'Cannot open dialer. Number has been copied.'
          : 'Không mở được cuộc gọi. Đã sao chép số.',
    );
  }

  Future<void> _launchSupportEmail(String email, bool isEnglish) async {
    final uri = Uri(scheme: 'mailto', path: email);
    if (await launchUrl(uri)) {
      return;
    }
    _copyToClipboard(
      email,
      message: isEnglish
          ? 'Cannot open email app. Address has been copied.'
          : 'Không mở được ứng dụng email. Đã sao chép địa chỉ.',
    );
  }

  Future<bool?> _confirmSubmit(bool isEnglish) {
    final subject = _subjectController.text.trim();
    final category = _categoryLabel(_category, isEnglish: isEnglish);
    final priority = _priorityLabel(_priority, isEnglish: isEnglish);
    return showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(isEnglish ? 'Confirm request' : 'Xác nhận gửi yêu cầu'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isEnglish
                    ? 'Please review the request details before submitting.'
                    : 'Vui lòng kiểm tra thông tin yêu cầu trước khi gửi.',
              ),
              const SizedBox(height: 10),
              Text('${isEnglish ? 'Subject' : 'Tiêu đề'}: $subject'),
              const SizedBox(height: 4),
              Text('${isEnglish ? 'Category' : 'Loại yêu cầu'}: $category'),
              const SizedBox(height: 4),
              Text('${isEnglish ? 'Priority' : 'Ưu tiên'}: $priority'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(isEnglish ? 'Cancel' : 'Hủy'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(isEnglish ? 'Submit' : 'Gửi yêu cầu'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _handleSubmit(bool isEnglish) async {
    final subject = _subjectController.text.trim();
    final message = _messageController.text.trim();

    if (subject.isEmpty || message.isEmpty) {
      _showSnackBar(
        isEnglish
            ? 'Please enter both subject and description.'
            : 'Vui lòng nhập tiêu đề và nội dung.',
      );
      return;
    }

    final shouldSubmit = await _confirmSubmit(isEnglish);
    if (shouldSubmit != true) {
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final ticket = await _supportService.submitTicket(
        category: _toRemoteCategory(_category),
        priority: _toRemotePriority(_priority),
        subject: subject,
        message: message,
      );
      _applyTicket(ticket);
      _loadTicketHistory();
      _showSnackBar(
        isEnglish
            ? 'Request #${ticket.ticketCode} has been submitted.'
            : 'Yêu cầu #${ticket.ticketCode} đã được gửi.',
      );
      _subjectController.clear();
      _messageController.clear();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToTicketCard();
      });
    } on SupportException catch (error) {
      _showSnackBar(error.message);
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  String _toRemoteCategory(SupportCategory category) {
    switch (category) {
      case SupportCategory.order:
        return 'ORDER';
      case SupportCategory.warranty:
        return 'WARRANTY';
      case SupportCategory.product:
        return 'PRODUCT';
      case SupportCategory.payment:
        return 'PAYMENT';
      case SupportCategory.other:
        return 'OTHER';
    }
  }

  String _toRemotePriority(SupportPriority priority) {
    switch (priority) {
      case SupportPriority.normal:
        return 'NORMAL';
      case SupportPriority.high:
        return 'HIGH';
      case SupportPriority.urgent:
        return 'URGENT';
    }
  }

  SupportCategory _parseCategory(String? raw) {
    switch ((raw ?? '').trim().toUpperCase()) {
      case 'ORDER':
        return SupportCategory.order;
      case 'WARRANTY':
        return SupportCategory.warranty;
      case 'PRODUCT':
        return SupportCategory.product;
      case 'PAYMENT':
        return SupportCategory.payment;
      case 'OTHER':
      default:
        return SupportCategory.other;
    }
  }

  SupportPriority _parsePriority(String? raw) {
    switch ((raw ?? '').trim().toUpperCase()) {
      case 'HIGH':
        return SupportPriority.high;
      case 'URGENT':
        return SupportPriority.urgent;
      case 'NORMAL':
      default:
        return SupportPriority.normal;
    }
  }

  String _categoryLabel(SupportCategory category, {required bool isEnglish}) {
    if (isEnglish) {
      switch (category) {
        case SupportCategory.order:
          return 'Order';
        case SupportCategory.warranty:
          return 'Warranty / Serial';
        case SupportCategory.product:
          return 'Product';
        case SupportCategory.payment:
          return 'Payment';
        case SupportCategory.other:
          return 'Other';
      }
    }
    switch (category) {
      case SupportCategory.order:
        return 'Đơn hàng';
      case SupportCategory.warranty:
        return 'Kho serial';
      case SupportCategory.product:
        return 'Sản phẩm';
      case SupportCategory.payment:
        return 'Thanh toán';
      case SupportCategory.other:
        return 'Khác';
    }
  }

  String _priorityLabel(SupportPriority priority, {required bool isEnglish}) {
    if (isEnglish) {
      switch (priority) {
        case SupportPriority.normal:
          return 'Normal';
        case SupportPriority.high:
          return 'High';
        case SupportPriority.urgent:
          return 'Urgent';
      }
    }
    switch (priority) {
      case SupportPriority.normal:
        return 'Bình thường';
      case SupportPriority.high:
        return 'Cao';
      case SupportPriority.urgent:
        return 'Khẩn cấp';
    }
  }

  String _slaText(SupportPriority priority, {required bool isEnglish}) {
    if (isEnglish) {
      switch (priority) {
        case SupportPriority.normal:
          return '4-8 business hours';
        case SupportPriority.high:
          return '2-4 business hours';
        case SupportPriority.urgent:
          return '30-60 minutes';
      }
    }
    switch (priority) {
      case SupportPriority.normal:
        return '4-8 giờ làm việc';
      case SupportPriority.high:
        return '2-4 giờ làm việc';
      case SupportPriority.urgent:
        return '30-60 phút';
    }
  }

  Widget _buildCounter(
    BuildContext context, {
    required int currentLength,
    required bool isFocused,
    int? maxLength,
  }) {
    if (maxLength == null) {
      return const SizedBox.shrink();
    }
    final color = isFocused
        ? Theme.of(context).colorScheme.primary
        : Theme.of(context).colorScheme.onSurfaceVariant;
    final style = Theme.of(context).textTheme.bodySmall?.copyWith(color: color);

    return Text('$currentLength/$maxLength', style: style);
  }

  List<_FaqItem> _faqItems(bool isEnglish) {
    if (isEnglish) {
      return const [
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
      ];
    }

    return const [
      _FaqItem(
        title: 'Không đăng nhập được',
        body: 'Kiểm tra email, mật khẩu và đảm bảo thiết bị có kết nối mạng.',
        icon: Icons.lock_outline,
      ),
      _FaqItem(
        title: 'Đơn hàng chưa cập nhật',
        body: 'Hệ thống có thể cần 3-5 phút để đồng bộ trạng thái đơn hàng.',
        icon: Icons.receipt_long_outlined,
      ),
      _FaqItem(
        title: 'Xử lý serial',
        body: 'Chuẩn bị serial/IMEI và số điện thoại để xử lý nhanh hơn.',
        icon: Icons.verified_outlined,
      ),
      _FaqItem(
        title: 'Đối soát thanh toán chậm',
        body: 'Đối soát chuyển khoản có thể chậm hơn vào khung giờ cao điểm.',
        icon: Icons.account_balance_wallet_outlined,
      ),
      _FaqItem(
        title: 'Lỗi kích hoạt bảo hành',
        body: 'Kiểm tra ngày mua và định dạng serial trước khi gửi yêu cầu.',
        icon: Icons.shield_outlined,
      ),
    ];
  }

  void _showSnackBar(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _ContactTile extends StatelessWidget {
  const _ContactTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.onCopy,
    required this.copyTooltip,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onCopy;
  final String copyTooltip;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon),
      title: Text(label),
      subtitle: Text(value),
      trailing: IconButton(
        icon: const Icon(Icons.copy_rounded),
        onPressed: onCopy,
        tooltip: copyTooltip,
      ),
      onTap: onCopy,
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.ticketId,
    required this.submittedAt,
    required this.category,
    required this.priority,
    required this.sla,
    required this.onClear,
    required this.isEnglish,
  });

  final String ticketId;
  final DateTime submittedAt;
  final String category;
  final String priority;
  final String sla;
  final VoidCallback onClear;
  final bool isEnglish;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      color: colors.primaryContainer.withValues(alpha: 0.24),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: colors.primary.withValues(alpha: 0.45)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    isEnglish ? 'Request submitted' : 'Yêu cầu đã gửi',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: onClear,
                  icon: const Icon(Icons.close),
                  tooltip: isEnglish ? 'Hide' : 'Ẩn',
                ),
              ],
            ),
            const SizedBox(height: 8),
            _InfoRow(
              label: isEnglish ? 'Ticket ID' : 'Mã yêu cầu',
              value: ticketId,
            ),
            const SizedBox(height: 6),
            _InfoRow(
              label: isEnglish ? 'Submitted at' : 'Thời gian gửi',
              value: _formatDateTime(submittedAt),
            ),
            const SizedBox(height: 6),
            _InfoRow(
              label: isEnglish ? 'Category' : 'Loại yêu cầu',
              value: category,
            ),
            const SizedBox(height: 6),
            _InfoRow(
              label: isEnglish ? 'Priority' : 'Ưu tiên',
              value: priority,
            ),
            const SizedBox(height: 6),
            _InfoRow(
              label: isEnglish ? 'Response SLA' : 'SLA phản hồi',
              value: sla,
            ),
          ],
        ),
      ),
    );
  }

  static String _formatDateTime(DateTime value) {
    final day = value.day.toString().padLeft(2, '0');
    final month = value.month.toString().padLeft(2, '0');
    final hour = value.hour.toString().padLeft(2, '0');
    final minute = value.minute.toString().padLeft(2, '0');
    return '$day/$month/${value.year} $hour:$minute';
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final labelStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
      color: Theme.of(context).colorScheme.onSurfaceVariant,
    );
    final valueStyle = Theme.of(context).textTheme.bodyMedium;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: labelStyle)),
        const SizedBox(width: 12),
        Flexible(
          child: Text(value, textAlign: TextAlign.right, style: valueStyle),
        ),
      ],
    );
  }
}

class _FaqItem {
  const _FaqItem({required this.title, required this.body, required this.icon});

  final String title;
  final String body;
  final IconData icon;
}

class _FaqTile extends StatelessWidget {
  const _FaqTile({required this.item, required this.showDivider});

  final _FaqItem item;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Icon(item.icon),
          title: Text(item.title),
          subtitle: Text(item.body),
        ),
        if (showDivider) const Divider(height: 0),
      ],
    );
  }
}
