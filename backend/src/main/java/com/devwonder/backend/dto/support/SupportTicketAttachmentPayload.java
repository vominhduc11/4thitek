package com.devwonder.backend.dto.support;

public record SupportTicketAttachmentPayload(
        String url,
        String fileName
) {
}
