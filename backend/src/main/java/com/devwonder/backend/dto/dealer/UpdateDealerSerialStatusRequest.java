package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.ProductSerialStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateDealerSerialStatusRequest(
        @NotNull(message = "status is required")
        ProductSerialStatus status
) {
}
