package com.devwonder.backend.dto.support;

import com.devwonder.backend.entity.enums.MediaType;
import java.time.Instant;

public record SupportTicketAttachmentResponse(
        Long id,
        String url,
        String accessUrl,
        String fileName,
        MediaType mediaType,
        String contentType,
        Long sizeBytes,
        Instant createdAt
) {
    public SupportTicketAttachmentResponse(String url, String fileName) {
        this(null, url, url, fileName, null, null, null, null);
    }
}
