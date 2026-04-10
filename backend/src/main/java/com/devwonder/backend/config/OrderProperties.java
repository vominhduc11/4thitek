package com.devwonder.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.order")
public class OrderProperties {

    /** TTL in minutes for idempotency key cache (default 10 min). */
    private long idempotencyTtlMinutes = 10;

    /** Hours a PENDING order may remain before auto-cancel (default 48h). */
    private long pendingTimeoutHours = 48;

    /** Interval in ms for the stale-order scheduled check (default 1h). */
    private long staleCheckIntervalMs = 3_600_000L;

    /** Hours before timeout to send dealer warning notification (default 6h). */
    private long staleWarningBeforeHours = 6;

    /** Hours a CONFIRMED order may remain before it is flagged for shipping follow-up (default 48h). */
    private long confirmedShippingAlertHours = 48;

    public long getIdempotencyTtlMinutes() {
        return idempotencyTtlMinutes;
    }

    public void setIdempotencyTtlMinutes(long idempotencyTtlMinutes) {
        this.idempotencyTtlMinutes = idempotencyTtlMinutes;
    }

    public long getPendingTimeoutHours() {
        return pendingTimeoutHours;
    }

    public void setPendingTimeoutHours(long pendingTimeoutHours) {
        this.pendingTimeoutHours = pendingTimeoutHours;
    }

    public long getStaleCheckIntervalMs() {
        return staleCheckIntervalMs;
    }

    public void setStaleCheckIntervalMs(long staleCheckIntervalMs) {
        this.staleCheckIntervalMs = staleCheckIntervalMs;
    }

    public long getStaleWarningBeforeHours() {
        return staleWarningBeforeHours;
    }

    public void setStaleWarningBeforeHours(long staleWarningBeforeHours) {
        this.staleWarningBeforeHours = staleWarningBeforeHours;
    }

    public long getConfirmedShippingAlertHours() {
        return confirmedShippingAlertHours;
    }

    public void setConfirmedShippingAlertHours(long confirmedShippingAlertHours) {
        this.confirmedShippingAlertHours = confirmedShippingAlertHours;
    }
}
