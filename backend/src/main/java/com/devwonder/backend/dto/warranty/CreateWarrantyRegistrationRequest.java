package com.devwonder.backend.dto.warranty;

import com.devwonder.backend.entity.enums.WarrantyStatus;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CreateWarrantyRegistrationRequest(
        @NotNull(message = "productSerialId is required")
        Long productSerialId,
        Long dealerId,
        Long customerId,
        Long orderId,
        Instant warrantyStart,
        Instant warrantyEnd,
        WarrantyStatus status
) {
}
