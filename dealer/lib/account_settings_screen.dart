import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dealer_profile_storage.dart';
import 'file_reference.dart';
import 'upload_service.dart';
import 'validation_utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

class AccountSettingsScreen extends StatefulWidget {
  const AccountSettingsScreen({
    super.key,
    this.loadProfile,
    this.saveProfile,
  });

  final Future<DealerProfile> Function()? loadProfile;
  final Future<void> Function(DealerProfile profile)? saveProfile;

  @override
  State<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends State<AccountSettingsScreen> {
  final _businessNameController = TextEditingController();
  final _contactNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressLineController = TextEditingController();
  final _wardController = TextEditingController();
  final _districtController = TextEditingController();
  final _cityController = TextEditingController();
  final _countryController = TextEditingController();
  final _policyController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _uploadService = UploadService();

  bool _isLoading = true;
  bool _isSaving = false;
  bool _isUploadingAvatar = false;
  bool _hasUnsavedChanges = false;
  bool _didLoadInitialData = false;
  bool _didStartInitialLoad = false;
  bool _isEnglish = false;
  String _initialSnapshot = '';
  String? _avatarUrl;

  _AccountSettingsTexts get _texts =>
      _AccountSettingsTexts(isEnglish: _isEnglish);

  List<TextEditingController> get _editableControllers => [
    _businessNameController,
    _contactNameController,
    _emailController,
    _phoneController,
    _addressLineController,
    _wardController,
    _districtController,
    _cityController,
    _countryController,
    _policyController,
  ];

  @override
  void initState() {
    super.initState();
    for (final controller in _editableControllers) {
      controller.addListener(_handleFormChanged);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _isEnglish = AppSettingsScope.of(context).locale.languageCode == 'en';
    if (!_didStartInitialLoad) {
      _didStartInitialLoad = true;
      _loadData();
    }
  }

  Future<void> _loadData() async {
    final texts = _texts;
    DealerProfile profile;
    try {
      profile = await (widget.loadProfile ?? loadDealerProfile)();
    } catch (error) {
      profile = DealerProfile.defaults;
      if (mounted) {
        _showSnackBar(texts.loadProfileFailed(error));
      }
    }
    if (!mounted) {
      return;
    }
    _businessNameController.text = profile.businessName;
    _contactNameController.text = profile.contactName;
    _emailController.text = profile.email;
    _phoneController.text = profile.phone;
    _addressLineController.text = profile.addressLine;
    _wardController.text = profile.ward;
    _districtController.text = profile.district;
    _cityController.text = profile.city;
    _countryController.text = profile.country;
    _policyController.text = profile.salesPolicy;
    _avatarUrl = profile.avatarUrl;
    _initialSnapshot = _formSnapshot();
    _didLoadInitialData = true;
    setState(() {
      _isLoading = false;
      _hasUnsavedChanges = false;
    });
  }

  @override
  void dispose() {
    for (final controller in _editableControllers) {
      controller.removeListener(_handleFormChanged);
    }
    _businessNameController.dispose();
    _contactNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressLineController.dispose();
    _wardController.dispose();
    _districtController.dispose();
    _cityController.dispose();
    _countryController.dispose();
    _policyController.dispose();
    super.dispose();
  }

  void _handleFormChanged() {
    if (!_didLoadInitialData) {
      return;
    }
    final hasChanges = _formSnapshot() != _initialSnapshot;
    if (hasChanges == _hasUnsavedChanges) {
      return;
    }
    setState(() => _hasUnsavedChanges = hasChanges);
  }

  String _formSnapshot() {
    return [
      _businessNameController.text.trim(),
      _contactNameController.text.trim(),
      _emailController.text.trim(),
      _phoneController.text.trim(),
      _addressLineController.text.trim(),
      _wardController.text.trim(),
      _districtController.text.trim(),
      _cityController.text.trim(),
      _countryController.text.trim(),
      _policyController.text.trim(),
      _avatarUrl?.trim() ?? '',
    ].join('||');
  }

  bool _isValidPhone(String phone) {
    return RegExp(r'^[0-9+\s-]{8,}$').hasMatch(phone);
  }

  Future<void> _pickAvatar() async {
    final texts = _texts;
    if (_isSaving || _isUploadingAvatar) {
      return;
    }

    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked == null) {
      return;
    }

    setState(() => _isUploadingAvatar = true);
    try {
      final nextAvatarUrl = await _uploadAvatar(picked);
      if (!mounted) {
        return;
      }
      setState(() {
        _avatarUrl = nextAvatarUrl;
      });
      _showSnackBar(texts.avatarUpdatedMessage);
      _handleFormChanged();
    } catch (error) {
      if (!mounted) {
        return;
      }
      _showSnackBar(texts.avatarUploadFailed(error));
    } finally {
      if (mounted) {
        setState(() => _isUploadingAvatar = false);
      }
    }
  }

  Future<String> _uploadAvatar(XFile picked) async {
    final uploaded = await _uploadService.uploadXFile(
      file: picked,
      category: 'dealer-avatars',
    );
    return uploaded.url;
  }

  void _removeAvatar() {
    final texts = _texts;
    if (_isSaving ||
        _isUploadingAvatar ||
        (_avatarUrl?.trim().isEmpty ?? true)) {
      return;
    }
    setState(() {
      _avatarUrl = null;
    });
    _showSnackBar(texts.avatarRemovedMessage);
    _handleFormChanged();
  }

  Future<bool> _handleWillPop() async {
    if (_isSaving) {
      return false;
    }
    if (!_hasUnsavedChanges) {
      return true;
    }
    final shouldDiscard = await _confirmDiscardChanges();
    return shouldDiscard ?? false;
  }

  Future<bool?> _confirmDiscardChanges() {
    final texts = _texts;
    return showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(texts.unsavedChangesTitle),
          content: Text(texts.unsavedChangesDescription),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(texts.stayAction),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(texts.leaveAction),
            ),
          ],
        );
      },
    );
  }

  Future<void> _resetToDefaults() async {
    final texts = _texts;
    if (_isSaving) {
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(texts.resetFieldsTitle),
          content: Text(texts.resetFieldsDescription),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(texts.cancelAction),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(texts.resetAction),
            ),
          ],
        );
      },
    );
    if (confirmed != true) {
      return;
    }
    final defaults = DealerProfile.defaults;
    _businessNameController.text = defaults.businessName;
    _contactNameController.text = defaults.contactName;
    _emailController.text = defaults.email;
    _phoneController.text = defaults.phone;
    _addressLineController.text = defaults.addressLine;
    _wardController.text = defaults.ward;
    _districtController.text = defaults.district;
    _cityController.text = defaults.city;
    _countryController.text = defaults.country;
    _policyController.text = defaults.salesPolicy;
    setState(() {
      _avatarUrl = defaults.avatarUrl;
    });
    _handleFormChanged();
    _showSnackBar(texts.defaultsAppliedMessage);
  }

  String? _requiredValidator(String? value, String message) {
    return validateRequiredText(value, message: message);
  }

  String? _emailValidator(String? value) {
    final texts = _texts;
    return validateEmailAddress(
      value,
      emptyMessage: texts.emailRequiredMessage,
      invalidMessage: texts.invalidEmailMessage,
    );
  }

  String? _phoneValidator(String? value) {
    final texts = _texts;
    final requiredResult = _requiredValidator(
      value,
      texts.phoneRequiredMessage,
    );
    if (requiredResult != null) {
      return requiredResult;
    }
    if (!_isValidPhone(value!.trim())) {
      return texts.invalidPhoneMessage;
    }
    return null;
  }

  Future<void> _handleSave() async {
    final texts = _texts;
    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      _showSnackBar(texts.reviewHighlightedFieldsMessage);
      return;
    }

    setState(() => _isSaving = true);
    try {
      await (widget.saveProfile ?? saveDealerProfile)(
        DealerProfile(
          businessName: _businessNameController.text.trim(),
          contactName: _contactNameController.text.trim(),
          email: _emailController.text.trim(),
          phone: _phoneController.text.trim(),
          addressLine: _addressLineController.text.trim(),
          ward: _wardController.text.trim(),
          district: _districtController.text.trim(),
          city: _cityController.text.trim(),
          country: _countryController.text.trim(),
          salesPolicy: _policyController.text.trim(),
          avatarUrl: _avatarUrl?.trim().isEmpty ?? true
              ? null
              : _avatarUrl!.trim(),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _isSaving = false);
      _showSnackBar(texts.saveProfileFailed(error));
      return;
    }

    if (!mounted) {
      return;
    }

    _initialSnapshot = _formSnapshot();
    setState(() {
      _isSaving = false;
      _hasUnsavedChanges = false;
    });
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(texts.profileSavedMessage),
          action: SnackBarAction(
            label: texts.backAction,
            onPressed: () {
              if (mounted) {
                Navigator.of(context).maybePop();
              }
            },
          ),
        ),
      );
  }

  void _showSnackBar(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final texts = _texts;
    final isTablet = AppBreakpoints.isTablet(context);
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;

    return PopScope<void>(
      canPop: !_hasUnsavedChanges && !_isSaving,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) {
          return;
        }
        final canLeave = await _handleWillPop();
        if (!canLeave || !context.mounted) {
          return;
        }
        Navigator.of(context).pop();
      },
      child: Scaffold(
        appBar: AppBar(
          title: BrandAppBarTitle(texts.screenTitle),
          actions: [
            IconButton(
              tooltip: texts.resetTooltip,
              onPressed: _isSaving ? null : _resetToDefaults,
              icon: const Icon(Icons.restore_outlined),
            ),
          ],
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: contentMaxWidth),
                  child: Form(
                    key: _formKey,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                      children: [
                        FadeSlideIn(
                          child: SectionCard(
                            title: texts.avatarTitle,
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _AvatarPreview(
                                  imageProvider: imageProviderFromReference(
                                    _avatarUrl,
                                  ),
                                  fallbackLabel:
                                      _businessNameController.text
                                          .trim()
                                          .isEmpty
                                      ? 'D'
                                      : _businessNameController.text
                                            .trim()
                                            .substring(0, 1)
                                            .toUpperCase(),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        texts.avatarHint,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(
                                              color: Theme.of(
                                                context,
                                              ).colorScheme.onSurfaceVariant,
                                            ),
                                      ),
                                      const SizedBox(height: 12),
                                      Wrap(
                                        spacing: 10,
                                        runSpacing: 10,
                                        children: [
                                          OutlinedButton.icon(
                                            onPressed: _isUploadingAvatar
                                                ? null
                                                : _pickAvatar,
                                            icon: _isUploadingAvatar
                                                ? const SizedBox(
                                                    width: 16,
                                                    height: 16,
                                                    child:
                                                        CircularProgressIndicator(
                                                          strokeWidth: 2,
                                                        ),
                                                  )
                                                : const Icon(
                                                    Icons
                                                        .photo_camera_back_outlined,
                                                  ),
                                            label: Text(
                                              (_avatarUrl?.trim().isNotEmpty ??
                                                      false)
                                                  ? texts.replaceAvatarLabel
                                                  : texts.uploadAvatarLabel,
                                            ),
                                          ),
                                          if (_avatarUrl?.trim().isNotEmpty ??
                                              false)
                                            TextButton(
                                              onPressed: _removeAvatar,
                                              child: Text(
                                                texts.removeAvatarLabel,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        FadeSlideIn(
                          child: SectionCard(
                            title: texts.companyTitle,
                            child: Column(
                              children: [
                                TextFormField(
                                  controller: _businessNameController,
                                  textInputAction: TextInputAction.next,
                                  validator: (value) => _requiredValidator(
                                    value,
                                    texts.businessNameRequiredMessage,
                                  ),
                                  decoration: InputDecoration(
                                    labelText: texts.businessLabel,
                                    prefixIcon: const Padding(
                                      padding: EdgeInsets.all(12),
                                      child: BrandLogoIcon(size: 20),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextFormField(
                                  controller: _contactNameController,
                                  textInputAction: TextInputAction.next,
                                  validator: (value) => _requiredValidator(
                                    value,
                                    texts.contactRequiredMessage,
                                  ),
                                  decoration: InputDecoration(
                                    labelText: texts.contactLabel,
                                    prefixIcon: const Icon(
                                      Icons.person_outline,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        FadeSlideIn(
                          delay: const Duration(milliseconds: 80),
                          child: SectionCard(
                            title: texts.shippingTitle,
                            child: Column(
                              children: [
                                TextFormField(
                                  controller: _emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  textInputAction: TextInputAction.next,
                                  validator: _emailValidator,
                                  decoration: InputDecoration(
                                    labelText: texts.emailLabel,
                                    prefixIcon: const Icon(Icons.mail_outline),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextFormField(
                                  controller: _phoneController,
                                  keyboardType: TextInputType.phone,
                                  textInputAction: TextInputAction.next,
                                  validator: _phoneValidator,
                                  decoration: InputDecoration(
                                    labelText: texts.phoneLabel,
                                    prefixIcon: const Icon(
                                      Icons.phone_outlined,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextFormField(
                                  controller: _addressLineController,
                                  textInputAction: TextInputAction.next,
                                  validator: (value) => _requiredValidator(
                                    value,
                                    texts.addressLineRequiredMessage,
                                  ),
                                  decoration: InputDecoration(
                                    labelText: texts.addressLineLabel,
                                    prefixIcon: const Icon(
                                      Icons.location_on_outlined,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextFormField(
                                  controller: _wardController,
                                  textInputAction: TextInputAction.next,
                                  decoration: InputDecoration(
                                    labelText: texts.wardLabel,
                                    prefixIcon: const Icon(
                                      Icons.holiday_village_outlined,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextFormField(
                                  controller: _districtController,
                                  textInputAction: TextInputAction.next,
                                  decoration: InputDecoration(
                                    labelText: texts.districtLabel,
                                    prefixIcon: const Icon(Icons.map_outlined),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextFormField(
                                  controller: _cityController,
                                  textInputAction: TextInputAction.next,
                                  validator: (value) => _requiredValidator(
                                    value,
                                    texts.cityRequiredMessage,
                                  ),
                                  decoration: InputDecoration(
                                    labelText: texts.cityLabel,
                                    prefixIcon: const Icon(
                                      Icons.location_city_outlined,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextFormField(
                                  controller: _countryController,
                                  textInputAction: TextInputAction.next,
                                  decoration: InputDecoration(
                                    labelText: texts.countryLabel,
                                    prefixIcon: const Icon(
                                      Icons.public_outlined,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        FadeSlideIn(
                          delay: const Duration(milliseconds: 120),
                          child: SectionCard(
                            title: texts.policyTitle,
                            child: TextFormField(
                              controller: _policyController,
                              minLines: 3,
                              maxLines: 5,
                              validator: (value) => _requiredValidator(
                                value,
                                texts.policyRequiredMessage,
                              ),
                              decoration: InputDecoration(
                                labelText: texts.policyLabel,
                                alignLabelWithHint: true,
                                prefixIcon: const Icon(Icons.policy_outlined),
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
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                      ),
                                    )
                                  : Text(texts.saveLabel),
                            ),
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

class _AccountSettingsTexts {
  const _AccountSettingsTexts({required this.isEnglish});

  final bool isEnglish;

  String loadProfileFailed(Object error) => isEnglish
      ? dealerProfileStorageErrorMessage(error, isEnglish: true)
      : dealerProfileStorageErrorMessage(error, isEnglish: false);
  String get avatarUpdatedMessage => isEnglish
      ? 'Avatar updated. Save changes to keep it.'
      : 'Đã cập nhật avatar. Nhấn Lưu để xác nhận.';
  String avatarUploadFailed(Object error) => isEnglish
      ? uploadServiceErrorMessage(error, isEnglish: true)
      : uploadServiceErrorMessage(error, isEnglish: false);
  String get avatarRemovedMessage => isEnglish
      ? 'Avatar removed. Save changes to confirm.'
      : 'Đã xóa avatar. Nhấn Lưu để xác nhận.';
  String get unsavedChangesTitle =>
      isEnglish ? 'Unsaved changes' : 'Có thay đổi chưa lưu';
  String get unsavedChangesDescription => isEnglish
      ? 'You have unsaved changes. Do you want to leave this screen?'
      : 'Bạn có thay đổi chưa lưu. Bạn có muốn thoát màn hình này không?';
  String get stayAction => isEnglish ? 'Stay' : 'Ở lại';
  String get leaveAction => isEnglish ? 'Leave' : 'Thoát';
  String get resetFieldsTitle => isEnglish ? 'Reset fields' : 'Đặt lại dữ liệu';
  String get resetFieldsDescription => isEnglish
      ? 'Reset editable fields to default values?'
      : 'Đặt lại các trường có thể chỉnh sửa về giá trị mặc định?';
  String get cancelAction => isEnglish ? 'Cancel' : 'Hủy';
  String get resetAction => isEnglish ? 'Reset' : 'Đặt lại';
  String get defaultsAppliedMessage => isEnglish
      ? 'Default values applied. Press Save to confirm.'
      : 'Đã áp dụng giá trị mặc định. Nhấn Lưu để xác nhận.';
  String get emailRequiredMessage =>
      isEnglish ? 'Please enter your email.' : 'Vui lòng nhập email.';
  String get invalidEmailMessage =>
      isEnglish ? 'Invalid email format.' : 'Email không hợp lệ.';
  String get phoneRequiredMessage => isEnglish
      ? 'Please enter your phone number.'
      : 'Vui lòng nhập số điện thoại.';
  String get invalidPhoneMessage => isEnglish
      ? 'Invalid phone number format.'
      : 'Số điện thoại không hợp lệ.';
  String get reviewHighlightedFieldsMessage => isEnglish
      ? 'Please review the highlighted fields.'
      : 'Vui lòng kiểm tra các trường đang báo lỗi.';
  String saveProfileFailed(Object error) => isEnglish
      ? dealerProfileStorageErrorMessage(error, isEnglish: true)
      : dealerProfileStorageErrorMessage(error, isEnglish: false);
  String get profileSavedMessage =>
      isEnglish ? 'Profile saved successfully.' : 'Đã lưu thông tin tài khoản.';
  String get backAction => isEnglish ? 'Back' : 'Quay lại';
  String get screenTitle =>
      isEnglish ? 'Account settings' : 'Cài đặt tài khoản';
  String get resetTooltip =>
      isEnglish ? 'Reset to defaults' : 'Đặt lại mặc định';
  String get avatarTitle => isEnglish ? 'Avatar' : 'Ảnh đại diện';
  String get avatarHint => isEnglish
      ? 'Upload a dealer avatar for profile screens.'
      : 'Tải ảnh đại diện cho hồ sơ đại lý.';
  String get uploadAvatarLabel => isEnglish ? 'Upload avatar' : 'Tải avatar';
  String get replaceAvatarLabel => isEnglish ? 'Replace avatar' : 'Đổi avatar';
  String get removeAvatarLabel => isEnglish ? 'Remove avatar' : 'Xóa avatar';
  String get companyTitle =>
      isEnglish ? 'Business information' : 'Thông tin doanh nghiệp';
  String get shippingTitle =>
      isEnglish ? 'Shipping and contact' : 'Địa chỉ giao hàng và liên hệ';
  String get addressLineLabel =>
      isEnglish ? 'Street address' : 'Số nhà, tên đường';
  String get wardLabel => isEnglish ? 'Ward / Commune' : 'Phường / Xã';
  String get districtLabel => isEnglish ? 'District' : 'Quận / Huyện';
  String get cityLabel => isEnglish ? 'Province / City' : 'Tỉnh / Thành phố';
  String get countryLabel => isEnglish ? 'Country' : 'Quốc gia';
  String get policyTitle => isEnglish ? 'Sales policy' : 'Chính sách bán hàng';
  String get saveLabel => isEnglish ? 'Save changes' : 'Lưu thay đổi';
  String get businessLabel =>
      isEnglish ? 'Business / dealer name' : 'Tên doanh nghiệp / đại lý';
  String get contactLabel => isEnglish ? 'Contact person' : 'Người liên hệ';
  String get emailLabel => 'Email';
  String get phoneLabel => isEnglish ? 'Phone number' : 'Số điện thoại';
  String get policyLabel =>
      isEnglish ? 'Policy details' : 'Nội dung chính sách';
  String get businessNameRequiredMessage => isEnglish
      ? 'Please enter business name.'
      : 'Vui lòng nhập tên doanh nghiệp.';
  String get contactRequiredMessage => isEnglish
      ? 'Please enter contact person.'
      : 'Vui lòng nhập người liên hệ.';
  String get addressLineRequiredMessage => isEnglish
      ? 'Please enter street address.'
      : 'Vui lòng nhập số nhà, tên đường.';
  String get cityRequiredMessage => isEnglish
      ? 'Please enter province / city.'
      : 'Vui lòng nhập tỉnh / thành phố.';
  String get policyRequiredMessage => isEnglish
      ? 'Please enter policy details.'
      : 'Vui lòng nhập nội dung chính sách.';
}

class _AvatarPreview extends StatelessWidget {
  const _AvatarPreview({
    required this.imageProvider,
    required this.fallbackLabel,
  });

  final ImageProvider<Object>? imageProvider;
  final String fallbackLabel;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return CircleAvatar(
      radius: 34,
      backgroundColor: colors.primaryContainer,
      backgroundImage: imageProvider,
      child: imageProvider == null
          ? Text(
              fallbackLabel,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: colors.onPrimaryContainer,
                fontWeight: FontWeight.w700,
              ),
            )
          : null,
    );
  }
}
