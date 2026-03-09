package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.DiscountRuleStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAdminDiscountRuleStatusRequest(
        @NotNull(message = "status is required")
        DiscountRuleStatus status
) {
}
