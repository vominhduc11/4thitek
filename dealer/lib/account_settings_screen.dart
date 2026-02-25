import 'package:flutter/material.dart';

import 'dealer_profile_storage.dart';
import 'widgets/fade_slide_in.dart';

class AccountSettingsScreen extends StatefulWidget {
  const AccountSettingsScreen({super.key});

  @override
  State<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends State<AccountSettingsScreen> {
  final _businessNameController = TextEditingController();
  final _dealerCodeController = TextEditingController();
  final _contactNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _shippingAddressController = TextEditingController();
  final _policyController = TextEditingController();

  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final profile = await loadDealerProfile();
    if (!mounted) {
      return;
    }
    _businessNameController.text = profile.businessName;
    _dealerCodeController.text = profile.dealerCode;
    _contactNameController.text = profile.contactName;
    _emailController.text = profile.email;
    _phoneController.text = profile.phone;
    _shippingAddressController.text = profile.shippingAddress;
    _policyController.text = profile.salesPolicy;
    setState(() => _isLoading = false);
  }

  @override
  void dispose() {
    _businessNameController.dispose();
    _dealerCodeController.dispose();
    _contactNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _shippingAddressController.dispose();
    _policyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cai dat tai khoan'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              children: [
                FadeSlideIn(
                  child: _SectionCard(
                    title: 'Thong tin doanh nghiep',
                    child: Column(
                      children: [
                        TextField(
                          controller: _businessNameController,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Ten doanh nghiep / dai ly',
                            prefixIcon: Icon(Icons.storefront_outlined),
                          ),
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _dealerCodeController,
                          enabled: false,
                          decoration: const InputDecoration(
                            labelText: 'Ma dai ly',
                            prefixIcon: Icon(Icons.badge_outlined),
                          ),
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _contactNameController,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Nguoi lien he',
                            prefixIcon: Icon(Icons.person_outline),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 80),
                  child: _SectionCard(
                    title: 'Dia chi giao hang va lien he',
                    child: Column(
                      children: [
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Email',
                            prefixIcon: Icon(Icons.mail_outline),
                          ),
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'So dien thoai',
                            prefixIcon: Icon(Icons.phone_outlined),
                          ),
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _shippingAddressController,
                          maxLines: 2,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            labelText: 'Dia chi giao hang',
                            prefixIcon: Icon(Icons.location_on_outlined),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 120),
                  child: _SectionCard(
                    title: 'Chinh sach ban hang',
                    child: TextField(
                      controller: _policyController,
                      minLines: 3,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        labelText: 'Noi dung chinh sach',
                        alignLabelWithHint: true,
                        prefixIcon: Icon(Icons.policy_outlined),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                FadeSlideIn(
                  delay: const Duration(milliseconds: 160),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _handleSave,
                      child: _isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2.5),
                            )
                          : const Text('Luu thay doi'),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Future<void> _handleSave() async {
    final businessName = _businessNameController.text.trim();
    final contactName = _contactNameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final shippingAddress = _shippingAddressController.text.trim();
    final salesPolicy = _policyController.text.trim();

    if (businessName.isEmpty ||
        contactName.isEmpty ||
        email.isEmpty ||
        phone.isEmpty ||
        shippingAddress.isEmpty ||
        salesPolicy.isEmpty) {
      _showSnackBar('Vui long nhap day du thong tin.');
      return;
    }
    if (!_isValidEmail(email)) {
      _showSnackBar('Email khong hop le.');
      return;
    }
    if (!_isValidPhone(phone)) {
      _showSnackBar('So dien thoai khong hop le.');
      return;
    }

    setState(() => _isSaving = true);
    await saveDealerProfile(
      DealerProfile(
        businessName: businessName,
        dealerCode: _dealerCodeController.text.trim(),
        contactName: contactName,
        email: email,
        phone: phone,
        shippingAddress: shippingAddress,
        salesPolicy: salesPolicy,
      ),
    );

    if (!mounted) {
      return;
    }

    setState(() => _isSaving = false);
    _showSnackBar('Da luu thong tin tai khoan.');
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  bool _isValidPhone(String phone) {
    return RegExp(r'^[0-9+\s-]{8,}$').hasMatch(phone);
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
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
