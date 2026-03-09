package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDealerOrderStatusRequest(
        @NotNull(message = "status is required")
        OrderStatus status
) {
}
