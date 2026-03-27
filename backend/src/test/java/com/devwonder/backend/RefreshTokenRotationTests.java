package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Admin;
import com.devwonder.backend.repository.AdminRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:refresh_token_rotation;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=rotation.admin@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Rotation Admin"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class RefreshTokenRotationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminRepository adminRepository;

    @BeforeEach
    void setUp() {
        Admin admin = adminRepository.findByUsername("rotation.admin@example.com").orElseThrow();
        admin.setRequirePasswordChange(false);
        adminRepository.save(admin);
    }

    @Test
    void bodyRefreshRotatesRefreshTokenAndRejectsReusedToken() throws Exception {
        String initialRefreshToken = login().path("data").path("refreshToken").asText();

        JsonNode refreshedPayload = refreshWithBody(initialRefreshToken);
        String rotatedRefreshToken = refreshedPayload.path("data").path("refreshToken").asText();

        assertThat(rotatedRefreshToken).isNotBlank();
        assertThat(rotatedRefreshToken).isNotEqualTo(initialRefreshToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "%s"
                                }
                                """.formatted(initialRefreshToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Refresh token is invalid"));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "%s"
                                }
                                """.formatted(rotatedRefreshToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.refreshToken").isString());
    }

    @Test
    void cookieRefreshRotatesRefreshTokenAndRejectsReusedCookie() throws Exception {
        String initialRefreshToken = login().path("data").path("refreshToken").asText();

        JsonNode refreshedPayload = refreshWithCookie(initialRefreshToken);
        String rotatedRefreshToken = refreshedPayload.path("data").path("refreshToken").asText();

        assertThat(rotatedRefreshToken).isNotBlank();
        assertThat(rotatedRefreshToken).isNotEqualTo(initialRefreshToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("fourthitek_refresh", initialRefreshToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Refresh token is invalid"));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("fourthitek_refresh", rotatedRefreshToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.refreshToken").isString());
    }

    @Test
    void logoutWithBodyRevokesRefreshTokenServerSide() throws Exception {
        String refreshToken = login().path("data").path("refreshToken").asText();

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "%s"
                                }
                                """.formatted(refreshToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("logged_out"));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "%s"
                                }
                                """.formatted(refreshToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Refresh token is invalid"));
    }

    @Test
    void logoutWithCookieRevokesRefreshTokenServerSide() throws Exception {
        String refreshToken = login().path("data").path("refreshToken").asText();

        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(new Cookie("fourthitek_refresh", refreshToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("logged_out"));

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("fourthitek_refresh", refreshToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Refresh token is invalid"));
    }

    private JsonNode login() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "rotation.admin@example.com",
                                  "password": "InitPass#123"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(loginResult.getResponse().getContentAsString());
    }

    private JsonNode refreshWithBody(String refreshToken) throws Exception {
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "refreshToken": "%s"
                                }
                                """.formatted(refreshToken)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(refreshResult.getResponse().getContentAsString());
    }

    private JsonNode refreshWithCookie(String refreshToken) throws Exception {
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(new Cookie("fourthitek_refresh", refreshToken)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(refreshResult.getResponse().getContentAsString());
    }
}
