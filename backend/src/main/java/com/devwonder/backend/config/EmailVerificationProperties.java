package com.devwonder.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.email-verification")
public record EmailVerificationProperties(
        String baseUrl,
        long expirationMinutes
) {
}
