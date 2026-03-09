package com.devwonder.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "token is required")
        String token,
        @NotBlank(message = "newPassword is required")
        @Size(min = 6, max = 255, message = "newPassword must be 6-255 characters")
        String newPassword
) {
}
