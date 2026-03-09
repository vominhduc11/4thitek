package com.devwonder.backend.service;

import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.PasswordResetToken;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.PasswordResetTokenRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final String GENERIC_REQUEST_MESSAGE =
            "If the email exists in our system, a password reset link has been sent.";

    private final AccountRepository accountRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    @Value("${app.password-reset.base-url:}")
    private String resetBaseUrl;

    @Value("${app.password-reset.expiration-minutes:30}")
    private long expirationMinutes;

    @Transactional
    public String requestReset(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        if (email == null) {
            throw new BadRequestException("email is required");
        }
        if (!mailService.isEnabled()) {
            throw new BadRequestException("Email service is not configured");
        }
        if (!StringUtils.hasText(resetBaseUrl)) {
            throw new BadRequestException("Password reset URL is not configured");
        }

        accountRepository.findByEmailIgnoreCase(email).ifPresent(account -> {
            passwordResetTokenRepository.deleteByAccountId(account.getId());

            PasswordResetToken token = new PasswordResetToken();
            token.setAccount(account);
            token.setToken(UUID.randomUUID().toString());
            token.setExpiresAt(Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES));
            PasswordResetToken savedToken = passwordResetTokenRepository.save(token);

            mailService.sendText(
                    account.getEmail(),
                    "4ThiTek password reset",
                    buildResetEmail(savedToken.getToken())
            );
        });

        return GENERIC_REQUEST_MESSAGE;
    }

    @Transactional(readOnly = true)
    public boolean isTokenValid(String rawToken) {
        String token = normalizeToken(rawToken);
        if (token == null) {
            return false;
        }
        return passwordResetTokenRepository.findByToken(token)
                .filter(this::isNotExpired)
                .isPresent();
    }

    @Transactional
    public String resetPassword(String rawToken, String rawNewPassword) {
        String token = normalizeToken(rawToken);
        if (token == null) {
            throw new BadRequestException("token is required");
        }

        PasswordResetToken storedToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Reset token is invalid or expired"));

        if (!isNotExpired(storedToken)) {
            passwordResetTokenRepository.delete(storedToken);
            throw new BadRequestException("Reset token is invalid or expired");
        }

        String newPassword = normalizePassword(rawNewPassword);
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("newPassword must be at least 6 characters");
        }

        Account account = storedToken.getAccount();
        account.setPassword(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
        passwordResetTokenRepository.deleteByAccountId(account.getId());

        return "Password reset successful";
    }

    private boolean isNotExpired(PasswordResetToken token) {
        return token.getExpiresAt() != null && token.getExpiresAt().isAfter(Instant.now());
    }

    private String buildResetEmail(String token) {
        String resetLink = UriComponentsBuilder.fromUriString(resetBaseUrl)
                .queryParam("token", token)
                .build(true)
                .toUriString();

        return """
                Hello,

                We received a request to reset the password for your 4ThiTek account.

                Open this link to set a new password:
                %s

                This link expires in %d minutes.

                If you did not request a password reset, you can ignore this email.
                """.formatted(resetLink, expirationMinutes);
    }

    private String normalizeEmail(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim().toLowerCase();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeToken(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizePassword(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
