package com.devwonder.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAdminSupportTicketMessageRequest(
        @NotBlank(message = "message is required")
        @Size(max = 1000, message = "message must be at most 1000 characters")
        String message,
        Boolean internalNote
) {
}
