package com.devwonder.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.inventory")
public record InventoryAlertProperties(
        long alertScanIntervalMs,
        long alertCooldownHours
) {

    public InventoryAlertProperties {
        if (alertScanIntervalMs <= 0) {
            alertScanIntervalMs = 3_600_000L;
        }
        if (alertCooldownHours <= 0) {
            alertCooldownHours = 24L;
        }
    }
}
