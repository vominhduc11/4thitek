package com.devwonder.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterCustomerRequest(
        @NotBlank(message = "fullName is required")
        @Size(min = 2, max = 150, message = "fullName must be 2-150 characters")
        String fullName,
        @NotBlank(message = "phone is required")
        @Pattern(regexp = "^0\\d{9}$", message = "phone must be a valid 10-digit Vietnam number")
        String phone,
        @Email(message = "email is invalid")
        @Size(max = 100, message = "email must be <= 100 characters")
        String email,
        @NotBlank(message = "username is required")
        @Size(min = 3, max = 50, message = "username must be 3-50 characters")
        String username,
        @NotBlank(message = "password is required")
        @Size(min = 6, max = 255, message = "password must be 6-255 characters")
        String password
) {
}
