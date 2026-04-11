package com.devwonder.backend.dto.admin;

import java.time.Instant;

public record AdminSettingsResponse(
        Long id,
        boolean emailConfirmation,
        int sessionTimeoutMinutes,
        boolean orderAlerts,
        boolean inventoryAlerts,
        int vatPercent,
        SepaySettings sepay,
        EmailSettings emailSettings,
        RateLimitSettings rateLimitOverrides,
        Instant createdAt,
        Instant updatedAt
) {
    public record SepaySettings(
            boolean enabled,
            boolean hasWebhookToken,
            String webhookTokenMasked,
            String bankName,
            String accountNumber,
            String accountHolder
    ) {
    }

    public record EmailSettings(
            boolean enabled,
            String from,
            String fromName
    ) {
    }

    public record RateLimitSettings(
            boolean enabled,
            RateLimitBucket auth,
            RateLimitBucket passwordReset,
            RateLimitBucket warrantyLookup,
            RateLimitBucket upload,
            RateLimitBucket webhook
    ) {
    }

    public record RateLimitBucket(
            int requests,
            long windowSeconds
    ) {
    }
}
