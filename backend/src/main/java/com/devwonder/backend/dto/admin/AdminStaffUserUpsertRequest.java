package com.devwonder.backend.dto.admin;

import com.devwonder.backend.entity.enums.StaffUserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminStaffUserUpsertRequest(
        @NotBlank(message = "email is required")
        @Email(message = "email is invalid")
        String email,
        @NotBlank(message = "name is required")
        @Size(max = 120, message = "name must be 120 characters or fewer")
        String name,
        @NotBlank(message = "role is required")
        @Size(max = 120, message = "role must be 120 characters or fewer")
        String role,
        StaffUserStatus status
) {
}
