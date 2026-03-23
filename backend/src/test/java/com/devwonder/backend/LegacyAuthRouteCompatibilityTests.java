package com.devwonder.backend;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:legacy_auth_routes;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=legacy.auth.admin@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Legacy Auth Admin"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class LegacyAuthRouteCompatibilityTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void legacyAuthLoginRouteRemainsAvailable() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "legacy.auth.admin@example.com",
                                  "password": "InitPass#123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(cookie().exists("fourthitek_refresh"));
    }
}
