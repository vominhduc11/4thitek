package com.devwonder.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForgotPasswordRequest(
        @NotBlank(message = "email is required")
        @Email(message = "email must be valid")
        @Size(max = 255, message = "email must be 255 characters or fewer")
        String email
) {
}
