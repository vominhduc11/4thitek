package com.devwonder.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record ResendEmailVerificationRequest(
        @NotBlank(message = "identity is required")
        String identity
) {
}
