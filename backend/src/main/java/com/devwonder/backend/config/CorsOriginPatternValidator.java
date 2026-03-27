package com.devwonder.backend.config;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class CorsOriginPatternValidator {

    private final List<String> allowedOriginPatterns;
    private final boolean allowCredentials;

    public CorsOriginPatternValidator(
            @Value("${app.cors.allowed-origin-patterns:}") String allowedOriginPatterns,
            @Value("${app.cors.allow-credentials:true}") boolean allowCredentials
    ) {
        this.allowedOriginPatterns = parseAllowedOriginPatterns(allowedOriginPatterns);
        this.allowCredentials = allowCredentials;
    }

    public List<String> allowedOriginPatterns() {
        return allowedOriginPatterns;
    }

    public String[] allowedOriginPatternArray() {
        return allowedOriginPatterns.toArray(String[]::new);
    }

    @EventListener(ApplicationReadyEvent.class)
    void validateAtStartup() {
        validateCredentialedOriginPatterns(allowedOriginPatterns, allowCredentials);
    }

    public static List<String> parseAllowedOriginPatterns(String rawPatterns) {
        return Arrays.stream((rawPatterns == null ? "" : rawPatterns).split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }

    public static void validateCredentialedOriginPatterns(List<String> originPatterns, boolean allowCredentials) {
        if (!allowCredentials || originPatterns == null || originPatterns.isEmpty()) {
            return;
        }

        for (String originPattern : originPatterns) {
            if (isClearlyUnsafeCredentialedPattern(originPattern)) {
                throw new IllegalStateException(
                        "Unsafe credentialed CORS origin pattern: " + originPattern
                                + ". Use explicit origins or narrowly-scoped subdomain patterns."
                );
            }
        }
    }

    private static boolean isClearlyUnsafeCredentialedPattern(String originPattern) {
        String normalized = originPattern == null ? "" : originPattern.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            return false;
        }
        if ("*".equals(normalized)) {
            return true;
        }
        int schemeSeparator = normalized.indexOf("://");
        if (schemeSeparator < 0) {
            return true;
        }

        String hostAndPort = normalized.substring(schemeSeparator + 3);
        int pathSeparator = hostAndPort.indexOf('/');
        if (pathSeparator >= 0) {
            hostAndPort = hostAndPort.substring(0, pathSeparator);
        }
        if (hostAndPort.isBlank()) {
            return true;
        }

        return hostAndPort.equals("*")
                || hostAndPort.startsWith("*:")
                || hostAndPort.startsWith("*?");
    }
}
