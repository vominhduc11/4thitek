package com.devwonder.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "sepay")
public record SepayProperties(
        boolean enabled,
        String webhookToken,
        String bankName,
        String accountNumber,
        String accountHolder
) {
}
