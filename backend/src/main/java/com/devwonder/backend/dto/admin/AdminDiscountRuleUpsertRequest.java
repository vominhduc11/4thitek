package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;

public record AdminDiscountRuleUpsertRequest(
        @NotNull(message = "fromQuantity is required")
        @Min(value = 1, message = "fromQuantity must be greater than or equal to 1")
        Integer fromQuantity,
        Integer toQuantity,
        @NotNull(message = "percent is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "percent must be greater than 0")
        @DecimalMax(value = "100.0", inclusive = true, message = "percent must not exceed 100")
        @Digits(integer = 3, fraction = 2, message = "percent must have at most 2 decimal places")
        BigDecimal percent,
        DiscountRuleStatus status
) {
}
