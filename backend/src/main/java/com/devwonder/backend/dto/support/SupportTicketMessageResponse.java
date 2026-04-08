package com.devwonder.backend.dto.support;

import com.devwonder.backend.entity.enums.SupportTicketMessageAuthorRole;
import java.time.Instant;

public record SupportTicketMessageResponse(
        Long id,
        SupportTicketMessageAuthorRole authorRole,
        String authorName,
        boolean internalNote,
        String message,
        Instant createdAt
) {
}
