package com.devwonder.backend;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:sepay_controller;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "sepay.enabled=false"
})
@AutoConfigureMockMvc
class SepayWebhookControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void disabledWebhookReturnsOkInsteadOfBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/sepay")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("disabled"))
                .andExpect(jsonPath("$.message").value("SePay webhook is disabled"));
    }

    @Test
    void queryParamTokenIsNotReadByController() throws Exception {
        // Passing a token as a query parameter must not grant authentication.
        // With sepay.enabled=false the service exits before token validation, so the
        // disabled response proves the controller reached the service at all — which
        // in turn means the query param was silently ignored (not bound, not validated).
        mockMvc.perform(post("/api/v1/webhooks/sepay?token=any-value-here")
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("disabled"));
    }
}
