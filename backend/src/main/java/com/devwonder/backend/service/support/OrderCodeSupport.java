package com.devwonder.backend.service.support;

import java.time.Instant;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class OrderCodeSupport {

    private static final Pattern CANONICAL_PATTERN =
            Pattern.compile("\\bSCS-\\d+-\\d{13}-\\d{6}\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern COMPACT_CANONICAL_PATTERN =
            Pattern.compile("\\bSCS[-\\s]?(\\d+)[-\\s]?(\\d{13})[-\\s]?(\\d{6})\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern LEGACY_PATTERN =
            Pattern.compile("\\bSCS-\\d+-\\d+\\b", Pattern.CASE_INSENSITIVE);

    private OrderCodeSupport() {
    }

    public static String build(Long dealerId, Instant createdAt, int randomSuffix) {
        if (dealerId == null || dealerId <= 0) {
            throw new IllegalArgumentException("dealerId must be a positive number");
        }
        if (createdAt == null) {
            throw new IllegalArgumentException("createdAt is required");
        }
        if (randomSuffix < 100000 || randomSuffix > 999999) {
            throw new IllegalArgumentException("randomSuffix must be a 6-digit number");
        }
        return "SCS-" + dealerId + "-" + createdAt.toEpochMilli() + "-" + randomSuffix;
    }

    public static String extractFirst(String... candidates) {
        String canonical = extractWithPattern(CANONICAL_PATTERN, candidates);
        if (canonical != null) {
            return canonical;
        }
        String compactCanonical = extractCompactCanonical(candidates);
        if (compactCanonical != null) {
            return compactCanonical;
        }
        return extractWithPattern(LEGACY_PATTERN, candidates);
    }

    public static boolean isCanonical(String orderCode) {
        if (orderCode == null) {
            return false;
        }
        return CANONICAL_PATTERN.matcher(orderCode.trim()).matches();
    }

    private static String extractWithPattern(Pattern pattern, String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            String normalized = normalize(candidate);
            if (normalized == null) {
                continue;
            }
            Matcher matcher = pattern.matcher(normalized);
            if (matcher.find()) {
                return matcher.group().toUpperCase(Locale.ROOT);
            }
        }
        return null;
    }

    private static String extractCompactCanonical(String... candidates) {
        if (candidates == null) {
            return null;
        }
        for (String candidate : candidates) {
            String normalized = normalize(candidate);
            if (normalized == null) {
                continue;
            }
            Matcher matcher = COMPACT_CANONICAL_PATTERN.matcher(normalized);
            if (matcher.find()) {
                return "SCS-"
                        + matcher.group(1)
                        + "-"
                        + matcher.group(2)
                        + "-"
                        + matcher.group(3);
            }
        }
        return null;
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
