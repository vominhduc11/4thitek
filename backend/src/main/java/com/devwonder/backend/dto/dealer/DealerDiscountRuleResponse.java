package com.devwonder.backend.dto.dealer;

public record DealerDiscountRuleResponse(
        Long productId,
        Integer minQuantity,
        Integer maxQuantity,
        Integer percent,
        String rangeLabel
) {
}
