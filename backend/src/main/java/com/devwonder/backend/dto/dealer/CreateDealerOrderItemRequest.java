package com.devwonder.backend.dto.dealer;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record CreateDealerOrderItemRequest(
        @NotNull(message = "productId is required")
        Long productId,
        @NotNull(message = "quantity is required")
        @Min(value = 1, message = "quantity must be at least 1")
        Integer quantity,
        BigDecimal unitPrice
) {
}
