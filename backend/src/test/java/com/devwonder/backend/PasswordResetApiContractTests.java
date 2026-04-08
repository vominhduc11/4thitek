package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Account;
import com.devwonder.backend.entity.PasswordResetToken;
import com.devwonder.backend.repository.AccountRepository;
import com.devwonder.backend.repository.PasswordResetTokenRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:password_reset_api_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.password-reset.base-url=https://4thitek.vn/reset-password"
})
@AutoConfigureMockMvc
class PasswordResetApiContractTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordResetTokenRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @Test
    void resetPasswordJourneyUsesGenericRequestAndCanonicalValidationStates() throws Exception {
        Account account = new Account();
        account.setUsername("dealer-reset");
        account.setEmail("dealer-reset@example.com");
        account.setPassword(passwordEncoder.encode("OldPass#123"));
        accountRepository.save(account);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "dealer-reset@example.com"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("If the email exists in our system, a password reset link has been sent."));

        PasswordResetToken token = new PasswordResetToken();
        token.setAccount(account);
        token.setToken("valid-reset-token");
        token.setExpiresAt(Instant.now().plusSeconds(600));
        passwordResetTokenRepository.save(token);
        PasswordResetToken expiredToken = new PasswordResetToken();
        expiredToken.setAccount(account);
        expiredToken.setToken("expired-reset-token");
        expiredToken.setExpiresAt(Instant.now().minusSeconds(60));
        passwordResetTokenRepository.save(expiredToken);

        mockMvc.perform(get("/api/v1/auth/reset-password/validate").param("token", token.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(true))
                .andExpect(jsonPath("$.data.status").value("valid"));

        mockMvc.perform(get("/api/v1/auth/reset-password/validate").param("token", "expired-or-invalid"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(false))
                .andExpect(jsonPath("$.data.status").value("invalid"));

        mockMvc.perform(get("/api/v1/auth/reset-password/validate").param("token", expiredToken.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(false))
                .andExpect(jsonPath("$.data.status").value("expired"));

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s",
                                  "newPassword": "NewPass#456"
                                }
                                """.formatted(expiredToken.getToken())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Reset token has expired"));

        MvcResult resetResult = mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s",
                                  "newPassword": "NewPass#456"
                                }
                                """.formatted(token.getToken())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value("Password reset successful"))
                .andReturn();

        JsonNode payload = objectMapper.readTree(resetResult.getResponse().getContentAsString());
        assertThat(payload.path("success").asBoolean()).isTrue();
        assertThat(passwordResetTokenRepository.findByToken(expiredToken.getToken())).isEmpty();
        assertThat(passwordResetTokenRepository.findAll()).isEmpty();
        assertThat(passwordEncoder.matches(
                "NewPass#456",
                accountRepository.findById(account.getId()).orElseThrow().getPassword()
        )).isTrue();
    }
}
