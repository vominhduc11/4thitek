package com.devwonder.backend.dto.dealer;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpsertDealerCartItemRequest(
        @NotNull(message = "productId is required")
        Long productId,
        @NotNull(message = "quantity is required")
        @Min(value = 0, message = "quantity must be non-negative")
        Integer quantity,
        String note
) {
}
