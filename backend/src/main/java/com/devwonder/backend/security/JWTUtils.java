package com.devwonder.backend.security;

import com.devwonder.backend.service.AdminSettingsService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HashMap;
import java.util.function.Function;

@Component
public class JWTUtils {
    private static final Logger log = LoggerFactory.getLogger(JWTUtils.class);
    private static final int MIN_HMAC_KEY_BYTES = 32;
    private final SecretKey key;
    private final long defaultAccessTokenExpirationMs;
    private final long refreshTokenExpirationMs;
    private final AdminSettingsService adminSettingsService;

    public JWTUtils(
            @Value("${jwt.secret}") String secretString,
            @Value("${jwt.access-token-expiration-ms:1800000}") long accessTokenExpirationMs,
            @Value("${jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs,
            @Value("${app.security.require-strong-jwt-secret:true}") boolean requireStrongSecret,
            AdminSettingsService adminSettingsService
    ) {
        String normalizedSecret = secretString == null ? "" : secretString.trim();
        if (normalizedSecret.isEmpty()) {
            throw new IllegalStateException("Missing JWT secret. Set environment variable JWT_SECRET.");
        }

        if (requireStrongSecret && normalizedSecret.getBytes(StandardCharsets.UTF_8).length < MIN_HMAC_KEY_BYTES) {
            throw new IllegalStateException(
                    "JWT secret must be at least " + MIN_HMAC_KEY_BYTES + " bytes when app.security.require-strong-jwt-secret=true."
            );
        }

        byte[] keyBytes = deriveKeyBytes(normalizedSecret);
        if (accessTokenExpirationMs <= 0) {
            throw new IllegalStateException("Access token expiration must be greater than 0.");
        }
        if (refreshTokenExpirationMs <= 0) {
            throw new IllegalStateException("Refresh token expiration must be greater than 0.");
        }
        if (refreshTokenExpirationMs <= accessTokenExpirationMs) {
            throw new IllegalStateException("Refresh token expiration must be greater than access token expiration.");
        }

        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.defaultAccessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.adminSettingsService = adminSettingsService;
    }

    private byte[] deriveKeyBytes(String secret) {
        byte[] rawKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (rawKeyBytes.length >= MIN_HMAC_KEY_BYTES) {
            return rawKeyBytes;
        }

        log.warn(
                "JWT secret is shorter than {} bytes; deriving an HMAC key via SHA-256. Use a longer JWT_SECRET in production.",
                MIN_HMAC_KEY_BYTES
        );

        try {
            return MessageDigest.getInstance("SHA-256").digest(rawKeyBytes);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available for JWT key derivation.", ex);
        }
    }

    public String generateToken(UserDetails userDetails) {
        long accessTokenExpirationMs = resolveAccessTokenExpirationMs();
        return Jwts
                .builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(HashMap<String, Object> claims, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + refreshTokenExpirationMs))
                .signWith(key)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    private <T> T extractClaims(String token, Function<Claims, T> claimsTFunction) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claimsTFunction.apply(claims);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public boolean isTokenExpired(String token) {
        return extractClaims(token, Claims::getExpiration).before(new Date());
    }

    public long getAccessTokenExpirationMs() {
        return resolveAccessTokenExpirationMs();
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    private long resolveAccessTokenExpirationMs() {
        AdminSettingsService.EffectiveAdminSettings effectiveSettings = adminSettingsService.getEffectiveSettings();
        int sessionTimeoutMinutes = effectiveSettings.sessionTimeoutMinutes();
        if (sessionTimeoutMinutes <= 0) {
            return defaultAccessTokenExpirationMs;
        }
        return sessionTimeoutMinutes * 60_000L;
    }
}
