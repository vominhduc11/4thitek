package com.devwonder.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterDealerRequest(
        @NotBlank(message = "username is required")
        @Size(min = 3, max = 50, message = "username must be 3-50 characters")
        String username,
        @NotBlank(message = "password is required")
        @Size(min = 8, max = 255, message = "password must be 8-255 characters")
        String password,
        @Size(max = 150, message = "businessName must be <= 150 characters")
        String businessName,
        @Size(max = 150, message = "contactName must be <= 150 characters")
        String contactName,
        @Size(max = 50, message = "taxCode must be <= 50 characters")
        String taxCode,
        @Pattern(regexp = "^0\\d{9}$", message = "phone must be a valid 10-digit Vietnam number")
        @Size(max = 30, message = "phone must be <= 30 characters")
        String phone,
        @Email(message = "email is invalid")
        @Size(max = 100, message = "email must be <= 100 characters")
        String email,
        @Size(max = 255, message = "addressLine must be <= 255 characters")
        String addressLine,
        @Size(max = 100, message = "ward must be <= 100 characters")
        String ward,
        @Size(max = 100, message = "district must be <= 100 characters")
        String district,
        @Size(max = 100, message = "city must be <= 100 characters")
        String city,
        @Size(max = 100, message = "country must be <= 100 characters")
        String country,
        @Size(max = 2000, message = "avatarUrl must be <= 2000 characters")
        String avatarUrl
) {
}
