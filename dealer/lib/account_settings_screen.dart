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
import 'widgets/app_input_decoration.dart';
import 'widgets/brand_identity.dart';
import 'widgets/dealer_fallback_back_button.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/responsive_hero_card.dart';
import 'widgets/section_card.dart';
import 'widgets/skeleton_box.dart';

part 'account_settings_actions.dart';
part 'account_settings_texts.dart';
part 'account_settings_widgets.dart';

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
        decoration: buildAppInputDecoration(
          context,
          labelText: texts.businessLabel,
          prefixIcon: const Padding(
            padding: EdgeInsets.all(12),
            child: BrandLogoIcon(size: 20),
          ),
          isRequired: true,
        ),
      );

      final contactField = TextFormField(
        controller: _contactNameController,
        textInputAction: TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        autofillHints: const [AutofillHints.name],
        validator: (value) =>
            _requiredValidator(value, texts.contactRequiredMessage),
        decoration: buildAppInputDecoration(
          context,
          labelText: texts.contactLabel,
          prefixIcon: const Icon(Icons.person_outline),
          isRequired: true,
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
        decoration: buildAppInputDecoration(
          context,
          labelText: texts.emailLabel,
          prefixIcon: const Icon(Icons.mail_outline),
          isRequired: true,
        ),
      );

      final phoneField = TextFormField(
        controller: _phoneController,
        keyboardType: TextInputType.phone,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.telephoneNumber],
        validator: _phoneValidator,
        decoration: buildAppInputDecoration(
          context,
          labelText: texts.phoneLabel,
          prefixIcon: const Icon(Icons.phone_outlined),
          isRequired: true,
        ),
      );

      final addressField = TextFormField(
        controller: _addressLineController,
        textInputAction: TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        autofillHints: const [AutofillHints.streetAddressLine1],
        validator: (value) =>
            _requiredValidator(value, texts.addressLineRequiredMessage),
        decoration: buildAppInputDecoration(
          context,
          labelText: texts.addressLineLabel,
          prefixIcon: const Icon(Icons.location_on_outlined),
          isRequired: true,
        ),
      );

      final wardField = TextFormField(
        controller: _wardController,
        textInputAction: TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        decoration: buildAppInputDecoration(
          context,
          labelText: texts.wardLabel,
          prefixIcon: const Icon(Icons.holiday_village_outlined),
        ),
      );

      final districtField = TextFormField(
        controller: _districtController,
        textInputAction: TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        decoration: buildAppInputDecoration(
          context,
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
        decoration: buildAppInputDecoration(
          context,
          labelText: texts.cityLabel,
          prefixIcon: const Icon(Icons.location_city_outlined),
          isRequired: true,
        ),
      );

      final countryField = TextFormField(
        controller: _countryController,
        textInputAction: TextInputAction.next,
        textCapitalization: TextCapitalization.words,
        autofillHints: const [AutofillHints.countryName],
        decoration: buildAppInputDecoration(
          context,
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
              decoration: buildAppInputDecoration(
                context,
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
            child: ResponsiveHeroCard(
              leading: _AvatarPreview(
                imageProvider: avatarProvider,
                fallbackLabel: avatarFallbackLabel,
                radius: 36,
              ),
              trailingBadge: _SettingsStateBadge(
                icon: _hasUnsavedChanges
                    ? Icons.pending_actions_outlined
                    : Icons.check_circle_outline,
                label: _hasUnsavedChanges
                    ? texts.unsavedBadge
                    : texts.savedBadge,
                isActive: _hasUnsavedChanges,
              ),
              title: fallbackBusinessName,
              subtitle: texts.overviewSubtitle,
              footerChips: [
                _SettingsInfoChip(
                  icon: Icons.person_outline,
                  label: displayOrPlaceholder(_contactNameController.text),
                ),
                _SettingsInfoChip(
                  icon: Icons.mail_outline,
                  label: displayOrPlaceholder(_emailController.text),
                ),
                _SettingsInfoChip(
                  icon: Icons.phone_outlined,
                  label: displayOrPlaceholder(_phoneController.text),
                ),
              ],
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
