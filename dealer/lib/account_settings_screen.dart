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
  const AccountSettingsScreen({super.key});

  @override
  State<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends State<AccountSettingsScreen> {
  final _businessNameController = TextEditingController();
  final _contactNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _shippingAddressController = TextEditingController();
  final _policyController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _uploadService = UploadService();

  bool _isLoading = true;
  bool _isSaving = false;
  bool _isUploadingAvatar = false;
  bool _hasUnsavedChanges = false;
  bool _didLoadInitialData = false;
  String _initialSnapshot = '';
  String? _avatarUrl;

  List<TextEditingController> get _editableControllers => [
    _businessNameController,
    _contactNameController,
    _emailController,
    _phoneController,
    _shippingAddressController,
    _policyController,
  ];

  @override
  void initState() {
    super.initState();
    for (final controller in _editableControllers) {
      controller.addListener(_handleFormChanged);
    }
    _loadData();
  }

  Future<void> _loadData() async {
    DealerProfile profile;
    try {
      profile = await loadDealerProfile();
    } catch (error) {
      profile = DealerProfile.defaults;
      if (mounted) {
        _showSnackBar('Không thể tải hồ sơ: $error');
      }
    }
    if (!mounted) {
      return;
    }
    _businessNameController.text = profile.businessName;
    _contactNameController.text = profile.contactName;
    _emailController.text = profile.email;
    _phoneController.text = profile.phone;
    _shippingAddressController.text = profile.shippingAddress;
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
    _shippingAddressController.dispose();
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
      _shippingAddressController.text.trim(),
      _policyController.text.trim(),
      _avatarUrl?.trim() ?? '',
    ].join('||');
  }

  bool _isValidPhone(String phone) {
    return RegExp(r'^[0-9+\s-]{8,}$').hasMatch(phone);
  }

  Future<void> _pickAvatar(bool isEnglish) async {
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
      _showSnackBar(
        isEnglish
            ? 'Avatar updated. Save changes to keep it.'
            : 'Da cap nhat avatar. Nhan Luu de xac nhan.',
      );
      _handleFormChanged();
    } catch (error) {
      if (!mounted) {
        return;
      }
      _showSnackBar(
        isEnglish
            ? 'Unable to upload avatar: $error'
            : 'Không thể tải avatar: $error',
      );
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

  void _removeAvatar(bool isEnglish) {
    if (_isSaving ||
        _isUploadingAvatar ||
        (_avatarUrl?.trim().isEmpty ?? true)) {
      return;
    }
    setState(() {
      _avatarUrl = null;
    });
    _showSnackBar(
      isEnglish
          ? 'Avatar removed. Save changes to confirm.'
          : 'Da xoa avatar. Nhan Luu de xac nhan.',
    );
    _handleFormChanged();
  }

  Future<bool> _handleWillPop(bool isEnglish) async {
    if (_isSaving) {
      return false;
    }
    if (!_hasUnsavedChanges) {
      return true;
    }
    final shouldDiscard = await _confirmDiscardChanges(isEnglish);
    return shouldDiscard ?? false;
  }

  Future<bool?> _confirmDiscardChanges(bool isEnglish) {
    return showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(isEnglish ? 'Unsaved changes' : 'Có thay đổi chưa lưu'),
          content: Text(
            isEnglish
                ? 'You have unsaved changes. Do you want to leave this screen?'
                : 'Bạn có thay đổi chưa lưu. Bạn có muốn thoát màn hình này không?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(isEnglish ? 'Stay' : 'Ở lại'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(isEnglish ? 'Leave' : 'Thoát'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _resetToDefaults(bool isEnglish) async {
    if (_isSaving) {
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(isEnglish ? 'Reset fields' : 'Đặt lại dữ liệu'),
          content: Text(
            isEnglish
                ? 'Reset editable fields to default values?'
                : 'Đặt lại các trường có thể chỉnh sửa về giá trị mặc định?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(isEnglish ? 'Cancel' : 'Hủy'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(isEnglish ? 'Reset' : 'Đặt lại'),
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
    _shippingAddressController.text = defaults.shippingAddress;
    _policyController.text = defaults.salesPolicy;
    _avatarUrl = defaults.avatarUrl;
    _showSnackBar(
      isEnglish
          ? 'Default values applied. Press Save to confirm.'
          : 'Đã áp dụng giá trị mặc định. Nhấn Lưu để xác nhận.',
    );
  }

  String? _requiredValidator(String? value, String message) {
    return validateRequiredText(value, message: message);
  }

  String? _emailValidator(String? value, bool isEnglish) {
    final requiredMessage = isEnglish
        ? 'Please enter your email.'
        : 'Vui lòng nhập email.';
    final invalidMessage = isEnglish
        ? 'Invalid email format.'
        : 'Email không hợp lệ.';
    return validateEmailAddress(
      value,
      emptyMessage: requiredMessage,
      invalidMessage: invalidMessage,
    );
  }

  String? _phoneValidator(String? value, bool isEnglish) {
    final requiredMessage = isEnglish
        ? 'Please enter your phone number.'
        : 'Vui lòng nhập số điện thoại.';
    final invalidMessage = isEnglish
        ? 'Invalid phone number format.'
        : 'Số điện thoại không hợp lệ.';
    final requiredResult = _requiredValidator(value, requiredMessage);
    if (requiredResult != null) {
      return requiredResult;
    }
    if (!_isValidPhone(value!.trim())) {
      return invalidMessage;
    }
    return null;
  }

  Future<void> _handleSave(bool isEnglish) async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      _showSnackBar(
        isEnglish
            ? 'Please review the highlighted fields.'
            : 'Vui lòng kiểm tra các trường đang báo lỗi.',
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      await saveDealerProfile(
        DealerProfile(
          businessName: _businessNameController.text.trim(),
          contactName: _contactNameController.text.trim(),
          email: _emailController.text.trim(),
          phone: _phoneController.text.trim(),
          shippingAddress: _shippingAddressController.text.trim(),
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
      _showSnackBar(
        isEnglish
            ? 'Unable to save profile: $error'
            : 'Không thể lưu hồ sơ: $error',
      );
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
          content: Text(
            isEnglish
                ? 'Profile saved successfully.'
                : 'Đã lưu thông tin tài khoản.',
          ),
          action: SnackBarAction(
            label: isEnglish ? 'Back' : 'Quay lại',
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
    final appSettings = AppSettingsScope.of(context);
    final isEnglish = appSettings.locale.languageCode == 'en';
    final isTablet = AppBreakpoints.isTablet(context);
    final contentMaxWidth = isTablet ? 860.0 : double.infinity;

    final screenTitle = isEnglish ? 'Account settings' : 'Cài đặt tài khoản';
    final resetTooltip = isEnglish ? 'Reset to defaults' : 'Đặt lại mặc định';
    final avatarTitle = isEnglish ? 'Avatar' : 'Ảnh đại diện';
    final avatarHint = isEnglish
        ? 'Upload a dealer avatar for profile screens.'
        : 'Tải ảnh đại diện cho hồ sơ đại lý.';
    final uploadAvatarLabel = isEnglish ? 'Upload avatar' : 'Tải avatar';
    final replaceAvatarLabel = isEnglish ? 'Replace avatar' : 'Đổi avatar';
    final removeAvatarLabel = isEnglish ? 'Remove avatar' : 'Xóa avatar';
    final companyTitle = isEnglish
        ? 'Business information'
        : 'Thông tin doanh nghiệp';
    final shippingTitle = isEnglish
        ? 'Shipping and contact'
        : 'Địa chỉ giao hàng và liên hệ';
    final policyTitle = isEnglish ? 'Sales policy' : 'Chính sách bán hàng';
    final saveLabel = isEnglish ? 'Save changes' : 'Lưu thay đổi';
    final businessLabel = isEnglish
        ? 'Business / dealer name'
        : 'Tên doanh nghiệp / đại lý';
    final contactLabel = isEnglish ? 'Contact person' : 'Người liên hệ';
    final emailLabel = 'Email';
    final phoneLabel = isEnglish ? 'Phone number' : 'Số điện thoại';
    final shippingLabel = isEnglish ? 'Shipping address' : 'Địa chỉ giao hàng';
    final policyLabel = isEnglish ? 'Policy details' : 'Nội dung chính sách';

    return PopScope<void>(
      canPop: !_hasUnsavedChanges && !_isSaving,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) {
          return;
        }
        final canLeave = await _handleWillPop(isEnglish);
        if (!canLeave || !context.mounted) {
          return;
        }
        Navigator.of(context).pop();
      },
      child: Scaffold(
        appBar: AppBar(
          title: BrandAppBarTitle(screenTitle),
          actions: [
            IconButton(
              tooltip: resetTooltip,
              onPressed: _isSaving ? null : () => _resetToDefaults(isEnglish),
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
                            title: avatarTitle,
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
                                        avatarHint,
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
                                                : () => _pickAvatar(isEnglish),
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
                                                  ? replaceAvatarLabel
                                                  : uploadAvatarLabel,
                                            ),
                                          ),
                                          if (_avatarUrl?.trim().isNotEmpty ??
                                              false)
                                            TextButton(
                                              onPressed: () =>
                                                  _removeAvatar(isEnglish),
                                              child: Text(removeAvatarLabel),
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
                            title: companyTitle,
                            child: Column(
                              children: [
                                TextFormField(
                                  controller: _businessNameController,
                                  textInputAction: TextInputAction.next,
                                  validator: (value) => _requiredValidator(
                                    value,
                                    isEnglish
                                        ? 'Please enter business name.'
                                        : 'Vui lòng nhập tên doanh nghiệp.',
                                  ),
                                  decoration: InputDecoration(
                                    labelText: businessLabel,
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
                                    isEnglish
                                        ? 'Please enter contact person.'
                                        : 'Vui lòng nhập người liên hệ.',
                                  ),
                                  decoration: InputDecoration(
                                    labelText: contactLabel,
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
                            title: shippingTitle,
                            child: Column(
                              children: [
                                TextFormField(
                                  controller: _emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  textInputAction: TextInputAction.next,
                                  validator: (value) =>
                                      _emailValidator(value, isEnglish),
                                  decoration: InputDecoration(
                                    labelText: emailLabel,
                                    prefixIcon: const Icon(Icons.mail_outline),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextFormField(
                                  controller: _phoneController,
                                  keyboardType: TextInputType.phone,
                                  textInputAction: TextInputAction.next,
                                  validator: (value) =>
                                      _phoneValidator(value, isEnglish),
                                  decoration: InputDecoration(
                                    labelText: phoneLabel,
                                    prefixIcon: const Icon(
                                      Icons.phone_outlined,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 14),
                                TextFormField(
                                  controller: _shippingAddressController,
                                  maxLines: 2,
                                  textInputAction: TextInputAction.next,
                                  validator: (value) => _requiredValidator(
                                    value,
                                    isEnglish
                                        ? 'Please enter shipping address.'
                                        : 'Vui lòng nhập địa chỉ giao hàng.',
                                  ),
                                  decoration: InputDecoration(
                                    labelText: shippingLabel,
                                    prefixIcon: const Icon(
                                      Icons.location_on_outlined,
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
                            title: policyTitle,
                            child: TextFormField(
                              controller: _policyController,
                              minLines: 3,
                              maxLines: 5,
                              validator: (value) => _requiredValidator(
                                value,
                                isEnglish
                                    ? 'Please enter policy details.'
                                    : 'Vui lòng nhập nội dung chính sách.',
                              ),
                              decoration: InputDecoration(
                                labelText: policyLabel,
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
                              onPressed: _isSaving
                                  ? null
                                  : () => _handleSave(isEnglish),
                              child: _isSaving
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                      ),
                                    )
                                  : Text(saveLabel),
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
