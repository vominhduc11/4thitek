package com.devwonder.backend.dto.dealer;

import java.math.BigDecimal;

public record DealerCartPricingSummaryResponse(
        Integer itemCount,
        BigDecimal subtotal,
        Integer discountPercent,
        BigDecimal discountAmount,
        BigDecimal totalAfterDiscount,
        Integer vatPercent,
        BigDecimal vatAmount,
        BigDecimal totalAmount
) {
}
