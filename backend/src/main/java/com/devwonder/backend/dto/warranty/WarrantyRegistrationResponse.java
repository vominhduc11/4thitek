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
        String customerName,
        String customerEmail,
        String customerPhone,
        String customerAddress,
        Instant warrantyStart,
        Instant warrantyEnd,
        WarrantyStatus status,
        Instant createdAt
) {
}
