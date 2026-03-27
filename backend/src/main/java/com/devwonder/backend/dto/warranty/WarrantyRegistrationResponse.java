package com.devwonder.backend.dto.warranty;

import com.devwonder.backend.entity.enums.WarrantyStatus;
import java.time.Instant;
import java.time.LocalDate;

public record WarrantyRegistrationResponse(
        Long id,
        Long productSerialId,
        String serial,
        Long dealerId,
        Long orderId,
        String orderCode,
        Long productId,
        String productName,
        String productSku,
        String customerName,
        String customerEmail,
        String customerPhone,
        String customerAddress,
        LocalDate purchaseDate,
        Instant warrantyStart,
        Instant warrantyEnd,
        WarrantyStatus status,
        Instant createdAt
) {
}
