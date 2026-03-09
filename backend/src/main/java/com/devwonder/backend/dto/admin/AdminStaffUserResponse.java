package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.StaffUserStatus;

public record AdminStaffUserResponse(
        Long id,
        String name,
        String role,
        StaffUserStatus status,
        String username,
        String email
) {
}
