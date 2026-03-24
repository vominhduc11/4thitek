package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.OrderAdjustmentType;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminOrderAdjustmentResponse(
        Long id,
        Long orderId,
        OrderAdjustmentType type,
        BigDecimal amount,
        String reason,
        String referenceCode,
        String createdBy,
        String createdByRole,
        Instant createdAt
) {
}
