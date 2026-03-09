import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';

const String _profileBusinessNameKey = 'dealer_profile_business_name';
const String _profileContactNameKey = 'dealer_profile_contact_name';
const String _profileEmailKey = 'dealer_profile_email';
const String _profilePhoneKey = 'dealer_profile_phone';
const String _profileShippingAddressKey = 'dealer_profile_shipping_address';
const String _profilePolicyKey = 'dealer_profile_policy';
const String _profileAvatarUrlKey = 'dealer_profile_avatar_url';

final AuthStorage _authStorage = AuthStorage();
final http.Client _authClient = DealerAuthClient(authStorage: _authStorage);

class DealerProfile {
  const DealerProfile({
    required this.businessName,
    required this.contactName,
    required this.email,
    required this.phone,
    required this.shippingAddress,
    required this.salesPolicy,
    this.avatarUrl,
  });

  final String businessName;
  final String contactName;
  final String email;
  final String phone;
  final String shippingAddress;
  final String salesPolicy;
  final String? avatarUrl;

  DealerProfile copyWith({
    String? businessName,
    String? contactName,
    String? email,
    String? phone,
    String? shippingAddress,
    String? salesPolicy,
    String? avatarUrl,
  }) {
    return DealerProfile(
      businessName: businessName ?? this.businessName,
      contactName: contactName ?? this.contactName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      shippingAddress: shippingAddress ?? this.shippingAddress,
      salesPolicy: salesPolicy ?? this.salesPolicy,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }

  static const DealerProfile defaults = DealerProfile(
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    shippingAddress: '',
    salesPolicy: '',
    avatarUrl: null,
  );
}

class DealerProfileStorageException implements Exception {
  const DealerProfileStorageException(this.message);

  final String message;

  @override
  String toString() => message;
}

Future<DealerProfile> loadDealerProfile() async {
  final token = await _readAccessToken();
  if (token == null) {
    return DealerProfile.defaults;
  }

  try {
    final response = await _authClient.get(
      Uri.parse(DealerApiConfig.resolveUrl('/api/dealer/profile')),
      headers: _authorizedHeaders(token),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw DealerProfileStorageException(
        _extractErrorMessage(payload, fallback: 'Không thể tải hồ sơ đại lý.'),
      );
    }

    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw const DealerProfileStorageException('Dữ liệu hồ sơ không hợp lệ.');
    }

    final remoteProfile = _mapRemoteProfile(
      data,
      fallback: DealerProfile.defaults,
    );
    await _saveLocalDealerProfile(remoteProfile);
    return remoteProfile;
  } on DealerProfileStorageException {
    rethrow;
  } catch (error) {
    throw DealerProfileStorageException(error.toString());
  }
}

Future<void> saveDealerProfile(DealerProfile profile) async {
  final normalizedProfile = profile.copyWith(
    businessName: profile.businessName.trim(),
    contactName: profile.contactName.trim(),
    email: profile.email.trim(),
    phone: profile.phone.trim(),
    shippingAddress: profile.shippingAddress.trim(),
    salesPolicy: profile.salesPolicy.trim(),
    avatarUrl: profile.avatarUrl?.trim().isEmpty ?? true
        ? null
        : profile.avatarUrl!.trim(),
  );

  final token = await _readAccessToken();
  if (token == null) {
    throw const DealerProfileStorageException(
      'Không thể lưu hồ sơ khi chưa đăng nhập.',
    );
  }

  final avatarUrl = normalizedProfile.avatarUrl ?? '';
  if (avatarUrl.startsWith('data:')) {
    throw const DealerProfileStorageException(
      'Không thể lưu avatar tạm khi đang dùng backend. Vui lòng tải ảnh lên lại.',
    );
  }

  final response = await _authClient.put(
    Uri.parse(DealerApiConfig.resolveUrl('/api/dealer/profile')),
    headers: _authorizedJsonHeaders(token),
    body: jsonEncode(<String, dynamic>{
      'businessName': normalizedProfile.businessName,
      'contactName': normalizedProfile.contactName,
      'email': normalizedProfile.email,
      'phone': normalizedProfile.phone,
      'addressLine': normalizedProfile.shippingAddress,
      'avatarUrl': normalizedProfile.avatarUrl ?? '',
      'salesPolicy': normalizedProfile.salesPolicy,
    }),
  );
  final payload = _decodeBody(response.body);
  if (response.statusCode >= 400) {
    throw DealerProfileStorageException(
      _extractErrorMessage(payload, fallback: 'Không thể lưu hồ sơ đại lý.'),
    );
  }

  final data = payload['data'];
  if (data is! Map<String, dynamic>) {
    throw const DealerProfileStorageException('Dữ liệu hồ sơ không hợp lệ.');
  }

  final savedProfile = _mapRemoteProfile(data, fallback: normalizedProfile);
  await _saveLocalDealerProfile(savedProfile);
}

Future<void> clearDealerProfileCache() async {
  final prefs = await SharedPreferences.getInstance();
  await Future.wait<bool>([
    prefs.remove(_profileBusinessNameKey),
    prefs.remove(_profileContactNameKey),
    prefs.remove(_profileEmailKey),
    prefs.remove(_profilePhoneKey),
    prefs.remove(_profileShippingAddressKey),
    prefs.remove(_profilePolicyKey),
    prefs.remove(_profileAvatarUrlKey),
  ]);
}

Future<void> _saveLocalDealerProfile(DealerProfile profile) async {
  final prefs = await SharedPreferences.getInstance();
  await Future.wait<bool>([
    prefs.setString(_profileBusinessNameKey, profile.businessName),
    prefs.setString(_profileContactNameKey, profile.contactName),
    prefs.setString(_profileEmailKey, profile.email),
    prefs.setString(_profilePhoneKey, profile.phone),
    prefs.setString(_profileShippingAddressKey, profile.shippingAddress),
    prefs.setString(_profilePolicyKey, profile.salesPolicy),
    if ((profile.avatarUrl ?? '').trim().isNotEmpty)
      prefs.setString(_profileAvatarUrlKey, profile.avatarUrl!.trim())
    else
      prefs.remove(_profileAvatarUrlKey),
  ]);
}

DealerProfile _mapRemoteProfile(
  Map<String, dynamic> json, {
  required DealerProfile fallback,
}) {
  final shippingAddress = _joinNonEmpty(<String?>[
    _normalizeString(json['addressLine']),
    _normalizeString(json['ward']),
    _normalizeString(json['district']),
    _normalizeString(json['city']),
    _normalizeString(json['country']),
  ]);
  final hasAvatarField = json.containsKey('avatarUrl');
  final avatarUrl = _resolveAvatarUrl(_normalizeString(json['avatarUrl']));

  return DealerProfile(
    businessName:
        _normalizeString(json['businessName']) ?? fallback.businessName,
    contactName: _normalizeString(json['contactName']) ?? fallback.contactName,
    email: _normalizeString(json['email']) ?? fallback.email,
    phone: _normalizeString(json['phone']) ?? fallback.phone,
    shippingAddress: shippingAddress.isEmpty
        ? fallback.shippingAddress
        : shippingAddress,
    salesPolicy: _normalizeString(json['salesPolicy']) ?? fallback.salesPolicy,
    avatarUrl: hasAvatarField ? avatarUrl : fallback.avatarUrl,
  );
}

String? _resolveAvatarUrl(String? value) {
  final normalized = _normalizeString(value);
  if (normalized == null) {
    return null;
  }
  if (normalized.startsWith('http://') ||
      normalized.startsWith('https://') ||
      normalized.startsWith('data:')) {
    return normalized;
  }
  return DealerApiConfig.resolveUrl(normalized);
}

String _joinNonEmpty(List<String?> parts) {
  return parts
      .whereType<String>()
      .map((part) => part.trim())
      .where((part) => part.isNotEmpty)
      .join(', ');
}

Future<String?> _readAccessToken() async {
  if (!DealerApiConfig.isConfigured) {
    return null;
  }
  final token = await _authStorage.readAccessToken();
  if (token == null || token.trim().isEmpty) {
    return null;
  }
  return token.trim();
}

Map<String, String> _authorizedHeaders(String token) {
  return <String, String>{
    'Accept': 'application/json',
    'Authorization': 'Bearer $token',
  };
}

Map<String, String> _authorizedJsonHeaders(String token) {
  return <String, String>{
    ..._authorizedHeaders(token),
    'Content-Type': 'application/json',
  };
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

String _extractErrorMessage(
  Map<String, dynamic> payload, {
  required String fallback,
}) {
  final error = payload['error']?.toString().trim();
  if (error != null && error.isNotEmpty) {
    return error;
  }
  return fallback;
}

String? _normalizeString(Object? value) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? null : text;
}
