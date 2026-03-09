package com.devwonder.backend.dto.customer;

import java.time.Instant;

public record CustomerProfileResponse(
        Long id,
        String fullName,
        String phone,
        String email,
        String avatarUrl,
        Instant createdAt
) {
}
