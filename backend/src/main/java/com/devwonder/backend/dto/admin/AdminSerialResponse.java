package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.ProductSerialStatus;
import java.time.Instant;

public record AdminSerialResponse(
        Long id,
        String serial,
        ProductSerialStatus status,
        Long productId,
        String productName,
        String productSku,
        Long dealerId,
        String dealerName,
        String customerName,
        Long orderId,
        String orderCode,
        String warehouseId,
        String warehouseName,
        Instant importedAt
) {
}
