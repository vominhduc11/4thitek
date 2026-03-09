package com.devwonder.backend.dto.admin;

import java.time.Instant;

public record AdminDealerResponse(
        Long id,
        String username,
        String businessName,
        String contactName,
        String phone,
        String email,
        String city,
        Instant createdAt
) {
}
