package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.StaffUserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateAdminStaffUserStatusRequest(
        @NotNull(message = "status is required")
        StaffUserStatus status
) {
}
