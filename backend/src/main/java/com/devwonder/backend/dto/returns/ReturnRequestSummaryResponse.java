package com.devwonder.backend.dto.returns;

import com.devwonder.backend.entity.enums.ReturnRequestResolution;
import com.devwonder.backend.entity.enums.ReturnRequestStatus;
import com.devwonder.backend.entity.enums.ReturnRequestType;
import java.time.Instant;

public record ReturnRequestSummaryResponse(
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
        Instant createdAt,
        Instant updatedAt,
        int totalItems,
        int requestedItems,
        int approvedItems,
        int rejectedItems,
        int resolvedItems
) {
}
