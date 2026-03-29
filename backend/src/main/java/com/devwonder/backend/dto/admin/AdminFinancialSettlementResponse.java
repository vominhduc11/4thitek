package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import com.devwonder.backend.entity.enums.FinancialSettlementType;
import java.math.BigDecimal;
import java.time.Instant;

public record AdminFinancialSettlementResponse(
        Long id,
        Long orderId,
        String orderCode,
        FinancialSettlementType type,
        BigDecimal amount,
        FinancialSettlementStatus status,
        String createdBy,
        Instant createdAt,
        String resolution,
        String resolvedBy,
        Instant resolvedAt
) {
}
