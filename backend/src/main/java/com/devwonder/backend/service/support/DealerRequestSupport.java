package com.devwonder.backend.service.support;

import com.devwonder.backend.dto.warranty.CreateWarrantyRegistrationRequest;
import com.devwonder.backend.exception.BadRequestException;
import java.net.URI;
import java.net.URISyntaxException;

public final class DealerRequestSupport {

    private DealerRequestSupport() {
    }

    public static String requireNonBlank(String value, String fieldName) {
        String normalized = normalize(value);
        if (normalized == null) {
            throw new BadRequestException(fieldName + " must not be blank");
        }
        return normalized;
    }

    public static String defaultIfBlank(String value, String fallback) {
        String normalized = normalize(value);
        return normalized == null ? normalize(fallback) : normalized;
    }

    public static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static boolean isValidUrl(String value) {
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (URISyntaxException ex) {
            return false;
        }
    }

    public static boolean isValidUrlOrUploadPath(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return false;
        }
        return normalized.startsWith("/api/v1/upload/")
                || normalized.startsWith("/uploads/")
                || isValidUrl(normalized);
    }
}
