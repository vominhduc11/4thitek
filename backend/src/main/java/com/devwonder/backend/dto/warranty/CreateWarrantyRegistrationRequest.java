package com.devwonder.backend.dto.warranty;

import com.devwonder.backend.entity.enums.WarrantyStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CreateWarrantyRegistrationRequest(
        @NotNull(message = "productSerialId is required")
        Long productSerialId,
        Long dealerId,
        Long customerId,
        Long orderId,
        String customerName,
        @Email(message = "customerEmail must be a valid email")
        String customerEmail,
        String customerPhone,
        String customerAddress,
        Instant warrantyStart,
        Instant warrantyEnd,
        WarrantyStatus status
) {
}
