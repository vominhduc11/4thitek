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
 * Verifies backward-compatible SePay webhook auth resolution:
 * query param token first, then X-Webhook-Token, then Authorization: Apikey ...
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
    void missingAllTokenSourcesIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid SePay webhook token"));
    }

    @Test
    void correctQueryParamTokenIsAccepted() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay?token=correct-token")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void wrongQueryParamTokenIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay?token=wrong-token")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid SePay webhook token"));
    }

    @Test
    void correctTokenHeaderIsAccepted() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}")
                        .header("X-Webhook-Token", "correct-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
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
    void authorizationApikeyHeaderIsAccepted() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}")
                        .header("Authorization", "Apikey correct-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void wrongAuthorizationApikeyHeaderIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}")
                        .header("Authorization", "Apikey wrong-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid SePay webhook token"));
    }

    @Test
    void queryParamTokenTakesPrecedenceOverWrongHeaderToken() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay?token=correct-token")
                        .contentType(APPLICATION_JSON)
                        .content("{}")
                        .header("X-Webhook-Token", "wrong-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void queryParamTokenTakesPrecedenceOverWrongAuthorizationHeader() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay?token=correct-token")
                        .contentType(APPLICATION_JSON)
                        .content("{}")
                        .header("Authorization", "Apikey wrong-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void headerTokenTakesPrecedenceOverAuthorizationHeader() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}")
                        .header("X-Webhook-Token", "correct-token")
                        .header("Authorization", "Apikey wrong-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void currentSepayIpnAliasesBindThroughController() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "transaction_id": "TX-ALIAS-001",
                                  "gateway": "VPBank",
                                  "transaction_date": "2026-04-11 09:45:00",
                                  "account_number": "123456789",
                                  "transfer_type": "credit",
                                  "amount": 22000,
                                  "payment_code": "SCS-2026-999",
                                  "reference_code": "FT123456789"
                                }
                                """)
                        .header("Authorization", "Apikey correct-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("order_not_found"))
                .andExpect(jsonPath("$.orderCode").value("SCS-2026-999"));
    }
}
