package com.devwonder.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "token is required")
        String token,
        @NotBlank(message = "newPassword is required")
        @Size(min = 8, max = 255, message = "newPassword must be 8-255 characters")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,255}$",
                message = "newPassword must include uppercase, lowercase, and a number"
        )
        String newPassword
) {
}
