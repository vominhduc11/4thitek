package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.CustomerStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAdminDealerAccountStatusRequest(
        @NotNull(message = "status is required")
        CustomerStatus status
) {
}
