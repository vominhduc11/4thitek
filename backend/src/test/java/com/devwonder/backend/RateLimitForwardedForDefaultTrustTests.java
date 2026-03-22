package com.devwonder.backend;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:rate_limit_forwarded_default;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.rate-limit.enabled=true",
        "app.rate-limit.auth-requests=1",
        "app.rate-limit.auth-window-seconds=60",
        "app.bootstrap-super-admin.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class RateLimitForwardedForDefaultTrustTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void spoofedForwardedForDoesNotBypassDefaultRateLimitKeying() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "203.0.113.10")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "missing@example.com",
                                  "password": "WrongPass#123"
                                }
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "198.51.100.10")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "missing@example.com",
                                  "password": "WrongPass#123"
                                }
                                """))
                .andExpect(status().isTooManyRequests());
    }
}
