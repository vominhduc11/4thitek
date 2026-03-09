package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import java.math.BigDecimal;

public record AdminDiscountRuleUpsertRequest(
        String label,
        String range,
        BigDecimal percent,
        DiscountRuleStatus status
) {
}
