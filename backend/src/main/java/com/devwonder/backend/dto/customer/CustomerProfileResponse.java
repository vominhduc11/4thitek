package com.devwonder.backend.dto.customer;

import java.time.Instant;
import java.util.UUID;

public record CustomerProfileResponse(
        UUID id,
        String fullName,
        String phone,
        String email,
        String avatarUrl,
        Instant createdAt
) {
}
