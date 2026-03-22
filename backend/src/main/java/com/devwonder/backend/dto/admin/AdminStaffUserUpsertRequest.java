package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.StaffUserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminStaffUserUpsertRequest(
        @NotBlank(message = "email is required")
        @Email(message = "email is invalid")
        String email,
        String name,
        String role,
        StaffUserStatus status
) {
}
