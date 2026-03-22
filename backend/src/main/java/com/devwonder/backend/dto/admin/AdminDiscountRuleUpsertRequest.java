package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AdminDiscountRuleUpsertRequest(
        @NotBlank(message = "label is required")
        String label,
        @NotBlank(message = "range is required")
        String range,
        @NotNull(message = "percent is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "percent must be greater than 0")
        @DecimalMax(value = "100.0", inclusive = true, message = "percent must not exceed 100")
        @Digits(integer = 3, fraction = 2, message = "percent must have at most 2 decimal places")
        BigDecimal percent,
        DiscountRuleStatus status
) {
}
