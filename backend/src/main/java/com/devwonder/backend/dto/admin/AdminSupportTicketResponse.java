package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.DealerSupportCategory;
import com.devwonder.backend.entity.enums.DealerSupportPriority;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import java.time.Instant;

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
        String adminReply,
        Instant createdAt,
        Instant updatedAt,
        Instant resolvedAt,
        Instant closedAt
) {
}
