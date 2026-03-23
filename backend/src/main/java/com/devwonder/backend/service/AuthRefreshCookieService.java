package com.devwonder.backend.service;

import com.devwonder.backend.config.AuthRefreshCookieProperties;
import com.devwonder.backend.security.JWTUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthRefreshCookieService {

    private final AuthRefreshCookieProperties properties;
    private final JWTUtils jwtUtils;

    public AuthRefreshCookieService(AuthRefreshCookieProperties properties, JWTUtils jwtUtils) {
        this.properties = properties;
        this.jwtUtils = jwtUtils;
    }

    public String extractRefreshToken(HttpServletRequest request) {
        if (request == null || request.getCookies() == null) {
            return null;
        }
        String cookieName = resolveCookieName();
        for (Cookie cookie : request.getCookies()) {
            if (cookie != null && cookieName.equals(cookie.getName())) {
                String value = cookie.getValue();
                return StringUtils.hasText(value) ? value.trim() : null;
            }
        }
        return null;
    }

    public void writeRefreshToken(HttpHeaders headers, String refreshToken, boolean persistent) {
        headers.add(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(refreshToken, persistent).toString());
    }

    public void clearRefreshToken(HttpHeaders headers) {
        headers.add(HttpHeaders.SET_COOKIE, clearRefreshTokenCookie().toString());
    }

    public ResponseCookie buildRefreshTokenCookie(String refreshToken, boolean persistent) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(resolveCookieName(), refreshToken)
                .httpOnly(true)
                .secure(properties.secure())
                .sameSite(resolveSameSite())
                .path(resolvePath());
        String domain = normalize(properties.domain());
        if (domain != null) {
            builder.domain(domain);
        }
        if (persistent) {
            builder.maxAge(Math.max(1L, jwtUtils.getRefreshTokenExpirationMs() / 1000L));
        }
        return builder.build();
    }

    public ResponseCookie clearRefreshTokenCookie() {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(resolveCookieName(), "")
                .httpOnly(true)
                .secure(properties.secure())
                .sameSite(resolveSameSite())
                .path(resolvePath())
                .maxAge(0);
        String domain = normalize(properties.domain());
        if (domain != null) {
            builder.domain(domain);
        }
        return builder.build();
    }

    private String resolvePath() {
        String path = normalize(properties.path());
        return path == null ? "/api/v1/auth" : path;
    }

    private String resolveSameSite() {
        String sameSite = normalize(properties.sameSite());
        return sameSite == null ? "Lax" : sameSite;
    }

    private String resolveCookieName() {
        String cookieName = normalize(properties.name());
        return cookieName == null ? "fourthitek_refresh" : cookieName;
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
