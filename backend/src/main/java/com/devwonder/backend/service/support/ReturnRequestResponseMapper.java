package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.returns.ReturnRequestAttachmentResponse;
import com.devwonder.backend.dto.returns.ReturnRequestDetailResponse;
import com.devwonder.backend.dto.returns.ReturnRequestEventResponse;
import com.devwonder.backend.dto.returns.ReturnRequestItemResponse;
import com.devwonder.backend.dto.returns.ReturnRequestSummaryResponse;
import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.ReturnRequest;
import com.devwonder.backend.entity.enums.ReturnRequestItemStatus;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

public final class ReturnRequestResponseMapper {

    private ReturnRequestResponseMapper() {
    }

    private static final Set<ReturnRequestItemStatus> TERMINAL_ITEM_STATUSES = EnumSet.of(
            ReturnRequestItemStatus.REJECTED,
            ReturnRequestItemStatus.RESTOCKED,
            ReturnRequestItemStatus.SCRAPPED,
            ReturnRequestItemStatus.REPLACED,
            ReturnRequestItemStatus.CREDITED,
            ReturnRequestItemStatus.REPAIRED,
            ReturnRequestItemStatus.RETURNED_TO_CUSTOMER,
            ReturnRequestItemStatus.WARRANTY_REJECTED
    );

    public static ReturnRequestSummaryResponse toSummaryResponse(ReturnRequest request) {
        int totalItems = request.getItems().size();
        int requestedItems = (int) request.getItems().stream()
                .filter(item -> item.getItemStatus() == ReturnRequestItemStatus.REQUESTED)
                .count();
        int approvedItems = (int) request.getItems().stream()
                .filter(item -> item.getItemStatus() == ReturnRequestItemStatus.APPROVED
                        || item.getItemStatus() == ReturnRequestItemStatus.RECEIVED
                        || item.getItemStatus() == ReturnRequestItemStatus.INSPECTING)
                .count();
        int rejectedItems = (int) request.getItems().stream()
                .filter(item -> item.getItemStatus() == ReturnRequestItemStatus.REJECTED)
                .count();
        int resolvedItems = (int) request.getItems().stream()
                .filter(item -> TERMINAL_ITEM_STATUSES.contains(item.getItemStatus()))
                .count();
        return new ReturnRequestSummaryResponse(
                request.getId(),
                request.getRequestCode(),
                request.getDealer() == null ? null : request.getDealer().getId(),
                resolveDealerName(request.getDealer()),
                request.getOrder() == null ? null : request.getOrder().getId(),
                request.getOrder() == null ? null : request.getOrder().getOrderCode(),
                request.getType(),
                request.getStatus(),
                request.getRequestedResolution(),
                request.getReasonCode(),
                request.getReasonDetail(),
                request.getSupportTicket() == null ? null : request.getSupportTicket().getId(),
                request.getRequestedAt(),
                request.getReviewedAt(),
                request.getReceivedAt(),
                request.getCompletedAt(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                totalItems,
                requestedItems,
                approvedItems,
                rejectedItems,
                resolvedItems
        );
    }

    public static ReturnRequestDetailResponse toDetailResponse(ReturnRequest request) {
        List<ReturnRequestItemResponse> items = request.getItems().stream()
                .map(item -> new ReturnRequestItemResponse(
                        item.getId(),
                        item.getOrderItem() == null ? null : item.getOrderItem().getId(),
                        item.getProduct() == null ? null : item.getProduct().getId(),
                        item.getProduct() == null ? null : item.getProduct().getName(),
                        item.getProduct() == null ? null : item.getProduct().getSku(),
                        item.getProductSerial() == null ? null : item.getProductSerial().getId(),
                        item.getSerialSnapshot(),
                        item.getItemStatus(),
                        item.getConditionOnRequest(),
                        item.getAdminDecisionNote(),
                        item.getInspectionNote(),
                        item.getFinalResolution(),
                        item.getReplacementOrderId(),
                        item.getReplacementSerialId(),
                        item.getRefundAmount(),
                        item.getCreditAmount(),
                        item.getOrderAdjustmentId()
                ))
                .toList();
        List<ReturnRequestAttachmentResponse> attachments = request.getAttachments().stream()
                .map(attachment -> new ReturnRequestAttachmentResponse(
                        attachment.getId(),
                        attachment.getItem() == null ? null : attachment.getItem().getId(),
                        attachment.getMediaAsset() == null ? null : attachment.getMediaAsset().getId(),
                        attachment.getUrl(),
                        attachment.getFileName(),
                        attachment.getCategory()
                ))
                .toList();
        List<ReturnRequestEventResponse> events = request.getEvents().stream()
                .map(event -> new ReturnRequestEventResponse(
                        event.getId(),
                        event.getEventType(),
                        event.getActor(),
                        event.getActorRole(),
                        event.getPayloadJson(),
                        event.getCreatedAt()
                ))
                .toList();
        return new ReturnRequestDetailResponse(
                request.getId(),
                request.getRequestCode(),
                request.getDealer() == null ? null : request.getDealer().getId(),
                resolveDealerName(request.getDealer()),
                request.getOrder() == null ? null : request.getOrder().getId(),
                request.getOrder() == null ? null : request.getOrder().getOrderCode(),
                request.getType(),
                request.getStatus(),
                request.getRequestedResolution(),
                request.getReasonCode(),
                request.getReasonDetail(),
                request.getSupportTicket() == null ? null : request.getSupportTicket().getId(),
                request.getRequestedAt(),
                request.getReviewedAt(),
                request.getReceivedAt(),
                request.getCompletedAt(),
                request.getCreatedBy(),
                request.getUpdatedBy(),
                request.getCreatedAt(),
                request.getUpdatedAt(),
                items,
                attachments,
                events
        );
    }

    private static String resolveDealerName(Dealer dealer) {
        if (dealer == null) {
            return null;
        }
        return firstNonBlank(dealer.getBusinessName(), dealer.getContactName(), dealer.getUsername(), dealer.getEmail());
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
