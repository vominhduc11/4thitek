import 'dart:async';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import 'app_settings_controller.dart';
import 'breakpoints.dart';
import 'dealer_navigation.dart';
import 'dealer_profile_storage.dart';
import 'dealer_routes.dart';
import 'file_reference.dart';
import 'upload_service.dart';
import 'validation_utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';
import 'widgets/skeleton_box.dart';

class AccountSettingsScreen extends StatefulWidget {
  const AccountSettingsScreen({super.key, this.loadProfile, this.saveProfile});

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
  late final Listenable _summaryListenable;

  bool _isLoading = true;
  bool _isSaving = false;
  bool _isUploadingAvatar = false;
  bool _hasUnsavedChanges = false;
  bool _didLoadInitialData = false;
  bool _didStartInitialLoad = false;
  bool _isEnglish = false;
  String _initialSnapshot = '';
  String? _avatarUrl;
  int _profileVatPercent = DealerProfile.defaults.vatPercent;

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

  int get _completedPrimaryFields {
    final values = [
      _businessNameController.text.trim(),
      _contactNameController.text.trim(),
      _emailController.text.trim(),
      _phoneController.text.trim(),
      _addressLineController.text.trim(),
      _cityController.text.trim(),
      _policyController.text.trim(),
    ];
    return values.where((value) => value.isNotEmpty).length;
  }

  @override
  void initState() {
    super.initState();
    _summaryListenable = Listenable.merge(_editableControllers);
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
    _profileVatPercent = profile.vatPercent;
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

  Future<void> _pickAvatar() async {
    final texts = _texts;
    if (_isSaving || _isUploadingAvatar) {
      return;
    }

    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 88,
      maxWidth: 1600,
      maxHeight: 1600,
    );
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

  void _handleRootFallback() {
    unawaited(_handleRootFallbackAsync());
  }

  Future<void> _handleRootFallbackAsync() async {
    if (_isSaving) {
      return;
    }
    if (_hasUnsavedChanges) {
      final shouldDiscard = await _confirmDiscardChanges();
      if (shouldDiscard != true || !mounted) {
        return;
      }
    }
    if (!mounted) {
      return;
    }
    context.goToDealerHome();
  }

  Future<bool?> _confirmDiscardChanges() {
    final texts = _texts;
    return showDialog<bool>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return RepaintBoundary(
          child: AlertDialog(
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 20,
            ),
            title: Text(texts.unsavedChangesTitle),
            content: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Text(texts.unsavedChangesDescription),
            ),
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
          ),
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
        return RepaintBoundary(
          child: AlertDialog(
            insetPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 20,
            ),
            title: Text(texts.resetFieldsTitle),
            content: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Text(texts.resetFieldsDescription),
            ),
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
          ),
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
    return validateVietnamPhoneNumber(
      value,
      emptyMessage: texts.phoneRequiredMessage,
      invalidMessage: texts.invalidPhoneMessage,
    );
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
          vatPercent: _profileVatPercent,
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
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  InputDecoration _inputDecoration({
    required String labelText,
    required Widget prefixIcon,
    String? hintText,
    bool alignLabelWithHint = false,
  }) {
    final colors = Theme.of(context).colorScheme;
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: BorderSide(
        color: colors.outlineVariant.withValues(alpha: 0.7),
      ),
    );

    return InputDecoration(
      labelText: labelText,
      hintText: hintText,
      hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(
        color: colors.onSurfaceVariant.withValues(alpha: 0.9),
      ),
      alignLabelWithHint: alignLabelWithHint,
      filled: true,
      fillColor: colors.surfaceContainerHighest.withValues(alpha: 0.22),
      prefixIcon: prefixIcon,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
      border: border,
      enabledBorder: border,
      disabledBorder: border,
      focusedBorder: border.copyWith(
        borderSide: BorderSide(color: colors.primary, width: 1.4),
      ),
      errorBorder: border.copyWith(
        borderSide: BorderSide(color: colors.error, width: 1.1),
      ),
      focusedErrorBorder: border.copyWith(
        borderSide: BorderSide(color: colors.error, width: 1.4),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final texts = _texts;
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isTablet = AppBreakpoints.isTablet(context);
    final isDesktopWide = screenWidth >= 1180;
    final useTwoColumnFields = screenWidth >= 760;
    final contentMaxWidth = isDesktopWide
        ? 1240.0
        : isTablet
        ? 980.0
        : 760.0;

    final avatarProvider = imageProviderFromReference(_avatarUrl);
    final businessName = _businessNameController.text.trim();
    final fallbackBusinessName = businessName.isEmpty
        ? texts.screenTitle
        : businessName;
    final avatarFallbackLabel = businessName.isEmpty
        ? 'D'
        : businessName.substring(0, 1).toUpperCase();

    String displayOrPlaceholder(String value) {
      final trimmed = value.trim();
      return trimmed.isEmpty ? texts.emptyValuePlaceholder : trimmed;
    }

    Widget buildAvatarSection() {
      return SectionCard(
        title: texts.avatarTitle,
        padding: const EdgeInsets.all(18),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxWidth < 560;
            final description = Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  texts.avatarHint,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colors.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 12),
                _SettingsStateBadge(
                  icon: (_avatarUrl?.trim().isNotEmpty ?? false)
                      ? Icons.verified_outlined
                      : Icons.account_circle_outlined,
                  label: (_avatarUrl?.trim().isNotEmpty ?? false)
                      ? texts.avatarUploadedBadge
                      : texts.avatarDefaultBadge,
                  isActive: _avatarUrl?.trim().isNotEmpty ?? false,
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    OutlinedButton.icon(
                      onPressed: _isUploadingAvatar || _isSaving
                          ? null
                          : _pickAvatar,
                      icon: _isUploadingAvatar
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.photo_library_outlined),
                      label: Text(
                        (_avatarUrl?.trim().isNotEmpty ?? false)
                            ? texts.replaceAvatarLabel
                            : texts.uploadAvatarLabel,
                      ),
                    ),
                    if (_avatarUrl?.trim().isNotEmpty ?? false)
                      TextButton.icon(
                        onPressed: _isSaving || _isUploadingAvatar
                            ? null
                            : _removeAvatar,
                        icon: const Icon(Icons.delete_outline),
                        label: Text(texts.removeAvatarLabel),
                      ),
                  ],
                ),
              ],
            );

            if (compact) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: _AvatarPreview(
                      imageProvider: avatarProvider,
                      fallbackLabel: avatarFallbackLabel,
                      radius: 44,
                    ),
                  ),
                  const SizedBox(height: 18),
                  description,
                ],
              );
            }

            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _AvatarPreview(
                  imageProvider: avatarProvider,
                  fallbackLabel: avatarFallbackLabel,
                  radius: 44,
                ),
                const SizedBox(width: 18),
                Expanded(child: description),
              ],
            );
          },
        ),
      );
    }

    Widget buildBusinessSection() {
      final businessField = TextFormField(
        controller: _businessNameController,
        textInputAction: useTwoColumnFields
            ? TextInputAction.next
            : TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        autofillHints: const [AutofillHints.organizationName],
        validator: (value) =>
            _requiredValidator(value, texts.businessNameRequiredMessage),
        decoration: _inputDecoration(
          labelText: texts.businessLabel,
          prefixIcon: const Padding(
            padding: EdgeInsets.all(12),
            child: BrandLogoIcon(size: 20),
          ),
        ),
      );

      final contactField = TextFormField(
        controller: _contactNameController,
        textInputAction: TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        autofillHints: const [AutofillHints.name],
        validator: (value) =>
            _requiredValidator(value, texts.contactRequiredMessage),
        decoration: _inputDecoration(
          labelText: texts.contactLabel,
          prefixIcon: const Icon(Icons.person_outline),
        ),
      );

      return SectionCard(
        title: texts.companyTitle,
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              texts.companySubtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 16),
            if (useTwoColumnFields)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: businessField),
                  const SizedBox(width: 14),
                  Expanded(child: contactField),
                ],
              )
            else
              Column(
                children: [
                  businessField,
                  const SizedBox(height: 14),
                  contactField,
                ],
              ),
          ],
        ),
      );
    }

    Widget buildContactSection() {
      final emailField = TextFormField(
        controller: _emailController,
        keyboardType: TextInputType.emailAddress,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.email],
        validator: _emailValidator,
        decoration: _inputDecoration(
          labelText: texts.emailLabel,
          prefixIcon: const Icon(Icons.mail_outline),
        ),
      );

      final phoneField = TextFormField(
        controller: _phoneController,
        keyboardType: TextInputType.phone,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.telephoneNumber],
        validator: _phoneValidator,
        decoration: _inputDecoration(
          labelText: texts.phoneLabel,
          prefixIcon: const Icon(Icons.phone_outlined),
        ),
      );

      final addressField = TextFormField(
        controller: _addressLineController,
        textInputAction: TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        autofillHints: const [AutofillHints.streetAddressLine1],
        validator: (value) =>
            _requiredValidator(value, texts.addressLineRequiredMessage),
        decoration: _inputDecoration(
          labelText: texts.addressLineLabel,
          prefixIcon: const Icon(Icons.location_on_outlined),
        ),
      );

      final wardField = TextFormField(
        controller: _wardController,
        textInputAction: TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        decoration: _inputDecoration(
          labelText: texts.wardLabel,
          prefixIcon: const Icon(Icons.holiday_village_outlined),
        ),
      );

      final districtField = TextFormField(
        controller: _districtController,
        textInputAction: TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        decoration: _inputDecoration(
          labelText: texts.districtLabel,
          prefixIcon: const Icon(Icons.map_outlined),
        ),
      );

      final cityField = TextFormField(
        controller: _cityController,
        textInputAction: TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        autofillHints: const [AutofillHints.addressCity],
        validator: (value) =>
            _requiredValidator(value, texts.cityRequiredMessage),
        decoration: _inputDecoration(
          labelText: texts.cityLabel,
          prefixIcon: const Icon(Icons.location_city_outlined),
        ),
      );

      final countryField = TextFormField(
        controller: _countryController,
        textInputAction: TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        autofillHints: const [AutofillHints.countryName],
        decoration: _inputDecoration(
          labelText: texts.countryLabel,
          prefixIcon: const Icon(Icons.public_outlined),
        ),
      );

      return SectionCard(
        title: texts.shippingTitle,
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              texts.shippingSubtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 16),
            if (useTwoColumnFields)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: emailField),
                  const SizedBox(width: 14),
                  Expanded(child: phoneField),
                ],
              )
            else
              Column(
                children: [emailField, const SizedBox(height: 14), phoneField],
              ),
            const SizedBox(height: 14),
            addressField,
            const SizedBox(height: 14),
            if (useTwoColumnFields)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: wardField),
                  const SizedBox(width: 14),
                  Expanded(child: districtField),
                ],
              )
            else
              Column(
                children: [
                  wardField,
                  const SizedBox(height: 14),
                  districtField,
                ],
              ),
            const SizedBox(height: 14),
            if (useTwoColumnFields)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: cityField),
                  const SizedBox(width: 14),
                  Expanded(child: countryField),
                ],
              )
            else
              Column(
                children: [cityField, const SizedBox(height: 14), countryField],
              ),
          ],
        ),
      );
    }

    Widget buildPolicySection() {
      return SectionCard(
        title: texts.policyTitle,
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              texts.policySubtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colors.onSurfaceVariant,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _policyController,
              minLines: 4,
              maxLines: 6,
              textInputAction: TextInputAction.newline,
              textCapitalization: TextCapitalization.sentences,
              validator: (value) =>
                  _requiredValidator(value, texts.policyRequiredMessage),
              decoration: _inputDecoration(
                labelText: texts.policyLabel,
                alignLabelWithHint: true,
                prefixIcon: const Icon(Icons.policy_outlined),
              ),
            ),
          ],
        ),
      );
    }

    final overviewCard = RepaintBoundary(
      child: AnimatedBuilder(
        animation: _summaryListenable,
        builder: (context, _) {
          return FadeSlideIn(
            child: _SettingsHeroCard(
              avatar: _AvatarPreview(
                imageProvider: avatarProvider,
                fallbackLabel: avatarFallbackLabel,
                radius: 36,
              ),
              title: fallbackBusinessName,
              subtitle: texts.overviewSubtitle,
              contactName: displayOrPlaceholder(_contactNameController.text),
              email: displayOrPlaceholder(_emailController.text),
              phone: displayOrPlaceholder(_phoneController.text),
              hasPendingChanges: _hasUnsavedChanges,
              pendingLabel: texts.unsavedBadge,
              savedLabel: texts.savedBadge,
            ),
          );
        },
      ),
    );

    final avatarSection = RepaintBoundary(
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 60),
        child: buildAvatarSection(),
      ),
    );

    final businessSection = RepaintBoundary(
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 100),
        child: buildBusinessSection(),
      ),
    );

    final contactSection = RepaintBoundary(
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 140),
        child: buildContactSection(),
      ),
    );

    final policySection = RepaintBoundary(
      child: FadeSlideIn(
        delay: const Duration(milliseconds: 180),
        child: buildPolicySection(),
      ),
    );

    final actionPanel = RepaintBoundary(
      child: AnimatedBuilder(
        animation: _summaryListenable,
        builder: (context, _) {
          return FadeSlideIn(
            delay: const Duration(milliseconds: 220),
            child: _SettingsActionPanel(
              title: texts.actionPanelTitle,
              subtitle: texts.actionPanelSubtitle,
              statusLabel: texts.changeStatusLabel,
              statusValue: _hasUnsavedChanges
                  ? texts.pendingChangesValue
                  : texts.savedChangesValue,
              statusDescription: _hasUnsavedChanges
                  ? texts.pendingDescription
                  : texts.savedDescription,
              profileProgressLabel: texts.profileProgressLabel,
              profileProgressValue: texts.fieldsProgressLabel(
                _completedPrimaryFields,
                7,
              ),
              profileProgressFraction: _completedPrimaryFields / 7,
              avatarLabel: texts.avatarStatusLabel,
              avatarValue: (_avatarUrl?.trim().isNotEmpty ?? false)
                  ? texts.avatarUploadedBadge
                  : texts.avatarDefaultBadge,
              vatLabel: texts.vatLabel,
              vatValue: '$_profileVatPercent%',
              isSaving: _isSaving,
              saveLabel: texts.saveLabel,
              resetLabel: texts.resetAction,
              onSave: _handleSave,
              onReset: _resetToDefaults,
            ),
          );
        },
      ),
    );

    Widget bodyContent;
    if (_isLoading) {
      bodyContent = const _AccountSettingsLoadingSkeleton();
    } else if (isDesktopWide) {
      bodyContent = Form(
        key: _formKey,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
          children: [
            overviewCard,
            const SizedBox(height: 18),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 7,
                  child: Column(
                    children: [
                      businessSection,
                      const SizedBox(height: 16),
                      contactSection,
                      const SizedBox(height: 16),
                      policySection,
                    ],
                  ),
                ),
                const SizedBox(width: 18),
                Expanded(
                  flex: 5,
                  child: Column(
                    children: [
                      avatarSection,
                      const SizedBox(height: 16),
                      actionPanel,
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    } else {
      bodyContent = Form(
        key: _formKey,
        autovalidateMode: AutovalidateMode.onUserInteraction,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          children: [
            overviewCard,
            const SizedBox(height: 16),
            avatarSection,
            const SizedBox(height: 16),
            businessSection,
            const SizedBox(height: 16),
            contactSection,
            const SizedBox(height: 16),
            policySection,
            const SizedBox(height: 16),
            actionPanel,
          ],
        ),
      );
    }

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
        backgroundColor: colors.surface,
        appBar: AppBar(
          leading: DealerFallbackBackButton(
            fallbackPath: DealerRoutePath.home,
            onFallbackPressed: _handleRootFallback,
          ),
          title: BrandAppBarTitle(texts.screenTitle),
          surfaceTintColor: Colors.transparent,
          scrolledUnderElevation: 0,
          actions: [
            if (!_isLoading && _hasUnsavedChanges)
              Padding(
                padding: const EdgeInsets.only(right: 4),
                child: TextButton(
                  onPressed: _isSaving ? null : _handleSave,
                  child: Text(texts.saveActionShort),
                ),
              ),
            IconButton(
              tooltip: texts.resetTooltip,
              onPressed: _isLoading || _isSaving ? null : _resetToDefaults,
              icon: const Icon(Icons.restore_outlined),
            ),
          ],
        ),
        body: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: contentMaxWidth),
            child: bodyContent,
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
      ? 'Phone number must be 10 digits and start with 0.'
      : 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.';

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

  String get saveActionShort => isEnglish ? 'Save' : 'Lưu';

  String get avatarTitle => isEnglish ? 'Avatar' : 'Ảnh đại diện';

  String get avatarHint => isEnglish
      ? 'Upload a dealer avatar to make your profile easier to recognize across account, support and order screens.'
      : 'Tải ảnh đại diện để hồ sơ đại lý dễ nhận diện hơn trên các màn tài khoản, hỗ trợ và đơn hàng.';

  String get uploadAvatarLabel => isEnglish ? 'Upload avatar' : 'Tải avatar';

  String get replaceAvatarLabel => isEnglish ? 'Replace avatar' : 'Đổi avatar';

  String get removeAvatarLabel => isEnglish ? 'Remove avatar' : 'Xóa avatar';

  String get avatarUploadedBadge =>
      isEnglish ? 'Custom avatar ready' : 'Đã có avatar riêng';

  String get avatarDefaultBadge =>
      isEnglish ? 'Using default avatar' : 'Đang dùng avatar mặc định';

  String get companyTitle =>
      isEnglish ? 'Business information' : 'Thông tin doanh nghiệp';

  String get companySubtitle => isEnglish
      ? 'Primary identity information shown across dealer-facing flows.'
      : 'Thông tin nhận diện chính của doanh nghiệp hiển thị xuyên suốt các luồng dành cho đại lý.';

  String get shippingTitle =>
      isEnglish ? 'Shipping and contact' : 'Địa chỉ giao hàng và liên hệ';

  String get shippingSubtitle => isEnglish
      ? 'Contact channels and delivery address used for coordination and order fulfillment.'
      : 'Thông tin liên hệ và địa chỉ giao hàng dùng cho phối hợp xử lý và giao nhận đơn hàng.';

  String get addressLineLabel =>
      isEnglish ? 'Street address' : 'Số nhà, tên đường';

  String get wardLabel => isEnglish ? 'Ward / Commune' : 'Phường / Xã';

  String get districtLabel => isEnglish ? 'District' : 'Quận / Huyện';

  String get cityLabel => isEnglish ? 'Province / City' : 'Tỉnh / Thành phố';

  String get countryLabel => isEnglish ? 'Country' : 'Quốc gia';

  String get policyTitle => isEnglish ? 'Sales policy' : 'Chính sách bán hàng';

  String get policySubtitle => isEnglish
      ? 'Summarize sales terms, commitments or dealer-specific notes used in commercial communication.'
      : 'Tóm tắt điều khoản bán hàng, cam kết hoặc ghi chú riêng của đại lý dùng trong giao tiếp thương mại.';

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

  String get overviewSubtitle => isEnglish
      ? 'Manage dealer identity, avatar, shipping details and policy in one place.'
      : 'Quản lý hồ sơ đại lý, avatar, địa chỉ giao hàng và chính sách tại một nơi.';

  String get unsavedBadge =>
      isEnglish ? 'Unsaved changes' : 'Có thay đổi chưa lưu';

  String get savedBadge =>
      isEnglish ? 'All changes saved' : 'Mọi thay đổi đã được lưu';

  String get actionPanelTitle =>
      isEnglish ? 'Save and review' : 'Kiểm tra và lưu';

  String get actionPanelSubtitle => isEnglish
      ? 'Review the current editing status before saving your profile.'
      : 'Kiểm tra trạng thái chỉnh sửa hiện tại trước khi lưu hồ sơ.';

  String get changeStatusLabel =>
      isEnglish ? 'Change status' : 'Trạng thái chỉnh sửa';

  String get pendingChangesValue => isEnglish ? 'Pending save' : 'Đang chờ lưu';

  String get savedChangesValue => isEnglish ? 'Saved' : 'Đã lưu';

  String get pendingDescription => isEnglish
      ? 'You still have local changes that have not been confirmed yet.'
      : 'Bạn vẫn còn thay đổi cục bộ chưa được xác nhận lưu.';

  String get savedDescription => isEnglish
      ? 'Profile values on screen are already in sync with the saved version.'
      : 'Dữ liệu trên màn hình đã đồng bộ với phiên bản đã lưu.';

  String get profileProgressLabel =>
      isEnglish ? 'Main fields' : 'Trường thông tin chính';

  String fieldsProgressLabel(int completed, int total) => isEnglish
      ? '$completed / $total completed'
      : '$completed / $total đã nhập';

  String get avatarStatusLabel =>
      isEnglish ? 'Avatar status' : 'Trạng thái avatar';

  String get vatLabel => isEnglish ? 'VAT' : 'VAT';

  String get emptyValuePlaceholder =>
      isEnglish ? 'Not updated yet' : 'Chưa cập nhật';
}

class _SettingsHeroCard extends StatelessWidget {
  const _SettingsHeroCard({
    required this.avatar,
    required this.title,
    required this.subtitle,
    required this.contactName,
    required this.email,
    required this.phone,
    required this.hasPendingChanges,
    required this.pendingLabel,
    required this.savedLabel,
  });

  final Widget avatar;
  final String title;
  final String subtitle;
  final String contactName;
  final String email;
  final String phone;
  final bool hasPendingChanges;
  final String pendingLabel;
  final String savedLabel;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            colors.surfaceContainerHigh.withValues(alpha: 0.98),
            colors.surfaceContainer.withValues(alpha: 0.94),
          ],
        ),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: 0.55),
        ),
        boxShadow: [
          BoxShadow(
            color: colors.shadow.withValues(alpha: 0.03),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final compact = constraints.maxWidth < 620;
                if (compact) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          avatar,
                          const SizedBox(width: 14),
                          Expanded(
                            child: _SettingsStateBadge(
                              icon: hasPendingChanges
                                  ? Icons.pending_actions_outlined
                                  : Icons.check_circle_outline,
                              label: hasPendingChanges
                                  ? pendingLabel
                                  : savedLabel,
                              isActive: hasPendingChanges,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        title,
                        style: textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: colors.onSurface,
                          height: 1.15,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        subtitle,
                        style: textTheme.bodyMedium?.copyWith(
                          color: colors.onSurfaceVariant,
                          height: 1.45,
                        ),
                      ),
                    ],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    avatar,
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: colors.onSurface,
                              height: 1.15,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            subtitle,
                            style: textTheme.bodyMedium?.copyWith(
                              color: colors.onSurfaceVariant,
                              height: 1.45,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    _SettingsStateBadge(
                      icon: hasPendingChanges
                          ? Icons.pending_actions_outlined
                          : Icons.check_circle_outline,
                      label: hasPendingChanges ? pendingLabel : savedLabel,
                      isActive: hasPendingChanges,
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 18),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _SettingsInfoChip(
                  icon: Icons.person_outline,
                  label: contactName,
                ),
                _SettingsInfoChip(icon: Icons.mail_outline, label: email),
                _SettingsInfoChip(icon: Icons.phone_outlined, label: phone),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingsInfoChip extends StatelessWidget {
  const _SettingsInfoChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: colors.onSurfaceVariant),
          const SizedBox(width: 8),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 240),
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsStateBadge extends StatelessWidget {
  const _SettingsStateBadge({
    required this.icon,
    required this.label,
    required this.isActive,
  });

  final IconData icon;
  final String label;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final background = isActive
        ? colors.primary.withValues(alpha: 0.12)
        : colors.surfaceContainerLow;
    final foreground = isActive ? colors.primary : colors.onSurfaceVariant;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: isActive
              ? colors.primary.withValues(alpha: 0.28)
              : colors.outlineVariant.withValues(alpha: 0.5),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: foreground),
          const SizedBox(width: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: foreground,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsActionPanel extends StatelessWidget {
  const _SettingsActionPanel({
    required this.title,
    required this.subtitle,
    required this.statusLabel,
    required this.statusValue,
    required this.statusDescription,
    required this.profileProgressLabel,
    required this.profileProgressValue,
    required this.profileProgressFraction,
    required this.avatarLabel,
    required this.avatarValue,
    required this.vatLabel,
    required this.vatValue,
    required this.isSaving,
    required this.saveLabel,
    required this.resetLabel,
    required this.onSave,
    required this.onReset,
  });

  final String title;
  final String subtitle;
  final String statusLabel;
  final String statusValue;
  final String statusDescription;
  final String profileProgressLabel;
  final String profileProgressValue;
  final double profileProgressFraction;
  final String avatarLabel;
  final String avatarValue;
  final String vatLabel;
  final String vatValue;
  final bool isSaving;
  final String saveLabel;
  final String resetLabel;
  final VoidCallback onSave;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final progressValue = profileProgressFraction.clamp(0.0, 1.0).toDouble();

    return SectionCard(
      title: title,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: colors.onSurfaceVariant,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              color: colors.surfaceContainerLow,
              border: Border.all(
                color: colors.outlineVariant.withValues(alpha: 0.5),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ActionSummaryRow(label: statusLabel, value: statusValue),
                const SizedBox(height: 8),
                Text(
                  statusDescription,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: progressValue,
                    minHeight: 8,
                    backgroundColor: colors.surface.withValues(alpha: 0.55),
                    valueColor: AlwaysStoppedAnimation<Color>(colors.primary),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          _ActionSummaryRow(
            label: profileProgressLabel,
            value: profileProgressValue,
          ),
          const SizedBox(height: 10),
          _ActionSummaryRow(label: avatarLabel, value: avatarValue),
          const SizedBox(height: 10),
          _ActionSummaryRow(label: vatLabel, value: vatValue),
          const SizedBox(height: 18),
          LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 420;
              if (compact) {
                return Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: isSaving ? null : onReset,
                        icon: const Icon(Icons.restore_outlined),
                        label: Text(resetLabel),
                      ),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: isSaving ? null : onSave,
                        icon: isSaving
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.4,
                                ),
                              )
                            : const Icon(Icons.save_outlined),
                        label: Text(saveLabel),
                      ),
                    ),
                  ],
                );
              }

              return Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: isSaving ? null : onReset,
                      icon: const Icon(Icons.restore_outlined),
                      label: Text(resetLabel),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: isSaving ? null : onSave,
                      icon: isSaving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.4,
                              ),
                            )
                          : const Icon(Icons.save_outlined),
                      label: Text(saveLabel),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ActionSummaryRow extends StatelessWidget {
  const _ActionSummaryRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return LayoutBuilder(
      builder: (context, constraints) {
        final shouldStack = constraints.maxWidth < 260;
        if (shouldStack) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                value,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          );
        }

        return Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.onSurfaceVariant,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Flexible(
              child: Text(
                value,
                textAlign: TextAlign.right,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _AvatarPreview extends StatelessWidget {
  const _AvatarPreview({
    required this.imageProvider,
    required this.fallbackLabel,
    this.radius = 34,
  });

  final ImageProvider<Object>? imageProvider;
  final String fallbackLabel;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return CircleAvatar(
      radius: radius,
      backgroundColor: colors.primaryContainer,
      backgroundImage: imageProvider,
      child: imageProvider == null
          ? Text(
              fallbackLabel,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: colors.onPrimaryContainer,
                fontWeight: FontWeight.w800,
              ),
            )
          : null,
    );
  }
}

class _AccountSettingsLoadingSkeleton extends StatelessWidget {
  const _AccountSettingsLoadingSkeleton();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: const [
        _SkeletonCard(height: 180),
        SizedBox(height: 16),
        _SkeletonCard(height: 180),
        SizedBox(height: 16),
        _SkeletonCard(height: 340),
        SizedBox(height: 16),
        _SkeletonCard(height: 220),
      ],
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard({required this.height});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.35),
        ),
      ),
      child: SkeletonBox(
        width: double.infinity,
        height: height,
        borderRadius: const BorderRadius.all(Radius.circular(18)),
      ),
    );
  }
}
