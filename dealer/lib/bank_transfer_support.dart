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
        'Ban can dang nhap de lay thong tin chuyen khoan.',
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
        'Khong nhan duoc thong tin chuyen khoan hop le.',
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
    return 'Khong the tai thong tin chuyen khoan.';
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
                    'Thong tin chuyen khoan',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Don hang da duoc tao. Vui long chuyen khoan dung so tien va dung noi dung ben duoi de SePay doi soat tu dong.',
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
                      'Khi SePay gui webhook thanh cong, he thong se tu dong cap nhat thanh toan cho don nay. Ban khong can tu xac nhan thanh toan trong app.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  _BankTransferInfoRow(
                    label: 'Nha cung cap',
                    value: instructions.provider,
                    onCopy: () => onCopy('Nha cung cap', instructions.provider),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'So tien',
                    value: formatVnd(amount),
                    onCopy: () => onCopy('So tien', amount.toString()),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Chu tai khoan',
                    value: instructions.accountHolder,
                    onCopy: () =>
                        onCopy('Chu tai khoan', instructions.accountHolder),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'So tai khoan',
                    value: instructions.accountNumber,
                    onCopy: () =>
                        onCopy('So tai khoan', instructions.accountNumber),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Ngan hang',
                    value: instructions.bankName,
                    onCopy: () => onCopy('Ngan hang', instructions.bankName),
                  ),
                  const SizedBox(height: 10),
                  _BankTransferInfoRow(
                    label: 'Noi dung',
                    value: content,
                    onCopy: () => onCopy('Noi dung chuyen khoan', content),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Da hieu'),
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
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            onPressed: onCopy,
            icon: const Icon(Icons.copy, size: 18),
            tooltip: 'Sao chep',
          ),
        ],
      ),
    );
  }
}
