package com.devwonder.backend.dto.auth;

import java.time.Instant;

public record EmailVerificationResponse(
        String status,
        String message,
        Instant verifiedAt
) {
}
