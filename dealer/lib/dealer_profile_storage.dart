import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';

enum DealerProfileStorageMessageCode {
  loadFailed,
  saveFailed,
  invalidPayload,
  unauthenticated,
  temporaryAvatarUnsupported,
}

const String _dealerProfileMessageTokenPrefix = 'dealer.profile.message.';

String dealerProfileStorageMessageToken(
  DealerProfileStorageMessageCode code,
) => '$_dealerProfileMessageTokenPrefix${code.name}';

String resolveDealerProfileStorageMessage(
  String? message, {
  required bool isEnglish,
}) {
  final normalized = message?.trim();
  if (normalized == null || normalized.isEmpty) {
    return isEnglish
        ? 'Unable to load dealer profile.'
        : 'Khong the tai ho so dai ly.';
  }

  switch (normalized) {
    case 'dealer.profile.message.loadFailed':
      return isEnglish
          ? 'Unable to load dealer profile.'
          : 'Khong the tai ho so dai ly.';
    case 'dealer.profile.message.saveFailed':
      return isEnglish
          ? 'Unable to save dealer profile.'
          : 'Khong the luu ho so dai ly.';
    case 'dealer.profile.message.invalidPayload':
      return isEnglish
          ? 'Dealer profile data is invalid.'
          : 'Du lieu ho so dai ly khong hop le.';
    case 'dealer.profile.message.unauthenticated':
      return isEnglish
          ? 'You need to sign in before updating your profile.'
          : 'Ban can dang nhap truoc khi cap nhat ho so.';
    case 'dealer.profile.message.temporaryAvatarUnsupported':
      return isEnglish
          ? 'Temporary avatar data is not supported. Please upload the image again.'
          : 'Avatar tam thoi khong duoc ho tro. Vui long tai anh len lai.';
    default:
      return normalized;
  }
}

String dealerProfileStorageErrorMessage(
  Object error, {
  required bool isEnglish,
}) {
  final message = error is DealerProfileStorageException
      ? error.message
      : error.toString().trim();
  return resolveDealerProfileStorageMessage(message, isEnglish: isEnglish);
}

const String _profileBusinessNameKey = 'dealer_profile_business_name';
const String _profileContactNameKey = 'dealer_profile_contact_name';
const String _profileEmailKey = 'dealer_profile_email';
const String _profilePhoneKey = 'dealer_profile_phone';
const String _profileAddressLineKey = 'dealer_profile_address_line';
const String _profileWardKey = 'dealer_profile_ward';
const String _profileDistrictKey = 'dealer_profile_district';
const String _profileCityKey = 'dealer_profile_city';
const String _profileCountryKey = 'dealer_profile_country';
const String _profilePolicyKey = 'dealer_profile_policy';
const String _profileAvatarUrlKey = 'dealer_profile_avatar_url';
const String _profileCreditLimitKey = 'dealer_profile_credit_limit';

final AuthStorage _authStorage = AuthStorage();
final http.Client _authClient = DealerAuthClient(authStorage: _authStorage);

class DealerProfile {
  const DealerProfile({
    required this.businessName,
    required this.contactName,
    required this.email,
    required this.phone,
    required this.addressLine,
    required this.ward,
    required this.district,
    required this.city,
    required this.country,
    required this.salesPolicy,
    this.creditLimit = 0,
    this.avatarUrl,
  });

  final String businessName;
  final String contactName;
  final String email;
  final String phone;
  final String addressLine;
  final String ward;
  final String district;
  final String city;
  final String country;
  final String salesPolicy;
  final int creditLimit;
  final String? avatarUrl;

  /// Full address joined for display (checkout, account screen, etc.)
  String get shippingAddress =>
      _joinNonEmpty([addressLine, ward, district, city, country]);

  DealerProfile copyWith({
    String? businessName,
    String? contactName,
    String? email,
    String? phone,
    String? addressLine,
    String? ward,
    String? district,
    String? city,
    String? country,
    String? salesPolicy,
    int? creditLimit,
    String? avatarUrl,
  }) {
    return DealerProfile(
      businessName: businessName ?? this.businessName,
      contactName: contactName ?? this.contactName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      addressLine: addressLine ?? this.addressLine,
      ward: ward ?? this.ward,
      district: district ?? this.district,
      city: city ?? this.city,
      country: country ?? this.country,
      salesPolicy: salesPolicy ?? this.salesPolicy,
      creditLimit: creditLimit ?? this.creditLimit,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }

  static const DealerProfile defaults = DealerProfile(
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    addressLine: '',
    ward: '',
    district: '',
    city: '',
    country: 'Việt Nam',
    salesPolicy: '',
    creditLimit: 0,
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
      DealerApiConfig.resolveApiUri('/dealer/profile'),
      headers: _authorizedHeaders(token),
    );
    final payload = _decodeBody(response.body);
    if (response.statusCode >= 400) {
      throw DealerProfileStorageException(
        _extractErrorMessage(
          payload,
          fallback: dealerProfileStorageMessageToken(
            DealerProfileStorageMessageCode.loadFailed,
          ),
        ),
      );
    }

    final data = payload['data'];
    if (data is! Map<String, dynamic>) {
      throw DealerProfileStorageException(
        dealerProfileStorageMessageToken(
          DealerProfileStorageMessageCode.invalidPayload,
        ),
      );
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
  final normalizedProfile = DealerProfile(
    businessName: profile.businessName.trim(),
    contactName: profile.contactName.trim(),
    email: profile.email.trim(),
    phone: profile.phone.trim(),
    addressLine: profile.addressLine.trim(),
    ward: profile.ward.trim(),
    district: profile.district.trim(),
    city: profile.city.trim(),
    country: profile.country.trim(),
    salesPolicy: profile.salesPolicy.trim(),
    creditLimit: profile.creditLimit,
    avatarUrl: profile.avatarUrl?.trim().isEmpty ?? true
        ? null
        : profile.avatarUrl!.trim(),
  );

  final token = await _readAccessToken();
  if (token == null) {
    throw DealerProfileStorageException(
      dealerProfileStorageMessageToken(
        DealerProfileStorageMessageCode.unauthenticated,
      ),
    );
  }

  final avatarUrl = normalizedProfile.avatarUrl ?? '';
  if (avatarUrl.startsWith('data:')) {
    throw DealerProfileStorageException(
      dealerProfileStorageMessageToken(
        DealerProfileStorageMessageCode.temporaryAvatarUnsupported,
      ),
    );
  }

  final response = await _authClient.put(
    DealerApiConfig.resolveApiUri('/dealer/profile'),
    headers: _authorizedJsonHeaders(token),
    body: jsonEncode(<String, dynamic>{
      'businessName': normalizedProfile.businessName,
      'contactName': normalizedProfile.contactName,
      'email': normalizedProfile.email,
      'phone': normalizedProfile.phone,
      'addressLine': normalizedProfile.addressLine,
      'ward': normalizedProfile.ward,
      'district': normalizedProfile.district,
      'city': normalizedProfile.city,
      'country': normalizedProfile.country,
      'avatarUrl': normalizedProfile.avatarUrl,
      'salesPolicy': normalizedProfile.salesPolicy,
    }),
  );
  final payload = _decodeBody(response.body);
  if (response.statusCode >= 400) {
    throw DealerProfileStorageException(
      _extractErrorMessage(
        payload,
        fallback: dealerProfileStorageMessageToken(
          DealerProfileStorageMessageCode.saveFailed,
        ),
      ),
    );
  }

  final data = payload['data'];
  if (data is! Map<String, dynamic>) {
    throw DealerProfileStorageException(
      dealerProfileStorageMessageToken(
        DealerProfileStorageMessageCode.invalidPayload,
      ),
    );
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
    prefs.remove(_profileAddressLineKey),
    prefs.remove(_profileWardKey),
    prefs.remove(_profileDistrictKey),
    prefs.remove(_profileCityKey),
    prefs.remove(_profileCountryKey),
    prefs.remove(_profilePolicyKey),
    prefs.remove(_profileAvatarUrlKey),
    prefs.remove(_profileCreditLimitKey),
  ]);
}

Future<void> _saveLocalDealerProfile(DealerProfile profile) async {
  final prefs = await SharedPreferences.getInstance();
  await Future.wait<bool>([
    prefs.setString(_profileBusinessNameKey, profile.businessName),
    prefs.setString(_profileContactNameKey, profile.contactName),
    prefs.setString(_profileEmailKey, profile.email),
    prefs.setString(_profilePhoneKey, profile.phone),
    prefs.setString(_profileAddressLineKey, profile.addressLine),
    prefs.setString(_profileWardKey, profile.ward),
    prefs.setString(_profileDistrictKey, profile.district),
    prefs.setString(_profileCityKey, profile.city),
    prefs.setString(_profileCountryKey, profile.country),
    prefs.setString(_profilePolicyKey, profile.salesPolicy),
    prefs.setInt(_profileCreditLimitKey, profile.creditLimit),
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
  final hasAvatarField = json.containsKey('avatarUrl');
  final avatarUrl = _resolveAvatarUrl(_normalizeString(json['avatarUrl']));

  return DealerProfile(
    businessName:
        _normalizeString(json['businessName']) ?? fallback.businessName,
    contactName: _normalizeString(json['contactName']) ?? fallback.contactName,
    email: _normalizeString(json['email']) ?? fallback.email,
    phone: _normalizeString(json['phone']) ?? fallback.phone,
    addressLine: _normalizeString(json['addressLine']) ?? fallback.addressLine,
    ward: _normalizeString(json['ward']) ?? fallback.ward,
    district: _normalizeString(json['district']) ?? fallback.district,
    city: _normalizeString(json['city']) ?? fallback.city,
    country: _normalizeString(json['country']) ?? fallback.country,
    salesPolicy: _normalizeString(json['salesPolicy']) ?? fallback.salesPolicy,
    creditLimit: _normalizeInt(json['creditLimit']) ?? fallback.creditLimit,
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

String _joinNonEmpty(List<String> parts) {
  return parts
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

int? _normalizeInt(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is num) {
    return value.round();
  }
  final normalized = value.toString().trim();
  if (normalized.isEmpty) {
    return null;
  }
  return num.tryParse(normalized)?.round();
}
