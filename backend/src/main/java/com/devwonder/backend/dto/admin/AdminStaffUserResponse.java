package com.devwonder.backend.dto.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.devwonder.backend.entity.enums.StaffUserStatus;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminStaffUserResponse(
        Long id,
        String name,
        String role,
        String systemRole,
        StaffUserStatus status,
        String username,
        String email,
        String temporaryPassword
) {
}
