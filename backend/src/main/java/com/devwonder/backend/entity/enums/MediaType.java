package com.devwonder.backend.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum MediaType {
    IMAGE,
    VIDEO,
    DOCUMENT,
    OTHER;

    @JsonValue
    public String toJson() {
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonCreator
    public static MediaType fromJson(String value) {
        if (value == null) {
            return null;
        }
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "image" -> IMAGE;
            case "video" -> VIDEO;
            case "document" -> DOCUMENT;
            case "other" -> OTHER;
            default -> throw new IllegalArgumentException("Unsupported media type: " + value);
        };
    }
}
