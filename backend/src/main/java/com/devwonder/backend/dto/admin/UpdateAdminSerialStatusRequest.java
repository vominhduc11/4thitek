package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.ProductSerialStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAdminSerialStatusRequest(
        @NotNull(message = "status is required")
        ProductSerialStatus status
) {
}
