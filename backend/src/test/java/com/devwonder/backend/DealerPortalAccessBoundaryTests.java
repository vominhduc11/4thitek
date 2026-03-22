package com.devwonder.backend;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devwonder.backend.entity.Dealer;
import com.devwonder.backend.entity.enums.CustomerStatus;
import com.devwonder.backend.repository.DealerRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dealer_portal_access;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class DealerPortalAccessBoundaryTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DealerRepository dealerRepository;

    @Test
    void underReviewDealerCanLoginButCannotAccessDealerApis() throws Exception {
        registerDealer("Dealer.Access", CustomerStatus.UNDER_REVIEW);

        String accessToken = loginAndExtractAccessToken("DEALER.ACCESS");

        mockMvc.perform(get("/api/v1/dealer/profile")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(containsString("Tài khoản đang chờ duyệt")));
    }

    @Test
    void suspendedDealerCanLoginButCannotAccessDealerApis() throws Exception {
        registerDealer("Dealer.Suspend", CustomerStatus.SUSPENDED);

        String accessToken = loginAndExtractAccessToken("DEALER.SUSPEND");

        mockMvc.perform(get("/api/v1/dealer/profile")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value(containsString("tạm khóa")));
    }

    private void registerDealer(String localPart, CustomerStatus status) throws Exception {
        String username = localPart + "@example.com";
        mockMvc.perform(post("/api/v1/auth/register-dealer")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "DealerPass#123",
                                  "contactName": "Portal Dealer",
                                  "taxCode": "TAX-%s",
                                  "phone": "0%s",
                                  "email": "%s",
                                  "addressLine": "123 Portal Street",
                                  "district": "District 1",
                                  "city": "Ho Chi Minh City",
                                  "country": "Vietnam"
                                }
                                """.formatted(
                                username,
                                localPart.replace(".", "").toUpperCase(),
                                phoneDigitsFor(localPart),
                                username.toUpperCase()
                        )))
                .andExpect(status().isOk());

        Dealer dealer = dealerRepository.findByUsername(username.toLowerCase()).orElseThrow();
        dealer.setCustomerStatus(status);
        dealerRepository.save(dealer);
    }

    private String loginAndExtractAccessToken(String localPart) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s@example.com",
                                  "password": "DealerPass#123"
                                }
                                """.formatted(localPart)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode payload = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return payload.path("data").path("accessToken").asText();
    }

    private String phoneDigitsFor(String seed) {
        int hash = Math.floorMod(seed.hashCode(), 1_000_000_000);
        return "%09d".formatted(hash);
    }
}
