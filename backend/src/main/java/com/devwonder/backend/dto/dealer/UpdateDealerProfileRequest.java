package com.devwonder.backend.dto.dealer;

public record UpdateDealerProfileRequest(
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
        String salesPolicy
) {
}
