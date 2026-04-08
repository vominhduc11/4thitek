package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.DealerSupportCategory;
import com.devwonder.backend.entity.enums.DealerSupportPriority;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import com.devwonder.backend.dto.support.SupportTicketMessageResponse;
import java.time.Instant;
import java.util.List;

public record AdminSupportTicketResponse(
        Long id,
        Long dealerId,
        String dealerName,
        String ticketCode,
        DealerSupportCategory category,
        DealerSupportPriority priority,
        DealerSupportTicketStatus status,
        String subject,
        String message,
        Long assigneeId,
        String assigneeName,
        List<SupportTicketMessageResponse> messages,
        Instant createdAt,
        Instant updatedAt,
        Instant resolvedAt,
        Instant closedAt
) {
}
