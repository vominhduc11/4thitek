package com.devwonder.backend.dto.auth;

public record ResendEmailVerificationResponse(
        String status,
        String message
) {
}
