package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.OrderAdjustmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record AdminOrderAdjustmentRequest(
        @NotNull(message = "type is required")
        OrderAdjustmentType type,

        @NotNull(message = "amount is required")
        BigDecimal amount,

        @NotBlank(message = "reason is required")
        @Size(min = 10, message = "reason must be at least 10 characters")
        String reason,

        String referenceCode
) {
}
