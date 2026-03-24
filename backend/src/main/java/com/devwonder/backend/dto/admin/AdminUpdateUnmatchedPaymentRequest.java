package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.UnmatchedPaymentStatus;
import jakarta.validation.constraints.NotNull;

public record AdminUpdateUnmatchedPaymentRequest(
        @NotNull(message = "status is required")
        UnmatchedPaymentStatus status,

        String resolution,

        /** Populated when status = MATCHED. */
        Long matchedOrderId
) {
}
