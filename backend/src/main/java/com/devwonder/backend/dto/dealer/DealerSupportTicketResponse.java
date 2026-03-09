package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.DealerSupportCategory;
import com.devwonder.backend.entity.enums.DealerSupportPriority;
import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import java.time.Instant;

public record DealerSupportTicketResponse(
        Long id,
        String ticketCode,
        DealerSupportCategory category,
        DealerSupportPriority priority,
        DealerSupportTicketStatus status,
        String subject,
        String message,
        Instant createdAt,
        Instant updatedAt
) {
}
