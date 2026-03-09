package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminDiscountRuleResponse(
        Long id,
        String label,
        String range,
        BigDecimal percent,
        DiscountRuleStatus status,
        Instant updatedAt
) {
}
