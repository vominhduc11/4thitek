package com.devwonder.backend.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;

public enum StorageProvider {
    LOCAL,
    S3,
    MINIO;

    @JsonValue
    public String toJson() {
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonCreator
    public static StorageProvider fromJson(String value) {
        if (value == null) {
            return null;
        }
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "local" -> LOCAL;
            case "s3" -> S3;
            case "minio" -> MINIO;
            default -> throw new IllegalArgumentException("Unsupported storage provider: " + value);
        };
    }
}
