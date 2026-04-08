package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.DealerSupportTicketStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAdminSupportTicketRequest(
        @NotNull(message = "status is required")
        DealerSupportTicketStatus status,
        Long assigneeId
) {
}
