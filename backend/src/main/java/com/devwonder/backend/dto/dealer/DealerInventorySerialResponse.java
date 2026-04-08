package com.devwonder.backend.dto.dealer;

import com.devwonder.backend.entity.enums.ProductSerialStatus;
import java.time.Instant;

public record DealerInventorySerialResponse(
        Long id,
        String serial,
        ProductSerialStatus status,
        Long productId,
        String productName,
        String productSku,
        Long orderId,
        String orderCode,
        String warehouseId,
        String warehouseName,
        Instant importedAt,
        String customerName
) {
}
