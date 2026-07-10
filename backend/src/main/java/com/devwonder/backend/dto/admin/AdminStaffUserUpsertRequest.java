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
        // Optional security role: one of ADMIN, SALES, WAREHOUSE, ACCOUNTANT, CONTENT_EDITOR.
        // Null/blank defaults to ADMIN for backward compatibility.
        @Size(max = 32, message = "systemRole must be 32 characters or fewer")
        String systemRole,
        StaffUserStatus status
) {
}
