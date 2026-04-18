package com.devwonder.backend.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum MediaStatus {
    PENDING,
    ACTIVE,
    DELETED,
    ORPHANED,
    QUARANTINED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonCreator
    public static MediaStatus fromJson(String value) {
        if (value == null) {
            return null;
        }
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "pending" -> PENDING;
            case "active" -> ACTIVE;
            case "deleted" -> DELETED;
            case "orphaned" -> ORPHANED;
            case "quarantined" -> QUARANTINED;
            default -> throw new IllegalArgumentException("Unsupported media status: " + value);
        };
    }
}
