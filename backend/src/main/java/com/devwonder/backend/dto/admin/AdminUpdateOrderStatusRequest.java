package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.OrderStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Admin-only status command. Fulfillment fields are accepted only when an order enters SHIPPING.
 */
public record AdminUpdateOrderStatusRequest(
        @NotNull(message = "status is required")
        OrderStatus status,
        @JsonAlias("cancelReason")
        @Size(max = 1000, message = "reason must be 1000 characters or fewer")
        String reason,
        @Size(max = 120, message = "carrier must be 120 characters or fewer")
        String carrier,
        @Size(max = 200, message = "trackingCode must be 200 characters or fewer")
        String trackingCode
) {
    public AdminUpdateOrderStatusRequest(OrderStatus status) {
        this(status, null, null, null);
    }
}
