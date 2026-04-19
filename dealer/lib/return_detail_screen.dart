import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_settings_controller.dart';
import 'dealer_navigation.dart';
import 'global_search.dart';
import 'return_request_service.dart';
import 'return_request_ui_support.dart';
import 'utils.dart';
import 'widgets/brand_identity.dart';
import 'widgets/fade_slide_in.dart';
import 'widgets/section_card.dart';

_DealerReturnDetailTexts _dealerReturnDetailTexts(BuildContext context) =>
    _DealerReturnDetailTexts(
      isEnglish: AppSettingsScope.of(context).locale.languageCode == 'en',
    );

void _leaveReturnDetail(BuildContext context) {
  final navigator = Navigator.of(context);
  if (navigator.canPop()) {
    navigator.maybePop();
    return;
  }
  context.goToDealerReturns();
}

class DealerReturnDetailScreen extends StatefulWidget {
  const DealerReturnDetailScreen({
    super.key,
    required this.requestId,
    this.returnRequestService,
  });

  final int requestId;
  final ReturnRequestService? returnRequestService;

  @override
  State<DealerReturnDetailScreen> createState() =>
      _DealerReturnDetailScreenState();
}

class _DealerReturnDetailScreenState extends State<DealerReturnDetailScreen> {
  late final ReturnRequestService _returnService;
  DealerReturnRequestDetailRecord? _detail;
  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _returnService = widget.returnRequestService ?? ReturnRequestService();
    unawaited(_loadDetail());
  }

  @override
  void dispose() {
    if (widget.returnRequestService == null) {
      _returnService.close();
    }
    super.dispose();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final detail = await _returnService.fetchDetail(widget.requestId);
      if (!mounted) {
        return;
      }
      setState(() {
        _detail = detail;
      });
    } on ReturnRequestException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = resolveReturnServiceMessage(
          error.message,
          isEnglish: _dealerReturnDetailTexts(context).isEnglish,
        );
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _cancelRequest() async {
    final detail = _detail;
    if (detail == null) {
      return;
    }
    final texts = _dealerReturnDetailTexts(context);
    final shouldCancel = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text(texts.cancelConfirmTitle),
          content: Text(texts.cancelConfirmMessage),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(texts.cancelConfirmNo),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(texts.cancelConfirmYes),
            ),
          ],
        );
      },
    );
    if (shouldCancel != true || !mounted) {
      return;
    }

    setState(() => _isSaving = true);
    try {
      final updated = await _returnService.cancelRequest(detail.id);
      if (!mounted) {
        return;
      }
      setState(() {
        _detail = updated;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(texts.cancelSuccessMessage)));
    } on ReturnRequestException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            resolveReturnServiceMessage(
              error.message,
              isEnglish: texts.isEnglish,
            ),
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<void> _openAttachment(String url) async {
    final uri = Uri.tryParse(url.trim());
    if (uri == null) {
      return;
    }
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final texts = _dealerReturnDetailTexts(context);
    final detail = _detail;
    final reasonCode = detail?.reasonCode ?? '-';
    final reasonDetail = detail?.reasonDetail ?? '-';
    final canPop = Navigator.of(context).canPop();

    return Scaffold(
      appBar: AppBar(
        title: BrandAppBarTitle(texts.screenTitle),
        leading: canPop
            ? null
            : IconButton(
                tooltip: texts.backAction,
                onPressed: () => _leaveReturnDetail(context),
                icon: const Icon(Icons.arrow_back_rounded),
              ),
        actions: const [GlobalSearchIconButton()],
      ),
      body: RefreshIndicator(
        onRefresh: _loadDetail,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
          children: [
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 28),
                  child: CircularProgressIndicator(strokeWidth: 2.4),
                ),
              )
            else if (_errorMessage != null || detail == null)
              FadeSlideIn(
                child: SectionCard(
                  title: texts.loadFailedTitle,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_errorMessage ?? texts.notFoundMessage),
                      const SizedBox(height: 10),
                      OutlinedButton(
                        onPressed: _loadDetail,
                        child: Text(texts.retryAction),
                      ),
                    ],
                  ),
                ),
              )
            else ...[
              FadeSlideIn(
                child: SectionCard(
                  title: detail.requestCode.isEmpty
                      ? '#${detail.id}'
                      : detail.requestCode,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _MetaBadge(
                            icon: Icons.receipt_long_outlined,
                            label: '${texts.orderLabel}: ${detail.orderCode}',
                          ),
                          _MetaBadge(
                            icon: Icons.assignment_return_outlined,
                            label: dealerReturnTypeLabel(
                              detail.type,
                              isEnglish: texts.isEnglish,
                            ),
                          ),
                          _MetaBadge(
                            icon: Icons.tune_rounded,
                            label: dealerReturnResolutionLabel(
                              detail.requestedResolution,
                              isEnglish: texts.isEnglish,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _StatusPill(status: detail.status),
                      const SizedBox(height: 10),
                      Text(
                        texts.requestedAtLabel(
                          detail.requestedAt == null
                              ? '-'
                              : formatDateTime(detail.requestedAt!),
                        ),
                      ),
                      if (detail.reasonCode != null ||
                          detail.reasonDetail != null) ...[
                        const SizedBox(height: 8),
                        Text('${texts.reasonLabel}: $reasonCode'),
                        const SizedBox(height: 4),
                        Text('${texts.reasonDetailLabel}: $reasonDetail'),
                      ],
                      if (detail.supportTicketId != null) ...[
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: () => context.pushDealerSupport(
                            ticketId: detail.supportTicketId,
                          ),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Text(
                              texts.linkedSupportTicket(
                                detail.supportTicketId!,
                              ),
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.primary,
                                    decoration: TextDecoration.underline,
                                  ),
                            ),
                          ),
                        ),
                      ],
                      if (dealerReturnStatusCanCancel(detail.status)) ...[
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: _isSaving ? null : _cancelRequest,
                          icon: _isSaving
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.close_rounded),
                          label: Text(texts.cancelAction),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 40),
                child: SectionCard(
                  title: texts.itemsTitle(detail.items.length),
                  child: Column(
                    children: [
                      for (
                        var index = 0;
                        index < detail.items.length;
                        index++
                      ) ...[
                        _ReturnItemCard(item: detail.items[index]),
                        if (index != detail.items.length - 1)
                          const Divider(height: 16),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 80),
                child: SectionCard(
                  title: texts.attachmentsTitle,
                  child: (detail.attachments.isEmpty)
                      ? Text(texts.noAttachments)
                      : Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          children: detail.attachments
                              .map(
                                (attachment) => InkWell(
                                  onTap: () => _openAttachment(attachment.url),
                                  borderRadius: BorderRadius.circular(14),
                                  child: Container(
                                    constraints: const BoxConstraints(
                                      minWidth: 180,
                                      maxWidth: 260,
                                    ),
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(14),
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.surfaceContainerLow,
                                      border: Border.all(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .outlineVariant
                                            .withValues(alpha: 0.7),
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          attachment.fileName ?? attachment.url,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodyMedium
                                              ?.copyWith(
                                                fontWeight: FontWeight.w700,
                                              ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          _attachmentCategoryLabel(
                                            attachment.category,
                                            isEnglish: texts.isEnglish,
                                          ),
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall
                                              ?.copyWith(
                                                color: Theme.of(
                                                  context,
                                                ).colorScheme.onSurfaceVariant,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              )
                              .toList(growable: false),
                        ),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 120),
                child: SectionCard(
                  title: texts.timelineTitle,
                  child: (detail.events.isEmpty)
                      ? Text(texts.noTimeline)
                      : Column(
                          children: [
                            for (var i = 0; i < detail.events.length; i++) ...[
                              _ReturnEventTile(event: detail.events[i]),
                              if (i != detail.events.length - 1)
                                const Divider(height: 14),
                            ],
                          ],
                        ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final DealerReturnRequestStatus status;

  @override
  Widget build(BuildContext context) {
    final texts = _dealerReturnDetailTexts(context);
    final foreground = dealerReturnStatusForeground(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: dealerReturnStatusBackground(status),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: foreground.withValues(alpha: 0.26)),
      ),
      child: Text(
        dealerReturnStatusLabel(status, isEnglish: texts.isEnglish),
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: foreground,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _ReturnItemCard extends StatelessWidget {
  const _ReturnItemCard({required this.item});

  final DealerReturnRequestItemRecord item;

  @override
  Widget build(BuildContext context) {
    final texts = _dealerReturnDetailTexts(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          item.serialSnapshot,
          style: Theme.of(
            context,
          ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 4),
        Text(
          '${item.productName} • ${item.productSku}',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _MetaBadge(
              icon: Icons.flag_outlined,
              label: _itemStatusLabel(
                item.itemStatus,
                isEnglish: texts.isEnglish,
              ),
            ),
            if (item.conditionOnRequest != null)
              _MetaBadge(
                icon: Icons.info_outline,
                label: dealerItemConditionLabel(
                  item.conditionOnRequest!,
                  isEnglish: texts.isEnglish,
                ),
              ),
            if (item.finalResolution != null)
              _MetaBadge(
                icon: Icons.task_alt_outlined,
                label: _finalResolutionLabel(
                  item.finalResolution!,
                  isEnglish: texts.isEnglish,
                ),
              ),
          ],
        ),
        if (item.adminDecisionNote != null) ...[
          const SizedBox(height: 6),
          Text('${texts.adminNoteLabel}: ${item.adminDecisionNote}'),
        ],
        if (item.inspectionNote != null) ...[
          const SizedBox(height: 4),
          Text('${texts.inspectionNoteLabel}: ${item.inspectionNote}'),
        ],
        if (item.replacementOrderId != null) ...[
          const SizedBox(height: 4),
          Text('Replacement order: #${item.replacementOrderId}'),
        ],
        if (item.replacementSerialId != null) ...[
          const SizedBox(height: 4),
          Text('Replacement serial: #${item.replacementSerialId}'),
        ],
        if (item.refundAmount != null) ...[
          const SizedBox(height: 4),
          Text('Refund amount: ${item.refundAmount}'),
        ],
        if (item.creditAmount != null) ...[
          const SizedBox(height: 4),
          Text('Credit amount: ${item.creditAmount}'),
        ],
        if (item.orderAdjustmentId != null) ...[
          const SizedBox(height: 4),
          Text('Adjustment ref: #${item.orderAdjustmentId}'),
        ],
      ],
    );
  }
}

class _ReturnEventTile extends StatelessWidget {
  const _ReturnEventTile({required this.event});

  final DealerReturnRequestEventRecord event;

  @override
  Widget build(BuildContext context) {
    final texts = _dealerReturnDetailTexts(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          event.eventType,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        Text(
          texts.eventMeta(
            event.actorRole ?? 'SYSTEM',
            event.actor ?? '-',
            event.createdAt == null ? '-' : formatDateTime(event.createdAt!),
          ),
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
        if (event.payloadJson != null &&
            event.payloadJson!.trim().isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            event.payloadJson!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ],
    );
  }
}

class _MetaBadge extends StatelessWidget {
  const _MetaBadge({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: colors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: colors.outlineVariant.withValues(alpha: 0.7)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: colors.primary),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

String _itemStatusLabel(
  DealerReturnRequestItemStatus status, {
  required bool isEnglish,
}) {
  switch (status) {
    case DealerReturnRequestItemStatus.requested:
      return isEnglish ? 'Requested' : 'Da yeu cau';
    case DealerReturnRequestItemStatus.approved:
      return isEnglish ? 'Approved' : 'Da duyet';
    case DealerReturnRequestItemStatus.rejected:
      return isEnglish ? 'Rejected' : 'Bi tu choi';
    case DealerReturnRequestItemStatus.received:
      return isEnglish ? 'Received' : 'Da tiep nhan';
    case DealerReturnRequestItemStatus.inspecting:
      return isEnglish ? 'Inspecting' : 'Dang kiem dinh';
    case DealerReturnRequestItemStatus.qcPassed:
      return isEnglish ? 'QC passed' : 'Dat kiem dinh';
    case DealerReturnRequestItemStatus.qcFailed:
      return isEnglish ? 'QC failed' : 'Khong dat kiem dinh';
    case DealerReturnRequestItemStatus.restocked:
      return isEnglish ? 'Restocked' : 'Nhap lai kho';
    case DealerReturnRequestItemStatus.scrapped:
      return isEnglish ? 'Scrapped' : 'Da huy';
    case DealerReturnRequestItemStatus.replaced:
      return isEnglish ? 'Replaced' : 'Da doi moi';
    case DealerReturnRequestItemStatus.credited:
      return isEnglish ? 'Credited' : 'Da ghi co';
    case DealerReturnRequestItemStatus.repaired:
      return isEnglish ? 'Repaired' : 'Da sua';
    case DealerReturnRequestItemStatus.returnedToCustomer:
      return isEnglish ? 'Returned to customer' : 'Tra khach';
    case DealerReturnRequestItemStatus.warrantyRejected:
      return isEnglish ? 'Warranty rejected' : 'Tu choi bao hanh';
    case DealerReturnRequestItemStatus.unknown:
      return isEnglish ? 'Unknown' : 'Khong xac dinh';
  }
}

String _finalResolutionLabel(
  DealerReturnRequestItemFinalResolution resolution, {
  required bool isEnglish,
}) {
  switch (resolution) {
    case DealerReturnRequestItemFinalResolution.restock:
      return isEnglish ? 'Restock' : 'Nhap lai kho';
    case DealerReturnRequestItemFinalResolution.replace:
      return isEnglish ? 'Replace' : 'Doi moi';
    case DealerReturnRequestItemFinalResolution.creditNote:
      return isEnglish ? 'Credit note' : 'Bu tru cong no';
    case DealerReturnRequestItemFinalResolution.refund:
      return isEnglish ? 'Refund' : 'Hoan tien';
    case DealerReturnRequestItemFinalResolution.scrap:
      return isEnglish ? 'Scrap' : 'Tieu huy';
    case DealerReturnRequestItemFinalResolution.repair:
      return isEnglish ? 'Repair' : 'Sua chua';
    case DealerReturnRequestItemFinalResolution.returnToCustomer:
      return isEnglish ? 'Return to customer' : 'Tra khach';
    case DealerReturnRequestItemFinalResolution.rejectWarranty:
      return isEnglish ? 'Reject warranty' : 'Tu choi bao hanh';
    case DealerReturnRequestItemFinalResolution.unknown:
      return isEnglish ? 'Unknown' : 'Khong xac dinh';
  }
}

String _attachmentCategoryLabel(
  DealerReturnAttachmentCategory category, {
  required bool isEnglish,
}) {
  switch (category) {
    case DealerReturnAttachmentCategory.proof:
      return isEnglish ? 'Proof' : 'Bang chung';
    case DealerReturnAttachmentCategory.defectPhoto:
      return isEnglish ? 'Defect photo' : 'Anh loi';
    case DealerReturnAttachmentCategory.receipt:
      return isEnglish ? 'Receipt' : 'Hoa don';
    case DealerReturnAttachmentCategory.packing:
      return isEnglish ? 'Packing' : 'Dong goi';
    case DealerReturnAttachmentCategory.other:
      return isEnglish ? 'Other' : 'Khac';
    case DealerReturnAttachmentCategory.unknown:
      return isEnglish ? 'Unknown' : 'Khong xac dinh';
  }
}

class _DealerReturnDetailTexts {
  const _DealerReturnDetailTexts({required this.isEnglish});

  final bool isEnglish;

  String get screenTitle =>
      isEnglish ? 'Return request detail' : 'Chi tiet yeu cau doi tra';
  String get backAction => isEnglish ? 'Back' : 'Quay lai';
  String get loadFailedTitle => isEnglish
      ? 'Unable to load return request'
      : 'Khong the tai yeu cau doi tra';
  String get notFoundMessage => isEnglish
      ? 'Return request not found.'
      : 'Khong tim thay yeu cau doi tra.';
  String get retryAction => isEnglish ? 'Retry' : 'Thu lai';
  String get orderLabel => isEnglish ? 'Order' : 'Don';
  String requestedAtLabel(String value) =>
      isEnglish ? 'Requested at: $value' : 'Thoi diem yeu cau: $value';
  String get reasonLabel => isEnglish ? 'Reason code' : 'Ma ly do';
  String get reasonDetailLabel =>
      isEnglish ? 'Reason detail' : 'Mo ta chi tiet';
  String linkedSupportTicket(int ticketId) => isEnglish
      ? 'Linked support ticket #$ticketId (open support)'
      : 'Ticket ho tro lien ket #$ticketId (mo ho tro)';
  String get cancelAction => isEnglish ? 'Cancel request' : 'Huy yeu cau';
  String get cancelConfirmTitle =>
      isEnglish ? 'Cancel this return request?' : 'Huy yeu cau doi tra nay?';
  String get cancelConfirmMessage => isEnglish
      ? 'You can cancel while warehouse processing has not started yet.'
      : 'Ban chi co the huy khi kho chua bat dau tiep nhan/kiem dinh.';
  String get cancelConfirmNo => isEnglish ? 'Keep request' : 'Giu nguyen';
  String get cancelConfirmYes => isEnglish ? 'Cancel request' : 'Xac nhan huy';
  String get cancelSuccessMessage =>
      isEnglish ? 'Return request was cancelled.' : 'Da huy yeu cau doi tra.';
  String itemsTitle(int count) =>
      isEnglish ? 'Items ($count)' : 'Danh sach serial ($count)';
  String get adminNoteLabel => isEnglish ? 'Admin note' : 'Ghi chu admin';
  String get inspectionNoteLabel =>
      isEnglish ? 'Inspection note' : 'Ghi chu kiem dinh';
  String get attachmentsTitle => isEnglish ? 'Attachments' : 'Tap dinh kem';
  String get noAttachments =>
      isEnglish ? 'No attachments.' : 'Chua co tap dinh kem.';
  String get timelineTitle => isEnglish ? 'Timeline' : 'Lich su xu ly';
  String get noTimeline =>
      isEnglish ? 'No timeline events yet.' : 'Chua co su kien lich su.';
  String eventMeta(String actorRole, String actor, String occurredAt) =>
      '$actorRole • $actor • $occurredAt';
}
