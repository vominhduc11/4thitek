package com.devwonder.backend.dto.returns;

import com.devwonder.backend.entity.enums.ReturnRequestResolution;
import com.devwonder.backend.entity.enums.ReturnRequestStatus;
import com.devwonder.backend.entity.enums.ReturnRequestType;
import java.time.Instant;
import java.util.List;

public record ReturnRequestDetailResponse(
        Long id,
        String requestCode,
        Long dealerId,
        String dealerName,
        Long orderId,
        String orderCode,
        ReturnRequestType type,
        ReturnRequestStatus status,
        ReturnRequestResolution requestedResolution,
        String reasonCode,
        String reasonDetail,
        Long supportTicketId,
        Instant requestedAt,
        Instant reviewedAt,
        Instant receivedAt,
        Instant completedAt,
        String createdBy,
        String updatedBy,
        Instant createdAt,
        Instant updatedAt,
        List<ReturnRequestItemResponse> items,
        List<ReturnRequestAttachmentResponse> attachments,
        List<ReturnRequestEventResponse> events
) {
}
