import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client_helpers.dart';
import 'api_config.dart';
import 'auth_storage.dart';
import 'dealer_auth_client.dart';
import 'models.dart' show kVatPercent;
import 'utils.dart';

enum DealerProfileStorageMessageCode {
  loadFailed,
  saveFailed,
  invalidPayload,
  unauthenticated,
  temporaryAvatarUnsupported,
}

const String _dealerProfileMessageTokenPrefix = 'dealer.profile.message.';

String dealerProfileStorageMessageToken(DealerProfileStorageMessageCode code) =>
    '$_dealerProfileMessageTokenPrefix${code.name}';

String resolveDealerProfileStorageMessage(
  String? message, {
  required bool isEnglish,
}) {
  final normalized = message?.trim();
  if (normalized == null || normalized.isEmpty) {
    return isEnglish
        ? 'Unable to load dealer profile.'
        : 'Không thể tải hồ sơ đại lý.';
  }

  switch (normalized) {
    case 'dealer.profile.message.loadFailed':
      return isEnglish
          ? 'Unable to load dealer profile.'
          : 'Không thể tải hồ sơ đại lý.';
    case 'dealer.profile.message.saveFailed':
      return isEnglish
          ? 'Unable to save dealer profile.'
          : 'Không thể lưu hồ sơ đại lý.';
    case 'dealer.profile.message.invalidPayload':
      return isEnglish
          ? 'Dealer profile data is invalid.'
          : 'Dữ liệu hồ sơ đại lý không hợp lệ.';
    case 'dealer.profile.message.unauthenticated':
      return isEnglish
          ? 'You need to sign in before updating your profile.'
          : 'Bạn cần đăng nhập trước khi cập nhật hồ sơ.';
    case 'dealer.profile.message.temporaryAvatarUnsupported':
      return isEnglish
          ? 'Temporary avatar data is not supported. Please upload the image again.'
          : 'Avatar tạm thời không được hỗ trợ. Vui lòng tải ảnh lên lại.';
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
const String _profileVatPercentKey = 'dealer_profile_vat_percent';

const Duration _profileRequestTimeout = Duration(seconds: 30);

final AuthStorage _authStorage = AuthStorage();
final http.Client _authClient = DealerAuthClient(authStorage: _authStorage);

void closeDealerProfileStorageClient() {
  _authClient.close();
}

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
    this.vatPercent = kVatPercent,
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
  final int vatPercent;
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
    int? vatPercent,
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
      vatPercent: vatPercent ?? this.vatPercent,
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
    vatPercent: kVatPercent,
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
    return (await _loadLocalDealerProfile()) ?? DealerProfile.defaults;
  }

  try {
    final response = await _authClient
        .get(
          DealerApiConfig.resolveApiUri('/dealer/profile'),
          headers: buildAuthorizedHeaders(token),
        )
        .timeout(
          _profileRequestTimeout,
          onTimeout: () =>
              throw TimeoutException('loadDealerProfile timed out'),
        );
    final payload = decodeJsonBody(response.body);
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
    final cached = await _loadLocalDealerProfile();
    if (cached != null) return cached;
    rethrow;
  } catch (error) {
    final cached = await _loadLocalDealerProfile();
    if (cached != null) return cached;
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
    vatPercent: profile.vatPercent,
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

  final response = await _authClient
      .put(
        DealerApiConfig.resolveApiUri('/dealer/profile'),
        headers: buildAuthorizedJsonHeaders(token),
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
      )
      .timeout(
        _profileRequestTimeout,
        onTimeout: () => throw TimeoutException('saveDealerProfile timed out'),
      );
  final payload = decodeJsonBody(response.body);
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
    prefs.remove(_profileVatPercentKey),
  ]);
}

Future<DealerProfile?> loadCachedDealerProfile() => _loadLocalDealerProfile();

Future<DealerProfile?> _loadLocalDealerProfile() async {
  final prefs = await SharedPreferences.getInstance();
  final businessName = prefs.getString(_profileBusinessNameKey);
  if (businessName == null) return null;
  return DealerProfile(
    businessName: businessName,
    contactName: prefs.getString(_profileContactNameKey) ?? '',
    email: prefs.getString(_profileEmailKey) ?? '',
    phone: prefs.getString(_profilePhoneKey) ?? '',
    addressLine: prefs.getString(_profileAddressLineKey) ?? '',
    ward: prefs.getString(_profileWardKey) ?? '',
    district: prefs.getString(_profileDistrictKey) ?? '',
    city: prefs.getString(_profileCityKey) ?? '',
    country: prefs.getString(_profileCountryKey) ?? 'Việt Nam',
    salesPolicy: prefs.getString(_profilePolicyKey) ?? '',
    vatPercent: prefs.getInt(_profileVatPercentKey) ?? kVatPercent,
    avatarUrl: prefs.getString(_profileAvatarUrlKey),
  );
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
    prefs.setInt(_profileVatPercentKey, profile.vatPercent),
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
  final avatarUrl = _resolveAvatarUrl(normalizeString(json['avatarUrl']));

  return DealerProfile(
    businessName:
        normalizeString(json['businessName']) ?? fallback.businessName,
    contactName: normalizeString(json['contactName']) ?? fallback.contactName,
    email: normalizeString(json['email']) ?? fallback.email,
    phone: normalizeString(json['phone']) ?? fallback.phone,
    addressLine: normalizeString(json['addressLine']) ?? fallback.addressLine,
    ward: normalizeString(json['ward']) ?? fallback.ward,
    district: normalizeString(json['district']) ?? fallback.district,
    city: normalizeString(json['city']) ?? fallback.city,
    country: normalizeString(json['country']) ?? fallback.country,
    salesPolicy: normalizeString(json['salesPolicy']) ?? fallback.salesPolicy,
    vatPercent: _normalizeVatPercent(json['vatPercent'], fallback.vatPercent),
    avatarUrl: hasAvatarField ? avatarUrl : fallback.avatarUrl,
  );
}

String? _resolveAvatarUrl(String? value) {
  final normalized = normalizeString(value);
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

int _normalizeVatPercent(Object? value, int fallback) {
  final parsed = parseOptionalInt(value);
  if (parsed == null) {
    return fallback;
  }
  if (parsed < 0) {
    return 0;
  }
  if (parsed > 100) {
    return 100;
  }
  return parsed;
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
