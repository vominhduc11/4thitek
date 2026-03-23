package com.devwonder.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.PushDeviceToken;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.repository.DealerRepository;
import com.devwonder.backend.repository.PushDeviceTokenRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:push_token_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class PushTokenRegistrationContractTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private PushDeviceTokenRepository pushDeviceTokenRepository;

    @MockBean
    private SimpMessagingTemplate messagingTemplate;

    @Test
    void dealerCanRegisterAndUnregisterPushToken() throws Exception {
        Dealer dealer = registerActiveDealer("push-token");
        String dealerToken = login(dealer.getEmail(), "Dealer#123");

        mockMvc.perform(post("/api/v1/dealer/push-tokens")
                        .header("Authorization", "Bearer " + dealerToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "token": "fcm-token-123",
                                  "platform": "ANDROID",
                                  "deviceName": "Pixel 9",
                                  "appVersion": "1.0.0+136",
                                  "languageCode": "vi"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("registered"));

        PushDeviceToken saved = pushDeviceTokenRepository.findByToken("fcm-token-123").orElseThrow();
        assertThat(saved.getAccount().getId()).isEqualTo(dealer.getId());
        assertThat(saved.getActive()).isTrue();
        assertThat(saved.getPlatform()).isEqualTo("ANDROID");
        assertThat(saved.getDeviceName()).isEqualTo("Pixel 9");
        assertThat(saved.getAppVersion()).isEqualTo("1.0.0+136");
        assertThat(saved.getLanguageCode()).isEqualTo("vi");

        mockMvc.perform(delete("/api/v1/dealer/push-tokens")
                        .header("Authorization", "Bearer " + dealerToken)
                        .queryParam("token", "fcm-token-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("unregistered"));

        PushDeviceToken disabled = pushDeviceTokenRepository.findByToken("fcm-token-123").orElseThrow();
        assertThat(disabled.getActive()).isFalse();
    }

    private Dealer registerActiveDealer(String prefix) throws Exception {
        String username = prefix + "@example.com";
        String email = "mail+" + prefix + "@example.com";

        mockMvc.perform(post("/api/v1/auth/register-dealer")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "Dealer#123",
                                  "businessName": "Dealer %s",
                                  "contactName": "Dealer %s",
                                  "taxCode": "TAX-%s",
                                  "phone": "0901234567",
                                  "email": "%s",
                                  "addressLine": "123 Push Token Street",
                                  "district": "District 1",
                                  "city": "Ho Chi Minh City",
                                  "country": "Vietnam"
                                }
                                """.formatted(username, prefix, prefix, prefix, email)))
                .andExpect(status().isOk());

        Dealer dealer = dealerRepository.findByUsername(username).orElseThrow();
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        return dealerRepository.save(dealer);
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
