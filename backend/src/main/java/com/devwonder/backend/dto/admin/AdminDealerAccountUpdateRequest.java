package com.devwonder.backend.dto.admin;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AdminDealerAccountUpdateRequest(
        @NotNull(message = "creditLimit is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "creditLimit must not be negative")
        BigDecimal creditLimit
) {
}
