// ignore_for_file: invalid_use_of_protected_member

part of 'warranty_activation_screen.dart';

extension _WarrantyActivationSerials on _WarrantyActivationScreenState {
  void _syncSerialInputs(Order order, WarrantyController warrantyController) {
    for (final item in order.items) {
      final activated = warrantyController.activationsForItem(
        order.id,
        item.product.id,
      );
      final activatedSerials = activated
          .map((r) => warrantyController.normalizeSerial(r.serial))
          .toSet();
      final remaining = (item.quantity - activated.length).clamp(
        0,
        item.quantity,
      );
      final existing = _serialControllers[item.product.id] ?? [];

      List<TextEditingController> finalList;
      if (existing.length == remaining) {
        finalList = existing;
      } else if (existing.length > remaining) {
        // Remove extra controllers from the end
        final toDispose = existing.sublist(remaining);
        for (final controller in toDispose) {
          controller.dispose();
        }
        finalList = existing.sublist(0, remaining);
        _serialControllers[item.product.id] = finalList;
      } else {
        // Add more controllers
        final toAdd = remaining - existing.length;
        finalList = List<TextEditingController>.from(existing)
          ..addAll(List.generate(toAdd, (_) => TextEditingController()));
        _serialControllers[item.product.id] = finalList;
      }

      // Clear any input whose serial is now activated (e.g. after partial failure)
      for (final controller in finalList) {
        final normalized = warrantyController.normalizeSerial(controller.text);
        if (normalized.isNotEmpty && activatedSerials.contains(normalized)) {
          controller.clear();
        }
      }
    }
    // Remove entries for items no longer in the order
    final productIds = order.items.map((item) => item.product.id).toSet();
    final toRemove = _serialControllers.keys
        .where((id) => !productIds.contains(id))
        .toList();
    for (final id in toRemove) {
      for (final controller in _serialControllers[id]!) {
        controller.dispose();
      }
      _serialControllers.remove(id);
    }
  }

  void _applyPrefilledSerial(
    Order order,
    WarrantyController warrantyController,
  ) {
    final texts = _texts;
    final rawPrefilled = widget.prefilledSerial?.trim();
    if (rawPrefilled == null || rawPrefilled.isEmpty) {
      return;
    }

    final normalized = warrantyController.normalizeSerial(rawPrefilled);
    final imported = warrantyController.findImportedSerial(normalized);
    if (imported == null) {
      _showSnackBarDeferred(texts.serialNotFoundInInventory(normalized));
      return;
    }
    if (imported.orderId != order.id) {
      _showSnackBarDeferred(
        texts.serialBelongsToOtherOrder(normalized, imported.orderId, order.id),
      );
      return;
    }
    if (widget.prefilledProductId != null &&
        widget.prefilledProductId != imported.productId) {
      _showSnackBarDeferred(texts.serialProductMismatch(normalized));
      return;
    }

    final inputList = _serialControllers[imported.productId];
    if (inputList == null || inputList.isEmpty) {
      _showSnackBarDeferred(texts.noEmptySerialSlot(imported.productName));
      return;
    }

    final alreadyFilled = inputList.any(
      (controller) =>
          warrantyController.normalizeSerial(controller.text) == normalized,
    );
    if (alreadyFilled) {
      return;
    }

    TextEditingController? emptySlot;
    for (final controller in inputList) {
      if (controller.text.trim().isEmpty) {
        emptySlot = controller;
        break;
      }
    }
    if (emptySlot == null) {
      _showSnackBarDeferred(texts.productAlreadyFull(imported.productName));
      return;
    }

    emptySlot.text = normalized;
    _showSnackBarDeferred(texts.prefilledSerialAssigned(normalized));
  }

  Future<void> _scanSerialForItem(
    Order order,
    OrderLineItem item,
    WarrantyController warrantyController,
  ) async {
    final texts = _texts;
    final scannedValue = await Navigator.of(
      context,
    ).push<String>(MaterialPageRoute(builder: (_) => const SerialScanScreen()));
    if (!mounted || scannedValue == null) {
      return;
    }

    final result = _assignSerialToItem(
      order: order,
      item: item,
      rawSerial: scannedValue,
      warrantyController: warrantyController,
    );
    switch (result) {
      case _SerialAssignResult.assigned:
        _showSnackBar(texts.scannedSerialAssigned(item.product.name));
        break;
      case _SerialAssignResult.duplicate:
        _showSnackBar(texts.duplicateScannedSerialMessage);
        break;
      case _SerialAssignResult.invalid:
        _showSnackBar(texts.invalidScannedSerialMessage);
        break;
      case _SerialAssignResult.full:
        _showSnackBar(texts.noEmptySerialSlot(item.product.name));
        break;
    }
  }

  Future<void> _showBulkPasteDialog(
    Order order,
    OrderLineItem item,
    WarrantyController warrantyController,
  ) async {
    final texts = _texts;
    final textController = TextEditingController();
    final pastedText = await showDialog<String>(
      context: context,
      traversalEdgeBehavior: TraversalEdgeBehavior.closedLoop,
      requestFocus: true,
      builder: (dialogContext) {
        return AlertDialog(
          scrollable: true,
          insetPadding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 20,
          ),
          title: Text(texts.bulkPasteTitle),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: TextField(
              controller: textController,
              maxLines: 6,
              autofocus: true,
              decoration: InputDecoration(hintText: texts.bulkPasteHint),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(texts.cancelAction),
            ),
            FilledButton(
              onPressed: () =>
                  Navigator.of(dialogContext).pop(textController.text),
              child: Text(texts.fillSerialsAction),
            ),
          ],
        );
      },
    );
    textController.dispose();

    if (!mounted || pastedText == null || pastedText.trim().isEmpty) {
      return;
    }

    final serials = _parseSerialTokens(pastedText, warrantyController);
    if (serials.isEmpty) {
      _showSnackBar(texts.noValidSerialsFoundMessage);
      return;
    }

    var assignedCount = 0;
    var duplicateCount = 0;
    var invalidCount = 0;
    var fullCount = 0;

    for (final serial in serials) {
      final result = _assignSerialToItem(
        order: order,
        item: item,
        rawSerial: serial,
        warrantyController: warrantyController,
      );
      switch (result) {
        case _SerialAssignResult.assigned:
          assignedCount++;
          break;
        case _SerialAssignResult.duplicate:
          duplicateCount++;
          break;
        case _SerialAssignResult.invalid:
          invalidCount++;
          break;
        case _SerialAssignResult.full:
          fullCount++;
          break;
      }
      if (result == _SerialAssignResult.full) {
        break;
      }
    }

    _showSnackBar(
      texts.bulkPasteSummary(
        assignedCount,
        duplicateCount,
        invalidCount,
        fullCount,
      ),
    );
  }

  List<String> _parseSerialTokens(
    String raw,
    WarrantyController warrantyController,
  ) {
    final normalizedSet = <String>{};
    final chunks = raw.split(RegExp(r'[\n,; ]+'));
    for (final token in chunks) {
      final normalized = warrantyController.normalizeSerial(token);
      if (normalized.isNotEmpty) {
        normalizedSet.add(normalized);
      }
    }
    return normalizedSet.toList(growable: false);
  }

  _SerialAssignResult _assignSerialToItem({
    required Order order,
    required OrderLineItem item,
    required String rawSerial,
    required WarrantyController warrantyController,
  }) {
    final texts = _texts;
    final normalized = warrantyController.normalizeSerial(rawSerial);
    if (normalized.isEmpty) {
      return _SerialAssignResult.invalid;
    }

    final imported = warrantyController.findImportedSerial(normalized);
    if (imported == null ||
        imported.orderId != order.id ||
        imported.productId != item.product.id) {
      return _SerialAssignResult.invalid;
    }

    final inputList = _serialControllers[item.product.id] ?? const [];
    if (inputList.isEmpty) {
      return _SerialAssignResult.full;
    }

    final isDuplicate = inputList.any(
      (controller) =>
          warrantyController.normalizeSerial(controller.text) == normalized,
    );
    if (isDuplicate) {
      return _SerialAssignResult.duplicate;
    }

    final validationError = warrantyController.validateSerialForActivation(
      serial: normalized,
      productId: item.product.id,
      productName: item.product.name,
      orderId: order.id,
      isEnglish: texts.isEnglish,
    );
    if (validationError != null) {
      return _SerialAssignResult.invalid;
    }

    TextEditingController? emptySlot;
    for (final controller in inputList) {
      if (controller.text.trim().isEmpty) {
        emptySlot = controller;
        break;
      }
    }
    if (emptySlot == null) {
      return _SerialAssignResult.full;
    }

    setState(() => emptySlot!.text = normalized);
    return _SerialAssignResult.assigned;
  }
}
