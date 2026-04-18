package com.devwonder.backend.service;

import com.devwonder.backend.config.BusinessIdentity;
import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.PasswordResetToken;
import com.devwonder.backend.exception.BadRequestException;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.PasswordResetTokenRepository;
import com.devwonder.backend.service.support.AccountValidationSupport;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private static final String GENERIC_REQUEST_MESSAGE =
            "If the email exists in our system, a password reset link has been sent.";

    private final AccountRepository accountRepository;
    private final AdminRepository adminRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final AsyncMailService asyncMailService;

    @Value("${app.password-reset.base-url:}")
    private String resetBaseUrl;

    @Value("${app.admin-password-reset.base-url:}")
    private String adminResetBaseUrl;

    @Value("${app.password-reset.expiration-minutes:30}")
    private long expirationMinutes;

    @Transactional
    public String requestReset(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        if (email == null) {
            throw new BadRequestException("email is required");
        }
        boolean canSendResetEmail = mailService.isEnabled() && StringUtils.hasText(resetBaseUrl);

        accountRepository.findByEmailIgnoreCase(email).ifPresent(account -> {
            passwordResetTokenRepository.deleteByAccountId(account.getId());
            if (!canSendResetEmail) {
                return;
            }

            PasswordResetToken token = new PasswordResetToken();
            token.setAccount(account);
            token.setToken(UUID.randomUUID().toString());
            token.setExpiresAt(Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES));
            PasswordResetToken savedToken = passwordResetTokenRepository.save(token);

            asyncMailService.sendText(
                    account.getEmail(),
                    BusinessIdentity.BRAND_NAME + " password reset",
                    buildResetEmail(savedToken.getToken())
            );
        });

        return GENERIC_REQUEST_MESSAGE;
    }

    @Transactional
    public void sendAdminTriggeredStaffResetLink(Account account) {
        if (account == null) {
            throw new BadRequestException("Staff account is required");
        }
        String email = normalizeEmail(account.getEmail());
        if (email == null) {
            throw new BadRequestException("Staff account must have an email address");
        }
        if (!mailService.isEnabled()) {
            throw new BadRequestException("Email delivery is not configured");
        }
        String adminStaffResetBaseUrl = resolveAdminResetBaseUrl();
        if (!StringUtils.hasText(adminStaffResetBaseUrl)) {
            throw new BadRequestException("Password reset link is not configured");
        }

        PasswordResetToken savedToken = createFreshToken(account);
        asyncMailService.sendText(
                email,
                BusinessIdentity.BRAND_NAME + " password reset",
                buildAdminTriggeredResetEmail(savedToken.getToken(), account, adminStaffResetBaseUrl)
        );
    }

    @Transactional(readOnly = true)
    public String resolveTokenStatus(String rawToken) {
        String token = normalizeToken(rawToken);
        if (token == null) {
            return "invalid";
        }
        PasswordResetToken storedToken = passwordResetTokenRepository.findByToken(token).orElse(null);
        if (storedToken == null) {
            return "invalid";
        }
        return isNotExpired(storedToken) ? "valid" : "expired";
    }

    @Transactional
    public String resetPassword(String rawToken, String rawNewPassword) {
        String token = normalizeToken(rawToken);
        if (token == null) {
            throw new BadRequestException("token is required");
        }

        PasswordResetToken storedToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Reset token is invalid"));

        if (!isNotExpired(storedToken)) {
            passwordResetTokenRepository.delete(storedToken);
            throw new BadRequestException("Reset token has expired");
        }

        String newPassword = normalizePassword(rawNewPassword);
        AccountValidationSupport.assertStrongPassword(newPassword, "newPassword");

        Long accountId = storedToken.getAccount().getId();
        String encodedPassword = passwordEncoder.encode(newPassword);
        Admin adminAccount = adminRepository.findById(accountId).orElse(null);
        if (adminAccount != null) {
            adminAccount.setPassword(encodedPassword);
            adminAccount.setRequirePasswordChange(false);
            adminRepository.saveAndFlush(adminAccount);
        } else {
            Account account = accountRepository.findById(accountId)
                    .orElseThrow(() -> new BadRequestException("Reset token is invalid"));
            account.setPassword(encodedPassword);
            accountRepository.saveAndFlush(account);
        }
        passwordResetTokenRepository.deleteByAccountId(accountId);

        return "Password reset successful";
    }

    private PasswordResetToken createFreshToken(Account account) {
        passwordResetTokenRepository.deleteByAccountId(account.getId());
        PasswordResetToken token = new PasswordResetToken();
        token.setAccount(account);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiresAt(Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES));
        return passwordResetTokenRepository.save(token);
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

                We received a request to reset the password for your %s account.

                Open this link to set a new password:
                %s

                This link expires in %d minutes.

                If you did not request a password reset, you can ignore this email.
                """.formatted(BusinessIdentity.BRAND_NAME, resetLink, expirationMinutes);
    }

    private String buildAdminTriggeredResetEmail(String token, Account account, String baseUrl) {
        String displayName = account instanceof Admin admin && admin.getDisplayName() != null
                ? admin.getDisplayName()
                : account.getEmail();
        String resetLink = UriComponentsBuilder.fromUriString(baseUrl)
                .queryParam("token", token)
                .build(true)
                .toUriString();
        return """
                Xin chao %s,

                Quan tri vien he thong da yeu cau dat lai mat khau cho tai khoan quan tri %s cua ban.

                Mo lien ket duoi day de dat mat khau moi:
                %s

                Lien ket se het han sau %d phut.

                Neu ban khong cho rang yeu cau nay la dung, vui long lien he SUPER_ADMIN cua he thong.
                """.formatted(displayName, BusinessIdentity.BRAND_NAME, resetLink, expirationMinutes);
    }

    /**
     * Issues a one-time setup link and sends a welcome email for a newly created staff account.
     * No temporary password is included in the email; the recipient sets their own password
     * by following the link.
     *
     * If mail sending is disabled or {@code app.password-reset.base-url} is not configured,
     * the call is a no-op and a warning is logged.
     */
    @Transactional
    public void sendStaffOnboardingLink(Account account) {
        if (!mailService.isEnabled() || !StringUtils.hasText(resetBaseUrl)) {
            log.warn("Staff onboarding email not sent for {} — mail is disabled or resetBaseUrl is not configured",
                    account.getEmail());
            return;
        }
        PasswordResetToken savedToken = createFreshToken(account);
        try {
            mailService.sendText(
                    account.getEmail(),
                    BusinessIdentity.BRAND_NAME + " — Kích hoạt tài khoản quản trị",
                    buildOnboardingEmail(savedToken.getToken(), account)
            );
        } catch (RuntimeException ex) {
            log.warn("Could not send onboarding email to new staff account {}", account.getEmail(), ex);
        }
    }

    private String buildOnboardingEmail(String token, Account account) {
        String displayName = account instanceof Admin a && a.getDisplayName() != null
                ? a.getDisplayName() : account.getEmail();
        String setupLink = UriComponentsBuilder.fromUriString(resetBaseUrl)
                .queryParam("token", token)
                .build(true)
                .toUriString();
        return """
                Xin chào %s,

                Tài khoản quản trị hệ thống %s của bạn đã được tạo thành công.

                Để đặt mật khẩu và kích hoạt tài khoản, vui lòng mở liên kết dưới đây:
                %s

                Liên kết sẽ hết hạn sau %d phút.

                Nếu bạn không yêu cầu tạo tài khoản này, vui lòng liên hệ quản trị viên.

                Trân trọng,
                %s
                """.formatted(displayName, BusinessIdentity.BRAND_NAME, setupLink, expirationMinutes, BusinessIdentity.BRAND_NAME);
    }

    private String normalizeEmail(String value) {
        return AccountValidationSupport.normalizeEmail(value);
    }

    private String normalizeToken(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizePassword(String value) {
        return AccountValidationSupport.normalize(value);
    }
}
