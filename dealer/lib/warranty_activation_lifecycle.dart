// ignore_for_file: invalid_use_of_protected_member

part of 'warranty_activation_screen.dart';

extension _WarrantyActivationLifecycle on _WarrantyActivationScreenState {
  Future<void> _initializeScreen() async {
    if (_phase == _ActivationPhase.syncing ||
        _phase == _ActivationPhase.prefilling ||
        _phase == _ActivationPhase.submitting) {
      return;
    }
    if (mounted) {
      setState(() {
        _phase = _ActivationPhase.syncing;
        _phaseError = null;
      });
    }
    try {
      await _initializeScreenImpl();
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

  Future<void> _initializeScreenImpl() async {
    final texts = _texts;
    final orderController = OrderScope.of(context);
    final warrantyController = WarrantyScope.of(context);
    await Future.wait<void>([
      orderController.refresh(),
      warrantyController.load(forceRefresh: true),
    ]);
    final warnings = <String>[];
    if (orderController.lastActionMessage != null) {
      warnings.add(
        orderControllerErrorMessage(
          orderController.lastActionMessage,
          isEnglish: texts.isEnglish,
        ),
      );
    }
    if (warrantyController.lastSyncMessage != null) {
      warnings.add(
        warrantySyncErrorMessage(
          warrantyController.lastSyncMessage,
          isEnglish: texts.isEnglish,
        ),
      );
    }
    _initialSyncWarning = warnings.isEmpty ? null : warnings.join('\n');

    if (!mounted) {
      return;
    }
    setState(() {
      _phase = _ActivationPhase.prefilling;
      _phaseError = null;
    });
    final order = orderController.findById(widget.orderId);
    if (order == null) {
      setState(() {
        _phase = _ActivationPhase.ready;
        _phaseError = null;
      });
      return;
    }

    setState(() {
      _syncSerialInputs(order, warrantyController);
      _applyPrefilledSerial(order, warrantyController);
      _prefillCustomerFromOrder(order);
      _purchaseDate = DateUtils.dateOnly(order.createdAt.toLocal());
      _phase = _ActivationPhase.ready;
      _phaseError = null;
    });
  }
}
