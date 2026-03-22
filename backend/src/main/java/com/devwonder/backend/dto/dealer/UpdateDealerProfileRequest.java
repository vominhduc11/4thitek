package com.devwonder.backend.dto.dealer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateDealerProfileRequest(
        @Size(max = 255, message = "businessName must be 255 characters or fewer")
        String businessName,
        @Size(max = 255, message = "contactName must be 255 characters or fewer")
        String contactName,
        @Size(max = 100, message = "taxCode must be 100 characters or fewer")
        String taxCode,
        @Pattern(regexp = "^0\\d{9}$", message = "phone must be a valid 10-digit Vietnam number")
        String phone,
        @Size(max = 500, message = "addressLine must be 500 characters or fewer")
        String addressLine,
        @Size(max = 255, message = "ward must be 255 characters or fewer")
        String ward,
        @Size(max = 255, message = "district must be 255 characters or fewer")
        String district,
        @Size(max = 255, message = "city must be 255 characters or fewer")
        String city,
        @Size(max = 255, message = "country must be 255 characters or fewer")
        String country,
        @Email(message = "email must be a valid email address")
        @Size(max = 255, message = "email must be 255 characters or fewer")
        String email,
        @Size(max = 2048, message = "avatarUrl must be 2048 characters or fewer")
        String avatarUrl,
        @Size(max = 5000, message = "salesPolicy must be 5000 characters or fewer")
        String salesPolicy
) {
}
