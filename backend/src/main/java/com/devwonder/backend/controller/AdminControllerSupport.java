package com.devwonder.backend.controller;

import com.devwonder.backend.exception.BadRequestException;
import org.springframework.security.core.Authentication;

final class AdminControllerSupport {

    private AdminControllerSupport() {
    }

    static String extractUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new BadRequestException("Unauthenticated request");
        }
        return authentication.getName();
    }
}
