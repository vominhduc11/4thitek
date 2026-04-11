package com.devwonder.backend.dto.support;

import com.devwonder.backend.entity.enums.SupportTicketMessageAuthorRole;
import java.time.Instant;
import java.util.List;

public record SupportTicketMessageResponse(
        Long id,
        SupportTicketMessageAuthorRole authorRole,
        String authorName,
        boolean internalNote,
        String message,
        List<SupportTicketAttachmentResponse> attachments,
        Instant createdAt
) {
}
