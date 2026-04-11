package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.DealerSupportCategory;
import com.devwonder.backend.entity.enums.DealerSupportPriority;
import com.devwonder.backend.dto.support.SupportTicketAttachmentPayload;
import com.devwonder.backend.dto.support.SupportTicketContextPayload;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateDealerSupportTicketRequest(
        @NotNull(message = "category is required")
        DealerSupportCategory category,
        @NotNull(message = "priority is required")
        DealerSupportPriority priority,
        @NotBlank(message = "subject is required")
        @Size(max = 80, message = "subject must be at most 80 characters")
        String subject,
        @NotBlank(message = "message is required")
        @Size(max = 500, message = "message must be at most 500 characters")
        String message,
        SupportTicketContextPayload contextData,
        List<SupportTicketAttachmentPayload> attachments
) {
}
