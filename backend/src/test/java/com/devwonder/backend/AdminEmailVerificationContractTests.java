package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.dto.admin.UpdateAdminSettingsRequest;
import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.entity.EmailVerificationToken;
import com.devwonder.backend.entity.Role;
import com.devwonder.backend.entity.enums.StaffUserStatus;
import com.devwonder.backend.repository.AdminRepository;
import com.devwonder.backend.repository.EmailVerificationTokenRepository;
import com.devwonder.backend.repository.RoleRepository;
import com.devwonder.backend.service.AdminSettingsService;
import com.devwonder.backend.service.EmailVerificationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Properties;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:admin_email_verification;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=owner@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=System Owner",
        "app.mail.enabled=true",
        "app.mail.from=ops@4thitek.local",
        "app.mail.from-name=4ThiTek Ops",
        "app.password-reset.base-url=https://admin.4thitek.local/reset",
        "app.email-verification.base-url=https://admin.4thitek.local/verify-email",
        "app.email-verification.expiration-minutes=60"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AdminEmailVerificationContractTests {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("[?&]token=([^\\s&]+)");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AdminSettingsService adminSettingsService;

    @Autowired
    private EmailVerificationService emailVerificationService;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @MockBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    void setUp() {
        Admin owner = adminRepository.findByUsername("owner@example.com").orElseThrow();
        owner.setPassword(passwordEncoder.encode("ChangedPass#456"));
        owner.setRequirePasswordChange(false);
        owner.setEmailVerified(true);
        owner.setEmailVerifiedAt(Instant.now());
        adminRepository.save(owner);
        when(javaMailSender.createMimeMessage())
                .thenAnswer(ignored -> new MimeMessage(Session.getInstance(new Properties())));
    }

    @Test
    void settingsCanToggleEmailConfirmationPolicy() throws Exception {
        String adminToken = login("owner@example.com", "ChangedPass#456");

        mockMvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "emailConfirmation": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.emailConfirmation").value(false));

        mockMvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "emailConfirmation": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.emailConfirmation").value(true));
    }

    @Test
    void loginIsBlockedWhenPolicyEnabledAndAdminHasNoEmail() throws Exception {
        setEmailConfirmation(true);
        createAdmin("admin-no-email", null, false);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin-no-email",
                                  "password": "ChangedPass#456"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value(EmailVerificationService.ADMIN_EMAIL_REQUIRED_CODE))
                .andExpect(jsonPath("$.error").value("Admin email is required before sign in. Please contact your system owner."));
    }

    @Test
    void loginIsBlockedWhenPolicyEnabledAndAdminEmailIsUnverified() throws Exception {
        setEmailConfirmation(true);
        createAdmin("ops.unverified@example.com", "ops.unverified@example.com", false);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "ops.unverified@example.com",
                                  "password": "ChangedPass#456"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value(EmailVerificationService.ADMIN_EMAIL_UNVERIFIED_CODE))
                .andExpect(jsonPath("$.error").value(
                        "Admin email verification is required before sign in. Please check your inbox or request a new verification email."
                ));
    }

    @Test
    void loginSucceedsWhenPolicyEnabledAndAdminEmailIsVerified() throws Exception {
        setEmailConfirmation(true);
        createAdmin("ops.verified@example.com", "ops.verified@example.com", true);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "ops.verified@example.com",
                                  "password": "ChangedPass#456"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.user.username").value("ops.verified@example.com"));
    }

    @Test
    void verifyEmailEndpointMarksAdminAsVerified() throws Exception {
        Admin admin = createAdmin("verify.me@example.com", "verify.me@example.com", false);
        String rawToken = issueVerificationToken(admin);

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s"
                                }
                                """.formatted(rawToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("verified"))
                .andExpect(jsonPath("$.data.message").value("Email verification successful. You can now sign in."));

        Admin updated = adminRepository.findById(admin.getId()).orElseThrow();
        assertThat(updated.getEmailVerified()).isTrue();
        assertThat(updated.getEmailVerifiedAt()).isNotNull();
        EmailVerificationToken storedToken = emailVerificationTokenRepository.findAll().get(0);
        assertThat(storedToken.getUsedAt()).isNotNull();
    }

    @Test
    void verifyEmailRejectsExpiredToken() throws Exception {
        Admin admin = createAdmin("expired.verify@example.com", "expired.verify@example.com", false);
        String rawToken = issueVerificationToken(admin);
        EmailVerificationToken storedToken = emailVerificationTokenRepository.findAll().get(0);
        storedToken.setExpiresAt(Instant.now().minusSeconds(60));
        emailVerificationTokenRepository.save(storedToken);

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s"
                                }
                                """.formatted(rawToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value(EmailVerificationService.TOKEN_EXPIRED_CODE));
    }

    @Test
    void verifyEmailRejectsReusedToken() throws Exception {
        Admin admin = createAdmin("reused.verify@example.com", "reused.verify@example.com", false);
        String rawToken = issueVerificationToken(admin);

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s"
                                }
                                """.formatted(rawToken)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "%s"
                                }
                                """.formatted(rawToken)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value(EmailVerificationService.TOKEN_ALREADY_USED_CODE));
    }

    @Test
    void resendEmailVerificationQueuesNewVerificationMail() throws Exception {
        Admin admin = createAdmin("resend.verify@example.com", "resend.verify@example.com", false);
        clearInvocations(javaMailSender);

        mockMvc.perform(post("/api/v1/auth/resend-email-verification")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "identity": "resend.verify@example.com"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("queued"))
                .andExpect(jsonPath("$.data.message").value(
                        "If an unverified admin account exists for this identity, a verification email has been sent."
                ));

        ArgumentCaptor<MimeMessage> messageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender, timeout(1_000)).send(messageCaptor.capture());
        MimeMessage message = messageCaptor.getValue();
        String body = message.getContent().toString();

        assertThat(message.getRecipients(Message.RecipientType.TO)[0].toString()).isEqualTo(admin.getEmail());
        assertThat(message.getSubject()).contains("Verify");
        assertThat(body).contains("https://admin.4thitek.local/verify-email");
        assertThat(emailVerificationTokenRepository.findAll()).hasSize(1);
    }

    private void setEmailConfirmation(boolean enabled) {
        adminSettingsService.updateSettings(new UpdateAdminSettingsRequest(
                enabled,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        ));
    }

    private Admin createAdmin(String username, String email, boolean verified) {
        Admin admin = new Admin();
        admin.setUsername(username);
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode("ChangedPass#456"));
        admin.setDisplayName("Admin " + username);
        admin.setRoleTitle("Ops");
        admin.setUserStatus(StaffUserStatus.ACTIVE);
        admin.setRequirePasswordChange(false);
        admin.setEmailVerified(verified);
        admin.setEmailVerifiedAt(verified ? Instant.now() : null);
        admin.setRoles(new HashSet<>(List.of(resolveRole("ADMIN", "Admin role"))));
        return adminRepository.save(admin);
    }

    private Role resolveRole(String name, String description) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = new Role();
            role.setName(name);
            role.setDescription(description);
            return roleRepository.save(role);
        });
    }

    private String issueVerificationToken(Admin admin) throws Exception {
        clearInvocations(javaMailSender);
        emailVerificationService.sendVerificationEmail(admin);
        ArgumentCaptor<MimeMessage> messageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender, timeout(1_000)).send(messageCaptor.capture());
        String body = messageCaptor.getValue().getContent().toString();
        java.util.regex.Matcher matcher = TOKEN_PATTERN.matcher(body);
        assertThat(matcher.find()).isTrue();
        return matcher.group(1);
    }

    private String login(String username, String password) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "%s"
                                }
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode payload = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return payload.path("data").path("accessToken").asText();
    }
}
