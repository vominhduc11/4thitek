package com.devwonder.backend.dto.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "currentPassword is required")
        String currentPassword,
        @NotBlank(message = "newPassword is required")
        @Size(min = 6, max = 255, message = "newPassword must be 6-255 characters")
        String newPassword
) {
}
