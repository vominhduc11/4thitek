package com.devwonder.backend.dto.auth;

public record PasswordResetTokenValidationResponse(
        boolean valid,
        String status,
        String message
) {
    public static PasswordResetTokenValidationResponse fromStatus(String status) {
        return switch (status) {
            case "valid" -> new PasswordResetTokenValidationResponse(true, "valid", "Reset link is valid.");
            case "expired" -> new PasswordResetTokenValidationResponse(false, "expired", "Reset link has expired.");
            default -> new PasswordResetTokenValidationResponse(false, "invalid", "Reset link is invalid.");
        };
    }
}
