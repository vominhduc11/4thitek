package com.devwonder.backend.dto.warranty;

import com.devwonder.backend.entity.enums.WarrantyStatus;
import java.time.Instant;

public record WarrantyRegistrationResponse(
        Long id,
        Long productSerialId,
        String serial,
        Long dealerId,
        Long customerId,
        Long orderId,
        Instant warrantyStart,
        Instant warrantyEnd,
        WarrantyStatus status,
        Instant createdAt
) {
}
