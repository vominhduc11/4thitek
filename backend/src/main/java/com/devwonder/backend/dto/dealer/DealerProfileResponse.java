package com.devwonder.backend.dto.dealer;

import java.time.Instant;

public record DealerProfileResponse(
        Long id,
        String businessName,
        String contactName,
        String taxCode,
        String phone,
        String addressLine,
        String ward,
        String district,
        String city,
        String country,
        String email,
        String avatarUrl,
        String salesPolicy,
        Instant createdAt,
        Instant updatedAt
) {
}
