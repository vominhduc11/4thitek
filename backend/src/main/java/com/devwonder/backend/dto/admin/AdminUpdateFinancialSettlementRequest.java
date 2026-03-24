package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.FinancialSettlementStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AdminUpdateFinancialSettlementRequest(
        @NotNull(message = "status is required")
        FinancialSettlementStatus status,

        @NotBlank(message = "resolution is required")
        String resolution
) {
}
