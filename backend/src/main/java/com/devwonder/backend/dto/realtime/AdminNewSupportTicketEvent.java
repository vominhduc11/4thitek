package com.devwonder.backend.dto.realtime;

import com.devwonder.backend.entity.enums.DealerSupportCategory;
import com.devwonder.backend.entity.enums.DealerSupportPriority;
import java.time.Instant;

public record AdminNewSupportTicketEvent(
        Long ticketId,
        String ticketCode,
        Long dealerId,
        String dealerName,
        DealerSupportCategory category,
        DealerSupportPriority priority,
        String subject,
        Instant createdAt
) {
}
