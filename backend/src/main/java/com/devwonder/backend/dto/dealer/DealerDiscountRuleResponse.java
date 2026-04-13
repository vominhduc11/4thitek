package com.devwonder.backend.dto.dealer;

public record DealerDiscountRuleResponse(
        Integer fromQuantity,
        Integer toQuantity,
        Integer percent,
        String rangeLabel
) {
}
