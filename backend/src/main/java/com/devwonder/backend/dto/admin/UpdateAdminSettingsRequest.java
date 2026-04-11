package com.devwonder.backend.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;

public record UpdateAdminSettingsRequest(
        Boolean emailConfirmation,
        @Min(value = 5, message = "sessionTimeoutMinutes must be between 5 and 480")
        @Max(value = 480, message = "sessionTimeoutMinutes must be between 5 and 480")
        Integer sessionTimeoutMinutes,
        Boolean orderAlerts,
        Boolean inventoryAlerts,
        @Min(value = 0, message = "vatPercent must be between 0 and 100")
        @Max(value = 100, message = "vatPercent must be between 0 and 100")
        Integer vatPercent,
        @Valid
        SepaySettings sepay,
        @Valid
        EmailSettings emailSettings,
        @Valid
        RateLimitSettings rateLimitOverrides
) {
    public record SepaySettings(
            Boolean enabled,
            String bankName,
            String accountNumber,
            String accountHolder
    ) {
    }

    public record EmailSettings(
            Boolean enabled,
            @Email(message = "emailSettings.from must be a valid email address")
            String from,
            String fromName
    ) {
    }

    public record RateLimitSettings(
            Boolean enabled,
            @Valid
            RateLimitBucket auth,
            @Valid
            RateLimitBucket passwordReset,
            @Valid
            RateLimitBucket warrantyLookup,
            @Valid
            RateLimitBucket upload,
            @Valid
            RateLimitBucket webhook
    ) {
    }

    public record RateLimitBucket(
            @Positive(message = "requests must be greater than 0")
            Integer requests,
            @Positive(message = "windowSeconds must be greater than 0")
            Long windowSeconds
    ) {
    }
}
