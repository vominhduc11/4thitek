package com.devwonder.backend.config;

import com.devwonder.backend.dto.ApiResponse;
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
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties properties;
    private final ObjectMapper objectMapper;
    private final Map<String, WindowState> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(RateLimitProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!properties.enabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        LimitRule rule = resolveRule(request);
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = rule.bucketKey() + ":" + clientKey(request);
        WindowState state = windows.computeIfAbsent(key, ignored -> new WindowState(Instant.now(), new AtomicInteger()));
        synchronized (state) {
            Instant now = Instant.now();
            if (Duration.between(state.windowStartedAt(), now).getSeconds() >= rule.windowSeconds()) {
                state.reset(now);
            }
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

    private LimitRule resolveRule(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/v1/auth/login")) {
            return new LimitRule("auth", properties.authRequests(), properties.authWindowSeconds());
        }
        if (path.startsWith("/api/auth/forgot-password") || path.startsWith("/api/v1/auth/forgot-password")) {
            return new LimitRule("password-reset", properties.passwordResetRequests(), properties.passwordResetWindowSeconds());
        }
        if (path.startsWith("/api/warranty/check/") || path.startsWith("/api/v1/warranty/check/")) {
            return new LimitRule("warranty", properties.warrantyLookupRequests(), properties.warrantyLookupWindowSeconds());
        }
        if (path.startsWith("/api/upload/") || path.startsWith("/api/v1/upload/")) {
            return new LimitRule("upload", properties.uploadRequests(), properties.uploadWindowSeconds());
        }
        if (path.startsWith("/api/webhooks/sepay") || path.startsWith("/api/v1/webhooks/sepay")) {
            return new LimitRule("webhook", properties.webhookRequests(), properties.webhookWindowSeconds());
        }
        return null;
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private record LimitRule(String bucketKey, int requestLimit, long windowSeconds) {
    }

    private static final class WindowState {
        private Instant windowStartedAt;
        private final AtomicInteger counter;

        private WindowState(Instant windowStartedAt, AtomicInteger counter) {
            this.windowStartedAt = windowStartedAt;
            this.counter = counter;
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
        }
    }
}
