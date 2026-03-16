package com.devwonder.backend.dto.admin;

import java.math.BigDecimal;

public record AdminOrderItemResponse(
        Long productId,
        String productSku,
        String productName,
        Integer quantity,
        BigDecimal unitPrice
) {
}
