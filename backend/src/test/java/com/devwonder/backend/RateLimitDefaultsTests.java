package com.devwonder.backend;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:rate_limit_defaults;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.rate-limit.enabled=true",
        "app.rate-limit.auth-requests=0",
        "app.rate-limit.auth-window-seconds=0",
        "app.rate-limit.password-reset-requests=0",
        "app.rate-limit.password-reset-window-seconds=0",
        "app.rate-limit.warranty-lookup-requests=0",
        "app.rate-limit.warranty-lookup-window-seconds=0",
        "app.rate-limit.upload-requests=0",
        "app.rate-limit.upload-window-seconds=0",
        "app.rate-limit.webhook-requests=0",
        "app.rate-limit.webhook-window-seconds=0",
        "app.cors.allowed-origin-patterns=http://localhost:*",
        "app.bootstrap-super-admin.enabled=true",
        "app.bootstrap-super-admin.email=rate.limit.defaults@example.com",
        "app.bootstrap-super-admin.password=InitPass#123",
        "app.bootstrap-super-admin.name=Rate Limit Defaults"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class RateLimitDefaultsTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private com.devwonder.backend.service.AdminSettingsService adminSettingsService;

    @Test
    void fallsBackToSafeDefaultsWhenConfiguredAuthLimitIsNonPositive() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .header("Origin", "http://localhost:4173")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "rate.limit.defaults@example.com",
                                  "password": "InitPass#123"
                                 }
                                 """))
                .andExpect(status().isOk());
    }

    @Test
    void effectiveRateLimitBucketsMatchDocumentedDefaultsWhenEnvValuesAreNonPositive() {
        com.devwonder.backend.service.AdminSettingsService.RateLimitRuntimeSettings settings =
                adminSettingsService.getRateLimitSettings();

        assertThat(settings.enabled()).isTrue();
        assertThat(settings.auth().requests()).isEqualTo(10);
        assertThat(settings.auth().windowSeconds()).isEqualTo(60);
        assertThat(settings.passwordReset().requests()).isEqualTo(5);
        assertThat(settings.passwordReset().windowSeconds()).isEqualTo(300);
        assertThat(settings.warrantyLookup().requests()).isEqualTo(30);
        assertThat(settings.warrantyLookup().windowSeconds()).isEqualTo(60);
        assertThat(settings.upload().requests()).isEqualTo(20);
        assertThat(settings.upload().windowSeconds()).isEqualTo(60);
        assertThat(settings.webhook().requests()).isEqualTo(120);
        assertThat(settings.webhook().windowSeconds()).isEqualTo(60);
    }
}
