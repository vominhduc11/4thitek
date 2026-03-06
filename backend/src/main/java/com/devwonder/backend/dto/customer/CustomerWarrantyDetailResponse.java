package com.devwonder.backend.dto.customer;

import com.devwonder.backend.entity.enums.WarrantyStatus;
import java.time.Instant;
import java.util.UUID;

public record CustomerWarrantyDetailResponse(
        UUID id,
        UUID productId,
        String productName,
        String productImage,
        String productSku,
        String serialNumber,
        WarrantyStatus status,
        Instant warrantyStart,
        Instant warrantyEnd,
        long remainingDays,
        UUID dealerId,
        String dealerName,
        Instant createdAt
) {
}
