package com.devwonder.backend.dto.admin;

import java.math.BigDecimal;

public record AdminDealerAccountSummaryResponse(
        long total,
        long active,
        long underReview,
        long suspended,
        BigDecimal totalRevenue
) {
}
