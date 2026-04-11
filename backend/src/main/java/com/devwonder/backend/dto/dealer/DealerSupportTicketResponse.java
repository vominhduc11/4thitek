package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.DealerSupportCategory;
import com.devwonder.backend.entity.enums.DealerSupportPriority;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import com.devwonder.backend.dto.support.SupportTicketMessageResponse;
import com.devwonder.backend.dto.support.SupportTicketContextPayload;
import java.time.Instant;
import java.util.List;

public record DealerSupportTicketResponse(
        Long id,
        String ticketCode,
        DealerSupportCategory category,
        DealerSupportPriority priority,
        DealerSupportTicketStatus status,
        String subject,
        String message,
        SupportTicketContextPayload contextData,
        Long assigneeId,
        String assigneeName,
        List<SupportTicketMessageResponse> messages,
        Instant createdAt,
        Instant updatedAt,
        Instant resolvedAt,
        Instant closedAt
) {
}
