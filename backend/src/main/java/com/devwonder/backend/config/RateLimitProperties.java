package com.devwonder.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(
        boolean enabled,
        int authRequests,
        long authWindowSeconds,
        int passwordResetRequests,
        long passwordResetWindowSeconds,
        int warrantyLookupRequests,
        long warrantyLookupWindowSeconds,
        int uploadRequests,
        long uploadWindowSeconds,
        int webhookRequests,
        long webhookWindowSeconds
) {
}
