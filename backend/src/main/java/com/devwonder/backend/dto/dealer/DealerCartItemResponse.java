package com.devwonder.backend.dto.dealer;

import java.math.BigDecimal;
import java.time.Instant;

public record DealerCartItemResponse(
        Long productOfCartId,
        Long productId,
        String productName,
        String productSku,
        String image,
        Integer quantity,
        BigDecimal retailPrice,
        BigDecimal priceSnapshot,
        String note,
        Instant createdAt,
        Instant updatedAt
) {
}
