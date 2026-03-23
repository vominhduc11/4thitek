import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'app_settings_controller.dart';
import 'auth_storage.dart';
import 'breakpoints.dart';
import 'dealer_auth_client.dart';
import 'models.dart';
import 'order_controller.dart';
import 'utils.dart';

_BankTransferTexts _bankTransferTexts(BuildContext context) =>
    _BankTransferTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );

class BankTransferInstructions {
  const BankTransferInstructions({
    required this.provider,
    required this.bankName,
    required this.accountNumber,
    required this.accountHolder,
  });

  final String provider;
  final String bankName;
  final String accountNumber;
  final String accountHolder;
}

enum BankTransferErrorCode { unauthenticated, invalidPayload, unavailable }

String bankTransferLoadErrorMessage(
  Object error, {
  required bool isEnglish,
}) {
  if (error is BankTransferException) {
    switch (error.code) {
      case BankTransferErrorCode.unauthenticated:
        return isEnglish
            ? 'You need to sign in to view bank transfer information.'
            : 'Bạn cần đăng nhập để xem thông tin chuyển khoản.';
      case BankTransferErrorCode.invalidPayload:
        return isEnglish
            ? 'The system returned invalid bank transfer information.'
            : 'Hệ thống trả về thông tin chuyển khoản không hợp lệ.';
      case BankTransferErrorCode.unavailable:
        return isEnglish
            ? 'Unable to load bank transfer information.'
            : 'Không thể tải thông tin chuyển khoản.';
      case null:
        final message = error.message.trim();
        if (message.isNotEmpty) {
          return message;
        }
    }
  }

  final message = error.toString().trim();
  if (message.isNotEmpty) {
    return message;
  }
  return isEnglish
      ? 'Unable to load bank transfer information.'
      : 'Không thể tải thông tin chuyển khoản.';
}

class BankTransferService {
  BankTransferService({AuthStorage? authStorage, http.Client? client})
    : _authStorage = authStorage ?? AuthStorage() {
    _client = DealerAuthClient(
      authStorage: _authStorage,
      inner: client ?? http.Client(),
    );
  }

  final AuthStorage _authStorage;
  late final http.Client _client;

  Future<BankTransferInstructions> fetchInstructions() async {
    final accessToken = await _authStorage.readAccessToken();
    if (accessToken == null || accessToken.trim().isEmpty) {
      throw const BankTransferException.unauthenticated();
    }

    final response = await _client.get(
      DealerApiConfig.resolveApiUri('/dealer/payment-instructions'),
      headers: <String, String>{
        HttpHeaders.authorizationHeader: 'Bearer ${accessToken.trim()}',
        HttpHeaders.acceptHeader: 'application/json',
      },
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw _extractError(payload);
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw const BankTransferException.invalidPayload();
    }
    return BankTransferInstructions(
      provider: data['provider']?.toString() ?? 'SePay',
      bankName: data['bankName']?.toString() ?? '',
      accountNumber: data['accountNumber']?.toString() ?? '',
      accountHolder: data['accountHolder']?.toString() ?? '',
    );
  }

  void close() {
    _client.close();
  }

  Map<String, dynamic> _decodeBody(String body) {
    if (body.trim().isEmpty) {
      return const <String, dynamic>{};
    }
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    return const <String, dynamic>{};
  }

  BankTransferException _extractError(Map<String, dynamic> payload) {
    final error = payload['error']?.toString().trim();
    if (error != null && error.isNotEmpty) {
      return BankTransferException(error);
    }
    return const BankTransferException.unavailable();
  }
}

class BankTransferException implements Exception {
  const BankTransferException(
    this.message, {
    this.code,
  });

  const BankTransferException.unauthenticated()
    : this('', code: BankTransferErrorCode.unauthenticated);

  const BankTransferException.invalidPayload()
    : this('', code: BankTransferErrorCode.invalidPayload);

  const BankTransferException.unavailable()
    : this('', code: BankTransferErrorCode.unavailable);

  final String message;
  final BankTransferErrorCode? code;

  @override
  String toString() => message;
}

Future<void> showBankTransferInfoSheet({
  required BuildContext context,
  required BankTransferInstructions instructions,
  required int amount,
  required String content,
  required String orderId,
  required OrderController orderController,
  required Future<void> Function(String label, String value) onCopy,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    isDismissible: true,
    enableDrag: true,
    requestFocus: true,
    builder: (sheetContext) {
      return _BankTransferInfoSheet(
        amount: amount,
        instructions: instructions,
        content: content,
        orderId: orderId,
        orderController: orderController,
        onCopy: onCopy,
      );
    },
  );
}

class _BankTransferInfoSheet extends StatefulWidget {
  const _BankTransferInfoSheet({
    required this.amount,
    required this.instructions,
    required this.content,
    required this.orderId,
    required this.orderController,
    required this.onCopy,
  });

  final int amount;
  final BankTransferInstructions instructions;
  final String content;
  final String orderId;
  final OrderController orderController;
  final Future<void> Function(String label, String value) onCopy;

  @override
  State<_BankTransferInfoSheet> createState() => _BankTransferInfoSheetState();
}

class _BankTransferInfoSheetState extends State<_BankTransferInfoSheet> {
  @override
  void initState() {
    super.initState();
    widget.orderController.addListener(_onOrderChanged);
  }

  @override
  void dispose() {
    widget.orderController.removeListener(_onOrderChanged);
    super.dispose();
  }

  void _onOrderChanged() {
    if (!mounted) return;
    final order = widget.orderController.findById(widget.orderId);
    if (order != null && order.paymentStatus == OrderPaymentStatus.paid) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final texts = _bankTransferTexts(context);
    final isTablet = AppBreakpoints.isTablet(context);
    final maxWidth = isTablet ? 760.0 : double.infinity;
    final colors = Theme.of(context).colorScheme;
    return SafeArea(
      child: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 12,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    texts.sheetTitle,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    texts.sheetDescription,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: colors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: colors.primary.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      texts.webhookHint,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  _BankTransferInfoRow(
                    label: texts.providerLabel,
                    value: widget.instructions.provider,
                    onCopy: () => widget.onCopy(
                      texts.providerLabel,
                      widget.instructions.provider,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: texts.amountLabel,
                    value: formatVnd(widget.amount),
                    onCopy: () => widget.onCopy(
                      texts.amountLabel,
                      widget.amount.toString(),
                    ),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: texts.accountHolderLabel,
                    value: widget.instructions.accountHolder,
                    onCopy: () => widget.onCopy(
                      texts.accountHolderLabel,
                      widget.instructions.accountHolder,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: texts.accountNumberLabel,
                    value: widget.instructions.accountNumber,
                    onCopy: () => widget.onCopy(
                      texts.accountNumberLabel,
                      widget.instructions.accountNumber,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: texts.bankNameLabel,
                    value: widget.instructions.bankName,
                    onCopy: () => widget.onCopy(
                      texts.bankNameLabel,
                      widget.instructions.bankName,
                    ),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: texts.contentLabel,
                    value: widget.content,
                    onCopy: () => widget.onCopy(
                      texts.transferContentCopyLabel,
                      widget.content,
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _BankTransferInfoRow extends StatelessWidget {
  const _BankTransferInfoRow({
    required this.label,
    required this.value,
    required this.onCopy,
  });

  final String label;
  final String value;
  final VoidCallback onCopy;

  @override
  Widget build(BuildContext context) {
    final texts = _bankTransferTexts(context);
    final borderColor = Theme.of(context).colorScheme.outlineVariant;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 2),
                Text(value, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.all(10),
            constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
            onPressed: onCopy,
            icon: const Icon(Icons.copy, size: 18),
            tooltip: texts.copyTooltip,
          ),
        ],
      ),
    );
  }
}

class _BankTransferTexts {
  const _BankTransferTexts({required this.isEnglish});

  final bool isEnglish;

  String get sheetTitle =>
      isEnglish ? 'Bank transfer information' : 'Thông tin chuyển khoản';
  String get sheetDescription => isEnglish
      ? 'Your order has been created. Please transfer the exact amount and use the exact content below so SePay can reconcile it automatically.'
      : 'Đơn hàng đã được tạo. Vui lòng chuyển khoản đúng số tiền và đúng nội dung bên dưới để SePay đối soát tự động.';
  String get webhookHint => isEnglish
      ? 'Once SePay sends a successful webhook, the system will automatically update payment for this order. You do not need to confirm payment manually in the app.'
      : 'Khi SePay gửi webhook thành công, hệ thống sẽ tự động cập nhật thanh toán cho đơn này. Bạn không cần tự xác nhận thanh toán trong app.';
  String get providerLabel => isEnglish ? 'Provider' : 'Nhà cung cấp';
  String get amountLabel => isEnglish ? 'Amount' : 'Số tiền';
  String get accountHolderLabel =>
      isEnglish ? 'Account holder' : 'Chủ tài khoản';
  String get accountNumberLabel =>
      isEnglish ? 'Account number' : 'Số tài khoản';
  String get bankNameLabel => isEnglish ? 'Bank' : 'Ngân hàng';
  String get contentLabel => isEnglish ? 'Content' : 'Nội dung';
  String get transferContentCopyLabel =>
      isEnglish ? 'Transfer content' : 'Nội dung chuyển khoản';
  String get copyTooltip => isEnglish ? 'Copy' : 'Sao chép';
}
