package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.DealerTier;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AdminDealerAccountUpdateRequest(
        @NotNull DealerTier tier,
        BigDecimal creditLimit
) {
}
