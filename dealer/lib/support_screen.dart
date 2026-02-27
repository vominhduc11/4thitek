import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';

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
  SupportCategory _category = SupportCategory.order;
  SupportPriority _priority = SupportPriority.normal;
  String? _lastTicketId;
  DateTime? _lastSubmittedAt;
  SupportCategory? _lastCategory;
  SupportPriority? _lastPriority;

  static const _hotline = '1900 1234';
  static const _supportEmail = 'support@4thitek.vn';
  static const _subjectMax = 80;
  static const _messageMax = 500;

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const BrandAppBarTitle('Ho tro')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          FadeSlideIn(
            child: _SectionCard(
              title: 'Liên hệ nhanh',
              child: Column(
                children: [
                  _ContactTile(
                    icon: Icons.phone_outlined,
                    label: 'Hotline',
                    value: _hotline,
                    onCopy: () => _copyToClipboard(
                      _hotline,
                      message: 'Đã sao chép số hotline.',
                    ),
                  ),
                  const Divider(height: 0),
                  _ContactTile(
                    icon: Icons.mail_outline,
                    label: 'Email',
                    value: _supportEmail,
                    onCopy: () => _copyToClipboard(
                      _supportEmail,
                      message: 'Đã sao chép email hỗ trợ.',
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    runSpacing: 8,
                    children: [
                      OutlinedButton.icon(
                        onPressed: () => _copyToClipboard(
                          _hotline,
                          message: 'Đã sao chép số hotline.',
                        ),
                        icon: const Icon(Icons.phone_in_talk_outlined),
                        label: const Text('Gọi hotline'),
                      ),
                      OutlinedButton.icon(
                        onPressed: () => _copyToClipboard(
                          _supportEmail,
                          message: 'Đã sao chép email hỗ trợ.',
                        ),
                        icon: const Icon(Icons.alternate_email_outlined),
                        label: const Text('Gửi email'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Thời gian hỗ trợ: 8:00–18:00 (T2–T7)',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          FadeSlideIn(
            delay: const Duration(milliseconds: 60),
            child: _SectionCard(
              title: 'Hỗ trợ nhanh',
              child: Column(
                children: _faqItems
                    .map(
                      (item) => _FaqTile(
                        item: item,
                        showDivider: item != _faqItems.last,
                      ),
                    )
                    .toList(),
              ),
            ),
          ),
          const SizedBox(height: 14),
          if (_lastTicketId != null && _lastSubmittedAt != null)
            FadeSlideIn(
              delay: const Duration(milliseconds: 90),
              child: _StatusCard(
                ticketId: _lastTicketId!,
                submittedAt: _lastSubmittedAt!,
                category: _categoryLabel(_lastCategory ?? _category),
                priority: _priorityLabel(_lastPriority ?? _priority),
                sla: _slaText(_lastPriority ?? _priority),
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
            delay: const Duration(milliseconds: 140),
            child: _SectionCard(
              title: 'Gửi yêu cầu hỗ trợ',
              child: Column(
                children: [
                  DropdownButtonFormField<SupportCategory>(
                    initialValue: _category,
                    decoration: const InputDecoration(
                      labelText: 'Loại yêu cầu',
                      prefixIcon: Icon(Icons.category_outlined),
                    ),
                    items: SupportCategory.values
                        .map(
                          (item) => DropdownMenuItem(
                            value: item,
                            child: Text(_categoryLabel(item)),
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
                    decoration: const InputDecoration(
                      labelText: 'Mức độ ưu tiên',
                      prefixIcon: Icon(Icons.flag_outlined),
                    ),
                    items: SupportPriority.values
                        .map(
                          (item) => DropdownMenuItem(
                            value: item,
                            child: Text(_priorityLabel(item)),
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
                    decoration: const InputDecoration(
                      labelText: 'Tiêu đề',
                      prefixIcon: Icon(Icons.subject_outlined),
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
                    decoration: const InputDecoration(
                      labelText: 'Nội dung',
                      hintText:
                          'Mô tả vấn đề, thời điểm xảy ra, mã đơn/serial nếu có.',
                      helperText:
                          'Thông tin càng chi tiết, đội hỗ trợ xử lý càng nhanh.',
                      alignLabelWithHint: true,
                      prefixIcon: Icon(Icons.chat_bubble_outline),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Thời gian phản hồi dự kiến: ${_slaText(_priority)}',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: Colors.black54),
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _handleSubmit,
                      child: const Text('Gửi yêu cầu'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _copyToClipboard(String value, {String? message}) {
    Clipboard.setData(ClipboardData(text: value));
    _showSnackBar(message ?? 'Đã sao chép $value');
  }

  void _handleSubmit() {
    final subject = _subjectController.text.trim();
    final message = _messageController.text.trim();

    if (subject.isEmpty || message.isEmpty) {
      _showSnackBar('Vui lòng nhập tiêu đề và nội dung.');
      return;
    }

    final ticketId = _generateTicketId();
    setState(() {
      _lastTicketId = ticketId;
      _lastSubmittedAt = DateTime.now();
      _lastCategory = _category;
      _lastPriority = _priority;
    });

    _showSnackBar('Yêu cầu #$ticketId đã được gửi (demo).');
    _subjectController.clear();
    _messageController.clear();
  }

  String _generateTicketId() {
    final now = DateTime.now().millisecondsSinceEpoch.toString();
    final suffix = now.substring(now.length - 6);
    return 'SPT-$suffix';
  }

  String _categoryLabel(SupportCategory category) {
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

  String _priorityLabel(SupportPriority priority) {
    switch (priority) {
      case SupportPriority.normal:
        return 'Bình thường';
      case SupportPriority.high:
        return 'Cao';
      case SupportPriority.urgent:
        return 'Khẩn cấp';
    }
  }

  String _slaText(SupportPriority priority) {
    switch (priority) {
      case SupportPriority.normal:
        return '4–8 giờ làm việc';
      case SupportPriority.high:
        return '2–4 giờ làm việc';
      case SupportPriority.urgent:
        return '30–60 phút';
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
        : Colors.black54;
    final style = Theme.of(context).textTheme.bodySmall?.copyWith(color: color);

    return Text('$currentLength/$maxLength', style: style);
  }

  void _showSnackBar(String message) {
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
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onCopy;

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
        tooltip: 'Sao chép',
      ),
      onTap: onCopy,
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
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
  });

  final String ticketId;
  final DateTime submittedAt;
  final String category;
  final String priority;
  final String sla;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: Color(0xFFE5EAF5)),
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
                    'Yêu cầu đã gửi',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: onClear,
                  icon: const Icon(Icons.close),
                  tooltip: 'Ẩn',
                ),
              ],
            ),
            const SizedBox(height: 8),
            _InfoRow(label: 'Mã yêu cầu', value: ticketId),
            const SizedBox(height: 6),
            _InfoRow(
              label: 'Thời gian gửi',
              value: _formatDateTime(submittedAt),
            ),
            const SizedBox(height: 6),
            _InfoRow(label: 'Loại yêu cầu', value: category),
            const SizedBox(height: 6),
            _InfoRow(label: 'Ưu tiên', value: priority),
            const SizedBox(height: 6),
            _InfoRow(label: 'SLA phản hồi', value: sla),
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
    final labelStyle = Theme.of(
      context,
    ).textTheme.bodySmall?.copyWith(color: Colors.black54);
    final valueStyle = Theme.of(context).textTheme.bodyMedium;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: labelStyle),
        Text(value, style: valueStyle),
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

const List<_FaqItem> _faqItems = [
  _FaqItem(
    title: 'Không đăng nhập được',
    body: 'Kiểm tra email, mật khẩu và đảm bảo thiết bị có kết nối mạng.',
    icon: Icons.lock_outline,
  ),
  _FaqItem(
    title: 'Đơn hàng chưa cập nhật',
    body: 'Hệ thống có thể cần 3–5 phút để đồng bộ trạng thái đơn hàng.',
    icon: Icons.receipt_long_outlined,
  ),
  _FaqItem(
    title: 'Xu ly serial',
    body: 'Chuan bi serial/IMEI va so dien thoai de xu ly nhanh hon.',
    icon: Icons.verified_outlined,
  ),
];

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
