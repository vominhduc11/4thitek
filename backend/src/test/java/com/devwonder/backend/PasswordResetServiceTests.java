package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.devwonder.backend.entity.Account;
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
        account.setPassword(passwordEncoder.encode("old-password"));
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
        account.setPassword(passwordEncoder.encode("old-password"));
        accountRepository.save(account);

        passwordResetService.requestReset("reset-user-2@example.com");
        PasswordResetToken token = passwordResetTokenRepository.findAll().get(0);

        String message = passwordResetService.resetPassword(token.getToken(), "new-password");
        Account updatedAccount = accountRepository.findById(account.getId()).orElseThrow();

        assertThat(message).isEqualTo("Password reset successful");
        assertThat(passwordEncoder.matches("new-password", updatedAccount.getPassword())).isTrue();
        assertThat(passwordResetTokenRepository.findAll()).isEmpty();
    }
}
