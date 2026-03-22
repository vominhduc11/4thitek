package com.devwonder.backend.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum DealerSupportTicketStatus {
    OPEN,
    IN_PROGRESS,
    RESOLVED,
    CLOSED;

    @JsonValue
    public String toJson() {
        return switch (this) {
            case IN_PROGRESS -> "in_progress";
            default -> name().toLowerCase(Locale.ROOT);
        };
    }

    @JsonCreator
    public static DealerSupportTicketStatus fromJson(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT).replace('-', '_');
        return switch (normalized) {
            case "open" -> OPEN;
            case "in_progress" -> IN_PROGRESS;
            case "resolved" -> RESOLVED;
            case "closed" -> CLOSED;
            default -> throw new IllegalArgumentException("Unsupported support ticket status: " + value);
        };
    }
}
