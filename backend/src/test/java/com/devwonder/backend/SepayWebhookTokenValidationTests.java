package com.devwonder.backend;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Verifies that the SePay webhook endpoint enforces token authentication exclusively
 * via the {@code X-Webhook-Token} request header.
 *
 * <p>Query-parameter token delivery is intentionally not supported: tokens sent via
 * {@code ?token=} are silently ignored, so a request carrying only a query-param token
 * is treated as if no token was provided at all and must be rejected with HTTP 401.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:sepay_token_validation;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "sepay.enabled=true",
        "sepay.webhook-token=correct-token",
        "sepay.bank-name=Test Bank",
        "sepay.account-number=0000000000",
        "sepay.account-holder=Test Account Holder"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class SepayWebhookTokenValidationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void missingTokenHeaderIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid SePay webhook token"));
    }

    @Test
    void wrongTokenHeaderIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}")
                        .header("X-Webhook-Token", "wrong-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid SePay webhook token"));
    }

    @Test
    void blankTokenHeaderIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}")
                        .header("X-Webhook-Token", "   "))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid SePay webhook token"));
    }

    @Test
    void correctTokenHeaderIsAccepted() throws Exception {
        // Token is valid — service proceeds past auth and returns a business-level result.
        // The exact status value (e.g. "invalid_amount") is not the focus here; HTTP 200
        // with success=true proves authentication was accepted.
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}")
                        .header("X-Webhook-Token", "correct-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void queryParamTokenAloneIsRejected() throws Exception {
        // A token delivered only via ?token= must NOT grant access.
        // After the fix the controller no longer binds the query parameter,
        // so this request is equivalent to sending no token at all.
        mockMvc.perform(post("/api/v1/webhooks/sepay?token=correct-token")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid SePay webhook token"));
    }

    @Test
    void queryParamTokenDoesNotSupplementMissingHeader() throws Exception {
        // Even if the caller provides the correct token as a query param AND a wrong
        // token in the header, the header value must be used — not the query param.
        mockMvc.perform(post("/api/v1/webhooks/sepay?token=correct-token")
                        .contentType(APPLICATION_JSON)
                        .content("{}")
                        .header("X-Webhook-Token", "wrong-token"))
                .andExpect(status().isUnauthorized());
    }
}
