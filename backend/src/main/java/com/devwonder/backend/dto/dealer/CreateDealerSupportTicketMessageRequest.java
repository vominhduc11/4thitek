package com.devwonder.backend.dto.dealer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDealerSupportTicketMessageRequest(
        @NotBlank(message = "message is required")
        @Size(max = 1000, message = "message must be at most 1000 characters")
        String message
) {
}
