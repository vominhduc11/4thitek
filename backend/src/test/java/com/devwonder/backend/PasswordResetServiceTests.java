package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.PasswordResetToken;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.PasswordResetTokenRepository;
import com.devwonder.backend.service.PasswordResetService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest(properties = {
        "app.mail.enabled=true",
        "app.mail.from=test@4thitek.local",
        "app.password-reset.base-url=https://4thitek.vn/reset-password"
})
class PasswordResetServiceTests {

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    void setUp() {
        passwordResetTokenRepository.deleteAll();
        accountRepository.deleteAll();
        when(javaMailSender.createMimeMessage()).thenReturn(
                new MimeMessage(Session.getInstance(new Properties()))
        );
    }

    @Test
    void requestResetCreatesTokenAndSendsEmail() {
        Account account = new Account();
        account.setUsername("reset-user");
        account.setEmail("reset-user@example.com");
        account.setPassword(passwordEncoder.encode("OldPass#123"));
        accountRepository.save(account);

        String message = passwordResetService.requestReset("reset-user@example.com");

        List<PasswordResetToken> tokens = passwordResetTokenRepository.findAll();
        assertThat(message).contains("password reset link");
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getAccount().getId()).isEqualTo(account.getId());
        verify(javaMailSender, timeout(1_000)).send(any(MimeMessage.class));
    }

    @Test
    void resetPasswordUpdatesPasswordAndInvalidatesToken() {
        Account account = new Account();
        account.setUsername("reset-user-2");
        account.setEmail("reset-user-2@example.com");
        account.setPassword(passwordEncoder.encode("OldPass#123"));
        accountRepository.save(account);

        passwordResetService.requestReset("reset-user-2@example.com");
        PasswordResetToken token = passwordResetTokenRepository.findAll().get(0);

        String message = passwordResetService.resetPassword(token.getToken(), "NewPass#456");
        Account updatedAccount = accountRepository.findById(account.getId()).orElseThrow();

        assertThat(message).isEqualTo("Password reset successful");
        assertThat(passwordEncoder.matches("NewPass#456", updatedAccount.getPassword())).isTrue();
        assertThat(passwordResetTokenRepository.findAll()).isEmpty();
    }

    @Test
    void adminTriggeredStaffResetCreatesFreshTokenAndSendsEmailWithoutPlaintextPassword() throws Exception {
        Admin account = new Admin();
        account.setUsername("staff-reset");
        account.setEmail("staff-reset@example.com");
        account.setDisplayName("Staff Reset");
        account.setPassword(passwordEncoder.encode("OldPass#123"));
        accountRepository.save(account);

        PasswordResetToken previousToken = new PasswordResetToken();
        previousToken.setAccount(account);
        previousToken.setToken("old-token");
        previousToken.setExpiresAt(java.time.Instant.now().plusSeconds(60));
        passwordResetTokenRepository.save(previousToken);

        passwordResetService.sendAdminTriggeredStaffResetLink(account);

        List<PasswordResetToken> tokens = passwordResetTokenRepository.findAll();
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getToken()).isNotEqualTo("old-token");
        verify(javaMailSender, timeout(1_000)).send(any(MimeMessage.class));
    }

    @Test
    void adminTriggeredStaffResetRejectsWhenEmailDeliveryIsUnavailable() {
        Admin account = new Admin();
        account.setUsername("staff-reset-2");
        account.setEmail(null);
        account.setPassword(passwordEncoder.encode("OldPass#123"));

        assertThatThrownBy(() -> passwordResetService.sendAdminTriggeredStaffResetLink(account))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("email");
    }
}
