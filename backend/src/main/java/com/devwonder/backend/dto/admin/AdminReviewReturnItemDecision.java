package com.devwonder.backend.dto.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminReviewReturnItemDecision(
        @NotNull(message = "itemId is required")
        Long itemId,

        @NotNull(message = "approved is required")
        Boolean approved,

        @Size(max = 1000, message = "decisionNote must be at most 1000 characters")
        String decisionNote
) {
}
