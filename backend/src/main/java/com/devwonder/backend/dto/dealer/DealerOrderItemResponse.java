package com.devwonder.backend.dto.dealer;

import java.math.BigDecimal;

public record DealerOrderItemResponse(
        Long productId,
        String productName,
        String productSku,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
