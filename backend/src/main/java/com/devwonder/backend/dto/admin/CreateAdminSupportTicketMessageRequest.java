package com.devwonder.backend.dto.admin;

import com.devwonder.backend.dto.support.SupportTicketAttachmentPayload;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateAdminSupportTicketMessageRequest(
        @NotBlank(message = "message is required")
        @Size(max = 1000, message = "message must be at most 1000 characters")
        String message,
        Boolean internalNote,
        List<SupportTicketAttachmentPayload> attachments,
        List<Long> mediaAssetIds
) {
}
