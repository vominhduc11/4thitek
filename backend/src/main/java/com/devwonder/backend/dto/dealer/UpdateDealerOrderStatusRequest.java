package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateDealerOrderStatusRequest(
        @NotNull(message = "status is required")
        OrderStatus status,
        // Optional free-text reason — used when a dealer raises a cancel request.
        @Size(max = 1000, message = "reason must be 1000 characters or fewer")
        String reason
) {
    /** Convenience constructor for callers that do not supply a reason. */
    public UpdateDealerOrderStatusRequest(OrderStatus status) {
        this(status, null);
    }
}
