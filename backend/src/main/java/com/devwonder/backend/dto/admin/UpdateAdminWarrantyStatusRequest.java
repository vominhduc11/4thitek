package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.WarrantyStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAdminWarrantyStatusRequest(
        @NotNull(message = "status is required")
        WarrantyStatus status
) {
}
