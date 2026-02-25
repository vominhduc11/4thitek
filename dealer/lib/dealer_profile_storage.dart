import 'package:shared_preferences/shared_preferences.dart';

const String _profileBusinessNameKey = 'dealer_profile_business_name';
const String _profileDealerCodeKey = 'dealer_profile_dealer_code';
const String _profileContactNameKey = 'dealer_profile_contact_name';
const String _profileEmailKey = 'dealer_profile_email';
const String _profilePhoneKey = 'dealer_profile_phone';
const String _profileShippingAddressKey = 'dealer_profile_shipping_address';
const String _profilePolicyKey = 'dealer_profile_policy';

class DealerProfile {
  const DealerProfile({
    required this.businessName,
    required this.dealerCode,
    required this.contactName,
    required this.email,
    required this.phone,
    required this.shippingAddress,
    required this.salesPolicy,
  });

  final String businessName;
  final String dealerCode;
  final String contactName;
  final String email;
  final String phone;
  final String shippingAddress;
  final String salesPolicy;

  DealerProfile copyWith({
    String? businessName,
    String? dealerCode,
    String? contactName,
    String? email,
    String? phone,
    String? shippingAddress,
    String? salesPolicy,
  }) {
    return DealerProfile(
      businessName: businessName ?? this.businessName,
      dealerCode: dealerCode ?? this.dealerCode,
      contactName: contactName ?? this.contactName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      shippingAddress: shippingAddress ?? this.shippingAddress,
      salesPolicy: salesPolicy ?? this.salesPolicy,
    );
  }

  static const DealerProfile defaults = DealerProfile(
    businessName: 'Dai ly SCS Ha Noi',
    dealerCode: 'DL-0291',
    contactName: 'Nguyen Van Dai',
    email: 'daily.hn@4thitek.vn',
    phone: '0909 123 456',
    shippingAddress: 'So 12, Tran Duy Hung, Cau Giay, Ha Noi',
    salesPolicy:
        'Gia si chung cho dai ly. Don hang can duyet truoc khi giao. Cong no theo doi tong so tien con no.',
  );
}

Future<DealerProfile> loadDealerProfile() async {
  final prefs = await SharedPreferences.getInstance();
  return DealerProfile(
    businessName:
        prefs.getString(_profileBusinessNameKey) ?? DealerProfile.defaults.businessName,
    dealerCode: prefs.getString(_profileDealerCodeKey) ?? DealerProfile.defaults.dealerCode,
    contactName:
        prefs.getString(_profileContactNameKey) ?? DealerProfile.defaults.contactName,
    email: prefs.getString(_profileEmailKey) ?? DealerProfile.defaults.email,
    phone: prefs.getString(_profilePhoneKey) ?? DealerProfile.defaults.phone,
    shippingAddress: prefs.getString(_profileShippingAddressKey) ??
        DealerProfile.defaults.shippingAddress,
    salesPolicy: prefs.getString(_profilePolicyKey) ?? DealerProfile.defaults.salesPolicy,
  );
}

Future<void> saveDealerProfile(DealerProfile profile) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(_profileBusinessNameKey, profile.businessName);
  await prefs.setString(_profileDealerCodeKey, profile.dealerCode);
  await prefs.setString(_profileContactNameKey, profile.contactName);
  await prefs.setString(_profileEmailKey, profile.email);
  await prefs.setString(_profilePhoneKey, profile.phone);
  await prefs.setString(_profileShippingAddressKey, profile.shippingAddress);
  await prefs.setString(_profilePolicyKey, profile.salesPolicy);
}
