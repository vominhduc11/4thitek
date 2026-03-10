package com.devwonder.backend.dto.auth;

import java.util.Set;

public record AuthUserResponse(
        Long id,
        String username,
        String accountType,
        Set<String> roles,
        boolean requirePasswordChange
) {
}
