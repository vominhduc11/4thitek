package com.devwonder.backend;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:rate_limit_preflight;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.rate-limit.enabled=true",
        "app.rate-limit.auth-requests=1",
        "app.rate-limit.auth-window-seconds=60",
        "app.rate-limit.webhook-requests=1",
        "app.rate-limit.webhook-window-seconds=60",
        "app.cors.allowed-origin-patterns=http://localhost:*",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=rate.limit.admin@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Rate Limit Admin"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class RateLimitFilterTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void doesNotCountCorsPreflightRequestsAgainstAuthRateLimit() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                        .header("Origin", "http://localhost:4173")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andReturn();

        mockMvc.perform(post("/api/v1/auth/login")
                        .header("Origin", "http://localhost:4173")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "rate.limit.admin@example.com",
                                  "password": "InitPass#123"
                                }
                                """))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
    }

    @Test
    void appliesRateLimitToSepayWebhookEndpoint() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());

        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isTooManyRequests());
    }
}
