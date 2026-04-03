package com.devwonder.backend.service;

import com.devwonder.backend.config.BusinessIdentity;
import com.devwonder.backend.config.EmailVerificationProperties;
import com.devwonder.backend.dto.auth.EmailVerificationResponse;
import com.devwonder.backend.dto.auth.ResendEmailVerificationResponse;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.EmailVerificationToken;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.EmailVerificationTokenRepository;
import com.devwonder.backend.service.support.AccountValidationSupport;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    public static final String ADMIN_EMAIL_REQUIRED_CODE = "ADMIN_EMAIL_REQUIRED";
    public static final String ADMIN_EMAIL_UNVERIFIED_CODE = "ADMIN_EMAIL_UNVERIFIED";
    public static final String TOKEN_INVALID_CODE = "EMAIL_VERIFICATION_TOKEN_INVALID";
    public static final String TOKEN_EXPIRED_CODE = "EMAIL_VERIFICATION_TOKEN_EXPIRED";
    public static final String TOKEN_ALREADY_USED_CODE = "EMAIL_VERIFICATION_TOKEN_ALREADY_USED";

    private static final String RESEND_GENERIC_MESSAGE =
            "If an unverified admin account exists for this identity, a verification email has been sent.";

    private final AccountRepository accountRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final AsyncMailService asyncMailService;
    private final EmailVerificationProperties emailVerificationProperties;

    private final SecureRandom secureRandom = new SecureRandom();

    public boolean isVerificationDeliveryAvailable() {
        return asyncMailService.isEnabled() && StringUtils.hasText(normalize(emailVerificationProperties.baseUrl()));
    }

    public void markAdminEmailVerified(Account account, Instant verifiedAt) {
        if (account == null) {
            return;
        }
        account.setEmailVerified(Boolean.TRUE);
        account.setEmailVerifiedAt(verifiedAt == null ? Instant.now() : verifiedAt);
    }

    public void markAdminEmailUnverified(Account account) {
        if (account == null) {
            return;
        }
        account.setEmailVerified(Boolean.FALSE);
        account.setEmailVerifiedAt(null);
    }

    @Transactional
    public void sendVerificationEmail(Account account) {
        if (!shouldSendVerification(account)) {
            return;
        }
        if (!isVerificationDeliveryAvailable()) {
            log.warn("Admin email verification email not sent for {} because delivery is not configured", account.getEmail());
            return;
        }
        emailVerificationTokenRepository.deleteByExpiresAtBefore(Instant.now());
        emailVerificationTokenRepository.deleteByAccountId(account.getId());
        String rawToken = generateRawToken();
        EmailVerificationToken token = new EmailVerificationToken();
        token.setAccount(account);
        token.setTokenHash(hashToken(rawToken));
        token.setExpiresAt(Instant.now().plus(resolveExpirationMinutes(), ChronoUnit.MINUTES));
        emailVerificationTokenRepository.save(token);
        asyncMailService.sendText(
                account.getEmail(),
                BusinessIdentity.BRAND_NAME + " - Verify your admin email",
                buildVerificationEmail(rawToken, account)
        );
        log.info("Queued admin email verification mail for account {}", account.getId());
    }

    @Transactional
    public ResendEmailVerificationResponse resendVerification(String rawIdentity) {
        String identity = normalizeIdentity(rawIdentity);
        if (identity == null) {
            throw new BadRequestException("identity is required");
        }
        accountRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identity, identity)
                .filter(account -> account instanceof Admin)
                .filter(account -> StringUtils.hasText(account.getEmail()))
                .filter(account -> !Boolean.TRUE.equals(account.getEmailVerified()))
                .ifPresent(account -> {
                    try {
                        sendVerificationEmail(account);
                    } catch (RuntimeException ex) {
                        log.warn("Could not queue admin email verification resend for identity {}", identity, ex);
                    }
                });
        return new ResendEmailVerificationResponse("queued", RESEND_GENERIC_MESSAGE);
    }

    @Transactional
    public EmailVerificationResponse verifyEmail(String rawToken) {
        String token = normalize(rawToken);
        if (token == null) {
            throw new BadRequestException("token is required");
        }
        EmailVerificationToken storedToken = emailVerificationTokenRepository.findByTokenHash(hashToken(token))
                .orElseThrow(() -> new BadRequestException(
                        "Email verification token is invalid",
                        TOKEN_INVALID_CODE
                ));
        if (storedToken.getUsedAt() != null) {
            throw new BadRequestException("Email verification token has already been used", TOKEN_ALREADY_USED_CODE);
        }
        if (storedToken.getExpiresAt() == null || !storedToken.getExpiresAt().isAfter(Instant.now())) {
            emailVerificationTokenRepository.delete(storedToken);
            throw new BadRequestException("Email verification token has expired", TOKEN_EXPIRED_CODE);
        }
        Account account = storedToken.getAccount();
        Instant verifiedAt = Instant.now();
        markAdminEmailVerified(account, verifiedAt);
        storedToken.setUsedAt(verifiedAt);
        accountRepository.save(account);
        emailVerificationTokenRepository.save(storedToken);
        emailVerificationTokenRepository.deleteByAccountIdAndIdNot(account.getId(), storedToken.getId());
        log.info("Verified admin email for account {}", account.getId());
        return new EmailVerificationResponse(
                "verified",
                "Email verification successful. You can now sign in.",
                verifiedAt
        );
    }

    private boolean shouldSendVerification(Account account) {
        return account instanceof Admin
                && account.getId() != null
                && StringUtils.hasText(account.getEmail())
                && !Boolean.TRUE.equals(account.getEmailVerified());
    }

    private String buildVerificationEmail(String rawToken, Account account) {
        String verificationLink = UriComponentsBuilder.fromUriString(normalize(emailVerificationProperties.baseUrl()))
                .queryParam("token", rawToken)
                .build(true)
                .toUriString();
        String displayName = account instanceof Admin admin && StringUtils.hasText(admin.getDisplayName())
                ? admin.getDisplayName().trim()
                : account.getEmail();
        return """
                Hello %s,

                Please verify the email address for your %s admin account by opening the link below:
                %s

                This verification link expires in %d minutes and can be used only once.

                If you did not expect this email, please contact your system owner.
                """.formatted(displayName, BusinessIdentity.BRAND_NAME, verificationLink, resolveExpirationMinutes());
    }

    private long resolveExpirationMinutes() {
        return Math.max(5L, emailVerificationProperties.expirationMinutes());
    }

    private String normalize(String value) {
        return AccountValidationSupport.normalize(value);
    }

    private String normalizeIdentity(String value) {
        String normalized = normalize(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
