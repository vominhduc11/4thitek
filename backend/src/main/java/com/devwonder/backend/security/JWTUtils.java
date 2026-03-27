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
import java.util.Map;
import java.util.function.Function;

@Component
public class JWTUtils {
    private static final Logger log = LoggerFactory.getLogger(JWTUtils.class);
    private static final int MIN_HMAC_KEY_BYTES = 32;
    private static final String TOKEN_TYPE_CLAIM = "tokenType";
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
        return buildToken(userDetails, null, TokenType.ACCESS, resolveAccessTokenExpirationMs());
    }

    public String generateRefreshToken(HashMap<String, Object> claims, UserDetails userDetails) {
        return buildToken(userDetails, claims, TokenType.REFRESH, refreshTokenExpirationMs);
    }

    public String extractUsername(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    public String extractTokenType(String token) {
        return extractClaims(token, claims -> claims.get(TOKEN_TYPE_CLAIM, String.class));
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
        return isTokenValid(token, userDetails, TokenType.ACCESS);
    }

    public boolean isTokenValid(String token, UserDetails userDetails, TokenType expectedTokenType) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername())
                && expectedTokenType.matches(extractTokenType(token))
                && !isTokenExpired(token);
    }

    public boolean hasTokenType(String token, TokenType expectedTokenType) {
        return expectedTokenType.matches(extractTokenType(token));
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

    private String buildToken(
            UserDetails userDetails,
            Map<String, Object> claims,
            TokenType tokenType,
            long expirationMs
    ) {
        Map<String, Object> tokenClaims = new HashMap<>();
        if (claims != null) {
            tokenClaims.putAll(claims);
        }
        tokenClaims.put(TOKEN_TYPE_CLAIM, tokenType.value());
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(tokenClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expirationMs))
                .signWith(key)
                .compact();
    }

    private long resolveAccessTokenExpirationMs() {
        AdminSettingsService.EffectiveAdminSettings effectiveSettings = adminSettingsService.getEffectiveSettings();
        int sessionTimeoutMinutes = effectiveSettings.sessionTimeoutMinutes();
        if (sessionTimeoutMinutes <= 0) {
            return defaultAccessTokenExpirationMs;
        }
        return sessionTimeoutMinutes * 60_000L;
    }

    public enum TokenType {
        ACCESS("access"),
        REFRESH("refresh");

        private final String value;

        TokenType(String value) {
            this.value = value;
        }

        public String value() {
            return value;
        }

        private boolean matches(String candidate) {
            return value.equals(candidate);
        }
    }
}
