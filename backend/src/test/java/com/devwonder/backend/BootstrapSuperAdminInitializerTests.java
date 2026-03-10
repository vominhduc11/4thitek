package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.repository.AdminRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:bootstrap_super_admin;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=bootstrap.owner@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Bootstrap Owner"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class BootstrapSuperAdminInitializerTests {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void bootstrapsInitialSuperAdminAndForcesPasswordChange() throws Exception {
        Admin admin = adminRepository.findByUsername("bootstrap.owner@example.com").orElseThrow();
        assertThat(admin.getDisplayName()).isEqualTo("Bootstrap Owner");
        assertThat(passwordEncoder.matches("InitPass#123", admin.getPassword())).isTrue();
        assertThat(admin.getRoles()).extracting(role -> role.getName())
                .contains("ADMIN", "SUPER_ADMIN");
        assertThat(admin.getRequireLoginEmailConfirmation()).isTrue();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "bootstrap.owner@example.com",
                                  "password": "InitPass#123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.requirePasswordChange").value(true))
                .andReturn();

        JsonNode loginPayload = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String accessToken = loginPayload.path("data").path("accessToken").asText();

        mockMvc.perform(get("/api/admin/settings")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Password change required before accessing admin resources"));

        mockMvc.perform(patch("/api/admin/password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "currentPassword": "InitPass#123",
                                  "newPassword": "ChangedPass#456"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("updated"));

        mockMvc.perform(get("/api/admin/settings")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        assertThat(adminRepository.findByUsername("bootstrap.owner@example.com").orElseThrow()
                .getRequireLoginEmailConfirmation()).isFalse();
    }
}
