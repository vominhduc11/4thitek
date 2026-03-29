package com.devwonder.backend;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
        "spring.datasource.url=jdbc:h2:mem:dealer_profile_avatar_contract;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "app.mail.enabled=false",
        "app.bootstrap-super-admin.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class DealerProfileAvatarUrlContractTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DealerRepository dealerRepository;

    @Test
    void dealerProfileAcceptsInternalUploadAvatarUrl() throws Exception {
        Dealer dealer = registerActiveDealer("avatar.profile@example.com");
        String accessToken = loginAndExtractAccessToken("avatar.profile@example.com");
        String avatarUrl = "/api/v1/upload/avatars/dealers/" + dealer.getId() + "/avatar.png";

        mockMvc.perform(put("/api/v1/dealer/profile")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "avatarUrl": "%s"
                                }
                                """.formatted(avatarUrl)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl").value(avatarUrl));
    }

    @Test
    void registerDealerRejectsNonVietnamPhoneAtControllerBoundary() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register-dealer")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "invalid.phone@example.com",
                                  "password": "DealerPass#123",
                                  "contactName": "Profile Dealer",
                                  "taxCode": "TAX-INVALIDPHONE",
                                  "phone": "+84912345678",
                                  "email": "invalid.phone@example.com",
                                  "addressLine": "123 Profile Street",
                                  "district": "District 1",
                                  "city": "Ho Chi Minh City",
                                  "country": "Vietnam"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.data.phone").value("phone must be a valid 10-digit Vietnam number"));
    }

    private Dealer registerActiveDealer(String username) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register-dealer")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "DealerPass#123",
                                  "contactName": "Profile Dealer",
                                  "taxCode": "TAX-%s",
                                  "phone": "0%s",
                                  "email": "%s",
                                  "addressLine": "123 Profile Street",
                                  "district": "District 1",
                                  "city": "Ho Chi Minh City",
                                  "country": "Vietnam"
                                }
                                """.formatted(
                                username,
                                username.replaceAll("[^A-Za-z0-9]", "").toUpperCase(),
                                phoneDigitsFor(username),
                                username
                        )))
                .andExpect(status().isOk());

        Dealer dealer = dealerRepository.findByUsername(username).orElseThrow();
        dealer.setCustomerStatus(CustomerStatus.ACTIVE);
        return dealerRepository.save(dealer);
    }

    private String loginAndExtractAccessToken(String username) throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "password": "DealerPass#123"
                                }
                                """.formatted(username)))
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
