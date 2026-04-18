package com.devwonder.backend.service;

import com.devwonder.backend.config.MediaProperties;
import com.devwonder.backend.exception.BadRequestException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class MediaSignedUrlService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final byte[] secret;

    public MediaSignedUrlService(
            MediaProperties mediaProperties,
            @Value("${jwt.secret:}") String jwtSecret
    ) {
        String configuredSecret = StringUtils.hasText(mediaProperties.getSignedUrlSecret())
                ? mediaProperties.getSignedUrlSecret().trim()
                : null;
        String fallback = StringUtils.hasText(jwtSecret) ? jwtSecret.trim() : null;
        String effectiveSecret = configuredSecret != null ? configuredSecret : fallback;
        if (!StringUtils.hasText(effectiveSecret)) {
            throw new IllegalStateException(
                    "Missing media signed URL secret. Configure app.media.signed-url-secret or jwt.secret."
            );
        }
        this.secret = effectiveSecret.getBytes(StandardCharsets.UTF_8);
    }

    public String sign(long mediaAssetId, long accountId, Instant expiresAt) {
        if (expiresAt == null) {
            throw new BadRequestException("expiresAt is required");
        }
        long expiresAtEpochSeconds = expiresAt.getEpochSecond();
        String payload = mediaAssetId + ":" + accountId + ":" + expiresAtEpochSeconds;
        byte[] signature = computeHmac(payload);
        return base64Url(payload.getBytes(StandardCharsets.UTF_8)) + "." + base64Url(signature);
    }

    public SignedToken verify(String token) {
        if (!StringUtils.hasText(token)) {
            throw new BadRequestException("token is required");
        }
        String[] parts = token.trim().split("\\.");
        if (parts.length != 2) {
            throw new BadRequestException("Invalid media access token");
        }

        byte[] payloadBytes = decodeBase64Url(parts[0]);
        byte[] expectedSignature = computeHmac(new String(payloadBytes, StandardCharsets.UTF_8));
        byte[] providedSignature = decodeBase64Url(parts[1]);
        if (!MessageDigest.isEqual(expectedSignature, providedSignature)) {
            throw new BadRequestException("Invalid media access token");
        }

        String payload = new String(payloadBytes, StandardCharsets.UTF_8);
        String[] payloadParts = payload.split(":");
        if (payloadParts.length != 3) {
            throw new BadRequestException("Invalid media access token");
        }
        long mediaAssetId = parseLong(payloadParts[0]);
        long accountId = parseLong(payloadParts[1]);
        long expiresAtEpochSecond = parseLong(payloadParts[2]);
        Instant expiresAt = Instant.ofEpochSecond(expiresAtEpochSecond);
        if (Instant.now().isAfter(expiresAt)) {
            throw new BadRequestException("Media access token is expired");
        }
        return new SignedToken(mediaAssetId, accountId, expiresAt);
    }

    private long parseLong(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Invalid media access token");
        }
    }

    private byte[] computeHmac(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret, HMAC_ALGORITHM));
            return mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to sign media access token", ex);
        }
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private byte[] decodeBase64Url(String value) {
        try {
            return Base64.getUrlDecoder().decode(value);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid media access token");
        }
    }

    public record SignedToken(long mediaAssetId, long accountId, Instant expiresAt) {
    }
}
