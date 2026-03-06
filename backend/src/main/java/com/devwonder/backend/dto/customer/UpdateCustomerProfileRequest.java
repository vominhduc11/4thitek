package com.devwonder.backend.dto.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateCustomerProfileRequest(
        @Size(min = 2, max = 150, message = "fullName must be 2-150 characters")
        String fullName,
        @Pattern(regexp = "^0\\d{9}$", message = "phone must be a valid 10-digit Vietnam number")
        String phone,
        @Email(message = "email is invalid")
        @Size(max = 100, message = "email must be <= 100 characters")
        String email,
        @Size(max = 2000, message = "avatarUrl must be <= 2000 characters")
        String avatarUrl
) {
}
