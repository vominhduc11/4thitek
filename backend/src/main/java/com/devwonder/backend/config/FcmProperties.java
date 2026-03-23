package com.devwonder.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.fcm")
public record FcmProperties(
        boolean enabled,
        String projectId,
        String credentialsPath,
        String credentialsJsonBase64
) {
}
