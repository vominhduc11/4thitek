package com.devwonder.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "username is required")
        String username,
        @NotBlank(message = "password is required")
        String password,
        Boolean remember
) {
    public LoginRequest(String username, String password) {
        this(username, password, null);
    }
}
