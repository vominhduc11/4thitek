import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'api_config.dart';
import 'auth_storage.dart';
import 'breakpoints.dart';
import 'dealer_auth_client.dart';
import 'utils.dart';

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
      throw const BankTransferException(
        'Bạn cần đăng nhập để lấy thông tin chuyển khoản.',
      );
    }

    final response = await _client.get(
      Uri.parse(DealerApiConfig.resolveUrl('/api/dealer/payment-instructions')),
      headers: <String, String>{
        HttpHeaders.authorizationHeader: 'Bearer ${accessToken.trim()}',
        HttpHeaders.acceptHeader: 'application/json',
      },
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw BankTransferException(_extractErrorMessage(payload));
    }
    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw const BankTransferException(
        'Không nhận được thông tin chuyển khoản hợp lệ.',
      );
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

  String _extractErrorMessage(Map<String, dynamic> payload) {
    final error = payload['error']?.toString().trim();
    if (error != null && error.isNotEmpty) {
      return error;
    }
    return 'Không thể tải thông tin chuyển khoản.';
  }
}

class BankTransferException implements Exception {
  const BankTransferException(this.message);

  final String message;

  @override
  String toString() => message;
}

Future<void> showBankTransferInfoSheet({
  required BuildContext context,
  required BankTransferInstructions instructions,
  required int amount,
  required String content,
  required Future<void> Function(String label, String value) onCopy,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    requestFocus: true,
    builder: (sheetContext) {
      return _BankTransferInfoSheet(
        amount: amount,
        instructions: instructions,
        content: content,
        onCopy: onCopy,
      );
    },
  );
}

class _BankTransferInfoSheet extends StatelessWidget {
  const _BankTransferInfoSheet({
    required this.amount,
    required this.instructions,
    required this.content,
    required this.onCopy,
  });

  final int amount;
  final BankTransferInstructions instructions;
  final String content;
  final Future<void> Function(String label, String value) onCopy;

  @override
  Widget build(BuildContext context) {
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
                    'Thông tin chuyển khoản',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Đơn hàng đã được tạo. Vui lòng chuyển khoản đúng số tiền và đúng nội dung bên dưới để SePay đối soát tự động.',
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
                      'Khi SePay gửi webhook thành công, hệ thống sẽ tự động cập nhật thanh toán cho đơn này. Bạn không cần tự xác nhận thanh toán trong app.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  _BankTransferInfoRow(
                    label: 'Nhà cung cấp',
                    value: instructions.provider,
                    onCopy: () => onCopy('Nhà cung cấp', instructions.provider),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Số tiền',
                    value: formatVnd(amount),
                    onCopy: () => onCopy('Số tiền', amount.toString()),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Chủ tài khoản',
                    value: instructions.accountHolder,
                    onCopy: () =>
                        onCopy('Chủ tài khoản', instructions.accountHolder),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Số tài khoản',
                    value: instructions.accountNumber,
                    onCopy: () =>
                        onCopy('Số tài khoản', instructions.accountNumber),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Ngân hàng',
                    value: instructions.bankName,
                    onCopy: () => onCopy('Ngân hàng', instructions.bankName),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Nội dung',
                    value: content,
                    onCopy: () => onCopy('Nội dung chuyển khoản', content),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Đã hiểu'),
                    ),
                  ),
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
            tooltip: 'Sao chep',
          ),
        ],
      ),
    );
  }
}
