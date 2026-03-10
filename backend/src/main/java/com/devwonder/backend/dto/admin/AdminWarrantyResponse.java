package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.WarrantyStatus;
import java.time.Instant;

public record AdminWarrantyResponse(
        Long id,
        String warrantyCode,
        Long productSerialId,
        String serial,
        Long productId,
        String productName,
        String productSku,
        Long dealerId,
        String dealerName,
        Long customerId,
        String customerName,
        String customerEmail,
        String customerPhone,
        WarrantyStatus status,
        Instant warrantyStart,
        Instant warrantyEnd,
        long remainingDays,
        Instant createdAt
) {
}
