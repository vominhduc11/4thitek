package com.devwonder.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record VerifyEmailRequest(
        @NotBlank(message = "token is required")
        String token
) {
}
