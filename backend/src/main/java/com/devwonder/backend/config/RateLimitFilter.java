package com.devwonder.backend.config;

import com.devwonder.backend.dto.ApiResponse;
import com.devwonder.backend.service.AdminSettingsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final AdminSettingsService adminSettingsService;
    private final ObjectMapper objectMapper;
    private final Map<String, WindowState> windows = new ConcurrentHashMap<>();
    private final long cleanupGraceSeconds;

    public RateLimitFilter(
            AdminSettingsService adminSettingsService,
            ObjectMapper objectMapper,
            @Value("${app.rate-limit.cleanup-grace-seconds:300}") long cleanupGraceSeconds
    ) {
        this.adminSettingsService = adminSettingsService;
        this.objectMapper = objectMapper;
        this.cleanupGraceSeconds = Math.max(60L, cleanupGraceSeconds);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        AdminSettingsService.RateLimitRuntimeSettings settings = adminSettingsService.getRateLimitSettings();
        if (!settings.enabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        if (CorsUtils.isPreFlightRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        LimitRule rule = resolveRule(request, settings);
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = rule.bucketKey() + ":" + clientKey(request);
        WindowState state = windows.computeIfAbsent(
                key,
                ignored -> new WindowState(Instant.now(), new AtomicInteger(), rule.windowSeconds(), Instant.now())
        );
        synchronized (state) {
            Instant now = Instant.now();
            if (Duration.between(state.windowStartedAt(), now).getSeconds() >= rule.windowSeconds()) {
                state.reset(now);
            }
            state.touch(now);
            int next = state.counter().incrementAndGet();
            if (next > rule.requestLimit()) {
                response.setStatus(429);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                objectMapper.writeValue(response.getWriter(), ApiResponse.failure("Too many requests"));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private LimitRule resolveRule(
            HttpServletRequest request,
            AdminSettingsService.RateLimitRuntimeSettings settings
    ) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if ("POST".equalsIgnoreCase(method) && path.startsWith("/api/v1/auth/login")) {
            return rule("auth", settings.auth());
        }
        if ("POST".equalsIgnoreCase(method) && path.startsWith("/api/v1/auth/forgot-password")) {
            return rule("password-reset", settings.passwordReset());
        }
        if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/v1/warranty/check/")) {
            return rule("warranty", settings.warrantyLookup());
        }
        if ("POST".equalsIgnoreCase(method) && path.startsWith("/api/v1/upload/")) {
            return rule("upload", settings.upload());
        }
        if ("POST".equalsIgnoreCase(method) && path.startsWith("/api/v1/webhooks/sepay")) {
            return rule("webhook", settings.webhook());
        }
        return null;
    }

    private LimitRule rule(String bucketKey, AdminSettingsService.RateLimitBucketRuntimeSettings bucket) {
        return new LimitRule(
                bucketKey,
                bucket.requests(),
                bucket.windowSeconds()
        );
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Scheduled(fixedDelayString = "${app.rate-limit.cleanup-interval-ms:300000}")
    void cleanupExpiredWindows() {
        Instant now = Instant.now();
        windows.entrySet().removeIf(entry -> entry.getValue().isExpired(now, cleanupGraceSeconds));
    }

    private record LimitRule(String bucketKey, int requestLimit, long windowSeconds) {
    }

    private static final class WindowState {
        private Instant windowStartedAt;
        private final AtomicInteger counter;
        private final long windowSeconds;
        private Instant lastAccessedAt;

        private WindowState(
                Instant windowStartedAt,
                AtomicInteger counter,
                long windowSeconds,
                Instant lastAccessedAt
        ) {
            this.windowStartedAt = windowStartedAt;
            this.counter = counter;
            this.windowSeconds = Math.max(1L, windowSeconds);
            this.lastAccessedAt = lastAccessedAt;
        }

        private Instant windowStartedAt() {
            return windowStartedAt;
        }

        private AtomicInteger counter() {
            return counter;
        }

        private void reset(Instant newStart) {
            this.windowStartedAt = newStart;
            this.counter.set(0);
            this.lastAccessedAt = newStart;
        }

        private void touch(Instant instant) {
            this.lastAccessedAt = instant;
        }

        private boolean isExpired(Instant now, long cleanupGraceSeconds) {
            long retentionSeconds = Math.max(windowSeconds, cleanupGraceSeconds);
            return Duration.between(lastAccessedAt, now).getSeconds() >= retentionSeconds;
        }
    }
}
