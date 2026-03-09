package com.devwonder.backend.dto.customer;

import com.devwonder.backend.entity.enums.WarrantyStatus;
import java.time.Instant;

public record CustomerWarrantyDetailResponse(
        Long id,
        Long productId,
        String productName,
        String productImage,
        String productSku,
        String serialNumber,
        WarrantyStatus status,
        Instant warrantyStart,
        Instant warrantyEnd,
        long remainingDays,
        Long dealerId,
        String dealerName,
        Instant createdAt
) {
}
