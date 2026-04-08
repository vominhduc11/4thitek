package com.devwonder.backend.dto.auth;

public record PasswordResetTokenValidationResponse(
        boolean valid,
        String status,
        String message
) {
    public PasswordResetTokenValidationResponse(boolean valid) {
        this(
                valid,
                valid ? "valid" : "invalid_or_expired",
                valid ? "Reset link is valid." : "Reset link is invalid or expired."
        );
    }
}
