// ignore_for_file: invalid_use_of_protected_member

part of 'warranty_activation_screen.dart';

extension _WarrantyActivationForm on _WarrantyActivationScreenState {
  void _prefillCustomerFromOrder(Order order) {
    if (order.receiverName.trim().isNotEmpty &&
        _customerNameController.text.trim().isEmpty) {
      _customerNameController.text = order.receiverName.trim();
    }
    if (order.receiverPhone.trim().isNotEmpty &&
        _phoneController.text.trim().isEmpty) {
      _phoneController.text = order.receiverPhone.trim();
    }
    if (order.receiverAddress.trim().isNotEmpty &&
        _addressController.text.trim().isEmpty) {
      _addressController.text = order.receiverAddress.trim();
    }
  }

  Future<void> _pickPurchaseDate() async {
    final texts = _texts;
    final now = DateUtils.dateOnly(DateTime.now());
    final order = OrderScope.of(context).findById(widget.orderId);
    final minimumDate = order == null
        ? DateTime(now.year - 5, 1, 1)
        : _minimumPurchaseDateForOrder(order);
    final effectiveFirstDate = minimumDate.isAfter(now) ? now : minimumDate;
    final effectiveInitialDate = _purchaseDate.isBefore(effectiveFirstDate)
        ? effectiveFirstDate
        : (_purchaseDate.isAfter(now) ? now : _purchaseDate);
    final picked = await showDatePicker(
      context: context,
      initialDate: effectiveInitialDate,
      firstDate: effectiveFirstDate,
      lastDate: now,
      helpText: texts.pickPurchaseDateHelp,
    );
    if (!mounted || picked == null) {
      return;
    }
    setState(() {
      _purchaseDate = DateUtils.dateOnly(picked);
    });
  }

  bool _hasOrderCustomerProfile(Order order) {
    return order.receiverName.trim().isNotEmpty ||
        order.receiverPhone.trim().isNotEmpty ||
        order.receiverAddress.trim().isNotEmpty;
  }

  DateTime _minimumPurchaseDateForOrder(Order order) {
    return DateUtils.dateOnly(order.createdAt.toLocal());
  }

  String? _validatePurchaseDateForOrder(Order order) {
    final texts = _texts;
    final normalizedPurchaseDate = DateUtils.dateOnly(_purchaseDate);
    final minimumDate = _minimumPurchaseDateForOrder(order);
    final today = DateUtils.dateOnly(DateTime.now());
    if (normalizedPurchaseDate.isBefore(minimumDate)) {
      return texts.purchaseDateBeforeOrder(formatDate(minimumDate));
    }
    if (normalizedPurchaseDate.isAfter(today)) {
      return texts.purchaseDateAfterToday;
    }
    return null;
  }

  Future<void> _handleSubmit(Order order) async {
    if (_phase != _ActivationPhase.ready) {
      return;
    }
    final texts = _texts;
    final warrantyController = WarrantyScope.of(context);
    final customerName = _customerNameController.text.trim();
    final customerEmail = _emailController.text.trim();
    final customerPhone = _phoneController.text.trim();
    final customerAddress = _addressController.text.trim();

    final preErrors = <String>[];
    if (customerName.isEmpty ||
        customerEmail.isEmpty ||
        customerPhone.isEmpty ||
        customerAddress.isEmpty) {
      preErrors.add(texts.customerInfoRequiredMessage);
    }
    if (customerEmail.isNotEmpty && !isValidEmailAddress(customerEmail)) {
      preErrors.add(texts.invalidEmailMessage);
    }
    if (customerPhone.isNotEmpty && !isValidVietnamPhoneNumber(customerPhone)) {
      preErrors.add(texts.invalidPhoneMessage);
    }
    final purchaseDateError = _validatePurchaseDateForOrder(order);
    if (purchaseDateError != null) preErrors.add(purchaseDateError);
    if (preErrors.isNotEmpty) {
      _showSnackBar(preErrors.join('\n'));
      return;
    }

    final newRecords = <WarrantyActivationRecord>[];
    final localSerialSet = <String>{};
    for (final item in order.items) {
      final serialInputs = _serialControllers[item.product.id] ?? const [];
      for (final controller in serialInputs) {
        final rawSerial = controller.text.trim();
        if (rawSerial.isEmpty) {
          _showSnackBar(texts.serialRequiredForProduct(item.product.name));
          return;
        }

        final normalized = warrantyController.normalizeSerial(rawSerial);
        if (localSerialSet.contains(normalized)) {
          _showSnackBar(texts.duplicateSerialInSubmission(normalized));
          return;
        }
        final serialValidationError = warrantyController
            .validateSerialForActivation(
              serial: normalized,
              productId: item.product.id,
              productName: item.product.name,
              orderId: order.id,
              isEnglish: texts.isEnglish,
            );
        if (serialValidationError != null) {
          _showSnackBar(serialValidationError);
          return;
        }
        localSerialSet.add(normalized);

        newRecords.add(
          WarrantyActivationRecord(
            orderId: order.id,
            productId: item.product.id,
            productName: item.product.name,
            productSku: item.product.sku,
            serial: normalized,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            warrantyMonths: item.product.warrantyMonths,
            activatedAt: DateTime.now(),
            purchaseDate: DateUtils.dateOnly(_purchaseDate),
          ),
        );
      }
    }

    if (newRecords.isEmpty) {
      _showSnackBar(texts.orderAlreadyFullyActivatedMessage);
      return;
    }

    setState(() {
      _phase = _ActivationPhase.submitting;
      _phaseError = null;
    });
    try {
      final success = await warrantyController.addActivations(newRecords);

      if (!mounted) {
        return;
      }

      // Always sync serial inputs so controllers match actual remaining count,
      // even on partial failure where some activations may have succeeded.
      setState(() {
        _syncSerialInputs(order, warrantyController);
        _phase = success ? _ActivationPhase.ready : _ActivationPhase.error;
        _phaseError = success
            ? null
            : warrantySyncErrorMessage(
                warrantyController.lastSyncMessage,
                isEnglish: texts.isEnglish,
              );
      });

      if (!success) {
        return;
      }

      _jumpToTop();
      _showSnackBar(texts.activationSuccessMessage(newRecords.length));
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _phase = _ActivationPhase.error;
        _phaseError = error.toString();
      });
    }
  }

  void _jumpToTop() {
    if (!_scrollController.hasClients) {
      return;
    }
    _scrollController.jumpTo(0);
  }

  void _showSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  void _showSnackBarDeferred(String message) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      _showSnackBar(message);
    });
  }
}
