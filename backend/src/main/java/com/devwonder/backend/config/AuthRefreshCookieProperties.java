package com.devwonder.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth.refresh-cookie")
public record AuthRefreshCookieProperties(
        String name,
        String path,
        String domain,
        boolean secure,
        String sameSite
) {
}
