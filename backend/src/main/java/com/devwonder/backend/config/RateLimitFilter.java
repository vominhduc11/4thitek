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
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
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
    private final ClientIpResolver clientIpResolver;
    private final StringRedisTemplate stringRedisTemplate;

    public RateLimitFilter(
            AdminSettingsService adminSettingsService,
            ObjectMapper objectMapper,
            ClientIpResolver clientIpResolver,
            ObjectProvider<StringRedisTemplate> stringRedisTemplateProvider,
            @Value("${app.rate-limit.cleanup-grace-seconds:300}") long cleanupGraceSeconds
    ) {
        this.adminSettingsService = adminSettingsService;
        this.objectMapper = objectMapper;
        this.clientIpResolver = clientIpResolver;
        this.cleanupGraceSeconds = Math.max(60L, cleanupGraceSeconds);
        this.stringRedisTemplate = stringRedisTemplateProvider.getIfAvailable();
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
        try {
            if (tryAcquireWithRedis(rule, key)) {
                filterChain.doFilter(request, response);
                return;
            }
        } catch (RateLimitExceededException ex) {
            writeRateLimitResponse(response);
            return;
        }

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
                writeRateLimitResponse(response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean tryAcquireWithRedis(LimitRule rule, String key) {
        if (stringRedisTemplate == null) {
            return false;
        }
        String redisKey = "rate-limit:" + key;
        try {
            Long next = stringRedisTemplate.opsForValue().increment(redisKey);
            if (next == null) {
                return false;
            }
            if (next == 1L) {
                stringRedisTemplate.expire(redisKey, Duration.ofSeconds(rule.windowSeconds()));
            } else {
                Long ttl = stringRedisTemplate.getExpire(redisKey);
                if (ttl == null || ttl < 0) {
                    stringRedisTemplate.expire(redisKey, Duration.ofSeconds(rule.windowSeconds()));
                }
            }
            if (next > rule.requestLimit()) {
                throw new RateLimitExceededException();
            }
            return true;
        } catch (RateLimitExceededException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    private void writeRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ApiResponse.failure("Too many requests"));
    }

    private LimitRule resolveRule(
            HttpServletRequest request,
            AdminSettingsService.RateLimitRuntimeSettings settings
    ) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if ("POST".equalsIgnoreCase(method)
                && (path.startsWith("/api/v1/auth/login") || path.startsWith("/api/auth/login"))) {
            return rule("auth", settings.auth());
        }
        if ("POST".equalsIgnoreCase(method)
                && (path.startsWith("/api/v1/auth/forgot-password") || path.startsWith("/api/auth/forgot-password"))) {
            return rule("password-reset", settings.passwordReset());
        }
        if ("POST".equalsIgnoreCase(method)
                && (path.startsWith("/api/v1/auth/resend-email-verification")
                || path.startsWith("/api/auth/resend-email-verification"))) {
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
        return clientIpResolver.resolveForRateLimit(request);
    }

    @Scheduled(fixedDelayString = "${app.rate-limit.cleanup-interval-ms:300000}")
    void cleanupExpiredWindows() {
        Instant now = Instant.now();
        windows.entrySet().removeIf(entry -> entry.getValue().isExpired(now, cleanupGraceSeconds));
    }

    private record LimitRule(String bucketKey, int requestLimit, long windowSeconds) {
    }

    private static final class RateLimitExceededException extends RuntimeException {
        private static final long serialVersionUID = 1L;
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
