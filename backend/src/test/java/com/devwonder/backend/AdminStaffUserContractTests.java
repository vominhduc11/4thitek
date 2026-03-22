package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.repository.AdminRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
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
        "spring.datasource.url=jdbc:h2:mem:admin_staff_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=staff.owner@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=System Owner",
        "app.mail.enabled=true",
        "app.mail.from=ops@4thitek.local",
        "app.mail.from-name=4ThiTek Ops"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AdminStaffUserContractTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JavaMailSender javaMailSender;

    @BeforeEach
    void setUp() {
        Admin owner = adminRepository.findByUsername("staff.owner@example.com").orElseThrow();
        owner.setPassword(passwordEncoder.encode("ChangedPass#456"));
        owner.setRequirePasswordChange(false);
        adminRepository.save(owner);

        when(javaMailSender.createMimeMessage())
                .thenAnswer(ignored -> new MimeMessage(Session.getInstance(new Properties())));
    }

    @Test
    void creatingStaffUserRequiresEmail() throws Exception {
        String accessToken = login("staff.owner@example.com", "ChangedPass#456");

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Support Agent",
                                  "role": "Support"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.email").value("email is required"));
    }

    @Test
    void creatingStaffUserRequiresNameAndRole() throws Exception {
        String accessToken = login("staff.owner@example.com", "ChangedPass#456");

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "staff.ops@example.com",
                                  "name": "   ",
                                  "role": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.name").exists())
                .andExpect(jsonPath("$.data.role").exists());
    }

    @Test
    void creatingStaffUserUsesProvidedEmailAndDeliversCredentialsThere() throws Exception {
        String accessToken = login("staff.owner@example.com", "ChangedPass#456");

        MvcResult result = mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "staff.ops@example.com",
                                  "name": "Support Agent",
                                  "role": "Support"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("staff.ops@example.com"))
                .andExpect(jsonPath("$.data.name").value("Support Agent"))
                .andExpect(jsonPath("$.data.role").value("Support"))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.temporaryPassword").doesNotExist())
                .andReturn();

        JsonNode payload = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
        String username = payload.path("username").asText();

        Admin created = adminRepository.findByUsername(username).orElseThrow();
        assertThat(created.getEmail()).isEqualTo("staff.ops@example.com");
        assertThat(created.getEmail()).doesNotEndWith("@internal.4thitek.local");
        assertThat(created.getUsername()).isEqualTo(username);
        assertThat(created.getRequirePasswordChange()).isTrue();

        ArgumentCaptor<MimeMessage> messageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(javaMailSender).send(messageCaptor.capture());

        MimeMessage message = messageCaptor.getValue();
        assertThat(message.getRecipients(Message.RecipientType.TO)[0].toString()).isEqualTo("staff.ops@example.com");
        assertThat(message.getSubject()).contains("4ThiTek");
        assertThat(message.getContent().toString()).contains(username);
        assertThat(message.getContent().toString()).contains("Mật khẩu tạm thời:");
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
