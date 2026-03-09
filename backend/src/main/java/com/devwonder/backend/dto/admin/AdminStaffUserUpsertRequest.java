package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.StaffUserStatus;

public record AdminStaffUserUpsertRequest(
        String name,
        String role,
        StaffUserStatus status
) {
}
