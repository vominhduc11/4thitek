// ignore_for_file: invalid_use_of_protected_member

part of 'account_settings_screen.dart';

extension _AccountSettingsActions on _AccountSettingsScreenState {
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
}
